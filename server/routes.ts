import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertInquirySchema, 
  insertQuotationSchema, 
  insertProductSchema, 
  insertCategorySchema,
  insertProductTypeSchema,
  insertProductTypeRelationSchema,
  insertHealthSupportSchema,
  insertHealthSupportRelationSchema,
  insertProductTagSchema,
  insertHeroSliderSchema,
  insertProductDocumentSchema,
  insertSampleRequestSchema,
  insertProductFaqSchema,
  insertBlogPostSchema,
  insertSeoMonitoringSchema,
  insertCoreWebVitalsSchema,
  insertSearchAnalyticsSchema,
  insertHreflangConfigSchema,
  insertGlobalSeoSettingsSchema,
  insertNewsletterSubscriptionSchema,
  customerRegistrationSchema,
  insertCompanySchema,
  insertCompanyContactSchema,
  insertCompanyNoteSchema,
  insertLeadSchema,
  insertLeadActivitySchema,
  insertLeadTaskSchema,
  insertAssignmentRuleSchema,
  insertStaffSchema,
  updateStaffSchema,
  resetPasswordSchema,
  STAFF_DEPARTMENTS,
  ALL_STAFF_ROLES,
  quotationItems,
  quotations,
  companies,
  companyContacts,
  leads,
  inquiries,
  bidRevisions,
  products,
  smsMessages,
} from "@shared/schema";
import { eq, and, isNotNull, desc, inArray } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcryptjs";
import multer from "multer";
import { productImageUpload, heroSliderUpload, generatePresignedUrl, getImageUrl, deleteFromS3 } from "./s3Upload";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { AWSS3Service } from "./awsS3Service";
import { imageProcessor, ImageProcessor } from "./imageProcessor";
import mimeTypes from "mime-types";
import { createStaticProductPage, createStaticHomePage } from "./static-handler";
import * as gmailApi from "./gmail";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize services
  const s3Service = new AWSS3Service();
  
  // Multer configuration for WebP processing
  const webpUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
      files: 10 // Max 10 files per upload
    },
    fileFilter: (req, file, cb) => {
      const mimeType = file.mimetype;
      if (ImageProcessor.isValidImageFormat(mimeType)) {
        cb(null, true);
      } else {
        cb(new Error(`Unsupported image format: ${mimeType}. Supported: JPEG, PNG, GIF, TIFF, BMP, WebP`));
      }
    }
  });

  // Auth middleware
  await setupAuth(app);

  // reCAPTCHA site key endpoint for frontend
  app.get('/api/recaptcha-site-key', (req, res) => {
    res.json({ siteKey: process.env.RECAPTCHA_SITE_KEY });
  });

  // reCAPTCHA verification endpoint
  app.post('/api/verify-recaptcha', async (req, res) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ 
          success: false, 
          message: 'reCAPTCHA token is required' 
        });
      }

      // Verify token with Google
      const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`,
      });

      const data = await response.json();
      
      // For reCAPTCHA v3, check both success and score
      if (data.success && data.score >= 0.5) {
        res.json({ 
          success: true, 
          score: data.score,
          message: 'reCAPTCHA verification successful'
        });
      } else {
        res.status(400).json({ 
          success: false, 
          score: data.score || 0,
          message: 'reCAPTCHA verification failed',
          errors: data['error-codes'] || []
        });
      }
    } catch (error) {
      console.error('reCAPTCHA verification error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error during reCAPTCHA verification' 
      });
    }
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // CAPTCHA verification function for reCAPTCHA v3
  async function verifyCaptcha(token: string, remoteip?: string): Promise<{ success: boolean; score?: number; message?: string }> {
    try {
      console.log('Verifying reCAPTCHA token...');
      const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          secret: process.env.RECAPTCHA_SECRET_KEY!,
          response: token,
          ...(remoteip && { remoteip }),
        }),
      });
      
      const data = await response.json();
      console.log('reCAPTCHA verification response:', data);
      
      // For reCAPTCHA v3, check both success and score
      if (data.success && data.score >= 0.5) {
        return { success: true, score: data.score, message: 'Verification successful' };
      } else {
        // Handle common development environment errors
        if (data['error-codes'] && data['error-codes'].includes('browser-error')) {
          console.log('reCAPTCHA browser-error detected - common in development environments');
          // In development, we can be more lenient, but still require the attempt
          if (process.env.NODE_ENV !== 'production') {
            return { success: true, score: 0.6, message: 'Development environment - verification bypassed' };
          }
        }
        
        return { 
          success: false, 
          score: data.score || 0, 
          message: `Verification failed (score: ${data.score || 0}, errors: ${data['error-codes']?.join(', ') || 'unknown'})` 
        };
      }
    } catch (error) {
      console.error('CAPTCHA verification error:', error);
      return { success: false, message: 'Verification error' };
    }
  }

  // Customer registration endpoint with reCAPTCHA
  app.post('/api/auth/register-customer', async (req, res) => {
    try {
      const { recaptchaToken, ...registrationData } = req.body;
      
      // Verify reCAPTCHA - now required for all registrations
      if (!recaptchaToken) {
        return res.status(400).json({ 
          message: 'Security verification is required. Please enable JavaScript and try again.' 
        });
      }

      const captchaResult = await verifyCaptcha(recaptchaToken);
      if (!captchaResult.success) {
        console.log(`reCAPTCHA verification failed: ${captchaResult.message}`);
        return res.status(400).json({ 
          message: `Security verification failed. ${captchaResult.message || 'Please try again.'}` 
        });
      }
      
      console.log(`reCAPTCHA verification successful with score: ${captchaResult.score}`);
      
      const validatedData = customerRegistrationSchema.parse(registrationData);
      const { password, confirmPassword, ...userData } = validatedData;
      
      const clientIp = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create customer user
      const user = await storage.createCustomer({
        ...userData,
        password: hashedPassword,
        userType: 'customer',
        accountStatus: 'active',
        registrationIp: clientIp,
      });

      // Also create a company record for CRM with origin='website'
      if (userData.companyName) {
        try {
          await storage.createCompany({
            companyName: userData.companyName,
            primaryEmail: userData.email,
            primaryPhone: userData.phone || null,
            addressStreet: userData.addressStreet || null,
            addressCity: userData.addressCity || null,
            addressState: userData.addressState || null,
            addressCountry: userData.addressCountry || null,
            addressZip: userData.addressZip || null,
            gstNumber: userData.gstNumber || null,
            industryType: userData.industryType || null,
            companySize: userData.companySize || null,
            annualTurnover: userData.annualTurnover || null,
            website: userData.website || null,
            origin: 'website',
            status: 'active',
            companyStage: 'prospect',
            linkedUserId: user.id,
            createdBy: 'system',
          });
        } catch (companyError) {
          console.error('Error creating company record for website customer:', companyError);
          // Continue even if company creation fails - customer registration is still successful
        }
      }

      res.status(201).json({ 
        message: "Account created successfully",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          companyName: user.companyName,
        }
      });
    } catch (error) {
      console.error("Customer registration error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Customer login route
  app.post('/api/auth/customer-login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Find customer by email
      const customer = await storage.getUserByEmail(email);
      if (!customer || customer.userType !== 'customer') {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, customer.password || '');
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Return customer info (without password)
      const { password: _, ...customerInfo } = customer;
      res.json({
        message: "Login successful",
        user: customerInfo
      });
    } catch (error) {
      console.error("Error during customer login:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Admin customer management routes
  app.get('/api/admin/customers', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || !['super_admin', 'admin'].includes(user.role || '')) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { search, country, industryType, accountStatus, page = '1', limit = '20' } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const result = await storage.getCustomers({
        search: search as string,
        country: country as string,
        industryType: industryType as string,
        accountStatus: accountStatus as string,
        limit: parseInt(limit),
        offset,
      });

      res.json(result);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.get('/api/admin/customers/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || !['super_admin', 'admin'].includes(user.role || '')) {
        return res.status(403).json({ message: "Access denied" });
      }

      const customer = await storage.getUser(req.params.id);
      if (!customer || customer.userType !== 'customer') {
        return res.status(404).json({ message: "Customer not found" });
      }

      res.json(customer);
    } catch (error) {
      console.error("Error fetching customer:", error);
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });

  app.put('/api/admin/customers/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || !['super_admin', 'admin'].includes(user.role || '')) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updates = req.body;
      delete updates.password; // Don't allow password updates through this endpoint
      delete updates.id; // Don't allow ID changes

      const updatedCustomer = await storage.updateCustomer(req.params.id, updates);
      res.json(updatedCustomer);
    } catch (error) {
      console.error("Error updating customer:", error);
      res.status(500).json({ message: "Failed to update customer" });
    }
  });

  // ========================================
  // STAFF MANAGEMENT ROUTES
  // ========================================

  // Get all staff users with filtering
  app.get('/api/admin/staff', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'super_admin') {
        return res.status(403).json({ message: "Access denied. Only Super Admin can manage staff." });
      }

      const { search, department, role, isActive, page = '1', limit = '50' } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const result = await storage.getStaffUsers({
        search: search as string,
        department: department as string,
        role: role as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        limit: parseInt(limit),
        offset,
      });

      res.json(result);
    } catch (error) {
      console.error("Error fetching staff users:", error);
      res.status(500).json({ message: "Failed to fetch staff users" });
    }
  });

  // Get single staff user
  app.get('/api/admin/staff/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'super_admin') {
        return res.status(403).json({ message: "Access denied. Only Super Admin can manage staff." });
      }

      const staffUser = await storage.getStaffUser(req.params.id);
      if (!staffUser) {
        return res.status(404).json({ message: "Staff user not found" });
      }

      // Don't return password
      const { password: _, ...staffData } = staffUser;
      res.json(staffData);
    } catch (error) {
      console.error("Error fetching staff user:", error);
      res.status(500).json({ message: "Failed to fetch staff user" });
    }
  });

  // Create new staff user
  app.post('/api/admin/staff', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'super_admin') {
        return res.status(403).json({ message: "Access denied. Only Super Admin can create staff." });
      }

      // Validate request body
      const validatedData = insertStaffSchema.parse(req.body);

      // Check if email already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }

      // Generate unique staff ID
      const staffId = `staff_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

      // Create staff user
      const newStaff = await storage.createStaffWithPassword({
        id: staffId,
        email: validatedData.email,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        password: validatedData.password,
        role: validatedData.role,
        department: validatedData.department,
        phoneNumber: validatedData.phoneNumber || null,
        userType: 'staff',
        isActive: true,
      });

      // Don't return password
      const { password: _, ...staffData } = newStaff;
      res.status(201).json(staffData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation failed", errors: error.errors });
      }
      console.error("Error creating staff user:", error);
      res.status(500).json({ message: "Failed to create staff user" });
    }
  });

  // Update staff user
  app.patch('/api/admin/staff/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'super_admin') {
        return res.status(403).json({ message: "Access denied. Only Super Admin can update staff." });
      }

      // Validate request body
      const validatedData = updateStaffSchema.parse(req.body);

      // Check if trying to update email to one that already exists
      if (validatedData.email) {
        const existingUser = await storage.getUserByEmail(validatedData.email);
        if (existingUser && existingUser.id !== req.params.id) {
          return res.status(400).json({ message: "Email already in use" });
        }
      }

      const updatedStaff = await storage.updateStaff(req.params.id, validatedData);

      // Don't return password
      const { password: _, ...staffData } = updatedStaff;
      res.json(staffData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation failed", errors: error.errors });
      }
      console.error("Error updating staff user:", error);
      res.status(500).json({ message: "Failed to update staff user" });
    }
  });

  // Toggle staff active status
  app.patch('/api/admin/staff/:id/toggle-status', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'super_admin') {
        return res.status(403).json({ message: "Access denied. Only Super Admin can manage staff." });
      }

      const staffUser = await storage.getStaffUser(req.params.id);
      if (!staffUser) {
        return res.status(404).json({ message: "Staff user not found" });
      }

      const updatedStaff = await storage.updateStaff(req.params.id, {
        isActive: !staffUser.isActive,
      });

      // Don't return password
      const { password: _, ...staffData } = updatedStaff;
      res.json(staffData);
    } catch (error) {
      console.error("Error toggling staff status:", error);
      res.status(500).json({ message: "Failed to toggle staff status" });
    }
  });

  // Reset staff password
  app.patch('/api/admin/staff/:id/reset-password', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'super_admin') {
        return res.status(403).json({ message: "Access denied. Only Super Admin can reset passwords." });
      }

      // Validate request body
      const validatedData = resetPasswordSchema.parse(req.body);

      const success = await storage.updateStaffPassword(req.params.id, validatedData.newPassword);
      if (!success) {
        return res.status(404).json({ message: "Staff user not found" });
      }

      res.json({ message: "Password reset successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation failed", errors: error.errors });
      }
      console.error("Error resetting staff password:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Delete staff user
  app.delete('/api/admin/staff/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'super_admin') {
        return res.status(403).json({ message: "Access denied. Only Super Admin can delete staff." });
      }

      // Check if trying to delete yourself
      if (req.params.id === user.id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      await storage.deleteStaff(req.params.id);
      res.json({ message: "Staff user deleted successfully" });
    } catch (error) {
      console.error("Error deleting staff user:", error);
      res.status(500).json({ message: "Failed to delete staff user" });
    }
  });

  // Get staff departments and roles (for dropdowns)
  app.get('/api/admin/staff/options/departments-roles', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'super_admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json({
        departments: STAFF_DEPARTMENTS,
        roles: ALL_STAFF_ROLES,
      });
    } catch (error) {
      console.error("Error fetching staff options:", error);
      res.status(500).json({ message: "Failed to fetch staff options" });
    }
  });


  // Server-side SEO endpoint for structured data (used by React component)
  app.get('/api/products/:slug/seo', async (req, res) => {
    try {
      const { slug } = req.params;
      const product = await storage.getProductBySlug(slug);
      
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const productUrl = `${baseUrl}/products/${product.slug}`;
      const imageUrl = product.mainImage?.startsWith('http') ? product.mainImage : `${baseUrl}${product.mainImage}`;

      // Get product FAQs for schema
      const productFaqs = await storage.getProductFaqs(product.id);
      
      // Generate enhanced structured data with FAQ schema
      const structuredData = {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": product.name,
        "description": product.description || `High-quality ${product.name} from BFI Organic`,
        "sku": product.productId,
        "mpn": product.productId,
        "brand": {
          "@type": "Brand",
          "name": "BFI Organic",
          "url": baseUrl
        },
        "manufacturer": {
          "@type": "Organization",
          "name": "Bright Fame Organic Pvt. Ltd.",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "C/O Bright Fame International, Opp. Murlidhar Guest House, Mehsana-Vishnagar Road, Kansarakui",
            "addressLocality": "Mehsana",
            "addressRegion": "Gujarat",
            "postalCode": "384001",
            "addressCountry": "IN"
          },
          "telephone": "+91-7249847439",
          "url": baseUrl
        },
        "image": imageUrl,
        "url": productUrl,
        "category": product.healthSupport || "Organic Ingredients",
        "offers": {
          "@type": "Offer",
          "priceCurrency": "USD",
          "price": product.priceUSD || product.rate || 0,
          "priceValidUntil": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          "availability": product.currentStock && Number(product.currentStock) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          "itemCondition": "https://schema.org/NewCondition",
          "seller": {
            "@type": "Organization",
            "name": "BFI Organic",
            "url": baseUrl
          }
        },
        "additionalProperty": [
          ...(product.botanicalName ? [{
            "@type": "PropertyValue",
            "name": "Botanical Name",
            "value": product.botanicalName
          }] : []),
          ...(product.origin ? [{
            "@type": "PropertyValue", 
            "name": "Origin",
            "value": product.origin
          }] : []),
          ...(product.form ? [{
            "@type": "PropertyValue",
            "name": "Form", 
            "value": product.form
          }] : [])
        ]
      };

      // Add FAQ schema if FAQs exist
      const faqSchema = productFaqs?.length > 0 ? {
        "@context": "https://schema.org/",
        "@type": "FAQPage",
        "mainEntity": productFaqs.map(faq => ({
          "@type": "Question",
          "name": faq.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.answer
          }
        }))
      } : null;

      const breadcrumbData = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": baseUrl
          },
          {
            "@type": "ListItem", 
            "position": 2,
            "name": "Products",
            "item": `${baseUrl}/products`
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": product.name,
            "item": productUrl
          }
        ]
      };

      const organizationSchema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Bright Fame Organic Pvt. Ltd.",
        "url": baseUrl,
        "logo": `${baseUrl}/logo.png`,
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "C/O Bright Fame International, Opp. Murlidhar Guest House, Mehsana-Vishnagar Road, Kansarakui",
          "addressLocality": "Mehsana",
          "addressRegion": "Gujarat",
          "postalCode": "384001",
          "addressCountry": "IN"
        },
        "telephone": "+91-7249847439"
      };

      res.json({
        productSchema: structuredData,
        breadcrumbSchema: breadcrumbData,
        organizationSchema: organizationSchema,
        faqSchema: faqSchema,
        seoData: {
          title: product.seoTitle || `${product.name} - BFI Organic`,
          description: product.seoDescription || product.description || `High-quality ${product.name} from BFI Organic`,
          canonical: productUrl,
          ogTitle: product.seoTitle || `${product.name} - BFI Organic`,
          ogDescription: product.seoDescription || product.description || `High-quality ${product.name} from BFI Organic`,
          ogImage: imageUrl,
          ogUrl: productUrl
        }
      });
    } catch (error) {
      console.error('Error generating SEO data:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // IP-based currency detection endpoint
  app.get('/api/detect-currency', async (req, res) => {
    try {
      // Get IP address from request (handle proxy headers)
      const forwarded = req.headers['x-forwarded-for'] as string;
      const clientIP = forwarded ? forwarded.split(',')[0].trim() : 
                      req.headers['x-real-ip'] as string || 
                      req.connection.remoteAddress || 
                      req.socket.remoteAddress || 
                      '127.0.0.1';

      console.log(`Detecting currency for IP: ${clientIP}`);

      // Skip localhost/development IPs
      if (clientIP === '127.0.0.1' || clientIP === '::1' || clientIP?.startsWith('192.168.') || clientIP?.startsWith('10.')) {
        return res.json({ currency: 'USD', source: 'localhost_default', ip: clientIP });
      }

      // Try multiple IP geolocation services
      const services = [
        // Service 1: ipapi.co
        async () => {
          const response = await fetch(`https://ipapi.co/${clientIP}/json/`);
          const data = await response.json();
          return { countryCode: data.country_code, service: 'ipapi.co' };
        },
        
        // Service 2: ip-api.com (free, no key required)
        async () => {
          const response = await fetch(`http://ip-api.com/json/${clientIP}?fields=countryCode`);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          const text = await response.text();
          const data = JSON.parse(text); // Handle non-JSON responses better
          if (data.status === 'fail') {
            throw new Error(data.message || 'IP lookup failed');
          }
          return { countryCode: data.countryCode, service: 'ip-api.com' };
        }
      ];

      // Country to currency mapping (server-side)
      const COUNTRY_CURRENCY_MAP: Record<string, string> = {
        US: 'USD', CA: 'USD', MX: 'USD', // North America
        IN: 'INR', // India
        DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR', NL: 'EUR', BE: 'EUR', AT: 'EUR', // Europe
        PT: 'EUR', IE: 'EUR', FI: 'EUR', LU: 'EUR', MT: 'EUR', CY: 'EUR', SK: 'EUR',
        SI: 'EUR', EE: 'EUR', LV: 'EUR', LT: 'EUR', GR: 'EUR',
        GB: 'GBP', UK: 'GBP', // UK
      };

      // Try each service
      for (const service of services) {
        try {
          const result = await service();
          const currency = COUNTRY_CURRENCY_MAP[result.countryCode] || 'USD';
          
          if (result.countryCode) {
            console.log(`Currency detected: ${result.countryCode} -> ${currency} via ${result.service}`);
            return res.json({ 
              currency, 
              countryCode: result.countryCode, 
              source: result.service,
              ip: clientIP 
            });
          }
        } catch (error) {
          console.warn(`IP service failed:`, error);
          continue;
        }
      }

      // Fallback to USD
      res.json({ currency: 'USD', source: 'fallback', ip: clientIP });
    } catch (error) {
      console.error('Currency detection error:', error);
      res.json({ currency: 'USD', source: 'error_fallback' });
    }
  });

  // Public API routes (no authentication required)
  
  // Get products with advanced filtering
  app.get('/api/products', async (req, res) => {
    try {
      const { 
        category, 
        search, 
        materials, 
        productType,
        isOrganic,
        healthSupport, 
        origin, 
        form, 
        inStock, 
        priceMin, 
        priceMax, 
        sortBy, 
        limit = '50', 
        offset = '0' 
      } = req.query;
      
      const filters: any = {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      };

      // Handle array filters (comma-separated)
      if (category) {
        filters.category = Array.isArray(category) ? category : (category as string).split(',');
      }
      
      if (healthSupport) {
        filters.healthSupport = Array.isArray(healthSupport) ? healthSupport : (healthSupport as string).split(',');
      }
      
      if (origin) {
        filters.origin = Array.isArray(origin) ? origin : (origin as string).split(',');
      }
      
      if (form) {
        filters.form = Array.isArray(form) ? form : (form as string).split(',');
      }
      
      if (materials) {
        filters.materials = Array.isArray(materials) ? materials : (materials as string).split(',');
      }
      
      if (productType) {
        filters.productType = Array.isArray(productType) ? productType : (productType as string).split(',');
      }

      // Handle other filters
      if (search) {
        filters.search = search as string;
      }
      
      if (inStock !== undefined) {
        filters.inStock = inStock === 'true';
      }
      
      if (priceMin && priceMax) {
        filters.priceRange = [parseFloat(priceMin as string), parseFloat(priceMax as string)];
      }
      
      if (sortBy) {
        filters.sortBy = sortBy as string;
      }
      
      // Handle isOrganic filter
      if (isOrganic !== undefined) {
        filters.isOrganic = isOrganic === 'true';
      }

      const result = await storage.getProducts(filters);
      res.json(result);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Get featured products (public endpoint) - MUST be before :id route
  app.get('/api/products/featured', async (req, res) => {
    try {
      const { limit = '8' } = req.query;
      const limitNum = parseInt(limit as string, 10) || 8;
      console.log('Fetching featured products with limit:', limitNum);
      const featuredProducts = await storage.getFeaturedProducts(limitNum);
      console.log('Featured products fetched:', featuredProducts?.length || 0);
      res.json(featuredProducts);
    } catch (error) {
      console.error("Error fetching featured products:", error);
      res.status(500).json({ message: "Failed to fetch featured products" });
    }
  });

  // Get product by slug
  app.get('/api/products/slug/:slug', async (req, res) => {
    try {
      const product = await storage.getProductBySlug(req.params.slug);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  // Get single product by ID - MUST be after specific routes
  app.get('/api/products/:id', async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const product = await storage.getProduct(productId);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  // Get categories
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Product Types API Routes
  app.get('/api/product-types', async (req, res) => {
    try {
      const types = await storage.getAllProductTypes();
      res.json(types);
    } catch (error) {
      console.error("Error fetching product types:", error);
      res.status(500).json({ message: "Failed to fetch product types" });
    }
  });

  app.post('/api/product-types', isAuthenticated, async (req, res) => {
    try {
      const typeData = insertProductTypeSchema.parse(req.body);
      const newType = await storage.createProductType(typeData);
      res.status(201).json(newType);
    } catch (error) {
      console.error("Error creating product type:", error);
      res.status(500).json({ message: "Failed to create product type" });
    }
  });

  app.put('/api/product-types/:id', isAuthenticated, async (req, res) => {
    try {
      const typeId = parseInt(req.params.id);
      const typeData = insertProductTypeSchema.partial().parse(req.body);
      const updatedType = await storage.updateProductType(typeId, typeData);
      res.json(updatedType);
    } catch (error) {
      console.error("Error updating product type:", error);
      res.status(500).json({ message: "Failed to update product type" });
    }
  });

  app.delete('/api/product-types/:id', isAuthenticated, async (req, res) => {
    try {
      const typeId = parseInt(req.params.id);
      await storage.deleteProductType(typeId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting product type:", error);
      res.status(500).json({ message: "Failed to delete product type" });
    }
  });

  // Product-Type relationship routes
  app.post('/api/products/:productId/types', isAuthenticated, async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const { typeId, isPrimary } = insertProductTypeRelationSchema.parse(req.body);
      const relation = await storage.addProductToType(productId, typeId, isPrimary);
      res.status(201).json(relation);
    } catch (error) {
      console.error("Error adding product to type:", error);
      res.status(500).json({ message: "Failed to add product to type" });
    }
  });

  app.delete('/api/products/:productId/types/:typeId', isAuthenticated, async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const typeId = parseInt(req.params.typeId);
      await storage.removeProductFromType(productId, typeId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing product from type:", error);
      res.status(500).json({ message: "Failed to remove product from type" });
    }
  });

  app.put('/api/products/:productId/types/:typeId', isAuthenticated, async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const typeId = parseInt(req.params.typeId);
      const { isPrimary } = req.body;
      const relation = await storage.updateProductTypeRelation(productId, typeId, isPrimary);
      res.json(relation);
    } catch (error) {
      console.error("Error updating product type relation:", error);
      res.status(500).json({ message: "Failed to update product type relation" });
    }
  });

  app.get('/api/products/:productId/types', async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const types = await storage.getProductTypesForProduct(productId);
      res.json(types);
    } catch (error) {
      console.error("Error fetching product types:", error);
      res.status(500).json({ message: "Failed to fetch product types" });
    }
  });

  app.get('/api/product-types/:typeId/products', async (req, res) => {
    try {
      const typeId = parseInt(req.params.typeId);
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const result = await storage.getProductsByType(typeId, limit, offset);
      res.json(result);
    } catch (error) {
      console.error("Error fetching products by type:", error);
      res.status(500).json({ message: "Failed to fetch products by type" });
    }
  });

  // Bulk assign primary product types to products that don't have any
  app.post('/api/product-types/bulk-assign', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (!user.role?.includes('admin') && user.role !== 'website_manager')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      // Get all product types
      const productTypes = await storage.getAllProductTypes();
      const organicType = productTypes.find(t => t.slug === 'organic');
      
      if (!organicType) {
        return res.status(400).json({ message: "Organic product type not found" });
      }

      // Get products without any type relationships
      const { products } = await storage.getProducts({ limit: 1000 });
      let assignedCount = 0;

      for (const product of products) {
        const existingTypes = await storage.getProductTypesForProduct(product.id);
        if (existingTypes.length === 0) {
          // Assign organic as default primary type
          await storage.addProductToType(product.id, organicType.id, true);
          assignedCount++;
        }
      }

      res.json({
        success: true,
        message: `Assigned primary types to ${assignedCount} products`,
        assignedCount
      });
    } catch (error) {
      console.error("Error bulk assigning product types:", error);
      res.status(500).json({ message: "Failed to bulk assign product types" });
    }
  });

  // Health Support routes
  app.get('/api/health-supports', async (req, res) => {
    try {
      const healthSupports = await storage.getHealthSupports();
      res.json(healthSupports);
    } catch (error) {
      console.error("Error fetching health supports:", error);
      res.status(500).json({ message: "Failed to fetch health supports" });
    }
  });

  app.post('/api/health-supports', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertHealthSupportSchema.parse(req.body);
      const newHealthSupport = await storage.createHealthSupport(validatedData);
      res.status(201).json(newHealthSupport);
    } catch (error) {
      console.error("Error creating health support:", error);
      res.status(500).json({ message: "Failed to create health support" });
    }
  });

  app.put('/api/health-supports/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertHealthSupportSchema.partial().parse(req.body);
      const updatedHealthSupport = await storage.updateHealthSupport(id, validatedData);
      res.json(updatedHealthSupport);
    } catch (error) {
      console.error("Error updating health support:", error);
      res.status(500).json({ message: "Failed to update health support" });
    }
  });

  app.delete('/api/health-supports/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteHealthSupport(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting health support:", error);
      res.status(500).json({ message: "Failed to delete health support" });
    }
  });

  // Health Support-Product relationship routes
  app.get('/api/products/:productId/health-supports', async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const healthSupports = await storage.getHealthSupportsForProduct(productId);
      res.json(healthSupports);
    } catch (error) {
      console.error("Error fetching product health supports:", error);
      res.status(500).json({ message: "Failed to fetch product health supports" });
    }
  });

  app.post('/api/products/:productId/health-supports', isAuthenticated, async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const { healthSupportId, isPrimary } = req.body;
      await storage.addHealthSupportToProduct(productId, healthSupportId, isPrimary);
      res.json({ success: true });
    } catch (error) {
      console.error("Error adding health support to product:", error);
      res.status(500).json({ message: "Failed to add health support to product" });
    }
  });

  app.delete('/api/products/:productId/health-supports/:healthSupportId', isAuthenticated, async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const healthSupportId = parseInt(req.params.healthSupportId);
      await storage.removeHealthSupportFromProduct(productId, healthSupportId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing health support from product:", error);
      res.status(500).json({ message: "Failed to remove health support from product" });
    }
  });

  app.post('/api/products/:productId/health-supports/bulk', isAuthenticated, async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const { healthSupportAssignments } = req.body;
      await storage.setProductHealthSupports(productId, healthSupportAssignments);
      res.json({ success: true });
    } catch (error) {
      console.error("Error bulk updating product health supports:", error);
      res.status(500).json({ message: "Failed to bulk update product health supports" });
    }
  });

  // Object storage endpoints for category images
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Object storage endpoints - handle /objects/ path for uploaded files
  app.get("/objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Upload endpoints - AWS S3 for products, Replit for categories/hero slides
  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    try {
      // Default to Replit object storage for category/hero uploads
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL, provider: 'replit-object-storage' });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  // NEW: Direct WebP processing and upload endpoint for product images
  app.post("/api/products/upload-webp", isAuthenticated, webpUpload.array('images', 10), async (req: any, res) => {
    try {
      if (!process.env.AWS_S3_BUCKET_NAME || !process.env.AWS_ACCESS_KEY_ID) {
        return res.status(503).json({ 
          error: "AWS S3 not configured for product images",
          message: "Please configure AWS credentials for product image uploads" 
        });
      }

      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      const userId = req.user.claims.sub;
      const productId = req.body.productId || `temp-${Date.now()}`;

      console.log(`🚀 Processing ${files.length} images for product ${productId}...`);

      const processedResults = [];

      for (const file of files) {
        try {
          console.log(`📸 Processing: ${file.originalname} (${file.mimetype}, ${file.size} bytes)`);

          // Process image into 3 WebP sizes
          const processedImages = await imageProcessor.processProductImage(file.buffer, file.originalname);

          // Upload all 3 sizes to S3
          const uploadedUrls = await s3Service.uploadProductImages(processedImages, productId);

          processedResults.push({
            originalName: file.originalname,
            productId,
            urls: uploadedUrls,
            sizes: processedImages.map(img => ({
              size: img.size,
              width: img.width,
              height: img.height,
              fileSize: img.fileSize
            }))
          });

          console.log(`✅ Successfully processed ${file.originalname}`);

        } catch (error) {
          console.error(`❌ Failed to process ${file.originalname}:`, error);
          processedResults.push({
            originalName: file.originalname,
            error: error instanceof Error ? error.message : 'Processing failed'
          });
        }
      }

      const successCount = processedResults.filter(r => !r.error).length;
      const failCount = processedResults.filter(r => r.error).length;

      console.log(`🎉 WebP processing complete: ${successCount} successful, ${failCount} failed`);

      res.json({
        success: true,
        message: `Processed ${successCount}/${files.length} images successfully`,
        results: processedResults,
        provider: 'aws-s3-webp'
      });

    } catch (error) {
      console.error("WebP processing error:", error);
      res.status(500).json({ 
        error: "WebP processing failed",
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Legacy: Product image upload endpoint - AWS S3 only (kept for compatibility)
  app.post("/api/products/upload", isAuthenticated, async (req, res) => {
    try {
      // Check if AWS S3 is configured for product images
      if (process.env.AWS_S3_BUCKET_NAME && process.env.AWS_ACCESS_KEY_ID) {
        const uploadURL = await s3Service.getProductImageUploadURL();
        return res.json({ uploadURL, provider: 'aws-s3' });
      } else {
        return res.status(503).json({ 
          error: "AWS S3 not configured for product images",
          message: "Please configure AWS credentials for product image uploads" 
        });
      }
    } catch (error) {
      console.error("Error generating product upload URL:", error);
      res.status(500).json({ error: "Failed to generate product upload URL" });
    }
  });

  // Category image upload endpoint - uses public object storage
  app.post("/api/categories/upload", isAuthenticated, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getPublicObjectUploadURL();
      return res.json({ uploadURL, provider: 'replit-object-storage-public' });
    } catch (error) {
      console.error("Error generating category upload URL:", error);
      res.status(500).json({ error: "Failed to generate category upload URL" });
    }
  });

  app.put("/api/category-images", isAuthenticated, async (req, res) => {
    if (!req.body.imageUrl) {
      return res.status(400).json({ error: "imageUrl is required" });
    }

    const userId = (req as any).user?.claims?.sub;

    try {
      // Categories always use Replit object storage
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.imageUrl,
        {
          owner: userId,
          visibility: "public", // Category images should be public
        },
      );

      // Ensure the returned path is clean and doesn't contain full URLs
      const cleanPath = objectPath.startsWith('/objects/') 
        ? objectPath 
        : `/objects/${objectPath}`;

      res.status(200).json({
        objectPath: cleanPath,
        provider: 'replit-object-storage'
      });
    } catch (error) {
      console.error("Error setting category image:", error);
      
      // If ACL setting fails, still try to provide a clean path
      try {
        const objectStorageService = new ObjectStorageService();
        const fallbackPath = objectStorageService.normalizeObjectEntityPath(req.body.imageUrl);
        const cleanPath = fallbackPath.startsWith('/objects/') 
          ? fallbackPath 
          : `/objects/${fallbackPath}`;
          
        res.status(200).json({
          objectPath: cleanPath,
          provider: 'replit-object-storage',
          warning: 'ACL policy not set, but image should still be accessible'
        });
      } catch (fallbackError) {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  });

  // Product image handling endpoint - AWS S3 only
  app.put("/api/product-images", isAuthenticated, async (req, res) => {
    if (!req.body.imageUrl) {
      return res.status(400).json({ error: "imageUrl is required" });
    }

    try {
      // Check if using AWS S3 for product images
      if (process.env.AWS_S3_BUCKET_NAME && req.body.imageUrl.includes('amazonaws.com')) {
        const { AWSS3Service } = await import('./awsS3Service');
        const s3Service = new AWSS3Service();
        const objectKey = s3Service.extractObjectKey(req.body.imageUrl);
        
        if (objectKey) {
          // Return the public S3 URL for products
          const publicUrl = s3Service.getObjectURL(objectKey);
          return res.status(200).json({
            objectPath: publicUrl,
            provider: 'aws-s3'
          });
        }
      }
      
      return res.status(400).json({ 
        error: "Invalid product image URL or AWS S3 not configured",
        message: "Product images must be uploaded to AWS S3" 
      });
    } catch (error) {
      console.error("Error setting product image:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get hero slides
  app.get('/api/hero-slides', async (req, res) => {
    try {
      const slides = await storage.getHeroSlides();
      res.json(slides);
    } catch (error) {
      console.error("Error fetching hero slides:", error);
      res.status(500).json({ message: "Failed to fetch hero slides" });
    }
  });

  // Create hero slide
  app.post('/api/hero-slides', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (!user.role?.includes('admin') && user.role !== 'website_manager')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const slideData = insertHeroSliderSchema.parse(req.body);
      const slide = await storage.createHeroSlide(slideData);
      res.json(slide);
    } catch (error) {
      console.error("Error creating hero slide:", error);
      res.status(500).json({ message: "Failed to create hero slide" });
    }
  });

  // Update hero slide
  app.put('/api/hero-slides/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (!user.role?.includes('admin') && user.role !== 'website_manager')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const { id } = req.params;
      const slideData = req.body;
      const slide = await storage.updateHeroSlide(parseInt(id), slideData);
      res.json(slide);
    } catch (error) {
      console.error("Error updating hero slide:", error);
      res.status(500).json({ message: "Failed to update hero slide" });
    }
  });

  // Delete hero slide
  app.delete('/api/hero-slides/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (!user.role?.includes('admin') && user.role !== 'website_manager')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const { id } = req.params;
      await storage.deleteHeroSlide(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting hero slide:", error);
      res.status(500).json({ message: "Failed to delete hero slide" });
    }
  });



  // Get product documents
  app.get('/api/products/:id/documents', async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const documents = await storage.getProductDocuments(productId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  // Get frequently bought together products
  app.get('/api/products/:id/frequently-bought-together', async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const limit = parseInt(req.query.limit as string) || 8;
      const relatedProducts = await storage.getFrequentlyBoughtTogether(productId, limit);
      res.json(relatedProducts);
    } catch (error) {
      console.error("Error fetching frequently bought together products:", error);
      res.status(500).json({ message: "Failed to fetch related products" });
    }
  });

  // Get similar/related products
  app.get('/api/products/:id/similar', async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const limit = parseInt(req.query.limit as string) || 8;
      const similarProducts = await storage.getSimilarProducts(productId, limit);
      res.json(similarProducts);
    } catch (error) {
      console.error("Error fetching similar products:", error);
      res.status(500).json({ message: "Failed to fetch similar products" });
    }
  });

  // Protected API routes (authentication required)

  // Create inquiry (allow both admin and customer creation)
  app.post('/api/inquiries', async (req: any, res) => {
    try {
      console.log('[INQUIRY DEBUG] Request body:', JSON.stringify(req.body, null, 2));
      
      let customerId = null;
      
      // Check if admin user is authenticated
      if (req.user && req.user.claims && req.user.claims.sub) {
        customerId = req.user.claims.sub;
      }
      // For customer users, customerId should be sent from frontend
      else if (req.body.customerId) {
        customerId = req.body.customerId;
      }
      
      console.log('[INQUIRY DEBUG] Customer ID:', customerId);
      
      const inquiryData = insertInquirySchema.parse({ ...req.body, customerId });
      
      const inquiry = await storage.createInquiry(inquiryData);
      
      // Create notification for admins and sales managers about new enquiry or high volume bid
      try {
        const productName = req.body.productName || 'Unknown Product';
        const companyName = req.body.companyName || req.body.customerName || 'Unknown';
        const isHighVolumeBid = req.body.inquiryType === 'high_volume_bid';
        
        await storage.createNotificationsForRole({
          type: isHighVolumeBid ? 'new_high_volume_bid' : 'new_enquiry',
          title: isHighVolumeBid ? 'New High Volume Bid' : 'New Enquiry Received',
          message: isHighVolumeBid 
            ? `New high volume bid for "${productName}" from ${companyName}` 
            : `New enquiry for "${productName}" from ${companyName}`,
          entityType: 'inquiry',
          entityId: inquiry.id,
          isRead: false,
          link: isHighVolumeBid ? '/admin/sales/high-volume-bids' : '/admin/sales/inquiries',
        }, ['super_admin', 'admin', 'sales_manager']);
      } catch (notifError) {
        console.error('Failed to create notification for enquiry:', notifError);
      }
      
      res.status(201).json(inquiry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('[INQUIRY DEBUG] Validation errors:', JSON.stringify(error.errors, null, 2));
        return res.status(400).json({ message: "Invalid inquiry data", errors: error.errors });
      }
      console.error("Error creating inquiry:", error);
      res.status(500).json({ message: "Failed to create inquiry" });
    }
  });

  // Get user's inquiries
  app.get('/api/inquiries', isAuthenticated, async (req: any, res) => {
    try {
      console.log('Admin inquiries request - User:', req.user);
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      console.log('Found user:', user);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { status, limit = '50', offset = '0' } = req.query;
      
      const filters: any = {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      };

      // Role-based filtering
      if (user.role === 'customer') {
        filters.customerId = userId;
      } else if (user.role === 'admin' || user.role === 'super_admin') {
        // Admin users see all inquiries - no filtering
      } else if (user.role?.includes('sales')) {
        filters.assignedTo = userId;
      }

      if (status && status !== 'all') {
        filters.status = status as string;
      }

      console.log('Using filters:', filters);
      const result = await storage.getInquiries(filters);
      console.log('Inquiry results:', result);
      res.json(result);
    } catch (error) {
      console.error("Error fetching inquiries:", error);
      res.status(500).json({ message: "Failed to fetch inquiries" });
    }
  });

  // Customer-specific endpoints (no auth required, customer ID from request body)
  app.get('/api/customer/inquiries/:customerId', async (req: any, res) => {
    try {
      const customerId = req.params.customerId;
      const { status, limit = '50', offset = '0' } = req.query;
      
      const filters: any = {
        customerId,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      };

      if (status) {
        filters.status = status as string;
      }

      const result = await storage.getInquiries(filters);
      res.json(result);
    } catch (error) {
      console.error("Error fetching customer inquiries:", error);
      res.status(500).json({ message: "Failed to fetch inquiries" });
    }
  });

  app.get('/api/customer/sample-requests/:customerId', async (req: any, res) => {
    try {
      const customerId = req.params.customerId;
      const { status, limit = '50', offset = '0' } = req.query;
      
      const filters: any = {
        customerId,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      };

      if (status) {
        filters.status = status as string;
      }

      const result = await storage.getSampleRequests(filters);
      res.json(result);
    } catch (error) {
      console.error("Error fetching customer sample requests:", error);
      res.status(500).json({ message: "Failed to fetch sample requests" });
    }
  });

  app.get('/api/customer/quotations/:customerId', async (req: any, res) => {
    try {
      const customerId = req.params.customerId;
      const { status, limit = '50', offset = '0' } = req.query;
      
      const filters: any = {
        customerId,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      };

      if (status) {
        filters.status = status as string;
      }

      const result = await storage.getQuotations(filters);
      res.json(result);
    } catch (error) {
      console.error("Error fetching customer quotations:", error);
      res.status(500).json({ message: "Failed to fetch quotations" });
    }
  });

  // Bid Revision API endpoints
  app.get('/api/bid-revisions/:inquiryId', isAuthenticated, async (req: any, res) => {
    try {
      const inquiryId = parseInt(req.params.inquiryId);
      const revisions = await storage.getBidRevisions(inquiryId);
      res.json(revisions);
    } catch (error) {
      console.error("Error fetching bid revisions:", error);
      res.status(500).json({ message: "Failed to fetch bid revisions" });
    }
  });

  app.post('/api/bid-revisions/:revisionId/respond', isAuthenticated, async (req: any, res) => {
    try {
      const revisionId = parseInt(req.params.revisionId);
      const customerId = req.user.claims.sub;
      const { status, responseNotes } = req.body;

      if (status !== 'accepted' && status !== 'rejected') {
        return res.status(400).json({ message: "Invalid status. Must be 'accepted' or 'rejected'" });
      }

      const updatedRevision = await storage.respondToBidRevision(
        revisionId,
        customerId,
        { status, responseNotes }
      );

      res.json(updatedRevision);
    } catch (error) {
      console.error("Error responding to bid revision:", error);
      res.status(500).json({ message: "Failed to respond to bid revision" });
    }
  });

  // Customer endpoint for responding to bid revisions (accept/reject)
  app.post('/api/customer/bid-revisions/:customerId/:revisionId/respond', async (req: any, res) => {
    try {
      const revisionId = parseInt(req.params.revisionId);
      const customerId = req.params.customerId;
      const { status, responseNotes } = req.body;

      if (status !== 'accepted' && status !== 'rejected') {
        return res.status(400).json({ message: "Invalid status. Must be 'accepted' or 'rejected'" });
      }

      // Verify the revision belongs to this customer's inquiry
      const revision = await storage.getBidRevisionById(revisionId);
      if (!revision) {
        return res.status(404).json({ message: "Bid revision not found" });
      }

      // Get the inquiry to verify ownership
      const inquiry = await storage.getInquiry(revision.inquiryId);
      if (!inquiry || inquiry.customerId !== customerId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updatedRevision = await storage.respondToBidRevision(
        revisionId,
        customerId,
        { status, responseNotes }
      );

      res.json(updatedRevision);
    } catch (error) {
      console.error("Error responding to bid revision:", error);
      res.status(500).json({ message: "Failed to respond to bid revision" });
    }
  });

  // Update inquiry (for sales team)
  app.put('/api/inquiries/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (!user.role?.includes('sales') && !user.role?.includes('admin'))) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const inquiryId = parseInt(req.params.id);
      const updateData = req.body;
      
      const inquiry = await storage.updateInquiry(inquiryId, updateData);
      res.json(inquiry);
    } catch (error) {
      console.error("Error updating inquiry:", error);
      res.status(500).json({ message: "Failed to update inquiry" });
    }
  });

  // High Volume Bids routes
  app.get('/api/admin/high-volume-bids', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (!user.role?.includes('admin') && !user.role?.includes('sales_manager'))) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const { bidStatus, limit = '50', offset = '0' } = req.query;
      
      const filters: any = {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      };

      if (bidStatus) {
        filters.bidStatus = bidStatus as string;
      }

      const result = await storage.getHighVolumeBids(filters);
      res.json(result);
    } catch (error) {
      console.error("Error fetching high volume bids:", error);
      res.status(500).json({ message: "Failed to fetch high volume bids" });
    }
  });

  app.post('/api/admin/high-volume-bids/:id/approve', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (!user.role?.includes('admin') && !user.role?.includes('sales_manager'))) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const bidId = parseInt(req.params.id);
      const { approvalNotes, assignedSalesRep } = req.body;
      
      // Determine the sales rep to assign (use provided or default to current user)
      const targetSalesRep = assignedSalesRep || userId;

      // Get the bid with product and customer details first
      const bidDetails = await storage.getInquiry(bidId);
      if (!bidDetails) {
        return res.status(404).json({ message: "Bid not found" });
      }

      // Validate bid status before approval
      const currentBidStatus = bidDetails.bidStatus || 'pending';
      
      // Check if a revised price is awaiting customer response
      if (currentBidStatus === 'rev_proposed') {
        return res.status(400).json({ 
          message: "Cannot approve bid while waiting for customer response on revised price. Customer must accept or reject the offer first." 
        });
      }

      // Check if customer rejected the revised price
      if (currentBidStatus === 'customer_rejected') {
        return res.status(400).json({ 
          message: "Customer rejected the revised price. Please submit a new revised quote or reject the bid." 
        });
      }

      // Only allow approval for pending (direct approval) or customer_accepted statuses
      if (currentBidStatus !== 'pending' && currentBidStatus !== 'customer_accepted') {
        return res.status(400).json({ 
          message: `Cannot approve bid with status '${currentBidStatus}'. Bid must be 'pending' or 'customer_accepted'.` 
        });
      }

      // Update bid status to approved
      const bid = await storage.updateHighVolumeBidStatus(bidId, 'approved', userId, approvalNotes);

      // Step 1: Find or create company record
      const companyName = bidDetails.companyName || 'Unknown Company';
      let company = await db.select().from(companies)
        .where(eq(companies.companyName, companyName))
        .limit(1);
      
      let companyId: number;
      if (company.length === 0) {
        // Create new company
        const [newCompany] = await db.insert(companies)
          .values({
            companyName,
            primaryEmail: bidDetails.emailAddress,
            primaryPhone: bidDetails.phoneNumber,
            dataCompleteness: 'partial',
            needsEnrichment: true,
            assignedTo: userId,
            createdBy: userId,
          })
          .returning();
        companyId = newCompany.id;
      } else {
        companyId = company[0].id;
      }

      // Step 2: Find or create contact person record (optional)
      const contactName = bidDetails.contactName;
      let contactPersonId: number | null = null;
      if (contactName) {
        let contact = await db.select().from(companyContacts)
          .where(and(
            eq(companyContacts.companyId, companyId),
            eq(companyContacts.contactName, contactName)
          ))
          .limit(1);
        
        if (contact.length === 0) {
          // Create new contact
          const [newContact] = await db.insert(companyContacts)
            .values({
              companyId,
              contactName: contactName,
              email: bidDetails.emailAddress,
              phone: bidDetails.phoneNumber,
              isPrimary: true,
            })
            .returning();
          contactPersonId = newContact.id;
        } else {
          contactPersonId = contact[0].id;
        }
      }

      // Step 3: Create CRM lead with proper foreign keys
      // Calculate expected order value: quantity * target price
      const quantity = bidDetails.quantity ? parseFloat(bidDetails.quantity.toString()) : 0;
      const targetPrice = bidDetails.targetPrice ? parseFloat(bidDetails.targetPrice.toString()) : 0;
      const expectedOrderValue = quantity * targetPrice;

      const leadData: any = {
        companyId,
        contactPersonId: contactPersonId || null,
        leadSource: 'high_volume_bid',
        priority: 'hot',
        currentStage: 'quotation_sent',
        status: 'active',
        productsInterested: bidDetails.productId ? [bidDetails.productId.toString()] : [],
        requiredQuantity: bidDetails.quantity ? bidDetails.quantity.toString() : null,
        unit: bidDetails.unit || null,
        expectedOrderValue: expectedOrderValue > 0 ? expectedOrderValue.toString() : null,
        currency: 'USD',
        specialRequirements: `High Volume Bid #${bidDetails.inquiryId} approved\n\nProduct: ${bidDetails.productId || 'N/A'}\nQuantity: ${bidDetails.quantity || 'N/A'} ${bidDetails.unit || ''}\nTarget Price: $${bidDetails.targetPrice || 'N/A'}\nExpected Order Value: $${expectedOrderValue.toFixed(2)}\n\nOriginal Message: ${bidDetails.message || 'N/A'}\n\nApproval Notes: ${approvalNotes || 'N/A'}`,
        assignedSalesRep: targetSalesRep,
        assignedBy: userId,
        assignedAt: new Date(),
        stageEnteredAt: new Date(),
        assignmentMode: 'manual',
        isManualLead: false,
        createdBy: userId,
      };

      const lead = await storage.createLead(leadData);

      // Link the lead to the bid
      await db
        .update(inquiries)
        .set({ crmLeadId: lead.id })
        .where(eq(inquiries.id, bidId));

      // Create activity for bid approval
      const activityDescription = currentBidStatus === 'customer_accepted'
        ? `High Volume Bid #${bidDetails.inquiryId} has been approved and converted to lead after customer accepted revised price.\n\nProduct: ${bidDetails.productName || 'N/A'}\nQuantity: ${bidDetails.quantity || 'N/A'} ${bidDetails.unit || ''}\nTarget Price: ${bidDetails.targetPrice || 'N/A'}\nExpected Order Value: ${expectedOrderValue.toFixed(2)}\n\nApproval Notes: ${approvalNotes || 'No additional notes'}\n\nBid Status: Approved (Customer Accepted Revised Price)`
        : `High Volume Bid #${bidDetails.inquiryId} has been directly approved and converted to lead.\n\nProduct: ${bidDetails.productName || 'N/A'}\nQuantity: ${bidDetails.quantity || 'N/A'} ${bidDetails.unit || ''}\nTarget Price: ${bidDetails.targetPrice || 'N/A'}\nExpected Order Value: ${expectedOrderValue.toFixed(2)}\n\nApproval Notes: ${approvalNotes || 'No additional notes'}\n\nBid Status: Approved (Direct Approval)`;

      await storage.createLeadActivity({
        leadId: lead.id,
        activityType: 'approval',
        activityDate: new Date(),
        subject: currentBidStatus === 'customer_accepted' 
          ? 'High Volume Bid Approved - Customer Accepted' 
          : 'High Volume Bid Approved',
        description: activityDescription,
        outcome: 'completed',
        createdBy: userId,
      });

      res.json({ bid, lead });
    } catch (error) {
      console.error("Error approving high volume bid:", error);
      res.status(500).json({ message: "Failed to approve bid" });
    }
  });

  app.post('/api/admin/high-volume-bids/:id/reject', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (!user.role?.includes('admin') && !user.role?.includes('sales_manager'))) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const bidId = parseInt(req.params.id);
      const { approvalNotes } = req.body;

      const bid = await storage.updateHighVolumeBidStatus(bidId, 'rejected', userId, approvalNotes);

      res.json(bid);
    } catch (error) {
      console.error("Error rejecting high volume bid:", error);
      res.status(500).json({ message: "Failed to reject bid" });
    }
  });

  // Convert Product Enquiry to CRM Lead
  app.post('/api/admin/inquiries/:id/convert-to-lead', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (!user.role?.includes('admin') && !user.role?.includes('sales_manager') && !user.role?.includes('sales_executive'))) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const inquiryId = parseInt(req.params.id);
      const { notes } = req.body;

      // Get the inquiry with product and customer details
      const inquiryDetails = await storage.getInquiry(inquiryId);
      if (!inquiryDetails) {
        return res.status(404).json({ message: "Inquiry not found" });
      }

      // Exclude high volume bids (they have their own conversion endpoint)
      if (inquiryDetails.inquiryType === 'high_volume_bid') {
        return res.status(400).json({ message: "High volume bids cannot be converted using this endpoint. Use the high volume bid approval flow instead." });
      }

      // Check if already converted to lead
      if (inquiryDetails.crmLeadId) {
        return res.status(400).json({ message: "This inquiry has already been converted to a lead", leadId: inquiryDetails.crmLeadId });
      }

      // Step 1: Find or create company record
      const companyName = inquiryDetails.companyName || 'Unknown Company';
      let company = await db.select().from(companies)
        .where(eq(companies.companyName, companyName))
        .limit(1);
      
      let companyId: number;
      if (company.length === 0) {
        // Create new company
        const [newCompany] = await db.insert(companies)
          .values({
            companyName,
            primaryEmail: inquiryDetails.emailAddress,
            primaryPhone: inquiryDetails.phoneNumber,
            dataCompleteness: 'partial',
            needsEnrichment: true,
            assignedTo: userId,
            createdBy: userId,
          })
          .returning();
        companyId = newCompany.id;
      } else {
        companyId = company[0].id;
      }

      // Step 2: Find or create contact person record
      const contactName = inquiryDetails.contactName;
      let contactPersonId: number | null = null;
      if (contactName) {
        let contact = await db.select().from(companyContacts)
          .where(and(
            eq(companyContacts.companyId, companyId),
            eq(companyContacts.contactName, contactName)
          ))
          .limit(1);
        
        if (contact.length === 0) {
          // Create new contact
          const [newContact] = await db.insert(companyContacts)
            .values({
              companyId,
              contactName: contactName,
              email: inquiryDetails.emailAddress,
              phone: inquiryDetails.phoneNumber,
              isPrimary: true,
            })
            .returning();
          contactPersonId = newContact.id;
        } else {
          contactPersonId = contact[0].id;
        }
      }

      // Step 3: Fetch quotation for this inquiry if exists
      const quotationResult = await db.select().from(quotations)
        .where(eq(quotations.inquiryId, inquiryId))
        .limit(1);
      
      let expectedOrderValue: string | null = null;
      let currentStage = 'initial_contact';
      let quotationInfo = '';
      
      if (quotationResult.length > 0) {
        const quotation = quotationResult[0];
        expectedOrderValue = quotation.totalAmount || null;
        currentStage = 'quotation_sent';
        quotationInfo = `\n\nQuotation Details:\nQuotation ID: ${quotation.quotationId}\nTotal Amount: ${quotation.currency} ${quotation.totalAmount}\nStatus: ${quotation.status}`;
      }
      
      // Step 4: Create CRM lead with proper foreign keys and quotation data
      const leadData: any = {
        companyId,
        contactPersonId: contactPersonId || null,
        leadSource: 'product_inquiry',
        priority: 'warm',
        currentStage: currentStage,
        status: 'active',
        productsInterested: inquiryDetails.productId ? [inquiryDetails.productId] : [],
        requiredQuantity: inquiryDetails.quantity ? inquiryDetails.quantity.toString() : null,
        unit: inquiryDetails.unit || null,
        expectedOrderValue: expectedOrderValue,
        currency: quotationResult.length > 0 ? quotationResult[0].currency : 'USD',
        specialRequirements: `Product Inquiry #${inquiryDetails.inquiryId} converted to lead\n\nProduct: ${inquiryDetails.productId || 'N/A'}\nQuantity: ${inquiryDetails.quantity || 'N/A'} ${inquiryDetails.unit || ''}${quotationInfo}\n\nOriginal Message: ${inquiryDetails.message || 'N/A'}\n\nConversion Notes: ${notes || 'N/A'}`,
        assignedSalesRep: userId,
        assignedBy: userId,
        assignedAt: new Date(),
        stageEnteredAt: new Date(),
        assignmentMode: 'manual',
        isManualLead: false,
        createdBy: userId,
      };

      const lead = await storage.createLead(leadData);

      // Link the lead to the inquiry
      await db
        .update(inquiries)
        .set({ crmLeadId: lead.id })
        .where(eq(inquiries.id, inquiryId));

      res.json({ inquiry: inquiryDetails, lead, message: "Product inquiry successfully converted to CRM lead" });
    } catch (error) {
      console.error("Error converting inquiry to lead:", error);
      res.status(500).json({ message: "Failed to convert inquiry to lead" });
    }
  });

  // Sample Request routes

  // Create sample request (for both logged in and non-logged users)
  app.post('/api/sample-requests', async (req: any, res) => {
    try {
      let customerId = null;
      
      // Check if admin user is authenticated
      if (req.user && req.user.claims && req.user.claims.sub) {
        customerId = req.user.claims.sub;
      }
      // For customer users, customerId should be sent from frontend
      else if (req.body.customerId) {
        customerId = req.body.customerId;
      }
      
      const requestData = insertSampleRequestSchema.parse({ 
        ...req.body, 
        customerId 
      });
      
      const sampleRequest = await storage.createSampleRequest(requestData);
      
      // Create notification for admins and sales managers about new sample request
      try {
        const productName = req.body.productName || 'Unknown Product';
        const companyName = req.body.companyName || req.body.customerName || 'Unknown';
        await storage.createNotificationsForRole({
          type: 'new_sample_request',
          title: 'New Sample Request',
          message: `New sample request for "${productName}" from ${companyName}`,
          entityType: 'sample_request',
          entityId: sampleRequest.id,
          isRead: false,
          link: '/admin/sales/sample-requests',
        }, ['super_admin', 'admin', 'sales_manager']);
      } catch (notifError) {
        console.error('Failed to create notification for sample request:', notifError);
      }
      
      res.status(201).json(sampleRequest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid sample request data", errors: error.errors });
      }
      console.error("Error creating sample request:", error);
      res.status(500).json({ message: "Failed to create sample request" });
    }
  });

  // Get sample requests (admin/sales only)
  app.get('/api/sample-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (!user.role?.includes('admin') && !user.role?.includes('sales') && user.role !== 'website_manager')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const { status, limit = '50', offset = '0' } = req.query;
      
      const filters: any = {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      };

      // Role-based filtering
      if (user.role?.includes('sales') && !user.role?.includes('admin')) {
        filters.assignedTo = userId;
      }

      if (status) {
        filters.status = status as string;
      }

      const result = await storage.getSampleRequests(filters);
      res.json(result);
    } catch (error) {
      console.error("Error fetching sample requests:", error);
      res.status(500).json({ message: "Failed to fetch sample requests" });
    }
  });

  // Update sample request (for admin/sales team)
  app.put('/api/sample-requests/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (!user.role?.includes('admin') && !user.role?.includes('sales') && user.role !== 'website_manager')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const requestId = parseInt(req.params.id);
      const updateData = {
        ...req.body,
        updatedAt: new Date(),
      };
      
      // If status is being changed, add processing metadata
      if (req.body.status && ['approved', 'rejected', 'shipped', 'completed'].includes(req.body.status)) {
        updateData.processedBy = userId;
        updateData.processedAt = new Date();
      }
      
      const sampleRequest = await storage.updateSampleRequest(requestId, updateData);
      res.json(sampleRequest);
    } catch (error) {
      console.error("Error updating sample request:", error);
      res.status(500).json({ message: "Failed to update sample request" });
    }
  });

  // Customer marks sample request as delivered
  app.patch('/api/customer/sample-requests/:customerId/:requestId/delivered', async (req: any, res) => {
    try {
      const customerId = req.params.customerId;
      const requestId = parseInt(req.params.requestId);
      
      // Get the sample request
      const filters = { limit: 1000, offset: 0, customerId };
      const result = await storage.getSampleRequests(filters);
      const sampleRequest = result.requests.find((r: any) => r.id === requestId);
      
      if (!sampleRequest || sampleRequest.customerId !== customerId) {
        return res.status(404).json({ message: "Sample request not found" });
      }
      
      // Only allow marking as delivered if status is "shipped"
      if (sampleRequest.status !== 'shipped') {
        return res.status(400).json({ message: "Sample request must be in shipped status to mark as delivered" });
      }
      
      const updateData = {
        status: 'completed',
        updatedAt: new Date(),
        processedAt: new Date()
      };
      
      const updatedRequest = await storage.updateSampleRequest(requestId, updateData);
      res.json(updatedRequest);
    } catch (error) {
      console.error("Error marking sample as delivered:", error);
      res.status(500).json({ message: "Failed to mark sample as delivered" });
    }
  });

  // Enhanced inquiry creation - allow both logged in and non-logged users
  app.post('/api/inquiries-enhanced', async (req: any, res) => {
    try {
      let customerId = null;
      
      // Check if user is authenticated
      if (req.user && req.user.claims && req.user.claims.sub) {
        customerId = req.user.claims.sub;
      }
      
      const inquiryData = insertInquirySchema.parse({ 
        ...req.body, 
        customerId 
      });
      
      const inquiry = await storage.createInquiry(inquiryData);
      res.status(201).json(inquiry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid inquiry data", errors: error.errors });
      }
      console.error("Error creating inquiry:", error);
      res.status(500).json({ message: "Failed to create inquiry" });
    }
  });

  // Get quotations
  app.get('/api/quotations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { status, limit = '50', offset = '0' } = req.query;
      
      const filters: any = {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      };

      // Role-based filtering
      if (user.role === 'customer') {
        filters.customerId = userId;
      }

      if (status) {
        filters.status = status as string;
      }

      const result = await storage.getQuotations(filters);
      res.json(result);
    } catch (error) {
      console.error("Error fetching quotations:", error);
      res.status(500).json({ message: "Failed to fetch quotations" });
    }
  });

  // Create quotation (for sales team)
  app.post('/api/quotations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (!user.role?.includes('sales') && !user.role?.includes('admin'))) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      console.log("Received quotation data:", req.body);
      
      // Extract items array before parsing (it's not part of quotations table schema)
      const items = req.body.items || [];
      
      // Convert string date to Date object if needed
      const processedData = {
        ...req.body,
        createdBy: userId,
        validUntil: typeof req.body.validUntil === 'string' ? new Date(req.body.validUntil) : req.body.validUntil
      };
      
      // Remove items from processedData before parsing (they go in separate table)
      delete processedData.items;
      
      const quotationData = insertQuotationSchema.parse(processedData);
      console.log("Parsed quotation data:", quotationData);
      console.log("Quotation items count:", items.length);
      
      const quotation = await storage.createQuotation(quotationData);
      
      // Create quotation items if provided
      if (items.length > 0) {
        for (const item of items) {
          await db.insert(quotationItems).values({
            quotationId: quotation.id,
            productId: item.productId,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            specifications: item.specifications || null
          });
        }
        console.log(`Created ${items.length} quotation items for quotation ${quotation.id}`);
      }
      
      // Update the inquiry status to "responded" when quotation is created
      if (quotation.inquiryId) {
        await storage.updateInquiry(quotation.inquiryId, { 
          status: 'responded',
          assignedTo: userId 
        });
      }
      
      res.status(201).json(quotation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Zod validation errors:", error.errors);
        return res.status(400).json({ message: "Invalid quotation data", errors: error.errors });
      }
      console.error("Error creating quotation:", error);
      res.status(500).json({ message: "Failed to create quotation" });
    }
  });

  // Get quotations for a specific inquiry
  app.get('/api/inquiries/:id/quotations', async (req: any, res) => {
    try {
      const inquiryId = parseInt(req.params.id);
      
      const result = await storage.getQuotations({
        inquiryId,
        limit: 10,
        offset: 0
      });
      
      res.json(result);
    } catch (error) {
      console.error("Error fetching inquiry quotations:", error);
      res.status(500).json({ message: "Failed to fetch quotations" });
    }
  });

  // Accept quotation (for customers)
  app.patch('/api/quotations/:id/accept', async (req: any, res) => {
    try {
      const quotationId = parseInt(req.params.id);
      const quotation = await storage.updateQuotation(quotationId, { 
        status: 'accepted'
      });
      
      // If this quotation is linked to a high volume bid, update the bid status
      if (quotation.inquiryId) {
        const inquiry = await storage.getInquiry(quotation.inquiryId);
        if (inquiry && inquiry.inquiryType === 'high_volume_bid') {
          await storage.updateInquiry(quotation.inquiryId, {
            bidStatus: 'customer_accepted'
          });
        }
      }
      
      res.json(quotation);
    } catch (error) {
      console.error("Error accepting quotation:", error);
      res.status(500).json({ message: "Failed to accept quotation" });
    }
  });

  // Convert accepted quotation to CRM lead (for admins)
  app.post('/api/quotations/:id/convert-to-lead', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (!user.role?.includes('admin') && !user.role?.includes('sales_manager'))) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const quotationId = parseInt(req.params.id);
      
      // Get quotation details
      const quotationsResult = await storage.getQuotations({ limit: 1000, offset: 0 });
      const quotation = quotationsResult.quotations.find(q => q.id === quotationId);
      
      if (!quotation) {
        return res.status(404).json({ message: "Quotation not found" });
      }

      if (quotation.status !== 'accepted') {
        return res.status(400).json({ message: "Only accepted quotations can be converted to leads" });
      }

      // Check if lead already exists for this quotation
      const existingLeadCheck = await db.select().from(inquiries)
        .where(and(
          eq(inquiries.id, quotation.inquiryId),
          isNotNull(inquiries.crmLeadId)
        ))
        .limit(1);
      
      if (existingLeadCheck.length > 0) {
        return res.status(400).json({ message: "Lead already exists for this quotation" });
      }

      // Get inquiry details for the quotation
      const inquiry = await storage.getInquiry(quotation.inquiryId);
      if (!inquiry) {
        return res.status(404).json({ message: "Related inquiry not found" });
      }

      // Step 1: Find or create company record
      const companyName = inquiry.companyName || 'Unknown Company';
      let company = await db.select().from(companies)
        .where(eq(companies.companyName, companyName))
        .limit(1);
      
      let companyId: number;
      if (company.length === 0) {
        // Create new company
        const [newCompany] = await db.insert(companies)
          .values({
            companyName,
            primaryEmail: inquiry.emailAddress,
            primaryPhone: inquiry.phoneNumber,
            dataCompleteness: 'partial',
            needsEnrichment: true,
            assignedTo: userId,
            createdBy: userId,
          })
          .returning();
        companyId = newCompany.id;
      } else {
        companyId = company[0].id;
      }

      // Step 2: Find or create contact person record (optional)
      const contactName = inquiry.contactName;
      let contactPersonId: number | null = null;
      if (contactName) {
        let contact = await db.select().from(companyContacts)
          .where(and(
            eq(companyContacts.companyId, companyId),
            eq(companyContacts.contactName, contactName)
          ))
          .limit(1);
        
        if (contact.length === 0) {
          // Create new contact
          const [newContact] = await db.insert(companyContacts)
            .values({
              companyId,
              contactName: contactName,
              email: inquiry.emailAddress,
              phone: inquiry.phoneNumber,
              isPrimary: true,
            })
            .returning();
          contactPersonId = newContact.id;
        } else {
          contactPersonId = contact[0].id;
        }
      }

      // Step 3: Create CRM lead with proper foreign keys
      const leadData: any = {
        companyId,
        contactPersonId: contactPersonId || null,
        leadSource: 'accepted_quotation',
        priority: 'hot',
        currentStage: 'quotation_sent',
        status: 'active',
        productsInterested: inquiry.productId ? [inquiry.productId.toString()] : [],
        requiredQuantity: quotation.quantity ? quotation.quantity.toString() : null,
        unit: quotation.unit || null,
        expectedOrderValue: quotation.totalAmount ? quotation.totalAmount.toString() : null,
        currency: 'USD',
        specialRequirements: `Quotation #${quotation.quotationId} accepted by customer\n\nProduct: ${inquiry.productId || 'N/A'}\nQuantity: ${quotation.quantity || 'N/A'} ${quotation.unit || ''}\nUnit Price: $${quotation.unitPrice || 'N/A'}\nTotal Amount: $${quotation.totalAmount || 'N/A'}\n\nOriginal Message: ${inquiry.message || 'N/A'}`,
        assignedSalesRep: userId,
        assignedBy: userId,
        assignedAt: new Date(),
        stageEnteredAt: new Date(),
        assignmentMode: 'manual',
        isManualLead: false,
        createdBy: userId,
      };

      const lead = await storage.createLead(leadData);

      // Link the lead to the inquiry
      await db
        .update(inquiries)
        .set({ crmLeadId: lead.id })
        .where(eq(inquiries.id, quotation.inquiryId));

      res.json({ lead, message: "Quotation successfully converted to CRM lead" });
    } catch (error) {
      console.error("Error converting quotation to lead:", error);
      res.status(500).json({ message: "Failed to convert quotation to lead" });
    }
  });

  // Counter-offer on quotation (for customers - follows customer endpoint pattern)
  app.post('/api/quotations/:customerId/:id/counter-offer', async (req: any, res) => {
    try {
      const customerId = req.params.customerId;
      const quotationId = parseInt(req.params.id);
      const { counterPrice, notes } = req.body;

      // Validate input types
      if (!counterPrice || typeof counterPrice !== 'number' || counterPrice <= 0) {
        return res.status(400).json({ message: "Valid counter price is required" });
      }

      // Storage method will verify the quotation belongs to this customer
      const quotation = await storage.submitCounterOffer(quotationId, customerId, counterPrice, notes || '');
      res.json(quotation);
    } catch (error: any) {
      console.error("Error submitting counter-offer:", error);
      // Return specific error messages from storage (e.g., "Unauthorized")
      res.status(error.message.includes('Unauthorized') ? 403 : 500).json({ 
        message: error.message || "Failed to submit counter-offer" 
      });
    }
  });

  // Revise quotation (for admins)
  app.post('/api/quotations/:id/revise', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (!user.role?.includes('sales') && !user.role?.includes('admin'))) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const quotationId = parseInt(req.params.id);
      const { newPrice, notes } = req.body;

      if (!newPrice) {
        return res.status(400).json({ message: "New price is required" });
      }

      const quotation = await storage.reviseQuotation(quotationId, userId, newPrice, notes || '');
      res.json(quotation);
    } catch (error: any) {
      console.error("Error revising quotation:", error);
      res.status(500).json({ message: error.message || "Failed to revise quotation" });
    }
  });

  // Approve high volume bid (for managers)
  app.patch('/api/inquiries/:id/approve', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (!user.role?.includes('admin') && user.role !== 'super_admin' && user.role !== 'sales_manager')) {
        return res.status(403).json({ message: "Insufficient permissions - requires manager approval" });
      }

      const inquiryId = parseInt(req.params.id);
      const { approvalNotes } = req.body;

      const inquiry = await storage.approveHighVolumeBid(inquiryId, userId, approvalNotes || '');
      res.json(inquiry);
    } catch (error: any) {
      console.error("Error approving bid:", error);
      res.status(500).json({ message: error.message || "Failed to approve bid" });
    }
  });

  // Update discussion notes (for admins/sales)
  app.patch('/api/inquiries/:id/discussion-notes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (!user.role?.includes('admin') && !user.role?.includes('sales'))) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const inquiryId = parseInt(req.params.id);
      const { notes, revisedPrice, currency } = req.body;

      if (notes === undefined) {
        return res.status(400).json({ message: "Discussion notes are required" });
      }

      const inquiry = await storage.updateDiscussionNotes(inquiryId, notes, revisedPrice, currency, userId);
      res.json(inquiry);
    } catch (error: any) {
      console.error("Error updating discussion notes:", error);
      res.status(500).json({ message: error.message || "Failed to update discussion notes" });
    }
  });

  // Generate PDF for quotation
  app.get('/api/quotations/:id/pdf', async (req: any, res) => {
    try {
      const quotationId = parseInt(req.params.id);
      
      // Get quotation with product details
      const result = await storage.getQuotations({ 
        limit: 1000, 
        offset: 0 
      });
      
      const quotation = result.quotations.find(q => q.id === quotationId);
      if (!quotation) {
        return res.status(404).json({ message: "Quotation not found" });
      }

      // Fetch quotation items
      const quotationItemsResult = await db
        .select()
        .from(quotationItems)
        .where(eq(quotationItems.quotationId, quotationId));
      
      // Use first item if exists, otherwise fall back to inquiry-derived data
      const firstItem = quotationItemsResult.length > 0 ? quotationItemsResult[0] : null;
      
      console.log(`PDF generation for quotation ${quotationId}:`, {
        hasItems: quotationItemsResult.length > 0,
        itemCount: quotationItemsResult.length,
        firstItemUnitPrice: firstItem?.unitPrice,
        firstItemQuantity: firstItem?.quantity,
        fallbackUnitPrice: quotation.unitPrice,
        fallbackQuantity: quotation.quantity
      });

      // Fetch lead data if leadId exists (needed for both customer and product info)
      let leadData: any = null;
      if (quotation.leadId) {
        leadData = await storage.getLead(quotation.leadId);
      }
      
      // Try to get customer details from users table, or fall back to lead data
      let customerData: any = null;
      
      if (quotation.customerId) {
        const customer = await storage.getUser(quotation.customerId);
        if (customer) {
          customerData = {
            name: customer.firstName && customer.lastName ? `${customer.firstName} ${customer.lastName}` : customer.email || '',
            email: customer.email || '',
            companyName: customer.companyName || '',
            phone: customer.phoneNumber || '',
            address: customer.address || '',
            city: '',
            state: '',
            country: customer.country || '',
            postalCode: '',
          };
        }
      }
      
      // If no customer found and we have lead data, use lead for customer info
      if (!customerData && leadData) {
        // Lead has nested company and contactPerson objects
        const contactName = leadData.contactPerson?.name || '';
        const companyName = leadData.company?.companyName || '';
        const contactEmail = leadData.contactPerson?.email || leadData.company?.primaryEmail || '';
        const contactPhone = leadData.contactPerson?.phone || leadData.company?.primaryPhone || '';
        const companyAddress = leadData.company?.addressStreet || '';
        const companyCity = leadData.company?.addressCity || '';
        const companyState = leadData.company?.addressState || '';
        const companyCountry = leadData.company?.addressCountry || '';
        const companyPostalCode = leadData.company?.addressZip || '';
        
        // Get sales person name from the lead's assigned sales rep
        const salesRepName = leadData.salesRep ? 
          `${leadData.salesRep.firstName || ''} ${leadData.salesRep.lastName || ''}`.trim() || leadData.salesRep.email : 
          '';
        
        customerData = {
          name: companyName, // Company name as the main name
          contactPerson: contactName, // Separate contact person field
          email: contactEmail,
          companyName: companyName,
          phone: contactPhone,
          address: companyAddress,
          city: companyCity,
          state: companyState,
          country: companyCountry,
          postalCode: companyPostalCode,
          salesPersonName: salesRepName,
        };
      }
      
      // Use quotation's own customer data if still not found (stored in quotation itself)
      if (!customerData) {
        customerData = {
          name: quotation.customerCompanyName || 'Customer',
          email: '',
          companyName: quotation.customerCompanyName || '',
          phone: '',
          address: quotation.customerAddress || '',
          city: quotation.customerCity || '',
          state: quotation.customerState || '',
          country: quotation.customerCountry || '',
          postalCode: quotation.customerPostalCode || '',
        };
      }
      
      // If we still don't have sales person name, try to get from quotation's createdBy
      if (!customerData.salesPersonName && quotation.createdBy) {
        const creator = await storage.getUser(quotation.createdBy);
        if (creator) {
          customerData.salesPersonName = `${creator.firstName || ''} ${creator.lastName || ''}`.trim() || creator.email;
        }
      }

      // Import PDF generator
      const { generateQuotationPDF } = await import('./pdf-generator');
      
      // Determine product data from quotation items, inquiry, or lead
      let productName = quotation.productName || 'Product';
      let quantity = firstItem?.quantity || quotation.quantity;
      let unit = firstItem?.unit || quotation.unit || 'units';
      let unitPrice = firstItem?.unitPrice || quotation.unitPrice || '0';
      
      // If no product data from items/inquiry and we have lead data, get from lead
      if ((!productName || productName === 'Product') && leadData) {
        // Try to get product name from lead's products interested
        if (leadData.productsInterested && leadData.productsInterested.length > 0) {
          // Get product names for the IDs
          const productIds = leadData.productsInterested;
          const productsResult = await db.select({ name: products.name }).from(products).where(inArray(products.id, productIds));
          productName = productsResult.map(p => p.name).join(', ') || 'Product';
        }
      }
      
      // Get quantity and unit from lead if not available
      if ((!quantity || quantity === '0' || quantity === null) && leadData) {
        quantity = leadData.requiredQuantity || '1';
        unit = leadData.unit || 'units';
      }
      
      // Calculate unit price if we have total amount and quantity but no unit price
      if ((!unitPrice || unitPrice === '0') && quotation.totalAmount && quantity) {
        const total = parseFloat(quotation.totalAmount);
        const qty = parseFloat(quantity);
        if (qty > 0) {
          unitPrice = (total / qty).toFixed(2);
        }
      }
      
      // Prepare quotation data for PDF
      const quotationData = {
        id: quotation.id,
        quotationId: quotation.quotationId,
        quotationDate: quotation.createdAt,
        validUntil: quotation.validUntil,
        productName: productName,
        quantity: quantity || '1',
        unit: unit || 'units',
        unitPrice: unitPrice || '0',
        totalAmount: quotation.totalAmount,
        currency: quotation.currency,
        terms: quotation.terms,
        notes: quotation.notes,
        paymentTerms: quotation.paymentTerms || 'As per agreement',
        deliveryTerms: quotation.deliveryTerms || quotation.priceType || 'Ex-Works',
        subtotal: quotation.subtotal,
        discountPercent: quotation.discountPercent,
        discountAmount: quotation.discountAmount,
        includeGst: quotation.includeGst,
        gstNumber: quotation.gstNumber,
        gstPercentage: quotation.gstPercentage,
        gstAmount: quotation.gstAmount,
        sellerGstin: quotation.sellerGstin,
        sellerPan: quotation.sellerPan,
        buyerGstin: quotation.buyerGstin,
        buyerPan: quotation.buyerPan,
        customerCompanyName: quotation.customerCompanyName,
        customerAddress: quotation.customerAddress,
        customerCity: quotation.customerCity,
        customerState: quotation.customerState,
        customerCountry: quotation.customerCountry,
        customerPostalCode: quotation.customerPostalCode,
        placeOfSupply: quotation.placeOfSupply,
        countryOfSupply: quotation.countryOfSupply,
      };

      // Generate PDF
      const pdfBuffer = await generateQuotationPDF(quotationData, customerData);
      
      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Quotation-${quotation.quotationId}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      
      // Send PDF
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ message: "Failed to generate PDF", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Get sales orders
  app.get('/api/sales-orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { status, limit = '50', offset = '0' } = req.query;
      
      const filters: any = {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      };

      // Role-based filtering
      if (user.role === 'customer') {
        filters.customerId = userId;
      }

      if (status) {
        filters.status = status as string;
      }

      const result = await storage.getSalesOrders(filters);
      res.json(result);
    } catch (error) {
      console.error("Error fetching sales orders:", error);
      res.status(500).json({ message: "Failed to fetch sales orders" });
    }
  });

  // Get purchase orders (for purchase team)
  app.get('/api/purchase-orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (!user.role?.includes('purchase') && !user.role?.includes('admin'))) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const { status, limit = '50', offset = '0' } = req.query;
      
      const filters: any = {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      };

      if (status) {
        filters.status = status as string;
      }

      const result = await storage.getPurchaseOrders(filters);
      res.json(result);
    } catch (error) {
      console.error("Error fetching purchase orders:", error);
      res.status(500).json({ message: "Failed to fetch purchase orders" });
    }
  });

  // Get inventory (for inventory and logistics teams)
  app.get('/api/inventory', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (!user.role?.includes('inventory') && !user.role?.includes('logistics') && !user.role?.includes('admin'))) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const { productId } = req.query;
      
      const inventory = await storage.getInventory(productId ? parseInt(productId as string) : undefined);
      res.json(inventory);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      res.status(500).json({ message: "Failed to fetch inventory" });
    }
  });

  // Dashboard analytics
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // AWS S3 Image Upload Routes

  // Upload hero slider media (images with WebP processing and videos)
  app.post('/api/admin/hero-slides/upload', isAuthenticated, webpUpload.any(), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (!user.role?.includes('admin') && user.role !== 'website_manager')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      if (!process.env.AWS_S3_BUCKET_NAME || !process.env.AWS_ACCESS_KEY_ID) {
        return res.status(503).json({ 
          error: "AWS S3 not configured for hero slider media",
          message: "Please configure AWS credentials for hero slider uploads" 
        });
      }

      const files = req.files as Express.Multer.File[];
      const uploadedFiles: { [key: string]: string } = {};
      const slideId = req.body.slideId || `temp-${Date.now()}`;

      console.log('Hero slider upload request received. Files:', files.length);

      // Process uploaded files
      for (const file of files) {
        const fieldName = file.fieldname;
        console.log(`Processing field: ${fieldName}, file: ${file.originalname}`);
        
        if (file.mimetype.startsWith('image/') && ImageProcessor.isValidImageFormat(file.mimetype)) {
          // Process images with WebP conversion
          console.log(`📸 Processing hero slider image: ${file.originalname} (${file.mimetype}, ${file.size} bytes)`);
          
          try {
            // Process image into 3 WebP sizes
            const processedImages = await imageProcessor.processProductImage(file.buffer, file.originalname);
            
            // Upload all 3 sizes to S3 under hero-slides folder
            const uploadPromises = processedImages.map(async (image) => {
              const objectKey = `hero-slides/${slideId}/${image.filename}`;
              
              const { PutObjectCommand } = await import('@aws-sdk/client-s3');
              const command = new PutObjectCommand({
                Bucket: process.env.AWS_S3_BUCKET_NAME!,
                Key: objectKey,
                Body: image.buffer,
                ContentType: 'image/webp',
                CacheControl: 'public, max-age=31536000', // 1 year cache
                ContentDisposition: 'inline',
              });

              const { s3Client } = await import('./awsS3Service');
              await s3Client.send(command);
              
              return {
                size: image.size,
                url: s3Service.getObjectURL(objectKey)
              };
            });

            const uploadedImages = await Promise.all(uploadPromises);
            
            // Use large size for hero slider
            const largeUrl = uploadedImages.find(img => img.size === 'large')?.url || 
                           uploadedImages.find(img => img.size === 'medium')?.url || 
                           uploadedImages[0]?.url;
            
            uploadedFiles[fieldName] = largeUrl;
            console.log(`✅ Successfully processed hero slider image ${file.originalname} -> ${largeUrl}`);
            
          } catch (error) {
            console.error(`❌ Failed to process hero slider image ${file.originalname}:`, error);
            // Fallback: upload original image without WebP processing
            const objectKey = `hero-slides/${slideId}/${file.originalname}-${Date.now()}`;
            const { PutObjectCommand } = await import('@aws-sdk/client-s3');
            const command = new PutObjectCommand({
              Bucket: process.env.AWS_S3_BUCKET_NAME!,
              Key: objectKey,
              Body: file.buffer,
              ContentType: file.mimetype,
            });
            
            const { s3Client } = await import('./awsS3Service');
            await s3Client.send(command);
            uploadedFiles[fieldName] = s3Service.getObjectURL(objectKey);
          }
        } else if (file.mimetype.startsWith('video/')) {
          // Process videos without conversion - upload as-is
          console.log(`🎥 Processing hero slider video: ${file.originalname} (${file.mimetype}, ${file.size} bytes)`);
          
          const objectKey = `hero-slides/${slideId}/videos/${file.originalname}-${Date.now()}`;
          const { PutObjectCommand } = await import('@aws-sdk/client-s3');
          const command = new PutObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME!,
            Key: objectKey,
            Body: file.buffer,
            ContentType: file.mimetype,
          });
          
          const { s3Client } = await import('./awsS3Service');
          await s3Client.send(command);
          uploadedFiles[fieldName] = s3Service.getObjectURL(objectKey);
          
          console.log(`✅ Successfully uploaded hero slider video ${file.originalname}`);
        } else {
          // Other file types - upload as-is
          console.log(`📄 Processing hero slider file: ${file.originalname} (${file.mimetype}, ${file.size} bytes)`);
          
          const objectKey = `hero-slides/${slideId}/${file.originalname}-${Date.now()}`;
          const { PutObjectCommand } = await import('@aws-sdk/client-s3');
          const command = new PutObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME!,
            Key: objectKey,
            Body: file.buffer,
            ContentType: file.mimetype,
          });
          
          const { s3Client } = await import('./awsS3Service');
          await s3Client.send(command);
          uploadedFiles[fieldName] = s3Service.getObjectURL(objectKey);
          
          console.log(`✅ Successfully uploaded hero slider file ${file.originalname}`);
        }
      }

      res.json({
        success: true,
        files: uploadedFiles,
        message: 'Hero slider media uploaded successfully with WebP processing for images'
      });
    } catch (error) {
      console.error("Error uploading hero slider media:", error);
      res.status(500).json({ message: "Failed to upload hero slider media", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Upload product images and documents with WebP processing for images
  app.post('/api/admin/products/upload', isAuthenticated, webpUpload.any(), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (!user.role?.includes('admin') && user.role !== 'website_manager')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      if (!process.env.AWS_S3_BUCKET_NAME || !process.env.AWS_ACCESS_KEY_ID) {
        return res.status(503).json({ 
          error: "AWS S3 not configured for product images",
          message: "Please configure AWS credentials for product image uploads" 
        });
      }

      const files = req.files as Express.Multer.File[];
      const uploadedFiles: { [key: string]: string | string[] } = {};
      const productId = req.body.productId || `temp-${Date.now()}`;

      console.log('Admin upload request received. Files:', files.length);

      // Group files by field name for proper handling
      const filesByField: { [key: string]: Express.Multer.File[] } = {};
      files.forEach(file => {
        if (!filesByField[file.fieldname]) {
          filesByField[file.fieldname] = [];
        }
        filesByField[file.fieldname].push(file);
      });

      // Process uploaded files by field
      for (const [fieldName, fileArray] of Object.entries(filesByField)) {
        console.log(`Processing field: ${fieldName}, files:`, fileArray.length);
        
        if (fieldName === 'galleryImages' || fieldName === 'additionalDocs') {
          // Multiple files
          const processedUrls: string[] = [];
          
          for (const file of fileArray) {
            if (file.mimetype.startsWith('image/') && ImageProcessor.isValidImageFormat(file.mimetype)) {
              console.log(`📸 Processing image: ${file.originalname} (${file.mimetype}, ${file.size} bytes)`);
              
              try {
                // Process image into 3 WebP sizes
                const processedImages = await imageProcessor.processProductImage(file.buffer, file.originalname);
                
                // Upload all 3 sizes to S3
                const uploadedUrls = await s3Service.uploadProductImages(processedImages, productId);
                
                // Use medium size for gallery
                processedUrls.push(uploadedUrls.medium);
                console.log(`✅ Successfully processed image ${file.originalname} -> ${uploadedUrls.medium}`);
                
              } catch (error) {
                console.error(`❌ Failed to process image ${file.originalname}:`, error);
                // Fallback: upload original image without WebP processing
                const objectKey = `products/${productId}/${file.originalname}-${Date.now()}`;
                const { PutObjectCommand } = await import('@aws-sdk/client-s3');
                const command = new PutObjectCommand({
                  Bucket: process.env.AWS_S3_BUCKET_NAME!,
                  Key: objectKey,
                  Body: file.buffer,
                  ContentType: file.mimetype,
                });
                
                const { s3Client } = await import('./awsS3Service');
                await s3Client.send(command);
                processedUrls.push(s3Service.getObjectURL(objectKey));
              }
            } else {
              // Non-image files (documents) - upload as-is
              console.log(`📄 Processing document: ${file.originalname} (${file.mimetype}, ${file.size} bytes)`);
              
              const objectKey = `products/${productId}/documents/${file.originalname}-${Date.now()}`;
              const { PutObjectCommand } = await import('@aws-sdk/client-s3');
              const command = new PutObjectCommand({
                Bucket: process.env.AWS_S3_BUCKET_NAME!,
                Key: objectKey,
                Body: file.buffer,
                ContentType: file.mimetype,
              });
              
              const { s3Client } = await import('./awsS3Service');
              await s3Client.send(command);
              processedUrls.push(s3Service.getObjectURL(objectKey));
              
              console.log(`✅ Successfully uploaded document ${file.originalname}`);
            }
          }
          
          uploadedFiles[fieldName] = processedUrls;
        } else {
          // Single file - includes secondImage, thirdImage, mainImage, documents
          const file = fileArray[0];
          if (!file) continue;
          
          if (file.mimetype.startsWith('image/') && ImageProcessor.isValidImageFormat(file.mimetype)) {
            console.log(`📸 Processing image: ${file.originalname} (${file.mimetype}, ${file.size} bytes)`);
            
            try {
              // Process image into 3 WebP sizes
              const processedImages = await imageProcessor.processProductImage(file.buffer, file.originalname);
              
              // Upload all 3 sizes to S3
              const uploadedUrls = await s3Service.uploadProductImages(processedImages, productId);
              
              // Store the medium size URL as the main URL for this field
              uploadedFiles[fieldName] = uploadedUrls.medium;
              
              console.log(`✅ Successfully processed image ${file.originalname} -> ${uploadedUrls.medium}`);
              
            } catch (error) {
              console.error(`❌ Failed to process image ${file.originalname}:`, error);
              // Fallback: upload original image without WebP processing
              const objectKey = `products/${productId}/${file.originalname}-${Date.now()}`;
              const { PutObjectCommand } = await import('@aws-sdk/client-s3');
              const command = new PutObjectCommand({
                Bucket: process.env.AWS_S3_BUCKET_NAME!,
                Key: objectKey,
                Body: file.buffer,
                ContentType: file.mimetype,
              });
              
              const { s3Client } = await import('./awsS3Service');
              await s3Client.send(command);
              uploadedFiles[fieldName] = s3Service.getObjectURL(objectKey);
            }
          } else {
            // Non-image files (documents) - upload as-is
            console.log(`📄 Processing document: ${file.originalname} (${file.mimetype}, ${file.size} bytes)`);
            
            const objectKey = `products/${productId}/documents/${file.originalname}-${Date.now()}`;
            const { PutObjectCommand } = await import('@aws-sdk/client-s3');
            const command = new PutObjectCommand({
              Bucket: process.env.AWS_S3_BUCKET_NAME!,
              Key: objectKey,
              Body: file.buffer,
              ContentType: file.mimetype,
            });
            
            const { s3Client } = await import('./awsS3Service');
            await s3Client.send(command);
            uploadedFiles[fieldName] = s3Service.getObjectURL(objectKey);
            
            console.log(`✅ Successfully uploaded document ${file.originalname}`);
          }
        }
      }

      res.json({
        success: true,
        files: uploadedFiles,
        message: 'Files uploaded successfully with WebP processing for images'
      });
    } catch (error) {
      console.error("Error uploading files:", error);
      res.status(500).json({ message: "Failed to upload files", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });



  // Generate presigned URL for direct upload (alternative method)
  app.post('/api/admin/products/presigned-url', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (!user.role?.includes('admin') && user.role !== 'website_manager')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const { filename, contentType, productId } = req.body;
      
      if (!filename || !contentType) {
        return res.status(400).json({ message: "Filename and content type are required" });
      }

      const timestamp = Date.now();
      const s3Key = `products/${productId || 'temp'}/${filename}-${timestamp}`;
      
      const presignedUrl = await generatePresignedUrl(s3Key, contentType);
      const publicUrl = getImageUrl(s3Key);

      res.json({
        presignedUrl,
        publicUrl,
        s3Key
      });
    } catch (error) {
      console.error("Error generating presigned URL:", error);
      res.status(500).json({ message: "Failed to generate presigned URL" });
    }
  });

  // Delete image from S3
  app.delete('/api/admin/products/image/:s3Key', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (!user.role?.includes('admin') && user.role !== 'website_manager')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const s3Key = decodeURIComponent(req.params.s3Key);
      await deleteFromS3(s3Key);

      res.json({ success: true, message: 'Image deleted successfully' });
    } catch (error) {
      console.error("Error deleting image from S3:", error);
      res.status(500).json({ message: "Failed to delete image" });
    }
  });

  // Admin dashboard route
  app.get("/admin/dashboard", async (req: any, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.redirect("/login");
      }

      const user = req.user;
      
      // Check if this is a local admin session
      if (user.isLocal && user.claims && user.claims.sub === 'admin_001') {
        const adminUser = await storage.getUser('admin_001');
        if (adminUser) {
          // Serve the React app for admin dashboard
          res.redirect("/#/admin/dashboard");
          return;
        }
      }
      
      return res.redirect("/login");
    } catch (error) {
      console.error("Error accessing admin dashboard:", error);
      res.redirect("/login");
    }
  });

  // Admin authentication check API
  app.get("/api/admin/auth-check", async (req: any, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = req.user;
      
      // Check if this is a local admin session
      if (user.isLocal && user.claims && user.claims.sub === 'admin_001') {
        const adminUser = await storage.getUser('admin_001');
        if (adminUser) {
          res.json({
            id: adminUser.id,
            email: adminUser.email,
            firstName: adminUser.firstName,
            lastName: adminUser.lastName,
            role: adminUser.role
          });
          return;
        }
      }

      return res.status(401).json({ message: "Not admin user" });
    } catch (error) {
      console.error("Error checking admin auth:", error);
      res.status(500).json({ message: "Auth check failed" });
    }
  });

  // Admin stats API
  app.get("/api/admin/stats", async (req: any, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = req.user;
      
      // Check if this is a local admin session
      if (!user.isLocal || user.claims?.sub !== 'admin_001') {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }

      // Get dashboard statistics
      const stats = {
        totalProducts: 1, // Mock data for now
        totalInquiries: 0,
        totalUsers: 1,
        totalQuotations: 0,
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // ==========================================
  // WEBSITE MANAGEMENT API ROUTES (ADMIN ONLY)
  // ==========================================

  // Role validation middleware for admin-only routes
  const isAdminOrWebsiteManager = (req: any, res: any, next: any) => {
    const user = req.user;
    if (!user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // Get all products (admin view with all fields)
  app.get('/api/admin/products', isAuthenticated, isAdminOrWebsiteManager, async (req, res) => {
    try {
      const { 
        category, 
        search, 
        status, 
        dateFilter, 
        visibility, 
        sortBy, 
        limit = '100', 
        offset = '0' 
      } = req.query;
      
      const filters: any = {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      };

      if (category && category !== 'all') filters.category = category as string;
      if (search) filters.search = search as string;
      if (status && status !== 'all') filters.status = status as string;
      if (dateFilter && dateFilter !== 'all') filters.dateFilter = dateFilter as string;
      if (visibility && visibility !== 'all') filters.visibility = visibility as string;
      if (sortBy) filters.sortBy = sortBy as string;

      const result = await storage.getAdminProducts(filters);
      res.json(result);
    } catch (error) {
      console.error("Error fetching admin products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Get multiple products by IDs (bulk fetch)
  app.get('/api/admin/products/bulk', isAuthenticated, async (req, res) => {
    try {
      const { ids } = req.query;
      
      if (!ids || typeof ids !== 'string') {
        return res.status(400).json({ message: "Product IDs are required" });
      }

      const productIds = ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      
      if (productIds.length === 0) {
        return res.json([]);
      }

      const products = await storage.getProductsByIds(productIds);
      res.json(products);
    } catch (error) {
      console.error("Error fetching products by IDs:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Create new product
  app.post('/api/admin/products', isAuthenticated, isAdminOrWebsiteManager, async (req, res) => {
    try {
      const { selectedCategories, selectedProductTypes, selectedHealthSupports, ...productData } = req.body;
      const parsedProductData = insertProductSchema.parse(productData);
      parsedProductData.createdBy = (req.user as any)?.claims?.sub;
      parsedProductData.updatedBy = (req.user as any)?.claims?.sub;
      
      const product = await storage.createProduct(parsedProductData);
      
      // Handle multiple categories if provided
      if (selectedCategories && Array.isArray(selectedCategories) && selectedCategories.length > 0) {
        for (const categoryData of selectedCategories) {
          await storage.addProductToCategory(product.id, categoryData.categoryId, categoryData.isPrimary);
        }
      }
      
      // Handle multiple product types if provided
      if (selectedProductTypes && Array.isArray(selectedProductTypes) && selectedProductTypes.length > 0) {
        for (const typeData of selectedProductTypes) {
          await storage.addProductToType(product.id, typeData.typeId, typeData.isPrimary);
        }
      }
      
      // Handle multiple health supports if provided
      if (selectedHealthSupports && Array.isArray(selectedHealthSupports) && selectedHealthSupports.length > 0) {
        for (const healthSupportData of selectedHealthSupports) {
          await storage.addHealthSupportToProduct(product.id, healthSupportData.healthSupportId, healthSupportData.isPrimary);
        }
      }
      
      res.status(201).json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  // Get all product tags
  app.get('/api/admin/tags', isAuthenticated, isAdminOrWebsiteManager, async (req, res) => {
    try {
      const tags = await storage.getAllProductTags();
      res.json(tags);
    } catch (error) {
      console.error("Error fetching product tags:", error);
      res.status(500).json({ message: "Failed to fetch product tags" });
    }
  });

  // Update product
  app.put('/api/admin/products/:id', isAuthenticated, isAdminOrWebsiteManager, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const { selectedCategories, selectedProductTypes, selectedHealthSupports, ...productData } = req.body;
      const parsedProductData = insertProductSchema.partial().parse(productData);
      parsedProductData.updatedBy = (req.user as any)?.claims?.sub;
      
      const product = await storage.updateProduct(productId, parsedProductData);
      
      // Handle multiple categories update if provided
      if (selectedCategories && Array.isArray(selectedCategories)) {
        // Get current categories for this product
        const currentCategories = await storage.getProductCategories(productId);
        const currentCategoryIds = currentCategories.map((c: any) => c.id);
        const newCategoryIds = selectedCategories.map(c => c.categoryId);
        
        // Remove categories that are no longer selected
        for (const currentCatId of currentCategoryIds) {
          if (!newCategoryIds.includes(currentCatId)) {
            await storage.removeProductFromCategory(productId, currentCatId);
          }
        }
        
        // Add or update categories
        for (const categoryData of selectedCategories) {
          if (currentCategoryIds.includes(categoryData.categoryId)) {
            // Update existing relation
            await storage.updateProductCategoryRelation(productId, categoryData.categoryId, categoryData.isPrimary);
          } else {
            // Add new relation
            await storage.addProductToCategory(productId, categoryData.categoryId, categoryData.isPrimary);
          }
        }
      }
      
      // Handle multiple product types update if provided
      if (selectedProductTypes && Array.isArray(selectedProductTypes)) {
        // Get current product types for this product
        const currentTypes = await storage.getProductTypesForProduct(productId);
        const currentTypeIds = currentTypes.map((t: any) => t.id);
        const newTypeIds = selectedProductTypes.map(t => t.typeId);
        
        // Remove types that are no longer selected
        for (const currentTypeId of currentTypeIds) {
          if (!newTypeIds.includes(currentTypeId)) {
            await storage.removeProductFromType(productId, currentTypeId);
          }
        }
        
        // Add or update product types
        for (const typeData of selectedProductTypes) {
          if (currentTypeIds.includes(typeData.typeId)) {
            // Update existing relation
            await storage.updateProductTypeRelation(productId, typeData.typeId, typeData.isPrimary);
          } else {
            // Add new relation
            await storage.addProductToType(productId, typeData.typeId, typeData.isPrimary);
          }
        }
      }
      
      // Handle multiple health supports update if provided
      if (selectedHealthSupports && Array.isArray(selectedHealthSupports)) {
        // Get current health supports for this product
        const currentHealthSupports = await storage.getHealthSupportsForProduct(productId);
        const currentHealthSupportIds = currentHealthSupports.map((hs: any) => hs.id);
        const newHealthSupportIds = selectedHealthSupports.map(hs => hs.healthSupportId);
        
        // Remove health supports that are no longer selected
        for (const currentHsId of currentHealthSupportIds) {
          if (!newHealthSupportIds.includes(currentHsId)) {
            await storage.removeHealthSupportFromProduct(productId, currentHsId);
          }
        }
        
        // Add or update health supports
        for (const healthSupportData of selectedHealthSupports) {
          if (currentHealthSupportIds.includes(healthSupportData.healthSupportId)) {
            // Update existing relation - use bulk update to handle primary setting
            await storage.addHealthSupportToProduct(productId, healthSupportData.healthSupportId, healthSupportData.isPrimary);
          } else {
            // Add new relation
            await storage.addHealthSupportToProduct(productId, healthSupportData.healthSupportId, healthSupportData.isPrimary);
          }
        }
      }
      
      res.json(product);
    } catch (error) {
      console.error("Error updating product:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  // Delete product
  app.delete('/api/admin/products/:id', isAuthenticated, isAdminOrWebsiteManager, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      await storage.deleteProduct(productId);
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Get all categories (admin view)
  app.get('/api/admin/categories', isAuthenticated, isAdminOrWebsiteManager, async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Create new category
  app.post('/api/admin/categories', isAuthenticated, isAdminOrWebsiteManager, async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  // Update category
  app.put('/api/admin/categories/:id', isAuthenticated, isAdminOrWebsiteManager, async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      const categoryData = insertCategorySchema.partial().parse(req.body);
      
      const category = await storage.updateCategory(categoryId, categoryData);
      res.json(category);
    } catch (error) {
      console.error("Error updating category:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  // Delete category (soft delete)
  app.delete('/api/admin/categories/:id', isAuthenticated, isAdminOrWebsiteManager, async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      
      await storage.deleteCategory(categoryId);
      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Product-Category relationship endpoints
  
  // Get product with all its categories
  app.get('/api/products/:id/categories', async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const productWithCategories = await storage.getProductWithCategories(productId);
      
      if (!productWithCategories) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(productWithCategories);
    } catch (error) {
      console.error("Error fetching product categories:", error);
      res.status(500).json({ message: "Failed to fetch product categories" });
    }
  });

  // Get products by category (using junction table)
  app.get('/api/categories/:id/products', async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const result = await storage.getProductsByCategory(categoryId, limit, offset);
      res.json(result);
    } catch (error) {
      console.error("Error fetching products by category:", error);
      res.status(500).json({ message: "Failed to fetch products by category" });
    }
  });

  // Add product to category
  app.post('/api/admin/products/:productId/categories/:categoryId', isAuthenticated, isAdminOrWebsiteManager, async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const categoryId = parseInt(req.params.categoryId);
      const { isPrimary } = req.body;
      
      const relation = await storage.addProductToCategory(productId, categoryId, isPrimary);
      res.status(201).json(relation);
    } catch (error) {
      console.error("Error adding product to category:", error);
      res.status(500).json({ message: "Failed to add product to category" });
    }
  });

  // Remove product from category
  app.delete('/api/admin/products/:productId/categories/:categoryId', isAuthenticated, isAdminOrWebsiteManager, async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const categoryId = parseInt(req.params.categoryId);
      
      await storage.removeProductFromCategory(productId, categoryId);
      res.json({ message: "Product removed from category successfully" });
    } catch (error) {
      console.error("Error removing product from category:", error);
      res.status(500).json({ message: "Failed to remove product from category" });
    }
  });

  // Update product-category relationship (change primary status)
  app.put('/api/admin/products/:productId/categories/:categoryId', isAuthenticated, isAdminOrWebsiteManager, async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const categoryId = parseInt(req.params.categoryId);
      const { isPrimary } = req.body;
      
      const relation = await storage.updateProductCategoryRelation(productId, categoryId, isPrimary);
      res.json(relation);
    } catch (error) {
      console.error("Error updating product-category relationship:", error);
      res.status(500).json({ message: "Failed to update product-category relationship" });
    }
  });

  // Get all categories for a specific product
  app.get('/api/admin/products/:id/categories', isAuthenticated, isAdminOrWebsiteManager, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const categories = await storage.getProductCategories(productId);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching product categories:", error);
      res.status(500).json({ message: "Failed to fetch product categories" });
    }
  });

  // Bulk product upload via CSV/Excel
  app.post('/api/admin/products/bulk-upload', isAuthenticated, isAdminOrWebsiteManager, async (req: any, res) => {
    try {
      const upload = multer({ 
        storage: multer.memoryStorage(),
        limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
        fileFilter: (req, file, cb) => {
          const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
          if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(csv|xlsx|xls)$/i)) {
            cb(null, true);
          } else {
            cb(new Error('Only CSV and Excel files are allowed'));
          }
        }
      }).single('file');

      upload(req, res, async (err) => {
        if (err) {
          return res.status(400).json({ message: err.message });
        }

        if (!req.file) {
          return res.status(400).json({ message: 'No file uploaded' });
        }

        const result = await storage.bulkUploadProducts(req.file, req.user.claims.sub, req.body.defaultCategory);
        res.json(result);
      });
    } catch (error) {
      console.error("Error in bulk upload:", error);
      res.status(500).json({ message: "Failed to process bulk upload" });
    }
  });

  // Download product template
  app.get('/api/admin/products/template', isAuthenticated, isAdminOrWebsiteManager, async (req: any, res) => {
    try {
      const categoryId = req.query.category ? parseInt(req.query.category as string) : undefined;
      const template = await storage.generateProductTemplate(categoryId);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="product-template.csv"');
      res.send(template);
    } catch (error) {
      console.error("Error generating template:", error);
      res.status(500).json({ message: "Failed to generate template" });
    }
  });

  // Get all product tags
  app.get('/api/admin/tags', isAuthenticated, isAdminOrWebsiteManager, async (req, res) => {
    try {
      const tags = await storage.getProductTags();
      res.json(tags);
    } catch (error) {
      console.error("Error fetching tags:", error);
      res.status(500).json({ message: "Failed to fetch tags" });
    }
  });

  // Create new product tag
  app.post('/api/admin/tags', isAuthenticated, isAdminOrWebsiteManager, async (req, res) => {
    try {
      const tagData = insertProductTagSchema.parse(req.body);
      // Note: tagData doesn't have createdBy field in the schema
      
      const tag = await storage.createProductTag(tagData);
      res.status(201).json(tag);
    } catch (error) {
      console.error("Error creating tag:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create tag" });
    }
  });

  // Update product tag
  app.put('/api/admin/tags/:id', isAuthenticated, isAdminOrWebsiteManager, async (req, res) => {
    try {
      const tagId = parseInt(req.params.id);
      const tagData = insertProductTagSchema.partial().parse(req.body);
      
      const tag = await storage.updateProductTag(tagId, tagData);
      res.json(tag);
    } catch (error) {
      console.error("Error updating tag:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to update tag" });
    }
  });

  // Delete product tag
  app.delete('/api/admin/tags/:id', isAuthenticated, isAdminOrWebsiteManager, async (req, res) => {
    try {
      const tagId = parseInt(req.params.id);
      await storage.deleteProductTag(tagId);
      res.json({ message: "Tag deleted successfully" });
    } catch (error) {
      console.error("Error deleting tag:", error);
      res.status(500).json({ message: "Failed to delete tag" });
    }
  });

  // Migrate existing product certifications to tags
  app.post('/api/admin/tags/migrate', isAuthenticated, isAdminOrWebsiteManager, async (req, res) => {
    try {
      await storage.migrateExistingCertificationsToTags();
      res.json({ message: "Migration completed successfully" });
    } catch (error) {
      console.error("Error migrating certifications:", error);
      res.status(500).json({ message: "Failed to migrate certifications" });
    }
  });

  // Get all hero sliders
  app.get('/api/admin/sliders', isAuthenticated, isAdminOrWebsiteManager, async (req, res) => {
    try {
      const sliders = await storage.getHeroSliders();
      res.json(sliders);
    } catch (error) {
      console.error("Error fetching sliders:", error);
      res.status(500).json({ message: "Failed to fetch sliders" });
    }
  });

  // Get active hero sliders (public endpoint for frontend)
  app.get('/api/sliders/active', async (req, res) => {
    try {
      const sliders = await storage.getHeroSliders();
      const activeSliders = sliders.filter(slider => 
        slider.status === 'active' && 
        (!slider.startDate || new Date(slider.startDate) <= new Date()) &&
        (!slider.endDate || new Date(slider.endDate) >= new Date())
      );
      res.json(activeSliders);
    } catch (error) {
      console.error("Error fetching active sliders:", error);
      res.status(500).json({ message: "Failed to fetch active sliders" });
    }
  });

  // Schema Validation API Routes
  
  // Get schema validation results
  app.get('/api/admin/schema-validation', isAuthenticated, isAdminOrWebsiteManager, async (req, res) => {
    try {
      const validationResults = await storage.getSchemaValidationResults();
      res.json(validationResults);
    } catch (error) {
      console.error("Error fetching schema validation results:", error);
      res.status(500).json({ message: "Failed to fetch validation results" });
    }
  });

  // Get schema validation summary
  app.get('/api/admin/schema-validation/summary', isAuthenticated, isAdminOrWebsiteManager, async (req, res) => {
    try {
      const summary = await storage.getSchemaValidationSummary();
      res.json(summary);
    } catch (error) {
      console.error("Error fetching schema validation summary:", error);
      res.status(500).json({ message: "Failed to fetch validation summary" });
    }
  });

  // Run schema validation
  app.post('/api/admin/schema-validation/run', isAuthenticated, isAdminOrWebsiteManager, async (req, res) => {
    try {
      const results = await storage.runSchemaValidation();
      res.json({ message: "Schema validation completed", results });
    } catch (error) {
      console.error("Error running schema validation:", error);
      res.status(500).json({ message: "Failed to run schema validation" });
    }
  });

  // Export schema validation results as CSV
  app.get('/api/admin/schema-validation/export', isAuthenticated, isAdminOrWebsiteManager, async (req, res) => {
    try {
      const csvData = await storage.exportSchemaValidationResults();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="schema-validation-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvData);
    } catch (error) {
      console.error("Error exporting schema validation results:", error);
      res.status(500).json({ message: "Failed to export validation results" });
    }
  });

  // SEO ENHANCEMENT ROUTES

  // Product FAQ routes
  app.get('/api/products/:productId/faqs', async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const faqs = await storage.getProductFaqs(productId);
      res.json(faqs);
    } catch (error) {
      console.error('Error fetching product FAQs:', error);
      res.status(500).json({ message: "Failed to fetch FAQs" });
    }
  });

  app.post('/api/admin/products/:productId/faqs', isAuthenticated, async (req: any, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const faqData = insertProductFaqSchema.parse({ ...req.body, productId });
      const faq = await storage.createProductFaq(faqData);
      res.json(faq);
    } catch (error) {
      console.error('Error creating product FAQ:', error);
      res.status(500).json({ message: "Failed to create FAQ" });
    }
  });

  app.put('/api/admin/products/faqs/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const faq = await storage.updateProductFaq(id, updates);
      if (!faq) {
        return res.status(404).json({ message: "FAQ not found" });
      }
      res.json(faq);
    } catch (error) {
      console.error('Error updating product FAQ:', error);
      res.status(500).json({ message: "Failed to update FAQ" });
    }
  });

  app.delete('/api/admin/products/faqs/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteProductFaq(id);
      res.json({ message: "FAQ deleted successfully" });
    } catch (error) {
      console.error('Error deleting product FAQ:', error);
      res.status(500).json({ message: "Failed to delete FAQ" });
    }
  });

  // Blog routes
  app.get('/api/blog', async (req, res) => {
    try {
      const { category, published = 'true', limit = '10', offset = '0' } = req.query;
      const filters: any = {
        category: category as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      };
      
      // Only filter by published status if not "all"
      if (published !== 'all') {
        filters.published = published === 'true';
      }
      
      const result = await storage.getBlogPosts(filters);
      res.json(result);
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  });

  app.get('/api/blog/:slug', async (req, res) => {
    try {
      const { slug } = req.params;
      const post = await storage.getBlogPostBySlug(slug);
      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      res.json(post);
    } catch (error) {
      console.error('Error fetching blog post:', error);
      res.status(500).json({ message: "Failed to fetch blog post" });
    }
  });

  app.post('/api/admin/blog', isAuthenticated, async (req: any, res) => {
    try {
      const postData = insertBlogPostSchema.parse({
        ...req.body,
        authorId: req.user.claims.sub
      });
      const post = await storage.createBlogPost(postData);
      res.json(post);
    } catch (error) {
      console.error('Error creating blog post:', error);
      res.status(500).json({ message: "Failed to create blog post" });
    }
  });

  app.put('/api/admin/blog/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const post = await storage.updateBlogPost(id, updates);
      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      res.json(post);
    } catch (error) {
      console.error('Error updating blog post:', error);
      res.status(500).json({ message: "Failed to update blog post" });
    }
  });

  app.delete('/api/admin/blog/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteBlogPost(id);
      res.json({ message: "Blog post deleted successfully" });
    } catch (error) {
      console.error('Error deleting blog post:', error);
      res.status(500).json({ message: "Failed to delete blog post" });
    }
  });

  // SEO monitoring routes
  app.get('/api/admin/seo/issues', isAuthenticated, async (req: any, res) => {
    try {
      const { type } = req.query;
      const issues = await storage.getSeoIssues(type as string);
      res.json(issues);
    } catch (error) {
      console.error('Error fetching SEO issues:', error);
      res.status(500).json({ message: "Failed to fetch SEO issues" });
    }
  });

  app.post('/api/admin/seo/issues', isAuthenticated, async (req: any, res) => {
    try {
      const issueData = insertSeoMonitoringSchema.parse(req.body);
      const issue = await storage.createSeoIssue(issueData);
      res.json(issue);
    } catch (error) {
      console.error('Error creating SEO issue:', error);
      res.status(500).json({ message: "Failed to create SEO issue" });
    }
  });

  // Search suggestion routes
  app.get('/api/search/suggestions', async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.json([]);
      }
      const query = q.toLowerCase().trim();
      
      if (query.length < 2) {
        return res.json([]);
      }

      // Enhanced search with intelligent partial matching for 3+ character queries
      let whereConditions;
      
      if (query.length >= 3) {
        // For 3+ character searches, use enhanced partial matching
        whereConditions = and(
          eq(products.isActive, true),
          eq(products.isVisible, true),
          sql`(
            LOWER(${products.name}) LIKE LOWER(${'%' + query + '%'}) OR
            LOWER(${products.name}) LIKE LOWER(${query + '%'}) OR
            LOWER(${products.productId}) LIKE LOWER(${query + '%'}) OR
            LOWER(${products.botanicalName}) LIKE LOWER(${'%' + query + '%'}) OR
            LOWER(${products.botanicalName}) LIKE LOWER(${query + '%'}) OR
            LOWER(${products.name}) LIKE LOWER(${'% ' + query + '%'}) OR
            LOWER(${products.botanicalName}) LIKE LOWER(${'% ' + query + '%'})
          )`
        );
      } else {
        // For shorter queries, use standard matching
        whereConditions = and(
          eq(products.isActive, true),
          eq(products.isVisible, true),
          sql`(
            LOWER(${products.name}) LIKE LOWER(${'%' + query + '%'}) OR
            LOWER(${products.productId}) LIKE LOWER(${query + '%'}) OR
            LOWER(${products.botanicalName}) LIKE LOWER(${'%' + query + '%'})
          )`
        );
      }

      const searchResults = await db
        .select({
          id: products.id,
          name: products.name,
          slug: products.slug
        })
        .from(products)
        .where(whereConditions)
        .orderBy(
          // Enhanced relevance scoring
          sql`(
            CASE 
              WHEN LOWER(${products.name}) LIKE LOWER(${query + '%'}) THEN 1
              WHEN LOWER(${products.name}) LIKE LOWER(${'% ' + query + '%'}) THEN 2
              WHEN LOWER(${products.botanicalName}) LIKE LOWER(${query + '%'}) THEN 3
              ELSE 4
            END
          )`,
          products.name
        )
        .limit(8);

      // Format results as suggestions
      const suggestions = searchResults.map(product => ({
        id: product.id,
        query: product.name,
        popularity: 0,
        type: 'product' as const,
        slug: product.slug
      }));
      
      res.json(suggestions);
    } catch (error) {
      console.error('Error fetching search suggestions:', error);
      res.status(500).json({ message: "Failed to fetch search suggestions" });
    }
  });

  app.post('/api/search/analytics', async (req, res) => {
    try {
      const analyticsData = insertSearchAnalyticsSchema.parse(req.body);
      const analytics = await storage.recordSearchAnalytics(analyticsData);
      res.json(analytics);
    } catch (error) {
      console.error('Error recording search analytics:', error);
      res.status(500).json({ message: "Failed to record search analytics" });
    }
  });

  app.get('/api/admin/search/popular', isAuthenticated, async (req: any, res) => {
    try {
      const { limit = '10' } = req.query;
      const popularSearches = await storage.getPopularSearches(parseInt(limit as string));
      res.json(popularSearches);
    } catch (error) {
      console.error('Error fetching popular searches:', error);
      res.status(500).json({ message: "Failed to fetch popular searches" });
    }
  });

  // Global SEO Settings routes
  app.get('/api/admin/seo/settings', isAuthenticated, async (req: any, res) => {
    try {
      const settings = await storage.getGlobalSeoSettings();
      res.json(settings);
    } catch (error) {
      console.error('Error fetching global SEO settings:', error);
      res.status(500).json({ message: "Failed to fetch SEO settings" });
    }
  });

  app.put('/api/admin/seo/settings', isAuthenticated, async (req: any, res) => {
    try {
      const settingsData = insertGlobalSeoSettingsSchema.parse(req.body);
      const settings = await storage.updateGlobalSeoSettings(settingsData);
      res.json(settings);
    } catch (error) {
      console.error('Error updating global SEO settings:', error);
      res.status(500).json({ message: "Failed to update SEO settings" });
    }
  });

  // SEO audit endpoint
  app.get('/api/admin/seo/audit', isAuthenticated, async (req: any, res) => {
    try {
      // Get all products for SEO audit
      const { products } = await storage.getAdminProducts({ limit: 1000 });
      
      const auditResults = await Promise.all(
        products.map(async (product) => {
          // Get FAQs for this product
          const faqs = await storage.getProductFaqs(product.id);
          
          // Basic SEO audit
          const audit = {
            productId: product.productId,
            name: product.name,
            slug: product.slug,
            seoScore: 0,
            issues: [] as string[],
            recommendations: [] as string[]
          };

          // Check SEO fields
          if (!product.seoTitle) {
            audit.issues.push('Missing SEO title');
            audit.recommendations.push('Add a descriptive SEO title');
          } else {
            audit.seoScore += 20;
          }

          if (!product.seoDescription) {
            audit.issues.push('Missing SEO description');
            audit.recommendations.push('Add a compelling meta description');
          } else {
            audit.seoScore += 20;
          }

          if (!product.mainImage) {
            audit.issues.push('Missing main image');
            audit.recommendations.push('Add a high-quality product image');
          } else {
            audit.seoScore += 15;
          }

          if (!product.description || product.description.length < 100) {
            audit.issues.push('Poor product description');
            audit.recommendations.push('Improve product description (min 100 characters)');
          } else {
            audit.seoScore += 15;
          }

          if (faqs.length === 0) {
            audit.issues.push('No FAQs available');
            audit.recommendations.push('Add frequently asked questions');
          } else {
            audit.seoScore += 15;
          }

          if (!product.botanicalName) {
            audit.issues.push('Missing botanical name');
            audit.recommendations.push('Add botanical name for better search relevance');
          } else {
            audit.seoScore += 10;
          }

          if (!product.origin) {
            audit.recommendations.push('Add country of origin');
          } else {
            audit.seoScore += 5;
          }

          return audit;
        })
      );

      res.json({
        totalProducts: products.length,
        averageScore: auditResults.reduce((sum, audit) => sum + audit.seoScore, 0) / auditResults.length,
        results: auditResults
      });
    } catch (error) {
      console.error('Error performing SEO audit:', error);
      res.status(500).json({ message: "Failed to perform SEO audit" });
    }
  });

  // ========================================
  // USER ENDPOINTS FOR CRM
  // ========================================

  app.get('/api/users/sales-reps', isAuthenticated, async (req: any, res) => {
    try {
      const salesReps = await storage.getSalesReps();
      res.json(salesReps);
    } catch (error) {
      console.error('Error fetching sales reps:', error);
      res.status(500).json({ message: "Failed to fetch sales representatives" });
    }
  });

  // ========================================
  // CRM - COMPANY ROUTES
  // ========================================

  app.get('/api/crm/companies', isAuthenticated, async (req: any, res) => {
    try {
      const { 
        search, industryType, needsEnrichment, origin, status, 
        companyStage, priority, assignedTo, createdFrom,
        dateFrom, dateTo,
        limit = '50', offset = '0' 
      } = req.query;
      
      const userId = req.user.claims.sub;
      const userRole = req.user.claims['https://brightfameorganic.com/roles']?.[0] || 'customer';
      
      console.log('[Companies API] User:', userId, 'Role:', userRole, 'Origin filter:', origin);
      
      const filters: any = {
        search,
        industryType,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        user: { id: userId, role: userRole }
      };
      
      if (needsEnrichment !== undefined) filters.needsEnrichment = needsEnrichment === 'true';
      if (origin) filters.origin = origin;
      if (status) filters.status = status;
      if (companyStage) filters.companyStage = companyStage;
      if (priority) filters.priority = priority;
      if (assignedTo) filters.assignedTo = assignedTo;
      if (createdFrom) filters.createdFrom = createdFrom;
      if (dateFrom) filters.dateFrom = dateFrom;
      if (dateTo) filters.dateTo = dateTo;
      
      const result = await storage.getCompanies(filters);
      console.log('[Companies API] Found', result.total, 'companies, origins:', result.companies.map(c => c.origin).filter((v, i, a) => a.indexOf(v) === i));
      res.json(result);
    } catch (error) {
      console.error('Error fetching companies:', error);
      res.status(500).json({ message: "Failed to fetch companies" });
    }
  });

  app.get('/api/crm/companies/:id', isAuthenticated, async (req: any, res) => {
    try {
      const company = await storage.getCompany(parseInt(req.params.id));
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      res.json(company);
    } catch (error) {
      console.error('Error fetching company:', error);
      res.status(500).json({ message: "Failed to fetch company" });
    }
  });

  app.get('/api/crm/companies/:id/details', isAuthenticated, async (req: any, res) => {
    try {
      const company = await storage.getCompanyWithDetails(parseInt(req.params.id));
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      res.json(company);
    } catch (error) {
      console.error('Error fetching company details:', error);
      res.status(500).json({ message: "Failed to fetch company details" });
    }
  });

  app.post('/api/crm/companies', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { departmentPhones, additionalEmails, ...companyFields } = req.body;
      
      const companyData = insertCompanySchema.parse({
        ...companyFields,
        origin: companyFields.origin || 'manual',
        createdBy: userId
      });
      const company = await storage.createCompany(companyData);
      
      // Create company contacts for department phones if provided
      if (departmentPhones && Array.isArray(departmentPhones) && departmentPhones.length > 0) {
        for (const dept of departmentPhones) {
          if (dept.department && dept.phone) {
            try {
              await storage.createCompanyContact({
                companyId: company.id,
                contactName: dept.department,
                designation: dept.department,
                phone: dept.phone,
                isPrimary: false,
              });
            } catch (contactError) {
              console.error('Error creating department contact:', contactError);
              // Continue creating other contacts even if one fails
            }
          }
        }
      }
      
      // Create company contacts for additional emails if provided
      if (additionalEmails && Array.isArray(additionalEmails) && additionalEmails.length > 0) {
        for (const emailContact of additionalEmails) {
          if (emailContact.position && emailContact.email) {
            try {
              await storage.createCompanyContact({
                companyId: company.id,
                contactName: emailContact.position,
                designation: emailContact.position,
                email: emailContact.email,
                isPrimary: false,
              });
            } catch (contactError) {
              console.error('Error creating email contact:', contactError);
              // Continue creating other contacts even if one fails
            }
          }
        }
      }
      
      res.json(company);
    } catch (error: any) {
      console.error('Error creating company:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid company data", errors: error.errors });
      }
      // Check for duplicate GST number
      if (error.code === '23505' && error.constraint === 'companies_gst_number_key') {
        return res.status(400).json({ message: "A company with this GST number already exists. Please use a different GST number or leave it blank." });
      }
      res.status(500).json({ message: "Failed to create company" });
    }
  });

  app.patch('/api/crm/companies/:id', isAuthenticated, async (req: any, res) => {
    try {
      const company = await storage.updateCompany(parseInt(req.params.id), req.body);
      res.json(company);
    } catch (error) {
      console.error('Error updating company:', error);
      res.status(500).json({ message: "Failed to update company" });
    }
  });

  app.delete('/api/crm/companies/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteCompany(parseInt(req.params.id));
      res.json({ message: "Company deleted successfully" });
    } catch (error) {
      console.error('Error deleting company:', error);
      res.status(500).json({ message: "Failed to delete company" });
    }
  });

  // Company Assignment
  app.post('/api/crm/companies/:id/assign', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get user from database to check actual role
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      const adminRoles = ['admin', 'super_admin', 'sales_manager'];
      if (!adminRoles.includes(user.role)) {
        return res.status(403).json({ message: "Only managers can assign companies" });
      }
      
      const { assignedTo } = req.body;
      if (!assignedTo) {
        return res.status(400).json({ message: "assignedTo is required" });
      }
      
      const company = await storage.assignCompany(parseInt(req.params.id), assignedTo, userId);
      
      // Create notification for the assigned sales rep
      try {
        const companyDetails = await storage.getCompany(company.id);
        await storage.createNotification({
          type: 'company_assigned',
          title: 'Company Assigned to You',
          message: `You have been assigned to manage ${companyDetails?.companyName || 'a company'}`,
          targetUserId: assignedTo,
          targetRoles: null,
          entityType: 'company',
          entityId: company.id,
        });
      } catch (notificationError) {
        console.error('Error creating assignment notification:', notificationError);
      }
      
      res.json(company);
    } catch (error) {
      console.error('Error assigning company:', error);
      res.status(500).json({ message: "Failed to assign company" });
    }
  });

  app.post('/api/crm/companies/bulk-assign', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get user from database to check actual role
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      const adminRoles = ['admin', 'super_admin', 'sales_manager'];
      if (!adminRoles.includes(user.role)) {
        return res.status(403).json({ message: "Only managers can assign companies" });
      }
      
      const { companyIds, assignedTo } = req.body;
      if (!companyIds || !Array.isArray(companyIds) || companyIds.length === 0) {
        return res.status(400).json({ message: "companyIds array is required" });
      }
      if (!assignedTo) {
        return res.status(400).json({ message: "assignedTo is required" });
      }
      
      const result = await storage.bulkAssignCompanies(companyIds, assignedTo, userId);
      
      if (result.success > 0) {
        try {
          await storage.createNotification({
            type: 'company_assigned',
            title: 'Companies Assigned to You',
            message: `You have been assigned ${result.success} new compan${result.success === 1 ? 'y' : 'ies'} to manage`,
            targetUserId: assignedTo,
            targetRoles: null,
            entityType: 'company',
            entityId: companyIds[0],
          });
        } catch (notificationError) {
          console.error('Error creating bulk assignment notification:', notificationError);
        }
      }
      
      res.json(result);
    } catch (error) {
      console.error('Error bulk assigning companies:', error);
      res.status(500).json({ message: "Failed to bulk assign companies" });
    }
  });

  // Company Stage Update
  app.post('/api/crm/companies/:id/stage', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { stage } = req.body;
      
      if (!stage) {
        return res.status(400).json({ message: "stage is required" });
      }
      
      const company = await storage.updateCompanyStage(parseInt(req.params.id), stage, userId);
      res.json(company);
    } catch (error) {
      console.error('Error updating company stage:', error);
      res.status(500).json({ message: "Failed to update company stage" });
    }
  });

  // ========================================
  // CRM - COMPANY ACTIVITY ROUTES
  // ========================================

  app.get('/api/crm/companies/:id/activities', isAuthenticated, async (req: any, res) => {
    try {
      const activities = await storage.getCompanyActivities(parseInt(req.params.id));
      res.json(activities);
    } catch (error) {
      console.error('Error fetching company activities:', error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  app.post('/api/crm/companies/:id/activities', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const activityData = {
        ...req.body,
        companyId: parseInt(req.params.id),
        createdBy: userId,
      };
      const activity = await storage.createCompanyActivity(activityData);
      res.json(activity);
    } catch (error) {
      console.error('Error creating company activity:', error);
      res.status(500).json({ message: "Failed to create activity" });
    }
  });

  // Convert company to lead
  app.post('/api/crm/companies/:id/convert-to-lead', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const companyId = parseInt(req.params.id);
      const { productName, productDescription, quantity, unit, productId } = req.body;
      
      // Validate required fields
      if (!productName) {
        return res.status(400).json({ message: "Product name is required" });
      }
      if (!quantity) {
        return res.status(400).json({ message: "Quantity is required" });
      }
      if (!productId) {
        return res.status(400).json({ message: "Product selection is required. Please select a product from the catalog." });
      }
      
      // Get company details with contacts
      const companyWithDetails = await storage.getCompanyWithDetails(companyId);
      if (!companyWithDetails) {
        return res.status(404).json({ message: "Company not found" });
      }
      
      // Check if user has access to this company (assigned to them or is admin)
      const user = await storage.getUser(userId);
      const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'sales_manager';
      if (!isAdmin && companyWithDetails.assignedTo !== userId) {
        return res.status(403).json({ message: "You don't have permission to convert this company" });
      }
      
      // Get primary contact from company
      const primaryContact = companyWithDetails.primaryContact;
      
      // Create the lead from company (leadId is auto-generated by storage.createLead)
      // Expected order value is not needed at conversion stage - will be determined during quotation
      const leadData = {
        companyId,
        contactPersonId: primaryContact?.id || null,
        productName,
        productDescription: productDescription || null,
        productsInterested: productId ? [productId] : [],
        requiredQuantity: quantity,
        unit: unit || 'kg',
        leadSource: 'company_conversion',
        isManualLead: true,
        currentStage: 'new_lead',
        priority: 'warm',
        status: 'active',
        assignedSalesRep: companyWithDetails.assignedTo || userId,
        assignedBy: userId,
        assignedAt: new Date(),
        assignmentMode: 'manual',
        stageEnteredAt: new Date(),
        createdBy: userId,
      };
      
      const lead = await storage.createLead(leadData);
      
      // Log activity on company
      await storage.createCompanyActivity({
        companyId,
        activityType: 'lead_created',
        subject: `Lead ${lead.leadId} created`,
        description: `Converted to lead for product: ${productName}, Quantity: ${quantity} ${unit || 'kg'}`,
        createdBy: userId,
      });
      
      // Update the auto-generated lead activity with conversion details
      await storage.createLeadActivity({
        leadId: lead.id,
        activityType: 'note',
        subject: 'Company conversion details',
        description: `Lead created by converting company "${companyWithDetails.companyName}" for product enquiry: ${productName}`,
        createdBy: userId,
      });
      
      res.json({ 
        message: "Company successfully converted to lead", 
        lead 
      });
    } catch (error) {
      console.error('Error converting company to lead:', error);
      res.status(500).json({ message: "Failed to convert company to lead" });
    }
  });

  // ========================================
  // CRM - COMPANY EMAIL ROUTES
  // ========================================

  // Get email threads for a company
  app.get('/api/crm/companies/:id/emails', isAuthenticated, async (req: any, res) => {
    try {
      const companyId = parseInt(req.params.id);
      const threads = await storage.getEmailThreads({ companyId });
      
      // Get messages for each thread
      const threadsWithMessages = await Promise.all(
        threads.map(async (thread) => {
          const messages = await storage.getEmailMessages({ threadId: thread.id });
          return { ...thread, messages };
        })
      );
      
      res.json(threadsWithMessages);
    } catch (error) {
      console.error('Error fetching company emails:', error);
      res.status(500).json({ message: 'Failed to fetch emails' });
    }
  });

  // Send email to a company
  app.post('/api/crm/companies/:id/emails/send', isAuthenticated, async (req: any, res) => {
    try {
      const companyId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const { to, cc, bcc, subject, bodyHtml, bodyText, attachments, threadId: requestThreadId, isReply } = req.body;

      console.log('[Company Email Send] Starting - companyId:', companyId, 'threadId:', requestThreadId, 'isReply:', isReply);

      if (!to || !subject || !bodyHtml) {
        return res.status(400).json({ message: 'Missing required fields: to, subject, bodyHtml' });
      }

      // Get sender's email config
      const emailConfig = await storage.getUserEmailConfig(userId);
      if (!emailConfig) {
        return res.status(400).json({ message: 'No email configuration found for user. Please contact admin.' });
      }

      // Check if Gmail is connected
      if (!emailConfig.isConnected || (!emailConfig.accessToken && !emailConfig.refreshToken)) {
        return res.status(400).json({ 
          message: 'Gmail is not connected. Please connect your Gmail account in Settings → Email Configuration to send emails.',
          requiresGmailConnect: true,
        });
      }

      // Get sender email - try multiple sources
      let senderEmail = emailConfig.emailAddress;
      if (!senderEmail) {
        // Try to get email from Gmail API profile
        const { google } = await import('googleapis');
        const tempOauth2Client = new google.auth.OAuth2(
          process.env.GMAIL_CLIENT_ID,
          process.env.GMAIL_CLIENT_SECRET
        );
        tempOauth2Client.setCredentials({
          access_token: emailConfig.accessToken,
          refresh_token: emailConfig.refreshToken,
        });
        const gmail = google.gmail({ version: 'v1', auth: tempOauth2Client });
        try {
          const profile = await gmail.users.getProfile({ userId: 'me' });
          senderEmail = profile.data.emailAddress;
          // Update the config with the email address for future use
          if (senderEmail) {
            await storage.updateUserEmailConfig(userId, { emailAddress: senderEmail });
          }
        } catch (profileError) {
          console.error('[Company Email Send] Failed to get Gmail profile:', profileError);
        }
      }

      if (!senderEmail) {
        return res.status(400).json({ 
          message: 'Unable to determine sender email address. Please reconnect your Gmail account.',
          requiresGmailConnect: true,
        });
      }

      console.log('[Company Email Send] Using sender email:', senderEmail);

      // Get company details for context
      const company = await storage.getCompany(companyId);
      if (!company) {
        return res.status(404).json({ message: 'Company not found' });
      }

      // Thread handling
      let thread: any = null;
      
      if (requestThreadId && isReply) {
        thread = await storage.getEmailThread(requestThreadId);
        console.log('[Company Email Send] Using existing thread for reply:', thread?.id);
      }
      
      if (!thread) {
        thread = await storage.createEmailThread({
          leadId: null,
          companyId,
          subject,
          messageCount: 0,
          isRead: true,
          labels: [],
        });
        console.log('[Company Email Send] Created new thread:', thread.id);
      }

      // Build final email body with signature if configured
      let finalBodyHtml = bodyHtml;
      let finalBodyText = bodyText || bodyHtml.replace(/<[^>]*>/g, '');
      let inlineAttachments: { contentId: string; base64Data: string; mimeType: string; filename: string }[] = [];
      
      // Fetch signature image and prepare as inline attachment (same as Lead email)
      if (emailConfig.signatureImageUrl) {
        try {
          console.log('[Company Email] Attempting to load signature image:', emailConfig.signatureImageUrl);
          const objectStorageService = new ObjectStorageService();
          
          // Ensure the signature URL starts with /objects/
          let signaturePath = emailConfig.signatureImageUrl;
          if (!signaturePath.startsWith('/objects/')) {
            signaturePath = objectStorageService.normalizeObjectEntityPath(signaturePath);
            console.log('[Company Email] Normalized signature path:', signaturePath);
          }
          
          if (!signaturePath.startsWith('/objects/')) {
            console.error('[Company Email] Invalid signature path format:', signaturePath);
            throw new Error('Invalid signature path format');
          }
          
          const signatureFile = await objectStorageService.getObjectEntityFile(signaturePath);
          
          // Download file content as buffer
          const [fileContent] = await signatureFile.download();
          const base64Data = fileContent.toString('base64');
          
          // Get file metadata for mime type
          const [metadata] = await signatureFile.getMetadata();
          const mimeType = metadata.contentType || 'image/png';
          
          // Add to inline attachments
          inlineAttachments.push({
            contentId: 'signature_image',
            base64Data,
            mimeType,
            filename: 'signature.png',
          });
          
          // Append signature to HTML body using CID reference
          finalBodyHtml = `${bodyHtml}
            <br><br>
            <table cellpadding="0" cellspacing="0" border="0" style="margin-top: 20px;">
              <tr>
                <td>
                  <img src="cid:signature_image" alt="${emailConfig.displayName || 'Signature'}" style="max-width: 300px; max-height: 150px; display: block;" />
                </td>
              </tr>
            </table>`;
          
          finalBodyText = `${finalBodyText}\n\n---\n${emailConfig.displayName || 'Signature'}`;
          
          console.log('[Company Email] Signature image loaded successfully');
        } catch (signatureError: any) {
          console.error('[Company Email] Failed to load signature image:', signatureError?.message || signatureError);
          // Continue without signature if loading fails
        }
      }

      // Build References and In-Reply-To headers for proper threading
      let referencesHeader = '';
      let inReplyToHeader = '';
      
      if (isReply && thread) {
        const existingMessages = await storage.getEmailMessages({ threadId: thread.id });
        const messageIds = existingMessages
          .filter((m: any) => m.gmailMessageId)
          .map((m: any) => `<${m.gmailMessageId}@mail.gmail.com>`);
        
        if (messageIds.length > 0) {
          referencesHeader = messageIds.join(' ');
          inReplyToHeader = messageIds[messageIds.length - 1];
        }
      }

      // Send email via Gmail API
      const { google } = await import('googleapis');
      const oauth2Client = new google.auth.OAuth2(
        process.env.GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET
      );
      
      oauth2Client.setCredentials({
        access_token: emailConfig.accessToken,
        refresh_token: emailConfig.refreshToken,
      });

      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

      // Build email message
      const toAddresses = Array.isArray(to) ? to : [to];
      const ccAddresses = cc ? (Array.isArray(cc) ? cc : [cc]) : [];
      const bccAddresses = bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : [];

      // Build multipart email with inline attachments if present
      const boundary = '----=_Part_' + Date.now();
      let emailRaw = '';
      
      emailRaw += `From: ${senderEmail}\r\n`;
      emailRaw += `To: ${toAddresses.join(', ')}\r\n`;
      if (ccAddresses.length > 0) emailRaw += `Cc: ${ccAddresses.join(', ')}\r\n`;
      if (bccAddresses.length > 0) emailRaw += `Bcc: ${bccAddresses.join(', ')}\r\n`;
      emailRaw += `Subject: ${subject}\r\n`;
      emailRaw += 'MIME-Version: 1.0\r\n';
      if (referencesHeader) emailRaw += `References: ${referencesHeader}\r\n`;
      if (inReplyToHeader) emailRaw += `In-Reply-To: ${inReplyToHeader}\r\n`;
      
      if (inlineAttachments.length > 0) {
        // Multipart related for inline images
        emailRaw += `Content-Type: multipart/related; boundary="${boundary}"\r\n\r\n`;
        
        // HTML body part
        emailRaw += `--${boundary}\r\n`;
        emailRaw += 'Content-Type: text/html; charset=utf-8\r\n';
        emailRaw += 'Content-Transfer-Encoding: quoted-printable\r\n\r\n';
        emailRaw += finalBodyHtml + '\r\n';
        
        // Inline attachments
        for (const att of inlineAttachments) {
          emailRaw += `--${boundary}\r\n`;
          emailRaw += `Content-Type: ${att.mimeType}; name="${att.filename}"\r\n`;
          emailRaw += 'Content-Transfer-Encoding: base64\r\n';
          emailRaw += `Content-ID: <${att.contentId}>\r\n`;
          emailRaw += 'Content-Disposition: inline\r\n\r\n';
          emailRaw += att.base64Data + '\r\n';
        }
        
        emailRaw += `--${boundary}--`;
      } else {
        // Simple HTML email
        emailRaw += 'Content-Type: text/html; charset=utf-8\r\n\r\n';
        emailRaw += finalBodyHtml;
      }

      const encodedMessage = Buffer.from(emailRaw)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const gmailResponse = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
          threadId: thread.gmailThreadId || undefined,
        },
      });

      console.log('[Company Email Send] Gmail API response:', gmailResponse.data);

      // Update thread with Gmail thread ID if new
      if (!thread.gmailThreadId && gmailResponse.data.threadId) {
        await storage.updateEmailThread(thread.id, {
          gmailThreadId: gmailResponse.data.threadId,
        });
      }

      // Create email message record
      const emailMessage2 = await storage.createEmailMessage({
        threadId: thread.id,
        gmailMessageId: gmailResponse.data.id || null,
        direction: 'outbound',
        fromEmail: senderEmail,
        fromName: null,
        toEmails: toAddresses,
        ccEmails: ccAddresses.length > 0 ? ccAddresses : null,
        subject,
        bodyHtml: finalBodyHtml,
        bodyText: bodyText || null,
        sentAt: new Date(),
        receivedAt: null,
        status: 'sent',
        labels: [],
        hasAttachments: (attachments && attachments.length > 0) || false,
      });

      // Update thread
      await storage.updateEmailThread(thread.id, {
        lastMessageAt: new Date(),
        messageCount: (thread.messageCount || 0) + 1,
      });

      // Log activity
      await storage.createCompanyActivity({
        companyId,
        createdBy: userId,
        activityType: 'email_sent',
        subject: `Email sent: ${subject}`,
        description: `Email sent to ${toAddresses.join(', ')}`,
      });

      res.json({ 
        success: true, 
        message: 'Email sent successfully',
        threadId: thread.id,
        messageId: emailMessage2.id,
      });
    } catch (error: any) {
      console.error('[Company Email Send] Error:', error);
      
      if (error.code === 401 || (error.message && error.message.includes('invalid_grant'))) {
        return res.status(401).json({ 
          message: 'Gmail authorization expired. Please reconnect your Gmail account.',
          requiresGmailConnect: true,
        });
      }
      
      res.status(500).json({ message: 'Failed to send email: ' + (error.message || 'Unknown error') });
    }
  });

  // Get call activities for a company (filtered from activities)
  app.get('/api/crm/companies/:id/calls', isAuthenticated, async (req: any, res) => {
    try {
      const companyId = parseInt(req.params.id);
      const activities = await storage.getCompanyActivities(companyId);
      const callActivities = activities.filter((a: any) => a.activityType === 'call');
      res.json(callActivities);
    } catch (error) {
      console.error('Error fetching company calls:', error);
      res.status(500).json({ message: 'Failed to fetch calls' });
    }
  });

  // ========================================
  // CRM - COMPANY TASK ROUTES
  // ========================================

  app.get('/api/crm/companies/:id/tasks', isAuthenticated, async (req: any, res) => {
    try {
      const tasks = await storage.getCompanyTasks({ companyId: parseInt(req.params.id) });
      res.json(tasks);
    } catch (error) {
      console.error('Error fetching company tasks:', error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post('/api/crm/companies/:id/tasks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const taskData = {
        ...req.body,
        companyId: parseInt(req.params.id),
        createdBy: userId,
      };
      const task = await storage.createCompanyTask(taskData);
      res.json(task);
    } catch (error) {
      console.error('Error creating company task:', error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.patch('/api/crm/company-tasks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const task = await storage.updateCompanyTask(parseInt(req.params.id), req.body);
      res.json(task);
    } catch (error) {
      console.error('Error updating company task:', error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.post('/api/crm/company-tasks/:id/complete', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const task = await storage.completeCompanyTask(parseInt(req.params.id), userId);
      res.json(task);
    } catch (error) {
      console.error('Error completing company task:', error);
      res.status(500).json({ message: "Failed to complete task" });
    }
  });

  // User tasks endpoint
  app.get('/api/crm/my-company-tasks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { status } = req.query;
      const tasks = await storage.getCompanyTasks({ assignedTo: userId, status });
      res.json(tasks);
    } catch (error) {
      console.error('Error fetching user tasks:', error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  // ========================================
  // CRM - COMPANY CONTACT ROUTES
  // ========================================

  app.get('/api/crm/companies/:companyId/contacts', isAuthenticated, async (req: any, res) => {
    try {
      const contacts = await storage.getCompanyContacts(parseInt(req.params.companyId));
      res.json(contacts);
    } catch (error) {
      console.error('Error fetching company contacts:', error);
      res.status(500).json({ message: "Failed to fetch contacts" });
    }
  });

  app.post('/api/crm/companies/:companyId/contacts', isAuthenticated, async (req: any, res) => {
    try {
      const contactData = insertCompanyContactSchema.parse({
        ...req.body,
        companyId: parseInt(req.params.companyId)
      });
      const contact = await storage.createCompanyContact(contactData);
      res.json(contact);
    } catch (error: any) {
      console.error('Error creating contact:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid contact data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create contact" });
    }
  });

  app.patch('/api/crm/contacts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const contact = await storage.updateCompanyContact(parseInt(req.params.id), req.body);
      res.json(contact);
    } catch (error) {
      console.error('Error updating contact:', error);
      res.status(500).json({ message: "Failed to update contact" });
    }
  });

  app.delete('/api/crm/contacts/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteCompanyContact(parseInt(req.params.id));
      res.json({ message: "Contact deleted successfully" });
    } catch (error) {
      console.error('Error deleting contact:', error);
      res.status(500).json({ message: "Failed to delete contact" });
    }
  });

  app.post('/api/crm/companies/:companyId/contacts/:contactId/set-primary', isAuthenticated, async (req: any, res) => {
    try {
      await storage.setPrimaryContact(parseInt(req.params.companyId), parseInt(req.params.contactId));
      res.json({ message: "Primary contact updated successfully" });
    } catch (error) {
      console.error('Error setting primary contact:', error);
      res.status(500).json({ message: "Failed to set primary contact" });
    }
  });

  // ========================================
  // CRM - COMPANY NOTES ROUTES
  // ========================================

  app.get('/api/crm/companies/:companyId/notes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notes = await storage.getCompanyNotes(parseInt(req.params.companyId), userId);
      res.json(notes);
    } catch (error) {
      console.error('Error fetching company notes:', error);
      res.status(500).json({ message: "Failed to fetch notes" });
    }
  });

  app.post('/api/crm/companies/:companyId/notes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const noteData = insertCompanyNoteSchema.parse({
        ...req.body,
        companyId: parseInt(req.params.companyId),
        createdBy: userId
      });
      const note = await storage.createCompanyNote(noteData);
      res.json(note);
    } catch (error: any) {
      console.error('Error creating company note:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid note data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create note" });
    }
  });

  app.patch('/api/crm/notes/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const noteId = parseInt(req.params.id);
      
      // Check if user owns the note or is admin
      const existingNote = await storage.getCompanyNote(noteId);
      if (!existingNote) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      const user = await storage.getUser(userId);
      const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
      
      if (!isAdmin && existingNote.createdBy !== userId) {
        return res.status(403).json({ message: "You can only edit your own notes" });
      }
      
      const note = await storage.updateCompanyNote(noteId, req.body);
      res.json(note);
    } catch (error) {
      console.error('Error updating company note:', error);
      res.status(500).json({ message: "Failed to update note" });
    }
  });

  app.delete('/api/crm/notes/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const noteId = parseInt(req.params.id);
      
      // Check if user owns the note or is admin
      const existingNote = await storage.getCompanyNote(noteId);
      if (!existingNote) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      const user = await storage.getUser(userId);
      const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
      
      if (!isAdmin && existingNote.createdBy !== userId) {
        return res.status(403).json({ message: "You can only delete your own notes" });
      }
      
      await storage.deleteCompanyNote(noteId);
      res.json({ message: "Note deleted successfully" });
    } catch (error) {
      console.error('Error deleting company note:', error);
      res.status(500).json({ message: "Failed to delete note" });
    }
  });

  // ========================================
  // CRM - LEAD ROUTES
  // ========================================

  app.get('/api/crm/leads', isAuthenticated, async (req: any, res) => {
    try {
      const { 
        assignedTo, 
        stage, 
        priority, 
        status, 
        companyId, 
        leadSource,
        isManualLead,
        search, 
        createdFrom, 
        createdTo, 
        limit = '50', 
        offset = '0',
        sortBy,
        sortOrder = 'desc'
      } = req.query;
      
      // Get user info for RBAC from database
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const userRole = user?.role || 'customer';
      
      const filters = {
        assignedTo,
        stage,
        priority,
        status,
        companyId: companyId ? parseInt(companyId as string) : undefined,
        leadSource,
        isManualLead: isManualLead === 'true' ? true : isManualLead === 'false' ? false : undefined,
        search,
        createdFrom: createdFrom ? new Date(createdFrom as string) : undefined,
        createdTo: createdTo ? new Date(createdTo as string) : undefined,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        sortBy,
        sortOrder: sortOrder as 'asc' | 'desc',
        user: { id: userId, role: userRole } // Pass user for RBAC filtering
      };
      
      const result = await storage.getLeads(filters);
      res.json(result);
    } catch (error) {
      console.error('Error fetching leads:', error);
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  app.get('/api/crm/leads/:id', isAuthenticated, async (req: any, res) => {
    try {
      const lead = await storage.getLead(parseInt(req.params.id));
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      res.json(lead);
    } catch (error) {
      console.error('Error fetching lead:', error);
      res.status(500).json({ message: "Failed to fetch lead" });
    }
  });

  app.get('/api/crm/leads/by-lead-id/:leadId', isAuthenticated, async (req: any, res) => {
    try {
      const lead = await storage.getLeadByLeadId(req.params.leadId);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      res.json(lead);
    } catch (error) {
      console.error('Error fetching lead:', error);
      res.status(500).json({ message: "Failed to fetch lead" });
    }
  });

  app.post('/api/crm/leads', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { additionalContacts, ...leadFields } = req.body;
      
      const leadData = insertLeadSchema.parse({
        ...leadFields,
        createdBy: userId,
        assignedSalesRep: req.body.assignedSalesRep || userId,
        assignedBy: userId, // Track who assigned this lead
        assignedAt: new Date(), // Track when this lead was assigned
        assignmentMode: req.body.assignedSalesRep ? 'manual' : 'auto',
        isManualLead: req.body.isManualLead !== undefined ? req.body.isManualLead : true, // Default to manual for API-created leads
        leadSource: req.body.leadSource || 'manual',
        stageEnteredAt: new Date() // Set when stage is entered
      });

      if (!req.body.assignedSalesRep) {
        const autoAssignedUserId = await storage.applyAssignmentRules(leadData);
        if (autoAssignedUserId) {
          leadData.assignedSalesRep = autoAssignedUserId;
          leadData.assignmentMode = 'auto';
        }
      }

      const lead = await storage.createLead(leadData);
      
      // Create company contacts for additional contacts if provided
      if (additionalContacts && Array.isArray(additionalContacts) && additionalContacts.length > 0 && leadData.companyId) {
        for (const contact of additionalContacts) {
          if (contact.contactName && (contact.email || contact.phone)) {
            try {
              await storage.createCompanyContact({
                companyId: leadData.companyId,
                contactName: contact.contactName,
                designation: contact.designation || null,
                email: contact.email || null,
                phone: contact.phone || null,
                isPrimary: false,
              });
            } catch (contactError) {
              console.error('Error creating additional contact:', contactError);
              // Continue creating other contacts even if one fails
            }
          }
        }
      }
      
      res.json(lead);
    } catch (error: any) {
      console.error('Error creating lead:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid lead data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create lead" });
    }
  });

  // Dedicated endpoint for manual lead creation (for clarity)
  app.post('/api/crm/leads/manual', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Only admins and managers can create manual leads
      const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'sales_manager';
      if (!isAdmin) {
        return res.status(403).json({ message: "Insufficient permissions to create manual leads" });
      }
      
      const { additionalContacts, ...leadFields } = req.body;
      
      const leadData = insertLeadSchema.parse({
        ...leadFields,
        createdBy: userId,
        assignedBy: userId,
        assignedAt: new Date(),
        isManualLead: true, // Always true for manual endpoint
        leadSource: leadFields.leadSource || 'manual',
        stageEnteredAt: new Date(),
        assignmentMode: 'manual'
      });

      const lead = await storage.createLead(leadData);
      
      // Create company contacts for additional contacts if provided
      if (additionalContacts && Array.isArray(additionalContacts) && additionalContacts.length > 0 && leadData.companyId) {
        for (const contact of additionalContacts) {
          if (contact.contactName && (contact.email || contact.phone)) {
            try {
              await storage.createCompanyContact({
                companyId: leadData.companyId,
                contactName: contact.contactName,
                designation: contact.designation || null,
                email: contact.email || null,
                phone: contact.phone || null,
                isPrimary: false,
              });
            } catch (contactError) {
              console.error('Error creating additional contact:', contactError);
            }
          }
        }
      }
      
      res.json(lead);
    } catch (error: any) {
      console.error('Error creating manual lead:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid lead data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create manual lead" });
    }
  });

  app.patch('/api/crm/leads/:id', isAuthenticated, async (req: any, res) => {
    try {
      const lead = await storage.updateLead(parseInt(req.params.id), req.body);
      res.json(lead);
    } catch (error) {
      console.error('Error updating lead:', error);
      res.status(500).json({ message: "Failed to update lead" });
    }
  });

  app.delete('/api/crm/leads/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteLead(parseInt(req.params.id));
      res.json({ message: "Lead deleted successfully" });
    } catch (error) {
      console.error('Error deleting lead:', error);
      res.status(500).json({ message: "Failed to delete lead" });
    }
  });

  app.post('/api/crm/leads/:id/transfer', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { toUserId, reason } = req.body;
      const lead = await storage.transferLead(parseInt(req.params.id), toUserId, userId, reason);
      res.json(lead);
    } catch (error) {
      console.error('Error transferring lead:', error);
      res.status(500).json({ message: "Failed to transfer lead" });
    }
  });

  app.post('/api/crm/leads/:id/update-stage', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { stage } = req.body;
      const leadId = parseInt(req.params.id);
      
      // Get user info for RBAC
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      // Get lead to check permissions
      const existingLead = await storage.getLead(leadId);
      if (!existingLead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      // RBAC: Check if user has permission to update this lead
      const isAdmin = user.role === 'admin' || user.role === 'super_admin' || user.role === 'sales_manager';
      const isAssignedSalesRep = existingLead.assignedSalesRep === userId;
      const isCreator = existingLead.createdBy === userId;
      
      if (!isAdmin && !isAssignedSalesRep && !isCreator) {
        return res.status(403).json({ message: "You don't have permission to update this lead" });
      }
      
      const lead = await storage.updateLeadStage(leadId, stage, userId);
      res.json(lead);
    } catch (error) {
      console.error('Error updating lead stage:', error);
      res.status(500).json({ message: "Failed to update lead stage" });
    }
  });

  // Get sales reps for assignment dropdown
  app.get('/api/crm/sales-reps', isAuthenticated, async (req: any, res) => {
    try {
      const salesReps = await storage.getSalesReps();
      res.json(salesReps);
    } catch (error) {
      console.error('Error fetching sales reps:', error);
      res.status(500).json({ message: "Failed to fetch sales reps" });
    }
  });

  // Assign lead to sales rep
  app.patch('/api/crm/leads/:id/assign', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { assignedTo, reason } = req.body;
      const leadId = parseInt(req.params.id);
      
      // Get user info for RBAC
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      // Only admins and managers can assign leads
      const isAdmin = user.role === 'admin' || user.role === 'super_admin' || user.role === 'sales_manager';
      if (!isAdmin) {
        return res.status(403).json({ message: "Insufficient permissions to assign leads" });
      }
      
      const lead = await storage.assignLead(leadId, assignedTo, userId, reason);
      
      // Also assign the company to the same sales rep if the lead has a companyId
      if (lead.companyId && assignedTo) {
        try {
          await storage.updateCompany(lead.companyId, { 
            assignedTo: assignedTo,
            assignedBy: userId 
          });
        } catch (companyError) {
          console.error('Failed to update company assignment:', companyError);
          // Continue even if company update fails
        }
      }
      
      // Create notification for the assigned sales rep
      try {
        if (assignedTo && assignedTo !== userId) {
          const companyName = lead.company?.companyName || 'Unknown Company';
          await storage.createNotification({
            userId: assignedTo,
            type: 'lead_assigned',
            title: 'New Lead Assigned',
            message: `You have been assigned a new lead: ${companyName}`,
            entityType: 'lead',
            entityId: leadId,
            isRead: false,
            link: `/admin/sales/leads?leadId=${leadId}`,
          });
        }
      } catch (notifError) {
        console.error('Failed to create notification for lead assignment:', notifError);
      }
      
      res.json(lead);
    } catch (error) {
      console.error('Error assigning lead:', error);
      res.status(500).json({ message: "Failed to assign lead" });
    }
  });

  // Bulk assign leads
  app.post('/api/crm/leads/bulk-assign', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { leadIds, assignedTo } = req.body;
      
      // Get user info for RBAC
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      // Only admins and managers can bulk assign leads
      const isAdmin = user.role === 'admin' || user.role === 'super_admin' || user.role === 'sales_manager';
      if (!isAdmin) {
        return res.status(403).json({ message: "Insufficient permissions to bulk assign leads" });
      }
      
      const result = await storage.bulkAssignLeads(leadIds, assignedTo, userId);
      
      // Also assign companies to the same sales rep for all successfully assigned leads
      if (assignedTo) {
        try {
          // Get companyIds from the leads that were successfully assigned
          const leads = await Promise.all(
            leadIds.map(async (id: number) => await storage.getLead(id))
          );
          const companyIds = [...new Set(
            leads
              .filter((lead: any) => lead?.companyId)
              .map((lead: any) => lead.companyId)
          )];
          
          for (const companyId of companyIds) {
            try {
              await storage.updateCompany(companyId, { 
                assignedTo: assignedTo,
                assignedBy: userId 
              });
            } catch (companyError) {
              console.error(`Failed to update company ${companyId} assignment:`, companyError);
            }
          }
        } catch (companyError) {
          console.error('Failed to update company assignments for bulk lead assignment:', companyError);
        }
      }
      
      // Create notification for the assigned sales rep about bulk assignment
      try {
        if (assignedTo && assignedTo !== userId && result.success > 0) {
          await storage.createNotification({
            userId: assignedTo,
            type: 'lead_assigned',
            title: 'Leads Assigned',
            message: `You have been assigned ${result.success} new lead${result.success > 1 ? 's' : ''}`,
            entityType: 'lead',
            entityId: null,
            isRead: false,
            link: '/admin/sales/leads',
          });
        }
      } catch (notifError) {
        console.error('Failed to create notification for bulk lead assignment:', notifError);
      }
      
      res.json(result);
    } catch (error) {
      console.error('Error bulk assigning leads:', error);
      res.status(500).json({ message: "Failed to bulk assign leads" });
    }
  });

  // Bulk upload leads from CSV
  app.post('/api/crm/leads/bulk-upload', isAuthenticated, async (req: any, res) => {
    try {
      console.log('Bulk upload request received');
      const userId = req.user.claims.sub;
      const { leads } = req.body;
      
      console.log('User ID:', userId);
      console.log('Number of leads to upload:', leads?.length || 0);
      
      // Get user info for RBAC
      const user = await storage.getUser(userId);
      if (!user) {
        console.log('User not found:', userId);
        return res.status(401).json({ message: "User not found" });
      }
      
      console.log('User role:', user.role);
      
      // Only admins and managers can bulk upload leads
      const isAdmin = user.role === 'admin' || user.role === 'super_admin' || user.role === 'sales_manager';
      if (!isAdmin) {
        console.log('Insufficient permissions for user:', userId, 'Role:', user.role);
        return res.status(403).json({ message: "Insufficient permissions to bulk upload leads" });
      }
      
      console.log('Starting bulk create leads...');
      const result = await storage.bulkCreateLeads(leads, userId);
      console.log('Bulk upload result:', { success: result.success.length, errors: result.errors.length });
      res.json(result);
    } catch (error) {
      console.error('Error bulk uploading leads:', error);
      res.status(500).json({ message: "Failed to bulk upload leads" });
    }
  });

  // Get original inquiry/bid linked to a lead
  app.get('/api/crm/leads/:leadId/original-inquiry', isAuthenticated, async (req: any, res) => {
    try {
      const leadId = parseInt(req.params.leadId);
      
      // Find the inquiry where crmLeadId matches this lead
      const inquiry = await db.select()
        .from(inquiries)
        .where(eq(inquiries.crmLeadId, leadId))
        .limit(1);
      
      if (inquiry.length === 0) {
        return res.status(404).json({ message: "No original inquiry found for this lead" });
      }
      
      const inquiryData = inquiry[0];
      
      // Also fetch quotations for this inquiry
      const quotationsData = await db.select()
        .from(quotations)
        .where(eq(quotations.inquiryId, inquiryData.id))
        .orderBy(desc(quotations.createdAt));
      
      // Fetch bid revisions if this is a high volume bid
      let bidRevisionsData: any[] = [];
      if (inquiryData.inquiryType === 'high_volume_bid') {
        bidRevisionsData = await db.select()
          .from(bidRevisions)
          .where(eq(bidRevisions.inquiryId, inquiryData.id))
          .orderBy(desc(bidRevisions.submittedAt));
      }
      
      // Fetch product name
      let productName = null;
      if (inquiryData.productId) {
        const product = await db.select({ name: products.name })
          .from(products)
          .where(eq(products.id, inquiryData.productId))
          .limit(1);
        productName = product[0]?.name || null;
      }
      
      res.json({
        inquiry: {
          ...inquiryData,
          productName
        },
        quotations: quotationsData,
        bidRevisions: bidRevisionsData
      });
    } catch (error) {
      console.error('Error fetching original inquiry for lead:', error);
      res.status(500).json({ message: "Failed to fetch original inquiry" });
    }
  });

  // ========================================
  // CRM - HIGH VOLUME BID MANAGEMENT FROM LEADS
  // ========================================

  // Update bid progress status from Lead Management
  app.patch('/api/crm/leads/:leadId/high-volume-bid/status', isAuthenticated, async (req: any, res) => {
    try {
      const leadId = parseInt(req.params.leadId);
      const { status } = req.body;
      const userId = req.user.claims.sub;
      
      // Valid status values
      const validStatuses = ['submitted', 'manager_approval', 'sales_discussion', 'quotation_sent', 'completed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      
      // Find the inquiry linked to this lead
      const inquiry = await db.select()
        .from(inquiries)
        .where(eq(inquiries.crmLeadId, leadId))
        .limit(1);
      
      if (inquiry.length === 0) {
        return res.status(404).json({ message: "No inquiry found for this lead" });
      }
      
      const inquiryId = inquiry[0].id;
      
      // Update the bid progress status
      const updatedInquiry = await storage.updateBidProgressStatus(inquiryId, status);
      
      // Create a negotiation entry for the status update
      await storage.createBidNegotiation({
        inquiryId,
        leadId,
        messageType: 'status_update',
        message: `Bid status updated to: ${status.replace('_', ' ')}`,
        authorId: userId,
        authorRole: 'admin',
        isVisibleToCustomer: true,
      });
      
      res.json(updatedInquiry);
    } catch (error) {
      console.error('Error updating bid progress status:', error);
      res.status(500).json({ message: "Failed to update bid status" });
    }
  });

  // Send revised quote or message from Lead Management
  app.post('/api/crm/leads/:leadId/high-volume-bid/message', isAuthenticated, async (req: any, res) => {
    try {
      const leadId = parseInt(req.params.leadId);
      const { messageType, message, revisedAmount, currency } = req.body;
      const userId = req.user.claims.sub;
      
      // Validate message type
      const validTypes = ['revised_quote', 'admin_note', 'status_update'];
      if (!validTypes.includes(messageType)) {
        return res.status(400).json({ message: "Invalid message type" });
      }
      
      // Find the inquiry linked to this lead
      const inquiry = await db.select()
        .from(inquiries)
        .where(eq(inquiries.crmLeadId, leadId))
        .limit(1);
      
      if (inquiry.length === 0) {
        return res.status(404).json({ message: "No inquiry found for this lead" });
      }
      
      const inquiryId = inquiry[0].id;
      
      // Create negotiation entry
      const negotiation = await storage.createBidNegotiation({
        inquiryId,
        leadId,
        messageType,
        message,
        revisedAmount: revisedAmount || null,
        currency: currency || null,
        authorId: userId,
        authorRole: 'admin',
        isVisibleToCustomer: messageType !== 'admin_note',
      });
      
      // If it's a revised quote, also create a bid revision for legacy compatibility
      if (messageType === 'revised_quote' && revisedAmount) {
        await storage.createBidRevision({
          inquiryId,
          revisedAmount,
          currency: currency || 'USD',
          notes: message,
          submittedBy: userId,
        });
        
        // Update bid progress status to quotation_sent
        await storage.updateBidProgressStatus(inquiryId, 'quotation_sent');
      }
      
      res.json(negotiation);
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Get bid negotiations/messages for a lead
  app.get('/api/crm/leads/:leadId/high-volume-bid/negotiations', isAuthenticated, async (req: any, res) => {
    try {
      const leadId = parseInt(req.params.leadId);
      
      // Find the inquiry linked to this lead
      const inquiry = await db.select()
        .from(inquiries)
        .where(eq(inquiries.crmLeadId, leadId))
        .limit(1);
      
      if (inquiry.length === 0) {
        return res.status(404).json({ message: "No inquiry found for this lead" });
      }
      
      const negotiations = await storage.getBidNegotiations(inquiry[0].id);
      
      res.json(negotiations);
    } catch (error) {
      console.error('Error fetching negotiations:', error);
      res.status(500).json({ message: "Failed to fetch negotiations" });
    }
  });

  // Customer tracking endpoint for high volume bids
  app.get('/api/customer/high-volume-bids/:inquiryId/tracking', async (req: any, res) => {
    try {
      const inquiryId = parseInt(req.params.inquiryId);
      
      const inquiry = await storage.getInquiry(inquiryId);
      
      if (!inquiry) {
        return res.status(404).json({ message: "Inquiry not found" });
      }
      
      // Fetch customer-visible negotiations
      const negotiations = await storage.getBidNegotiations(inquiryId, true);
      
      // Fetch bid revisions
      const revisions = await storage.getBidRevisions(inquiryId);
      
      res.json({
        inquiryId: inquiry.inquiryId,
        bidProgressStatus: inquiry.bidProgressStatus || 'submitted',
        bidProgressUpdatedAt: inquiry.bidProgressUpdatedAt,
        bidStatus: inquiry.bidStatus,
        createdAt: inquiry.createdAt,
        negotiations,
        revisions,
      });
    } catch (error) {
      console.error('Error fetching bid tracking:', error);
      res.status(500).json({ message: "Failed to fetch bid tracking" });
    }
  });

  // ========================================
  // CRM - LEAD ACTIVITY ROUTES
  // ========================================

  app.get('/api/crm/leads/:leadId/activities', isAuthenticated, async (req: any, res) => {
    try {
      const activities = await storage.getLeadActivities(parseInt(req.params.leadId));
      res.json(activities);
    } catch (error) {
      console.error('Error fetching lead activities:', error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  app.post('/api/crm/leads/:leadId/activities', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const activityData = insertLeadActivitySchema.parse({
        ...req.body,
        leadId: parseInt(req.params.leadId),
        createdBy: userId
      });
      const activity = await storage.createLeadActivity(activityData);
      res.json(activity);
    } catch (error: any) {
      console.error('Error creating activity:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid activity data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create activity" });
    }
  });

  app.patch('/api/crm/activities/:id', isAuthenticated, async (req: any, res) => {
    try {
      const activity = await storage.updateLeadActivity(parseInt(req.params.id), req.body);
      res.json(activity);
    } catch (error) {
      console.error('Error updating activity:', error);
      res.status(500).json({ message: "Failed to update activity" });
    }
  });

  app.delete('/api/crm/activities/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteLeadActivity(parseInt(req.params.id));
      res.json({ message: "Activity deleted successfully" });
    } catch (error) {
      console.error('Error deleting activity:', error);
      res.status(500).json({ message: "Failed to delete activity" });
    }
  });

  // ========================================
  // CRM - LEAD TASK ROUTES
  // ========================================

  app.get('/api/crm/tasks', isAuthenticated, async (req: any, res) => {
    try {
      const { leadId, assignedTo, status } = req.query;
      const filters = {
        leadId: leadId ? parseInt(leadId) : undefined,
        assignedTo,
        status
      };
      const tasks = await storage.getLeadTasks(filters);
      res.json(tasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post('/api/crm/leads/:leadId/tasks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const taskData = insertLeadTaskSchema.parse({
        ...req.body,
        leadId: parseInt(req.params.leadId),
        createdBy: userId
      });
      const task = await storage.createLeadTask(taskData);
      res.json(task);
    } catch (error: any) {
      console.error('Error creating task:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid task data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.patch('/api/crm/tasks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const task = await storage.updateLeadTask(parseInt(req.params.id), req.body);
      res.json(task);
    } catch (error) {
      console.error('Error updating task:', error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.post('/api/crm/tasks/:id/complete', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const task = await storage.completeLeadTask(parseInt(req.params.id), userId);
      res.json(task);
    } catch (error) {
      console.error('Error completing task:', error);
      res.status(500).json({ message: "Failed to complete task" });
    }
  });

  app.delete('/api/crm/tasks/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteLeadTask(parseInt(req.params.id));
      res.json({ message: "Task deleted successfully" });
    } catch (error) {
      console.error('Error deleting task:', error);
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // ========================================
  // CRM - ASSIGNMENT RULE ROUTES
  // ========================================

  app.get('/api/crm/assignment-rules', isAuthenticated, async (req: any, res) => {
    try {
      const { ruleType, isActive } = req.query;
      const filters = {
        ruleType,
        isActive: isActive === 'true'
      };
      const rules = await storage.getAssignmentRules(filters);
      res.json(rules);
    } catch (error) {
      console.error('Error fetching assignment rules:', error);
      res.status(500).json({ message: "Failed to fetch assignment rules" });
    }
  });

  app.post('/api/crm/assignment-rules', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const ruleData = insertAssignmentRuleSchema.parse({
        ...req.body,
        createdBy: userId
      });
      const rule = await storage.createAssignmentRule(ruleData);
      res.json(rule);
    } catch (error: any) {
      console.error('Error creating assignment rule:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid rule data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create assignment rule" });
    }
  });

  app.patch('/api/crm/assignment-rules/:id', isAuthenticated, async (req: any, res) => {
    try {
      const rule = await storage.updateAssignmentRule(parseInt(req.params.id), req.body);
      res.json(rule);
    } catch (error) {
      console.error('Error updating assignment rule:', error);
      res.status(500).json({ message: "Failed to update assignment rule" });
    }
  });

  app.delete('/api/crm/assignment-rules/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteAssignmentRule(parseInt(req.params.id));
      res.json({ message: "Assignment rule deleted successfully" });
    } catch (error) {
      console.error('Error deleting assignment rule:', error);
      res.status(500).json({ message: "Failed to delete assignment rule" });
    }
  });

  // ========================================
  // CRM - ANALYTICS & REPORTING ROUTES
  // ========================================

  app.get('/api/crm/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.query.userId || req.user.claims.sub;
      const stats = await storage.getLeadStats(userId);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching lead stats:', error);
      res.status(500).json({ message: "Failed to fetch lead stats" });
    }
  });

  app.get('/api/crm/performance/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const { dateFrom, dateTo } = req.query;
      const performance = await storage.getSalesRepPerformance(
        req.params.userId,
        dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo ? new Date(dateTo as string) : undefined
      );
      res.json(performance);
    } catch (error) {
      console.error('Error fetching sales rep performance:', error);
      res.status(500).json({ message: "Failed to fetch performance data" });
    }
  });

  // ========================================
  // SALES PERSON DASHBOARD ROUTES
  // ========================================

  // Sales Person Dashboard - Get aggregated data for logged-in sales rep
  app.get('/api/sales/dashboard', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (!user.role?.includes('sales') && !user.role?.includes('admin'))) {
        return res.status(403).json({ message: "Access denied. Sales role required." });
      }

      // Get counts for assigned items
      const [leadsResult, inquiriesResult, samplesResult, bidsResult] = await Promise.all([
        storage.getLeads({ assignedTo: userId, limit: 1000 }),
        storage.getInquiries({ assignedTo: userId, limit: 1000 }),
        storage.getSampleRequests({ assignedTo: userId, limit: 1000 }),
        storage.getInquiries({ assignedTo: userId, inquiryType: 'high_volume_bid', limit: 1000 }),
      ]);

      // Calculate metrics
      const leads = leadsResult.leads || [];
      const activeLeads = leads.filter((l: any) => l.status === 'active').length;
      const wonLeads = leads.filter((l: any) => l.stage === 'won').length;
      const lostLeads = leads.filter((l: any) => l.stage === 'lost').length;
      
      const inquiries = inquiriesResult.inquiries || [];
      const pendingInquiries = inquiries.filter((i: any) => i.status === 'pending').length;
      
      const samples = samplesResult.requests || [];
      const samplesInProgress = samples.filter((s: any) => !['completed', 'cancelled'].includes(s.status)).length;
      
      const bids = bidsResult.inquiries || [];
      const pendingBids = bids.filter((b: any) => b.bidProgressStatus !== 'completed').length;
      const quotationsSent = bids.filter((b: any) => b.bidProgressStatus === 'quotation_sent').length;

      // Calculate conversion rate
      const totalClosedLeads = wonLeads + lostLeads;
      const conversionRate = totalClosedLeads > 0 ? Math.round((wonLeads / totalClosedLeads) * 100) : 0;

      // Calculate total deal value from won leads
      const totalDealValue = leads
        .filter((l: any) => l.stage === 'won')
        .reduce((sum: number, l: any) => sum + (parseFloat(l.expectedOrderValue) || 0), 0);

      res.json({
        summary: {
          activeLeads,
          pendingInquiries,
          samplesInProgress,
          pendingBids,
          quotationsSent,
        },
        performance: {
          dealsWon: wonLeads,
          dealsLost: lostLeads,
          conversionRate,
          totalDealValue,
          totalLeads: leads.length,
        },
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        }
      });
    } catch (error) {
      console.error('Error fetching sales dashboard:', error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  // Sales Person - Get assigned leads
  app.get('/api/sales/my-leads', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (!user.role?.includes('sales') && !user.role?.includes('admin'))) {
        return res.status(403).json({ message: "Access denied. Sales role required." });
      }

      const { stage, status, limit = '50', offset = '0' } = req.query;
      const filters: any = {
        assignedTo: userId,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      };
      if (stage) filters.stage = stage;
      if (status) filters.status = status;

      const result = await storage.getLeads(filters);
      res.json(result);
    } catch (error) {
      console.error('Error fetching sales leads:', error);
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  // Sales Person - Get assigned inquiries
  app.get('/api/sales/my-inquiries', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (!user.role?.includes('sales') && !user.role?.includes('admin'))) {
        return res.status(403).json({ message: "Access denied. Sales role required." });
      }

      const { status, limit = '50', offset = '0' } = req.query;
      const filters: any = {
        assignedTo: userId,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      };
      if (status) filters.status = status;

      const result = await storage.getInquiries(filters);
      res.json(result);
    } catch (error) {
      console.error('Error fetching sales inquiries:', error);
      res.status(500).json({ message: "Failed to fetch inquiries" });
    }
  });

  // Sales Person - Get assigned sample requests
  app.get('/api/sales/my-samples', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (!user.role?.includes('sales') && !user.role?.includes('admin'))) {
        return res.status(403).json({ message: "Access denied. Sales role required." });
      }

      const { status, limit = '50', offset = '0' } = req.query;
      const filters: any = {
        assignedTo: userId,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      };
      if (status) filters.status = status;

      const result = await storage.getSampleRequests(filters);
      res.json(result);
    } catch (error) {
      console.error('Error fetching sales sample requests:', error);
      res.status(500).json({ message: "Failed to fetch sample requests" });
    }
  });

  // Sales Person - Get assigned high volume bids
  app.get('/api/sales/my-bids', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (!user.role?.includes('sales') && !user.role?.includes('admin'))) {
        return res.status(403).json({ message: "Access denied. Sales role required." });
      }

      const { bidStatus, limit = '50', offset = '0' } = req.query;
      const filters: any = {
        assignedTo: userId,
        inquiryType: 'high_volume_bid',
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      };

      const result = await storage.getInquiries(filters);
      
      // Filter by bid status if provided
      let filteredInquiries = result.inquiries;
      if (bidStatus) {
        filteredInquiries = filteredInquiries.filter((i: any) => i.bidProgressStatus === bidStatus);
      }

      res.json({
        bids: filteredInquiries,
        total: filteredInquiries.length,
      });
    } catch (error) {
      console.error('Error fetching sales bids:', error);
      res.status(500).json({ message: "Failed to fetch bids" });
    }
  });

  // ========================================
  // STAFF ACCOUNT MANAGEMENT ROUTES
  // ========================================

  // Admin endpoint to create staff accounts with passwords
  app.post('/api/admin/create-staff', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id, email, password, firstName, lastName, role, companyName, phoneNumber } = req.body;

      if (!id || !email || !password || !firstName || !lastName || !role) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const validRoles = ['sales_manager', 'sales_executive', 'sales_rep'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ message: "Invalid role. Must be sales_manager, sales_executive, or sales_rep" });
      }

      const newUser = await storage.createStaffWithPassword({
        id,
        email,
        password,
        firstName,
        lastName,
        role,
        companyName: companyName || '',
        phoneNumber: phoneNumber || '',
        address: '',
        profileImageUrl: '',
      });

      res.json({ 
        message: "Staff account created successfully",
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: newUser.role
        }
      });
    } catch (error) {
      console.error('Error creating staff account:', error);
      res.status(500).json({ message: "Failed to create staff account" });
    }
  });

  // Admin endpoint to update staff password
  app.post('/api/admin/update-staff-password', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { userId, newPassword } = req.body;

      if (!userId || !newPassword) {
        return res.status(400).json({ message: "Missing userId or newPassword" });
      }

      const success = await storage.updateStaffPassword(userId, newPassword);
      if (success) {
        res.json({ message: "Password updated successfully" });
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      console.error('Error updating password:', error);
      res.status(500).json({ message: "Failed to update password" });
    }
  });

  // Newsletter subscription routes
  app.post('/api/newsletter/subscribe', async (req, res) => {
    try {
      const subscriptionData = insertNewsletterSubscriptionSchema.parse(req.body);
      const subscription = await storage.subscribeToNewsletter(subscriptionData);
      res.json({ 
        message: "Successfully subscribed to newsletter!", 
        subscription: { id: subscription.id, email: subscription.email } 
      });
    } catch (error: any) {
      console.error('Error subscribing to newsletter:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid email address" });
      }
      res.status(500).json({ message: "Failed to subscribe to newsletter" });
    }
  });

  app.post('/api/newsletter/unsubscribe', async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      await storage.unsubscribeFromNewsletter(email);
      res.json({ message: "Successfully unsubscribed from newsletter" });
    } catch (error) {
      console.error('Error unsubscribing from newsletter:', error);
      res.status(500).json({ message: "Failed to unsubscribe from newsletter" });
    }
  });

  app.get('/api/admin/newsletter/subscriptions', isAuthenticated, async (req: any, res) => {
    try {
      const { isActive, limit = '50', offset = '0' } = req.query;
      const filters = {
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      };
      const result = await storage.getNewsletterSubscriptions(filters);
      res.json(result);
    } catch (error) {
      console.error('Error fetching newsletter subscriptions:', error);
      res.status(500).json({ message: "Failed to fetch newsletter subscriptions" });
    }
  });

  // Robots.txt route
  app.get('/robots.txt', (req, res) => {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    res.send(`User-agent: *
Allow: /

# Allow public API endpoints for product data
Allow: /api/products
Allow: /api/categories
Allow: /api/health-supports
Allow: /api/ingredients
Allow: /api/industries
Allow: /api/detect-currency
Allow: /api/recaptcha-site-key

# Block admin and auth areas
Disallow: /admin/
Disallow: /crm/
Disallow: /api/admin/
Disallow: /api/auth/
Disallow: /api/inquiries
Disallow: /api/quotations
Disallow: /api/companies
Disallow: /api/leads

# Sitemap
Sitemap: https://bright-organic.com/sitemap.xml`);
  });

  // ========================================
  // EMAIL INTEGRATION ROUTES
  // ========================================

  // Admin: Get users for email configuration assignment
  app.get('/api/admin/users', isAuthenticated, async (req: any, res) => {
    try {
      // Use getSalesReps which returns users with admin, super_admin, sales_manager, sales_executive roles
      const eligibleUsers = await storage.getSalesReps();
      res.json(eligibleUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  // Get user's email configuration
  app.get('/api/email/config', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const config = await storage.getUserEmailConfig(userId);
      res.json(config || null);
    } catch (error) {
      console.error('Error fetching email config:', error);
      res.status(500).json({ message: 'Failed to fetch email configuration' });
    }
  });

  // Self-service: Start Gmail OAuth for current user's email configuration
  // This allows sales agents to connect their own Gmail account
  app.get('/api/email/connect', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const config = await storage.getUserEmailConfig(userId);
      
      if (!config) {
        return res.status(404).json({ 
          message: 'No email configuration found. Please contact admin to set up your email address first.' 
        });
      }

      console.log('[Gmail OAuth] Starting self-service connect for user:', userId, 'config:', config.id);
      
      // Store the config ID and user ID in session for the callback
      // Using a different session key to distinguish from admin-initiated connects
      (req as any).session.gmailOAuthConfigId = config.id;
      (req as any).session.gmailOAuthUserId = userId;
      (req as any).session.gmailOAuthSource = 'self-service';
      (req as any).session.save();
      
      const authUrl = gmailApi.getAuthUrl();
      res.json({ authUrl });
    } catch (error) {
      console.error('Error starting Gmail OAuth:', error);
      res.status(500).json({ message: 'Failed to start Gmail connection' });
    }
  });

  // Self-service: Disconnect Gmail from current user's email configuration
  app.post('/api/email/disconnect', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const config = await storage.getUserEmailConfig(userId);
      
      if (!config) {
        return res.status(404).json({ message: 'No email configuration found' });
      }
      
      await storage.updateUserEmailConfig(config.id, {
        accessToken: null,
        refreshToken: null,
        tokenExpiresAt: null,
        isConnected: false,
      });

      console.log('[Gmail OAuth] User disconnected Gmail:', userId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error disconnecting Gmail:', error);
      res.status(500).json({ message: 'Failed to disconnect Gmail' });
    }
  });

  // Self-service: Check Gmail connection status for current user
  app.get('/api/email/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const config = await storage.getUserEmailConfig(userId);
      
      if (!config) {
        return res.json({ hasConfig: false, connected: false });
      }

      if (!config.isConnected || (!config.accessToken && !config.refreshToken)) {
        return res.json({ hasConfig: true, connected: false, email: config.companyEmail });
      }

      // Try to verify connection is still valid
      try {
        const validAccessToken = await gmailApi.ensureValidAccessToken(
          {
            id: config.id,
            accessToken: config.accessToken,
            refreshToken: config.refreshToken,
            tokenExpiresAt: config.tokenExpiresAt,
          },
          async (configId, tokens) => {
            await storage.updateUserEmailConfig(configId, {
              accessToken: tokens.accessToken,
              refreshToken: tokens.refreshToken,
              tokenExpiresAt: tokens.tokenExpiresAt,
            });
          }
        );

        const profile = await gmailApi.getProfile(validAccessToken);
        res.json({ 
          hasConfig: true, 
          connected: true, 
          email: config.companyEmail,
          gmailAddress: profile.emailAddress,
          tokensValid: true 
        });
      } catch (error) {
        console.error('[Gmail OAuth] Failed to verify connection:', error);
        res.json({ 
          hasConfig: true, 
          connected: false, 
          email: config.companyEmail,
          tokensValid: false,
          error: 'Gmail connection expired. Please reconnect.'
        });
      }
    } catch (error) {
      console.error('Error checking Gmail status:', error);
      res.status(500).json({ message: 'Failed to check Gmail status' });
    }
  });

  // Admin: Get all email configurations
  app.get('/api/admin/email-configs', isAuthenticated, async (req: any, res) => {
    try {
      const configs = await storage.getUserEmailConfigs();
      res.json(configs);
    } catch (error) {
      console.error('Error fetching email configs:', error);
      res.status(500).json({ message: 'Failed to fetch email configurations' });
    }
  });

  // Admin: Create email configuration for user
  app.post('/api/admin/email-configs', isAuthenticated, async (req: any, res) => {
    try {
      const config = await storage.createUserEmailConfig(req.body);
      res.status(201).json(config);
    } catch (error) {
      console.error('Error creating email config:', error);
      res.status(500).json({ message: 'Failed to create email configuration' });
    }
  });

  // Admin: Update email configuration
  app.patch('/api/admin/email-configs/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const config = await storage.updateUserEmailConfig(id, req.body);
      res.json(config);
    } catch (error) {
      console.error('Error updating email config:', error);
      res.status(500).json({ message: 'Failed to update email configuration' });
    }
  });

  // Admin: Delete email configuration
  app.delete('/api/admin/email-configs/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteUserEmailConfig(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting email config:', error);
      res.status(500).json({ message: 'Failed to delete email configuration' });
    }
  });

  // Admin: Get signature upload URL for email configuration
  // Recommended dimensions: 300x100px (max 400x150px)
  app.post('/api/admin/email-configs/:id/signature-upload-url', isAuthenticated, async (req: any, res) => {
    try {
      const configId = parseInt(req.params.id);
      const config = await storage.getEmailConfigById(configId);
      
      if (!config) {
        return res.status(404).json({ message: 'Email configuration not found' });
      }

      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getPublicObjectUploadURL();
      
      res.json({ 
        uploadURL, 
        provider: 'replit-object-storage',
        recommendedDimensions: {
          width: 300,
          height: 100,
          maxWidth: 400,
          maxHeight: 150
        }
      });
    } catch (error) {
      console.error('Error generating signature upload URL:', error);
      res.status(500).json({ message: 'Failed to generate signature upload URL' });
    }
  });

  // Admin: Update signature image URL for email configuration
  app.put('/api/admin/email-configs/:id/signature', isAuthenticated, async (req: any, res) => {
    try {
      const configId = parseInt(req.params.id);
      const { signatureImageUrl } = req.body;

      if (!signatureImageUrl) {
        return res.status(400).json({ message: 'Signature image URL is required' });
      }

      const config = await storage.getEmailConfigById(configId);
      if (!config) {
        return res.status(404).json({ message: 'Email configuration not found' });
      }

      const userId = req.user.claims.sub;

      // Set ACL policy for the signature image to make it public
      try {
        const objectStorageService = new ObjectStorageService();
        const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
          signatureImageUrl,
          {
            owner: userId,
            visibility: "public",
          },
        );

        // Ensure the returned path is clean
        const cleanPath = objectPath.startsWith('/objects/') 
          ? objectPath 
          : `/objects/${objectPath}`;

        // Update the email configuration with the signature URL
        const updatedConfig = await storage.updateUserEmailConfig(configId, {
          signatureImageUrl: cleanPath,
        });

        res.json({ 
          success: true, 
          signatureImageUrl: cleanPath,
          config: updatedConfig 
        });
      } catch (aclError) {
        console.error('Error setting signature image ACL:', aclError);
        
        // Fallback: still save the URL even if ACL setting fails
        const objectStorageService = new ObjectStorageService();
        const fallbackPath = objectStorageService.normalizeObjectEntityPath(signatureImageUrl);
        const cleanPath = fallbackPath.startsWith('/objects/') 
          ? fallbackPath 
          : `/objects/${fallbackPath}`;

        const updatedConfig = await storage.updateUserEmailConfig(configId, {
          signatureImageUrl: cleanPath,
        });

        res.json({ 
          success: true, 
          signatureImageUrl: cleanPath,
          config: updatedConfig,
          warning: 'ACL policy not set, but signature should still be accessible'
        });
      }
    } catch (error) {
      console.error('Error updating signature:', error);
      res.status(500).json({ message: 'Failed to update signature image' });
    }
  });

  // Admin: Remove signature image from email configuration
  app.delete('/api/admin/email-configs/:id/signature', isAuthenticated, async (req: any, res) => {
    try {
      const configId = parseInt(req.params.id);
      const config = await storage.getEmailConfigById(configId);
      
      if (!config) {
        return res.status(404).json({ message: 'Email configuration not found' });
      }

      // Update the email configuration to remove the signature URL
      const updatedConfig = await storage.updateUserEmailConfig(configId, {
        signatureImageUrl: null,
      });

      res.json({ success: true, config: updatedConfig });
    } catch (error) {
      console.error('Error removing signature:', error);
      res.status(500).json({ message: 'Failed to remove signature image' });
    }
  });

  // ===== NOTIFICATION ROUTES =====
  
  // Get notifications for the current user
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const { isRead, limit, offset } = req.query;
      const filters: any = {};
      
      if (isRead !== undefined) {
        filters.isRead = isRead === 'true';
      }
      if (limit) {
        filters.limit = parseInt(limit as string);
      }
      if (offset) {
        filters.offset = parseInt(offset as string);
      }
      
      const notifications = await storage.getNotifications(userId, filters);
      res.json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ message: 'Failed to fetch notifications' });
    }
  });
  
  // Get unread notification count
  app.get('/api/notifications/unread-count', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error) {
      console.error('Error fetching unread count:', error);
      res.status(500).json({ message: 'Failed to fetch unread count' });
    }
  });
  
  // Mark a single notification as read
  app.post('/api/notifications/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const notificationId = parseInt(req.params.id);
      const notification = await storage.getNotification(notificationId);
      
      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }
      
      // Ensure user can only mark their own notifications as read
      if (notification.userId !== userId) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      const updated = await storage.markNotificationAsRead(notificationId);
      res.json(updated);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ message: 'Failed to mark notification as read' });
    }
  });
  
  // Mark all notifications as read
  app.post('/api/notifications/mark-all-read', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const count = await storage.markAllNotificationsAsRead(userId);
      res.json({ success: true, markedCount: count });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ message: 'Failed to mark notifications as read' });
    }
  });
  
  // Delete a notification
  app.delete('/api/notifications/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const notificationId = parseInt(req.params.id);
      const notification = await storage.getNotification(notificationId);
      
      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }
      
      // Ensure user can only delete their own notifications
      if (notification.userId !== userId) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      await storage.deleteNotification(notificationId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({ message: 'Failed to delete notification' });
    }
  });

  // ========================================
  // NET2PHONE VOICE/SMS INTEGRATION ROUTES
  // ========================================

  // Check net2phone configuration status
  app.get('/api/voice/status', isAuthenticated, async (req: any, res) => {
    try {
      const { net2phoneService } = await import('./net2phoneService');
      const status = net2phoneService.getConfigStatus();
      res.json(status);
    } catch (error) {
      console.error('Error checking net2phone status:', error);
      res.status(500).json({ message: 'Failed to check voice service status' });
    }
  });

  // Initiate a voice call
  app.post('/api/voice/call', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { phoneNumber, leadId, companyId, contactName } = req.body;
      
      if (!phoneNumber) {
        return res.status(400).json({ message: 'Phone number is required' });
      }

      const { net2phoneService } = await import('./net2phoneService');
      
      // Create call log in database first
      const callLog = await storage.createCallLog({
        callerUserId: userId,
        recipientPhone: phoneNumber,
        recipientName: contactName,
        direction: 'outbound',
        status: 'initiating',
        leadId: leadId || null,
        companyId: companyId || null,
      });

      // Initiate call via net2phone
      const result = await net2phoneService.initiateCall({
        to: phoneNumber,
        recordCall: true,
      });

      if (result.success && result.callId) {
        // Update call log with net2phone call ID
        await storage.updateCallLog(callLog.id, {
          callUuid: result.callId,
          status: 'ringing',
          ringingAt: new Date(),
        });

        res.json({ 
          success: true, 
          callLogId: callLog.id,
          callId: result.callId,
          status: 'ringing',
        });
      } else {
        // Update call log as failed
        await storage.updateCallLog(callLog.id, {
          status: 'failed',
          endedAt: new Date(),
          notes: result.error,
        });

        res.status(400).json({ 
          success: false, 
          message: result.error || 'Failed to initiate call',
        });
      }
    } catch (error: any) {
      console.error('Error initiating call:', error);
      res.status(500).json({ message: 'Failed to initiate call' });
    }
  });

  // End a call
  app.post('/api/voice/call/:callId/end', isAuthenticated, async (req: any, res) => {
    try {
      const { callId } = req.params;
      const { net2phoneService } = await import('./net2phoneService');
      
      const result = await net2phoneService.endCall(callId);
      
      if (result.success) {
        // Update call log
        await storage.updateCallLogByUuid(callId, {
          status: 'completed',
          endedAt: new Date(),
        });
        res.json({ success: true });
      } else {
        res.status(400).json({ success: false, message: result.error });
      }
    } catch (error) {
      console.error('Error ending call:', error);
      res.status(500).json({ message: 'Failed to end call' });
    }
  });

  // Get call logs for current user
  app.get('/api/voice/call-logs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;
      const { leadId, companyId, status, limit, offset } = req.query;

      const user = await storage.getUser(userId);
      const isAdmin = user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'sales_manager';

      const filters: any = {
        limit: limit ? parseInt(limit as string) : 50,
        offset: offset ? parseInt(offset as string) : 0,
      };

      // Non-admins can only see their own call logs
      if (!isAdmin) {
        filters.callerUserId = userId;
      }

      if (leadId) filters.leadId = parseInt(leadId as string);
      if (companyId) filters.companyId = parseInt(companyId as string);
      if (status) filters.status = status as string;

      const result = await storage.getCallLogs(filters);
      res.json(result);
    } catch (error) {
      console.error('Error fetching call logs:', error);
      res.status(500).json({ message: 'Failed to fetch call logs' });
    }
  });

  // Get call logs for a specific lead
  app.get('/api/crm/leads/:id/call-logs', isAuthenticated, async (req: any, res) => {
    try {
      const leadId = parseInt(req.params.id);
      const result = await storage.getCallLogs({ leadId, limit: 100 });
      res.json(result.callLogs);
    } catch (error) {
      console.error('Error fetching lead call logs:', error);
      res.status(500).json({ message: 'Failed to fetch call logs' });
    }
  });

  // Get call logs for a specific company
  app.get('/api/crm/companies/:id/call-logs', isAuthenticated, async (req: any, res) => {
    try {
      const companyId = parseInt(req.params.id);
      const result = await storage.getCallLogs({ companyId, limit: 100 });
      res.json(result.callLogs);
    } catch (error) {
      console.error('Error fetching company call logs:', error);
      res.status(500).json({ message: 'Failed to fetch call logs' });
    }
  });

  // Get a single call log with recording
  app.get('/api/voice/call-logs/:id', isAuthenticated, async (req: any, res) => {
    try {
      const callLog = await storage.getCallLog(parseInt(req.params.id));
      if (!callLog) {
        return res.status(404).json({ message: 'Call log not found' });
      }
      res.json(callLog);
    } catch (error) {
      console.error('Error fetching call log:', error);
      res.status(500).json({ message: 'Failed to fetch call log' });
    }
  });

  // Update call log notes/disposition
  app.patch('/api/voice/call-logs/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { notes, disposition } = req.body;
      const updated = await storage.updateCallLog(parseInt(req.params.id), {
        notes,
        disposition,
      });
      res.json(updated);
    } catch (error) {
      console.error('Error updating call log:', error);
      res.status(500).json({ message: 'Failed to update call log' });
    }
  });

  // Send SMS
  app.post('/api/voice/sms', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { phoneNumber, message, leadId, companyId, contactName } = req.body;
      
      if (!phoneNumber || !message) {
        return res.status(400).json({ message: 'Phone number and message are required' });
      }

      const { net2phoneService } = await import('./net2phoneService');

      // Create SMS record in database
      const smsRecord = await storage.createSmsMessage({
        senderUserId: userId,
        recipientPhone: phoneNumber,
        recipientName: contactName,
        direction: 'outbound',
        content: message,
        status: 'pending',
        leadId: leadId || null,
        companyId: companyId || null,
      });

      // Send SMS via net2phone
      const result = await net2phoneService.sendSms({
        to: phoneNumber,
        message,
      });

      if (result.success && result.messageId) {
        await storage.updateSmsMessage(smsRecord.id, {
          messageUuid: result.messageId,
          status: 'sent',
          sentAt: new Date(),
        });

        res.json({ 
          success: true, 
          messageId: smsRecord.id,
          externalId: result.messageId,
        });
      } else {
        await storage.updateSmsMessage(smsRecord.id, {
          status: 'failed',
          failedAt: new Date(),
          failureReason: result.error,
        });

        res.status(400).json({ 
          success: false, 
          message: result.error || 'Failed to send SMS',
        });
      }
    } catch (error: any) {
      console.error('Error sending SMS:', error);
      res.status(500).json({ message: 'Failed to send SMS' });
    }
  });

  // Get SMS messages for a lead
  app.get('/api/crm/leads/:id/sms', isAuthenticated, async (req: any, res) => {
    try {
      const leadId = parseInt(req.params.id);
      const result = await storage.getSmsMessages({ leadId, limit: 100 });
      res.json(result.messages);
    } catch (error) {
      console.error('Error fetching lead SMS messages:', error);
      res.status(500).json({ message: 'Failed to fetch SMS messages' });
    }
  });

  // Get SMS messages for a company
  app.get('/api/crm/companies/:id/sms', isAuthenticated, async (req: any, res) => {
    try {
      const companyId = parseInt(req.params.id);
      const result = await storage.getSmsMessages({ companyId, limit: 100 });
      res.json(result.messages);
    } catch (error) {
      console.error('Error fetching company SMS messages:', error);
      res.status(500).json({ message: 'Failed to fetch SMS messages' });
    }
  });

  // Get voicemails for current user
  app.get('/api/voice/voicemails', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;
      const { leadId, companyId, isListened, limit, offset } = req.query;

      const filters: any = {
        userId,
        limit: limit ? parseInt(limit as string) : 50,
        offset: offset ? parseInt(offset as string) : 0,
      };

      if (leadId) filters.leadId = parseInt(leadId as string);
      if (companyId) filters.companyId = parseInt(companyId as string);
      if (isListened !== undefined) filters.isListened = isListened === 'true';

      const result = await storage.getVoicemails(filters);
      res.json(result);
    } catch (error) {
      console.error('Error fetching voicemails:', error);
      res.status(500).json({ message: 'Failed to fetch voicemails' });
    }
  });

  // Mark voicemail as listened
  app.post('/api/voice/voicemails/:id/listened', isAuthenticated, async (req: any, res) => {
    try {
      const updated = await storage.markVoicemailAsListened(parseInt(req.params.id));
      res.json(updated);
    } catch (error) {
      console.error('Error marking voicemail as listened:', error);
      res.status(500).json({ message: 'Failed to update voicemail' });
    }
  });

  // Webhook for net2phone call events
  app.post('/api/voice/webhook/status', async (req, res) => {
    try {
      const { net2phoneService } = await import('./net2phoneService');
      const event = net2phoneService.processWebhook(req.body);
      
      console.log('net2phone webhook received:', event.type, event.data);

      const callId = event.data.call_id || event.data.callId;
      if (!callId) {
        return res.status(200).json({ received: true });
      }

      switch (event.type) {
        case 'call_ringing':
          await storage.updateCallLogByUuid(callId, {
            status: 'ringing',
            ringingAt: new Date(),
          });
          break;
        case 'call_answered':
          await storage.updateCallLogByUuid(callId, {
            status: 'answered',
            answeredAt: new Date(),
          });
          break;
        case 'call_completed':
          const duration = event.data.duration || event.data.duration_seconds || 0;
          await storage.updateCallLogByUuid(callId, {
            status: 'completed',
            endedAt: new Date(),
            durationSeconds: duration,
            recordingUrl: event.data.recording_url || event.data.recordingUrl,
            recordingDuration: event.data.recording_duration,
          });
          break;
        case 'call_missed':
          await storage.updateCallLogByUuid(callId, {
            status: 'missed',
            endedAt: new Date(),
          });
          break;
        case 'voicemail':
          const callLog = await storage.getCallLogByUuid(callId);
          if (callLog) {
            await storage.createVoicemail({
              voicemailUuid: event.data.voicemail_id || event.data.id,
              userId: callLog.callerUserId,
              callerPhone: event.data.caller_phone || callLog.recipientPhone,
              callerName: event.data.caller_name,
              recordingUrl: event.data.recording_url || event.data.url,
              transcription: event.data.transcription,
              durationSeconds: event.data.duration,
              leadId: callLog.leadId,
              companyId: callLog.companyId,
              callLogId: callLog.id,
            });

            await storage.updateCallLog(callLog.id, {
              status: 'voicemail',
              voicemailUrl: event.data.recording_url || event.data.url,
            });
          }
          break;
      }

      res.status(200).json({ received: true });
    } catch (error) {
      console.error('Error processing webhook:', error);
      res.status(500).json({ message: 'Webhook processing failed' });
    }
  });

  // Webhook for SMS events
  app.post('/api/voice/webhook/sms', async (req, res) => {
    try {
      const { net2phoneService } = await import('./net2phoneService');
      const event = net2phoneService.processWebhook(req.body);
      
      console.log('net2phone SMS webhook received:', event.type, event.data);

      if (event.type === 'sms_received') {
        // Handle incoming SMS - could be linked to a lead/company by phone number
        const fromPhone = event.data.from || event.data.sender_phone;
        const toPhone = event.data.to || event.data.recipient_phone;
        const content = event.data.message || event.data.content || event.data.body;

        // Create inbound SMS record
        await storage.createSmsMessage({
          messageUuid: event.data.message_id || event.data.id,
          recipientPhone: toPhone,
          senderPhone: fromPhone,
          direction: 'inbound',
          content: content,
          status: 'received',
          sentAt: new Date(),
        });
      } else if (event.type === 'sms_delivered') {
        const messageId = event.data.message_id || event.data.id;
        if (messageId) {
          // Update existing SMS record
          const existingMessage = await db
            .select()
            .from(smsMessages)
            .where(eq(smsMessages.messageUuid, messageId))
            .limit(1);
          
          if (existingMessage.length > 0) {
            await storage.updateSmsMessage(existingMessage[0].id, {
              status: 'delivered',
              deliveredAt: new Date(),
            });
          }
        }
      }

      res.status(200).json({ received: true });
    } catch (error) {
      console.error('Error processing SMS webhook:', error);
      res.status(500).json({ message: 'Webhook processing failed' });
    }
  });

  // Upload email attachment through server (proxy to avoid CORS)
  const emailAttachmentUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
  });
  
  app.post('/api/email-attachments/upload', isAuthenticated, emailAttachmentUpload.single('file'), async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;
      console.log('[Attachment Upload] Request from user:', userId);
      
      const file = req.file;
      if (!file) {
        console.log('[Attachment Upload] No file in request');
        return res.status(400).json({ message: 'No file provided' });
      }
      
      console.log('[Attachment Upload] File received:', {
        name: file.originalname,
        size: file.size,
        type: file.mimetype,
      });
      
      const objectStorageService = new ObjectStorageService();
      
      // Get a signed upload URL
      console.log('[Attachment Upload] Getting signed upload URL...');
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      console.log('[Attachment Upload] Got signed URL, uploading...');
      
      // Upload the file to object storage
      const uploadResponse = await fetch(uploadURL, {
        method: 'PUT',
        body: file.buffer,
        headers: {
          'Content-Type': file.mimetype || 'application/octet-stream',
        },
      });
      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text().catch(() => 'Unknown error');
        console.error('[Attachment Upload] Object storage upload failed:', {
          status: uploadResponse.status,
          statusText: uploadResponse.statusText,
          error: errorText,
        });
        return res.status(500).json({ message: 'Failed to upload to object storage' });
      }
      
      console.log('[Attachment Upload] Upload successful');
      
      // Get the file URL from the signed URL (remove query params)
      const fileUrl = uploadURL.split('?')[0];
      
      // Normalize the path
      const objectPath = objectStorageService.normalizeObjectEntityPath(fileUrl);
      const cleanPath = objectPath.startsWith('/objects/') 
        ? objectPath 
        : `/objects/${objectPath}`;
      
      console.log('[Attachment Upload] Returning path:', cleanPath);
      
      res.json({ 
        success: true, 
        fileUrl: cleanPath,
        fileName: file.originalname,
        size: file.size,
        contentType: file.mimetype,
      });
    } catch (error: any) {
      console.error('[Attachment Upload] Error:', error.message || error);
      console.error('[Attachment Upload] Stack:', error.stack);
      res.status(500).json({ message: 'Failed to upload attachment: ' + (error.message || 'Unknown error') });
    }
  });

  // ========================================
  // GMAIL OAUTH ROUTES
  // ========================================

  // Start Gmail OAuth flow for an email configuration
  app.get('/api/admin/email-configs/:id/connect', isAuthenticated, async (req: any, res) => {
    try {
      const configId = parseInt(req.params.id);
      const config = await storage.getEmailConfigById(configId);
      
      if (!config) {
        return res.status(404).json({ message: 'Email configuration not found' });
      }

      // Store the config ID in session for the callback
      (req as any).session.gmailOAuthConfigId = configId;
      (req as any).session.save();
      
      const authUrl = gmailApi.getAuthUrl();
      res.json({ authUrl });
    } catch (error) {
      console.error('Error starting Gmail OAuth:', error);
      res.status(500).json({ message: 'Failed to start Gmail OAuth' });
    }
  });

  // Gmail OAuth callback - handles both admin-initiated and self-service connections
  app.get('/api/auth/gmail/callback', async (req: any, res) => {
    try {
      const { code, error } = req.query;
      
      // Determine redirect URL based on source (self-service vs admin)
      const oauthSource = req.session?.gmailOAuthSource;
      const redirectBase = oauthSource === 'self-service' ? '/crm/email-settings' : '/admin';
      
      console.log('[Gmail OAuth Callback] Source:', oauthSource, 'Redirect base:', redirectBase);
      
      if (error) {
        console.error('Gmail OAuth error:', error);
        return res.redirect(`${redirectBase}?error=gmail_oauth_denied`);
      }

      if (!code) {
        return res.redirect(`${redirectBase}?error=gmail_oauth_no_code`);
      }

      const configId = req.session?.gmailOAuthConfigId;
      if (!configId) {
        return res.redirect(`${redirectBase}?error=gmail_oauth_session_expired`);
      }

      // Exchange code for tokens
      const tokens = await gmailApi.getTokensFromCode(code as string);
      
      if (!tokens.access_token) {
        return res.redirect(`${redirectBase}?error=gmail_oauth_no_token`);
      }

      // Verify the Gmail account matches the expected email (for security)
      // This is critical to prevent agents from accidentally connecting the wrong Gmail
      try {
        const profile = await gmailApi.getProfile(tokens.access_token);
        const config = await storage.getEmailConfigById(configId);
        
        if (config) {
          console.log('[Gmail OAuth Callback] Authenticated Gmail:', profile.emailAddress, 'Expected email:', config.companyEmail);
          
          // Check if the authenticated Gmail matches the configured email
          const authenticatedEmail = profile.emailAddress.toLowerCase();
          const configuredEmail = config.companyEmail.toLowerCase();
          
          if (authenticatedEmail !== configuredEmail) {
            // Strictly enforce email matching for ALL connections
            // This prevents admin from accidentally connecting their Gmail to an agent's config
            console.error('[Gmail OAuth Callback] REJECTED: Email mismatch! Authenticated:', profile.emailAddress, 'Expected:', config.companyEmail);
            // Clear session and reject
            delete req.session.gmailOAuthConfigId;
            delete req.session.gmailOAuthUserId;
            delete req.session.gmailOAuthSource;
            return res.redirect(`${redirectBase}?error=gmail_email_mismatch&expected=${encodeURIComponent(config.companyEmail)}&got=${encodeURIComponent(profile.emailAddress)}`);
          }
        }
      } catch (profileError) {
        console.error('[Gmail OAuth Callback] Failed to get Gmail profile:', profileError);
        // We need to verify the email, so reject if we can't get profile
        delete req.session.gmailOAuthConfigId;
        delete req.session.gmailOAuthUserId;
        delete req.session.gmailOAuthSource;
        return res.redirect(`${redirectBase}?error=gmail_oauth_verification_failed`);
      }

      // Update the email configuration with the tokens
      await storage.updateUserEmailConfig(configId, {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || undefined,
        tokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
        isConnected: true,
      });

      console.log('[Gmail OAuth Callback] Successfully connected Gmail for config:', configId);

      // Clear the session variables
      delete req.session.gmailOAuthConfigId;
      delete req.session.gmailOAuthUserId;
      delete req.session.gmailOAuthSource;

      res.redirect(`${redirectBase}?success=gmail_connected`);
    } catch (error) {
      console.error('Error in Gmail OAuth callback:', error);
      const redirectBase = req.session?.gmailOAuthSource === 'self-service' ? '/crm/email-settings' : '/admin';
      res.redirect(`${redirectBase}?error=gmail_oauth_failed`);
    }
  });

  // Disconnect Gmail from an email configuration
  app.post('/api/admin/email-configs/:id/disconnect', isAuthenticated, async (req: any, res) => {
    try {
      const configId = parseInt(req.params.id);
      
      await storage.updateUserEmailConfig(configId, {
        accessToken: null,
        refreshToken: null,
        tokenExpiresAt: null,
        isConnected: false,
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Error disconnecting Gmail:', error);
      res.status(500).json({ message: 'Failed to disconnect Gmail' });
    }
  });

  // Check Gmail connection status for an email config
  app.get('/api/admin/email-configs/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const configId = parseInt(req.params.id);
      const config = await storage.getEmailConfigById(configId);
      
      if (!config) {
        return res.status(404).json({ message: 'Email configuration not found' });
      }

      if (!config.isConnected || (!config.accessToken && !config.refreshToken)) {
        return res.json({ connected: false });
      }

      // Try to get Gmail profile to verify connection (with auto token refresh)
      try {
        const validAccessToken = await gmailApi.ensureValidAccessToken(
          {
            id: config.id,
            accessToken: config.accessToken,
            refreshToken: config.refreshToken,
            tokenExpiresAt: config.tokenExpiresAt,
          },
          async (cfgId, tokens) => {
            await storage.updateUserEmailConfig(cfgId, {
              accessToken: tokens.accessToken,
              refreshToken: tokens.refreshToken,
              tokenExpiresAt: tokens.tokenExpiresAt,
            });
          }
        );

        const profile = await gmailApi.getProfile(validAccessToken);
        res.json({ 
          connected: true, 
          email: profile.emailAddress,
          messagesTotal: profile.messagesTotal,
        });
      } catch (error: any) {
        console.error('Gmail status check error:', error.message);
        // Authorization revoked or refresh failed - mark as disconnected
        if (error.message?.includes('authorization revoked') || 
            error.message?.includes('invalid_grant') ||
            error.message?.includes('reconnect')) {
          await storage.updateUserEmailConfig(configId, { 
            isConnected: false,
            accessToken: null,
          });
        }
        res.json({ connected: false, error: 'Token expired or revoked' });
      }
    } catch (error) {
      console.error('Error checking Gmail status:', error);
      res.status(500).json({ message: 'Failed to check Gmail status' });
    }
  });

  // ========================================
  // END GMAIL OAUTH ROUTES
  // ========================================

  // Get email threads for a lead
  app.get('/api/crm/leads/:leadId/emails', isAuthenticated, async (req: any, res) => {
    try {
      const leadId = parseInt(req.params.leadId);
      
      // Get lead-specific threads
      const leadThreads = await storage.getEmailThreads({ leadId });
      
      // Also get company-level threads if the lead has a company
      const lead = await storage.getLead(leadId);
      let companyThreads: any[] = [];
      if (lead?.companyId) {
        // Get company threads that don't have a leadId (company-level emails)
        const allCompanyThreads = await storage.getEmailThreads({ companyId: lead.companyId });
        companyThreads = allCompanyThreads.filter(t => !t.leadId);
      }
      
      // Combine both sets of threads
      const allThreads = [...leadThreads, ...companyThreads];
      
      // Get messages for each thread
      const threadsWithMessages = await Promise.all(
        allThreads.map(async (thread) => {
          const messages = await storage.getEmailMessages({ threadId: thread.id });
          return { 
            ...thread, 
            messages,
            source: thread.leadId ? 'lead' : 'company' // Mark the source for UI context
          };
        })
      );
      
      // Sort by lastMessageAt descending
      threadsWithMessages.sort((a, b) => {
        const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        return dateB - dateA;
      });
      
      res.json(threadsWithMessages);
    } catch (error) {
      console.error('Error fetching lead emails:', error);
      res.status(500).json({ message: 'Failed to fetch emails' });
    }
  });

  // Get all emails for a lead (flat list)
  app.get('/api/crm/leads/:leadId/email-messages', isAuthenticated, async (req: any, res) => {
    try {
      const leadId = parseInt(req.params.leadId);
      const messages = await storage.getEmailMessages({ leadId });
      res.json(messages);
    } catch (error) {
      console.error('Error fetching lead email messages:', error);
      res.status(500).json({ message: 'Failed to fetch email messages' });
    }
  });

  // Send email from lead context
  app.post('/api/crm/leads/:leadId/emails/send', isAuthenticated, async (req: any, res) => {
    try {
      const leadId = parseInt(req.params.leadId);
      const userId = req.user.claims.sub;
      const { to, cc, bcc, subject, bodyHtml, bodyText, attachments, threadId: requestThreadId, isReply } = req.body;

      console.log('[Email Send] Starting email send - leadId:', leadId, 'threadId:', requestThreadId, 'isReply:', isReply);
      console.log('[Email Send] Attachments received:', attachments?.length || 0, JSON.stringify(attachments || []));

      if (!to || !subject || !bodyHtml) {
        return res.status(400).json({ message: 'Missing required fields: to, subject, bodyHtml' });
      }

      // Get sender's email config
      const emailConfig = await storage.getUserEmailConfig(userId);
      if (!emailConfig) {
        return res.status(400).json({ message: 'No email configuration found for user. Please contact admin.' });
      }

      console.log('[Email Send] Email config found, signature URL:', emailConfig.signatureImageUrl || 'none');

      // Check if Gmail is connected
      if (!emailConfig.isConnected || (!emailConfig.accessToken && !emailConfig.refreshToken)) {
        return res.status(400).json({ 
          message: 'Gmail is not connected. Please connect your Gmail account in Settings → Email Configuration to send emails.',
          requiresGmailConnect: true,
        });
      }

      // Get lead details for context
      const lead = await storage.getLead(leadId);
      if (!lead) {
        return res.status(404).json({ message: 'Lead not found' });
      }

      // Thread handling: 
      // - If replying to an existing thread (requestThreadId provided), use that thread
      // - If starting a new email (no requestThreadId), ALWAYS create a new thread
      let thread: any = null;
      
      if (requestThreadId && isReply) {
        // This is a reply to an existing thread - fetch and use it
        thread = await storage.getEmailThread(requestThreadId);
        console.log('[Email Send] Using existing thread for reply:', thread?.id);
      }
      
      if (!thread) {
        // Create a new thread for this email
        thread = await storage.createEmailThread({
          leadId,
          companyId: lead.companyId,
          subject,
          participantEmails: [emailConfig.companyEmail, ...(Array.isArray(to) ? to : [to])],
          status: 'active',
        });
        console.log('[Email Send] Created new thread:', thread.id, 'for subject:', subject);
      }

      // Actually send email via Gmail API with automatic token refresh
      let gmailResult: { messageId: string; threadId: string } | null = null;
      let emailStatus = 'pending';
      
      // Build final email body with signature if configured
      let finalBodyHtml = bodyHtml;
      let finalBodyText = bodyText || bodyHtml.replace(/<[^>]*>/g, '');
      let inlineAttachments: { contentId: string; base64Data: string; mimeType: string; filename: string }[] = [];
      let fileAttachments: { base64Data: string; mimeType: string; filename: string }[] = [];
      
      // Fetch signature image and prepare as inline attachment
      if (emailConfig.signatureImageUrl) {
        try {
          console.log('[Email] Attempting to load signature image:', emailConfig.signatureImageUrl);
          const objectStorageService = new ObjectStorageService();
          
          // Ensure the signature URL starts with /objects/
          let signaturePath = emailConfig.signatureImageUrl;
          if (!signaturePath.startsWith('/objects/')) {
            // Try to normalize the path if it's a full URL
            signaturePath = objectStorageService.normalizeObjectEntityPath(signaturePath);
            console.log('[Email] Normalized signature path:', signaturePath);
          }
          
          if (!signaturePath.startsWith('/objects/')) {
            console.error('[Email] Invalid signature path format:', signaturePath);
            throw new Error('Invalid signature path format');
          }
          
          const signatureFile = await objectStorageService.getObjectEntityFile(signaturePath);
          
          // Download file content as buffer
          const [fileContent] = await signatureFile.download();
          const base64Data = fileContent.toString('base64');
          
          // Get file metadata for mime type
          const [metadata] = await signatureFile.getMetadata();
          const mimeType = metadata.contentType || 'image/png';
          
          // Add to inline attachments
          inlineAttachments.push({
            contentId: 'signature_image',
            base64Data,
            mimeType,
            filename: 'signature.png',
          });
          
          // Append signature to HTML body using CID reference
          finalBodyHtml = `${bodyHtml}
            <br><br>
            <table cellpadding="0" cellspacing="0" border="0" style="margin-top: 20px;">
              <tr>
                <td>
                  <img src="cid:signature_image" alt="${emailConfig.displayName || 'Signature'}" style="max-width: 300px; max-height: 150px; display: block;" />
                </td>
              </tr>
            </table>`;
          
          // Add text signature placeholder
          finalBodyText = `${finalBodyText}\n\n---\n${emailConfig.displayName || 'Signature'}`;
          
          console.log('[Email] Signature image loaded successfully, size:', fileContent.length, 'bytes, mimeType:', mimeType);
        } catch (signatureError: any) {
          console.error('[Email] Failed to load signature image:', signatureError?.message || signatureError);
          // Continue without signature if loading fails
        }
      } else {
        console.log('[Email] No signature configured for this email config');
      }

      // Fetch file attachments from object storage
      if (attachments && Array.isArray(attachments) && attachments.length > 0) {
        console.log('[Email] Processing', attachments.length, 'file attachments');
        const objectStorageService = new ObjectStorageService();
        
        for (const att of attachments) {
          try {
            if (!att.fileUrl) {
              console.log('[Email] Skipping attachment without fileUrl:', att.fileName);
              continue;
            }
            
            console.log('[Email] Loading attachment:', att.fileName, 'from path:', att.fileUrl);
            
            // Ensure the attachment URL starts with /objects/
            let attachmentPath = att.fileUrl;
            if (!attachmentPath.startsWith('/objects/')) {
              // Try to normalize the path if it's a full URL
              attachmentPath = objectStorageService.normalizeObjectEntityPath(attachmentPath);
              console.log('[Email] Normalized attachment path:', attachmentPath);
            }
            
            if (!attachmentPath.startsWith('/objects/')) {
              console.error('[Email] Invalid attachment path format:', attachmentPath);
              continue;
            }
            
            const attachmentFile = await objectStorageService.getObjectEntityFile(attachmentPath);
            const [fileContent] = await attachmentFile.download();
            const base64Data = fileContent.toString('base64');
            
            // Get file metadata for mime type
            const [metadata] = await attachmentFile.getMetadata();
            const mimeType = metadata.contentType || 'application/octet-stream';
            
            fileAttachments.push({
              base64Data,
              mimeType,
              filename: att.fileName || 'attachment',
            });
            
            console.log('[Email] File attachment loaded successfully:', att.fileName, 'size:', fileContent.length, 'bytes, mimeType:', mimeType);
          } catch (attError: any) {
            console.error('[Email] Failed to load attachment:', att.fileName, 'Error:', attError?.message || attError);
            // Continue with other attachments even if one fails
          }
        }
        
        console.log('[Email] Successfully loaded', fileAttachments.length, 'of', attachments.length, 'attachments');
      } else {
        console.log('[Email] No file attachments to process');
      }

      try {
        // Get valid access token (refreshes if expired)
        const validAccessToken = await gmailApi.ensureValidAccessToken(
          {
            id: emailConfig.id,
            accessToken: emailConfig.accessToken,
            refreshToken: emailConfig.refreshToken,
            tokenExpiresAt: emailConfig.tokenExpiresAt,
          },
          async (configId, tokens) => {
            // Update tokens in database
            await storage.updateUserEmailConfig(configId, {
              accessToken: tokens.accessToken,
              refreshToken: tokens.refreshToken,
              tokenExpiresAt: tokens.tokenExpiresAt,
            });
          }
        );

        // If replying to an existing thread that has a Gmail threadId, use replyToEmail
        // Otherwise, send a new email
        if (isReply && thread.threadId) {
          console.log('[Email Send] Replying to existing Gmail thread:', thread.threadId);
          
          // Get the parent message's RFC Message-ID header for proper threading
          // This is critical - recipients will only see the reply in the same thread
          // if we include the correct In-Reply-To and References headers
          let inReplyTo: string | undefined;
          let references: string | undefined;
          
          const existingMessages = await storage.getEmailMessages({ threadId: thread.id });
          if (existingMessages.length > 0) {
            // Sort messages by date (most recent first)
            const sortedMessages = existingMessages.sort((a, b) => 
              (b.sentAt || b.receivedAt || new Date(0)).getTime() - 
              (a.sentAt || a.receivedAt || new Date(0)).getTime()
            );
            
            // For proper email threading, we need to reply to the correct message:
            // 1. First priority: the most recent INBOUND message (customer's reply)
            // 2. Second priority: any outbound message we sent
            // 3. Fallback: any message in the thread
            const inboundMessages = sortedMessages.filter(m => m.direction === 'inbound');
            const outboundMessages = sortedMessages.filter(m => m.direction === 'outbound');
            
            // Build a prioritized list of candidate messages to try
            const candidateMessages = [
              ...inboundMessages,  // Prefer inbound messages first
              ...outboundMessages, // Then outbound messages
              ...sortedMessages,   // Then any message as fallback
            ];
            
            // Remove duplicates while preserving order
            const seenIds = new Set<number>();
            const uniqueCandidates = candidateMessages.filter(m => {
              if (seenIds.has(m.id)) return false;
              seenIds.add(m.id);
              return true;
            });
            
            console.log('[Email Send] Candidate messages for threading:', uniqueCandidates.map(m => ({
              id: m.id,
              direction: m.direction,
              hasMessageIdHeader: !!m.messageIdHeader,
              hasGmailId: !!m.messageId,
            })));
            
            let parentMessageIdHeader: string | undefined;
            let parentReferencesHeader: string | undefined;
            
            // Try each candidate message until we find one with a valid Message-ID header
            for (const candidate of uniqueCandidates) {
              // First, check if we already have the Message-ID header stored
              if (candidate.messageIdHeader) {
                parentMessageIdHeader = candidate.messageIdHeader;
                parentReferencesHeader = candidate.referencesHeader || undefined;
                console.log('[Email Send] Found stored Message-ID header from message', candidate.id, ':', parentMessageIdHeader);
                break;
              }
              
              // If not stored but we have a Gmail message ID, try to fetch it
              if (candidate.messageId) {
                console.log('[Email Send] Fetching Message-ID header from Gmail for message', candidate.id, ', Gmail ID:', candidate.messageId);
                try {
                  const gmailMessage = await gmailApi.getEmail(validAccessToken, candidate.messageId);
                  const parsed = gmailApi.parseEmailMessage(gmailMessage);
                  
                  if (parsed.messageIdHeader) {
                    parentMessageIdHeader = parsed.messageIdHeader;
                    parentReferencesHeader = parsed.referencesHeader || undefined;
                    
                    // Store for future use
                    await storage.updateEmailMessage(candidate.id, {
                      messageIdHeader: parentMessageIdHeader,
                      referencesHeader: parentReferencesHeader || undefined,
                    });
                    console.log('[Email Send] Fetched and stored Message-ID header:', parentMessageIdHeader);
                    break;
                  } else {
                    console.log('[Email Send] Gmail message', candidate.messageId, 'has no Message-ID header');
                  }
                } catch (fetchErr) {
                  console.error('[Email Send] Failed to fetch Message-ID from Gmail for message', candidate.id, ':', fetchErr);
                  // Continue to next candidate
                }
              }
            }
            
            if (parentMessageIdHeader) {
              inReplyTo = parentMessageIdHeader;
              console.log('[Email Send] Using In-Reply-To:', inReplyTo);
              
              // Build References chain from parent's references + parent's Message-ID
              // Deduplicate Message-IDs to avoid repetition
              if (parentReferencesHeader) {
                // Parse existing references and add parent Message-ID if not already present
                const existingRefs = parentReferencesHeader.split(/\s+/).filter(ref => ref.trim());
                if (!existingRefs.includes(parentMessageIdHeader)) {
                  existingRefs.push(parentMessageIdHeader);
                }
                references = existingRefs.join(' ');
              } else {
                references = parentMessageIdHeader;
              }
              console.log('[Email Send] Using References:', references);
              console.log('[Email Send] Final threading headers - In-Reply-To:', inReplyTo, 'References:', references);
            } else {
              console.log('[Email Send] WARNING: Could not obtain any Message-ID header from any message - threading may not work for recipients');
            }
          }
          
          gmailResult = await gmailApi.replyToEmail(validAccessToken, thread.threadId, {
            to: Array.isArray(to) ? to : [to],
            cc: cc || [],
            bcc: bcc || [],
            subject,
            bodyHtml: finalBodyHtml,
            bodyText: finalBodyText,
            fromName: emailConfig.displayName || undefined,
            fromEmail: emailConfig.companyEmail,
            inReplyTo,
            references,
            inlineAttachments: inlineAttachments.length > 0 ? inlineAttachments : undefined,
            fileAttachments: fileAttachments.length > 0 ? fileAttachments : undefined,
          });
        } else {
          console.log('[Email Send] Sending new email (new thread)');
          gmailResult = await gmailApi.sendEmail(validAccessToken, {
            to: Array.isArray(to) ? to : [to],
            cc: cc || [],
            bcc: bcc || [],
            subject,
            bodyHtml: finalBodyHtml,
            bodyText: finalBodyText,
            fromName: emailConfig.displayName || undefined,
            fromEmail: emailConfig.companyEmail,
            inlineAttachments: inlineAttachments.length > 0 ? inlineAttachments : undefined,
            fileAttachments: fileAttachments.length > 0 ? fileAttachments : undefined,
          });
        }
        emailStatus = 'sent';
        console.log('Email sent successfully via Gmail API:', gmailResult);
      } catch (gmailError: any) {
        console.error('Gmail API error:', gmailError);
        
        // Check if it's an auth error that requires reconnection
        if (gmailError.message?.includes('authorization revoked') || 
            gmailError.message?.includes('invalid_grant') ||
            gmailError.message?.includes('reconnect')) {
          // Mark email config as disconnected
          await storage.updateUserEmailConfig(emailConfig.id, { 
            isConnected: false,
            accessToken: null,
          });
          return res.status(401).json({ 
            message: 'Gmail authorization has expired or been revoked. Please reconnect your Gmail account in Settings.',
            requiresGmailConnect: true,
          });
        }
        
        emailStatus = 'failed';
        return res.status(500).json({ 
          message: 'Failed to send email via Gmail. Please try again.',
          error: gmailError.message,
        });
      }

      // After sending, fetch the sent message to get its RFC Message-ID header
      // This is essential for proper email threading with recipients
      let sentMessageIdHeader: string | undefined;
      let sentReferencesHeader: string | undefined;
      
      if (gmailResult?.messageId) {
        try {
          const validAccessTokenForFetch = await gmailApi.ensureValidAccessToken(
            {
              id: emailConfig.id,
              accessToken: emailConfig.accessToken,
              refreshToken: emailConfig.refreshToken,
              tokenExpiresAt: emailConfig.tokenExpiresAt,
            },
            async (configId, tokens) => {
              await storage.updateUserEmailConfig(configId, {
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                tokenExpiresAt: tokens.tokenExpiresAt,
              });
            }
          );
          
          const sentGmailMessage = await gmailApi.getEmail(validAccessTokenForFetch, gmailResult.messageId);
          const parsedSentMessage = gmailApi.parseEmailMessage(sentGmailMessage);
          sentMessageIdHeader = parsedSentMessage.messageIdHeader || undefined;
          sentReferencesHeader = parsedSentMessage.referencesHeader || undefined;
          console.log('[Email Send] Captured sent message Message-ID header:', sentMessageIdHeader);
        } catch (fetchError) {
          console.error('[Email Send] Could not fetch sent message for Message-ID header:', fetchError);
        }
      }
      
      // Store email message in database with Message-ID header for threading
      const message = await storage.createEmailMessage({
        messageId: gmailResult?.messageId || undefined,
        messageIdHeader: sentMessageIdHeader,
        referencesHeader: sentReferencesHeader,
        threadId: thread.id,
        leadId,
        direction: 'outbound',
        fromEmail: emailConfig.companyEmail,
        fromName: emailConfig.displayName || undefined,
        toEmails: Array.isArray(to) ? to : [to],
        ccEmails: cc || [],
        bccEmails: bcc || [],
        subject,
        bodyHtml: finalBodyHtml,
        bodyText: finalBodyText,
        sentAt: new Date(),
        status: emailStatus,
        senderId: userId,
      });

      // Update thread with Gmail thread ID if we got one
      if (gmailResult?.threadId && !thread.threadId) {
        await storage.updateEmailThread(thread.id, { threadId: gmailResult.threadId });
      }

      // Create lead activity for the email
      await storage.createLeadActivity({
        leadId,
        activityType: 'email',
        subject: `Email sent: ${subject}`,
        description: `Email sent to ${Array.isArray(to) ? to.join(', ') : to}`,
        createdBy: userId,
      });

      res.status(201).json({ 
        success: true, 
        message: 'Email sent successfully via Gmail',
        emailMessage: message,
        thread,
        gmailMessageId: gmailResult?.messageId,
      });
    } catch (error) {
      console.error('Error sending email:', error);
      res.status(500).json({ message: 'Failed to send email' });
    }
  });

  // Record incoming email (webhook or manual)
  app.post('/api/emails/receive', isAuthenticated, async (req: any, res) => {
    try {
      const { leadId, threadId, fromEmail, fromName, subject, bodyHtml, bodyText, externalMessageId, externalThreadId } = req.body;

      // Find or create thread
      let thread;
      if (externalThreadId) {
        thread = await storage.getEmailThreadByExternalId(externalThreadId);
      }
      
      if (!thread && threadId) {
        thread = await storage.getEmailThread(threadId);
      }
      
      if (!thread && leadId) {
        const lead = await storage.getLead(leadId);
        if (lead) {
          thread = await storage.createEmailThread({
            threadId: externalThreadId || undefined,
            leadId,
            companyId: lead.companyId,
            subject,
            participantEmails: [fromEmail],
            status: 'active',
          });
        }
      }

      if (!thread) {
        return res.status(400).json({ message: 'Could not find or create email thread' });
      }

      // Store the message
      const message = await storage.createEmailMessage({
        messageId: externalMessageId || undefined,
        threadId: thread.id,
        leadId: thread.leadId || undefined,
        direction: 'inbound',
        fromEmail,
        fromName,
        toEmails: [],
        subject,
        bodyHtml,
        bodyText,
        receivedAt: new Date(),
        status: 'received',
      });

      // Create activity if linked to lead
      if (thread.leadId) {
        await storage.createLeadActivity({
          leadId: thread.leadId,
          activityType: 'email',
          subject: `Email received: ${subject}`,
          description: `Email from ${fromName || fromEmail}`,
          createdBy: 'system',
        });
      }

      res.status(201).json({ success: true, message, thread });
    } catch (error) {
      console.error('Error receiving email:', error);
      res.status(500).json({ message: 'Failed to record email' });
    }
  });

  // Sync email replies from Gmail for a lead's thread
  app.post('/api/crm/leads/:leadId/emails/sync', isAuthenticated, async (req: any, res) => {
    try {
      const leadId = parseInt(req.params.leadId);
      const userId = req.user?.id || req.user?.claims?.sub;

      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      // Get lead and its email thread
      const lead = await storage.getLead(leadId);
      if (!lead) {
        return res.status(404).json({ message: 'Lead not found' });
      }

      const threads = await storage.getEmailThreads({ leadId });
      if (threads.length === 0) {
        return res.json({ success: true, message: 'No email threads to sync', newMessages: 0 });
      }

      // Get user's email config for Gmail access
      const emailConfig = await storage.getUserEmailConfig(userId);
      if (!emailConfig || !emailConfig.isConnected || !emailConfig.accessToken) {
        return res.status(400).json({ 
          message: 'Gmail not connected. Please connect your Gmail account in Settings.',
          requiresGmailConnect: true,
        });
      }

      // Get valid access token
      const validAccessToken = await gmailApi.ensureValidAccessToken(
        {
          id: emailConfig.id,
          accessToken: emailConfig.accessToken,
          refreshToken: emailConfig.refreshToken,
          tokenExpiresAt: emailConfig.tokenExpiresAt,
        },
        async (configId, tokens) => {
          await storage.updateUserEmailConfig(configId, {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            tokenExpiresAt: tokens.tokenExpiresAt,
          });
        }
      );

      let newMessagesCount = 0;

      // For each thread with a Gmail thread ID, fetch messages
      for (const thread of threads) {
        if (!thread.threadId) continue;

        try {
          const gmailThread = await gmailApi.getThread(validAccessToken, thread.threadId);
          
          if (!gmailThread.messages) continue;

          // Get existing message IDs in our database
          const existingMessages = await storage.getEmailMessages({ threadId: thread.id });
          const existingMessageIds = new Set(existingMessages.map(m => m.messageId).filter(Boolean));

          for (const gmailMessage of gmailThread.messages) {
            if (!gmailMessage.id || existingMessageIds.has(gmailMessage.id)) continue;

            const parsedMessage = gmailApi.parseEmailMessage(gmailMessage);
            
            // Skip if this is an outbound message from our company email
            if (parsedMessage.from.email === emailConfig.companyEmail) continue;

            // This is an inbound reply from customer
            await storage.createEmailMessage({
              messageId: gmailMessage.id,
              messageIdHeader: parsedMessage.messageIdHeader || undefined,
              referencesHeader: parsedMessage.referencesHeader || undefined,
              threadId: thread.id,
              leadId,
              direction: 'inbound',
              fromEmail: parsedMessage.from.email,
              fromName: parsedMessage.from.name || undefined,
              toEmails: parsedMessage.to,
              ccEmails: parsedMessage.cc,
              subject: parsedMessage.subject,
              bodyHtml: parsedMessage.bodyHtml,
              bodyText: parsedMessage.bodyText,
              receivedAt: parsedMessage.date,
              status: 'received',
            });

            // Create lead activity for the received email
            await storage.createLeadActivity({
              leadId,
              activityType: 'email',
              subject: `Email received: ${parsedMessage.subject}`,
              description: `Reply from ${parsedMessage.from.name || parsedMessage.from.email}`,
              createdBy: 'system',
            });

            newMessagesCount++;
          }
        } catch (threadError) {
          console.error(`Error syncing thread ${thread.threadId}:`, threadError);
          // Continue with other threads
        }
      }

      res.json({ 
        success: true, 
        message: `Synced ${newMessagesCount} new email replies`,
        newMessages: newMessagesCount,
      });
    } catch (error: any) {
      console.error('Error syncing emails:', error);
      
      if (error.message?.includes('authorization') || error.message?.includes('invalid_grant')) {
        return res.status(401).json({ 
          message: 'Gmail authorization expired. Please reconnect your Gmail account.',
          requiresGmailConnect: true,
        });
      }
      
      res.status(500).json({ message: 'Failed to sync emails' });
    }
  });

  // Mark all unread emails for a lead as read
  app.post('/api/crm/leads/:leadId/emails/mark-read', isAuthenticated, async (req: any, res) => {
    try {
      const leadId = parseInt(req.params.leadId);
      const userId = req.user?.id || req.user?.claims?.sub;

      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      // Verify lead exists
      const lead = await storage.getLead(leadId);
      if (!lead) {
        return res.status(404).json({ message: 'Lead not found' });
      }

      // Mark all unread inbound emails for this lead as read
      const markedCount = await storage.markLeadEmailsAsRead(leadId);

      res.json({ 
        success: true, 
        message: `Marked ${markedCount} email(s) as read`,
        markedCount,
      });
    } catch (error: any) {
      console.error('Error marking emails as read:', error);
      res.status(500).json({ message: 'Failed to mark emails as read' });
    }
  });

  // Get sample requests for a lead
  app.get('/api/crm/leads/:leadId/sample-requests', isAuthenticated, async (req: any, res) => {
    try {
      const leadId = parseInt(req.params.leadId);
      const userId = req.user?.id || req.user?.claims?.sub;

      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      // Verify lead exists
      const lead = await storage.getLead(leadId);
      if (!lead) {
        return res.status(404).json({ message: 'Lead not found' });
      }

      const result = await storage.getSampleRequests({ leadId });
      res.json(result);
    } catch (error: any) {
      console.error('Error fetching lead sample requests:', error);
      res.status(500).json({ message: 'Failed to fetch sample requests' });
    }
  });

  // Create sample request for a lead
  app.post('/api/crm/leads/:leadId/sample-requests', isAuthenticated, async (req: any, res) => {
    try {
      const leadId = parseInt(req.params.leadId);
      const userId = req.user?.id || req.user?.claims?.sub;

      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      // Verify lead exists and get lead details
      const lead = await storage.getLead(leadId);
      if (!lead) {
        return res.status(404).json({ message: 'Lead not found' });
      }

      // Check user has permission (admin or assigned sales rep)
      const user = await storage.getUser(userId);
      const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
      const isAssignedSalesRep = lead.assignedSalesRep === userId;
      
      if (!isAdmin && !isAssignedSalesRep) {
        return res.status(403).json({ message: 'Not authorized to create sample requests for this lead' });
      }

      // Create sample request with lead link
      const sampleRequest = await storage.createSampleRequest({
        ...req.body,
        leadId,
      });

      // Log activity
      await storage.createLeadActivity({
        leadId,
        type: 'sample_request',
        title: 'Sample Request Created',
        description: `Sample request ${sampleRequest.requestId} created for product`,
        createdBy: userId,
      });

      res.status(201).json(sampleRequest);
    } catch (error: any) {
      console.error('Error creating lead sample request:', error);
      res.status(500).json({ message: 'Failed to create sample request' });
    }
  });

  // Get quotations for a lead
  app.get('/api/crm/leads/:leadId/quotations', isAuthenticated, async (req: any, res) => {
    try {
      const leadId = parseInt(req.params.leadId);
      const userId = req.user?.id || req.user?.claims?.sub;

      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      // Verify lead exists
      const lead = await storage.getLead(leadId);
      if (!lead) {
        return res.status(404).json({ message: 'Lead not found' });
      }

      const result = await storage.getQuotations({ leadId });
      res.json(result);
    } catch (error: any) {
      console.error('Error fetching lead quotations:', error);
      res.status(500).json({ message: 'Failed to fetch quotations' });
    }
  });

  // Create quotation for a lead
  app.post('/api/crm/leads/:leadId/quotations', isAuthenticated, async (req: any, res) => {
    try {
      const leadId = parseInt(req.params.leadId);
      const userId = req.user?.id || req.user?.claims?.sub;

      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      // Verify lead exists and get lead details
      const lead = await storage.getLead(leadId);
      if (!lead) {
        return res.status(404).json({ message: 'Lead not found' });
      }

      // Check user has permission (admin or assigned sales rep)
      const user = await storage.getUser(userId);
      const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
      const isAssignedSalesRep = lead.assignedSalesRep === userId;
      
      if (!isAdmin && !isAssignedSalesRep) {
        return res.status(403).json({ message: 'Not authorized to create quotations for this lead' });
      }

      // Create quotation with lead link
      // Convert validUntil from string to Date if present
      const quotationData = {
        ...req.body,
        leadId,
        createdBy: userId,
      };
      
      if (quotationData.validUntil && typeof quotationData.validUntil === 'string') {
        quotationData.validUntil = new Date(quotationData.validUntil);
      }
      
      const quotation = await storage.createQuotation(quotationData);

      // Log activity
      await storage.createLeadActivity({
        leadId,
        activityType: 'quote_created',
        subject: 'Quotation Created',
        description: `Quotation ${quotation.quotationId} created with value ${req.body.currency || 'USD'} ${req.body.totalAmount || 0}`,
        createdBy: userId,
      });

      res.status(201).json(quotation);
    } catch (error: any) {
      console.error('Error creating lead quotation:', error);
      res.status(500).json({ message: 'Failed to create quotation' });
    }
  });

  // Send quotation via email
  app.post('/api/crm/leads/:leadId/quotations/:quotationId/send', isAuthenticated, async (req: any, res) => {
    try {
      const leadId = parseInt(req.params.leadId);
      const quotationId = parseInt(req.params.quotationId);
      const userId = req.user?.id || req.user?.claims?.sub;

      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      // Verify lead exists
      const lead = await storage.getLead(leadId);
      if (!lead) {
        return res.status(404).json({ message: 'Lead not found' });
      }

      // Verify quotation exists and belongs to this lead
      const quotation = await storage.getQuotation(quotationId);
      if (!quotation || quotation.leadId !== leadId) {
        return res.status(404).json({ message: 'Quotation not found or does not belong to this lead' });
      }

      // Check user has permission (admin or assigned sales rep)
      const user = await storage.getUser(userId);
      const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
      const isAssignedSalesRep = lead.assignedSalesRep === userId;
      
      if (!isAdmin && !isAssignedSalesRep) {
        return res.status(403).json({ message: 'Not authorized to send quotations for this lead' });
      }

      // Get email configuration for the sender
      const emailConfig = await storage.getUserEmailConfig(userId);
      if (!emailConfig?.accessToken) {
        return res.status(400).json({ 
          message: 'Gmail not connected. Please connect your Gmail account in Email Settings.',
          requiresGmailConnect: true,
        });
      }

      // Get company contact email for the lead
      const { email, subject, body, attachPdf, threadId } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: 'Recipient email is required' });
      }

      // Get product name from lead's products interested
      let productName = 'your inquiry';
      if (lead.productsInterested && lead.productsInterested.length > 0) {
        const productIds = lead.productsInterested;
        const productsResult = await db.select({ name: products.name }).from(products).where(inArray(products.id, productIds));
        productName = productsResult.map(p => p.name).join(', ') || 'your inquiry';
      }
      
      // Get customer/contact name for greeting
      const contactName = lead.contactPerson?.name || lead.company?.companyName || 'Valued Customer';
      const companyName = lead.company?.companyName || '';
      
      // Get sales person name for signature
      const salesRepName = user?.firstName && user?.lastName 
        ? `${user.firstName} ${user.lastName}` 
        : emailConfig.displayName || 'Sales Team';
      
      // Generate PDF if attachPdf is true (default to true)
      let pdfAttachment: { base64Data: string; mimeType: string; filename: string } | null = null;
      if (attachPdf !== false) {
        try {
          const { generateQuotationPDF } = await import('./pdf-generator');
          
          // Fetch quotation items
          const quotationItemsResult = await db
            .select()
            .from(quotationItems)
            .where(eq(quotationItems.quotationId, quotationId));
          
          const firstItem = quotationItemsResult.length > 0 ? quotationItemsResult[0] : null;
          
          // Prepare customer data
          const customerData = {
            name: companyName,
            contactPerson: lead.contactPerson?.name || '',
            email: lead.contactPerson?.email || lead.company?.primaryEmail || email,
            companyName: companyName,
            phone: lead.contactPerson?.phone || lead.company?.primaryPhone || '',
            address: lead.company?.addressStreet || '',
            city: lead.company?.addressCity || '',
            state: lead.company?.addressState || '',
            country: lead.company?.addressCountry || '',
            postalCode: lead.company?.addressZip || '',
            salesPersonName: salesRepName,
          };
          
          // Get quantity and unit from lead
          const quantity = firstItem?.quantity || lead.requiredQuantity || '1';
          const unit = firstItem?.unit || lead.unit || 'units';
          const totalAmount = quotation.totalAmount || '0';
          const qty = parseFloat(String(quantity));
          const unitPrice = firstItem?.unitPrice || (qty > 0 ? (parseFloat(totalAmount) / qty).toFixed(2) : '0');
          
          // Prepare quotation data
          const quotationData = {
            id: quotation.id,
            quotationId: quotation.quotationId,
            quotationDate: quotation.createdAt,
            validUntil: quotation.validUntil,
            productName: productName,
            quantity: String(quantity),
            unit: unit,
            unitPrice: String(unitPrice),
            totalAmount: totalAmount,
            currency: quotation.currency || 'USD',
            terms: quotation.terms || '',
            notes: quotation.notes || '',
            paymentTerms: 'As per agreement',
            deliveryTerms: quotation.priceType || 'Ex-Works',
            subtotal: quotation.subtotal,
            discountPercent: quotation.discountPercent,
            discountAmount: quotation.discountAmount,
            includeGst: quotation.includeGst,
            gstNumber: quotation.gstNumber,
            gstPercentage: quotation.gstPercentage,
            gstAmount: quotation.gstAmount,
            sellerGstin: quotation.sellerGstin,
            sellerPan: quotation.sellerPan,
            buyerGstin: quotation.buyerGstin,
            buyerPan: quotation.buyerPan,
            customerCompanyName: quotation.customerCompanyName,
            customerAddress: quotation.customerAddress,
            customerCity: quotation.customerCity,
            customerState: quotation.customerState,
            customerCountry: quotation.customerCountry,
            customerPostalCode: quotation.customerPostalCode,
            placeOfSupply: quotation.placeOfSupply,
            countryOfSupply: quotation.countryOfSupply,
          };
          
          const pdfBuffer = await generateQuotationPDF(quotationData, customerData);
          pdfAttachment = {
            base64Data: pdfBuffer.toString('base64'),
            mimeType: 'application/pdf',
            filename: `Quotation-${quotation.quotationId}.pdf`,
          };
        } catch (pdfError) {
          console.error('Error generating PDF for email attachment:', pdfError);
          // Continue without attachment if PDF generation fails
        }
      }
      
      // Build proper email template
      const emailSubject = subject || `Quotation ${quotation.quotationId} - ${productName}`;
      
      // Use provided body or generate a proper professional template (without signature - will be added via image)
      let emailBodyContent = body || `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <p>Dear ${contactName},</p>
  
  <p>Greetings from Bright Fame Organic!</p>
  
  <p>Thank you for your interest in <strong>${productName}</strong>. We are pleased to send you the quotation as requested.</p>
  
  <p>Please find the quotation attached to this email for your reference.</p>
  
  <p>If you have any queries or require further clarification, please feel free to reply to this email or reach out to us directly.</p>
  
  <p>We look forward to hearing from you.</p>
</div>
`;
      
      let emailBodyTextContent = `Dear ${contactName},

Greetings from Bright Fame Organic!

Thank you for your interest in ${productName}. We are pleased to send you the quotation as requested.

Please find the quotation attached to this email for your reference.

If you have any queries or require further clarification, please feel free to reply to this email or reach out to us directly.

We look forward to hearing from you.`;

      // Prepare inline attachments for signature image
      let inlineAttachments: { contentId: string; base64Data: string; mimeType: string; filename: string }[] = [];
      
      // Fetch signature image and prepare as inline attachment (same as regular email)
      if (emailConfig.signatureImageUrl) {
        try {
          console.log('[Quotation Email] Attempting to load signature image:', emailConfig.signatureImageUrl);
          const objectStorageService = new ObjectStorageService();
          
          // Ensure the signature URL starts with /objects/
          let signaturePath = emailConfig.signatureImageUrl;
          if (!signaturePath.startsWith('/objects/')) {
            signaturePath = objectStorageService.normalizeObjectEntityPath(signaturePath);
            console.log('[Quotation Email] Normalized signature path:', signaturePath);
          }
          
          if (!signaturePath.startsWith('/objects/')) {
            console.error('[Quotation Email] Invalid signature path format:', signaturePath);
            throw new Error('Invalid signature path format');
          }
          
          const signatureFile = await objectStorageService.getObjectEntityFile(signaturePath);
          
          // Download file content as buffer
          const [fileContent] = await signatureFile.download();
          const base64Data = fileContent.toString('base64');
          
          // Get file metadata for mime type
          const [metadata] = await signatureFile.getMetadata();
          const mimeType = metadata.contentType || 'image/png';
          
          // Add to inline attachments
          inlineAttachments.push({
            contentId: 'signature_image',
            base64Data,
            mimeType,
            filename: 'signature.png',
          });
          
          // Append signature image to HTML body using CID reference
          emailBodyContent = `${emailBodyContent}
            <br><br>
            <table cellpadding="0" cellspacing="0" border="0" style="margin-top: 20px;">
              <tr>
                <td>
                  <img src="cid:signature_image" alt="${emailConfig.displayName || 'Signature'}" style="max-width: 300px; max-height: 150px; display: block;" />
                </td>
              </tr>
            </table>`;
          
          // Add text signature placeholder
          emailBodyTextContent = `${emailBodyTextContent}\n\n---\n${emailConfig.displayName || salesRepName}\nBright Fame Organic Pvt. Ltd.`;
          
          console.log('[Quotation Email] Signature image loaded successfully, size:', fileContent.length, 'bytes');
        } catch (signatureError: any) {
          console.error('[Quotation Email] Failed to load signature image:', signatureError?.message || signatureError);
          // Fallback to text signature if image loading fails
          emailBodyContent = `${emailBodyContent}
  <p>Best Regards,<br/>
  <strong>${salesRepName}</strong><br/>
  Bright Fame Organic Pvt. Ltd.<br/>
  Email: ${emailConfig.companyEmail}<br/>
  Phone: +91-7249847439</p>`;
          emailBodyTextContent = `${emailBodyTextContent}\n\nBest Regards,\n${salesRepName}\nBright Fame Organic Pvt. Ltd.\nEmail: ${emailConfig.companyEmail}\nPhone: +91-7249847439`;
        }
      } else {
        // No signature image configured - use text fallback
        console.log('[Quotation Email] No signature configured, using text fallback');
        emailBodyContent = `${emailBodyContent}
  <p>Best Regards,<br/>
  <strong>${salesRepName}</strong><br/>
  Bright Fame Organic Pvt. Ltd.<br/>
  Email: ${emailConfig.companyEmail}<br/>
  Phone: +91-7249847439</p>`;
        emailBodyTextContent = `${emailBodyTextContent}\n\nBest Regards,\n${salesRepName}\nBright Fame Organic Pvt. Ltd.\nEmail: ${emailConfig.companyEmail}\nPhone: +91-7249847439`;
      }

      let emailSendResult: { messageId: string; threadId: string };
      
      const emailOptions: any = {
        to: Array.isArray(email) ? email : [email],
        cc: [],
        bcc: [],
        subject: emailSubject,
        bodyHtml: emailBodyContent,
        bodyText: emailBodyTextContent,
        fromName: emailConfig.displayName || undefined,
        fromEmail: emailConfig.companyEmail,
      };
      
      // Add inline attachments (signature image)
      if (inlineAttachments.length > 0) {
        emailOptions.inlineAttachments = inlineAttachments;
      }
      
      // Add PDF attachment if generated
      if (pdfAttachment) {
        emailOptions.fileAttachments = [pdfAttachment];
      }
      
      // If threadId is provided, try to get the original message for proper threading
      let actualThreadId = threadId;
      let threadFound = false;
      
      if (threadId) {
        try {
          // First, try to get the thread directly
          const thread = await gmailApi.getThread(emailConfig.accessToken, threadId);
          if (thread && thread.messages && thread.messages.length > 0) {
            threadFound = true;
            // Get the last message in the thread for proper reply headers
            const lastMessage = thread.messages[thread.messages.length - 1];
            if (lastMessage && lastMessage.payload?.headers) {
              // Find Message-ID header from the last message
              const headers = lastMessage.payload.headers;
              const messageIdHeader = headers.find((h: any) => h.name?.toLowerCase() === 'message-id');
              const referencesHeader = headers.find((h: any) => h.name?.toLowerCase() === 'references');
              const subjectHeader = headers.find((h: any) => h.name?.toLowerCase() === 'subject');
              
              if (messageIdHeader?.value) {
                emailOptions.inReplyTo = messageIdHeader.value;
                // Build references chain
                if (referencesHeader?.value) {
                  emailOptions.references = `${referencesHeader.value} ${messageIdHeader.value}`;
                } else {
                  emailOptions.references = messageIdHeader.value;
                }
              }
              
              // Also ensure subject starts with "Re:" if it's a reply to maintain thread
              if (subjectHeader?.value && !emailOptions.subject.toLowerCase().startsWith('re:')) {
                const originalSubject = subjectHeader.value.replace(/^(re:\s*)+/i, '');
                emailOptions.subject = `Re: ${originalSubject}`;
              }
            }
            console.log('Thread reply headers set:', { 
              inReplyTo: emailOptions.inReplyTo ? 'set' : 'not set', 
              references: emailOptions.references ? 'set' : 'not set',
              subject: emailOptions.subject 
            });
          }
        } catch (threadFetchError: any) {
          console.log('Direct thread lookup failed, searching by customer email...');
          
          // Thread not found directly - try to find by searching for customer email
          try {
            const searchResults = await gmailApi.searchEmailsByContact(emailConfig.accessToken, email, { maxResults: 10 });
            if (searchResults.messages && searchResults.messages.length > 0) {
              // Get the most recent message's thread ID
              const recentMessage = searchResults.messages[0];
              if (recentMessage.threadId) {
                actualThreadId = recentMessage.threadId;
                console.log('Found thread via email search:', actualThreadId);
                
                // Fetch the thread to get reply headers
                const foundThread = await gmailApi.getThread(emailConfig.accessToken, actualThreadId);
                if (foundThread && foundThread.messages && foundThread.messages.length > 0) {
                  threadFound = true;
                  const lastMessage = foundThread.messages[foundThread.messages.length - 1];
                  if (lastMessage && lastMessage.payload?.headers) {
                    const headers = lastMessage.payload.headers;
                    const messageIdHeader = headers.find((h: any) => h.name?.toLowerCase() === 'message-id');
                    const referencesHeader = headers.find((h: any) => h.name?.toLowerCase() === 'references');
                    const subjectHeader = headers.find((h: any) => h.name?.toLowerCase() === 'subject');
                    
                    if (messageIdHeader?.value) {
                      emailOptions.inReplyTo = messageIdHeader.value;
                      if (referencesHeader?.value) {
                        emailOptions.references = `${referencesHeader.value} ${messageIdHeader.value}`;
                      } else {
                        emailOptions.references = messageIdHeader.value;
                      }
                    }
                    
                    if (subjectHeader?.value && !emailOptions.subject.toLowerCase().startsWith('re:')) {
                      const originalSubject = subjectHeader.value.replace(/^(re:\s*)+/i, '');
                      emailOptions.subject = `Re: ${originalSubject}`;
                    }
                  }
                }
              }
            }
          } catch (searchError) {
            console.log('Email search also failed:', searchError);
          }
        }
      }
      
      // Send email - either as reply or new email
      if (actualThreadId && threadFound) {
        try {
          emailSendResult = await gmailApi.replyToEmail(
            emailConfig.accessToken,
            actualThreadId,
            emailOptions
          );
          console.log('Email sent as reply to thread:', actualThreadId);
        } catch (replyError: any) {
          // If reply fails, fall back to sending as new email
          console.log('Reply failed, sending as new email:', replyError.message);
          emailSendResult = await gmailApi.sendEmail(emailConfig.accessToken, emailOptions);
        }
      } else {
        console.log('No thread found, sending as new email');
        emailSendResult = await gmailApi.sendEmail(emailConfig.accessToken, emailOptions);
      }

      // Update quotation with sent status
      await storage.updateQuotation(quotationId, {
        status: 'sent',
        sentAt: new Date(),
        sentBy: userId,
      } as any);

      // Log activity
      await storage.createLeadActivity({
        leadId,
        activityType: 'quote_sent',
        subject: 'Quotation Sent',
        description: `Quotation ${quotation.quotationId} sent to ${email}`,
        createdBy: userId,
      });

      // Store email message - use the threadId from request or from the send result
      try {
        await storage.createEmailMessage({
          leadId,
          direction: 'outbound',
          fromEmail: emailConfig.companyEmail || emailConfig.email,
          toEmails: [email],
          ccEmails: [],
          bccEmails: [],
          subject: emailOptions.subject || `Quotation ${quotation.quotationId}`,
          bodyHtml: emailBodyContent,
          bodyText: emailBodyTextContent,
          sentAt: new Date(),
          messageId: emailSendResult.messageId || null,
          gmailThreadId: emailSendResult.threadId || null,
          isRead: true,
        });
      } catch (storeError) {
        console.log('Could not store email message in database:', storeError);
        // Continue without failing - email was already sent
      }

      res.json({ 
        success: true, 
        message: 'Quotation sent successfully',
        quotationId: quotation.quotationId,
      });
    } catch (error: any) {
      console.error('Error sending quotation:', error);
      
      if (error.message?.includes('authorization') || error.message?.includes('invalid_grant')) {
        return res.status(401).json({ 
          message: 'Gmail authorization expired. Please reconnect your Gmail account.',
          requiresGmailConnect: true,
        });
      }
      
      res.status(500).json({ message: 'Failed to send quotation' });
    }
  });

  // Sitemap.xml route - simplified for maximum reliability
  app.get('/sitemap.xml', async (req, res) => {
    // Always set XML headers first
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    const baseUrl = 'https://bright-organic.com';
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Start with core pages that always exist
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/products</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/ingredients</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/health-support</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/blog</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${baseUrl}/about</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${baseUrl}/contact</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`;

    // Try to add dynamic content but don't fail if there's an error
    try {
      // Add categories if available
      const categories = await storage.getCategories();
      if (categories && Array.isArray(categories)) {
        for (const category of categories) {
          if (category?.slug) {
            sitemap += `
  <url>
    <loc>${baseUrl}/ingredients/${category.slug}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
          }
        }
      }
    } catch (error) {
      console.error('Failed to add categories to sitemap:', error);
    }

    try {
      // Add health supports if available
      const healthSupports = await storage.getHealthSupports();
      if (healthSupports && Array.isArray(healthSupports)) {
        for (const healthSupport of healthSupports) {
          if (healthSupport?.slug) {
            sitemap += `
  <url>
    <loc>${baseUrl}/health-support/${healthSupport.slug}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
          }
        }
      }
    } catch (error) {
      console.error('Failed to add health supports to sitemap:', error);
    }

    try {
      // Add products if available
      const products = await storage.getProducts({ limit: 5000, offset: 0 });
      if (products?.products && Array.isArray(products.products)) {
        for (const product of products.products) {
          if (product?.slug && product.isActive !== false) {
            sitemap += `
  <url>
    <loc>${baseUrl}/products/${product.slug}</loc>
    <lastmod>${product.updatedAt ? new Date(product.updatedAt).toISOString().split('T')[0] : currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
          }
        }
      }
    } catch (error) {
      console.error('Failed to add products to sitemap:', error);
    }

    // Close the sitemap
    sitemap += `
</urlset>`;

    res.send(sitemap);
  });

  // Static routes removed from here - they're now handled as fallback in server/index.ts

  const httpServer = createServer(app);
  return httpServer;
}
