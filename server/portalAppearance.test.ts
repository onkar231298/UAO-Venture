import assert from "node:assert/strict";
import test from "node:test";
import {
  createPortalAppearanceHandlers,
  type PortalAppearanceRepository,
} from "./portalAppearance";

type StoredUser = {
  id: string;
  userType: string;
  portalAppearance: unknown;
};

function createHarness(initialUsers: StoredUser[]) {
  const users = new Map(initialUsers.map((user) => [user.id, { ...user }]));
  const writes: Array<{ userId: string; preference: unknown; onlyIfMissing: boolean }> = [];
  const repository: PortalAppearanceRepository = {
    async getUserById(userId) {
      return users.get(userId);
    },
    async savePreference(userId, preference, onlyIfMissing) {
      writes.push({ userId, preference, onlyIfMissing });
      const user = users.get(userId);
      if (!user || user.userType !== "staff") return undefined;
      if (onlyIfMissing && user.portalAppearance !== null) return user.portalAppearance;
      user.portalAppearance = preference;
      return user.portalAppearance;
    },
  };
  const handlers = createPortalAppearanceHandlers(repository);
  return { handlers, users, writes };
}

async function invoke(handler: any, { user, body }: { user?: unknown; body?: unknown } = {}) {
  let statusCode = 200;
  let responseBody: unknown;
  const response = {
    setHeader() {
      return this;
    },
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(value: unknown) {
      responseBody = value;
      return this;
    },
  };
  await handler({ user, body } as any, response as any, () => {});
  return { statusCode, body: responseBody };
}

test("appearance is loaded from the authenticated staff account, independent of browser storage", async () => {
  const saved = { mode: "dark", palette: "ocean-teal" };
  const { handlers } = createHarness([
    { id: "staff-one", userType: "staff", portalAppearance: saved },
    { id: "staff-two", userType: "staff", portalAppearance: { mode: "light", palette: "plum-gold" } },
  ]);

  const firstDevice = await invoke(handlers.get, { user: { claims: { sub: "staff-one" } } });
  const anotherDevice = await invoke(handlers.get, { user: { claims: { sub: "staff-one" } } });
  const switchedAccount = await invoke(handlers.get, { user: { claims: { sub: "staff-two" } } });

  assert.deepEqual(firstDevice, { statusCode: 200, body: { preference: saved } });
  assert.deepEqual(anotherDevice, firstDevice);
  assert.deepEqual(switchedAccount.body, {
    preference: { mode: "light", palette: "plum-gold" },
  });
});

test("writes use only the authenticated staff identity and reject client-selected identities", async () => {
  const { handlers, writes } = createHarness([
    { id: "staff-one", userType: "staff", portalAppearance: null },
    { id: "staff-two", userType: "staff", portalAppearance: null },
  ]);

  const malicious = await invoke(handlers.put, {
    user: { claims: { sub: "staff-one" } },
    body: { mode: "dark", palette: "forest-sage", userId: "staff-two" },
  });
  assert.equal(malicious.statusCode, 400);
  assert.equal(writes.length, 0);

  const saved = await invoke(handlers.put, {
    user: { claims: { sub: "staff-one" } },
    body: { mode: "dark", palette: "forest-sage" },
  });
  assert.deepEqual(saved, {
    statusCode: 200,
    body: { preference: { mode: "dark", palette: "forest-sage" } },
  });
  assert.deepEqual(writes.map(({ userId }) => userId), ["staff-one"]);
});

test("rejects unauthenticated, customer, and out-of-whitelist appearance writes", async () => {
  const { handlers, writes } = createHarness([
    { id: "customer-one", userType: "customer", portalAppearance: null },
    { id: "staff-one", userType: "staff", portalAppearance: null },
  ]);

  assert.equal((await invoke(handlers.put, {
    body: { mode: "dark", palette: "ocean-teal" },
  })).statusCode, 401);
  assert.equal((await invoke(handlers.put, {
    user: { claims: { sub: "customer-one" } },
    body: { mode: "dark", palette: "ocean-teal" },
  })).statusCode, 403);
  assert.equal((await invoke(handlers.put, {
    user: { claims: { sub: "staff-one" } },
    body: { mode: "system", palette: "rainbow" },
  })).statusCode, 400);
  assert.equal(writes.length, 0);
});

test("browser migration is conditional and leaves an existing account choice unchanged", async () => {
  const existing = { mode: "dark", palette: "plum-gold" };
  const { handlers, users, writes } = createHarness([
    { id: "staff-one", userType: "staff", portalAppearance: existing },
  ]);
  const result = await invoke(handlers.put, {
    user: { claims: { sub: "staff-one" } },
    body: { mode: "light", palette: "navy-amber", onlyIfMissing: true },
  });

  assert.deepEqual(result, { statusCode: 200, body: { preference: existing } });
  assert.deepEqual(users.get("staff-one")?.portalAppearance, existing);
  assert.equal(writes[0]?.onlyIfMissing, true);
});
