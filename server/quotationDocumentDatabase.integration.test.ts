import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import express from "express";
import { eq, inArray } from "drizzle-orm";
import { db, pool } from "./db";
import { users, quotations, quotationDocumentContents } from "@shared/schema";
import { registerQuotationDocumentRoutes } from "./quotationDocumentRoutes";

test("database documents round-trip privately through quotation routes", {
  skip: process.env.TEST_QUOTATION_DOCUMENT_DB !== "1",
}, async () => {
  const ids = [randomUUID(), randomUUID(), randomUUID()];
  let quotationId: number | undefined;
  let server: ReturnType<ReturnType<typeof express>["listen"]> | undefined;
  try {
    await db.insert(users).values(ids.map((id, index) => ({
      id,
      email: `${id}@example.invalid`,
      role: index === 0 ? "super_admin" : index === 1 ? "customer" : "sales_executive",
      userType: index === 1 ? "customer" : "staff",
      isActive: true,
    })));
    const [quote] = await db.insert(quotations).values({
      quotationId: `TEST-DOC-${randomUUID()}`,
      status: "sent",
      customerId: ids[1],
      createdBy: ids[0],
    }).returning({ id: quotations.id });
    quotationId = quote.id;

    // Isolated test-only identity middleware; production auth is unchanged.
    const app = express();
    app.use((req: any, _res, next) => {
      const actor = req.get("x-test-actor");
      const index = actor === "admin" ? 0 : actor === "customer" ? 1 : actor === "other" ? 2 : -1;
      req.isAuthenticated = () => index >= 0;
      if (index >= 0) req.user = {
        isLocal: true,
        isStaff: index !== 1,
        claims: { sub: ids[index], role: index === 1 ? "customer" : index === 0 ? "super_admin" : "sales_executive" },
      };
      next();
    });
    registerQuotationDocumentRoutes(app);
    server = app.listen(0, "127.0.0.1");
    await new Promise<void>((resolve) => server!.once("listening", resolve));
    const address = server.address() as { port: number };
    const base = `http://127.0.0.1:${address.port}`;
    const file = Buffer.concat([Buffer.from("%PDF-1.7\n"), Buffer.from([0, 255, 128, 10])]);
    const upload = async (actor: string, customer = false) => {
      const form = new FormData();
      form.append("file", new Blob([file], { type: "application/pdf" }), "signed-test.pdf");
      if (customer) form.append("documentType", "signed_quotation");
      return fetch(`${base}/api/${customer ? "customer/" : ""}quotations/${quote.id}/documents`, {
        method: "POST", headers: { "x-test-actor": actor }, body: form,
      });
    };
    const savedIds: number[] = [];
    for (const actor of ["admin", "customer"]) {
      const response = await upload(actor, actor === "customer");
      const body = await response.json();
      assert.equal(response.status, 201, JSON.stringify(body));
      assert.equal(body.document.objectPath, undefined);
      assert.equal(body.document.contents, undefined);
      savedIds.push(body.document.id);
      const path = `/api/quotations/${quote.id}/documents/${body.document.id}/download`;
      for (const reader of ["admin", "customer"]) {
        const download = await fetch(`${base}${reader === "customer" ? path.replace("/api/", "/api/customer/") : path}`, {
          headers: { "x-test-actor": reader },
        });
        assert.equal(download.status, 200);
        assert.equal(download.headers.get("cache-control"), "private, no-store");
        assert.equal(download.headers.get("content-type"), "application/pdf");
        assert.deepEqual(Buffer.from(await download.arrayBuffer()), file);
      }
      assert.equal((await fetch(`${base}${path}`)).status, 401);
      assert.equal((await fetch(`${base}${path}`, { headers: { "x-test-actor": "other" } })).status, 403);
    }
    assert.equal((await upload("other")).status, 403);
    const list = await fetch(`${base}/api/quotations/${quote.id}/documents`, {
      headers: { "x-test-actor": "admin" },
    });
    const listed = await list.json();
    assert.equal(listed.documents.length, 2);
    assert.ok(listed.documents.every((item: any) => !("contents" in item) && !("objectPath" in item)));
    await db.delete(quotations).where(eq(quotations.id, quote.id));
    quotationId = undefined;
    assert.equal((await db.select().from(quotationDocumentContents)
      .where(inArray(quotationDocumentContents.documentId, savedIds))).length, 0);
  } finally {
    if (server) await new Promise<void>((resolve, reject) => server!.close(error => error ? reject(error) : resolve()));
    if (quotationId) await db.delete(quotations).where(eq(quotations.id, quotationId));
    await db.delete(users).where(inArray(users.id, ids));
    await pool.end();
  }
});
