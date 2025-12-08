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
  foreignKey,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
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

// Staff Departments
export const STAFF_DEPARTMENTS = [
  "sales",
  "purchase", 
  "inventory",
  "logistics",
  "accounts",
  "marketing",
  "admin",
] as const;

export type StaffDepartment = typeof STAFF_DEPARTMENTS[number];

// Staff Roles by Department
export const STAFF_ROLES = {
  sales: ["sales_manager", "sales_executive"],
  purchase: ["purchase_manager", "purchase_executive"],
  inventory: ["inventory_manager", "inventory_executive"],
  logistics: ["logistics_manager", "logistics_executive"],
  accounts: ["accounts_manager", "accounts_executive"],
  marketing: ["seo_manager", "website_manager"],
  admin: ["super_admin", "admin"],
} as const;

export const ALL_STAFF_ROLES = [
  "super_admin",
  "admin",
  "sales_manager",
  "sales_executive",
  "purchase_manager",
  "purchase_executive",
  "inventory_manager",
  "inventory_executive",
  "logistics_manager",
  "logistics_executive",
  "accounts_manager",
  "accounts_executive",
  "seo_manager",
  "website_manager",
] as const;

export type StaffRole = typeof ALL_STAFF_ROLES[number];

// User storage table for Replit Auth and role management
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  password: varchar("password"), // For customer authentication
  role: varchar("role").default("customer"), // customer, super_admin, admin, sales_manager, sales_executive, purchase_manager, purchase_executive, inventory_manager, inventory_executive, logistics_manager, logistics_executive, accounts_manager, accounts_executive, seo_manager, website_manager
  userType: varchar("user_type").default("customer"), // staff, customer
  department: varchar("department"), // sales, purchase, inventory, logistics, accounts, marketing, admin
  companyName: varchar("company_name"),
  phoneNumber: varchar("phone_number"),
  address: text("address"), // Legacy field, kept for compatibility
  streetAddress: varchar("street_address", { length: 500 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  postalCode: varchar("postal_code", { length: 20 }),
  country: varchar("country"),
  industryType: varchar("industry_type"),
  accountStatus: varchar("account_status").default("active"), // pending, active, suspended
  referralSource: varchar("referral_source"),
  registrationIp: varchar("registration_ip"),
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
  imageUrl: varchar("image_url", { length: 1000 }), // Category image (increased for object storage URLs)
  parentId: integer("parent_id"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Hero slides for homepage
export const heroSlides = pgTable("hero_slides", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  subtitle: varchar("subtitle", { length: 255 }),
  description: text("description"),
  backgroundImage: varchar("background_image", { length: 500 }).notNull(),
  textColor: varchar("text_color", { length: 20 }).default("white"), // white, black
  buttonText: varchar("button_text", { length: 100 }),
  buttonLink: varchar("button_link", { length: 500 }),
  displayOrder: integer("display_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Blog posts for SEO content
export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  metaTitle: varchar("meta_title", { length: 255 }),
  metaDescription: text("meta_description"),
  tags: text("tags").array(),
  category: varchar("category", { length: 100 }), // industry-trends, certifications, education
  authorId: varchar("author_id").references(() => users.id),
  publishedAt: timestamp("published_at"),
  isPublished: boolean("is_published").default(false),
  featuredImage: varchar("featured_image", { length: 500 }),
  readingTime: integer("reading_time"), // in minutes
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// FAQ for products
export const productFaqs = pgTable("product_faqs", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id).notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  displayOrder: integer("display_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// SEO monitoring and tracking
export const seoMonitoring = pgTable("seo_monitoring", {
  id: serial("id").primaryKey(),
  url: varchar("url", { length: 500 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // broken-link, crawl-error, 404-error
  status: varchar("status", { length: 50 }).default("active"), // active, resolved, ignored
  errorMessage: text("error_message"),
  statusCode: integer("status_code"),
  referrerUrl: varchar("referrer_url", { length: 500 }),
  detectedAt: timestamp("detected_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
  lastChecked: timestamp("last_checked").defaultNow(),
});

// Core Web Vitals monitoring
export const coreWebVitals = pgTable("core_web_vitals", {
  id: serial("id").primaryKey(),
  url: varchar("url", { length: 500 }).notNull(),
  lcp: decimal("lcp", { precision: 10, scale: 3 }), // Largest Contentful Paint
  fid: decimal("fid", { precision: 10, scale: 3 }), // First Input Delay
  cls: decimal("cls", { precision: 10, scale: 3 }), // Cumulative Layout Shift
  fcp: decimal("fcp", { precision: 10, scale: 3 }), // First Contentful Paint
  ttfb: decimal("ttfb", { precision: 10, scale: 3 }), // Time to First Byte
  deviceType: varchar("device_type", { length: 20 }), // mobile, desktop
  connectionType: varchar("connection_type", { length: 20 }),
  score: integer("score"), // Overall performance score 0-100
  measuredAt: timestamp("measured_at").defaultNow(),
});

// Search suggestions and analytics
export const searchSuggestions = pgTable("search_suggestions", {
  id: serial("id").primaryKey(),
  query: varchar("query", { length: 255 }).notNull(),
  suggestion: varchar("suggestion", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }),
  popularity: integer("popularity").default(0),
  resultCount: integer("result_count").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Search analytics
export const searchAnalytics = pgTable("search_analytics", {
  id: serial("id").primaryKey(),
  query: varchar("query", { length: 255 }).notNull(),
  resultCount: integer("result_count").default(0),
  sessionId: varchar("session_id", { length: 100 }),
  userId: varchar("user_id").references(() => users.id),
  clickedProductId: integer("clicked_product_id").references(() => products.id),
  searchedAt: timestamp("searched_at").defaultNow(),
});

// Global SEO settings configuration
export const globalSeoSettings = pgTable("global_seo_settings", {
  id: serial("id").primaryKey(),
  siteTitle: varchar("site_title", { length: 255 }).notNull(),
  siteDescription: text("site_description"),
  primaryKeywords: text("primary_keywords"), // comma-separated
  primaryTargetRegion: varchar("primary_target_region", { length: 100 }).default("Global (All Regions)"),
  businessLocation: varchar("business_location", { length: 255 }),
  pharmaceuticalKeywords: text("pharmaceutical_keywords"),
  nutraceuticalKeywords: text("nutraceutical_keywords"),
  
  // Region-specific keyword targeting
  northAmericaKeywords: text("north_america_keywords"),
  europeKeywords: text("europe_keywords"),
  asiaPacificKeywords: text("asia_pacific_keywords"),
  indiaKeywords: text("india_keywords"),
  middleEastKeywords: text("middle_east_keywords"),
  latinAmericaKeywords: text("latin_america_keywords"),
  
  // SEO Impact Configuration
  enableAutoMetaTags: boolean("enable_auto_meta_tags").default(true),
  enableStructuredData: boolean("enable_structured_data").default(true),
  enableLocalSeo: boolean("enable_local_seo").default(true),
  enableHreflang: boolean("enable_hreflang").default(false),
  
  googleAnalyticsId: varchar("google_analytics_id", { length: 50 }),
  googleTagManagerId: varchar("google_tag_manager_id", { length: 50 }),
  facebookPixelId: varchar("facebook_pixel_id", { length: 50 }),
  twitterHandle: varchar("twitter_handle", { length: 50 }),
  organizationSchema: jsonb("organization_schema"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Hreflang configuration for multi-language
export const hreflangConfig = pgTable("hreflang_config", {
  id: serial("id").primaryKey(),
  pageType: varchar("page_type", { length: 50 }).notNull(), // product, category, blog, static
  pageId: varchar("page_id", { length: 100 }).notNull(), // ID of the specific page
  language: varchar("language", { length: 10 }).notNull(), // en, es, fr, de, etc.
  region: varchar("region", { length: 10 }), // US, GB, FR, DE, etc.
  url: varchar("url", { length: 500 }).notNull(),
  isDefault: boolean("is_default").default(false),
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
  productType: varchar("product_type", { length: 50 }).default("organic"), // organic, natural, conventional, synthetic, nature_identical, other
  productGrade: varchar("product_grade", { length: 100 }), // Food Grade, Pharma Grade, etc.
  healthSupport: varchar("health_support", { length: 100 }), // Functional Category - Antioxidant, Digestive Support, etc.
  productGroupId: varchar("product_group_id", { length: 100 }), // Groups related products like organic/conventional variants
  
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
  tags: jsonb("tags").default("[]"), // Array of product tags/certifications
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
  
  // Media - WebP Image Support with Multiple Sizes
  mainImage: varchar("main_image", { length: 500 }), // Primary image URL (medium size)
  mainImageThumbnail: varchar("main_image_thumbnail", { length: 500 }), // 300px WebP
  mainImageMedium: varchar("main_image_medium", { length: 500 }), // 800px WebP
  mainImageLarge: varchar("main_image_large", { length: 500 }), // 1200px WebP
  galleryImages: jsonb("gallery_images").default("[]"), // Array of image URL objects with sizes

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
  
  // Featured Products System
  isFeatured: boolean("is_featured").default(false),
  featuredOrder: integer("featured_order").default(0),
  featuredStartDate: timestamp("featured_start_date"),
  featuredEndDate: timestamp("featured_end_date"),
  
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

// Product-Category relationship (many-to-many)
export const productCategoryRelations = pgTable("product_category_relations", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  categoryId: integer("category_id").references(() => categories.id, { onDelete: "cascade" }).notNull(),
  isPrimary: boolean("is_primary").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  // Unique constraint to prevent duplicate assignments
  index("unique_product_category").on(table.productId, table.categoryId),
  // Index for performance
  index("idx_product_categories").on(table.productId),
  index("idx_category_products").on(table.categoryId),
]);

// Product types (organic, conventional, wild crafted)
export const productTypes = pgTable("product_types", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  color: varchar("color", { length: 7 }).default("#10B981"), // Hex color for UI badges
  icon: varchar("icon", { length: 50 }), // Icon name for display
  displayOrder: integer("display_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Product-Type relationship (many-to-many)
export const productTypeRelations = pgTable("product_type_relations", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  typeId: integer("type_id").references(() => productTypes.id, { onDelete: "cascade" }).notNull(),
  isPrimary: boolean("is_primary").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  // Unique constraint to prevent duplicate assignments
  index("unique_product_type").on(table.productId, table.typeId),
  // Index for performance
  index("idx_product_types").on(table.productId),
  index("idx_type_products").on(table.typeId),
]);

// Health supports table for multiple health support categories
export const healthSupports = pgTable("health_supports", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Junction table for product-health support relationships (many-to-many)
export const healthSupportRelations = pgTable("health_support_relations", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  healthSupportId: integer("health_support_id").references(() => healthSupports.id, { onDelete: "cascade" }).notNull(),
  isPrimary: boolean("is_primary").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  // Unique constraint to prevent duplicate assignments
  index("unique_product_health_support").on(table.productId, table.healthSupportId),
  // Index for performance
  index("idx_product_health_supports").on(table.productId),
  index("idx_health_support_products").on(table.healthSupportId),
]);

// Hero slider management for homepage - Enhanced with video support
export const heroSliders = pgTable("hero_sliders", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  subtitle: text("subtitle"),
  mediaType: varchar("media_type", { length: 20 }).default("image"), // image, video
  imageUrl: varchar("image_url", { length: 500 }), // For image slides (nullable for video slides)
  videoUrl: varchar("video_url", { length: 500 }), // For video slides
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
  quantity: decimal("quantity", { precision: 15, scale: 2 }),
  unit: varchar("unit", { length: 50 }),
  targetPrice: decimal("target_price", { precision: 15, scale: 2 }), // For bidding
  expectedDelivery: timestamp("expected_delivery"),
  message: text("message"),
  notes: text("notes"), // Additional customer notes
  urgency: varchar("urgency", { length: 50 }).default("normal"), // urgent, normal, low
  status: varchar("status", { length: 50 }).default("pending"), // pending, quoted, converted, closed
  assignedTo: varchar("assigned_to").references(() => users.id),
  
  // High Volume Bid Approval Workflow
  requiresApproval: boolean("requires_approval").default(false),
  bidStatus: varchar("bid_status", { length: 50 }).default("pending"), // pending, rev_proposed, customer_accepted, customer_rejected, approved, rejected, converted
  bidProgressStatus: varchar("bid_progress_status", { length: 50 }).default("submitted"), // submitted, manager_approval, sales_discussion, quotation_sent, completed
  bidProgressUpdatedAt: timestamp("bid_progress_updated_at").defaultNow(),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvalNotes: text("approval_notes"),
  discussionNotes: text("discussion_notes"), // Track discussions with customer
  approvedAt: timestamp("approved_at"),
  crmLeadId: integer("crm_lead_id"), // Link to CRM lead created after approval
  latestRevisionId: integer("latest_revision_id"), // FK to bid_revisions, tracks most recent revision
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  latestRevisionFk: foreignKey({
    columns: [table.latestRevisionId],
    foreignColumns: [bidRevisions.id],
    name: "inquiries_latest_revision_fk"
  }).onDelete("set null"),
}));

// Bid revisions - Track price negotiation history for high volume bids
export const bidRevisions = pgTable("bid_revisions", {
  id: serial("id").primaryKey(),
  inquiryId: integer("inquiry_id").references(() => inquiries.id, { onDelete: "cascade" }).notNull(),
  
  // Revised pricing
  revisedAmount: decimal("revised_amount", { precision: 15, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("USD"),
  notes: text("notes"), // Admin's notes when submitting revision
  
  // Revision status and tracking
  status: varchar("status", { length: 50 }).default("pending"), // pending, accepted, rejected
  submittedBy: varchar("submitted_by").references(() => users.id).notNull(),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  
  // Customer response
  respondedBy: varchar("responded_by").references(() => users.id),
  respondedAt: timestamp("responded_at"),
  responseNotes: text("response_notes"), // Customer's response notes
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  inquiryIdIdx: index("bid_revisions_inquiry_id_idx").on(table.inquiryId),
  statusIdx: index("bid_revisions_status_idx").on(table.status),
}));

// Bid negotiations - Track messages/communications for high volume bids
export const bidNegotiations = pgTable("bid_negotiations", {
  id: serial("id").primaryKey(),
  inquiryId: integer("inquiry_id").references(() => inquiries.id, { onDelete: "cascade" }).notNull(),
  leadId: integer("lead_id"), // References crmLeads.id - FK added via relations
  
  // Message content
  messageType: varchar("message_type", { length: 50 }).notNull(), // status_update, revised_quote, customer_message, admin_note
  message: text("message").notNull(),
  
  // Revised quote details (when messageType is 'revised_quote')
  revisedAmount: decimal("revised_amount", { precision: 15, scale: 2 }),
  currency: varchar("currency", { length: 10 }),
  
  // Author information
  authorId: varchar("author_id").references(() => users.id).notNull(),
  authorRole: varchar("author_role", { length: 50 }).notNull(), // admin, sales_rep, customer
  
  // Visibility
  isVisibleToCustomer: boolean("is_visible_to_customer").default(true),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  inquiryIdIdx: index("bid_negotiations_inquiry_id_idx").on(table.inquiryId),
  leadIdIdx: index("bid_negotiations_lead_id_idx").on(table.leadId),
}));

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
  
  // Processing Details
  status: varchar("status", { length: 50 }).default("pending"), // pending, approved, shipped, completed, rejected
  notes: text("notes"),
  trackingNumber: varchar("tracking_number", { length: 100 }),
  processedAt: timestamp("processed_at"),
  processedBy: varchar("processed_by").references(() => users.id),
  assignedTo: varchar("assigned_to").references(() => users.id),
  leadId: integer("lead_id"), // Optional link to CRM lead
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
  currency: varchar("currency", { length: 5 }).default("USD"), // USD, EUR, GBP, INR, etc.
  priceType: varchar("price_type", { length: 50 }).default("ex_warehouse"), // ex_warehouse, ex_works, fob, cif, etc.
  status: varchar("status", { length: 50 }).default("draft"), // draft, sent, accepted, rejected, expired
  terms: text("terms"),
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  
  // PDF Generation Fields (Optional)
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }),
  discountPercent: decimal("discount_percent", { precision: 5, scale: 2 }).default("0.00"),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0.00"),
  
  // Tax Information (Optional - for domestic transactions)
  includeGst: boolean("include_gst").default(false),
  gstNumber: varchar("gst_number", { length: 15 }), // GST Number for the transaction
  gstPercentage: decimal("gst_percentage", { precision: 5, scale: 2 }), // GST percentage (e.g., 18.00)
  gstAmount: decimal("gst_amount", { precision: 10, scale: 2 }), // Calculated GST amount
  sellerGstin: varchar("seller_gstin", { length: 15 }), // Optional - BFI Organic GSTIN
  sellerPan: varchar("seller_pan", { length: 10 }), // Optional - BFI Organic PAN
  buyerGstin: varchar("buyer_gstin", { length: 15 }), // Optional - Customer GSTIN
  buyerPan: varchar("buyer_pan", { length: 10 }), // Optional - Customer PAN
  
  // Customer Billing Details (for PDF)
  customerCompanyName: varchar("customer_company_name", { length: 255 }),
  customerAddress: text("customer_address"),
  customerCity: varchar("customer_city", { length: 100 }),
  customerState: varchar("customer_state", { length: 100 }),
  customerCountry: varchar("customer_country", { length: 100 }),
  customerPostalCode: varchar("customer_postal_code", { length: 20 }),
  
  // Additional PDF fields
  placeOfSupply: varchar("place_of_supply", { length: 100 }),
  countryOfSupply: varchar("country_of_supply", { length: 100 }),
  
  // Counter-Offer and Negotiation
  customerCounterPrice: decimal("customer_counter_price", { precision: 10, scale: 2 }), // Customer's proposed price
  counterOfferNotes: text("counter_offer_notes"), // Customer's reasoning/notes
  negotiationHistory: jsonb("negotiation_history").default("[]"), // Array of {type, amount, notes, createdAt, createdBy}
  
  // CRM Lead Link
  leadId: integer("lead_id"), // Optional link to CRM lead
  sentAt: timestamp("sent_at"), // When quote was sent to customer via email
  sentBy: varchar("sent_by").references(() => users.id), // Who sent the quote
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
  productRelations: many(productCategoryRelations),
  parent: one(categories, { fields: [categories.parentId], references: [categories.id] }),
  children: many(categories),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  categoryRelations: many(productCategoryRelations),
  typeRelations: many(productTypeRelations),
  healthSupportRelations: many(healthSupportRelations),
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

export const productCategoryRelationsRelations = relations(productCategoryRelations, ({ one }) => ({
  product: one(products, { fields: [productCategoryRelations.productId], references: [products.id] }),
  category: one(categories, { fields: [productCategoryRelations.categoryId], references: [categories.id] }),
}));

export const productTypesRelations = relations(productTypes, ({ many }) => ({
  productRelations: many(productTypeRelations),
}));

export const productTypeRelationsRelations = relations(productTypeRelations, ({ one }) => ({
  product: one(products, { fields: [productTypeRelations.productId], references: [products.id] }),
  type: one(productTypes, { fields: [productTypeRelations.typeId], references: [productTypes.id] }),
}));

export const healthSupportsRelations = relations(healthSupports, ({ many }) => ({
  productRelations: many(healthSupportRelations),
}));

export const healthSupportRelationsRelations = relations(healthSupportRelations, ({ one }) => ({
  product: one(products, { fields: [healthSupportRelations.productId], references: [products.id] }),
  healthSupport: one(healthSupports, { fields: [healthSupportRelations.healthSupportId], references: [healthSupports.id] }),
}));

export const heroSlidersRelations = relations(heroSliders, ({ one }) => ({
  creator: one(users, { fields: [heroSliders.createdBy], references: [users.id] }),
}));

export const inquiriesRelations = relations(inquiries, ({ one, many }) => ({
  customer: one(users, { fields: [inquiries.customerId], references: [users.id] }),
  product: one(products, { fields: [inquiries.productId], references: [products.id] }),
  assignedUser: one(users, { fields: [inquiries.assignedTo], references: [users.id] }),
  quotations: many(quotations),
  bidRevisions: many(bidRevisions),
}));

export const bidRevisionsRelations = relations(bidRevisions, ({ one }) => ({
  inquiry: one(inquiries, { fields: [bidRevisions.inquiryId], references: [inquiries.id] }),
  submitter: one(users, { fields: [bidRevisions.submittedBy], references: [users.id] }),
  responder: one(users, { fields: [bidRevisions.respondedBy], references: [users.id] }),
}));

export const bidNegotiationsRelations = relations(bidNegotiations, ({ one }) => ({
  inquiry: one(inquiries, { fields: [bidNegotiations.inquiryId], references: [inquiries.id] }),
  author: one(users, { fields: [bidNegotiations.authorId], references: [users.id] }),
}));

export const sampleRequestsRelations = relations(sampleRequests, ({ one }) => ({
  customer: one(users, { fields: [sampleRequests.customerId], references: [users.id] }),
  product: one(products, { fields: [sampleRequests.productId], references: [products.id] }),
  assignedUser: one(users, { fields: [sampleRequests.assignedTo], references: [users.id] }),
  lead: one(leads, { fields: [sampleRequests.leadId], references: [leads.id] }),
}));

export const quotationsRelations = relations(quotations, ({ one, many }) => ({
  inquiry: one(inquiries, { fields: [quotations.inquiryId], references: [inquiries.id] }),
  customer: one(users, { fields: [quotations.customerId], references: [users.id] }),
  createdByUser: one(users, { fields: [quotations.createdBy], references: [users.id] }),
  sentByUser: one(users, { fields: [quotations.sentBy], references: [users.id] }),
  lead: one(leads, { fields: [quotations.leadId], references: [leads.id] }),
  items: many(quotationItems),
  salesOrders: many(salesOrders),
}));

// Insert schemas

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

export const insertProductCategoryRelationSchema = createInsertSchema(productCategoryRelations).omit({
  id: true,
  createdAt: true,
});

export const insertProductTypeSchema = createInsertSchema(productTypes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  slug: z.string().optional(), // Auto-generated from name if not provided
});

export const insertProductTypeRelationSchema = createInsertSchema(productTypeRelations).omit({
  id: true,
  createdAt: true,
});

export const insertHealthSupportSchema = createInsertSchema(healthSupports).omit({
  id: true,
  createdAt: true,
}).extend({
  slug: z.string().optional(), // Auto-generated from name if not provided
});

export const insertHealthSupportRelationSchema = createInsertSchema(healthSupportRelations).omit({
  id: true,
  createdAt: true,
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
}).extend({
  expectedDelivery: z.coerce.date().nullable().optional(),
  approvedAt: z.coerce.date().nullable().optional(),
});

export const insertBidRevisionSchema = createInsertSchema(bidRevisions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  submittedAt: z.coerce.date().optional(),
  respondedAt: z.coerce.date().nullable().optional(),
});

export const insertBidNegotiationSchema = createInsertSchema(bidNegotiations).omit({
  id: true,
  createdAt: true,
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
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;
export type InsertInquiry = z.infer<typeof insertInquirySchema>;
export type Inquiry = typeof inquiries.$inferSelect;
export type InsertBidRevision = z.infer<typeof insertBidRevisionSchema>;
export type BidRevision = typeof bidRevisions.$inferSelect;
export type InsertBidNegotiation = z.infer<typeof insertBidNegotiationSchema>;
export type BidNegotiation = typeof bidNegotiations.$inferSelect;
export type InsertQuotation = z.infer<typeof insertQuotationSchema>;
export type Quotation = typeof quotations.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type ProductDocument = typeof productDocuments.$inferSelect;
export type InsertProductDocument = z.infer<typeof insertProductDocumentSchema>;
export type ProductTag = typeof productTags.$inferSelect;
export type InsertProductTag = z.infer<typeof insertProductTagSchema>;
export type ProductCategoryRelation = typeof productCategoryRelations.$inferSelect;
export type InsertProductCategoryRelation = z.infer<typeof insertProductCategoryRelationSchema>;
export type ProductType = typeof productTypes.$inferSelect;
export type InsertProductType = z.infer<typeof insertProductTypeSchema>;
export type ProductTypeRelation = typeof productTypeRelations.$inferSelect;
export type InsertProductTypeRelation = z.infer<typeof insertProductTypeRelationSchema>;
export type HealthSupport = typeof healthSupports.$inferSelect;
export type InsertHealthSupport = z.infer<typeof insertHealthSupportSchema>;
export type HealthSupportRelation = typeof healthSupportRelations.$inferSelect;
export type InsertHealthSupportRelation = z.infer<typeof insertHealthSupportRelationSchema>;

// Extended product type with categories and types
export type ProductWithCategories = Product & {
  categories: (Category & { isPrimary: boolean })[];
  primaryCategory?: Category;
};

export type ProductWithTypes = Product & {
  types: (ProductType & { isPrimary: boolean })[];
  primaryType?: ProductType;
};

export type ProductWithCategoriesAndTypes = Product & {
  categories: (Category & { isPrimary: boolean })[];
  primaryCategory?: Category;
  types: (ProductType & { isPrimary: boolean })[];
  primaryType?: ProductType;
};

export type ProductWithHealthSupports = Product & {
  healthSupports: (HealthSupport & { isPrimary: boolean })[];
  primaryHealthSupport?: HealthSupport;
};

export type ProductWithAll = Product & {
  categories: (Category & { isPrimary: boolean })[];
  primaryCategory?: Category;
  types: (ProductType & { isPrimary: boolean })[];
  primaryType?: ProductType;
  healthSupports: (HealthSupport & { isPrimary: boolean })[];
  primaryHealthSupport?: HealthSupport;
};
export type HeroSlider = typeof heroSliders.$inferSelect;
export type InsertHeroSlider = z.infer<typeof insertHeroSliderSchema>;
export type SampleRequest = typeof sampleRequests.$inferSelect;
export type InsertSampleRequest = z.infer<typeof insertSampleRequestSchema>;
export type Inventory = typeof inventory.$inferSelect;
export type SalesOrder = typeof salesOrders.$inferSelect;
export type PurchaseOrder = typeof purchaseOrders.$inferSelect;

// Blog post schemas
export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;

// Product FAQ schemas
export const insertProductFaqSchema = createInsertSchema(productFaqs).omit({
  id: true,
  createdAt: true,
});
export type InsertProductFaq = z.infer<typeof insertProductFaqSchema>;
export type ProductFaq = typeof productFaqs.$inferSelect;

// SEO monitoring schemas
export const insertSeoMonitoringSchema = createInsertSchema(seoMonitoring).omit({
  id: true,
  detectedAt: true,
  lastChecked: true,
});
export type InsertSeoMonitoring = z.infer<typeof insertSeoMonitoringSchema>;
export type SeoMonitoring = typeof seoMonitoring.$inferSelect;

// Core Web Vitals schemas
export const insertCoreWebVitalsSchema = createInsertSchema(coreWebVitals).omit({
  id: true,
  measuredAt: true,
});
export type InsertCoreWebVitals = z.infer<typeof insertCoreWebVitalsSchema>;
export type CoreWebVitals = typeof coreWebVitals.$inferSelect;

// Search suggestion schemas
export const insertSearchSuggestionSchema = createInsertSchema(searchSuggestions).omit({
  id: true,
  createdAt: true,
});
export type InsertSearchSuggestion = z.infer<typeof insertSearchSuggestionSchema>;
export type SearchSuggestion = typeof searchSuggestions.$inferSelect;

// Search analytics schemas
export const insertSearchAnalyticsSchema = createInsertSchema(searchAnalytics).omit({
  id: true,
  searchedAt: true,
});
export type InsertSearchAnalytics = z.infer<typeof insertSearchAnalyticsSchema>;
export type SearchAnalytics = typeof searchAnalytics.$inferSelect;

// Hreflang configuration schemas
export const insertHreflangConfigSchema = createInsertSchema(hreflangConfig).omit({
  id: true,
  createdAt: true,
});
export type InsertHreflangConfig = z.infer<typeof insertHreflangConfigSchema>;
export type HreflangConfig = typeof hreflangConfig.$inferSelect;

// Global SEO Settings schemas
export const insertGlobalSeoSettingsSchema = createInsertSchema(globalSeoSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertGlobalSeoSettings = z.infer<typeof insertGlobalSeoSettingsSchema>;
export type GlobalSeoSettings = typeof globalSeoSettings.$inferSelect;

// Newsletter subscriptions table
export const newsletterSubscriptions = pgTable("newsletter_subscriptions", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  subscribedAt: timestamp("subscribed_at").defaultNow(),
  isActive: boolean("is_active").default(true),
  source: varchar("source", { length: 50 }).default("blog"), // blog, footer, popup, etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Newsletter subscription schemas
export const insertNewsletterSubscriptionSchema = createInsertSchema(newsletterSubscriptions).omit({
  id: true,
  subscribedAt: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  email: z.string().email("Please enter a valid email address"),
});

export type InsertNewsletterSubscription = z.infer<typeof insertNewsletterSubscriptionSchema>;
export type NewsletterSubscription = typeof newsletterSubscriptions.$inferSelect;

// ========================================
// CRM LEAD MANAGEMENT SYSTEM
// ========================================

// Companies table - Master records
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  primaryEmail: varchar("primary_email", { length: 255 }),
  primaryPhone: varchar("primary_phone", { length: 50 }),
  gstNumber: varchar("gst_number", { length: 50 }).unique(),
  industryType: varchar("industry_type", { length: 100 }),
  companySize: varchar("company_size", { length: 50 }),
  annualTurnover: decimal("annual_turnover", { precision: 15, scale: 2 }),
  website: varchar("website", { length: 500 }),
  
  // Primary Address (Registered/Head Office)
  addressStreet: text("address_street"),
  addressCity: varchar("address_city", { length: 100 }),
  addressState: varchar("address_state", { length: 100 }),
  addressCountry: varchar("address_country", { length: 100 }),
  addressZip: varchar("address_zip", { length: 20 }),
  
  // Factory/Warehouse Address
  factoryAddressStreet: text("factory_address_street"),
  factoryAddressCity: varchar("factory_address_city", { length: 100 }),
  factoryAddressState: varchar("factory_address_state", { length: 100 }),
  factoryAddressCountry: varchar("factory_address_country", { length: 100 }),
  factoryAddressZip: varchar("factory_address_zip", { length: 20 }),
  
  // Origin and Status for Company Management
  origin: varchar("origin", { length: 20 }).default("manual"), // website, manual
  status: varchar("status", { length: 20 }).default("active"), // active, inactive, blocked
  companyStage: varchar("company_stage", { length: 50 }).default("new"), // new, contacted, engaged, qualified, customer, churned
  priority: varchar("priority", { length: 20 }).default("normal"), // hot, warm, cold, normal
  
  // Linked website user (for website-registered customers)
  linkedUserId: varchar("linked_user_id").references(() => users.id),
  
  // Data completeness tracking
  dataCompleteness: varchar("data_completeness", { length: 20 }).default("complete"), // complete, partial
  needsEnrichment: boolean("needs_enrichment").default(false),
  
  // Duplicate detection fields
  normalizedName: varchar("normalized_name", { length: 255 }), // Lowercase, trimmed, special chars removed
  normalizedDomain: varchar("normalized_domain", { length: 255 }), // Email domain extracted and normalized
  duplicateStatus: varchar("duplicate_status", { length: 20 }).default("unique"), // unique, suspected, confirmed, merged
  duplicateOf: integer("duplicate_of"), // Points to the master company ID if this is a duplicate
  duplicateConfidence: decimal("duplicate_confidence", { precision: 5, scale: 2 }), // 0-100 confidence score
  duplicateReviewedAt: timestamp("duplicate_reviewed_at"), // When was duplicate status last reviewed
  duplicateReviewedBy: varchar("duplicate_reviewed_by").references(() => users.id), // Who reviewed the duplicate status
  
  // Assignment and ownership
  assignedTo: varchar("assigned_to").references(() => users.id), // Sales rep assigned to this company
  assignedBy: varchar("assigned_by").references(() => users.id), // Who assigned this company
  assignedAt: timestamp("assigned_at"), // When was this company assigned
  
  // Tracking
  lastContactDate: timestamp("last_contact_date"),
  nextFollowUpDate: timestamp("next_follow_up_date"),
  notes: text("notes"), // General notes about the company
  
  // Metadata
  createdBy: varchar("created_by").references(() => users.id),
  createdFrom: varchar("created_from", { length: 50 }).default("manual"), // manual, bulk_upload, website_registration
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Company contacts table - Multiple contacts per company
export const companyContacts = pgTable("company_contacts", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  
  contactName: varchar("contact_name", { length: 255 }).notNull(),
  designation: varchar("designation", { length: 100 }),
  email: varchar("email", { length: 255 }),
  countryCode: varchar("country_code", { length: 10 }),
  phone: varchar("phone", { length: 50 }),
  whatsapp: varchar("whatsapp", { length: 50 }),
  
  // Contact classification
  isPrimary: boolean("is_primary").default(false),
  role: varchar("role", { length: 50 }).default("user"), // decision_maker, influencer, user
  isActive: boolean("is_active").default(true),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Company activities table - Activity timeline for company management
export const companyActivities = pgTable("company_activities", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  
  activityType: varchar("activity_type", { length: 50 }).notNull(),
  // Types: call, email, whatsapp, meeting, note, task, stage_change, assignment
  
  activityDate: timestamp("activity_date").defaultNow(),
  subject: varchar("subject", { length: 255 }),
  description: text("description"),
  outcome: text("outcome"),
  
  // Type-specific fields
  duration: integer("duration"), // For calls/meetings in minutes
  direction: varchar("direction", { length: 20 }), // incoming, outgoing (for calls/emails)
  attendees: jsonb("attendees").default("[]"), // For meetings
  attachments: jsonb("attachments").default("[]"), // File URLs
  
  // Stage change specific
  fromStage: varchar("from_stage", { length: 50 }),
  toStage: varchar("to_stage", { length: 50 }),
  
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Company tasks and reminders table
export const companyTasks = pgTable("company_tasks", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  
  taskType: varchar("task_type", { length: 50 }).notNull(), // follow_up, reminder, meeting, call, email
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  dueDate: timestamp("due_date"),
  priority: varchar("priority", { length: 20 }).default("medium"), // high, medium, low
  status: varchar("status", { length: 20 }).default("pending"), // pending, in_progress, completed, cancelled
  
  assignedTo: varchar("assigned_to").references(() => users.id),
  completedAt: timestamp("completed_at"),
  completedBy: varchar("completed_by").references(() => users.id),
  
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Company notes table - Special notes by sales agents about company interactions
export const companyNotes = pgTable("company_notes", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  
  noteType: varchar("note_type", { length: 50 }).notNull().default("general"),
  // Types: general, product_discussion, communication_denied, follow_up, important, warning
  
  title: varchar("title", { length: 255 }),
  content: text("content").notNull(),
  
  // For product discussions
  productsDiscussed: jsonb("products_discussed").$type<number[]>().default(sql`'[]'::jsonb`),
  
  // Visibility and importance
  isPinned: boolean("is_pinned").default(false),
  isPrivate: boolean("is_private").default(false), // Only visible to the creator
  priority: varchar("priority", { length: 20 }).default("normal"), // high, normal, low
  
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Leads/Deals table - Deal-specific information
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  leadId: varchar("lead_id", { length: 50 }).notNull().unique(), // LD-2025-0001
  companyId: integer("company_id").references(() => companies.id).notNull(),
  contactPersonId: integer("contact_person_id").references(() => companyContacts.id),
  
  // Product requirements
  productsInterested: jsonb("products_interested").$type<number[]>().default(sql`'[]'::jsonb`), // Array of product IDs
  productName: varchar("product_name", { length: 255 }), // Manually entered product name for enquiries
  productDescription: text("product_description"), // Manually entered product description
  requiredQuantity: decimal("required_quantity", { precision: 10, scale: 2 }),
  unit: varchar("unit", { length: 50 }),
  frequency: varchar("frequency", { length: 50 }), // one_time, monthly, quarterly, annual
  qualityGrade: varchar("quality_grade", { length: 100 }), // pharmaceutical, food, cosmetic
  certificationsNeeded: jsonb("certifications_needed").default("[]"),
  packagingPreference: varchar("packaging_preference", { length: 255 }),
  specialRequirements: text("special_requirements"),
  attachments: jsonb("attachments").default("[]"), // Array of file URLs for product specs/documents
  
  // Business details
  leadSource: varchar("lead_source", { length: 100 }), // website, trade_show, referral, cold_call, linkedin, manual, high_volume_bid, accepted_quotation, sample_request
  isManualLead: boolean("is_manual_lead").default(false), // True if created manually by admin/sales
  importedAt: timestamp("imported_at"), // Timestamp if imported from CSV/Excel
  expectedOrderValue: decimal("expected_order_value", { precision: 15, scale: 2 }),
  currency: varchar("currency", { length: 5 }).default("USD"),
  buyingTimeline: varchar("buying_timeline", { length: 50 }), // immediate, 1_month, 3_months, 6_months_plus
  currentSupplier: varchar("current_supplier", { length: 255 }),
  reasonForChange: text("reason_for_change"),
  decisionMakerContact: varchar("decision_maker_contact", { length: 255 }),
  
  // Classification
  priority: varchar("priority", { length: 20 }).default("warm"), // hot, warm, cold
  leadScore: integer("lead_score").default(50), // 1-100
  expectedRevenue: decimal("expected_revenue", { precision: 15, scale: 2 }),
  competitionLevel: varchar("competition_level", { length: 50 }), // sole_vendor, competing
  winProbability: integer("win_probability").default(50), // Percentage 0-100
  
  // Pipeline stage (15 stages)
  currentStage: varchar("current_stage", { length: 50 }).default("new_lead"), 
  // Stages: new_lead, first_contact, discussion, meeting_scheduled, meeting_completed,
  // sample_requested, sample_submitted, sample_feedback, quotation_sent, negotiation,
  // certificates_shared, order_pending, won, lost, on_hold
  previousStage: varchar("previous_stage", { length: 50 }),
  
  // Assignment
  assignedSalesRep: varchar("assigned_sales_rep").references(() => users.id),
  assignedBy: varchar("assigned_by").references(() => users.id), // Who assigned this lead
  assignedAt: timestamp("assigned_at"), // When was this lead assigned
  salesManager: varchar("sales_manager").references(() => users.id),
  regionTerritory: varchar("region_territory", { length: 100 }),
  assignmentMode: varchar("assignment_mode", { length: 50 }).default("manual"), // manual, auto
  
  // Transfer history
  transferHistory: jsonb("transfer_history").default("[]"), // Array of transfer records
  
  // Tracking
  lastContactDate: timestamp("last_contact_date"),
  nextFollowUpDate: timestamp("next_follow_up_date"),
  daysInCurrentStage: integer("days_in_current_stage").default(0),
  totalAge: integer("total_age").default(0), // Days since creation
  stageEnteredAt: timestamp("stage_entered_at").defaultNow(), // When current stage was entered
  slaDeadline: timestamp("sla_deadline"), // SLA deadline for current stage
  
  // Status
  status: varchar("status", { length: 50 }).default("active"), // active, won, lost, on_hold
  lostReason: text("lost_reason"),
  onHoldReason: text("on_hold_reason"),
  
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Lead activities table - Timeline tracking
export const leadActivities = pgTable("lead_activities", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").references(() => leads.id, { onDelete: "cascade" }).notNull(),
  
  // Activity details
  activityType: varchar("activity_type", { length: 50 }).notNull(),
  // Types: call, email, whatsapp, meeting, sample_request, sample_sent, quotation, document,
  // note, task, stage_change, negotiation, approval
  
  activityDate: timestamp("activity_date").defaultNow(),
  subject: varchar("subject", { length: 255 }),
  description: text("description"),
  outcome: text("outcome"),
  
  // Type-specific fields
  duration: integer("duration"), // For calls/meetings in minutes
  direction: varchar("direction", { length: 20 }), // incoming, outgoing (for calls/emails)
  attendees: jsonb("attendees").default("[]"), // For meetings
  attachments: jsonb("attachments").default("[]"), // File URLs
  
  // Stage change specific
  fromStage: varchar("from_stage", { length: 50 }),
  toStage: varchar("to_stage", { length: 50 }),
  
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Lead tasks and reminders table
export const leadTasks = pgTable("lead_tasks", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").references(() => leads.id, { onDelete: "cascade" }).notNull(),
  
  taskType: varchar("task_type", { length: 50 }).notNull(), // follow_up, reminder, meeting, call, email
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  
  assignedTo: varchar("assigned_to").references(() => users.id).notNull(),
  dueDate: timestamp("due_date"),
  reminderTime: timestamp("reminder_time"),
  
  status: varchar("status", { length: 50 }).default("pending"), // pending, completed, overdue, cancelled
  priority: varchar("priority", { length: 20 }).default("normal"), // high, normal, low
  
  completedAt: timestamp("completed_at"),
  completedBy: varchar("completed_by").references(() => users.id),
  
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Assignment rules table - Auto-assignment configuration
export const assignmentRules = pgTable("assignment_rules", {
  id: serial("id").primaryKey(),
  ruleName: varchar("rule_name", { length: 255 }).notNull(),
  ruleType: varchar("rule_type", { length: 50 }).notNull(),
  // Types: round_robin, territory, product_expertise, lead_value, industry_type, workload_balancing
  
  // Rule conditions (JSON)
  conditions: jsonb("conditions").default("{}"), // { territory: "north", product: "herbal_powders", etc. }
  
  assignedUserId: varchar("assigned_user_id").references(() => users.id),
  priority: integer("priority").default(0), // Higher priority rules execute first
  
  isActive: boolean("is_active").default(true),
  
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// CRM Relations
export const companiesRelations = relations(companies, ({ many, one }) => ({
  contacts: many(companyContacts),
  leads: many(leads),
  creator: one(users, { fields: [companies.createdBy], references: [users.id] }),
}));

export const companyContactsRelations = relations(companyContacts, ({ one }) => ({
  company: one(companies, { fields: [companyContacts.companyId], references: [companies.id] }),
}));

export const companyNotesRelations = relations(companyNotes, ({ one }) => ({
  company: one(companies, { fields: [companyNotes.companyId], references: [companies.id] }),
  creator: one(users, { fields: [companyNotes.createdBy], references: [users.id] }),
}));

export const leadsRelations = relations(leads, ({ one, many }) => ({
  company: one(companies, { fields: [leads.companyId], references: [companies.id] }),
  contactPerson: one(companyContacts, { fields: [leads.contactPersonId], references: [companyContacts.id] }),
  salesRep: one(users, { fields: [leads.assignedSalesRep], references: [users.id] }),
  manager: one(users, { fields: [leads.salesManager], references: [users.id] }),
  activities: many(leadActivities),
  tasks: many(leadTasks),
  sampleRequests: many(sampleRequests),
  quotations: many(quotations),
  creator: one(users, { fields: [leads.createdBy], references: [users.id] }),
}));

export const leadActivitiesRelations = relations(leadActivities, ({ one }) => ({
  lead: one(leads, { fields: [leadActivities.leadId], references: [leads.id] }),
  creator: one(users, { fields: [leadActivities.createdBy], references: [users.id] }),
}));

export const leadTasksRelations = relations(leadTasks, ({ one }) => ({
  lead: one(leads, { fields: [leadTasks.leadId], references: [leads.id] }),
  assignee: one(users, { fields: [leadTasks.assignedTo], references: [users.id] }),
  creator: one(users, { fields: [leadTasks.createdBy], references: [users.id] }),
}));

// CRM Insert Schemas
export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCompanyContactSchema = createInsertSchema(companyContacts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCompanyActivitySchema = createInsertSchema(companyActivities).omit({
  id: true,
  createdAt: true,
});

export const insertCompanyTaskSchema = createInsertSchema(companyTasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCompanyNoteSchema = createInsertSchema(companyNotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  leadId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLeadActivitySchema = createInsertSchema(leadActivities).omit({
  id: true,
  createdAt: true,
});

export const insertLeadTaskSchema = createInsertSchema(leadTasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAssignmentRuleSchema = createInsertSchema(assignmentRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// CRM Types
export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type CompanyContact = typeof companyContacts.$inferSelect;
export type InsertCompanyContact = z.infer<typeof insertCompanyContactSchema>;
export type CompanyActivity = typeof companyActivities.$inferSelect;
export type InsertCompanyActivity = z.infer<typeof insertCompanyActivitySchema>;
export type CompanyTask = typeof companyTasks.$inferSelect;
export type InsertCompanyTask = z.infer<typeof insertCompanyTaskSchema>;
export type CompanyNote = typeof companyNotes.$inferSelect;
export type InsertCompanyNote = z.infer<typeof insertCompanyNoteSchema>;
export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type LeadActivity = typeof leadActivities.$inferSelect;
export type InsertLeadActivity = z.infer<typeof insertLeadActivitySchema>;
export type LeadTask = typeof leadTasks.$inferSelect;
export type InsertLeadTask = z.infer<typeof insertLeadTaskSchema>;
export type AssignmentRule = typeof assignmentRules.$inferSelect;
export type InsertAssignmentRule = z.infer<typeof insertAssignmentRuleSchema>;

// Extended CRM types with relations
export type LeadWithDetails = Lead & {
  company: Company;
  contactPerson?: CompanyContact;
  salesRep?: User;
  activities?: LeadActivity[];
  tasks?: LeadTask[];
  unreadEmailCount?: number;
  latestUnreadEmailAt?: Date | string | null;
  quoteValue?: string | null;
};

export type CompanyWithContacts = Company & {
  contacts: CompanyContact[];
  leads?: Lead[];
};

export type CompanyWithDetails = Company & {
  contacts: CompanyContact[];
  primaryContact?: CompanyContact;
  salesRep?: User;
  activities?: CompanyActivity[];
  tasks?: CompanyTask[];
  linkedUser?: User;
  unreadEmailCount?: number;
  latestUnreadEmailAt?: Date | string | null;
};

// User types and schemas
export type User = typeof users.$inferSelect;
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  email: z.string().email("Please enter a valid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  companyName: z.string().min(1, "Company name is required"),
  country: z.string().min(1, "Country is required"),
});

export const customerRegistrationSchema = insertUserSchema.extend({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Please confirm your password"),
  streetAddress: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State/Province is required"),
  postalCode: z.string().min(1, "Postal code is required"),
}).pick({
  firstName: true,
  lastName: true,
  email: true,
  phoneNumber: true,
  companyName: true,
  streetAddress: true,
  city: true,
  state: true,
  postalCode: true,
  country: true,
  industryType: true,
  password: true,
  confirmPassword: true,
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type CustomerRegistration = z.infer<typeof customerRegistrationSchema>;

// Staff user schemas
export const insertStaffSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  department: z.enum(STAFF_DEPARTMENTS, { required_error: "Department is required" }),
  role: z.string().min(1, "Role is required"),
  phoneNumber: z.string().optional(),
});

export const updateStaffSchema = z.object({
  email: z.string().email("Please enter a valid email address").optional(),
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  department: z.enum(STAFF_DEPARTMENTS).optional(),
  role: z.string().optional(),
  phoneNumber: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export type InsertStaff = z.infer<typeof insertStaffSchema>;
export type UpdateStaff = z.infer<typeof updateStaffSchema>;

// Staff user type for frontend display
export type StaffUser = User & {
  department: string | null;
};

// ========================================
// EMAIL INTEGRATION TABLES
// ========================================

// User email configuration - stores company email assigned to each user
export const userEmailConfigs = pgTable("user_email_configs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  companyEmail: varchar("company_email", { length: 255 }).notNull(), // e.g., omkar@rightorganic.com
  displayName: varchar("display_name", { length: 255 }), // Display name for emails
  department: varchar("department", { length: 100 }), // sales, support, admin, etc.
  isPrimary: boolean("is_primary").default(true),
  isActive: boolean("is_active").default(true),
  serviceType: varchar("service_type", { length: 50 }).default("gmail"), // gmail, outlook, etc.
  accessToken: text("access_token"), // OAuth access token
  refreshToken: text("refresh_token"), // OAuth refresh token
  tokenExpiresAt: timestamp("token_expires_at"), // When the access token expires
  isConnected: boolean("is_connected").default(false), // Whether OAuth is connected
  signatureImageUrl: text("signature_image_url"), // Digital signature image URL (recommended: 300x100px, max 400x150px)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Email threads - groups related emails together, linked to leads
export const emailThreads = pgTable("email_threads", {
  id: serial("id").primaryKey(),
  threadId: varchar("thread_id", { length: 255 }).unique(), // External Gmail thread ID
  leadId: integer("lead_id").references(() => leads.id),
  companyId: integer("company_id").references(() => companies.id),
  subject: varchar("subject", { length: 500 }),
  snippet: text("snippet"), // Preview text
  participantEmails: jsonb("participant_emails").$type<string[]>().default(sql`'[]'::jsonb`),
  lastMessageAt: timestamp("last_message_at"),
  messageCount: integer("message_count").default(0),
  isRead: boolean("is_read").default(false),
  status: varchar("status", { length: 50 }).default("active"), // active, archived, spam
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Individual email messages
export const emailMessages = pgTable("email_messages", {
  id: serial("id").primaryKey(),
  messageId: varchar("message_id", { length: 255 }).unique(), // External Gmail message ID
  messageIdHeader: varchar("message_id_header", { length: 500 }), // RFC Message-ID header for proper threading
  referencesHeader: text("references_header"), // References header chain for threading
  threadId: integer("thread_id").references(() => emailThreads.id),
  leadId: integer("lead_id").references(() => leads.id),
  direction: varchar("direction", { length: 20 }).notNull(), // inbound, outbound
  fromEmail: varchar("from_email", { length: 255 }).notNull(),
  fromName: varchar("from_name", { length: 255 }),
  toEmails: jsonb("to_emails").$type<string[]>().default(sql`'[]'::jsonb`),
  ccEmails: jsonb("cc_emails").$type<string[]>().default(sql`'[]'::jsonb`),
  bccEmails: jsonb("bcc_emails").$type<string[]>().default(sql`'[]'::jsonb`),
  subject: varchar("subject", { length: 500 }),
  bodyHtml: text("body_html"),
  bodyText: text("body_text"),
  attachments: jsonb("attachments").$type<{ filename: string; mimeType: string; size: number; url?: string }[]>().default(sql`'[]'::jsonb`),
  sentAt: timestamp("sent_at"),
  receivedAt: timestamp("received_at"),
  status: varchar("status", { length: 50 }).default("sent"), // draft, sending, sent, failed, received
  senderId: varchar("sender_id").references(() => users.id), // Who sent it from CRM
  isRead: boolean("is_read").default(false),
  labelIds: jsonb("label_ids").$type<string[]>().default(sql`'[]'::jsonb`), // Gmail labels
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Email relations
export const userEmailConfigsRelations = relations(userEmailConfigs, ({ one }) => ({
  user: one(users, { fields: [userEmailConfigs.userId], references: [users.id] }),
}));

export const emailThreadsRelations = relations(emailThreads, ({ one, many }) => ({
  lead: one(leads, { fields: [emailThreads.leadId], references: [leads.id] }),
  company: one(companies, { fields: [emailThreads.companyId], references: [companies.id] }),
  messages: many(emailMessages),
}));

export const emailMessagesRelations = relations(emailMessages, ({ one }) => ({
  thread: one(emailThreads, { fields: [emailMessages.threadId], references: [emailThreads.id] }),
  lead: one(leads, { fields: [emailMessages.leadId], references: [leads.id] }),
  sender: one(users, { fields: [emailMessages.senderId], references: [users.id] }),
}));

// Email schemas
export const insertUserEmailConfigSchema = createInsertSchema(userEmailConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmailThreadSchema = createInsertSchema(emailThreads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmailMessageSchema = createInsertSchema(emailMessages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Email types
export type UserEmailConfig = typeof userEmailConfigs.$inferSelect;
export type InsertUserEmailConfig = z.infer<typeof insertUserEmailConfigSchema>;
export type EmailThread = typeof emailThreads.$inferSelect;
export type InsertEmailThread = z.infer<typeof insertEmailThreadSchema>;
export type EmailMessage = typeof emailMessages.$inferSelect;
export type InsertEmailMessage = z.infer<typeof insertEmailMessageSchema>;

// Extended email types
export type EmailThreadWithMessages = EmailThread & {
  messages: EmailMessage[];
  lead?: Lead;
  company?: Company;
};

export type EmailMessageWithDetails = EmailMessage & {
  thread?: EmailThread;
  sender?: User;
};

// Notification types for in-app notifications
export const NOTIFICATION_TYPES = [
  'new_enquiry',           // New enquiry from website
  'new_sample_request',    // New sample request
  'new_high_volume_bid',   // New high volume bid
  'lead_assigned',         // Lead assigned to user
  'lead_converted',        // Lead converted to customer
  'quote_sent',            // Quotation sent
  'quote_accepted',        // Quote accepted by customer
  'quote_rejected',        // Quote rejected by customer
  'new_lead',              // New lead created
  'task_reminder',         // Task reminder
  'general',               // General notification
] as const;

export type NotificationType = typeof NOTIFICATION_TYPES[number];

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(), // Recipient
  type: varchar("type", { length: 50 }).notNull(), // Notification type
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  entityType: varchar("entity_type", { length: 50 }), // lead, enquiry, sample_request, high_volume_bid, quotation, etc.
  entityId: integer("entity_id"), // ID of the related entity
  isRead: boolean("is_read").default(false),
  link: varchar("link", { length: 500 }), // URL to navigate to when clicking the notification
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_notifications_user").on(table.userId),
  index("idx_notifications_user_unread").on(table.userId, table.isRead),
  index("idx_notifications_created").on(table.createdAt),
]);

// Notification relations
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

// Notification schema
export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

// Notification types
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// ========================================
// NET2PHONE INTEGRATION TABLES
// ========================================

// Call status types
export const CALL_STATUSES = [
  'initiating',
  'ringing',
  'answered',
  'completed',
  'missed',
  'voicemail',
  'failed',
  'busy',
  'no_answer',
] as const;

export type CallStatus = typeof CALL_STATUSES[number];

// Call direction types
export const CALL_DIRECTIONS = ['inbound', 'outbound'] as const;
export type CallDirection = typeof CALL_DIRECTIONS[number];

// Call logs table
export const callLogs = pgTable("call_logs", {
  id: serial("id").primaryKey(),
  callUuid: varchar("call_uuid", { length: 255 }).unique(), // net2phone call ID
  callerUserId: varchar("caller_user_id").references(() => users.id), // Sales rep making the call
  callerPhone: varchar("caller_phone", { length: 50 }), // net2phone number used
  recipientPhone: varchar("recipient_phone", { length: 50 }).notNull(), // Customer phone
  recipientName: varchar("recipient_name", { length: 255 }), // Contact name
  direction: varchar("direction", { length: 20 }).default("outbound"), // inbound, outbound
  status: varchar("status", { length: 50 }).default("initiating"), // Call status
  leadId: integer("lead_id").references(() => leads.id), // Associated lead
  companyId: integer("company_id").references(() => companies.id), // Associated company
  initiatedAt: timestamp("initiated_at").defaultNow(),
  ringingAt: timestamp("ringing_at"),
  answeredAt: timestamp("answered_at"),
  endedAt: timestamp("ended_at"),
  durationSeconds: integer("duration_seconds").default(0),
  recordingUrl: varchar("recording_url", { length: 1000 }), // Recording URL from net2phone
  recordingDuration: integer("recording_duration"), // Recording duration in seconds
  voicemailUrl: varchar("voicemail_url", { length: 1000 }), // Voicemail URL if applicable
  notes: text("notes"), // Agent notes about the call
  disposition: varchar("disposition", { length: 100 }), // Call outcome: interested, callback, not_interested, etc.
  metadata: jsonb("metadata").$type<Record<string, any>>(), // Additional net2phone data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_call_logs_caller").on(table.callerUserId),
  index("idx_call_logs_lead").on(table.leadId),
  index("idx_call_logs_company").on(table.companyId),
  index("idx_call_logs_status").on(table.status),
  index("idx_call_logs_initiated").on(table.initiatedAt),
]);

// SMS message types
export const SMS_STATUSES = [
  'pending',
  'sent',
  'delivered',
  'failed',
  'received',
] as const;

export type SmsStatus = typeof SMS_STATUSES[number];

// SMS messages table
export const smsMessages = pgTable("sms_messages", {
  id: serial("id").primaryKey(),
  messageUuid: varchar("message_uuid", { length: 255 }).unique(), // net2phone message ID
  senderUserId: varchar("sender_user_id").references(() => users.id), // Staff who sent
  senderPhone: varchar("sender_phone", { length: 50 }), // net2phone number used
  recipientPhone: varchar("recipient_phone", { length: 50 }).notNull(),
  recipientName: varchar("recipient_name", { length: 255 }),
  direction: varchar("direction", { length: 20 }).default("outbound"), // inbound, outbound
  content: text("content").notNull(), // Message content
  status: varchar("status", { length: 50 }).default("pending"), // Message status
  leadId: integer("lead_id").references(() => leads.id),
  companyId: integer("company_id").references(() => companies.id),
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  failedAt: timestamp("failed_at"),
  failureReason: text("failure_reason"),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_sms_sender").on(table.senderUserId),
  index("idx_sms_lead").on(table.leadId),
  index("idx_sms_company").on(table.companyId),
  index("idx_sms_status").on(table.status),
]);

// Voicemail messages table
export const voicemails = pgTable("voicemails", {
  id: serial("id").primaryKey(),
  voicemailUuid: varchar("voicemail_uuid", { length: 255 }).unique(),
  userId: varchar("user_id").references(() => users.id), // User who received voicemail
  callerPhone: varchar("caller_phone", { length: 50 }).notNull(),
  callerName: varchar("caller_name", { length: 255 }),
  recordingUrl: varchar("recording_url", { length: 1000 }),
  transcription: text("transcription"), // Voicemail transcription if available
  durationSeconds: integer("duration_seconds"),
  leadId: integer("lead_id").references(() => leads.id),
  companyId: integer("company_id").references(() => companies.id),
  isListened: boolean("is_listened").default(false),
  callLogId: integer("call_log_id").references(() => callLogs.id), // Link to call log
  receivedAt: timestamp("received_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_voicemail_user").on(table.userId),
  index("idx_voicemail_lead").on(table.leadId),
  index("idx_voicemail_company").on(table.companyId),
  index("idx_voicemail_listened").on(table.isListened),
]);

// Call logs relations
export const callLogsRelations = relations(callLogs, ({ one }) => ({
  caller: one(users, { fields: [callLogs.callerUserId], references: [users.id] }),
  lead: one(leads, { fields: [callLogs.leadId], references: [leads.id] }),
  company: one(companies, { fields: [callLogs.companyId], references: [companies.id] }),
}));

// SMS messages relations
export const smsMessagesRelations = relations(smsMessages, ({ one }) => ({
  sender: one(users, { fields: [smsMessages.senderUserId], references: [users.id] }),
  lead: one(leads, { fields: [smsMessages.leadId], references: [leads.id] }),
  company: one(companies, { fields: [smsMessages.companyId], references: [companies.id] }),
}));

// Voicemail relations
export const voicemailsRelations = relations(voicemails, ({ one }) => ({
  user: one(users, { fields: [voicemails.userId], references: [users.id] }),
  lead: one(leads, { fields: [voicemails.leadId], references: [leads.id] }),
  company: one(companies, { fields: [voicemails.companyId], references: [companies.id] }),
  callLog: one(callLogs, { fields: [voicemails.callLogId], references: [callLogs.id] }),
}));

// Call log schemas
export const insertCallLogSchema = createInsertSchema(callLogs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSmsMessageSchema = createInsertSchema(smsMessages).omit({
  id: true,
  createdAt: true,
});

export const insertVoicemailSchema = createInsertSchema(voicemails).omit({
  id: true,
  createdAt: true,
});

// Call log types
export type CallLog = typeof callLogs.$inferSelect;
export type InsertCallLog = z.infer<typeof insertCallLogSchema>;
export type SmsMessage = typeof smsMessages.$inferSelect;
export type InsertSmsMessage = z.infer<typeof insertSmsMessageSchema>;
export type Voicemail = typeof voicemails.$inferSelect;
export type InsertVoicemail = z.infer<typeof insertVoicemailSchema>;

// Extended types with relations
export type CallLogWithDetails = CallLog & {
  caller?: User;
  lead?: Lead;
  company?: Company;
};

export type SmsMessageWithDetails = SmsMessage & {
  sender?: User;
  lead?: Lead;
  company?: Company;
};

export type VoicemailWithDetails = Voicemail & {
  user?: User;
  lead?: Lead;
  company?: Company;
  callLog?: CallLog;
};
