import {
  users,
  products,
  categories,
  inquiries,
  quotations,
  quotationItems,
  salesOrders,
  purchaseOrders,
  inventory,
  productDocuments,
  productTags,
  productTagRelations,
  productCategoryRelations,
  heroSlides,
  sampleRequests,
  type User,
  type InsertUser,
  type Product,
  type InsertProduct,
  type ProductWithCategories,
  type Category,
  type InsertCategory,
  type ProductCategoryRelation,
  type InsertProductCategoryRelation,
  type Inquiry,
  type InsertInquiry,
  type Quotation,
  type InsertQuotation,
  type ProductDocument,
  type InsertProductDocument,
  type ProductTag,
  type InsertProductTag,
  type HeroSlider,
  type InsertHeroSlider,
  type SampleRequest,
  type InsertSampleRequest,
  type Inventory,
  type SalesOrder,
  type PurchaseOrder,
  productFaqs,
  blogPosts,
  seoMonitoring,
  coreWebVitals,
  searchSuggestions,
  searchAnalytics,
  hreflangConfig,
  globalSeoSettings,
  newsletterSubscriptions,
  type ProductFaq,
  type InsertProductFaq,
  type BlogPost,
  type InsertBlogPost,
  type SeoMonitoring,
  type InsertSeoMonitoring,
  type CoreWebVitals,
  type InsertCoreWebVitals,
  type SearchSuggestion,
  type InsertSearchSuggestion,
  type SearchAnalytics,
  type InsertSearchAnalytics,
  type HreflangConfig,
  type InsertHreflangConfig,
  type GlobalSeoSettings,
  type InsertGlobalSeoSettings,
  type NewsletterSubscription,
  type InsertNewsletterSubscription,
} from "@shared/schema";
import { db } from "./db";
import { eq, like, and, desc, asc, count, sql, or } from "drizzle-orm";
import csv from "csv-parser";
import xlsx from "xlsx";
import { stringify } from "csv-stringify/sync";
import { Readable } from "stream";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: InsertUser): Promise<User>;
  
  // Customer operations
  getUserByEmail(email: string): Promise<User | undefined>;
  createCustomer(data: InsertUser & { password: string }): Promise<User>;
  getCustomers(filters?: {
    search?: string;
    country?: string;
    industryType?: string;
    accountStatus?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ customers: User[]; total: number }>;
  updateCustomer(id: string, data: Partial<InsertUser>): Promise<User>;

  // Product operations
  getProducts(filters?: {
    category?: string;
    search?: string;
    isOrganic?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ products: Product[]; total: number }>;
  getAdminProducts(filters?: {
    category?: string;
    search?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ products: Product[]; total: number }>;
  getProduct(id: number): Promise<Product | undefined>;
  getProductBySlug(slug: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;
  
  // Featured Products operations
  getFeaturedProducts(limit?: number): Promise<Product[]>;
  updateProductFeaturedStatus(id: number, isFeatured: boolean, featuredOrder?: number): Promise<Product>;
  
  // Related Products operations
  getFrequentlyBoughtTogether(productId: number, limit?: number): Promise<Product[]>;
  getSimilarProducts(productId: number, limit?: number): Promise<Product[]>;

  // Category operations
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category>;
  
  // Product-Category relationship operations  
  getProductWithCategories(productId: number): Promise<ProductWithCategories | undefined>;
  getProductsByCategory(categoryId: number, limit?: number, offset?: number): Promise<{ products: Product[]; total: number }>;
  addProductToCategory(productId: number, categoryId: number, isPrimary?: boolean): Promise<ProductCategoryRelation>;
  removeProductFromCategory(productId: number, categoryId: number): Promise<void>;
  updateProductCategoryRelation(productId: number, categoryId: number, isPrimary: boolean): Promise<ProductCategoryRelation>;
  getProductCategories(productId: number): Promise<(Category & { isPrimary: boolean })[]>;

  // Product tags operations
  getAllProductTags(): Promise<ProductTag[]>;
  deleteCategory(id: number): Promise<void>;

  // Product Tag operations
  getProductTags(): Promise<ProductTag[]>;
  createProductTag(tag: InsertProductTag): Promise<ProductTag>;
  updateProductTag(id: number, tag: Partial<InsertProductTag>): Promise<ProductTag>;
  deleteProductTag(id: number): Promise<void>;

  // Bulk operations
  bulkUploadProducts(file: any, userId: string, defaultCategory?: string): Promise<any>;
  generateProductTemplate(categoryId?: number): Promise<string>;
  syncCertificationsToTags(certifications: string[]): Promise<void>;
  migrateExistingCertificationsToTags(): Promise<void>;
  assignTagToProduct(productId: number, tagId: number): Promise<void>;
  removeTagFromProduct(productId: number, tagId: number): Promise<void>;

  // Hero Slider operations
  getHeroSliders(): Promise<HeroSlider[]>;
  createHeroSlider(slider: InsertHeroSlider): Promise<HeroSlider>;
  updateHeroSlider(id: number, slider: Partial<InsertHeroSlider>): Promise<HeroSlider>;
  deleteHeroSlider(id: number): Promise<void>;

  // Product Document operations
  getProductDocuments(productId: number): Promise<ProductDocument[]>;
  createProductDocument(document: InsertProductDocument): Promise<ProductDocument>;
  updateProductDocument(id: number, document: Partial<InsertProductDocument>): Promise<ProductDocument>;
  deleteProductDocument(id: number): Promise<void>;

  // Inquiry operations
  getInquiries(filters?: {
    customerId?: string;
    status?: string;
    assignedTo?: string;
    inquiryType?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ inquiries: Inquiry[]; total: number }>;
  getInquiry(id: number): Promise<Inquiry | undefined>;
  createInquiry(inquiry: InsertInquiry): Promise<Inquiry>;
  updateInquiry(id: number, inquiry: Partial<InsertInquiry>): Promise<Inquiry>;
  
  // Sample Request operations
  getSampleRequests(filters?: {
    customerId?: string;
    status?: string;
    assignedTo?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ requests: SampleRequest[]; total: number }>;
  getSampleRequest(id: number): Promise<SampleRequest | undefined>;
  createSampleRequest(request: InsertSampleRequest): Promise<SampleRequest>;
  updateSampleRequest(id: number, request: Partial<InsertSampleRequest>): Promise<SampleRequest>;

  // Quotation operations
  getQuotations(filters?: {
    customerId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ quotations: Quotation[]; total: number }>;
  getQuotation(id: number): Promise<Quotation | undefined>;
  createQuotation(quotation: InsertQuotation): Promise<Quotation>;
  updateQuotation(id: number, quotation: Partial<InsertQuotation>): Promise<Quotation>;

  // Sales order operations
  getSalesOrders(filters?: {
    customerId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ orders: SalesOrder[]; total: number }>;
  getSalesOrder(id: number): Promise<SalesOrder | undefined>;

  // Purchase order operations
  getPurchaseOrders(filters?: {
    vendorId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ orders: PurchaseOrder[]; total: number }>;

  // Inventory operations
  getInventory(productId?: number): Promise<Inventory[]>;
  updateInventory(productId: number, quantity: number, batchNumber?: string): Promise<void>;

  // Document operations
  getProductDocuments(productId: number): Promise<ProductDocument[]>;
  uploadProductDocument(document: Omit<ProductDocument, 'id' | 'createdAt'>): Promise<ProductDocument>;

  // Analytics
  getDashboardStats(userId: string): Promise<{
    totalProducts: number;
    activeProducts: number;
    totalInquiries: number;
    totalQuotations: number;
    totalOrders: number;
    revenueThisMonth: number;
  }>;

  // Product FAQ methods
  getProductFaqs(productId: number): Promise<ProductFaq[]>;
  createProductFaq(faq: InsertProductFaq): Promise<ProductFaq>;
  updateProductFaq(id: number, updates: Partial<InsertProductFaq>): Promise<ProductFaq | undefined>;
  deleteProductFaq(id: number): Promise<void>;

  // Blog methods
  getBlogPosts(filters?: { category?: string; published?: boolean; limit?: number; offset?: number }): Promise<{ posts: BlogPost[]; total: number }>;
  getBlogPost(id: number): Promise<BlogPost | undefined>;
  getBlogPostBySlug(slug: string): Promise<BlogPost | undefined>;
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  updateBlogPost(id: number, updates: Partial<InsertBlogPost>): Promise<BlogPost | undefined>;
  deleteBlogPost(id: number): Promise<void>;

  // SEO monitoring methods
  getSeoIssues(type?: string): Promise<SeoMonitoring[]>;
  createSeoIssue(issue: InsertSeoMonitoring): Promise<SeoMonitoring>;
  updateSeoIssue(id: number, updates: Partial<InsertSeoMonitoring>): Promise<SeoMonitoring | undefined>;
  deleteSeoIssue(id: number): Promise<void>;

  // Core Web Vitals methods
  getCoreWebVitals(url?: string): Promise<CoreWebVitals[]>;
  recordCoreWebVitals(vitals: InsertCoreWebVitals): Promise<CoreWebVitals>;

  // Search methods
  getSearchSuggestions(query: string): Promise<SearchSuggestion[]>;
  recordSearchAnalytics(analytics: InsertSearchAnalytics): Promise<SearchAnalytics>;
  getPopularSearches(limit?: number): Promise<SearchAnalytics[]>;

  // Hreflang methods
  getHreflangConfig(pageType: string, pageId: string): Promise<HreflangConfig[]>;
  createHreflangConfig(config: InsertHreflangConfig): Promise<HreflangConfig>;
  updateHreflangConfig(id: number, updates: Partial<InsertHreflangConfig>): Promise<HreflangConfig | undefined>;
  deleteHreflangConfig(id: number): Promise<void>;

  // Global SEO Settings methods
  getGlobalSeoSettings(): Promise<GlobalSeoSettings | undefined>;
  updateGlobalSeoSettings(settings: Partial<InsertGlobalSeoSettings>): Promise<GlobalSeoSettings>;

  // Newsletter subscription methods
  subscribeToNewsletter(subscription: InsertNewsletterSubscription): Promise<NewsletterSubscription>;
  getNewsletterSubscription(email: string): Promise<NewsletterSubscription | undefined>;
  unsubscribeFromNewsletter(email: string): Promise<void>;
  getNewsletterSubscriptions(filters?: { isActive?: boolean; limit?: number; offset?: number }): Promise<{ subscriptions: NewsletterSubscription[]; total: number }>;
}

export class DatabaseStorage implements IStorage {
  // Generate unique Product ID
  private async generateProductId(): Promise<string> {
    const nextNum = await this.getNextProductIdNumber();
    return `BFI${nextNum.toString().padStart(3, '0')}`;
  }

  // Get the next product ID number for bulk generation
  private async getNextProductIdNumber(): Promise<number> {
    // Find the highest existing product ID number
    const result = await db.select({ 
      maxId: sql<number>`COALESCE(MAX(CAST(SUBSTRING(product_id FROM 4) AS INTEGER)), 0)`
    }).from(products).where(sql`product_id ~ '^BFI[0-9]+$'`);
    
    return (result[0]?.maxId || 0) + 1;
  }
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Customer operations
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createCustomer(data: InsertUser & { password: string }): Promise<User> {
    // Generate unique customer ID
    const customerId = `customer_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    const [user] = await db
      .insert(users)
      .values({
        id: customerId,
        ...data,
        password: data.password, // Explicitly include password
        userType: 'customer',
        role: 'customer',
        isActive: true,
      })
      .returning();
    return user;
  }

  async getCustomers(filters?: {
    search?: string;
    country?: string;
    industryType?: string;
    accountStatus?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ customers: User[]; total: number }> {
    const conditions = [eq(users.userType, 'customer')];
    
    if (filters?.search) {
      conditions.push(
        or(
          like(users.firstName, `%${filters.search}%`),
          like(users.lastName, `%${filters.search}%`),
          like(users.email, `%${filters.search}%`),
          like(users.companyName, `%${filters.search}%`)
        )
      );
    }
    
    if (filters?.country) {
      conditions.push(eq(users.country, filters.country));
    }
    
    if (filters?.industryType) {
      conditions.push(eq(users.industryType, filters.industryType));
    }
    
    if (filters?.accountStatus) {
      conditions.push(eq(users.accountStatus, filters.accountStatus));
    }

    const [totalResult] = await db
      .select({ count: count() })
      .from(users)
      .where(and(...conditions));

    const customers = await db
      .select()
      .from(users)
      .where(and(...conditions))
      .orderBy(desc(users.createdAt))
      .limit(filters?.limit || 50)
      .offset(filters?.offset || 0);

    return {
      customers,
      total: totalResult.count,
    };
  }

  async updateCustomer(id: string, data: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Product operations
  async getProducts(filters?: {
    category?: string[];
    search?: string;
    materials?: string[];
    productType?: string[];
    healthSupport?: string[];
    origin?: string[];
    form?: string[];
    inStock?: boolean;
    priceRange?: [number, number];
    sortBy?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ products: Product[]; total: number }> {
    // For public API, show products that are active and visible (regardless of draft/active status)
    const conditions = [
      eq(products.isActive, true),
      eq(products.isVisible, true)
    ];
    
    // Category filter (support multiple categories by name)
    if (filters?.category && filters.category.length > 0) {
      const categoryNames = filters.category;
      // First get category IDs from names
      const categoryResults = await db
        .select({ id: categories.id })
        .from(categories)
        .where(
          or(...categoryNames.map(name => 
            sql`${categories.name} ILIKE ${`%${name}%`}`
          ))
        );
      
      if (categoryResults.length > 0) {
        const categoryIds = categoryResults.map(cat => cat.id);
        const categoryConditions = categoryIds.map(id => eq(products.categoryId, id));
        conditions.push(or(...categoryConditions));
      }
    }
    
    // Search filter with better relevance
    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase().trim();
      const exactWordPattern = `% ${searchTerm} %`;
      const startsWithPattern = `${searchTerm}%`;
      const containsPattern = `%${searchTerm}%`;
      
      // Prioritize exact word matches, then starts with, then contains
      conditions.push(
        or(
          // Exact word match in name (highest priority)
          sql`LOWER(${products.name}) LIKE ${exactWordPattern}`,
          sql`LOWER(${products.name}) LIKE ${startsWithPattern}`,
          // Exact word match in other fields
          sql`LOWER(${products.botanicalName}) LIKE ${exactWordPattern}`,
          sql`LOWER(${products.botanicalName}) LIKE ${startsWithPattern}`,
          sql`LOWER(${products.productId}) LIKE ${startsWithPattern}`,
          // Contains match (lower priority)
          sql`LOWER(${products.name}) LIKE ${containsPattern}`,
          sql`LOWER(${products.description}) LIKE ${containsPattern}`,
          sql`LOWER(${products.botanicalName}) LIKE ${containsPattern}`
        )
      );
    }
    
    // Materials filter - maps to productType field (organic, natural, conventional, wildcrafted)
    if (filters?.materials && filters.materials.length > 0) {
      const materialConditions = filters.materials.map(material => 
        eq(products.productType, material)
      );
      conditions.push(or(...materialConditions));
    }

    // Product Type filter (organic, natural, conventional, synthetic, nature_identical, other)
    if (filters?.productType && filters.productType.length > 0) {
      const productTypeConditions = filters.productType.map(type => 
        eq(products.productType, type)
      );
      conditions.push(or(...productTypeConditions));
    }

    // Health Support filter
    if (filters?.healthSupport && filters.healthSupport.length > 0) {
      const healthConditions = filters.healthSupport.map(health => 
        sql`${products.healthSupport} ILIKE ${`%${health}%`}`
      );
      conditions.push(or(...healthConditions));
    }

    // Origin filter
    if (filters?.origin && filters.origin.length > 0) {
      const originConditions = filters.origin.map(origin => 
        sql`${products.origin} ILIKE ${`%${origin}%`}`
      );
      conditions.push(or(...originConditions));
    }

    // Form filter
    if (filters?.form && filters.form.length > 0) {
      const formConditions = filters.form.map(form => 
        sql`${products.form} ILIKE ${`%${form}%`}`
      );
      conditions.push(or(...formConditions));
    }

    // Stock filter
    if (filters?.inStock === true) {
      conditions.push(sql`${products.currentStock} > 0`);
    }

    // Price range filter
    if (filters?.priceRange) {
      const [minPrice, maxPrice] = filters.priceRange;
      conditions.push(
        sql`${products.priceUSD} >= ${minPrice} AND ${products.priceUSD} <= ${maxPrice}`
      );
    }

    const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

    // Determine sort order with search relevance
    let orderBy;
    if (filters?.search) {
      // When searching, order by name for simplicity (avoid complex SQL in orderBy)
      orderBy = asc(products.name);
    } else {
      switch (filters?.sortBy) {
        case 'price-low':
          orderBy = asc(products.priceUSD);
          break;
        case 'price-high':
          orderBy = desc(products.priceUSD);
          break;
        case 'name':
          orderBy = asc(products.name);
          break;
        case 'newest':
        default:
          orderBy = desc(products.createdAt);
          break;
      }
    }

    let query = db
      .select({
        ...products,
        isOrganic: sql<boolean>`CASE WHEN ${products.productType} ILIKE '%organic%' THEN true ELSE false END`,
      })
      .from(products)
      .where(whereClause)
      .limit(filters?.limit || 50)
      .offset(filters?.offset || 0);
      
    if (orderBy) {
      query = query.orderBy(orderBy);
    }

    const [productsResult, totalResult] = await Promise.all([
      query,
      db
        .select({ count: count() })
        .from(products)
        .where(whereClause),
    ]);

    // Load tags for each product
    const productsWithTags = await Promise.all(
      productsResult.map(async (product) => {
        const productTagsForProduct = await db
          .select({
            id: productTags.id,
            name: productTags.name,
            slug: productTags.slug,
            color: productTags.color,
            description: productTags.description,
          })
          .from(productTags)
          .innerJoin(productTagRelations, eq(productTagRelations.tagId, productTags.id))
          .where(
            and(
              eq(productTagRelations.productId, product.id),
              eq(productTags.isActive, true)
            )
          );
        
        return {
          ...product,
          tags: productTagsForProduct,
        };
      })
    );

    return {
      products: productsWithTags,
      total: totalResult[0].count,
    };
  }

  async getAdminProducts(filters?: {
    category?: string;
    search?: string;
    status?: string;
    dateFilter?: string;
    visibility?: string;
    sortBy?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ products: Product[]; total: number }> {
    // For admin API, show all products but respect status filter
    const conditions = [];
    
    // Handle status filter for active/inactive products
    if (filters?.status === 'active') {
      conditions.push(eq(products.isActive, true));
    } else if (filters?.status === 'inactive') {
      conditions.push(eq(products.isActive, false));
    }
    // If no status filter or "all", don't add isActive condition to show all products
    
    if (filters?.category && !isNaN(parseInt(filters.category))) {
      conditions.push(eq(products.categoryId, parseInt(filters.category)));
    }
    
    if (filters?.search) {
      const searchTerm = filters.search.trim();
      
      // Use full-text search for better performance on larger datasets
      if (searchTerm.length > 2) {
        // Full-text search with fallback to LIKE
        conditions.push(
          sql`(
            to_tsvector('english', ${products.name}) @@ plainto_tsquery('english', ${searchTerm}) OR
            to_tsvector('english', ${products.description}) @@ plainto_tsquery('english', ${searchTerm}) OR
            to_tsvector('english', coalesce(${products.botanicalName}, '')) @@ plainto_tsquery('english', ${searchTerm}) OR
            LOWER(${products.name}) LIKE ${`%${searchTerm.toLowerCase()}%`} OR
            LOWER(${products.origin}) LIKE ${`%${searchTerm.toLowerCase()}%`} OR
            LOWER(${products.form}) LIKE ${`%${searchTerm.toLowerCase()}%`}
          )`
        );
      } else {
        // For short search terms, use optimized LIKE
        const searchTermLower = searchTerm.toLowerCase();
        conditions.push(
          sql`(
            LOWER(${products.name}) LIKE ${`%${searchTermLower}%`} OR 
            LOWER(${products.origin}) LIKE ${`%${searchTermLower}%`} OR
            LOWER(${products.form}) LIKE ${`%${searchTermLower}%`}
          )`
        );
      }
    }

    // Optimized date filtering using native PostgreSQL date functions
    if (filters?.dateFilter) {
      let dateCondition;
      
      switch (filters.dateFilter) {
        case 'today':
          dateCondition = sql`${products.createdAt} >= CURRENT_DATE`;
          break;
        case 'week':
          dateCondition = sql`${products.createdAt} >= CURRENT_DATE - INTERVAL '7 days'`;
          break;
        case 'month':
          dateCondition = sql`${products.createdAt} >= CURRENT_DATE - INTERVAL '1 month'`;
          break;
        case '3months':
          dateCondition = sql`${products.createdAt} >= CURRENT_DATE - INTERVAL '3 months'`;
          break;
        case '6months':
          dateCondition = sql`${products.createdAt} >= CURRENT_DATE - INTERVAL '6 months'`;
          break;
        case 'year':
          dateCondition = sql`${products.createdAt} >= CURRENT_DATE - INTERVAL '1 year'`;
          break;
      }
      
      if (dateCondition) {
        conditions.push(dateCondition);
      }
    }

    // Visibility filtering
    if (filters?.visibility) {
      if (filters.visibility === 'visible') {
        conditions.push(eq(products.isVisible, true));
      } else if (filters.visibility === 'hidden') {
        conditions.push(eq(products.isVisible, false));
      }
    }

    const whereClause = conditions.length > 1 ? and(...conditions) : (conditions.length === 1 ? conditions[0] : undefined);

    // Determine sort order
    let orderBy;
    switch (filters?.sortBy) {
      case 'oldest':
        orderBy = asc(products.createdAt);
        break;
      case 'name-az':
        orderBy = asc(products.name);
        break;
      case 'name-za':
        orderBy = desc(products.name);
        break;
      case 'sku-az':
        orderBy = asc(products.productId);
        break;
      case 'sku-za':
        orderBy = desc(products.productId);
        break;
      case 'price-high':
        orderBy = desc(products.priceUSD);
        break;
      case 'price-low':
        orderBy = asc(products.priceUSD);
        break;
      case 'newest':
      default:
        orderBy = desc(products.createdAt);
        break;
    }

    // Optimized parallel queries with hints for index usage
    const [productsResult, totalResult] = await Promise.all([
      db
        .select({
          ...products,
          isOrganic: sql<boolean>`CASE WHEN ${products.productType} ILIKE '%organic%' THEN true ELSE false END`,
        })
        .from(products)
        .where(whereClause || undefined)
        .orderBy(orderBy)
        .limit(filters?.limit || 100)
        .offset(filters?.offset || 0),
      // Optimized count query - only count when needed for pagination
      filters?.offset && filters.offset > 0 ? 
        db
          .select({ count: count() })
          .from(products)
          .where(whereClause || undefined)
        : Promise.resolve([{ count: 0 }]) // Skip count for first page to improve performance
    ]);

    return {
      products: productsResult,
      total: totalResult[0].count,
    };
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db
      .select({
        ...products,
        isOrganic: sql<boolean>`CASE WHEN ${products.productType} ILIKE '%organic%' THEN true ELSE false END`,
      })
      .from(products)
      .where(eq(products.id, id));
    return product;
  }

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    const [product] = await db
      .select({
        ...products,
        isOrganic: sql<boolean>`CASE WHEN ${products.productType} ILIKE '%organic%' THEN true ELSE false END`,
      })
      .from(products)
      .where(
        and(eq(products.slug, slug), eq(products.isActive, true))
      );
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    // Generate unique product ID if not provided or ensure uniqueness
    if (!product.productId) {
      product.productId = await this.generateProductId();
    } else {
      // Check if provided product ID already exists
      const existing = await db.select({ count: count() }).from(products).where(eq(products.productId, product.productId));
      if (existing[0].count > 0) {
        throw new Error(`Product ID ${product.productId} already exists. Please use a different ID or leave blank to auto-generate.`);
      }
    }
    
    // Generate slug from name if not provided
    if (!product.slug && product.name) {
      product.slug = product.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
    
    // Process array fields to ensure they're properly formatted for PostgreSQL
    const processedProduct = { ...product };
    
    // Handle PostgreSQL text[] array for additionalDocs
    if (processedProduct.additionalDocs !== undefined) {
      if (typeof processedProduct.additionalDocs === 'string') {
        try {
          const parsed = JSON.parse(processedProduct.additionalDocs);
          processedProduct.additionalDocs = Array.isArray(parsed) ? parsed : [];
        } catch {
          processedProduct.additionalDocs = [];
        }
      } else if (!Array.isArray(processedProduct.additionalDocs)) {
        processedProduct.additionalDocs = [];
      }
      // Ensure all elements are strings for PostgreSQL text[] array
      processedProduct.additionalDocs = processedProduct.additionalDocs.map((item: any) => String(item));
      
      // If array is empty, set to null to avoid PostgreSQL array parsing issues
      if (processedProduct.additionalDocs.length === 0) {
        processedProduct.additionalDocs = null as any;
      }
    }
    
    if (processedProduct.galleryImages && typeof processedProduct.galleryImages === 'string') {
      try {
        processedProduct.galleryImages = JSON.parse(processedProduct.galleryImages);
      } catch {
        processedProduct.galleryImages = [];
      }
    }
    
    if (processedProduct.certifications && typeof processedProduct.certifications === 'string') {
      try {
        processedProduct.certifications = JSON.parse(processedProduct.certifications);
      } catch {
        processedProduct.certifications = [];
      }
    }
    
    if (processedProduct.bulkPricing && typeof processedProduct.bulkPricing === 'string') {
      try {
        processedProduct.bulkPricing = JSON.parse(processedProduct.bulkPricing);
      } catch {
        processedProduct.bulkPricing = [];
      }
    }
    
    const [newProduct] = await db.insert(products).values([processedProduct]).returning();
    
    // Handle FAQs - if provided in the faqs field, save them to the productFaqs table
    if (processedProduct.faqs && Array.isArray(processedProduct.faqs) && processedProduct.faqs.length > 0) {
      console.log('Creating FAQs for new product:', newProduct.id, processedProduct.faqs);
      for (let i = 0; i < processedProduct.faqs.length; i++) {
        const faq = processedProduct.faqs[i];
        if (faq.question && faq.answer) {
          await this.createProductFaq({
            productId: newProduct.id,
            question: faq.question,
            answer: faq.answer,
            displayOrder: i + 1,
            isActive: true
          });
        }
      }
    }
    
    // Sync certifications with tag system
    if (processedProduct.certifications && Array.isArray(processedProduct.certifications)) {
      await this.syncCertificationsToTags(processedProduct.certifications);
    }
    
    return newProduct;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product> {
    // Process array fields to ensure they're properly formatted for PostgreSQL
    const processedProduct = { ...product };
    
    // Handle PostgreSQL text[] array for additionalDocs
    if (processedProduct.additionalDocs !== undefined) {
      if (typeof processedProduct.additionalDocs === 'string') {
        try {
          const parsed = JSON.parse(processedProduct.additionalDocs);
          processedProduct.additionalDocs = Array.isArray(parsed) ? parsed : [];
        } catch {
          processedProduct.additionalDocs = [];
        }
      } else if (!Array.isArray(processedProduct.additionalDocs)) {
        processedProduct.additionalDocs = [];
      }
      // Ensure all elements are strings for PostgreSQL text[] array
      processedProduct.additionalDocs = processedProduct.additionalDocs.map((item: any) => String(item));
      
      // If array is empty, set to null to avoid PostgreSQL array parsing issues
      if (processedProduct.additionalDocs.length === 0) {
        processedProduct.additionalDocs = null as any;
      }
    }
    
    // Handle JSONB fields - ensure they're proper objects/arrays, not strings
    const jsonbFields = ['galleryImages', 'certifications', 'bulkPricing'];
    
    jsonbFields.forEach(field => {
      const fieldValue = (processedProduct as any)[field];
      if (fieldValue !== undefined) {
        if (typeof fieldValue === 'string') {
          try {
            (processedProduct as any)[field] = JSON.parse(fieldValue);
          } catch {
            (processedProduct as any)[field] = [];
          }
        } else if (!Array.isArray(fieldValue)) {
          (processedProduct as any)[field] = [];
        }
        
        // For JSONB fields, empty arrays are fine - no need to convert to null
      }
    });

    const [updatedProduct] = await db
      .update(products)
      .set({ ...processedProduct, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    
    // Handle FAQs - if provided in the faqs field, sync them to the productFaqs table
    if (processedProduct.faqs !== undefined) {
      // First delete existing FAQs for this product
      await db.delete(productFaqs).where(eq(productFaqs.productId, id));
      
      // If new FAQs are provided, add them
      if (Array.isArray(processedProduct.faqs) && processedProduct.faqs.length > 0) {
        console.log('Updating FAQs for product:', id, processedProduct.faqs);
        for (let i = 0; i < processedProduct.faqs.length; i++) {
          const faq = processedProduct.faqs[i];
          if (faq.question && faq.answer) {
            await this.createProductFaq({
              productId: id,
              question: faq.question,
              answer: faq.answer,
              displayOrder: i + 1,
              isActive: true
            });
          }
        }
      }
    }
      
    // Sync certifications with tag system
    if (processedProduct.certifications && Array.isArray(processedProduct.certifications)) {
      await this.syncCertificationsToTags(processedProduct.certifications);
    }
    
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<void> {
    // Hard delete - permanently remove from database
    await db.delete(products).where(eq(products.id, id));
  }

  // Featured Products operations
  async getFeaturedProducts(limit: number = 8): Promise<Product[]> {
    return await db.select()
      .from(products)
      .where(
        and(
          eq(products.isFeatured, true),
          eq(products.isActive, true),
          eq(products.isVisible, true)
        )
      )
      .orderBy(asc(products.featuredOrder), desc(products.createdAt))
      .limit(limit);
  }

  async updateProductFeaturedStatus(id: number, isFeatured: boolean, featuredOrder: number = 0): Promise<Product> {
    const [updatedProduct] = await db
      .update(products)
      .set({ 
        isFeatured, 
        featuredOrder,
        updatedAt: new Date()
      })
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  // Related Products operations
  async getFrequentlyBoughtTogether(productId: number, limit: number = 8): Promise<Product[]> {
    // Get the current product details
    const currentProduct = await this.getProduct(productId);
    if (!currentProduct) return [];

    // Strategy: Get products from the same category, excluding the current product
    const relatedProducts = await db.select()
      .from(products)
      .where(
        and(
          eq(products.categoryId, currentProduct.categoryId),
          eq(products.isActive, true),
          eq(products.isVisible, true),
          sql`${products.id} != ${productId}` // Exclude current product
        )
      )
      .orderBy(desc(products.createdAt)) // Most recent products first
      .limit(limit);

    return relatedProducts;
  }

  async getSimilarProducts(productId: number, limit: number = 8): Promise<Product[]> {
    // Get the current product details
    const currentProduct = await this.getProduct(productId);
    if (!currentProduct) return [];

    // Strategy: Get products with similar properties (origin, productType, form, etc.)
    // Priority order: same origin > same productType > same form > same category
    const conditions = [
      eq(products.isActive, true),
      eq(products.isVisible, true),
      sql`${products.id} != ${productId}` // Exclude current product
    ];

    // Build similarity conditions
    let similarityConditions = [];
    
    if (currentProduct.origin) {
      similarityConditions.push(eq(products.origin, currentProduct.origin));
    }
    
    if (currentProduct.productType) {
      similarityConditions.push(eq(products.productType, currentProduct.productType));
    }
    
    if (currentProduct.form) {
      similarityConditions.push(eq(products.form, currentProduct.form));
    }

    // If we have similarity conditions, use OR to match any of them
    // Otherwise, fall back to same category
    if (similarityConditions.length > 0) {
      conditions.push(or(...similarityConditions));
    } else if (currentProduct.categoryId) {
      conditions.push(eq(products.categoryId, currentProduct.categoryId));
    }

    const similarProducts = await db.select()
      .from(products)
      .where(and(...conditions))
      .orderBy(
        // Prefer products with same origin first, then same type, then newest
        currentProduct.origin ? sql`CASE WHEN ${products.origin} = ${currentProduct.origin} THEN 0 ELSE 1 END` : sql`1`,
        currentProduct.productType ? sql`CASE WHEN ${products.productType} = ${currentProduct.productType} THEN 0 ELSE 1 END` : sql`1`,
        desc(products.createdAt)
      )
      .limit(limit);

    // If we don't have enough similar products, fill with products from same category
    if (similarProducts.length < limit && currentProduct.categoryId) {
      const existingIds = similarProducts.map(p => p.id);
      const additionalProducts = await db.select()
        .from(products)
        .where(
          and(
            eq(products.categoryId, currentProduct.categoryId),
            eq(products.isActive, true),
            eq(products.isVisible, true),
            sql`${products.id} != ${productId}`,
            existingIds.length > 0 ? sql`${products.id} NOT IN (${existingIds.join(',')})` : sql`1=1`
          )
        )
        .orderBy(desc(products.createdAt))
        .limit(limit - similarProducts.length);

      return [...similarProducts, ...additionalProducts];
    }

    return similarProducts;
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).where(eq(categories.isActive, true)).orderBy(asc(categories.name));
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category> {
    const [updatedCategory] = await db
      .update(categories)
      .set(category)
      .where(eq(categories.id, id))
      .returning();
    return updatedCategory;
  }

  async deleteCategory(id: number): Promise<void> {
    await db.update(categories).set({ isActive: false }).where(eq(categories.id, id));
  }

  // Product-Category relationship operations
  async getProductWithCategories(productId: number): Promise<ProductWithCategories | undefined> {
    // Get the product first
    const [product] = await db.select().from(products).where(eq(products.id, productId));
    if (!product) return undefined;

    // Get all categories for this product
    const categoryRelations = await db
      .select({
        category: categories,
        isPrimary: productCategoryRelations.isPrimary,
      })
      .from(productCategoryRelations)
      .innerJoin(categories, eq(productCategoryRelations.categoryId, categories.id))
      .where(eq(productCategoryRelations.productId, productId));

    const categoriesWithPrimary = categoryRelations.map(rel => ({
      ...rel.category,
      isPrimary: rel.isPrimary
    }));

    const primaryCategory = categoriesWithPrimary.find(cat => cat.isPrimary);

    return {
      ...product,
      categories: categoriesWithPrimary,
      primaryCategory: primaryCategory || undefined
    };
  }

  async getProductsByCategory(categoryId: number, limit = 50, offset = 0): Promise<{ products: Product[]; total: number }> {
    // Get products in this category through the junction table
    const productQuery = db
      .select({ product: products })
      .from(productCategoryRelations)
      .innerJoin(products, eq(productCategoryRelations.productId, products.id))
      .where(
        and(
          eq(productCategoryRelations.categoryId, categoryId),
          eq(products.isActive, true)
        )
      )
      .limit(limit)
      .offset(offset);

    const countQuery = db
      .select({ count: count() })
      .from(productCategoryRelations)
      .innerJoin(products, eq(productCategoryRelations.productId, products.id))
      .where(
        and(
          eq(productCategoryRelations.categoryId, categoryId),
          eq(products.isActive, true)
        )
      );

    const [productResults, countResults] = await Promise.all([
      productQuery,
      countQuery
    ]);

    return {
      products: productResults.map(r => r.product),
      total: countResults[0]?.count || 0
    };
  }

  async addProductToCategory(productId: number, categoryId: number, isPrimary = false): Promise<ProductCategoryRelation> {
    // If setting as primary, first unset any existing primary category for this product
    if (isPrimary) {
      await db
        .update(productCategoryRelations)
        .set({ isPrimary: false })
        .where(eq(productCategoryRelations.productId, productId));
    }

    // Insert or update the relationship
    const [relation] = await db
      .insert(productCategoryRelations)
      .values({ productId, categoryId, isPrimary })
      .onConflictDoUpdate({
        target: [productCategoryRelations.productId, productCategoryRelations.categoryId],
        set: { isPrimary }
      })
      .returning();

    return relation;
  }

  async removeProductFromCategory(productId: number, categoryId: number): Promise<void> {
    await db
      .delete(productCategoryRelations)
      .where(
        and(
          eq(productCategoryRelations.productId, productId),
          eq(productCategoryRelations.categoryId, categoryId)
        )
      );
  }

  async updateProductCategoryRelation(productId: number, categoryId: number, isPrimary: boolean): Promise<ProductCategoryRelation> {
    // If setting as primary, first unset any existing primary category for this product
    if (isPrimary) {
      await db
        .update(productCategoryRelations)
        .set({ isPrimary: false })
        .where(eq(productCategoryRelations.productId, productId));
    }

    const [relation] = await db
      .update(productCategoryRelations)
      .set({ isPrimary })
      .where(
        and(
          eq(productCategoryRelations.productId, productId),
          eq(productCategoryRelations.categoryId, categoryId)
        )
      )
      .returning();

    return relation;
  }

  async getProductCategories(productId: number): Promise<(Category & { isPrimary: boolean })[]> {
    const categoryRelations = await db
      .select({
        category: categories,
        isPrimary: productCategoryRelations.isPrimary,
      })
      .from(productCategoryRelations)
      .innerJoin(categories, eq(productCategoryRelations.categoryId, categories.id))
      .where(eq(productCategoryRelations.productId, productId));

    return categoryRelations.map(rel => ({
      ...rel.category,
      isPrimary: rel.isPrimary
    }));
  }

  // Product Tag operations
  async getProductTags(): Promise<ProductTag[]> {
    return await db.select().from(productTags).where(eq(productTags.isActive, true)).orderBy(asc(productTags.name));
  }

  async createProductTag(tag: InsertProductTag): Promise<ProductTag> {
    // Auto-generate slug if not provided
    if (!tag.slug && tag.name) {
      tag.slug = tag.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
    
    const [newTag] = await db.insert(productTags).values([tag]).returning();
    return newTag;
  }

  async updateProductTag(id: number, tag: Partial<InsertProductTag>): Promise<ProductTag> {
    const [updatedTag] = await db
      .update(productTags)
      .set(tag)
      .where(eq(productTags.id, id))
      .returning();
    return updatedTag;
  }

  async deleteProductTag(id: number): Promise<void> {
    await db.update(productTags).set({ isActive: false }).where(eq(productTags.id, id));
  }

  // Tag synchronization method
  async syncCertificationsToTags(certifications: string[]): Promise<void> {
    if (!certifications || !Array.isArray(certifications)) return;
    
    // Get existing tags
    const existingTags = await this.getProductTags();
    const existingTagNames = existingTags.map(tag => tag.name);
    
    // Find missing certifications that need to be created as tags
    const missingCertifications = certifications.filter(cert => 
      cert && typeof cert === 'string' && cert.trim() && !existingTagNames.includes(cert.trim())
    );
    
    // Create missing tags
    for (const certName of missingCertifications) {
      const tagSlug = certName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      
      try {
        await this.createProductTag({
          name: certName.trim(),
          slug: tagSlug,
          color: '#22C55E', // Green color for certification tags
          description: `Certification tag: ${certName}`,
          isActive: true
        });
        console.log(`Created tag for certification: ${certName}`);
      } catch (error) {
        // Tag might already exist due to concurrent operations, ignore duplicate errors
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (!errorMessage?.includes('unique') && !errorMessage?.includes('duplicate')) {
          console.error(`Failed to create tag for certification ${certName}:`, error);
        }
      }
    }
  }

  // Migration method to sync existing product certifications to tags
  async migrateExistingCertificationsToTags(): Promise<void> {
    console.log('Starting migration of existing product certifications to tags...');
    
    try {
      // Get all products with certifications
      const allProducts = await db.select().from(products).where(eq(products.isActive, true));
      
      // Collect all unique certifications
      const allCertifications = new Set<string>();
      
      for (const product of allProducts) {
        if (product.certifications && Array.isArray(product.certifications)) {
          product.certifications.forEach((cert: string) => {
            if (cert && typeof cert === 'string' && cert.trim()) {
              allCertifications.add(cert.trim());
            }
          });
        }
      }
      
      // Sync all collected certifications to tags
      if (allCertifications.size > 0) {
        await this.syncCertificationsToTags(Array.from(allCertifications));
        console.log(`Migration completed: ${allCertifications.size} unique certifications processed`);
      } else {
        console.log('No certifications found to migrate');
      }
    } catch (error) {
      console.error('Failed to migrate existing certifications to tags:', error);
    }
  }

  async assignTagToProduct(productId: number, tagId: number): Promise<void> {
    await db.insert(productTagRelations).values({ productId, tagId });
  }

  async removeTagFromProduct(productId: number, tagId: number): Promise<void> {
    await db.delete(productTagRelations)
      .where(and(
        eq(productTagRelations.productId, productId),
        eq(productTagRelations.tagId, tagId)
      ));
  }

  async getAllProductTags(): Promise<ProductTag[]> {
    return await db.select().from(productTags)
      .where(eq(productTags.isActive, true))
      .orderBy(asc(productTags.name));
  }

  // Hero Slider operations
  async getHeroSliders(): Promise<HeroSlider[]> {
    return await db.select().from(heroSliders).orderBy(asc(heroSliders.sortOrder));
  }

  async createHeroSlider(slider: InsertHeroSlider): Promise<HeroSlider> {
    const [newSlider] = await db.insert(heroSliders).values(slider).returning();
    return newSlider;
  }

  async updateHeroSlider(id: number, slider: Partial<InsertHeroSlider>): Promise<HeroSlider> {
    const [updatedSlider] = await db
      .update(heroSliders)
      .set({ ...slider, updatedAt: new Date() })
      .where(eq(heroSliders.id, id))
      .returning();
    return updatedSlider;
  }

  async deleteHeroSlider(id: number): Promise<void> {
    await db.delete(heroSliders).where(eq(heroSliders.id, id));
  }

  // Product Document operations
  async getProductDocuments(productId: number): Promise<ProductDocument[]> {
    return await db.select().from(productDocuments)
      .where(eq(productDocuments.productId, productId))
      .orderBy(asc(productDocuments.createdAt));
  }

  async createProductDocument(document: InsertProductDocument): Promise<ProductDocument> {
    const [newDocument] = await db.insert(productDocuments).values(document).returning();
    return newDocument;
  }

  async updateProductDocument(id: number, document: Partial<InsertProductDocument>): Promise<ProductDocument> {
    const [updatedDocument] = await db
      .update(productDocuments)
      .set(document)
      .where(eq(productDocuments.id, id))
      .returning();
    return updatedDocument;
  }

  async deleteProductDocument(id: number): Promise<void> {
    await db.delete(productDocuments).where(eq(productDocuments.id, id));
  }

  // Inquiry operations
  async getInquiries(filters?: {
    customerId?: string;
    status?: string;
    assignedTo?: string;
    inquiryType?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ inquiries: (Inquiry & { productName?: string })[]; total: number }> {
    const conditions = [];
    if (filters?.customerId) conditions.push(eq(inquiries.customerId, filters.customerId));
    if (filters?.status) conditions.push(eq(inquiries.status, filters.status));
    if (filters?.assignedTo) conditions.push(eq(inquiries.assignedTo, filters.assignedTo));
    if (filters?.inquiryType) conditions.push(eq(inquiries.inquiryType, filters.inquiryType));
    
    const whereClause = conditions.length > 0 ? (conditions.length === 1 ? conditions[0] : and(...conditions)) : undefined;
    
    const [inquiriesResult, totalResult] = await Promise.all([
      db
        .select({
          ...inquiries,
          productName: products.name
        })
        .from(inquiries)
        .leftJoin(products, eq(inquiries.productId, products.id))
        .where(whereClause)
        .orderBy(desc(inquiries.createdAt))
        .limit(filters?.limit || 50)
        .offset(filters?.offset || 0),
      db
        .select({ count: count() })
        .from(inquiries)
        .where(whereClause)
    ]);
    
    return { 
      inquiries: inquiriesResult, 
      total: totalResult[0].count 
    };
  }

  async getInquiry(id: number): Promise<Inquiry | undefined> {
    const [inquiry] = await db.select().from(inquiries).where(eq(inquiries.id, id));
    return inquiry;
  }

  async createInquiry(inquiry: InsertInquiry): Promise<Inquiry> {
    try {
      // Generate inquiry ID based on type
      const prefix = inquiry.inquiryType === 'high_volume_bid' ? 'BID' : 'INQ';
      const inquiryId = `${prefix}${Date.now()}`;
      
      console.log('Creating inquiry with data:', { ...inquiry, inquiryId });
      
      const [newInquiry] = await db
        .insert(inquiries)
        .values({ 
          ...inquiry, 
          inquiryId,
          status: 'pending',
          createdAt: new Date()
        })
        .returning();
      
      console.log('Inquiry created successfully:', newInquiry);
      return newInquiry;
    } catch (error) {
      console.error('Database error creating inquiry:', error);
      throw error;
    }
  }

  // Sample Request operations
  async getSampleRequests(filters?: {
    customerId?: string;
    status?: string;
    assignedTo?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ requests: SampleRequest[]; total: number }> {
    const conditions = [];
    if (filters?.customerId) conditions.push(eq(sampleRequests.customerId, filters.customerId));
    if (filters?.status) conditions.push(eq(sampleRequests.status, filters.status));
    if (filters?.assignedTo) conditions.push(eq(sampleRequests.assignedTo, filters.assignedTo));
    
    const whereClause = conditions.length > 0 ? (conditions.length === 1 ? conditions[0] : and(...conditions)) : undefined;
    
    const [requestsResult, totalResult] = await Promise.all([
      db
        .select()
        .from(sampleRequests)
        .where(whereClause)
        .orderBy(desc(sampleRequests.createdAt))
        .limit(filters?.limit || 50)
        .offset(filters?.offset || 0),
      db
        .select({ count: count() })
        .from(sampleRequests)
        .where(whereClause)
    ]);
    
    return { 
      requests: requestsResult, 
      total: totalResult[0].count 
    };
  }

  async getSampleRequest(id: number): Promise<SampleRequest | undefined> {
    const [request] = await db.select().from(sampleRequests).where(eq(sampleRequests.id, id));
    return request;
  }

  async createSampleRequest(request: InsertSampleRequest): Promise<SampleRequest> {
    // Generate request ID
    const requestId = `SAM${Date.now()}`;
    const [newRequest] = await db
      .insert(sampleRequests)
      .values({ ...request, requestId })
      .returning();
    return newRequest;
  }

  async updateSampleRequest(id: number, request: Partial<InsertSampleRequest>): Promise<SampleRequest> {
    const [updatedRequest] = await db
      .update(sampleRequests)
      .set({ ...request, updatedAt: new Date() })
      .where(eq(sampleRequests.id, id))
      .returning();
    return updatedRequest;
  }

  async updateInquiry(id: number, inquiry: Partial<InsertInquiry>): Promise<Inquiry> {
    const [updatedInquiry] = await db
      .update(inquiries)
      .set({ ...inquiry, updatedAt: new Date() })
      .where(eq(inquiries.id, id))
      .returning();
    return updatedInquiry;
  }

  // Quotation operations
  async getQuotations(filters?: {
    customerId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ quotations: any[]; total: number }> {
    const conditions = [];
    
    if (filters?.customerId) {
      conditions.push(eq(quotations.customerId, filters.customerId));
    }
    
    if (filters?.status) {
      conditions.push(eq(quotations.status, filters.status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [quotationsResult, totalResult] = await Promise.all([
      db
        .select({
          // Quotation fields
          id: quotations.id,
          quotationId: quotations.quotationId,
          inquiryId: quotations.inquiryId,
          customerId: quotations.customerId,
          validUntil: quotations.validUntil,
          totalAmount: quotations.totalAmount,
          currency: quotations.currency,
          priceType: quotations.priceType,
          status: quotations.status,
          terms: quotations.terms,
          notes: quotations.notes,
          createdBy: quotations.createdBy,
          createdAt: quotations.createdAt,
          updatedAt: quotations.updatedAt,
          // Product info from inquiry
          productName: products.name,
          productId: products.productId,
          // Inquiry details for missing quotation items
          quantity: inquiries.quantity,
          unit: inquiries.unit,
          unitPrice: sql<number>`CASE WHEN ${quotations.totalAmount} IS NOT NULL AND ${inquiries.quantity} IS NOT NULL AND ${inquiries.quantity} > 0 THEN ${quotations.totalAmount} / ${inquiries.quantity} ELSE 0 END`,
          // Payment and delivery terms
          paymentTerms: sql<string>`CASE WHEN ${quotations.terms} LIKE '%Payment%' THEN TRIM(SUBSTRING(${quotations.terms} FROM 'Payment[^:]*:([^\\n]+)')) ELSE '30 days net' END`,
          deliveryTerms: sql<string>`CASE WHEN ${quotations.terms} LIKE '%Delivery%' THEN TRIM(SUBSTRING(${quotations.terms} FROM 'Delivery[^:]*:([^\\n]+)')) ELSE ${quotations.priceType} END`,
        })
        .from(quotations)
        .leftJoin(inquiries, eq(quotations.inquiryId, inquiries.id))
        .leftJoin(products, eq(inquiries.productId, products.id))
        .where(whereClause)
        .limit(filters?.limit || 50)
        .offset(filters?.offset || 0)
        .orderBy(desc(quotations.createdAt)),
      db
        .select({ count: count() })
        .from(quotations)
        .where(whereClause),
    ]);

    return {
      quotations: quotationsResult,
      total: totalResult[0].count,
    };
  }

  async getQuotation(id: number): Promise<Quotation | undefined> {
    const [quotation] = await db.select().from(quotations).where(eq(quotations.id, id));
    return quotation;
  }

  async createQuotation(quotation: InsertQuotation): Promise<Quotation> {
    // Generate quotation ID
    const quotationId = `QUO${Date.now()}`;
    const [newQuotation] = await db
      .insert(quotations)
      .values({ ...quotation, quotationId })
      .returning();
    return newQuotation;
  }

  async updateQuotation(id: number, quotation: Partial<InsertQuotation>): Promise<Quotation> {
    const [updatedQuotation] = await db
      .update(quotations)
      .set({ ...quotation, updatedAt: new Date() })
      .where(eq(quotations.id, id))
      .returning();
    return updatedQuotation;
  }

  // Hero slider operations
  async getHeroSlides(): Promise<any[]> {
    const slides = await db
      .select()
      .from(heroSlides)
      .where(eq(heroSlides.isActive, true))
      .orderBy(asc(heroSlides.displayOrder));
    return slides;
  }

  async getHeroSlide(id: number): Promise<HeroSlider | undefined> {
    const [slide] = await db.select().from(heroSliders).where(eq(heroSliders.id, id));
    return slide;
  }

  async createHeroSlide(slide: InsertHeroSlider): Promise<HeroSlider> {
    const [newSlide] = await db
      .insert(heroSliders)
      .values(slide)
      .returning();
    return newSlide;
  }

  async updateHeroSlide(id: number, slide: Partial<InsertHeroSlider>): Promise<HeroSlider> {
    const [updatedSlide] = await db
      .update(heroSliders)
      .set({ ...slide, updatedAt: new Date() })
      .where(eq(heroSliders.id, id))
      .returning();
    return updatedSlide;
  }

  async deleteHeroSlide(id: number): Promise<void> {
    await db.delete(heroSliders).where(eq(heroSliders.id, id));
  }

  // Sales order operations
  async getSalesOrders(filters?: {
    customerId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ orders: SalesOrder[]; total: number }> {
    const conditions = [];
    
    if (filters?.customerId) {
      conditions.push(eq(salesOrders.customerId, filters.customerId));
    }
    
    if (filters?.status) {
      conditions.push(eq(salesOrders.status, filters.status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [ordersResult, totalResult] = await Promise.all([
      db
        .select()
        .from(salesOrders)
        .where(whereClause)
        .limit(filters?.limit || 50)
        .offset(filters?.offset || 0)
        .orderBy(desc(salesOrders.createdAt)),
      db
        .select({ count: count() })
        .from(salesOrders)
        .where(whereClause),
    ]);

    return {
      orders: ordersResult,
      total: totalResult[0].count,
    };
  }

  async getSalesOrder(id: number): Promise<SalesOrder | undefined> {
    const [order] = await db.select().from(salesOrders).where(eq(salesOrders.id, id));
    return order;
  }

  // Purchase order operations
  async getPurchaseOrders(filters?: {
    vendorId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ orders: PurchaseOrder[]; total: number }> {
    const conditions = [];
    
    if (filters?.vendorId) {
      conditions.push(eq(purchaseOrders.vendorId, filters.vendorId));
    }
    
    if (filters?.status) {
      conditions.push(eq(purchaseOrders.status, filters.status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [ordersResult, totalResult] = await Promise.all([
      db
        .select()
        .from(purchaseOrders)
        .where(whereClause)
        .limit(filters?.limit || 50)
        .offset(filters?.offset || 0)
        .orderBy(desc(purchaseOrders.createdAt)),
      db
        .select({ count: count() })
        .from(purchaseOrders)
        .where(whereClause),
    ]);

    return {
      orders: ordersResult,
      total: totalResult[0].count,
    };
  }

  // Inventory operations
  async getInventory(productId?: number): Promise<Inventory[]> {
    const query = db.select().from(inventory);
    if (productId) {
      query.where(eq(inventory.productId, productId));
    }
    return await query.orderBy(desc(inventory.lastUpdated));
  }

  async updateInventory(productId: number, quantity: number, batchNumber?: string): Promise<void> {
    await db
      .update(inventory)
      .set({
        quantityInStock: quantity.toString(),
        batchNumber,
        lastUpdated: new Date(),
      })
      .where(eq(inventory.productId, productId));
  }



  async uploadProductDocument(document: Omit<ProductDocument, 'id' | 'createdAt'>): Promise<ProductDocument> {
    const [newDocument] = await db.insert(productDocuments).values(document).returning();
    return newDocument;
  }

  // Analytics
  async getDashboardStats(userId: string): Promise<{
    totalProducts: number;
    activeProducts: number;
    totalInquiries: number;
    totalQuotations: number;
    totalOrders: number;
    revenueThisMonth: number;
  }> {
    const [totalProductsCount] = await db.select({ count: count() }).from(products);
    const [activeProductsCount] = await db.select({ count: count() }).from(products).where(eq(products.isActive, true));
    const [inquiriesCount] = await db.select({ count: count() }).from(inquiries);
    const [quotationsCount] = await db.select({ count: count() }).from(quotations);
    const [ordersCount] = await db.select({ count: count() }).from(salesOrders);

    return {
      totalProducts: totalProductsCount.count,
      activeProducts: activeProductsCount.count,
      totalInquiries: inquiriesCount.count,
      totalQuotations: quotationsCount.count,
      totalOrders: ordersCount.count,
      revenueThisMonth: 0, // TODO: Calculate from actual data
    };
  }

  // Bulk upload products from CSV/Excel
  async bulkUploadProducts(file: any, userId: string, defaultCategory?: string): Promise<any> {
    const errors: Array<{ line: number; field: string; message: string; value?: string }> = [];
    const successfulRows: any[] = [];
    const duplicates: string[] = [];
    let totalRows = 0;

    try {
      // Parse file based on type
      let rows: any[] = [];
      
      if (file.originalname.endsWith('.csv') || file.mimetype === 'text/csv') {
        rows = await this.parseCSV(file.buffer);
      } else {
        rows = await this.parseExcel(file.buffer);
      }

      totalRows = rows.length;

      // Get categories and existing products for validation
      const categoriesData = await this.getCategories();
      const categoryMap = new Map(categoriesData.map(c => [c.name.toLowerCase(), c.id]));
      
      // Get existing product IDs to check for duplicates
      const existingProducts = await db.select({ productId: products.productId }).from(products);
      const existingProductIds = new Set(existingProducts.map(p => p.productId));

      // Pre-generate unique product IDs and slugs for rows that don't have them
      let nextProductIdNum = await this.getNextProductIdNumber();
      const csvProductIds = new Set(); // Track IDs within this CSV to prevent duplicates
      const csvSlugs = new Set(); // Track slugs within this CSV to prevent duplicates
      
      // First pass: assign product IDs, generate unique slugs, and validate
      for (let i = 0; i < rows.length; i++) {
        const rowIndex = i + 2;
        const row = rows[i];
        
        // Skip empty rows or rows with insufficient data
        if (!row.name || row.name.trim() === '' || 
            !row.description || row.description.trim() === '' ||
            !row.category || row.category.trim() === '' ||
            !row.price || row.price.toString().trim() === '') {
          continue;
        }

        // Assign product ID
        if (!row.productId || row.productId.trim() === '') {
          row.productId = `BFI${String(nextProductIdNum).padStart(3, '0')}`;
          nextProductIdNum++;
        }

        // Check for duplicates within CSV
        if (csvProductIds.has(row.productId)) {
          duplicates.push(row.productId);
          continue;
        }
        csvProductIds.add(row.productId);

        // Check for duplicates with existing database products
        if (existingProductIds.has(row.productId)) {
          duplicates.push(row.productId);
          continue;
        }

        // Pre-generate unique slug to avoid race conditions
        let baseSlug = this.generateSlug(row.name);
        let uniqueSlug = baseSlug;
        let counter = 1;
        
        // Check against existing database slugs
        while (true) {
          const existingSlug = await db.select().from(products).where(eq(products.slug, uniqueSlug)).limit(1);
          if (existingSlug.length === 0 && !csvSlugs.has(uniqueSlug)) {
            break;
          }
          uniqueSlug = `${baseSlug}-${counter}`;
          counter++;
        }
        
        csvSlugs.add(uniqueSlug);
        row._generatedSlug = uniqueSlug; // Store for later use
      }

      // Second pass: validate and process each row
      for (let i = 0; i < rows.length; i++) {
        const rowIndex = i + 2;
        const row = rows[i];
        
        try {
          // Skip empty rows or rows with insufficient required data
          if (!row.name || row.name.trim() === '' || 
              !row.description || row.description.trim() === '' ||
              !row.category || row.category.trim() === '' ||
              !row.price || row.price.toString().trim() === '') {
            continue;
          }

          // Skip if this row had duplicate ID
          if (duplicates.includes(row.productId)) {
            continue;
          }

          // Validate required fields
          const validationErrors = this.validateProductRow(row, rowIndex, categoryMap, defaultCategory);
          if (validationErrors.length > 0) {
            errors.push(...validationErrors);
            continue;
          }

          // Get category ID from category name
          const categoryName = row.category || defaultCategory || '';
          const categoryId = categoryMap.get(categoryName.toLowerCase());
          
          // Create product data (all fields from CSV, empty values allowed for optional fields)
          const productData: InsertProduct = {
            productId: row.productId,
            name: row.name.trim(),
            description: row.description || '',
            category: categoryName,
            categoryId: categoryId,
            price: parseFloat(row.price) || 0,
            moq: row.moq ? parseFloat(row.moq) || 0 : 0,
            packingSize: row.packingSize || '',
            leadTime: row.leadTime || '',
            currentStock: row.currentStock ? parseFloat(row.currentStock) || 0 : 0,
            botanicalName: row.botanicalName || '',
            plantPart: row.plantPart || '',
            origin: row.origin || '',
            productType: row.productType ? row.productType.toLowerCase() : 'organic',
            productGrade: row.productGrade || '',
            healthSupport: row.healthSupport || '',
            hsCode: row.hsCode || '',
            form: row.form || '',
            
            // SEO fields
            seoTitle: row.seoTitle || '',
            seoDescription: row.seoDescription || '',
            canonicalUrl: row.canonicalUrl || '',
            
            // FAQ section - build from individual fields
            faqs: this.buildFaqsFromCsvRow(row),
            
            basePrice: row.basePrice ? parseFloat(row.basePrice) || 0 : 0,
            rate: row.rate ? parseFloat(row.rate) || 0 : 0,
            priceUSD: row.priceUSD ? parseFloat(row.priceUSD) || 0 : 0,
            priceINR: row.priceINR ? parseFloat(row.priceINR) || 0 : 0,
            priceEUR: row.priceEUR ? parseFloat(row.priceEUR) || 0 : 0,
            priceGBP: row.priceGBP ? parseFloat(row.priceGBP) || 0 : 0,
            priceType: row.priceType || 'EXW',
            priceLocation: row.priceLocation || 'Warehouse India',
            sampleAvailable: this.parseBooleanFromCsv(row.sampleAvailable, true),
            stopSell: this.parseBooleanFromCsv(row.stopSell, false),
            status: row.status || 'active',
            isActive: true,
            isVisible: true,
            createdBy: userId,
            updatedBy: userId,
            slug: row._generatedSlug, // Use pre-generated slug
          };

          successfulRows.push(productData);
          existingProductIds.add(row.productId); // Prevent duplicates within the same upload

        } catch (error) {
          errors.push({
            line: rowIndex,
            field: 'row',
            message: `Failed to process row: ${error instanceof Error ? error.message : 'Unknown error'}`,
          });
        }
      }

      // If there are validation errors, return them without saving anything
      if (errors.length > 0) {
        return {
          success: false,
          totalRows,
          successCount: 0,
          errorCount: errors.length,
          errors,
          duplicates: duplicates.length > 0 ? duplicates : undefined,
        };
      }

      // Save all products in a transaction
      if (successfulRows.length > 0) {
        try {
          await db.insert(products).values(successfulRows);
        } catch (dbError) {
          console.error('Database insertion error:', dbError);
          return {
            success: false,
            totalRows,
            successCount: 0,
            errorCount: 1,
            errors: [{
              line: 1,
              field: 'file',
              message: `Database insertion failed: ${dbError instanceof Error ? dbError.message : 'Unknown database error'}`,
            }],
          };
        }
      }

      return {
        success: true,
        totalRows,
        successCount: successfulRows.length,
        errorCount: 0,
        errors: [],
        duplicates: duplicates.length > 0 ? duplicates : undefined,
      };

    } catch (error) {
      console.error('Bulk upload error:', error);
      return {
        success: false,
        totalRows,
        successCount: 0,
        errorCount: 1,
        errors: [{
          line: 1,
          field: 'file',
          message: `Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }],
      };
    }
  }

  // Generate product template CSV
  async generateProductTemplate(categoryId?: number): Promise<string> {
    const headers = [
      // *** REQUIRED FIELDS (Must be filled) ***
      'name',                    // Product name (REQUIRED)
      'description',             // Basic product description (REQUIRED) 
      'category',                // Product category (REQUIRED)
      'price',                   // Base price in USD (REQUIRED)
      
      // *** OPTIONAL BUSINESS FIELDS (Can be blank) ***
      'moq',                     // Minimum order quantity (numeric only, e.g., 25)
      'packingSize',             // Packing size (25kg, 1kg, etc.)
      'leadTime',                // Lead time for delivery
      'currentStock',            // Current stock quantity (numeric only)
      'status',                  // draft/active/inactive (defaults to draft)
      'sampleAvailable',         // true/false for sample availability
      'stopSell',                // true/false to stop selling
      
      // *** OPTIONAL PRODUCT SPECIFICATIONS (Can be blank) ***
      'botanicalName',           // Scientific name
      'plantPart',               // Part of plant used
      'origin',                  // Country/region of origin
      'productType',             // organic/conventional/wildcrafted/kosher/halal (defaults to organic)
      'productGrade',            // Food Grade, Pharma Grade, Cosmetic Grade, etc.
      'healthSupport',           // Functional Category (Antioxidant, Digestive Support, etc.)
      'hsCode',                  // Harmonized System trade code
      'form',                    // Physical form (powder, liquid, extract, etc.)
      
      // *** OPTIONAL SEO FIELDS (Can be blank) ***
      'seoTitle',                // SEO page title
      'seoDescription',          // SEO meta description
      'canonicalUrl',            // Canonical URL
      
      // *** OPTIONAL FAQ SECTION (Can be blank) ***
      'faq1_question',           // FAQ 1 Question
      'faq1_answer',             // FAQ 1 Answer
      'faq2_question',           // FAQ 2 Question
      'faq2_answer',             // FAQ 2 Answer
      'faq3_question',           // FAQ 3 Question
      'faq3_answer',             // FAQ 3 Answer
      'faq4_question',           // FAQ 4 Question
      'faq4_answer',             // FAQ 4 Answer
      
      // *** OPTIONAL PRICING (Can be blank) ***
      'basePrice',               // Base price
      'rate',                    // Rate per unit
      'priceUSD',                // Price in USD
      'priceINR',                // Price in INR
      'priceEUR',                // Price in EUR
      'priceGBP',                // Price in GBP
      'priceType',               // EXW, FOB, CIF, etc.
      'priceLocation',           // Price location (Warehouse India, etc.)
    ];

    // Get category info for example data
    let categoryName = 'Herbal Powders';
    if (categoryId) {
      const category = await this.getCategory(categoryId);
      if (category) {
        categoryName = category.name;
      }
    }

    // Generate example data based on category
    const exampleData = this.generateExampleDataForCategory(categoryName);

    const rows = [
      headers,
      exampleData
    ];

    return stringify(rows, {
      header: false,
      columns: headers,
    });
  }

  // Helper methods for bulk upload
  private async parseCSV(buffer: Buffer): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      const stream = Readable.from(buffer.toString());
      
      stream
        .pipe(csv({
          skipEmptyLines: true,
          skipLinesWithError: true
        }))
        .on('data', (data) => {
          // Only push rows that have the basic required structure with valid data
          if (data && typeof data === 'object' && Object.keys(data).length > 0) {
            // Check if this looks like a valid data row (not header or malformed)
            const hasRequiredFields = 'name' in data && 'description' in data && 'category' in data && 'price' in data;
            
            if (hasRequiredFields) {
              // Additional validation: ensure these fields have meaningful content
              const hasValidData = 
                data.name && data.name.toString().trim().length > 0 &&
                data.description && data.description.toString().trim().length > 0 &&
                data.category && data.category.toString().trim().length > 0 &&
                data.price && data.price.toString().trim().length > 0 &&
                !isNaN(parseFloat(data.price.toString()));
              
              // Reject rows that look like descriptions or benefits (common patterns)
              const looksLikeDescription = 
                data.name.toString().toLowerCase().includes('benefits') ||
                data.name.toString().toLowerCase().includes('key') ||
                data.name.toString().toLowerCase().includes('our premium') ||
                data.name.toString().toLowerCase().includes('extract is') ||
                data.name.toString().toLowerCase().includes('standardized') ||
                data.name.toString().toLowerCase().includes('contain') ||
                data.name.toString().length > 100; // Product names shouldn't be essays
              
              if (hasValidData && !looksLikeDescription) {
                results.push(data);
              }
            }
          }
        })
        .on('end', () => resolve(results))
        .on('error', reject);
    });
  }

  private async parseExcel(buffer: Buffer): Promise<any[]> {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const allRows = xlsx.utils.sheet_to_json(worksheet);
    
    // Filter to only rows that have the required fields structure with valid data
    return allRows.filter((row: any) => {
      if (!row || typeof row !== 'object') return false;
      const hasRequiredFields = 'name' in row && 'description' in row && 'category' in row && 'price' in row;
      
      if (hasRequiredFields) {
        // Additional validation: ensure these fields have meaningful content
        const hasValidData = 
          row.name && row.name.toString().trim().length > 0 &&
          row.description && row.description.toString().trim().length > 0 &&
          row.category && row.category.toString().trim().length > 0 &&
          row.price && row.price.toString().trim().length > 0 &&
          !isNaN(parseFloat(row.price.toString()));
        
        // Reject rows that look like descriptions or benefits (common patterns)
        const looksLikeDescription = 
          row.name.toString().toLowerCase().includes('benefits') ||
          row.name.toString().toLowerCase().includes('key') ||
          row.name.toString().toLowerCase().includes('our premium') ||
          row.name.toString().toLowerCase().includes('extract is') ||
          row.name.toString().toLowerCase().includes('standardized') ||
          row.name.toString().toLowerCase().includes('contain') ||
          row.name.toString().length > 100; // Product names shouldn't be essays
        
        return hasValidData && !looksLikeDescription;
      }
      
      return false;
    });
  }

  private validateProductRow(row: any, lineNumber: number, categoryMap: Map<string, number>, defaultCategory?: string): Array<{ line: number; field: string; message: string; value?: string }> {
    const errors: Array<{ line: number; field: string; message: string; value?: string }> = [];

    // *** REQUIRED FIELDS VALIDATION (These must be filled) ***
    
    // Product name is mandatory
    if (!row.name || row.name.trim() === '') {
      errors.push({ line: lineNumber, field: 'name', message: 'Product name is required and cannot be blank' });
    }

    // Description is mandatory
    if (!row.description || row.description.trim() === '') {
      errors.push({ line: lineNumber, field: 'description', message: 'Product description is required and cannot be blank' });
    }

    // Category validation (mandatory)
    const categoryToCheck = row.category || defaultCategory;
    if (!categoryToCheck || categoryToCheck.trim() === '') {
      errors.push({ line: lineNumber, field: 'category', message: 'Category is required and cannot be blank' });
    } else if (!categoryMap.has(categoryToCheck.toLowerCase())) {
      errors.push({ 
        line: lineNumber, 
        field: 'category', 
        message: 'Invalid category. Category does not exist.', 
        value: categoryToCheck 
      });
    }

    // Price validation (mandatory)
    if (!row.price || row.price.toString().trim() === '') {
      errors.push({ line: lineNumber, field: 'price', message: 'Price is required and cannot be blank' });
    } else if (isNaN(parseFloat(row.price))) {
      errors.push({ 
        line: lineNumber, 
        field: 'price', 
        message: 'Price must be a valid number', 
        value: row.price 
      });
    }

    // *** OPTIONAL FIELDS VALIDATION (Only validate format if provided) ***
    
    // Numeric field validation
    const numericFields = ['moq', 'currentStock', 'basePrice', 'rate', 'priceUSD', 'priceINR', 'priceEUR', 'priceGBP'];
    for (const field of numericFields) {
      if (row[field] && row[field].trim() !== '' && isNaN(parseFloat(row[field]))) {
        errors.push({
          line: lineNumber,
          field: field,
          message: `${field} must be a numeric value (e.g., 25, 25.50). Remove units like "KG" or text.`,
          value: row[field]
        });
      }
    }
    
    // Status validation (only if provided)
    if (row.status && row.status.trim() !== '' && !['draft', 'active', 'inactive'].includes(row.status.toLowerCase())) {
      errors.push({ 
        line: lineNumber, 
        field: 'status', 
        message: 'Status must be: draft, active, or inactive (or leave blank for default)', 
        value: row.status 
      });
    }

    // Boolean validation for sampleAvailable and stopSell (only if provided)
    if (row.sampleAvailable && row.sampleAvailable.trim() !== '' && !['true', 'false', '1', '0', 'yes', 'no'].includes(row.sampleAvailable.toLowerCase())) {
      errors.push({ 
        line: lineNumber, 
        field: 'sampleAvailable', 
        message: 'sampleAvailable must be: true, false, 1, 0, yes, no (or leave blank for true)', 
        value: row.sampleAvailable 
      });
    }

    if (row.stopSell && row.stopSell.trim() !== '' && !['true', 'false', '1', '0', 'yes', 'no'].includes(row.stopSell.toLowerCase())) {
      errors.push({ 
        line: lineNumber, 
        field: 'stopSell', 
        message: 'stopSell must be: true, false, 1, 0, yes, no (or leave blank for false)', 
        value: row.stopSell 
      });
    }

    // Product type validation (only if provided)
    if (row.productType && row.productType.trim() !== '' && !['organic', 'conventional', 'wildcrafted', 'kosher', 'halal'].includes(row.productType.toLowerCase())) {
      errors.push({ 
        line: lineNumber, 
        field: 'productType', 
        message: 'productType must be: organic, conventional, wildcrafted, kosher, or halal (or leave blank for organic)', 
        value: row.productType 
      });
    }

    // No additional FAQ validation needed - individual fields are straightforward text

    return errors;
  }

  // Helper method to build FAQs array from individual CSV columns
  private buildFaqsFromCsvRow(row: any): Array<{question: string, answer: string}> {
    const faqs = [];
    
    // Check each FAQ pair and add to array if both question and answer are provided
    if (row.faq1_question && row.faq1_question.trim() && row.faq1_answer && row.faq1_answer.trim()) {
      faqs.push({
        question: row.faq1_question.trim(),
        answer: row.faq1_answer.trim()
      });
    }
    
    if (row.faq2_question && row.faq2_question.trim() && row.faq2_answer && row.faq2_answer.trim()) {
      faqs.push({
        question: row.faq2_question.trim(),
        answer: row.faq2_answer.trim()
      });
    }
    
    if (row.faq3_question && row.faq3_question.trim() && row.faq3_answer && row.faq3_answer.trim()) {
      faqs.push({
        question: row.faq3_question.trim(),
        answer: row.faq3_answer.trim()
      });
    }
    
    if (row.faq4_question && row.faq4_question.trim() && row.faq4_answer && row.faq4_answer.trim()) {
      faqs.push({
        question: row.faq4_question.trim(),
        answer: row.faq4_answer.trim()
      });
    }
    
    return faqs;
  }

  // Helper method to parse boolean values from CSV
  private parseBooleanFromCsv(value: string, defaultValue: boolean): boolean {
    if (!value || value.trim() === '') {
      return defaultValue;
    }
    
    const lowerValue = value.toLowerCase().trim();
    if (['true', '1', 'yes', 'y'].includes(lowerValue)) {
      return true;
    } else if (['false', '0', 'no', 'n'].includes(lowerValue)) {
      return false;
    }
    
    return defaultValue;
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const baseSlug = this.generateSlug(name);
    let slug = baseSlug;
    let counter = 1;

    // Check if slug already exists in database
    while (true) {
      const existing = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
      if (existing.length === 0) {
        break;
      }
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  private generateExampleDataForCategory(categoryName: string): string[] {
    const baseExample = [
      // *** REQUIRED FIELDS ***
      'Ashwagandha Root Extract Powder', // name (REQUIRED)
      'Premium quality Ashwagandha root extract powder with 5% withanolides for nutraceutical applications', // description (REQUIRED)
      categoryName, // category (REQUIRED)
      '25.50', // price (REQUIRED)
      
      // *** OPTIONAL BUSINESS FIELDS ***
      '25', // moq (numeric value only)
      '25kg HDPE Drums', // packingSize
      '7-10 days', // leadTime
      '500', // currentStock (numeric value only)
      'active', // status
      'true', // sampleAvailable
      'false', // stopSell
      
      // *** OPTIONAL PRODUCT SPECIFICATIONS ***
      'Withania somnifera', // botanicalName
      'Root', // plantPart
      'India', // origin
      'organic', // productType (organic/conventional/wildcrafted/kosher/halal)
      '', // productGrade (leave blank - food/pharma/cosmetic/technical)
      'Stress Relief', // healthSupport
      '1302.19', // hsCode
      'powder', // form (powder/extract/oil/liquid/capsule/tablet)
      
      // *** OPTIONAL SEO FIELDS ***
      'Premium Ashwagandha Root Extract Powder - 5% Withanolides | BFI Organic', // seoTitle
      'High-quality organic Ashwagandha root extract powder with 5% withanolides. Perfect for nutraceutical applications. Food grade quality from India.', // seoDescription
      '/products/ashwagandha-extract-powder', // canonicalUrl
      
      // *** OPTIONAL FAQ SECTION ***
      'What is the active content?', // faq1_question
      'Our Ashwagandha extract contains 5% withanolides', // faq1_answer
      'Is this organic certified?', // faq2_question
      'Yes, this product is certified organic', // faq2_answer
      'What is the shelf life?', // faq3_question
      '24 months when stored properly in cool, dry conditions', // faq3_answer
      'What are the applications?', // faq4_question
      'Perfect for nutraceuticals, dietary supplements, and functional foods', // faq4_answer
      
      // *** OPTIONAL PRICING ***
      '25.50', // basePrice (numeric only)
      '25.50', // rate (numeric only)
      '25.50', // priceUSD (numeric only)
      '2100', // priceINR (numeric only)
      '23.50', // priceEUR (numeric only)
      '20.50', // priceGBP (numeric only)
      'EXW', // priceType
      'Warehouse India', // priceLocation
    ];

    // Customize example based on category
    switch (categoryName.toLowerCase()) {
      case 'essential oils':
        baseExample[0] = 'Lavender Essential Oil';
        baseExample[1] = 'Pure lavender essential oil extracted through steam distillation';
        baseExample[7] = 'Lavandula angustifolia';
        baseExample[8] = 'Flowers';
        baseExample[9] = 'Steam Distillation';
        break;
      case 'spices & seasonings':
        baseExample[0] = 'Organic Turmeric Powder';
        baseExample[1] = 'Premium organic turmeric powder with high curcumin content';
        baseExample[7] = 'Curcuma longa';
        baseExample[8] = 'Rhizome';
        break;
      case 'whole herbs':
        baseExample[0] = 'Dried Ginkgo Leaves';
        baseExample[1] = 'Premium quality dried ginkgo leaves for herbal preparations';
        baseExample[7] = 'Ginkgo biloba';
        baseExample[8] = 'Leaves';
        break;
    }

    return baseExample;
  }

  // Schema Validation Methods

  async getSchemaValidationResults(): Promise<any[]> {
    try {
      const products = await this.getAllProducts();
      const results = products.map(product => this.validateProductSchema(product));
      return results;
    } catch (error) {
      console.error("Error getting schema validation results:", error);
      throw error;
    }
  }

  async getSchemaValidationSummary(): Promise<any> {
    try {
      const results = await this.getSchemaValidationResults();
      
      const totalProducts = results.length;
      const validProducts = results.filter(r => r.status === 'valid').length;
      const warningProducts = results.filter(r => r.status === 'warning').length;
      const errorProducts = results.filter(r => r.status === 'error').length;
      
      const averageScore = totalProducts > 0 
        ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / totalProducts)
        : 0;
      
      // Calculate common issues
      const issueMap = new Map<string, number>();
      results.forEach(result => {
        result.issues.forEach((issue: any) => {
          const key = `${issue.field}: ${issue.message}`;
          issueMap.set(key, (issueMap.get(key) || 0) + 1);
        });
      });
      
      const commonIssues = Array.from(issueMap.entries())
        .map(([issue, count]) => ({ issue, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      
      return {
        totalProducts,
        validProducts,
        warningProducts,
        errorProducts,
        averageScore,
        commonIssues
      };
    } catch (error) {
      console.error("Error getting schema validation summary:", error);
      throw error;
    }
  }

  async runSchemaValidation(): Promise<any[]> {
    try {
      // This method could be extended to save validation results to database
      const results = await this.getSchemaValidationResults();
      return results;
    } catch (error) {
      console.error("Error running schema validation:", error);
      throw error;
    }
  }

  async exportSchemaValidationResults(): Promise<string> {
    try {
      const results = await this.getSchemaValidationResults();
      
      const headers = [
        'Product ID',
        'Product Name',
        'Slug',
        'Status',
        'Score',
        'Issues Count',
        'Missing Required Fields',
        'Missing Recommended Fields',
        'SEO Optimization'
      ];
      
      const csvRows = [headers.join(',')];
      
      results.forEach(result => {
        const missingRequired = result.requiredFields
          .filter((field: any) => !field.present)
          .map((field: any) => field.field)
          .join('; ');
          
        const missingRecommended = result.recommendedFields
          .filter((field: any) => !field.present)
          .map((field: any) => field.field)
          .join('; ');
          
        const seoIssues = result.seoFields
          .filter((field: any) => !field.present)
          .map((field: any) => field.field)
          .join('; ');
        
        const row = [
          `"${result.productId}"`,
          `"${result.productName}"`,
          `"${result.slug}"`,
          `"${result.status}"`,
          result.score,
          result.issues.length,
          `"${missingRequired}"`,
          `"${missingRecommended}"`,
          `"${seoIssues}"`
        ];
        
        csvRows.push(row.join(','));
      });
      
      return csvRows.join('\n');
    } catch (error) {
      console.error("Error exporting schema validation results:", error);
      throw error;
    }
  }

  private validateProductSchema(product: any): any {
    const issues: any[] = [];
    const requiredFields: any[] = [];
    const recommendedFields: any[] = [];
    const seoFields: any[] = [];
    
    let score = 0;
    const maxScore = 100;
    
    // Required fields validation (40 points total)
    const requiredFieldChecks = [
      { field: 'name', weight: 10 },
      { field: 'description', weight: 10 },
      { field: 'productId', weight: 5 },
      { field: 'price/rate', weight: 15 }
    ];
    
    requiredFieldChecks.forEach(({ field, weight }) => {
      let present = false;
      let value: any = null;
      
      switch (field) {
        case 'name':
          present = !!product.name?.trim();
          value = product.name;
          break;
        case 'description':
          present = !!product.description?.trim();
          value = product.description;
          break;
        case 'productId':
          present = !!product.productId?.trim();
          value = product.productId;
          break;
        case 'price/rate':
          present = (product.priceUSD > 0) || (product.rate > 0) || (product.basePrice > 0);
          value = product.priceUSD || product.rate || product.basePrice;
          break;
      }
      
      requiredFields.push({
        field,
        present,
        value,
        required: true,
        issue: !present ? `${field} is required for schema validation` : undefined
      });
      
      if (present) {
        score += weight;
      } else {
        issues.push({
          type: 'error',
          field,
          message: 'Required field is missing',
          suggestion: `Add ${field} to improve schema validation`
        });
      }
    });
    
    // Recommended fields validation (30 points total)
    const recommendedFieldChecks = [
      { field: 'mainImage', weight: 8 },
      { field: 'botanicalName', weight: 5 },
      { field: 'origin', weight: 5 },
      { field: 'form', weight: 4 },
      { field: 'moq', weight: 4 },
      { field: 'currentStock', weight: 4 }
    ];
    
    recommendedFieldChecks.forEach(({ field, weight }) => {
      let present = false;
      let value: any = null;
      
      switch (field) {
        case 'mainImage':
          present = !!(product.mainImage?.trim() || product.images?.length > 0);
          value = product.mainImage || product.images?.[0];
          break;
        case 'botanicalName':
          present = !!product.botanicalName?.trim();
          value = product.botanicalName;
          break;
        case 'origin':
          present = !!product.origin?.trim();
          value = product.origin;
          break;
        case 'form':
          present = !!product.form?.trim();
          value = product.form;
          break;
        case 'moq':
          present = (product.moq && product.moq > 0);
          value = product.moq;
          break;
        case 'currentStock':
          present = (product.currentStock !== null && product.currentStock !== undefined);
          value = product.currentStock;
          break;
      }
      
      recommendedFields.push({
        field,
        present,
        value,
        required: false
      });
      
      if (present) {
        score += weight;
      } else {
        issues.push({
          type: 'warning',
          field,
          message: 'Recommended field is missing',
          suggestion: `Add ${field} for better schema completeness`
        });
      }
    });
    
    // SEO fields validation (30 points total)
    const seoFieldChecks = [
      { field: 'seoTitle', weight: 10 },
      { field: 'seoDescription', weight: 10 },
      { field: 'slug', weight: 5 },
      { field: 'canonicalUrl', weight: 5 }
    ];
    
    seoFieldChecks.forEach(({ field, weight }) => {
      let present = false;
      let value: any = null;
      
      switch (field) {
        case 'seoTitle':
          present = !!product.seoTitle?.trim();
          value = product.seoTitle;
          break;
        case 'seoDescription':
          present = !!product.seoDescription?.trim();
          value = product.seoDescription;
          break;
        case 'slug':
          present = !!product.slug?.trim();
          value = product.slug;
          break;
        case 'canonicalUrl':
          present = !!product.canonicalUrl?.trim();
          value = product.canonicalUrl;
          break;
      }
      
      seoFields.push({
        field,
        present,
        value,
        required: false
      });
      
      if (present) {
        score += weight;
      } else {
        issues.push({
          type: 'warning',
          field,
          message: 'SEO field is missing',
          suggestion: `Add ${field} for better search engine optimization`
        });
      }
    });
    
    // Determine overall status
    let status: 'valid' | 'warning' | 'error';
    if (score >= 90) {
      status = 'valid';
    } else if (score >= 60) {
      status = 'warning';
    } else {
      status = 'error';
    }
    
    return {
      productId: product.productId,
      productName: product.name,
      slug: product.slug,
      status,
      score,
      issues,
      requiredFields,
      recommendedFields,
      seoFields
    };
  }

  // Product FAQ methods
  async getProductFaqs(productId: number): Promise<ProductFaq[]> {
    return await db.select().from(productFaqs)
      .where(and(eq(productFaqs.productId, productId), eq(productFaqs.isActive, true)))
      .orderBy(asc(productFaqs.displayOrder));
  }

  async createProductFaq(faq: InsertProductFaq): Promise<ProductFaq> {
    const [newFaq] = await db.insert(productFaqs).values(faq).returning();
    return newFaq;
  }

  async updateProductFaq(id: number, updates: Partial<InsertProductFaq>): Promise<ProductFaq | undefined> {
    const [updatedFaq] = await db.update(productFaqs)
      .set(updates)
      .where(eq(productFaqs.id, id))
      .returning();
    return updatedFaq;
  }

  async deleteProductFaq(id: number): Promise<void> {
    await db.delete(productFaqs).where(eq(productFaqs.id, id));
  }

  // Blog methods
  async getBlogPosts(filters?: { category?: string; published?: boolean; limit?: number; offset?: number }): Promise<{ posts: BlogPost[]; total: number }> {
    const conditions = [];
    
    if (filters?.published !== undefined) {
      conditions.push(eq(blogPosts.isPublished, filters.published));
    }
    
    if (filters?.category) {
      conditions.push(eq(blogPosts.category, filters.category));
    }

    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;
    
    const [postsData, totalData] = await Promise.all([
      db.select().from(blogPosts)
        .where(whereCondition)
        .orderBy(desc(blogPosts.createdAt))
        .limit(filters?.limit || 50)
        .offset(filters?.offset || 0),
      db.select({ count: count() }).from(blogPosts).where(whereCondition)
    ]);

    return {
      posts: postsData,
      total: totalData[0]?.count || 0
    };
  }

  async getBlogPost(id: number): Promise<BlogPost | undefined> {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.id, id));
    return post;
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug));
    return post;
  }

  async createBlogPost(post: InsertBlogPost): Promise<BlogPost> {
    const [newPost] = await db.insert(blogPosts).values(post).returning();
    return newPost;
  }

  async updateBlogPost(id: number, updates: Partial<InsertBlogPost>): Promise<BlogPost | undefined> {
    const [updatedPost] = await db.update(blogPosts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(blogPosts.id, id))
      .returning();
    return updatedPost;
  }

  async deleteBlogPost(id: number): Promise<void> {
    await db.delete(blogPosts).where(eq(blogPosts.id, id));
  }

  // SEO monitoring methods
  async getSeoIssues(type?: string): Promise<SeoMonitoring[]> {
    const whereCondition = type ? eq(seoMonitoring.type, type) : undefined;
    return await db.select().from(seoMonitoring)
      .where(whereCondition)
      .orderBy(desc(seoMonitoring.detectedAt));
  }

  async createSeoIssue(issue: InsertSeoMonitoring): Promise<SeoMonitoring> {
    const [newIssue] = await db.insert(seoMonitoring).values(issue).returning();
    return newIssue;
  }

  async updateSeoIssue(id: number, updates: Partial<InsertSeoMonitoring>): Promise<SeoMonitoring | undefined> {
    const [updatedIssue] = await db.update(seoMonitoring)
      .set({ ...updates, lastChecked: new Date() })
      .where(eq(seoMonitoring.id, id))
      .returning();
    return updatedIssue;
  }

  async deleteSeoIssue(id: number): Promise<void> {
    await db.delete(seoMonitoring).where(eq(seoMonitoring.id, id));
  }

  // Core Web Vitals methods
  async getCoreWebVitals(url?: string): Promise<CoreWebVitals[]> {
    const whereCondition = url ? eq(coreWebVitals.url, url) : undefined;
    return await db.select().from(coreWebVitals)
      .where(whereCondition)
      .orderBy(desc(coreWebVitals.measuredAt))
      .limit(100);
  }

  async recordCoreWebVitals(vitals: InsertCoreWebVitals): Promise<CoreWebVitals> {
    const [newVitals] = await db.insert(coreWebVitals).values(vitals).returning();
    return newVitals;
  }

  // Search methods
  async getSearchSuggestions(query: string): Promise<SearchSuggestion[]> {
    return await db.select().from(searchSuggestions)
      .where(and(
        sql`${searchSuggestions.query} ILIKE ${`%${query}%`}`,
        eq(searchSuggestions.isActive, true)
      ))
      .orderBy(desc(searchSuggestions.popularity))
      .limit(10);
  }

  async recordSearchAnalytics(analytics: InsertSearchAnalytics): Promise<SearchAnalytics> {
    const [newAnalytics] = await db.insert(searchAnalytics).values(analytics).returning();
    return newAnalytics;
  }

  async getPopularSearches(limit = 10): Promise<SearchAnalytics[]> {
    return await db.select({
      query: searchAnalytics.query,
      count: count(searchAnalytics.query)
    }).from(searchAnalytics)
      .groupBy(searchAnalytics.query)
      .orderBy(desc(count(searchAnalytics.query)))
      .limit(limit) as any;
  }

  // Hreflang methods
  async getHreflangConfig(pageType: string, pageId: string): Promise<HreflangConfig[]> {
    return await db.select().from(hreflangConfig)
      .where(and(
        eq(hreflangConfig.pageType, pageType),
        eq(hreflangConfig.pageId, pageId),
        eq(hreflangConfig.isActive, true)
      ));
  }

  async createHreflangConfig(config: InsertHreflangConfig): Promise<HreflangConfig> {
    const [newConfig] = await db.insert(hreflangConfig).values(config).returning();
    return newConfig;
  }

  async updateHreflangConfig(id: number, updates: Partial<InsertHreflangConfig>): Promise<HreflangConfig | undefined> {
    const [updatedConfig] = await db.update(hreflangConfig)
      .set(updates)
      .where(eq(hreflangConfig.id, id))
      .returning();
    return updatedConfig;
  }

  async deleteHreflangConfig(id: number): Promise<void> {
    await db.delete(hreflangConfig).where(eq(hreflangConfig.id, id));
  }

  // Global SEO Settings methods
  async getGlobalSeoSettings(): Promise<GlobalSeoSettings | undefined> {
    const [settings] = await db.select().from(globalSeoSettings)
      .where(eq(globalSeoSettings.isActive, true))
      .limit(1);
    return settings;
  }

  async updateGlobalSeoSettings(settingsData: Partial<InsertGlobalSeoSettings>): Promise<GlobalSeoSettings> {
    // Check if settings exist
    const existingSettings = await this.getGlobalSeoSettings();
    
    if (existingSettings) {
      // Update existing settings
      const [updatedSettings] = await db.update(globalSeoSettings)
        .set({ ...settingsData, updatedAt: new Date() })
        .where(eq(globalSeoSettings.id, existingSettings.id))
        .returning();
      return updatedSettings;
    } else {
      // Create new settings
      const [newSettings] = await db.insert(globalSeoSettings)
        .values({ 
          siteTitle: "BFI Organic - Premium Organic Ingredients Supplier",
          siteDescription: "Leading supplier of premium organic ingredients, herbs, and botanical extracts. Certified organic products for pharmaceutical, nutraceutical, and food industries worldwide.",
          primaryKeywords: "organic ingredients, herbal extracts, pharmaceutical raw materials, nutraceutical ingredients, organic herbs, botanical extracts, organic spices, certified organic",
          primaryTargetRegion: "Global (All Regions)",
          businessLocation: "Mehsana, Gujarat, India",
          pharmaceuticalKeywords: "pharmaceutical grade herbs, API raw materials, pharmaceutical excipients, drug intermediates",
          nutraceuticalKeywords: "dietary supplement ingredients, functional food ingredients, health supplements, natural extracts",
          ...settingsData
        })
        .returning();
      return newSettings;
    }
  }

  // Newsletter subscription methods
  async subscribeToNewsletter(subscription: InsertNewsletterSubscription): Promise<NewsletterSubscription> {
    try {
      const [newSubscription] = await db.insert(newsletterSubscriptions)
        .values(subscription)
        .returning();
      return newSubscription;
    } catch (error: any) {
      // Handle duplicate email error
      if (error.code === '23505') { // PostgreSQL unique violation
        // Check if subscription exists but is inactive
        const [existingSubscription] = await db.select()
          .from(newsletterSubscriptions)
          .where(eq(newsletterSubscriptions.email, subscription.email));
        
        if (existingSubscription && !existingSubscription.isActive) {
          // Reactivate existing subscription
          const [reactivatedSubscription] = await db.update(newsletterSubscriptions)
            .set({ 
              isActive: true, 
              subscribedAt: new Date(),
              source: subscription.source || 'blog',
              updatedAt: new Date()
            })
            .where(eq(newsletterSubscriptions.email, subscription.email))
            .returning();
          return reactivatedSubscription;
        }
        
        // If already active, return existing subscription
        if (existingSubscription) {
          return existingSubscription;
        }
      }
      throw error;
    }
  }

  async getNewsletterSubscription(email: string): Promise<NewsletterSubscription | undefined> {
    const [subscription] = await db.select()
      .from(newsletterSubscriptions)
      .where(eq(newsletterSubscriptions.email, email));
    return subscription;
  }

  async unsubscribeFromNewsletter(email: string): Promise<void> {
    await db.update(newsletterSubscriptions)
      .set({ 
        isActive: false,
        updatedAt: new Date()
      })
      .where(eq(newsletterSubscriptions.email, email));
  }

  async getNewsletterSubscriptions(filters?: { 
    isActive?: boolean; 
    limit?: number; 
    offset?: number 
  }): Promise<{ subscriptions: NewsletterSubscription[]; total: number }> {
    const conditions = [];
    
    if (filters?.isActive !== undefined) {
      conditions.push(eq(newsletterSubscriptions.isActive, filters.isActive));
    }

    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;
    
    const [subscriptionsData, totalData] = await Promise.all([
      db.select().from(newsletterSubscriptions)
        .where(whereCondition)
        .orderBy(desc(newsletterSubscriptions.subscribedAt))
        .limit(filters?.limit || 50)
        .offset(filters?.offset || 0),
      db.select({ count: count() }).from(newsletterSubscriptions).where(whereCondition)
    ]);

    return {
      subscriptions: subscriptionsData,
      total: totalData[0]?.count || 0
    };
  }
}

export const storage = new DatabaseStorage();
