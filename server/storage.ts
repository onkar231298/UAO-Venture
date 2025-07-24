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
  type User,
  type UpsertUser,
  type Product,
  type InsertProduct,
  type Category,
  type Inquiry,
  type InsertInquiry,
  type Quotation,
  type InsertQuotation,
  type ProductDocument,
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
  getProduct(id: number): Promise<Product | undefined>;
  getProductBySlug(slug: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;

  // Category operations
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;

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
    const conditions = [eq(products.isActive, true)];
    
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

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.slug, slug));
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product> {
    const [updatedProduct] = await db
      .update(products)
      .set({ ...product, updatedAt: new Date() })
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

  // Inquiry operations
  async getInquiries(filters?: {
    customerId?: string;
    status?: string;
    assignedTo?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ inquiries: Inquiry[]; total: number }> {
    // Return empty for now
    return { inquiries: [], total: 0 };
    
    if (filters?.customerId) {
      conditions.push(eq(inquiries.customerId, filters.customerId));
    }
    
    if (filters?.status) {
      conditions.push(eq(inquiries.status, filters.status));
    }
    
    if (filters?.assignedTo) {
      conditions.push(eq(inquiries.assignedTo, filters.assignedTo));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [inquiriesResult, totalResult] = await Promise.all([
      db
        .select()
        .from(inquiries)
        .where(whereClause)
        .limit(filters?.limit || 50)
        .offset(filters?.offset || 0)
        .orderBy(desc(inquiries.createdAt)),
      db
        .select({ count: count() })
        .from(inquiries)
        .where(whereClause),
    ]);

    return {
      inquiries: inquiriesResult,
      total: totalResult[0].count,
    };
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

  // Document operations
  async getProductDocuments(productId: number): Promise<ProductDocument[]> {
    return await db
      .select()
      .from(productDocuments)
      .where(eq(productDocuments.productId, productId))
      .orderBy(desc(productDocuments.createdAt));
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
