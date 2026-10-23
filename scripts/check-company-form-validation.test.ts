import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { getTableColumns } from "drizzle-orm";
import { createFormControl } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { companies } from "../shared/schema";
import { companyLengthErrors } from "../server/companyValidation";
import { companySchema, companyEditSchema } from "../client/src/lib/companyFormSchemas";
import { applyCompanyServerErrors } from "../client/src/lib/companyFormValidation";
import { apiRequest, ApiRequestError } from "../client/src/lib/queryClient";

for (const [role, schema] of [["Admin", companySchema], ["Sales", companyEditSchema]] as const) {
  test(`${role}: all bounded form fields match the database at and over the limit`, () => {
    const fields = schema.innerType().shape;
    for (const [field, column] of Object.entries(getTableColumns(companies))) {
      if (!(field in fields) || !("length" in column) || typeof column.length !== "number") continue;
      const value = field === "primaryEmail"
        ? `${"a".repeat(column.length - 12)}@example.com`
        : "😀".repeat(column.length);
      const data = { companyName: "Example", [field]: value };
      assert.equal(schema.safeParse(data).success, true, `${field}: exact limit`);
      const invalid = { ...data, [field]: `a${value}` };
      const result = schema.safeParse(invalid);
      assert.equal(result.success, false, `${field}: over limit`);
      if (!result.success) {
        const issue = result.error.issues.find(issue => issue.path[0] === field);
        assert.equal(issue?.message, companyLengthErrors(invalid)[0].message);
      }
    }
  });

  test(`${role}: phone and text addresses stay unrestricted; existing rules and options remain`, () => {
    const values = {
      companyName: "Example",
      primaryPhone: "+91 1234567890, +44 1234567890; ".repeat(200),
      addressStreet: "Long address ".repeat(200),
      ...(role === "Admin" ? {
        factoryAddressStreet: "Warehouse ".repeat(200),
        departmentPhones: [{ department: "Sales", phone: "+1 1234567890" }],
        additionalEmails: [{ position: "Owner", email: "owner@example.com" }],
      } : {}),
    };
    assert.deepEqual(schema.parse(values), values);
    assert.equal(schema.safeParse({ companyName: "" }).success, false);
    assert.equal(schema.safeParse({ companyName: "Example", primaryEmail: "not email" }).success, false);
    assert.equal(schema.safeParse({ companyName: "Example", primaryEmail: "" }).success, true);
  });

  test(`${role}: errors appear on change, block submission, and clear when corrected`, async () => {
    const form = createFormControl({
      resolver: zodResolver(schema),
      mode: "onChange",
      defaultValues: { companyName: "Example", addressZip: "" },
    });
    const unsubscribe = form.subscribe({ formState: { errors: true }, callback: () => {} });
    const zip = form.register("addressZip");
    await zip.onChange({ target: { name: "addressZip", value: "1".repeat(21) }, type: "change" });
    assert.match(form.getFieldState("addressZip").error?.message ?? "", /20 characters or fewer/);
    let writes = 0;
    await form.handleSubmit(() => { writes++; })();
    assert.equal(writes, 0);
    assert.equal(form.getValues("addressZip"), "1".repeat(21));
    await zip.onChange({ target: { name: "addressZip", value: "12345" }, type: "change" });
    assert.equal(form.getFieldState("addressZip").error, undefined);
    await form.handleSubmit(() => { writes++; })();
    assert.equal(writes, 1);
    unsubscribe();
  });
}

test("HTTP rejection keeps entered values and maps only known field errors", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response(JSON.stringify({
      message: "Rejected",
      errors: [
        { field: "addressZip", message: "ZIP rejected by server" },
        { field: "unknown", message: "Not a form field" },
        null,
      ],
    }), { status: 400 });
    const form = createFormControl({ defaultValues: { companyName: "Entered name", addressZip: "12345" } });
    const unsubscribe = form.subscribe({ formState: { errors: true }, callback: () => {} });
    const before = form.getValues();
    await assert.rejects(async () => {
      try {
        await apiRequest("/api/crm/companies/1/update", { method: "POST", body: JSON.stringify(before) });
      } catch (error) {
        assert.ok(error instanceof ApiRequestError);
        applyCompanyServerErrors(error, form);
        throw error;
      }
    }, ApiRequestError);
    assert.deepEqual(form.getValues(), before);
    assert.equal(form.getFieldState("addressZip").error?.message, "ZIP rejected by server");
    assert.equal(form.getFieldState("unknown" as "addressZip").error, undefined);
    applyCompanyServerErrors(new Error("Network interruption"), form);
    assert.deepEqual(form.getValues(), before);
    unsubscribe();
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("both routed edit screens wire live validation and retain dialogs on rejection", () => {
  for (const file of ["CompanyManagement", "MyCompanies"]) {
    const source = readFileSync(`client/src/pages/crm/${file}.tsx`, "utf8");
    assert.match(source, /resolver: zodResolver\(company(?:Edit)?Schema\),\s+mode: "onChange"/);
    assert.match(source, /onError: \(error: Error\) => \{\s+applyCompanyServerErrors\(error, editForm\)/);
    assert.match(source, /<FormMessage \/>/);
  }
});
