import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { test } from "node:test";
import { companyLengthErrors } from "./companyValidation";

test("company phone fields preserve multiple numbers longer than 50 characters", () => {
  const phone = "+356 12345678 / +356 23456789 / +356 34567890 / +356 45678901";
  assert.ok(phone.length > 50);
  assert.deepEqual(companyLengthErrors({ primaryPhone: phone }), []);
});

test("company updates report each overlong field without truncating input", () => {
  const input = { addressZip: "X".repeat(21), companyName: "A".repeat(256), gstNumber: "B".repeat(51) };
  const errors = companyLengthErrors(input);
  assert.deepEqual(errors.map(error => error.field).sort(), ["addressZip", "companyName", "gstNumber"]);
  assert.equal(input.addressZip.length, 21);
  assert.match(errors.find(error => error.field === "addressZip")!.message, /20 characters/);
});

test("company limits accept exact boundaries, nulls and PostgreSQL Unicode character lengths", () => {
  assert.deepEqual(companyLengthErrors({ addressZip: "X".repeat(20), addressCity: "😀".repeat(100), primaryPhone: null }), []);
  assert.equal(companyLengthErrors({ addressCity: "😀".repeat(101) })[0].field, "addressCity");
});

// Run against the running development app and its DATABASE_URL:
// NODE_ENV=development TEST_COMPANY_DB=1 pnpm exec tsx --test server/companyValidation.test.ts
// Ordinary unit runs never connect to the database or create fixtures.
test("authenticated development company saves round-trip without partial writes", {
  skip: process.env.TEST_COMPANY_DB !== "1",
  timeout: 120_000,
}, async (t) => {
  assert.equal(process.env.NODE_ENV, "development", "Integration writes require NODE_ENV=development");
  assert.notEqual(process.env.REPLIT_DEPLOYMENT, "1", "Never run fixture writes in a deployment");
  const domain = process.env.REPLIT_DEV_DOMAIN;
  assert.ok(domain?.endsWith(".replit.dev"), "Use the workspace development domain, never a published URL");
  const base = `https://${domain}`;
  const { db, pool } = await import("./db");
  const { companies, users, sessions, activityHeartbeats, dailyPerformanceSummary,
    notifications, userAccessEvents, userLoginLogs, userSecurityAlerts } = await import("@shared/schema");
  const { eq, inArray, and, or, sql } = await import("drizzle-orm");
  const { default: bcrypt } = await import("bcryptjs");
  const userId = `company-save-test-${randomUUID()}`;
  const email = `${userId}@example.invalid`;
  const password = randomBytes(32).toString("hex");
  const companyIds: number[] = [];
  const sessionIds = new Set<string>();
  const cookies = new Map<string, string>();
  let userCreated = false;
  let originalFailure = false;
  const ownedSessions = () => or(
    sql`${sessions.sess}->'passport'->'user'->'claims'->>'sub' = ${userId}`,
    sessionIds.size ? inArray(sessions.sid, [...sessionIds]) : sql`false`,
  );

  // Keep regenerated cookies in memory only; do not put credentials in command
  // arguments, output, assertion values, or files.
  async function request(path: string, init: RequestInit = {}) {
    const response = await fetch(`${base}${path}`, {
      ...init,
      redirect: "manual",
      signal: AbortSignal.timeout(15_000),
      headers: {
        ...Object.fromEntries(new Headers(init.headers)),
        ...(cookies.size ? { cookie: [...cookies].map(([k, v]) => `${k}=${v}`).join("; ") } : {}),
      },
    });
    for (const header of response.headers.getSetCookie()) {
      const pair = header.split(";")[0];
      const index = pair.indexOf("=");
      const name = pair.slice(0, index);
      const value = pair.slice(index + 1);
      if (value) cookies.set(name, value);
      else cookies.delete(name);
      if (name === "bfi.sid" && value) {
        const decoded = decodeURIComponent(value);
        assert.ok(decoded.startsWith("s:"), "Expected a signed staff session cookie");
        sessionIds.add(decoded.slice(2, decoded.lastIndexOf(".")));
      }
    }
    return response;
  }

  async function stored(id: number) {
    assert.ok(companyIds.includes(id), "Only read/write fixtures created by this test");
    const [row] = await db.select().from(companies).where(eq(companies.id, id));
    assert.ok(row, "Temporary company must still exist");
    return row;
  }

  try {
    // Avoid exposing the password hash in a query error's diagnostic output.
    try {
      await db.insert(users).values({
        id: userId, email, password: await bcrypt.hash(password, 10),
        firstName: "Company save test", role: "sales_executive", userType: "staff",
        department: "sales", accountStatus: "active", isActive: true,
      });
      userCreated = true;
    } catch {
      throw new Error("Could not create the temporary staff fixture (database diagnostics omitted for credential safety)");
    }
    const login = await request("/admin/login", {
      method: "POST",
      body: new URLSearchParams({ email, password }),
    });
    await login.arrayBuffer();
    assert.equal(login.status, 302, "Staff form login must redirect");
    assert.equal(login.headers.get("location"), "/sales", "Login must succeed, not redirect to an error");
    assert.ok(sessionIds.size > 0, "Login must establish a session");

    // /api/auth/user normally schedules off-hours alerts to *real* admins.
    // Mark only our newly authenticated session as already logged before calling
    // it. This isolates monitoring side effects, not authentication: the session
    // and Passport principal above still come from the real form login.
    const ownSessions = and(
      inArray(sessions.sid, [...sessionIds]),
      sql`${sessions.sess}->'passport'->'user'->'claims'->>'sub' = ${userId}`,
    );
    const marked = await db.update(sessions).set({
      sess: sql`jsonb_set(${sessions.sess}::jsonb, '{loginLogged}', 'true'::jsonb)`,
    }).where(ownSessions).returning({ sid: sessions.sid });
    assert.ok(marked.length > 0, "The app must use the same development database as the fixtures");
    const auth = await request("/api/auth/user");
    assert.equal(auth.status, 200, "Staff session must authenticate");
    const authenticated = await auth.json();
    assert.ok(authenticated.id === userId && authenticated.role === "sales_executive",
      "Authenticated identity must be the temporary staff fixture");

    const prefix = `company-save-${randomUUID()}`;
    const fixtures = await db.insert(companies).values([0, 1].map(index => ({
      companyName: `${prefix}-${index}`, gstNumber: `test-${randomUUID()}-${index}`,
      primaryPhone: "+356 11111111", addressStreet: "Original street",
      addressCity: "Original city", addressZip: "ZIP",
      factoryAddressStreet: "Original factory", notes: "Original notes",
      assignedTo: userId, createdBy: userId,
    }))).returning({ id: companies.id });
    companyIds.push(...fixtures.map(row => row.id));
    assert.equal(companyIds.length, 2);

    for (const [index, method] of (["POST", "PATCH"] as const).entries()) {
      const id = companyIds[index];
      const otherId = companyIds[1 - index];
      const path = `/api/crm/companies/${id}${method === "POST" ? "/update" : ""}`;
      const save = (data: Record<string, unknown>) => request(path, {
        method, headers: { "content-type": "application/json" }, body: JSON.stringify(data),
      });
      await t.test(`${method}: long phone and both addresses persist exactly`, async () => {
        const values = {
          primaryPhone: `+356 12345678 / +356 23456789 / +356 34567890 / +356 45678901 (${method})`,
          addressStreet: `  Registered office, étage 2\n${"Long street segment; ".repeat(35)}  `,
          factoryAddressStreet: `  Warehouse – 東京\n${"Industrial estate; ".repeat(35)}  `,
          addressCity: "😀".repeat(100), addressState: "S".repeat(100),
          addressCountry: "C".repeat(100), addressZip: "Z".repeat(20),
          factoryAddressCity: "F".repeat(100), factoryAddressState: "T".repeat(100),
          factoryAddressCountry: "K".repeat(100), factoryAddressZip: "Y".repeat(20),
        };
        assert.ok(values.primaryPhone.length > 50);
        assert.ok(values.addressStreet.length > 500 && values.factoryAddressStreet.length > 500);
        const otherBefore = await stored(otherId);
        const response = await save(values);
        assert.equal(response.status, 200);
        const body = await response.json();
        const persisted = await stored(id);
        for (const [field, value] of Object.entries(values)) {
          assert.equal(body[field], value, `${field} response`);
          assert.equal(persisted[field as keyof typeof persisted], value, `${field} database`);
        }
        assert.deepEqual(await stored(otherId), otherBefore, "Other company must not change");
      });

      await t.test(`${method}: bounded fields return clear 400s with no partial writes`, async () => {
        // Explicit limits are independent of the validator, so changing/removing
        // a schema bound cannot silently weaken this regression check.
        const limits = {
          companyName: 255, primaryEmail: 255, gstNumber: 50, website: 500,
          addressCity: 100, addressState: 100, addressCountry: 100, addressZip: 20,
          factoryAddressCity: 100, factoryAddressState: 100,
          factoryAddressCountry: 100, factoryAddressZip: 20,
        };
        for (const [field, maxLength] of Object.entries(limits)) {
          const before = await stored(id);
          const response = await save({
            [field]: "X".repeat(maxLength + 1),
            primaryPhone: "This valid phone edit must not persist", notes: "Must not persist",
          });
          assert.equal(response.status, 400, `${method} ${field}`);
          const body = await response.json();
          const error = body.errors?.find((item: { field: string }) => item.field === field);
          assert.ok(error, `${field} must have a field-specific error`);
          assert.equal(error.maxLength, maxLength);
          assert.match(error.message, new RegExp(`${maxLength} characters`));
          assert.ok(body.message.includes(error.message), "Summary must explain the field limit");
          assert.deepEqual(await stored(id), before, `${field}: no fields or timestamps may change`);
        }
        const before = await stored(id);
        const response = await save({
          companyName: "X".repeat(256), addressZip: "X".repeat(21),
          factoryAddressCity: "😀".repeat(101), notes: "Must not persist",
        });
        assert.equal(response.status, 400);
        const body = await response.json();
        assert.deepEqual(body.errors.map((error: { field: string }) => error.field).sort(),
          ["addressZip", "companyName", "factoryAddressCity"]);
        assert.deepEqual(await stored(id), before, "Multi-error saves must be atomic");
      });

      await t.test(`${method}: duplicate GST is rejected and unchanged/blank GST still saves`, async () => {
        const before = await stored(id);
        const otherBefore = await stored(otherId);
        const duplicate = await save({
          gstNumber: otherBefore.gstNumber, notes: "Duplicate must not change notes",
          primaryPhone: "Duplicate must not change phone",
        });
        assert.equal(duplicate.status, 400);
        assert.match((await duplicate.json()).message, /company with this GST number already exists/i);
        assert.deepEqual(await stored(id), before, "Duplicate GST must not partially update");
        assert.deepEqual(await stored(otherId), otherBefore, "GST owner must not change");

        const unchanged = await save({ gstNumber: before.gstNumber, notes: `${method} same GST` });
        assert.equal(unchanged.status, 200, "Keeping the company's own GST is allowed");
        assert.equal((await unchanged.json()).gstNumber, before.gstNumber);
        assert.equal((await stored(id)).notes, `${method} same GST`);
        // Restore a unique GST so the other route can attempt a real duplicate.
        const blank = await save({ gstNumber: "" });
        assert.equal(blank.status, 200);
        assert.equal((await blank.json()).gstNumber, null);
        assert.equal((await stored(id)).gstNumber, null);
        const restored = await save({ gstNumber: before.gstNumber });
        assert.equal(restored.status, 200);
        await restored.arrayBuffer();
        assert.equal((await stored(id)).gstNumber, before.gstNumber);
      });
    }
  } catch (error) {
    originalFailure = true;
    throw error;
  } finally {
    const cleanupErrors: string[] = [];
    try {
      if (cookies.size) {
        const logout = await request("/api/logout");
        await logout.arrayBuffer();
        assert.equal(logout.status, 302);
      }
    } catch {
      cleanupErrors.push("Staff logout failed");
    }
    try {
      await db.transaction(async tx => {
        // Lock the parent before dependent deletes so an in-flight activity
        // write cannot recreate a child between cleanup and deleting the user.
        await tx.select({ id: users.id }).from(users).where(eq(users.id, userId)).for("update");
        if (companyIds.length) await tx.delete(companies).where(and(
          inArray(companies.id, companyIds), eq(companies.createdBy, userId),
        ));
        // Include captured regenerated SIDs and any session still owned by this
        // fixture (including login failures before a cookie reached the client).
        await tx.delete(sessions).where(ownedSessions());
        for (const table of [activityHeartbeats, dailyPerformanceSummary, notifications,
          userAccessEvents, userLoginLogs, userSecurityAlerts]) {
          await tx.delete(table).where(eq(table.userId, userId));
        }
        if (userCreated) await tx.delete(users).where(eq(users.id, userId));
      });
      assert.equal((await db.select({ id: users.id }).from(users).where(eq(users.id, userId))).length, 0);
      if (companyIds.length) assert.equal((await db.select({ id: companies.id }).from(companies)
        .where(inArray(companies.id, companyIds))).length, 0);
      assert.equal((await db.select({ sid: sessions.sid }).from(sessions)
        .where(ownedSessions())).length, 0);
    } catch {
      cleanupErrors.push(`Fixture cleanup failed; inspect only test owner ${userId}`);
    } finally {
      cookies.clear();
      sessionIds.clear();
      await pool.end();
    }
    if (cleanupErrors.length) {
      if (originalFailure) t.diagnostic(cleanupErrors.join("; "));
      else throw new Error(cleanupErrors.join("; "));
    }
  }
});
