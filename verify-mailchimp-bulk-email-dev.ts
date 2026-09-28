/**
 * Opt-in development verification for the simplified automatic Mailchimp bulk
 * email UI. Run only after the main agent reports the application is ready:
 *   NODE_ENV=development BASE_URL=http://127.0.0.1:5000 npx tsx verify-mailchimp-bulk-email-dev.ts
 *
 * Only temporary users and companies are inserted. The UI send request is
 * intercepted by CDP Fetch before network dispatch and receives a synthetic
 * response. This script never calls a provider-writing route or performs a send.
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { Pool, neonConfig } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import WebSocket from "ws";

if (process.env.NODE_ENV !== "development") throw new Error("Refusing to run unless NODE_ENV=development.");
const baseUrl = (process.env.BASE_URL || "").replace(/\/$/, "");
const localUrl = /^http:\/\/(127\.0\.0\.1|localhost)(?::\d+)?$/.test(baseUrl);
const replitUrl = !!process.env.REPLIT_DEV_DOMAIN && baseUrl === `https://${process.env.REPLIT_DEV_DOMAIN}`;
if (!localUrl && !replitUrl) throw new Error("BASE_URL must be localhost or exactly https://REPLIT_DEV_DOMAIN.");
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");

neonConfig.webSocketConstructor = WebSocket;
const db = new Pool({ connectionString: process.env.DATABASE_URL });
const runId = `e2e_mailchimp_${randomUUID().replaceAll("-", "")}`;
const password = randomUUID();
const fixedAddress = "sales@bright-organic.com";
const ids = {
  admin: `${runId}_admin`,
  salesA: `${runId}_sales_a`,
  salesB: `${runId}_sales_b`,
  inactive: `${runId}_inactive`,
};
const emails = Object.fromEntries(
  Object.entries(ids).map(([key, id]) => [key, `${id}@example.test`]),
) as Record<keyof typeof ids, string>;
const screenshotDir = ".local/test-output/mailchimp-bulk-email-e2e";
let browser: ReturnType<typeof spawn> | undefined;
let profileDir = "";

function assertStatus(response: Response, expected: number, context: string) {
  assert.equal(response.status, expected, `${context}: expected HTTP ${expected}, received ${response.status}`);
}

async function cleanup(userIds = Object.values(ids)) {
  if (!userIds.length) return;
  await db.query("DELETE FROM email_campaign_recipients WHERE permission_confirmed_by = ANY($1)", [userIds]);
  await db.query("DELETE FROM email_campaigns WHERE created_by = ANY($1)", [userIds]);
  await db.query("DELETE FROM bulk_email_user_configs WHERE user_id = ANY($1)", [userIds]);
  await db.query("DELETE FROM user_email_configs WHERE user_id = ANY($1)", [userIds]);
  await db.query("DELETE FROM company_contacts WHERE company_id IN (SELECT id FROM companies WHERE created_by = ANY($1))", [userIds]);
  await db.query("DELETE FROM companies WHERE created_by = ANY($1)", [userIds]);
  await db.query("DELETE FROM activity_heartbeats WHERE user_id = ANY($1)", [userIds]);
  await db.query("DELETE FROM daily_performance_summary WHERE user_id = ANY($1)", [userIds]);
  await db.query("DELETE FROM user_security_alerts WHERE user_id = ANY($1)", [userIds]);
  await db.query("DELETE FROM user_access_events WHERE user_id = ANY($1)", [userIds]);
  await db.query("DELETE FROM user_login_logs WHERE user_id = ANY($1)", [userIds]);
  await db.query("DELETE FROM users WHERE id = ANY($1) AND user_type = 'staff'", [userIds]);
}

async function seed() {
  const stale = await db.query("SELECT id FROM users WHERE id LIKE 'e2e\\_mailchimp\\_%' ESCAPE '\\'");
  await cleanup(stale.rows.map(row => row.id));
  await cleanup();
  const hash = await bcrypt.hash(password, 10);
  const rows = [
    [ids.admin, emails.admin, "Admin", "Verifier", "admin", "admin"],
    [ids.salesA, emails.salesA, "Sales", "Alpha", "sales_executive", "sales"],
    [ids.salesB, emails.salesB, "Sales", "Bravo", "sales_executive", "sales"],
    [ids.inactive, emails.inactive, "Inactive", "Verifier", "sales_executive", "sales"],
  ];
  for (const [id, email, firstName, lastName, role, department] of rows) {
    await db.query(
      `INSERT INTO users (id, email, first_name, last_name, password, role, user_type, department, account_status, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, 'staff', $7, 'active', true)`,
      [id, email, firstName, lastName, hash, role, department],
    );
  }
  const companyA = await db.query(
    `INSERT INTO companies (company_name, primary_email, status, assigned_to, created_by, created_from)
     VALUES ($1, $2, 'active', $3, $3, 'manual') RETURNING id`,
    [`${runId} Company A`, `${runId}.a@example.test`, ids.salesA],
  );
  const companyB = await db.query(
    `INSERT INTO companies (company_name, primary_email, status, assigned_to, created_by, created_from)
     VALUES ($1, $2, 'active', $3, $3, 'manual') RETURNING id`,
    [`${runId} Company B`, `${runId}.b@example.test`, ids.salesB],
  );
  return { companyA: companyA.rows[0].id as number, companyB: companyB.rows[0].id as number };
}

async function login(email: string) {
  const response = await fetch(`${baseUrl}/admin/login`, {
    method: "POST",
    body: new URLSearchParams({ email, password }),
    redirect: "manual",
    headers: { "content-type": "application/x-www-form-urlencoded" },
  });
  assertStatus(response, 302, "staff login");
  const cookie = response.headers.getSetCookie?.()[0] || response.headers.get("set-cookie");
  assert.ok(cookie, "staff login did not create a session cookie");
  return cookie.split(";")[0];
}

function request(cookie: string, path: string, init?: RequestInit) {
  return fetch(`${baseUrl}${path}`, { ...init, headers: { ...init?.headers, cookie } });
}

class Cdp {
  private socket: WebSocket;
  private nextId = 0;
  private pending = new Map<number, { resolve: (value: any) => void; reject: (reason: Error) => void }>();
  private events = new Map<string, any[]>();
  constructor(url: string) {
    this.socket = new WebSocket(url);
    this.socket.on("message", message => {
      const data = JSON.parse(String(message));
      if (data.id) {
        const pending = this.pending.get(data.id);
        this.pending.delete(data.id);
        data.error ? pending?.reject(new Error(data.error.message)) : pending?.resolve(data.result);
      } else if (data.method) {
        this.events.set(data.method, [...(this.events.get(data.method) || []), data.params]);
      }
    });
  }
  open() {
    return new Promise<void>((resolve, reject) => {
      this.socket.once("open", resolve);
      this.socket.once("error", reject);
    });
  }
  send(method: string, params: Record<string, unknown> = {}) {
    const id = ++this.nextId;
    this.socket.send(JSON.stringify({ id, method, params }));
    return new Promise<any>((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }
  async evaluate(expression: string) {
    const result = await this.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || "CDP evaluation failed");
    return result.result.value;
  }
  async waitFor(expression: string, timeoutMs = 15_000) {
    const until = Date.now() + timeoutMs;
    while (Date.now() < until) {
      try {
        if (await this.evaluate(expression)) return;
      } catch {
        // Navigation can briefly replace the execution context.
      }
      await delay(100);
    }
    throw new Error(`Timed out waiting for UI condition: ${expression}`);
  }
  async waitForEvent(method: string, predicate: (params: any) => boolean, timeoutMs = 15_000) {
    const until = Date.now() + timeoutMs;
    while (Date.now() < until) {
      const queue = this.events.get(method) || [];
      const index = queue.findIndex(predicate);
      if (index >= 0) return queue.splice(index, 1)[0];
      await delay(50);
    }
    throw new Error(`Timed out waiting for CDP event: ${method}`);
  }
  close() { this.socket.close(); }
}

async function openBrowser() {
  const chromium = process.env.CHROMIUM_PATH || "/repl/tools/bin/chromium";
  if (!existsSync(chromium)) throw new Error("Chromium was not found at the configured path.");
  profileDir = `/tmp/${runId}-chromium`;
  browser = spawn(chromium, [
    "--headless=new", "--no-first-run", "--no-default-browser-check",
    "--remote-debugging-port=0", `--user-data-dir=${profileDir}`, `${baseUrl}/login`,
  ], { stdio: "ignore" });
  const portFile = `${profileDir}/DevToolsActivePort`;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (existsSync(portFile)) {
      const [port] = (await readFile(portFile, "utf8")).split("\n");
      const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json() as Array<{ type: string; webSocketDebuggerUrl: string }>;
      const page = pages.find(entry => entry.type === "page");
      if (page) {
        const cdp = new Cdp(page.webSocketDebuggerUrl);
        await cdp.open();
        await cdp.send("Page.enable");
        await cdp.send("Runtime.enable");
        await cdp.send("Network.enable");
        await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
        await cdp.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
        return cdp;
      }
    }
    await delay(100);
  }
  throw new Error("Chromium did not expose a CDP page.");
}

async function setBrowserSession(cdp: Cdp, cookie: string) {
  const separator = cookie.indexOf("=");
  assert.ok(separator > 0, "invalid session cookie");
  await cdp.send("Network.clearBrowserCookies");
  const result = await cdp.send("Network.setCookie", {
    name: cookie.slice(0, separator), value: cookie.slice(separator + 1),
    url: baseUrl, httpOnly: true, secure: baseUrl.startsWith("https:"), sameSite: "Lax",
  });
  assert.equal(result.success, true, "CDP did not accept the session cookie");
  await cdp.send("Page.navigate", { url: `${baseUrl}/` });
  await cdp.waitFor("fetch('/api/auth/user').then(response => response.ok)");
}

async function screenshot(cdp: Cdp, name: string) {
  await mkdir(screenshotDir, { recursive: true });
  const image = await cdp.send("Page.captureScreenshot", { format: "png" });
  await writeFile(`${screenshotDir}/${name}.png`, Buffer.from(image.data, "base64"));
}

function pausedRequestIs(params: any, method: string, path: string) {
  return params.request.method === method && params.request.url.split("?")[0] === `${baseUrl}${path}`;
}

async function assertSimplifiedDialog(cdp: Cdp, path: string, cookie: string, screenshotName: string) {
  await setBrowserSession(cdp, cookie);
  await cdp.send("Fetch.enable", {
    patterns: [
      { urlPattern: `${baseUrl}/api/email-campaigns/readiness`, requestStage: "Request" },
      { urlPattern: `${baseUrl}/api/email-campaigns`, requestStage: "Request" },
    ],
  });
  await cdp.send("Page.navigate", { url: `${baseUrl}${path}` });
  if (path.includes("/admin/")) {
    await cdp.waitFor(`[...document.querySelectorAll('tr')].some(row => row.innerText.includes(${JSON.stringify(runId)}))`);
    await cdp.evaluate(`(() => {
      const row = [...document.querySelectorAll('tr')].find(x => x.innerText.includes(${JSON.stringify(`${runId} Company A`)}));
      const control = row?.querySelector('button[role=checkbox], input[type=checkbox], [role=checkbox]');
      if (!control) throw new Error('temporary admin company selection control was not found');
      control.click();
    })()`);
  }
  try {
    await cdp.waitFor("document.body.innerText.includes('Bulk Email')");
  } catch (error) {
    await screenshot(cdp, `${screenshotName}-route-error`);
    const page = await cdp.evaluate("({ url: location.href, text: document.body.innerText.slice(0, 1000) })");
    throw new Error(`${String(error)}; page=${JSON.stringify(page)}`);
  }
  await cdp.evaluate("[...document.querySelectorAll('button')].find(x => x.textContent?.includes('Bulk Email'))?.click()");

  const readinessPause = await cdp.waitForEvent(
    "Fetch.requestPaused",
    params => pausedRequestIs(params, "GET", "/api/email-campaigns/readiness"),
  );
  const readiness = {
    ready: true,
    provider: "mailchimp",
    configured: true,
    writeAccess: true,
    audienceId: `${runId}-synthetic-browser-audience`,
    audienceName: "Synthetic intercepted audience",
    fromEmail: fixedAddress,
    fromName: "Cape NatureX Organic",
    replyToEmail: fixedAddress,
    message: "Synthetic browser readiness response.",
    isAdmin: path.includes("/admin/"),
  };
  await cdp.send("Fetch.fulfillRequest", {
    requestId: readinessPause.requestId,
    responseCode: 200,
    responseHeaders: [{ name: "content-type", value: "application/json" }],
    body: Buffer.from(JSON.stringify(readiness)).toString("base64"),
  });
  await cdp.waitFor("document.querySelector('[role=dialog]')?.innerText.includes('Bulk Email Campaign')");
  await cdp.waitFor(`document.querySelector('[role=dialog]')?.innerText.includes(${JSON.stringify(fixedAddress)})`);
  const forbidden = ["Settings", "Audience:", "Save shared configuration", "Enable access", "Agent access"];
  for (const text of forbidden) {
    assert.equal(
      await cdp.evaluate(`document.querySelector('[role=dialog]')?.innerText.includes(${JSON.stringify(text)})`),
      false,
      `simplified ${screenshotName} dialog must not expose ${text}`,
    );
  }
  assert.equal(
    await cdp.evaluate("document.querySelectorAll('[role=dialog] [role=tab]').length"),
    2,
    "simplified bulk-email dialog must contain only Compose Email and Past Campaigns",
  );
  await screenshot(cdp, screenshotName);
  await cdp.send("Fetch.disable");
}

async function interceptUiSend(cdp: Cdp, cookie: string, companyId: number) {
  await setBrowserSession(cdp, cookie);
  await cdp.send("Fetch.enable", {
    patterns: [
      { urlPattern: `${baseUrl}/api/email-campaigns/readiness`, requestStage: "Request" },
      { urlPattern: `${baseUrl}/api/email-campaigns`, requestStage: "Request" },
    ],
  });
  await cdp.send("Page.navigate", { url: `${baseUrl}/sales/my-companies` });
  await cdp.waitFor("document.body.innerText.includes('Bulk Email')");
  await cdp.evaluate("[...document.querySelectorAll('button')].find(x => x.textContent?.includes('Bulk Email'))?.click()");
  const readinessPause = await cdp.waitForEvent(
    "Fetch.requestPaused",
    params => pausedRequestIs(params, "GET", "/api/email-campaigns/readiness"),
  );
  await cdp.send("Fetch.fulfillRequest", {
    requestId: readinessPause.requestId,
    responseCode: 200,
    responseHeaders: [{ name: "content-type", value: "application/json" }],
    body: Buffer.from(JSON.stringify({
      ready: true, provider: "mailchimp", configured: true, writeAccess: true,
      audienceId: `${runId}-synthetic-browser-audience`, audienceName: "Synthetic intercepted audience",
      fromEmail: fixedAddress, fromName: "Cape NatureX Organic", replyToEmail: fixedAddress,
      message: "Synthetic browser readiness response.", isAdmin: false,
    })).toString("base64"),
  });
  await cdp.waitFor(`document.querySelector('[role=dialog]')?.innerText.includes(${JSON.stringify(`${runId} Company A`)})`);
  await cdp.evaluate(`(() => {
    const text = ${JSON.stringify(`${runId} Company A`)};
    const leaf = [...document.querySelectorAll('[role=dialog] p')].find(x => x.textContent?.trim() === text);
    leaf?.closest('.cursor-pointer')?.click();
    const setValue = (id, value) => {
      const input = document.getElementById(id);
      if (!input) throw new Error(id + ' was not found');
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(input, value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    };
    setValue('campaignName', ${JSON.stringify(`${runId} Synthetic Campaign`)});
    setValue('subject', 'Synthetic verification subject');
    const editor = document.querySelector('[role=dialog] [contenteditable=true]');
    if (!editor) throw new Error('email editor was not found');
    editor.innerHTML = '<p>Synthetic verification content; this is never sent.</p>';
    editor.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: 'synthetic' }));
    document.getElementById('permissionConfirmed')?.click();
  })()`);
  await cdp.waitFor("[...document.querySelectorAll('[role=dialog] button')].some(x => x.textContent?.includes('Send to 1 Companies') && !x.disabled)");
  await screenshot(cdp, "sales-send-ready");
  await cdp.evaluate("[...document.querySelectorAll('[role=dialog] button')].find(x => x.textContent?.includes('Send to 1 Companies'))?.click()");
  const sendPause = await cdp.waitForEvent(
    "Fetch.requestPaused",
    params => pausedRequestIs(params, "POST", "/api/email-campaigns"),
  );
  assert.ok(sendPause.request.postData, "intercepted send request had no body");
  const payload = JSON.parse(sendPause.request.postData);
  assert.deepEqual(payload.companyIds, [companyId], "UI send payload must contain only the assigned company");
  assert.equal(payload.name, `${runId} Synthetic Campaign`, "UI send payload campaign name");
  assert.equal(payload.subject, "Synthetic verification subject", "UI send payload subject");
  assert.match(payload.htmlContent, /Synthetic verification content/, "UI send payload HTML content");
  assert.equal(payload.permissionConfirmed, true, "UI send payload must include explicit recipient consent");
  assert.match(payload.idempotencyKey, /^[0-9a-f-]{36}$/i, "UI send payload must include an idempotency UUID");
  assert.equal("fromEmail" in payload, false, "client must not submit configurable sender fields");
  assert.equal("replyToEmail" in payload, false, "client must not submit configurable reply-to fields");
  await cdp.send("Fetch.fulfillRequest", {
    requestId: sendPause.requestId,
    responseCode: 200,
    responseHeaders: [{ name: "content-type", value: "application/json" }],
    body: Buffer.from(JSON.stringify({
      success: true, campaignId: 987654321, status: "sent", sent: 1, failed: 0,
      excluded: 0, message: "Synthetic intercepted result; no network send occurred.",
    })).toString("base64"),
  });
  const campaignsPause = await cdp.waitForEvent(
    "Fetch.requestPaused",
    params => pausedRequestIs(params, "GET", "/api/email-campaigns"),
  );
  await cdp.send("Fetch.fulfillRequest", {
    requestId: campaignsPause.requestId,
    responseCode: 200,
    responseHeaders: [{ name: "content-type", value: "application/json" }],
    body: Buffer.from("[]").toString("base64"),
  });
  await cdp.waitFor("document.body.innerText.includes('Synthetic intercepted result; no network send occurred.')");
  await screenshot(cdp, "sales-synthetic-send-result");
  await cdp.send("Fetch.disable");
}

async function stopBrowser() {
  if (browser && browser.exitCode === null) {
    browser.kill("SIGTERM");
    await Promise.race([
      new Promise<void>(resolve => browser!.once("exit", () => resolve())),
      delay(3_000).then(() => undefined),
    ]);
  }
  if (profileDir) await rm(profileDir, { recursive: true, force: true, maxRetries: 20, retryDelay: 100 });
  browser = undefined;
  profileDir = "";
}

async function main() {
  const fixtures = await seed();
  try {
    const [adminCookie, salesACookie, salesBCookie, inactiveCookie] = await Promise.all([
      login(emails.admin), login(emails.salesA), login(emails.salesB), login(emails.inactive),
    ]);
    // No mailbox/config fixtures exist: automatic access and fixed routing must
    // work from account eligibility alone.
    const configRows = await db.query(
      "SELECT user_id FROM bulk_email_user_configs WHERE user_id = ANY($1)",
      [Object.values(ids)],
    );
    const mailboxRows = await db.query(
      "SELECT user_id FROM user_email_configs WHERE user_id = ANY($1)",
      [Object.values(ids)],
    );
    assert.equal(configRows.rowCount, 0, "verification users must have no bulk-email config fixtures");
    assert.equal(mailboxRows.rowCount, 0, "verification users must have no mailbox fixtures");

    for (const [label, cookie] of [["admin", adminCookie], ["sales A", salesACookie], ["sales B", salesBCookie]] as const) {
      const response = await request(cookie, "/api/email-campaigns/readiness");
      assertStatus(response, 200, `${label} readiness`);
      const body = await response.json();
      assert.equal(body.fromEmail, fixedAddress, `${label} readiness fixed From`);
      assert.equal(body.replyToEmail, fixedAddress, `${label} readiness fixed Reply-To`);
      assert.doesNotMatch(String(body.message || ""), /access is disabled|mailbox|required/i, `${label} readiness must not require access/config/mailbox setup`);
    }

    const salesACompanies = await (await request(salesACookie, "/api/email-campaigns/companies")).json();
    const salesBCompanies = await (await request(salesBCookie, "/api/email-campaigns/companies")).json();
    assert.ok(salesACompanies.some((company: any) => company.id === fixtures.companyA), "sales A sees assigned company");
    assert.ok(!salesACompanies.some((company: any) => company.id === fixtures.companyB), "sales A cannot see sales B company");
    assert.ok(salesBCompanies.some((company: any) => company.id === fixtures.companyB), "sales B sees assigned company");
    assert.ok(!salesBCompanies.some((company: any) => company.id === fixtures.companyA), "sales B cannot see sales A company");

    // Retired mutation routes must fail before any provider work. This verifies
    // that neither administrators nor staff can restore manual setup/access.
    assertStatus(await request(adminCookie, "/api/email-campaigns/configurations/shared", {
      method: "PUT", headers: { "content-type": "application/json" }, body: "{}",
    }), 410, "admin manual shared configuration retired");
    assertStatus(await request(adminCookie, `/api/email-campaigns/configurations/${ids.salesA}/access`, {
      method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ isEnabled: false }),
    }), 410, "admin manual access control retired");
    assertStatus(await request(adminCookie, "/api/email-campaigns/configurations/enable-all", {
      method: "POST",
    }), 410, "admin enable-all control retired");
    assertStatus(await request(salesACookie, `/api/email-campaigns/configurations/${ids.salesA}/access`, {
      method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ isEnabled: false }),
    }), 403, "staff manual access control forbidden");

    // Preserve the authenticated session, then make this test-owned user
    // inactive to verify server-side eligibility without touching real users.
    await db.query("UPDATE users SET account_status = 'inactive', is_active = false WHERE id = $1", [ids.inactive]);
    assertStatus(await request(inactiveCookie, "/api/email-campaigns/companies"), 403, "inactive sender companies rejected");
    const inactiveReadinessResponse = await request(inactiveCookie, "/api/email-campaigns/readiness");
    assertStatus(inactiveReadinessResponse, 200, "inactive sender readiness");
    assert.equal((await inactiveReadinessResponse.json()).ready, false, "inactive sender readiness must be false");

    const cdp = await openBrowser();
    try {
      await assertSimplifiedDialog(cdp, "/admin/dashboard/crm/companies", adminCookie, "admin-simplified");
      await assertSimplifiedDialog(cdp, "/sales/my-companies", salesACookie, "sales-simplified");
      await interceptUiSend(cdp, salesACookie, fixtures.companyA);
    } finally {
      cdp.close();
    }
    await stopBrowser();
    console.log(`PASS: automatic fixed-address readiness, assigned-company isolation, inactive rejection, simplified admin/staff UI, and safely intercepted UI payload verified. Screenshots: ${screenshotDir}/admin-simplified.png, sales-simplified.png, sales-send-ready.png, sales-synthetic-send-result.png. No provider write or send request reached the network.`);
  } finally {
    await stopBrowser();
  }
}

try {
  await main();
} finally {
  await cleanup();
  await db.end();
}