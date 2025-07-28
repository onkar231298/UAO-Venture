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

// Products table - Enhanced for Website Management
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  productId: varchar("product_id", { length: 50 }).notNull().unique(), // BFI001, BFI002, etc.
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  specificationSheet: text("specification_sheet"), // HTML content for specifications
  
  // Product Classification
  botanicalName: varchar("botanical_name", { length: 255 }),
  plantPart: varchar("plant_part", { length: 100 }),
  origin: varchar("origin", { length: 100 }), // Country of Origin
  hsCode: varchar("hs_code", { length: 20 }), // HS Code
  categoryId: integer("category_id").references(() => categories.id),
  productType: varchar("product_type", { length: 50 }).default("organic"), // organic, conventional
  productGrade: varchar("product_grade", { length: 100 }), // Food Grade, Pharma Grade, etc.
  
  // Product Properties
  form: varchar("form", { length: 100 }), // powder, extract, oil, whole, etc.
  meshSize: varchar("mesh_size", { length: 50 }),
  curcuminContent: varchar("curcumin_content", { length: 50 }),
  moisture: varchar("moisture", { length: 50 }),
  totalAsh: varchar("total_ash", { length: 50 }),
  bulkDensity: varchar("bulk_density", { length: 50 }),
  shelfLife: varchar("shelf_life", { length: 50 }),
  storageConditions: text("storage_conditions"),
  processing: text("processing"),
  
  // Certifications and Compliance
  certifications: jsonb("certifications").default("[]"), // Array of certification objects
  isOrganic: boolean("is_organic").default(false),
  
  // Stock and Pricing
  currentStock: decimal("current_stock", { precision: 10, scale: 2 }).default("0"),
  stockUnit: varchar("stock_unit", { length: 20 }).default("kg"),
  packingSize: varchar("packing_size", { length: 100 }), // One unit packaging size (e.g., "25kg bag", "1kg pouch")
  moq: decimal("moq", { precision: 10, scale: 2 }), // Minimum order quantity
  leadTime: varchar("lead_time", { length: 100 }), // "5-7 days", "2-3 weeks"
  sampleAvailable: boolean("sample_available").default(true),
  stopSell: boolean("stop_sell").default(false),
  
  // Pricing Structure - Multi-Currency Support
  basePrice: decimal("base_price", { precision: 10, scale: 2 }),
  rate: decimal("rate", { precision: 10, scale: 4 }), // Price per unit (per gram, per kg, etc.)
  priceUnit: varchar("price_unit", { length: 20 }).default("kg"),
  currency: varchar("currency", { length: 5 }).default("USD"),
  
  // Multi-Currency Pricing
  priceUSD: decimal("price_usd", { precision: 10, scale: 4 }), // USD price per unit
  priceINR: decimal("price_inr", { precision: 10, scale: 4 }), // INR price per unit
  priceEUR: decimal("price_eur", { precision: 10, scale: 4 }), // EUR price per unit
  priceGBP: decimal("price_gbp", { precision: 10, scale: 4 }), // GBP price per unit
  
  // Price Type/Terms (Incoterms)
  priceType: varchar("price_type", { length: 50 }).default("EXW"), // EXW, FOB, CIF, CFR, DDP, DDU, etc.
  priceLocation: varchar("price_location", { length: 100 }).default("Warehouse India"), // Location for price terms
  
  bulkPricing: jsonb("bulk_pricing").default("[]"), // Array of pricing slabs with quantity, price, discount%
  pricingVisibility: varchar("pricing_visibility", { length: 50 }).default("logged_in"), // public, logged_in, request_quote
  
  // Media
  mainImage: varchar("main_image", { length: 500 }),
  galleryImages: jsonb("gallery_images").default("[]"), // Array of image URLs

  // Document URLs - Direct references for easy access
  coaDocument: varchar("coa_document", { length: 500 }), // Certificate of Analysis
  certDocument: varchar("cert_document", { length: 500 }), // Organic Certificate
  specDocument: varchar("spec_document", { length: 500 }), // Technical Specification Sheet
  msdsDocument: varchar("msds_document", { length: 500 }), // MSDS / Safety Data Sheet
  nonGmoDocument: varchar("non_gmo_document", { length: 500 }), // Non-GMO Statement
  businessLicense: varchar("business_license", { length: 500 }), // Business License
  registrationCert: varchar("registration_cert", { length: 500 }), // Certificate of Registration
  kosherCert: varchar("kosher_cert", { length: 500 }), // KOSHER-OK Certificate
  organicNopCert: varchar("organic_nop_cert", { length: 500 }), // Organic-NOP(USDA) Certificate
  additionalDocs: jsonb("additional_docs").default("[]"), // Array of additional document URLs
  
  // FAQ Section
  faqs: jsonb("faqs").default("[]"), // Array of {question: string, answer: string}
  
  // SEO and Visibility
  seoTitle: varchar("seo_title", { length: 255 }),
  seoDescription: text("seo_description"),
  canonicalUrl: varchar("canonical_url", { length: 500 }),
  openGraphImage: varchar("og_image", { length: 500 }),
  structuredData: jsonb("structured_data").default("{}"),
  
  // Status and Visibility
  status: varchar("status", { length: 20 }).default("draft"), // draft, active, inactive
  isVisible: boolean("is_visible").default(true), // Show/Hide on website
  isActive: boolean("is_active").default(true),
  isOrderable: boolean("is_orderable").default(true),
  
  // Internal Management
  internalNotes: text("internal_notes"), // For internal use only
  createdBy: varchar("created_by").references(() => users.id),
  updatedBy: varchar("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Product documents - Enhanced for Website Management
export const productDocuments = pgTable("product_documents", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id),
  type: varchar("type", { length: 100 }).notNull(), // COA, organic_certificate, technical_sheet, msds, allergen_statement, other
  title: varchar("title", { length: 255 }).notNull(), // User-defined document title
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileUrl: varchar("file_url", { length: 500 }).notNull(),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type", { length: 100 }),
  isVisibleToCustomers: boolean("is_visible_to_customers").default(true),
  batchNumber: varchar("batch_number", { length: 100 }), // For batch-specific documents
  version: varchar("version", { length: 50 }).default("1.0"), // Document versioning
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Product tags for filtering and SEO
export const productTags = pgTable("product_tags", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  color: varchar("color", { length: 7 }).default("#3B82F6"), // Hex color for UI
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Product-Tag relationship (many-to-many)
export const productTagRelations = pgTable("product_tag_relations", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id),
  tagId: integer("tag_id").references(() => productTags.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Hero slider management for homepage
export const heroSliders = pgTable("hero_sliders", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  subtitle: text("subtitle"),
  imageUrl: varchar("image_url", { length: 500 }).notNull(),
  buttonText: varchar("button_text", { length: 100 }),
  buttonUrl: varchar("button_url", { length: 500 }),
  isExternal: boolean("is_external").default(false), // For external URLs
  status: varchar("status", { length: 20 }).default("active"), // active, inactive
  sortOrder: integer("sort_order").default(0), // For ordering slides
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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

// Customer inquiries - Enhanced for high volume bidding
export const inquiries = pgTable("inquiries", {
  id: serial("id").primaryKey(),
  inquiryId: varchar("inquiry_id", { length: 50 }).notNull().unique(),
  customerId: varchar("customer_id").references(() => users.id),
  productId: integer("product_id").references(() => products.id),
  
  // Contact Information (for non-logged users)
  contactName: varchar("contact_name", { length: 255 }),
  companyName: varchar("company_name", { length: 255 }),
  phoneNumber: varchar("phone_number", { length: 20 }),
  emailAddress: varchar("email_address", { length: 255 }),
  
  // Inquiry Details
  inquiryType: varchar("inquiry_type", { length: 50 }).default("bulk_order"), // bulk_order, high_volume_bid, quote_request
  quantity: decimal("quantity", { precision: 10, scale: 2 }),
  unit: varchar("unit", { length: 50 }),
  targetPrice: decimal("target_price", { precision: 10, scale: 2 }), // For bidding
  expectedDelivery: timestamp("expected_delivery"),
  message: text("message"),
  urgency: varchar("urgency", { length: 50 }).default("normal"), // urgent, normal, low
  status: varchar("status", { length: 50 }).default("pending"), // pending, quoted, converted, closed
  assignedTo: varchar("assigned_to").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sample requests - New table for sample requests
export const sampleRequests = pgTable("sample_requests", {
  id: serial("id").primaryKey(),
  requestId: varchar("request_id", { length: 50 }).notNull().unique(),
  customerId: varchar("customer_id").references(() => users.id),
  productId: integer("product_id").references(() => products.id),
  
  // Contact Information (for non-logged users)
  contactName: varchar("contact_name", { length: 255 }).notNull(),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
  emailAddress: varchar("email_address", { length: 255 }).notNull(),
  
  // Sample Details
  sampleSize: varchar("sample_size", { length: 50 }).default("25g"), // 25g, 50g, 100g
  purpose: varchar("purpose", { length: 100 }).notNull(), // testing, analysis, product_development, etc.
  expectedOrderQuantity: decimal("expected_order_quantity", { precision: 10, scale: 2 }),
  message: text("message"),
  
  // Shipping Details
  shippingAddress: text("shipping_address").notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 100 }).notNull(),
  postalCode: varchar("postal_code", { length: 20 }).notNull(),
  country: varchar("country", { length: 100 }).notNull(),
  
  status: varchar("status", { length: 50 }).default("pending"), // pending, approved, shipped, completed, rejected
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
  tagRelations: many(productTagRelations),
  creator: one(users, { fields: [products.createdBy], references: [users.id] }),
  updater: one(users, { fields: [products.updatedBy], references: [users.id] }),
}));

export const productTagsRelations = relations(productTags, ({ many }) => ({
  productRelations: many(productTagRelations),
}));

export const productTagRelationsRelations = relations(productTagRelations, ({ one }) => ({
  product: one(products, { fields: [productTagRelations.productId], references: [products.id] }),
  tag: one(productTags, { fields: [productTagRelations.tagId], references: [productTags.id] }),
}));

export const heroSlidersRelations = relations(heroSliders, ({ one }) => ({
  creator: one(users, { fields: [heroSliders.createdBy], references: [users.id] }),
}));

export const inquiriesRelations = relations(inquiries, ({ one, many }) => ({
  customer: one(users, { fields: [inquiries.customerId], references: [users.id] }),
  product: one(products, { fields: [inquiries.productId], references: [products.id] }),
  assignedUser: one(users, { fields: [inquiries.assignedTo], references: [users.id] }),
  quotations: many(quotations),
}));

export const sampleRequestsRelations = relations(sampleRequests, ({ one }) => ({
  customer: one(users, { fields: [sampleRequests.customerId], references: [users.id] }),
  product: one(products, { fields: [sampleRequests.productId], references: [products.id] }),
  assignedUser: one(users, { fields: [sampleRequests.assignedTo], references: [users.id] }),
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
}).extend({
  productId: z.string().optional(), // Auto-generated if not provided
  slug: z.string().optional(), // Auto-generated from name if not provided
  currentStock: z.union([z.string(), z.number()]).transform(val => String(val)).optional(),
  packingSize: z.string().optional(),
  moq: z.union([z.string(), z.number()]).transform(val => String(val)).optional(),
  basePrice: z.union([z.string(), z.number()]).transform(val => String(val)).optional(),
  rate: z.union([z.string(), z.number()]).transform(val => String(val)).optional(),
  priceUSD: z.union([z.string(), z.number()]).transform(val => String(val)).optional(),
  priceINR: z.union([z.string(), z.number()]).transform(val => String(val)).optional(),
  priceEUR: z.union([z.string(), z.number()]).transform(val => String(val)).optional(),
  priceGBP: z.union([z.string(), z.number()]).transform(val => String(val)).optional(),
  priceType: z.string().optional(),
  priceLocation: z.string().optional(),
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertProductTagSchema = createInsertSchema(productTags).omit({
  id: true,
  createdAt: true,
}).extend({
  slug: z.string().optional(), // Auto-generated from name if not provided
});

export const insertHeroSliderSchema = createInsertSchema(heroSliders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSampleRequestSchema = createInsertSchema(sampleRequests).omit({
  id: true,
  requestId: true,
  createdAt: true,
  updatedAt: true,
});

// Enhanced inquiry schema for high volume bidding
export const insertInquirySchema = createInsertSchema(inquiries).omit({
  id: true,
  inquiryId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductDocumentSchema = createInsertSchema(productDocuments).omit({
  id: true,
  createdAt: true,
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
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type ProductDocument = typeof productDocuments.$inferSelect;
export type InsertProductDocument = z.infer<typeof insertProductDocumentSchema>;
export type ProductTag = typeof productTags.$inferSelect;
export type InsertProductTag = z.infer<typeof insertProductTagSchema>;
export type HeroSlider = typeof heroSliders.$inferSelect;
export type InsertHeroSlider = z.infer<typeof insertHeroSliderSchema>;
export type SampleRequest = typeof sampleRequests.$inferSelect;
export type InsertSampleRequest = z.infer<typeof insertSampleRequestSchema>;
export type Inventory = typeof inventory.$inferSelect;
export type SalesOrder = typeof salesOrders.$inferSelect;
export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
