import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { manualSalesOrderSchema, calculateSalesOrderTotals } from "@shared/salesOrderContract";
import { generateSalesOrderContractPdf } from "./salesOrderContractPdf";
import { createEmptySalesOrderDraft, prefillManualSalesOrder, type SalesOrderQuotationSource } from "../client/src/lib/quotationToSalesOrderPrefill";

function fixture() {
  return manualSalesOrderSchema.parse({
    contractNumber: "SAMPLE-CONTRACT", contractDate: "2026-10-23",
    proformaNumber: "SAMPLE-PI", proformaDate: "2026-10-23",
    seller: { name: "Atlas Ingredients — SAMPLE", address: "Sample issuer address, India", email: "sample@example.invalid" },
    buyer: { name: "SAMPLE BUYER — NOT A REAL ORDER", address: "Sample buyer address" },
    consignee: { name: "Sample Consignee", address: "Sample warehouse address" },
    notifyParty: { name: "Sample Notify Party", address: "Sample notify address" },
    currency: "USD",
    items: [
      { productName: "Sample ingredient powder — manually entered description", hsnCode: "TEST-HS", totalBags: 4, quantity: 100, unit: "KG", unitPrice: 12.50 },
      { productName: "Sample botanical extract", hsnCode: "TEST-HS2", totalBags: 2, quantity: 50, unit: "KG", unitPrice: 20 },
    ],
    packingDetails: "Packing in 25 kg bags",
    paymentTerms: "30% advance, balance before shipment",
    lcType: "Not applicable",
    leadTime: "30 days after order confirmation",
    priceTerms: "FOB — sample port",
    portOfLoading: "Sample loading port", portOfDischarge: "Sample discharge port",
    finalDestination: "Sample destination", destinationCountry: "Sample country",
    bank: { name: "Sample bank — no payment instructions", branch: "Sample branch" },
    authorisedSignatory: "Sample authorised person", signatoryDesignation: "Sales",
    additionalTerms: "SAMPLE DOCUMENT ONLY — NOT VALID FOR PAYMENT OR SHIPMENT",
    advancePercent: 30, creditDays: 0, discountPercent: 0, taxPercent: 0,
  });
}

function pdfOrder(data = fixture()) {
  const totals = calculateSalesOrderTotals(data);
  return {
    soNumber: "SAMPLE-SO",
    contractDetails: data,
    ...totals,
    items: data.items.map((item, index) => ({
      ...item, quantity: item.quantity.toFixed(2), unitPrice: item.unitPrice.toFixed(2), totalPrice: totals.lineTotals[index],
    })),
  };
}

test("manual SO validation requires entered parties, dates and rates", () => {
  assert.equal(manualSalesOrderSchema.safeParse({}).success, false);
  const draft = fixture();
  assert.equal(manualSalesOrderSchema.safeParse({ ...draft, contractDate: "2026-02-31" }).success, false);
  assert.equal(manualSalesOrderSchema.safeParse({ ...draft, items: [{ ...draft.items[0], unitPrice: "" }] }).success, false);
  assert.equal(manualSalesOrderSchema.safeParse({ ...draft, items: [{ ...draft.items[0], quantity: -1 }] }).success, false);
});

test("manual SO totals use entered lines and round each financial amount consistently", () => {
  const data = fixture();
  const result = calculateSalesOrderTotals({
    items: [{ ...data.items[0], quantity: 2.55, unitPrice: 3.95 }],
    discountPercent: 10, taxPercent: 5,
  });
  assert.deepEqual(result, { lineTotals: ["10.07"], subtotal: "10.07", discountAmount: "1.01", taxAmount: "0.45", totalAmount: "9.51" });
  assert.throws(() => calculateSalesOrderTotals({
    items: [{ ...data.items[0], quantity: 99999999, unitPrice: 9999999999 }], discountPercent: 0, taxPercent: 0,
  }), /exceeds/);
});

test("manual SO form pre-fills editable details from the quote, inquiry, account, and company", () => {
  const source: SalesOrderQuotationSource = {
    quotationId: "QUO-123",
    createdAt: "2026-10-20T10:00:00.000Z",
    currency: "EUR",
    priceType: "FOB",
    paymentTerms: "30% advance",
    leadTime: "Three weeks",
    terms: "Quoted export terms",
    notes: "Sales follow-up note",
    customerCity: "Milan",
    customerCountry: "Italy",
    discountPercent: "5.00",
    includeGst: true,
    gstPercentage: "18.00",
    sellerGstin: "SELLER-GST",
    inquiry: {
      companyName: "Buyer Company",
      contactName: "Buyer Contact",
      emailAddress: "buyer@example.com",
      phoneNumber: "+390000000",
      packagingPreference: "25 kg bags",
      expectedDelivery: "2026-12-01T00:00:00.000Z",
    },
    companyProfile: {
      companyName: "Company Directory Name",
      primaryEmail: "company@example.com",
      primaryPhone: "+391111111",
      addressStreet: "Company street",
      addressCity: "Turin",
      addressCountry: "Italy",
      factoryAddressStreet: "Warehouse road",
      factoryAddressCity: "Genoa",
      factoryAddressCountry: "Italy",
    },
    primaryContact: { contactName: "Company Contact", email: "contact@example.com", phone: "+392222222" },
    customerProfile: {
      firstName: "Account",
      lastName: "User",
      email: "account@example.com",
      companyName: "Account Company",
    },
    items: [{
      productName: "Organic Pepper",
      productHsCode: "090411",
      specifications: "Whole, export grade",
      quantity: "1200.00",
      unit: "KG",
      unitPrice: "4.25",
      totalPrice: "5100.00",
    }],
  };

  const draft = prefillManualSalesOrder(source, createEmptySalesOrderDraft());
  assert.equal(draft.contractNumber, "QUO-123");
  assert.equal(draft.currency, "EUR");
  assert.equal(draft.buyer.name, "Buyer Company");
  assert.equal(draft.buyer.contactName, "Buyer Contact");
  assert.equal(draft.buyer.email, "buyer@example.com");
  assert.equal(draft.buyer.address, "Milan, Italy");
  assert.equal(draft.consignee.address, "Warehouse road, Genoa, Italy");
  assert.equal(draft.items[0].productName, "Organic Pepper — Whole, export grade");
  assert.equal(draft.items[0].hsnCode, "090411");
  assert.equal(draft.items[0].quantity, "1200.00");
  assert.equal(draft.items[0].unitPrice, "4.25");
  assert.equal(draft.paymentTerms, "30% advance");
  assert.equal(draft.leadTime, "Three weeks");
  assert.equal(draft.priceTerms, "FOB");
  assert.equal(draft.packingDetails, "25 kg bags");
  assert.equal(draft.additionalTerms, "Quoted export terms");
  assert.equal(draft.seller.gstNumber, "SELLER-GST");
  assert.equal(draft.discountPercent, "5.00");
  assert.equal(draft.taxPercent, "18.00");
  assert.equal(draft.expectedDeliveryDate, "2026-12-01");
  assert.equal(draft.bank.accountNumber, "");
});

test("sample contract PDF supports both normal and long multi-page documents", async () => {
  const sample = await generateSalesOrderContractPdf(pdfOrder());
  assert.equal(sample.subarray(0, 5).toString(), "%PDF-");
  await writeFile("/tmp/atlas-sales-order-format.pdf", sample);
  const long = fixture();
  long.paymentTerms = "Long readable payment terms for pagination verification. ".repeat(65);
  long.items = Array.from({ length: 35 }, (_, index) => ({ ...long.items[0], productName: `Sample item ${index + 1} with a longer description for wrapping` }));
  const multipage = await generateSalesOrderContractPdf(pdfOrder(long));
  await writeFile("/tmp/atlas-sales-order-format-long.pdf", multipage);
  assert.ok(multipage.length > sample.length);
});

test("manual order saves entered data, preserves assignment and blocks duplicate creation", {
  skip: process.env.TEST_MANUAL_SO_DB !== "1",
}, async () => {
  const { db, pool } = await import("./db");
  const { storage } = await import("./storage");
  const { users, quotations, salesOrders, salesOrderItems, salesOrderActivities, salesOrderStatusHistory } = await import("@shared/schema");
  const { eq, inArray } = await import("drizzle-orm");
  const rep = randomUUID();
  let quoteId: number | undefined;
  try {
    await db.insert(users).values({ id: rep, email: `${rep}@example.invalid`, role: "sales_executive", userType: "staff" });
    const [quote] = await db.insert(quotations).values({
      quotationId: `TEST-${randomUUID()}`, status: "draft", createdBy: rep,
      totalAmount: "999.00", customerCompanyName: "Do not copy this quotation buyer",
    }).returning({ id: quotations.id });
    quoteId = quote.id;
    const manual = fixture();
    const result = await storage.createSalesOrderFromQuotation(quote.id, { createdBy: rep, manualOrder: manual });
    assert.equal(result.assignedToUserId, rep);
    assert.equal(result.totalAmount, "2250.00");
    assert.equal(result.customerCompanyName, manual.buyer.name);
    assert.deepEqual(result.contractDetails, manual);
    const [unchangedQuote] = await db.select().from(quotations).where(eq(quotations.id, quote.id));
    assert.equal(unchangedQuote.totalAmount, "999.00");
    assert.equal(unchangedQuote.customerCompanyName, "Do not copy this quotation buyer");
    assert.equal(unchangedQuote.status, "draft");
    assert.equal(unchangedQuote.salesOrderId, result.id);
    const [creationActivity] = await db.select().from(salesOrderActivities).where(eq(salesOrderActivities.salesOrderId, result.id));
    assert.equal((creationActivity.metadata as Record<string, unknown>).quotationStatusAtOrderCreation, "draft");
    const items = await storage.getSalesOrderItems(result.id);
    assert.equal(items.length, 2);
    assert.equal(items[0].productName, manual.items[0].productName);
    await assert.rejects(storage.createSalesOrderFromQuotation(quote.id, { createdBy: rep, manualOrder: manual }), /already converted/);
    const listed = await storage.getSalesOrders({ assignedToUserId: rep });
    assert.equal(listed.total, 1);
    const pdf = await storage.generateSalesOrderPdf(result.id);
    assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
  } finally {
    if (quoteId) {
      const orders = await db.select({ id: salesOrders.id }).from(salesOrders).where(eq(salesOrders.quotationId, quoteId));
      const orderIds = orders.map(order => order.id);
      if (orderIds.length) {
        await db.delete(salesOrderItems).where(inArray(salesOrderItems.salesOrderId, orderIds));
        await db.delete(salesOrderActivities).where(inArray(salesOrderActivities.salesOrderId, orderIds));
        await db.delete(salesOrderStatusHistory).where(inArray(salesOrderStatusHistory.salesOrderId, orderIds));
        await db.delete(salesOrders).where(inArray(salesOrders.id, orderIds));
      }
      await db.delete(quotations).where(eq(quotations.id, quoteId));
    }
    await db.delete(users).where(eq(users.id, rep));
    await pool.end();
  }
});
