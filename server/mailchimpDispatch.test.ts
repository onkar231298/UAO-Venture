import assert from "node:assert/strict";
import test from "node:test";
import { createAndSend } from "./mailchimpService";

// Isolated node:test worker; no production credentials or network requests.
process.env.MAILCHIMP_API_KEY = "fixture-us1";
const input = {
  audienceId: "audience", campaignKey: "request", name: "Fixture",
  subject: "Fixture", fromEmail: "sales@example.test", fromName: "Sales",
  replyToEmail: "sales@example.test", html: "<p>Fixture</p>",
  recipients: [{ email: "buyer@example.test" }],
};

async function withProvider(
  sendStatus: number,
  verify: (calls: string[]) => Promise<void>,
) {
  const previousFetch = globalThis.fetch;
  const calls: string[] = [];
  globalThis.fetch = (async (url, init) => {
    const path = new URL(String(url)).pathname;
    const method = init?.method || "GET";
    calls.push(`${method} ${path}`);
    if (method === "DELETE") return new Response(null, { status: 204 });
    if (/\/actions\/(send|schedule)$/.test(path)) {
      return new Response(null, { status: sendStatus });
    }
    let body;
    if (path.endsWith("/merge-fields")) body = { merge_fields: [{ tag: "FNAME" }, { tag: "COMPANY" }] };
    else if (path.includes("/members/")) body = { id: "member", status: "subscribed" };
    else if (path.endsWith("/segments")) body = { id: 1 };
    else if (path === "/3.0/campaigns") body = { id: "campaign" };
    else if (path === "/3.0/lists/audience") body = {
      campaign_defaults: { from_email: input.fromEmail, from_name: input.fromName },
    };
    else if (path.endsWith("/content")) body = {};
    else throw new Error(`Unexpected mocked provider path: ${path}`);
    return Response.json(body);
  }) as typeof fetch;
  try { await verify(calls); } finally { globalThis.fetch = previousFetch; }
}

test("denied final authorization never calls send or schedule", async () => {
  await withProvider(204, async (calls) => {
    await assert.rejects(createAndSend({
      ...input,
      authorizeDispatch: async () => { throw Object.assign(new Error("Access disabled"), { status: 403 }); },
    }), /Access disabled/);
    assert.ok(!calls.some(call => call.includes("/actions/")));
  });
});

test("commit failure after provider acceptance preserves identifiers and prevents cleanup", async () => {
  await withProvider(204, async (calls) => {
    await assert.rejects(createAndSend({
      ...input,
      authorizeDispatch: async (dispatch) => { await dispatch(); throw new Error("Commit failed"); },
    }), (error: any) => error.deliveryUncertain === true && error.providerCampaignId === "campaign");
    assert.equal(calls.filter(call => call.endsWith("/actions/send")).length, 1);
    assert.ok(!calls.some(call => call.startsWith("DELETE")));
  });
});

test("definitive provider rejection is not retried or reported as accepted", async () => {
  await withProvider(400, async (calls) => {
    await assert.rejects(createAndSend({
      ...input, authorizeDispatch: async (dispatch) => dispatch(),
    }), (error: any) => error.status === 400 && !error.deliveryUncertain);
    assert.equal(calls.filter(call => call.endsWith("/actions/send")).length, 1);
  });
});

test("scheduling is performed only inside final authorization", async () => {
  await withProvider(204, async (calls) => {
    let authorized = false;
    await createAndSend({
      ...input, scheduledAt: new Date("2030-01-01T00:00:00Z"),
      authorizeDispatch: async (dispatch) => {
        assert.ok(!calls.some(call => call.includes("/actions/")));
        authorized = true;
        await dispatch();
      },
    });
    assert.ok(authorized);
    assert.equal(calls.filter(call => call.endsWith("/actions/schedule")).length, 1);
    assert.ok(!calls.some(call => call.endsWith("/actions/send")));
  });
});