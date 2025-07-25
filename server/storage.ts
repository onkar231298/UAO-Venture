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
  type Inventory,
  type SalesOrder,
  type PurchaseOrder,
} from "@shared/schema";
import { db } from "./db";
import { eq, like, and, desc, asc, count, sql } from "drizzle-orm";

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
    limit?: number;
    offset?: number;
  }): Promise<{ inquiries: Inquiry[]; total: number }>;
  getInquiry(id: number): Promise<Inquiry | undefined>;
  createInquiry(inquiry: InsertInquiry): Promise<Inquiry>;
  updateInquiry(id: number, inquiry: Partial<InsertInquiry>): Promise<Inquiry>;

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
    
    const [newProduct] = await db.insert(products).values(processedProduct).returning();
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
    const [newTag] = await db.insert(productTags).values(tag).returning();
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
    limit?: number;
    offset?: number;
  }): Promise<{ inquiries: Inquiry[]; total: number }> {
    // Return empty for now - will implement full functionality later
    return { inquiries: [], total: 0 };
  }

  async getInquiry(id: number): Promise<Inquiry | undefined> {
    const [inquiry] = await db.select().from(inquiries).where(eq(inquiries.id, id));
    return inquiry;
  }

  async createInquiry(inquiry: InsertInquiry): Promise<Inquiry> {
    // Generate inquiry ID
    const inquiryId = `INQ${Date.now()}`;
    const [newInquiry] = await db
      .insert(inquiries)
      .values({ ...inquiry, inquiryId })
      .returning();
    return newInquiry;
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
}

export const storage = new DatabaseStorage();
