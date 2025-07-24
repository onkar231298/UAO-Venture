import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  decimal,
  boolean,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth and role management
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("customer"), // customer, super_admin, admin, sales_manager, sales_executive, purchase_manager, purchase_executive, inventory_manager, inventory_executive, logistics_manager, logistics_executive, accounts_manager, accounts_executive, seo_manager, website_manager
  companyName: varchar("company_name"),
  phoneNumber: varchar("phone_number"),
  address: text("address"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Product categories
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  parentId: integer("parent_id"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Products table
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  productId: varchar("product_id", { length: 50 }).notNull().unique(), // BFI001, BFI002, etc.
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  botanicalName: varchar("botanical_name", { length: 255 }),
  plantPart: varchar("plant_part", { length: 100 }),
  origin: varchar("origin", { length: 100 }),
  processing: text("processing"),
  categoryId: integer("category_id").references(() => categories.id),
  form: varchar("form", { length: 100 }), // powder, extract, oil, whole, etc.
  meshSize: varchar("mesh_size", { length: 50 }),
  curcuminContent: varchar("curcumin_content", { length: 50 }),
  moisture: varchar("moisture", { length: 50 }),
  totalAsh: varchar("total_ash", { length: 50 }),
  bulkDensity: varchar("bulk_density", { length: 50 }),
  shelfLife: varchar("shelf_life", { length: 50 }),
  storageConditions: text("storage_conditions"),
  certifications: jsonb("certifications"), // Array of certification names
  isOrganic: boolean("is_organic").default(false),
  isActive: boolean("is_active").default(true),
  isOrderable: boolean("is_orderable").default(true),
  moq: integer("moq"), // Minimum order quantity
  unit: varchar("unit", { length: 50 }).default("kg"),
  images: jsonb("images"), // Array of image URLs
  seoTitle: varchar("seo_title", { length: 255 }),
  seoDescription: text("seo_description"),
  seoKeywords: text("seo_keywords"),
  structuredData: jsonb("structured_data"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Product documents
export const productDocuments = pgTable("product_documents", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id),
  type: varchar("type", { length: 100 }).notNull(), // COA, certificate, specification, MSDS, etc.
  name: varchar("name", { length: 255 }).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileUrl: varchar("file_url", { length: 500 }).notNull(),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type", { length: 100 }),
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Inventory tracking
export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id),
  batchNumber: varchar("batch_number", { length: 100 }),
  lotNumber: varchar("lot_number", { length: 100 }),
  quantityInStock: decimal("quantity_in_stock", { precision: 10, scale: 2 }).default("0"),
  unit: varchar("unit", { length: 50 }).default("kg"),
  expiryDate: timestamp("expiry_date"),
  manufacturingDate: timestamp("manufacturing_date"),
  location: varchar("location", { length: 255 }),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Customer inquiries
export const inquiries = pgTable("inquiries", {
  id: serial("id").primaryKey(),
  inquiryId: varchar("inquiry_id", { length: 50 }).notNull().unique(),
  customerId: varchar("customer_id").references(() => users.id),
  productId: integer("product_id").references(() => products.id),
  quantity: decimal("quantity", { precision: 10, scale: 2 }),
  unit: varchar("unit", { length: 50 }),
  message: text("message"),
  urgency: varchar("urgency", { length: 50 }).default("normal"), // urgent, normal, low
  status: varchar("status", { length: 50 }).default("pending"), // pending, quoted, converted, closed
  assignedTo: varchar("assigned_to").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Quotations
export const quotations = pgTable("quotations", {
  id: serial("id").primaryKey(),
  quotationId: varchar("quotation_id", { length: 50 }).notNull().unique(),
  inquiryId: integer("inquiry_id").references(() => inquiries.id),
  customerId: varchar("customer_id").references(() => users.id),
  validUntil: timestamp("valid_until"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }),
  status: varchar("status", { length: 50 }).default("draft"), // draft, sent, accepted, rejected, expired
  terms: text("terms"),
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Quotation items
export const quotationItems = pgTable("quotation_items", {
  id: serial("id").primaryKey(),
  quotationId: integer("quotation_id").references(() => quotations.id),
  productId: integer("product_id").references(() => products.id),
  quantity: decimal("quantity", { precision: 10, scale: 2 }),
  unit: varchar("unit", { length: 50 }),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }),
  specifications: text("specifications"),
});

// Sales orders
export const salesOrders = pgTable("sales_orders", {
  id: serial("id").primaryKey(),
  orderId: varchar("order_id", { length: 50 }).notNull().unique(),
  quotationId: integer("quotation_id").references(() => quotations.id),
  customerId: varchar("customer_id").references(() => users.id),
  orderDate: timestamp("order_date").defaultNow(),
  expectedDelivery: timestamp("expected_delivery"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }),
  status: varchar("status", { length: 50 }).default("pending"), // pending, confirmed, processing, shipped, delivered, cancelled
  paymentStatus: varchar("payment_status", { length: 50 }).default("pending"), // pending, partial, paid
  paymentTerms: varchar("payment_terms", { length: 100 }),
  shippingAddress: text("shipping_address"),
  billingAddress: text("billing_address"),
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Purchase orders
export const purchaseOrders = pgTable("purchase_orders", {
  id: serial("id").primaryKey(),
  poId: varchar("po_id", { length: 50 }).notNull().unique(),
  vendorId: varchar("vendor_id").references(() => users.id),
  orderDate: timestamp("order_date").defaultNow(),
  expectedDelivery: timestamp("expected_delivery"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }),
  status: varchar("status", { length: 50 }).default("pending"), // pending, confirmed, received, cancelled
  paymentStatus: varchar("payment_status", { length: 50 }).default("pending"),
  terms: text("terms"),
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  inquiries: many(inquiries),
  quotations: many(quotations),
  salesOrders: many(salesOrders),
  purchaseOrders: many(purchaseOrders),
  uploadedDocuments: many(productDocuments),
}));

export const categoriesRelations = relations(categories, ({ many, one }) => ({
  products: many(products),
  parent: one(categories, { fields: [categories.parentId], references: [categories.id] }),
  children: many(categories),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  documents: many(productDocuments),
  inventory: many(inventory),
  inquiries: many(inquiries),
  quotationItems: many(quotationItems),
}));

export const inquiriesRelations = relations(inquiries, ({ one, many }) => ({
  customer: one(users, { fields: [inquiries.customerId], references: [users.id] }),
  product: one(products, { fields: [inquiries.productId], references: [products.id] }),
  assignedUser: one(users, { fields: [inquiries.assignedTo], references: [users.id] }),
  quotations: many(quotations),
}));

export const quotationsRelations = relations(quotations, ({ one, many }) => ({
  inquiry: one(inquiries, { fields: [quotations.inquiryId], references: [inquiries.id] }),
  customer: one(users, { fields: [quotations.customerId], references: [users.id] }),
  createdByUser: one(users, { fields: [quotations.createdBy], references: [users.id] }),
  items: many(quotationItems),
  salesOrders: many(salesOrders),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
  role: true,
  companyName: true,
  phoneNumber: true,
  address: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInquirySchema = createInsertSchema(inquiries).omit({
  id: true,
  inquiryId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertQuotationSchema = createInsertSchema(quotations).omit({
  id: true,
  quotationId: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;
export type InsertInquiry = z.infer<typeof insertInquirySchema>;
export type Inquiry = typeof inquiries.$inferSelect;
export type InsertQuotation = z.infer<typeof insertQuotationSchema>;
export type Quotation = typeof quotations.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type ProductDocument = typeof productDocuments.$inferSelect;
export type Inventory = typeof inventory.$inferSelect;
export type SalesOrder = typeof salesOrders.$inferSelect;
export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
