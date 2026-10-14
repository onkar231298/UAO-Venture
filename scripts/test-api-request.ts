import assert from "node:assert/strict";
import { apiRequest } from "../client/src/lib/queryClient";

async function main() {
  const originalFetch = globalThis.fetch;
  const requests: { url: string; options: RequestInit }[] = [];
  try {
    globalThis.fetch = async (url, options) => {
      requests.push({ url: String(url), options: options ?? {} });
      return new Response('{"id":1}', { status: 200 });
    };
    for (const method of ["POST", "PATCH", "DELETE"]) {
      const url = "/api/crm/companies/1/contacts";
      const body = { contactName: "Test Contact", email: "", isPrimary: false };
      await apiRequest(method, url, method === "DELETE" ? undefined : body);
      const legacy = requests.at(-1)!;
      assert.equal(legacy.url, url);
      assert.equal(legacy.options.method, method);
      assert.equal(legacy.options.credentials, "include");
      assert.equal(legacy.options.body, method === "DELETE" ? undefined : JSON.stringify(body));

      await apiRequest(url, { method, body: method === "DELETE" ? undefined : JSON.stringify(body) });
      assert.deepEqual(requests.at(-1), legacy);
    }
    await apiRequest("/api/crm/companies/1");
    assert.equal(requests.at(-1)!.options.method, "GET");
    await assert.rejects(apiRequest("not-a-method", "/api/crm/companies"), /Invalid API request method/);
    globalThis.fetch = async () => new Response('{"message":"Invalid company data"}', { status: 400 });
    await assert.rejects(apiRequest("/api/crm/companies"), /400.*Invalid company data/);
    console.log("PASS: both request signatures, create/edit/delete bodies, credentials, GET, and failure handling");
  } finally {
    globalThis.fetch = originalFetch;
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
