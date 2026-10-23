import { z } from "zod";

const text = (max = 2000) => z.string().trim().max(max).default("");
const required = (max = 2000) => z.string().trim().min(1, "This field is required").max(max);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date")
  .refine(value => !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value, "Choose a valid date");
const party = z.object({
  name: required(255),
  address: required(2000),
  contactName: text(255),
  email: z.union([z.literal(""), z.string().trim().email()]).default(""),
  phone: text(100),
});
const decimal = (max: number) => z.coerce.number().finite().min(0).max(max)
  .refine(value => Math.abs(value * 100 - Math.round(value * 100)) < 0.001, "Use at most 2 decimal places");

export const manualSalesOrderSchema = z.object({
  contractNumber: required(100),
  contractDate: date,
  proformaNumber: required(100),
  proformaDate: date,
  seller: z.object({
    name: required(255), address: required(2000), phone: text(100),
    email: z.union([z.literal(""), z.string().trim().email()]).default(""),
    website: text(255), gstNumber: text(50), iecNumber: text(50),
  }),
  buyer: party,
  consignee: party,
  notifyParty: party,
  currency: z.string().regex(/^[A-Z]{3}$/, "Enter a 3-letter currency code"),
  items: z.array(z.object({
    productName: required(1000),
    hsnCode: text(30),
    totalBags: z.coerce.number().int().min(0).max(100000000).default(0),
    quantity: decimal(99999999.99).refine(value => value > 0, "Quantity must be greater than zero"),
    unit: required(50),
    unitPrice: z.preprocess(value => typeof value === "string" && !value.trim() ? undefined : value, decimal(9999999999.99)),
    batchNumber: text(100),
  })).min(1, "Enter at least one product").max(100),
  packingDetails: text(3000),
  paymentTerms: required(5000),
  lcType: text(2000),
  leadTime: required(2000),
  priceTerms: required(1000),
  portOfLoading: text(255),
  portOfDischarge: text(255),
  finalDestination: text(1000),
  destinationCountry: text(255),
  bank: z.object({
    name: text(255), branch: text(255), accountName: text(255), accountNumber: text(100),
    ifsc: text(100), swift: text(100), address: text(2000),
  }),
  authorisedSignatory: text(255),
  signatoryDesignation: text(255),
  additionalTerms: text(10000),
  internalNotes: text(10000),
  expectedDeliveryDate: z.union([date, z.literal("")]).default(""),
  advancePercent: decimal(100).default(0),
  creditDays: z.coerce.number().int().min(0).max(3650).default(0),
  discountPercent: decimal(100).default(0),
  taxPercent: decimal(100).default(0),
});

export type ManualSalesOrder = z.infer<typeof manualSalesOrderSchema>;

// Use integer hundredths so client previews and persisted totals round identically.
export function calculateSalesOrderTotals(order: Pick<ManualSalesOrder, "items" | "discountPercent" | "taxPercent">) {
  const scaled = (value: number) => BigInt(Math.round(value * 100));
  const hundred = BigInt(100);
  const money = (value: bigint) => `${value / hundred}.${(value % hundred).toString().padStart(2, "0")}`;
  const rounded = (value: bigint, divisor: bigint) => (value + divisor / BigInt(2)) / divisor;
  const lines = order.items.map(item => rounded(scaled(item.quantity) * scaled(item.unitPrice), hundred));
  const subtotal = lines.reduce((sum, value) => sum + value, BigInt(0));
  const discount = rounded(subtotal * scaled(order.discountPercent), BigInt(10000));
  const tax = rounded((subtotal - discount) * scaled(order.taxPercent), BigInt(10000));
  const total = subtotal - discount + tax;
  if ([...lines, subtotal, tax, discount, total].some(value => value < BigInt(0) || value > BigInt(999999999999))) {
    throw new Error("Order amount exceeds the supported limit");
  }
  return {
    lineTotals: lines.map(money),
    subtotal: money(subtotal),
    discountAmount: money(discount),
    taxAmount: money(tax),
    totalAmount: money(total),
  };
}
