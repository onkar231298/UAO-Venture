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
const adminWritesMode = process.argv.includes('--admin-writes');
const writesMode = process.argv.includes('--writes') || adminWritesMode;
const appOrigin = process.env.TEST_APP_ORIGIN || 'http://127.0.0.1:5000';
let temporaryCompanyId;
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
       VALUES ($1, $2, $3, $4, 'staff', 'active', true, 'Restore', 'Verification')`,
      [id, email, bcrypt.hashSync(password, 10), writesMode && !adminWritesMode ? 'sales_executive' : 'super_admin'],
    );
    browser = spawn('chromium', [
      '--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--no-first-run',
      `--user-data-dir=${profile}`, '--remote-debugging-port=0', 'about:blank',
    ], { stdio: 'ignore' });
    const portFile = path.join(profile, 'DevToolsActivePort');
    for (let i = 0; i < 60 && !fs.existsSync(portFile); i++) await sleep(200);
    if (!fs.existsSync(portFile)) throw new Error('Chromium did not start');
    const port = Number(fs.readFileSync(portFile, 'utf8').split('\n')[0]);
    const pages = await require('./browser-devtools.cjs').getDevToolsPages(port);
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
    await command('Page.navigate', { url: `${appOrigin}/login` });
    await until("document.readyState === 'complete'", 'login page');
    const login = await evaluate(`fetch('/admin/login', {
      method: 'POST', credentials: 'include',
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: new URLSearchParams({email: ${JSON.stringify(email)}, password: ${JSON.stringify(password)}})
    }).then(r => ({ok:r.ok, redirected:r.redirected, url:r.url}))`);
    if (!login.ok || !login.url.endsWith(writesMode && !adminWritesMode ? '/sales' : '/admin')) throw new Error('Temporary staff login failed');
    if (writesMode) {
      await evaluate("import('/src/lib/queryClient.ts').then(module => { window.testApiRequest=module.apiRequest; return true; })");
      const seed = {
        companyName: `Company write verification ${id}`, assignedTo: id,
        gstNumber: `TEST-${id}`, industryType: 'food', companySize: 'small',
        addressStreet: 'Test Street', addressState: 'Test State', addressZip: '12345',
      };
      const created = await evaluate(`window.testApiRequest('/api/crm/companies', {method:'POST',body:JSON.stringify(${JSON.stringify(seed)})}).then(r=>r.json())`);
      temporaryCompanyId = created.id;
      if (!temporaryCompanyId) throw new Error('Create company did not return an ID');
      if (adminWritesMode) {
        await command('Page.navigate', { url: `${appOrigin}/admin/dashboard/crm/companies` });
        await until("Boolean(document.querySelector('[placeholder^=\"Search companies\"]'))", 'admin company search');
        await evaluate(`(() => {const input=document.querySelector('[placeholder^="Search companies"]');
          Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,${JSON.stringify(seed.companyName)});
          input.dispatchEvent(new Event('input',{bubbles:true}));return true;})()`);
        await until(`Boolean(document.querySelector('[data-testid="button-view-company-${created.id}"]'))`, 'admin company row');
        await evaluate(`document.querySelector('[data-testid="button-view-company-${created.id}"]').click()`);
        await until("Boolean(document.querySelector('[data-testid=\"button-edit-company\"]'))", 'admin edit control');
        await evaluate("document.querySelector('[data-testid=\"button-edit-company\"]').click()");
        await until("Boolean(document.querySelector('[data-testid=\"input-edit-company-name\"]'))", 'admin edit form');
        await evaluate(`(() => {const set=(selector,value)=>{const input=document.querySelector(selector);
          Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,value);
          input.dispatchEvent(new Event('input',{bubbles:true}));};
          set('[data-testid="input-edit-company-name"]',${JSON.stringify(seed.companyName + ' edited')});
          set('[data-testid="input-edit-email"]','verification@example.invalid');
          set('[data-testid="input-edit-phone"]','9876543210');
          document.querySelector('[data-testid="button-submit-edit"]').click();return true;})()`);
        await until("!document.querySelector('[data-testid=\"input-edit-company-name\"]')", 'admin company save');
        const saved = (await db.query('SELECT company_name, primary_email, primary_phone, gst_number FROM companies WHERE id=$1',[created.id])).rows[0];
        if (saved.company_name !== seed.companyName + ' edited' || saved.primary_email !== 'verification@example.invalid' ||
            saved.primary_phone !== '9876543210' || saved.gst_number !== seed.gstNumber) throw new Error('Admin company save persistence failed');
        console.log(JSON.stringify({companyEditAdminUI:'passed',emailAndPhonePersisted:true,existingCompanyFieldsPreserved:true}));
        await evaluate("fetch('/api/logout',{credentials:'include'}).then(r=>r.status)");
        return;
      }
      for (const legacy of [true, false]) {
        const fields = { contactName: legacy ? 'Legacy contact' : 'Options contact', email: '', isPrimary: false, phone: '1234567890', whatsapp: '1234567891' };
        const expression = legacy
          ? `window.testApiRequest('POST','/api/crm/companies/${created.id}/contacts',${JSON.stringify(fields)})`
          : `window.testApiRequest('/api/crm/companies/${created.id}/contacts',{method:'POST',body:JSON.stringify(${JSON.stringify(fields)})})`;
        const contact = await evaluate(`${expression}.then(r=>r.json())`);
        if (contact.companyId !== created.id) throw new Error('Contact was not saved to the correct company');
        const patch = { designation: 'Edited successfully' };
        await evaluate(`${legacy
          ? `window.testApiRequest('PATCH','/api/crm/contacts/${contact.id}',${JSON.stringify(patch)})`
          : `window.testApiRequest('/api/crm/contacts/${contact.id}',{method:'PATCH',body:JSON.stringify(${JSON.stringify(patch)})})`
        }.then(r=>r.json())`);
      }
      await command('Page.navigate', { url: `${appOrigin}/sales/my-companies` });
      await until(`Boolean(document.querySelector('[data-testid="row-company-${created.id}"]'))`, 'Sales company row');
      await evaluate(`document.querySelector('[data-testid="row-company-${created.id}"]').click()`);
      await until("Boolean([...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Edit Company'))", 'Sales company details');
      await evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Edit Company').click()");
      await until("Boolean(document.querySelector('input[name=\"companyName\"]'))", 'Sales edit form');
      const before = await evaluate("Object.fromEntries(['gstNumber','industryType','companySize','addressStreet','addressState','addressZip'].map(name=>[name,document.querySelector(`[name=\"${name}\"]`)?.value]))");
      for (const key of Object.keys(before)) {
        if (before[key] !== seed[key]) throw new Error(`Sales edit form lost existing ${key}`);
      }
      await evaluate(`(() => {const input=document.querySelector('input[name="companyName"]');
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'Edited company verification');
        input.dispatchEvent(new Event('input',{bubbles:true}));
        input.closest('form').requestSubmit(); return true;})()`);
      await until("!document.querySelector('input[name=\"companyName\"]')", 'Sales save to complete');
      const saved = (await db.query('SELECT company_name,gst_number,address_street,address_state,address_zip FROM companies WHERE id=$1', [created.id])).rows[0];
      if (saved.company_name !== 'Edited company verification' || saved.gst_number !== seed.gstNumber ||
          saved.address_street !== seed.addressStreet || saved.address_state !== seed.addressState || saved.address_zip !== seed.addressZip) {
        throw new Error('Saved Sales company does not match edit form');
      }
      // Let the edit dialog finish restoring focus before selecting another tab.
      await sleep(450);
      const contactTabPoint = await evaluate("(() => {const tab=[...document.querySelectorAll('[role=\"tab\"]')].find(b=>b.textContent.trim()==='Contacts');tab.scrollIntoView({block:'center'});const r=tab.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()");
      await command('Input.dispatchMouseEvent', {type:'mousePressed',button:'left',clickCount:1,...contactTabPoint});
      await command('Input.dispatchMouseEvent', {type:'mouseReleased',button:'left',clickCount:1,...contactTabPoint});
      await until("Boolean(document.querySelector('[data-testid=\"button-add-contact\"]'))", 'Sales contacts tab');
      await evaluate("document.querySelector('[data-testid=\"button-add-contact\"]').click()");
      await until("Boolean(document.querySelector('[data-testid=\"input-contact-name\"]'))", 'Sales new contact dialog');
      await evaluate(`(() => {const input=document.querySelector('[data-testid="input-contact-name"]');
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'Contact saved from Sales UI');
        input.dispatchEvent(new Event('input',{bubbles:true})); document.querySelector('[data-testid="button-save-contact"]').click();return true;})()`);
      await until("!document.querySelector('[data-testid=\"input-contact-name\"]')", 'Sales contact save');
      const contactRows = (await db.query('SELECT contact_name,designation,email,is_primary FROM company_contacts WHERE company_id=$1 ORDER BY id', [created.id])).rows;
      if (contactRows.length !== 3 || !contactRows.some(c=>c.contact_name === 'Contact saved from Sales UI') ||
          contactRows.slice(0,2).some(c=>c.designation !== 'Edited successfully')) throw new Error('Contact create or edit persistence check failed');
      await command('Page.navigate', { url: `${appOrigin}/sales/my-companies?search=Legacy%20contact` });
      await until(`Boolean(document.querySelector('[data-testid="row-company-${created.id}"]'))`, 'company found by separate contact name');
      console.log(JSON.stringify({companyCreate:'passed',companyEditSalesUI:'passed',existingCompanyFieldsPreserved:true,
        contactCreateBothSignatures:'passed',contactEditBothSignatures:'passed',contactCreateSalesUI:'passed',persistedContacts:3,contactNameSearch:'passed'}));
      await evaluate("fetch('/api/logout',{credentials:'include'}).then(r=>r.status)");
      return;
    }
    await command('Page.navigate', { url: `${appOrigin}/admin/dashboard/crm/companies` });
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
    for (const target of targets) {
      await evaluate(`(() => {const select=document.querySelector('[data-testid="select-preview-company"]');
        select.value='${target.company_id}';select.dispatchEvent(new Event('change',{bubbles:true}));return true;})()`);
      await until(`document.querySelector('[data-testid="company-context-desk"]')?.dataset.companyId==='${target.company_id}'
        && document.querySelectorAll('[data-testid^="context-contact-"]').length===${target.total}`,
        'dropdown switches company and contacts without full dialog', 35);
    }
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
      await evaluate(`document.querySelector('[data-testid="button-preview-company-${target.company_id}"]').click()`);
      await until(`document.querySelector('[data-testid="company-context-desk"]')?.dataset.companyId==='${target.company_id}'`,
        'preview desk company ownership', 35);
      if (await evaluate("!!document.querySelector('[data-testid=\"tab-contacts\"]')")) throw new Error('Preview unexpectedly opened full details');
      const clicked = await evaluate(`(() => { const b=document.querySelector('[data-testid="button-view-company-${target.company_id}"]'); if (!b) return false; b.click(); return true; })()`);
      if (!clicked) throw new Error(`Company ${target.company_id} view control missing`);
      await until("Boolean(document.querySelector('[data-testid=\"tab-contacts\"]'))", 'company details dialog');
      await evaluate("(() => {const tab=document.querySelector('[data-testid=\"tab-contacts\"]');tab.focus();tab.click();return true;})()");
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
      await until(`document.querySelectorAll('[data-testid^="context-contact-"]').length === ${target.total}`,
        'company desk contact count', 35);
      const expectedIds = (await db.query('SELECT id FROM company_contacts WHERE company_id=$1', [target.company_id])).rows.map(row => row.id);
      const deskIds = await evaluate("[...document.querySelectorAll('[data-testid^=\"context-contact-\"]')].map(row=>Number(row.dataset.testid.replace('context-contact-',''))).sort((a,b)=>a-b)");
      if (JSON.stringify(deskIds) !== JSON.stringify(expectedIds.sort((a,b)=>a-b))) {
        throw new Error(`Company ${target.company_id}: side desk contact ownership mismatch`);
      }
      opened.push({ companyId: target.company_id, visibleContacts: target.total, deskContactsAndOwnership: true });
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
      if (temporaryCompanyId) await db.query('DELETE FROM companies WHERE id=$1 AND assigned_to=$2', [temporaryCompanyId, id]);
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