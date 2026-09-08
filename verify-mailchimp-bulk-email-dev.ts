/**
 * Deliberately opt-in development verification. Run only after the application
 * server is ready:
 *   NODE_ENV=development BASE_URL=http://127.0.0.1:5000 npx tsx verify-mailchimp-bulk-email-dev.ts
 * Or set BASE_URL exactly to https://$REPLIT_DEV_DOMAIN for the development
 * proxy; production URLs are refused.
 *
 * It creates uniquely prefixed, temporary staff/CRM rows, never calls a
 * Mailchimp-writing endpoint or campaign send endpoint, and removes its rows
 * in finally. Screenshots may include existing staff display data and are kept
 * in ignored local test output rather than committed with the application.
 */
import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { Pool, neonConfig } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import WebSocket from "ws";

if (process.env.NODE_ENV !== "development") {
  throw new Error("Refusing to run unless NODE_ENV=development.");
}
const baseUrl = (process.env.BASE_URL || "").replace(/\/$/, "");
const localDevelopmentUrl = /^http:\/\/(127\.0\.0\.1|localhost)(?::\d+)?$/.test(baseUrl);
const replitDevelopmentUrl = !!process.env.REPLIT_DEV_DOMAIN &&
  baseUrl === `https://${process.env.REPLIT_DEV_DOMAIN}`;
if (!localDevelopmentUrl && !replitDevelopmentUrl) {
  throw new Error("BASE_URL must be localhost or exactly https://REPLIT_DEV_DOMAIN.");
}
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");

neonConfig.webSocketConstructor = WebSocket;
const db = new Pool({ connectionString: process.env.DATABASE_URL });
const runId = `e2e_mailchimp_${randomUUID().replaceAll("-", "")}`;
const password = randomUUID();
const ids = {
  admin: `${runId}_admin`,
  salesA: `${runId}_sales_a`,
  salesB: `${runId}_sales_b`,
};
const emails = Object.fromEntries(Object.entries(ids).map(([key, id]) => [key, `${id}@example.test`])) as Record<keyof typeof ids, string>;
const screenshots = ".local/test-output/mailchimp-bulk-email-e2e";
let browser: ReturnType<typeof spawn> | undefined;
let profileDir = "";

function assertStatus(response: Response, expected: number, context: string) {
  assert.equal(response.status, expected, `${context}: expected HTTP ${expected}, received ${response.status}`);
}

async function cleanup(userIds = Object.values(ids)) {
  if (!userIds.length) return;
  // All statements are scoped to this invocation's unguessable IDs only.
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
  await cleanup(stale.rows.map((row) => row.id));
  await cleanup();
  const hash = await bcrypt.hash(password, 10);
  const rows = [
    [ids.admin, emails.admin, "Admin", "Verifier", "admin", "admin"],
    [ids.salesA, emails.salesA, "Sales", "Alpha", "sales_executive", "sales"],
    [ids.salesB, emails.salesB, "Sales", "Bravo", "sales_executive", "sales"],
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
  const campaign = await db.query(
    `INSERT INTO email_campaigns
      (name, subject, html_content, created_by, from_name, reply_to_email, provider, status, provider_audience_id, idempotency_key, recipient_permission_basis, recipient_permission_confirmed_at, recipient_permission_confirmed_by)
     VALUES ($1, 'Temporary verification', '<p>Not sent</p>', $2, 'Temporary verifier', $3, 'mailchimp', 'draft', 'test-audience', $4, 'test_only', NOW(), $2)
     RETURNING id`,
    [`${runId} Campaign A`, ids.salesA, emails.salesA, randomUUID()],
  );
  await db.query(
    `INSERT INTO email_campaign_recipients (campaign_id, company_id, email, status, permission_basis, permission_confirmed_at, permission_confirmed_by)
     VALUES ($1, $2, $3, 'pending', 'test_only', NOW(), $4)`,
    [campaign.rows[0].id, companyA.rows[0].id, `${runId}.recipient@example.test`, ids.salesA],
  );
  return { companyA: companyA.rows[0].id as number, companyB: companyB.rows[0].id as number, campaignA: campaign.rows[0].id as number };
}

async function login(email: string) {
  const form = new URLSearchParams({ email, password });
  const response = await fetch(`${baseUrl}/admin/login`, {
    method: "POST", body: form, redirect: "manual",
    headers: { "content-type": "application/x-www-form-urlencoded" },
  });
  assertStatus(response, 302, "staff login");
  const cookie = response.headers.getSetCookie?.()[0] || response.headers.get("set-cookie");
  assert.ok(cookie, "staff login did not create a session cookie");
  const cookieHeader = cookie.split(";")[0];
  const whoami = await fetch(`${baseUrl}/api/auth/user`, { headers: { cookie: cookieHeader } });
  assertStatus(whoami, 200, "authenticated identity");
  return cookieHeader;
}

async function request(cookie: string, path: string, init?: RequestInit) {
  return fetch(`${baseUrl}${path}`, { ...init, headers: { ...init?.headers, cookie } });
}

class Cdp {
  private socket: WebSocket;
  private nextId = 0;
  private pending = new Map<number, { resolve: (value: any) => void; reject: (reason: Error) => void }>();
  private events = new Map<string, any[]>();
  constructor(url: string) {
    this.socket = new WebSocket(url);
    this.socket.on("message", (message) => {
      const data = JSON.parse(String(message));
      if (data.id) {
        const request = this.pending.get(data.id);
        this.pending.delete(data.id);
        data.error ? request?.reject(new Error(data.error.message)) : request?.resolve(data.result);
      } else if (data.method) {
        this.events.set(data.method, [...(this.events.get(data.method) || []), data.params]);
      }
    });
  }
  async open() {
    await new Promise<void>((resolve, reject) => {
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
        // Navigation replaces the JavaScript execution context. Retry against
        // the new document rather than treating that transient CDP error as a
        // failed assertion.
      }
      await delay(100);
    }
    throw new Error(`Timed out waiting for UI condition: ${expression}`);
  }
  close() { this.socket.close(); }
}

async function openBrowser() {
  const chromium = process.env.CHROMIUM_PATH || "/repl/tools/bin/chromium";
  if (!existsSync(chromium)) throw new Error("Chromium was not found at the configured path.");
  profileDir = `/tmp/${runId}-chromium`;
  browser = spawn(chromium, ["--headless=new", "--no-first-run", "--no-default-browser-check", "--remote-debugging-port=0", `--user-data-dir=${profileDir}`, `${baseUrl}/login`], { stdio: "ignore" });
  const portFile = `${profileDir}/DevToolsActivePort`;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (existsSync(portFile)) {
      const [port] = (await readFile(portFile, "utf8")).split("\n");
      const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json() as Array<{ type: string; webSocketDebuggerUrl: string }>;
      const page = pages.find((entry) => entry.type === "page");
      if (page) {
        const cdp = new Cdp(page.webSocketDebuggerUrl);
        await cdp.open();
        await cdp.send("Page.enable"); await cdp.send("Runtime.enable");
        await cdp.send("Network.enable"); await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
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
  await cdp.send("Network.enable");
  await cdp.send("Network.clearBrowserCookies");
  const result = await cdp.send("Network.setCookie", {
    name: cookie.slice(0, separator),
    value: cookie.slice(separator + 1),
    url: baseUrl,
    httpOnly: true,
    secure: baseUrl.startsWith("https:"),
    sameSite: "Lax",
  });
  assert.equal(result.success, true, "CDP did not accept the authenticated session cookie");
  await cdp.send("Page.navigate", { url: `${baseUrl}/` });
  await cdp.waitFor("fetch('/api/auth/user').then(response => response.ok)");
}

async function screenshot(cdp: Cdp, name: string) {
  await mkdir(screenshots, { recursive: true });
  const image = await cdp.send("Page.captureScreenshot", { format: "png" });
  await writeFile(`${screenshots}/${name}.png`, Buffer.from(image.data, "base64"));
}

async function checkUi(cdp: Cdp, path: string, expectSettings: boolean, screenshotName: string, companyId?: number, expectedReplyEmail?: string) {
  await cdp.send("Page.navigate", { url: `${baseUrl}${path}` });
  if (companyId) {
    try {
      await cdp.waitFor(`[...document.querySelectorAll('tr')].some(row => row.innerText.includes(${JSON.stringify(runId)}))`);
    } catch (error) {
      await screenshot(cdp, `${screenshotName}-selection-error`);
      throw error;
    }
    await cdp.evaluate(`[...document.querySelectorAll('tr')].find(row => row.innerText.includes(${JSON.stringify(runId)}))?.querySelector('button')?.click()`);
  }
  try {
    await cdp.waitFor(`document.body.innerText.includes('Bulk Email')`);
  } catch (error) {
    await screenshot(cdp, `${screenshotName}-route-error`);
    throw error;
  }
  await cdp.evaluate("[...document.querySelectorAll('button')].find(x => x.textContent?.trim() === 'Bulk Email')?.click()");
  await cdp.waitFor("document.body.innerText.includes('Bulk Email Campaign')");
  if (expectSettings) {
    await delay(500);
    const settingsPoint = await cdp.evaluate(`(() => {
      const tab = [...document.querySelectorAll('[role=tab]')].find(x => x.textContent?.trim() === 'Settings');
      if (!tab) return null;
      const rect = tab.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    })()`);
    assert.ok(settingsPoint, "admin bulk-email Settings tab was not found");
    for (let attempt = 0; attempt < 20; attempt += 1) {
      if (await cdp.evaluate("[...document.querySelectorAll('[role=dialog] [role=tab]')].some(tab => tab.textContent?.trim() === 'Settings' && tab.getAttribute('aria-selected') === 'true')")) break;
      await cdp.evaluate("[...document.querySelectorAll('[role=dialog] [role=tab]')].find(tab => tab.textContent?.trim() === 'Settings')?.click()");
      await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", x: settingsPoint.x, y: settingsPoint.y, button: "left", clickCount: 1 });
      await cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: settingsPoint.x, y: settingsPoint.y, button: "left", clickCount: 1 });
      await delay(100);
    }
    assert.equal(
      await cdp.evaluate("[...document.querySelectorAll('[role=dialog] [role=tab]')].some(tab => tab.textContent?.trim() === 'Settings' && tab.getAttribute('aria-selected') === 'true')"),
      true,
      "admin bulk-email Settings tab did not activate",
    );
    await cdp.waitFor("document.querySelector('[role=dialog]')?.innerText.includes('Shared Mailchimp sales configuration')");
    assert.equal(
      await cdp.evaluate("document.querySelector('[role=dialog]')?.innerText.includes('Intended Reply-To')"),
      true,
      "admin settings must label agent routing as Intended Reply-To",
    );
    for (const label of ["Audience", "Verified sender email", "Sender display name"]) {
      const visible = await cdp.evaluate(`[...document.querySelectorAll('[role=dialog] label')].some(item => item.textContent?.trim() === ${JSON.stringify(label)})`);
      if (!visible) await screenshot(cdp, `${screenshotName}-form-error`);
      assert.equal(visible, true, `admin shared setup must show ${label}`);
    }
    assert.equal(
      await cdp.evaluate("[...document.querySelectorAll('[role=dialog] button')].some(button => button.textContent?.trim() === 'Save shared configuration')"),
      true,
      "admin shared setup must show Save shared configuration",
    );
    const unsavedSenderName = `Unsaved ${runId.slice(-10)}`;
    await cdp.evaluate(`(() => {
      const label = [...document.querySelectorAll('[role=dialog] label')].find(item => item.textContent?.trim() === 'Sender display name');
      const input = label?.parentElement?.querySelector('input');
      if (!input) throw new Error('Sender display name input was not found');
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(input, ${JSON.stringify(unsavedSenderName)});
      input.dispatchEvent(new Event('input', { bubbles: true }));
    })()`);
    const refreshPoint = await cdp.evaluate(`(() => {
      const button = [...document.querySelectorAll('[role=dialog] button')].find(item => item.textContent?.trim() === 'Refresh');
      if (!button) return null;
      const rect = button.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    })()`);
    assert.ok(refreshPoint, "admin Settings Refresh button was not found");
    await cdp.evaluate("[...document.querySelectorAll('[role=dialog] button')].find(item => item.textContent?.trim() === 'Refresh')?.click()");
    await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", x: refreshPoint.x, y: refreshPoint.y, button: "left", clickCount: 1 });
    await cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: refreshPoint.x, y: refreshPoint.y, button: "left", clickCount: 1 });
    await delay(1_500);
    assert.equal(
      await cdp.evaluate(`(() => {
        const label = [...document.querySelectorAll('[role=dialog] label')].find(item => item.textContent?.trim() === 'Sender display name');
        return label?.parentElement?.querySelector('input')?.value;
      })()`),
      unsavedSenderName,
      "Refresh must preserve an unsaved sender display name when the server configuration signature is unchanged",
    );
  } else {
    assert.equal(
      await cdp.evaluate("[...document.querySelectorAll('[role=dialog] [role=tab]')].some(tab => tab.textContent?.trim() === 'Settings')"),
      false,
      "sales bulk-email dialog must not expose the settings tab",
    );
    if (expectedReplyEmail) {
      await cdp.waitFor(`document.querySelector('[role=dialog]')?.innerText.includes(${JSON.stringify(expectedReplyEmail)})`);
    }
  }
  await screenshot(cdp, screenshotName);
}

async function main() {
  const fixtures = await seed();
  try {
    const [adminCookie, salesACookie, salesBCookie] = await Promise.all([login(emails.admin), login(emails.salesA), login(emails.salesB)]);
    const adminConfigurations = await request(adminCookie, "/api/email-campaigns/configurations");
    assertStatus(adminConfigurations, 200, "admin configurations");
    const configBody = await adminConfigurations.json();
    assert.ok(Array.isArray(configBody.users) && "sharedConfiguration" in configBody && "conflicts" in configBody, "configuration contract");
    assertStatus(await request(salesACookie, "/api/email-campaigns/configurations"), 403, "sales configurations forbidden");
    assertStatus(await request(salesACookie, "/api/email-campaigns/mailchimp/audiences"), 403, "sales audiences forbidden");
    assertStatus(await request(salesACookie, `/api/email-campaigns/configurations/${ids.salesA}/access`, {
      method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ isEnabled: false }),
    }), 403, "sales self-access toggle forbidden");
    assertStatus(await request(salesACookie, "/api/email-campaigns/configurations/enable-all", {
      method: "POST",
    }), 403, "sales enable-all forbidden");
    const readinessA = await (await request(salesACookie, "/api/email-campaigns/readiness")).json();
    const readinessB = await (await request(salesBCookie, "/api/email-campaigns/readiness")).json();
    assert.equal(readinessA.replyToEmail, emails.salesA, "sales A readiness must use its valid staff-email fallback");
    assert.equal(readinessB.replyToEmail, emails.salesB, "sales B readiness must use its valid staff-email fallback");
    assert.notEqual(readinessA.replyToEmail, readinessB.replyToEmail, "sales readiness reply addresses must remain distinct");
    const disableA = await request(adminCookie, `/api/email-campaigns/configurations/${ids.salesA}/access`, {
      method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ isEnabled: false }),
    });
    assertStatus(disableA, 200, "admin temporary-agent disable");
    const afterDisable = await (await request(adminCookie, "/api/email-campaigns/configurations")).json();
    const temporaryA = afterDisable.users.find((entry: any) => entry.user.id === ids.salesA);
    assert.equal(temporaryA?.configuration?.isEnabled ?? false, false, "temporary agent must be disabled or unconfigured");
    const sharedResolved = !!configBody.sharedConfiguration && configBody.conflicts.length === 0;
    if (!sharedResolved) {
      const enableA = await request(adminCookie, `/api/email-campaigns/configurations/${ids.salesA}/access`, {
        method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ isEnabled: true }),
      });
      assertStatus(enableA, 409, "admin temporary-agent enable without resolved shared setup");
    }
    assertStatus(await request(salesACookie, `/api/email-campaigns/${fixtures.campaignA}`), 200, "owner campaign");
    assertStatus(await request(salesBCookie, `/api/email-campaigns/${fixtures.campaignA}`), 404, "cross-agent campaign");
    assertStatus(await request(salesBCookie, `/api/email-campaigns/${fixtures.campaignA}/recipients`), 404, "cross-agent recipients");
    assertStatus(await request(adminCookie, `/api/email-campaigns/${fixtures.campaignA}`), 200, "admin campaign");
    const salesACompanies = await (await request(salesACookie, "/api/email-campaigns/companies")).json();
    const salesBCompanies = await (await request(salesBCookie, "/api/email-campaigns/companies")).json();
    assert.ok(salesACompanies.some((company: any) => company.id === fixtures.companyA) && !salesACompanies.some((company: any) => company.id === fixtures.companyB), "sales A company isolation");
    assert.ok(salesBCompanies.some((company: any) => company.id === fixtures.companyB) && !salesBCompanies.some((company: any) => company.id === fixtures.companyA), "sales B company isolation");

    const cdp = await openBrowser();
    try {
      await setBrowserSession(cdp, adminCookie);
      await checkUi(cdp, "/admin/dashboard/crm/companies", true, "admin-settings", fixtures.companyA);
      await setBrowserSession(cdp, salesACookie);
      await checkUi(cdp, "/sales/my-companies", false, "sales-compose", undefined, emails.salesA);
    } finally {
      cdp.close();
    }
    const configCount = await db.query("SELECT count(*)::int AS count FROM bulk_email_user_configs");
    const blankSharedSetup = !configBody.sharedConfiguration &&
      configBody.conflicts.length === 0 &&
      configCount.rows[0].count === 0;
    if (blankSharedSetup) {
      // This local, disabled row is test-owned and exists only to exercise the
      // positive access route after screenshots captured the true blank setup.
      await db.query(
        `INSERT INTO bulk_email_user_configs
          (user_id, audience_id, from_email, from_name, enabled, ready_at, last_checked_at, readiness_error)
         VALUES ($1, $2, $3, $4, false, NULL, NOW(), NULL)`,
        [ids.admin, `${runId}-audience`, emails.admin, `${runId} synthetic sender`],
      );
    }
    if (sharedResolved || blankSharedSetup) {
      for (const userId of [ids.salesA, ids.salesB]) {
        assertStatus(await request(adminCookie, `/api/email-campaigns/configurations/${userId}/access`, {
          method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ isEnabled: true }),
        }), 200, `admin temporary-agent positive enable ${userId === ids.salesA ? "A" : "B"}`);
      }
      const afterPositiveEnable = await (await request(adminCookie, "/api/email-campaigns/configurations")).json();
      for (const userId of [ids.salesA, ids.salesB]) {
        assert.equal(
          afterPositiveEnable.users.find((entry: any) => entry.user.id === userId)?.configuration?.isEnabled,
          true,
          "temporary agent must reflect enabled access",
        );
      }
      if (blankSharedSetup) {
        assert.equal(
          afterPositiveEnable.users.find((entry: any) => entry.user.id === ids.admin)?.configuration?.isEnabled,
          false,
          "test-owned shared holder must remain disabled",
        );
      }
      for (const userId of [ids.salesA, ids.salesB]) {
        assertStatus(await request(adminCookie, `/api/email-campaigns/configurations/${userId}/access`, {
          method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ isEnabled: false }),
        }), 200, `admin temporary-agent positive disable ${userId === ids.salesA ? "A" : "B"}`);
      }
      const afterPositiveDisable = await (await request(adminCookie, "/api/email-campaigns/configurations")).json();
      for (const userId of [ids.salesA, ids.salesB]) {
        assert.equal(
          afterPositiveDisable.users.find((entry: any) => entry.user.id === userId)?.configuration?.isEnabled,
          false,
          "temporary agent must reflect disabled access",
        );
      }
    }
    console.log("PASS: authenticated API isolation and CDP UI checks completed; no provider write/send endpoint was called.");
  } finally {
    if (browser && browser.exitCode === null) {
      browser.kill("SIGTERM");
      await Promise.race([
        new Promise<void>((resolve) => browser!.once("exit", () => resolve())),
        delay(3_000).then(() => undefined),
      ]);
    }
    if (profileDir) {
      await rm(profileDir, { recursive: true, force: true, maxRetries: 20, retryDelay: 100 });
    }
  }
}

try {
  await main();
} finally {
  await cleanup();
  await db.end();
}