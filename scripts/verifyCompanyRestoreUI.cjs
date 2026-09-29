// Temporary authenticated browser check. Creates and removes only its own test account.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const WebSocket = require('ws');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const id = 'restore_ui_check_' + crypto.randomBytes(7).toString('hex');
const email = `${id}@example.invalid`;
const password = crypto.randomBytes(24).toString('hex');
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'restore-ui-'));
const db = new Client({ connectionString: process.env.DATABASE_URL });
let browser, socket, counter = 0;
const pending = new Map();
async function command(method, params = {}) {
  const messageId = ++counter;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(messageId);
      reject(new Error(`Browser command timed out: ${method}`));
    }, 12000);
    pending.set(messageId, {
      resolve: result => { clearTimeout(timer); resolve(result); },
      reject: error => { clearTimeout(timer); reject(error); },
    });
    socket.send(JSON.stringify({ id: messageId, method, params }));
  });
}
async function evaluate(expression) {
  const output = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (output.exceptionDetails) throw new Error(output.exceptionDetails.text);
  return output.result.result.value;
}
async function until(expression, description, attempts = 40) {
  for (let i = 0; i < attempts; i++) {
    const result = await evaluate(expression);
    if (result) return result;
    await sleep(450);
  }
  throw new Error(`Timed out waiting for ${description}`);
}
async function main() {
  await db.connect();
  try {
    await db.query(
      `INSERT INTO users (id, email, password, role, user_type, account_status, is_active, first_name, last_name)
       VALUES ($1, $2, $3, 'super_admin', 'staff', 'active', true, 'Restore', 'Verification')`,
      [id, email, bcrypt.hashSync(password, 10)],
    );
    browser = spawn('chromium', [
      '--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--no-first-run',
      `--user-data-dir=${profile}`, '--remote-debugging-port=0', 'about:blank',
    ], { stdio: 'ignore' });
    const portFile = path.join(profile, 'DevToolsActivePort');
    for (let i = 0; i < 60 && !fs.existsSync(portFile); i++) await sleep(200);
    if (!fs.existsSync(portFile)) throw new Error('Chromium did not start');
    const port = Number(fs.readFileSync(portFile, 'utf8').split('\n')[0]);
    const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
    const page = pages.find(p => p.type === 'page');
    socket = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { socket.once('open', resolve); socket.once('error', reject); });
    socket.on('message', bytes => {
      const message = JSON.parse(bytes.toString());
      if (!message.id || !pending.has(message.id)) return;
      const item = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) item.reject(new Error(message.error.message));
      else item.resolve(message);
    });
    await command('Page.enable');
    await command('Page.navigate', { url: 'http://127.0.0.1:5000/login' });
    await until("document.readyState === 'complete'", 'login page');
    const login = await evaluate(`fetch('/admin/login', {
      method: 'POST', credentials: 'include',
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: new URLSearchParams({email: ${JSON.stringify(email)}, password: ${JSON.stringify(password)}})
    }).then(r => ({ok:r.ok, redirected:r.redirected, url:r.url}))`);
    if (!login.ok || !login.url.endsWith('/admin')) throw new Error('Temporary staff login failed');
    await command('Page.navigate', { url: 'http://127.0.0.1:5000/admin/dashboard/crm/companies' });
    await sleep(3500);
    const state = await evaluate("({path:location.pathname,buttons:document.querySelectorAll('[data-testid^=\"button-view-company-\"]').length,hasSearch:!!document.querySelector('[placeholder^=\"Search companies\"]'),hasLogin:!!document.querySelector('input[type=\"password\"]')})");
    console.log('Browser company page state:', JSON.stringify(state));
    if (!state.hasSearch) throw new Error('Company search UI was not rendered');
    const targets = (await db.query(`
      SELECT p.id AS company_id, p.company_name, count(*)::int AS total
      FROM companies p JOIN company_contacts c ON c.company_id=p.id
      WHERE coalesce(p.is_irrelevant,false)=false
      GROUP BY p.id ORDER BY count(*) DESC, p.id LIMIT 3
    `)).rows;
    if (targets.length !== 3) throw new Error('Fewer than three multi-contact companies in database');
    const opened = [];
    for (const target of targets) {
      await evaluate(`(() => {
        const input=document.querySelector('[placeholder^="Search companies"]');
        const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;
        setter.call(input, ${JSON.stringify(target.company_name)});
        input.dispatchEvent(new Event('input',{bubbles:true}));
        return true;
      })()`);
      await until(
        `Boolean(document.querySelector('[data-testid="button-view-company-${target.company_id}"]'))`,
        `search result for company ${target.company_id}`, 35,
      );
      const clicked = await evaluate(`(() => { const b=document.querySelector('[data-testid="button-view-company-${target.company_id}"]'); if (!b) return false; b.click(); return true; })()`);
      if (!clicked) throw new Error(`Company ${target.company_id} view control missing`);
      await until("Boolean(document.querySelector('[data-testid=\"tab-contacts\"]'))", 'company details dialog');
      await evaluate("document.querySelector('[data-testid=\"tab-contacts\"]').click()");
      const names = (await db.query(
        'SELECT contact_name FROM company_contacts WHERE company_id=$1 ORDER BY id',
        [target.company_id],
      )).rows.map(row => row.contact_name);
      const shown = await until(`(() => { const tab=document.querySelector('[data-testid="tab-contacts"]');
        const panel=document.querySelector('[role="tabpanel"][data-state="active"]');
        return tab?.textContent?.includes('(${target.total})') && panel &&
          ${JSON.stringify(names)}.every(name => panel.textContent.includes(name)) ? true : false; })()`,
      `visible contact names for company ${target.company_id}`, 35);
      if (!shown) throw new Error(`Contact names not rendered for company ${target.company_id}`);
      opened.push({ companyId: target.company_id, visibleContacts: target.total });
      await command('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
      await command('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
      await until("!document.querySelector('[data-testid=\"tab-contacts\"]')", 'company dialog to close');
    }
    const exported = await evaluate(`fetch('/api/crm/companies/export', {credentials:'include'})
      .then(async r=>({status:r.status, type:r.headers.get('content-type'), bytes:(await r.arrayBuffer()).byteLength}))`);
    if (exported.status !== 200 || !exported.type.includes('spreadsheetml.sheet') || exported.bytes < 1000) {
      throw new Error(`Company export failed: ${JSON.stringify(exported)}`);
    }
    console.log(JSON.stringify({ browser: 'Chromium', opened, export: exported }));
    await evaluate("fetch('/api/logout', {credentials:'include'}).then(r=>r.status)");
  } finally {
    if (socket) socket.close();
    if (browser) browser.kill('SIGKILL');
    try {
      await db.query('DELETE FROM activity_heartbeats WHERE user_id=$1', [id]);
      await db.query('DELETE FROM daily_performance_summary WHERE user_id=$1', [id]);
      await db.query('DELETE FROM notifications WHERE user_id=$1', [id]);
      await db.query('DELETE FROM user_access_events WHERE user_id=$1', [id]);
      await db.query('DELETE FROM user_login_logs WHERE user_id=$1', [id]);
      await db.query('DELETE FROM users WHERE id=$1', [id]);
    } finally {
      await db.end();
      for (let attempt = 0; attempt < 4; attempt++) {
        try { fs.rmSync(profile, { recursive: true, force: true }); break; }
        catch (error) { if (attempt === 3) console.error('Temporary browser profile cleanup:', error.message); await sleep(400); }
      }
    }
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });