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
  heroSliders,
  sampleRequests,
  type User,
  type UpsertUser,
  type Product,
  type InsertProduct,
  type Category,
  type InsertCategory,
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
  upsertUser(user: UpsertUser): Promise<User>;

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

  // Category operations
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category>;
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
    totalInquiries: number;
    totalQuotations: number;
    totalOrders: number;
    revenueThisMonth: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // Generate unique Product ID
  private async generateProductId(): Promise<string> {
    const nextNum = await this.getNextProductIdNumber();
    return `BFI${nextNum.toString().padStart(3, '0')}`;
  }

  // Get the next product ID number for bulk generation
  private async getNextProductIdNumber(): Promise<number> {
    const count = await db.select({ count: sql<number>`count(*)` }).from(products);
    return (count[0]?.count || 0) + 1;
  }
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
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

  // Product operations
  async getProducts(filters?: {
    category?: string[];
    search?: string;
    isOrganic?: boolean;
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
    
    // Category filter (support multiple categories)
    if (filters?.category && filters.category.length > 0) {
      const categoryNames = filters.category;
      const categoryConditions = categoryNames.map(name => 
        sql`${products.category} ILIKE ${`%${name}%`}`
      );
      conditions.push(or(...categoryConditions));
    }
    
    // Search filter
    if (filters?.search) {
      conditions.push(
        sql`${products.name} ILIKE ${`%${filters.search}%`} OR ${products.description} ILIKE ${`%${filters.search}%`} OR ${products.botanicalName} ILIKE ${`%${filters.search}%`}`
      );
    }
    
    // Organic filter
    if (filters?.isOrganic !== undefined) {
      // Note: we'll use a text field check since the schema shows isOrganic as boolean but we're storing product type as text
      if (filters.isOrganic) {
        conditions.push(eq(products.productType, 'organic'));
      } else {
        conditions.push(eq(products.productType, 'conventional'));
      }
    }

    // Health Support filter
    if (filters?.healthSupport && filters.healthSupport.length > 0) {
      const healthConditions = filters.healthSupport.map(health => 
        sql`${products.healthSupport} ILIKE ${health}`
      );
      conditions.push(or(...healthConditions));
    }

    // Origin filter
    if (filters?.origin && filters.origin.length > 0) {
      const originConditions = filters.origin.map(origin => 
        sql`${products.origin} ILIKE ${origin}`
      );
      conditions.push(or(...originConditions));
    }

    // Form filter
    if (filters?.form && filters.form.length > 0) {
      const formConditions = filters.form.map(form => 
        sql`${products.form} ILIKE ${form}`
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

    // Determine sort order
    let orderBy;
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

    const [productsResult, totalResult] = await Promise.all([
      db
        .select()
        .from(products)
        .where(whereClause)
        .limit(filters?.limit || 50)
        .offset(filters?.offset || 0)
        .orderBy(orderBy),
      db
        .select({ count: count() })
        .from(products)
        .where(whereClause),
    ]);

    return {
      products: productsResult,
      total: totalResult[0].count,
    };
  }

  async getAdminProducts(filters?: {
    category?: string;
    search?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ products: Product[]; total: number }> {
    // For admin API, show all products regardless of visibility
    const conditions = [eq(products.isActive, true)];
    
    if (filters?.category && !isNaN(parseInt(filters.category))) {
      conditions.push(eq(products.categoryId, parseInt(filters.category)));
    }
    
    if (filters?.search) {
      conditions.push(
        sql`${products.name} ILIKE ${`%${filters.search}%`} OR ${products.description} ILIKE ${`%${filters.search}%`}`
      );
    }
    
    if (filters?.status) {
      conditions.push(eq(products.status, filters.status));
    }

    const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

    const [productsResult, totalResult] = await Promise.all([
      db
        .select()
        .from(products)
        .where(whereClause)
        .limit(filters?.limit || 100)
        .offset(filters?.offset || 0)
        .orderBy(desc(products.createdAt)),
      db
        .select({ count: count() })
        .from(products)
        .where(whereClause),
    ]);

    return {
      products: productsResult,
      total: totalResult[0].count,
    };
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.slug, slug));
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    // Generate unique product ID if not provided
    if (!product.productId) {
      product.productId = await this.generateProductId();
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
      
    // Sync certifications with tag system
    if (processedProduct.certifications && Array.isArray(processedProduct.certifications)) {
      await this.syncCertificationsToTags(processedProduct.certifications);
    }
    
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<void> {
    await db.update(products).set({ isActive: false }).where(eq(products.id, id));
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
  }): Promise<{ inquiries: Inquiry[]; total: number }> {
    const conditions = [];
    if (filters?.customerId) conditions.push(eq(inquiries.customerId, filters.customerId));
    if (filters?.status) conditions.push(eq(inquiries.status, filters.status));
    if (filters?.assignedTo) conditions.push(eq(inquiries.assignedTo, filters.assignedTo));
    if (filters?.inquiryType) conditions.push(eq(inquiries.inquiryType, filters.inquiryType));
    
    const whereClause = conditions.length > 0 ? (conditions.length === 1 ? conditions[0] : and(...conditions)) : undefined;
    
    const [inquiriesResult, totalResult] = await Promise.all([
      db
        .select()
        .from(inquiries)
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
    // Generate inquiry ID based on type
    const prefix = inquiry.inquiryType === 'high_volume_bid' ? 'BID' : 'INQ';
    const inquiryId = `${prefix}${Date.now()}`;
    const [newInquiry] = await db
      .insert(inquiries)
      .values({ ...inquiry, inquiryId })
      .returning();
    return newInquiry;
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
  }): Promise<{ quotations: Quotation[]; total: number }> {
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
        .select()
        .from(quotations)
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
  async getHeroSlides(): Promise<HeroSlider[]> {
    const slides = await db
      .select()
      .from(heroSliders)
      .where(eq(heroSliders.status, 'active'))
      .orderBy(asc(heroSliders.sortOrder));
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
    totalInquiries: number;
    totalQuotations: number;
    totalOrders: number;
    revenueThisMonth: number;
  }> {
    const [productsCount] = await db.select({ count: count() }).from(products).where(eq(products.isActive, true));
    const [inquiriesCount] = await db.select({ count: count() }).from(inquiries);
    const [quotationsCount] = await db.select({ count: count() }).from(quotations);
    const [ordersCount] = await db.select({ count: count() }).from(salesOrders);

    return {
      totalProducts: productsCount.count,
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
}

export const storage = new DatabaseStorage();
