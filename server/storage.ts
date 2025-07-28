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
import { eq, like, and, desc, asc, count, sql } from "drizzle-orm";
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
    const count = await db.select({ count: sql<number>`count(*)` }).from(products);
    const nextId = (count[0]?.count || 0) + 1;
    return `BFI${nextId.toString().padStart(3, '0')}`;
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
    category?: string;
    search?: string;
    isOrganic?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ products: Product[]; total: number }> {
    // For public API, show products that are active and visible (regardless of draft/active status)
    const conditions = [
      eq(products.isActive, true),
      eq(products.isVisible, true)
    ];
    
    if (filters?.category && !isNaN(parseInt(filters.category))) {
      conditions.push(eq(products.categoryId, parseInt(filters.category)));
    }
    
    if (filters?.search) {
      conditions.push(
        sql`${products.name} ILIKE ${`%${filters.search}%`} OR ${products.description} ILIKE ${`%${filters.search}%`}`
      );
    }
    
    if (filters?.isOrganic !== undefined) {
      conditions.push(eq(products.isOrganic, filters.isOrganic));
    }

    const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

    const [productsResult, totalResult] = await Promise.all([
      db
        .select()
        .from(products)
        .where(whereClause)
        .limit(filters?.limit || 50)
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
        .limit(filters?.limit || 50)
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

      // Process each row
      for (let i = 0; i < rows.length; i++) {
        const rowIndex = i + 2; // +2 because row 1 is header and we start from 0
        const row = rows[i];
        
        try {
          // Skip empty rows
          if (!row.name || row.name.trim() === '') {
            continue;
          }

          // Validate required fields
          const validationErrors = this.validateProductRow(row, rowIndex, categoryMap, defaultCategory);
          if (validationErrors.length > 0) {
            errors.push(...validationErrors);
            continue;
          }

          // Check for duplicate product IDs
          const productId = row.productId || await this.generateProductId();
          if (existingProductIds.has(productId)) {
            duplicates.push(productId);
            continue;
          }

          // Create product data (all fields from CSV, empty values allowed for optional fields)
          const productData: InsertProduct = {
            productId,
            name: row.name.trim(),
            description: row.description || '',
            category: row.category || defaultCategory || '',
            price: parseFloat(row.price) || 0,
            moq: row.moq || '',
            packagingType: row.packagingType || '',
            origin: row.origin || '',
            botanicalName: row.botanicalName || '',
            plantPart: row.plantPart || '',
            extractionMethod: row.extractionMethod || '',
            solubility: row.solubility || '',
            grade: row.grade || '',
            form: row.form || '',
            activeContent: row.activeContent || '',
            processingMethod: row.processingMethod || '',
            meshSize: row.meshSize || '',
            moisture: row.moisture || '',
            ashContent: row.ashContent || '',
            bulkDensity: row.bulkDensity || '',
            storageConditions: row.storageConditions || '',
            shelfLife: row.shelfLife || '',
            hsCode: row.hsCode || '',
            isOrganic: row.isOrganic === 'true' || row.isOrganic === '1' || false,
            status: row.status || 'draft',
            visibility: 'visible',
            createdBy: userId,
            updatedBy: userId,
            slug: this.generateSlug(row.name),
            metaTitle: row.metaTitle || row.name,
            metaDescription: row.metaDescription || row.description?.substring(0, 160) || '',
            keywords: row.keywords || '',
          };

          successfulRows.push(productData);
          existingProductIds.add(productId); // Prevent duplicates within the same upload

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
        await db.insert(products).values(successfulRows);
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
      'price',                   // Base price (REQUIRED)
      
      // *** OPTIONAL BUSINESS FIELDS (Can be blank) ***
      'moq',                     // Minimum order quantity
      'packagingType',           // How it's packaged
      'origin',                  // Country/region of origin
      'status',                  // draft/active/inactive (defaults to draft)
      'isOrganic',               // true/false for organic certification
      
      // *** OPTIONAL PRODUCT SPECIFICATIONS (Can be blank) ***
      'botanicalName',           // Scientific name
      'plantPart',               // Part of plant used
      'extractionMethod',        // Extraction method used
      'solubility',              // Solubility information
      'grade',                   // Quality grade
      'form',                    // Physical form (powder, liquid, etc.)
      'activeContent',           // Active compound percentage
      'processingMethod',        // Processing method used
      
      // *** OPTIONAL PHYSICAL PROPERTIES (Can be blank) ***
      'meshSize',                // Mesh size specification
      'moisture',                // Moisture content
      'ashContent',              // Ash content percentage
      'bulkDensity',             // Bulk density
      
      // *** OPTIONAL STORAGE & TRADE INFO (Can be blank) ***
      'storageConditions',       // Storage requirements
      'shelfLife',               // Shelf life information
      'hsCode',                  // HS code for customs
      
      // *** OPTIONAL SEO FIELDS (Can be blank) ***
      'metaTitle',               // SEO title
      'metaDescription',         // SEO description
      'keywords'                 // SEO keywords
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
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', reject);
    });
  }

  private async parseExcel(buffer: Buffer): Promise<any[]> {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return xlsx.utils.sheet_to_json(worksheet);
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
    
    // Status validation (only if provided)
    if (row.status && row.status.trim() !== '' && !['draft', 'active', 'inactive'].includes(row.status.toLowerCase())) {
      errors.push({ 
        line: lineNumber, 
        field: 'status', 
        message: 'Status must be: draft, active, or inactive (or leave blank for default)', 
        value: row.status 
      });
    }

    // Boolean validation for isOrganic (only if provided)
    if (row.isOrganic && row.isOrganic.trim() !== '' && !['true', 'false', '1', '0', 'yes', 'no'].includes(row.isOrganic.toLowerCase())) {
      errors.push({ 
        line: lineNumber, 
        field: 'isOrganic', 
        message: 'isOrganic must be: true, false, 1, 0, yes, no (or leave blank for false)', 
        value: row.isOrganic 
      });
    }

    return errors;
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  private generateExampleDataForCategory(categoryName: string): string[] {
    const baseExample = [
      // *** REQUIRED FIELDS ***
      'Ashwagandha Root Extract Powder', // name (REQUIRED)
      'Premium quality Ashwagandha root extract powder with 5% withanolides for nutraceutical applications', // description (REQUIRED)
      categoryName, // category (REQUIRED)
      '25.50', // price (REQUIRED)
      
      // *** OPTIONAL BUSINESS FIELDS ***
      '25 KG', // moq
      '25kg HDPE Drums', // packagingType
      'India', // origin
      'active', // status
      'true', // isOrganic
      
      // *** OPTIONAL PRODUCT SPECIFICATIONS ***
      'Withania somnifera', // botanicalName
      'Root', // plantPart
      'Water-Ethanol Extraction', // extractionMethod
      'Partially soluble in water', // solubility
      'Pharmaceutical Grade', // grade
      'Fine Powder', // form
      '5% Withanolides', // activeContent
      'Spray Dried', // processingMethod
      
      // *** OPTIONAL PHYSICAL PROPERTIES ***
      '80 mesh', // meshSize
      '≤ 5%', // moisture
      '≤ 8%', // ashContent
      '0.45-0.65 g/ml', // bulkDensity
      
      // *** OPTIONAL STORAGE & TRADE INFO ***
      'Store in cool, dry place away from direct sunlight', // storageConditions
      '24 months', // shelfLife
      '1302.19', // hsCode
      
      // *** OPTIONAL SEO FIELDS ***
      'Premium Ashwagandha Root Extract Powder - 5% Withanolides', // metaTitle
      'High-quality Ashwagandha root extract powder with standardized 5% withanolides. Perfect for nutraceutical and supplement applications.', // metaDescription
      'ashwagandha, withanolides, herbal extract, adaptogen, stress relief' // keywords
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
