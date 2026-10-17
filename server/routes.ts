import type { Express } from "express";
import { createServer, type Server } from "http";
import crypto from "crypto";
import { storage } from "./storage";
import { db } from "./db";
import xlsx from "xlsx";
import { setupAuth, isAuthenticated } from "./replitAuth";
import hrRoutes from "./hrRoutes";
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
  insertHeroSlideSchema,
  updateHeroSlideSchema,
  insertProductDocumentSchema,
  insertSampleRequestSchema,
  insertProductFaqSchema,
  insertBlogPostSchema,
  insertSeoMonitoringSchema,
  insertCoreWebVitalsSchema,
  insertSearchAnalyticsSchema,
  insertHreflangConfigSchema,
  insertGlobalSeoSettingsSchema,
  globalSeoSettings,
  seoKeywordPerformance,
  seoKeywordReviews,
  seoKeywordPageMappings,
  seoOpportunityActions,
  seoOpportunityActionEvents,
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
  insertQualityDocumentRequestSchema,
  insertQualityTestingRequestSchema,
  insertQualityTestReportSchema,
  insertQualityBatchNumberSchema,
  insertBatchTestResultSchema,
  insertBatchMaterialConsumptionSchema,
  insertQualityVendorSchema,
  insertQualityCustomerVendorApprovalSchema,
  insertQualityNcrSchema,
  insertQualityAttachmentSchema,
  STAFF_DEPARTMENTS,
  ALL_STAFF_ROLES,
  quotationItems,
  quotations,
  companies,
  companyContacts,
  companyActivities,
  companyTasks,
  companyNotes,
  leads,
  inquiries,
  bidRevisions,
  blogPosts,
  products,
  categories,
  healthSupports,
  smsMessages,
  emailThreads,
  emailMessages,
  emailCampaigns,
  emailCampaignRecipients,
  bulkEmailUserConfigs,
  qualityDocumentRequests,
  qualityTestingRequests,
  qualityAttachments,
  fieldQualityRecords,
  fieldQualityTestResults,
  salesCallLogs,
  users,
   userEmailConfigs,
  uploadedDocuments,
  insertUploadedDocumentSchema,
} from "@shared/schema";
import { eq, and, or, ne, isNotNull, isNull, desc, asc, inArray, sql, gte, lte, lt } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { companyLengthErrors } from "./companyValidation";
import multer from "multer";
import { productImageUpload, heroSliderUpload, qualityAttachmentUpload, validateQualityFileBytes, uploadQualityAttachment, isAllowedAttachmentExt, generatePresignedUrl, getImageUrl, deleteFromS3, extractOwnedQualityAttachmentKey, generateDocumentPresignedUrl, getDocumentPublicUrl, deleteDocumentFromS3 } from "./s3Upload";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { AWSS3Service } from "./awsS3Service";
import { imageProcessor, ImageProcessor } from "./imageProcessor";
import QRCode from "qrcode";
import mimeTypes from "mime-types";
import { createStaticProductPage, createStaticHomePage } from "./static-handler";
import { generateProductSEO } from "./seoGenerator";
import { CANONICAL_ORIGIN, STATIC_PAGE_SEO } from "./seo";
import { COLLECTION_PAGE_SEO, HOME_SEO, KEYWORD_ASSIGNMENTS, categoryPageSeo, healthSupportPageSeo } from "./seoStrategy";
import { auditSeoPages, canonicalPageUrl, detectCompetingPages, isCriticalSeoFindingResolved, keywordMatches, normalizeKeywordTokens, replacePrimaryKeywordList, type SeoPage } from "./seoGrowth";
import { runSeoCrawlerAudit } from "./seoCrawler";
import {
  buildSitemapEntries,
  isIndexableSitemapBlogPost,
  isIndexableSitemapCategory,
  isIndexableSitemapHealthSupport,
  isIndexableSitemapProduct,
  renderSitemapXml,
  sitemapPageUrl,
  SITEMAP_STATIC_PATHS,
} from "./sitemap";
import { encryptEmailCredential } from "./email/credentials";
import { titanEmailProvider } from "./email/titan";
import { normalizeEmailAddress } from "./email/address";
import {
  appendHtmlSignature,
  appendLegacyImageSignature,
  hasSupportedSignatureContent,
  sanitizeSignatureHtml,
} from "./email/signature";
import {
  canSendSalesOrder,
  emailThreadIncludesRecipient,
  isSalesOrderEmailThreadCompatible,
  normalizeReplySubject,
  requestedReplyThreadId,
  renderCampaignRecipientSubject,
  titanInboundProviderId,
  uniquelyMatchedCampaignCompanyId,
  uniquelyMatchingLeadBySender,
} from "./email/syncPolicy";
import {
  buildSalesDraftPrompt,
  AI_DRAFT_TOTAL_TIMEOUT_MS,
  ensureProductMentions,
  fetchWebsiteText,
  findWebsiteProductMatches,
  generateSalesDraft,
  normalizeWebsiteUrl,
  normalizeRequestedProductIds,
  productNameMentioned,
  type DraftProduct,
  type WebsiteProductMatch,
} from "./email/aiSalesDraft";
import { registerChatRoutes } from "./chatRoutes";
import { createPortalAppearanceHandlers } from "./portalAppearance";

export async function registerRoutes(app: Express): Promise<Server> {
  const portalAppearanceHandlers = createPortalAppearanceHandlers({
    getUserById: (userId) => storage.getUser(userId),
    savePreference: async (userId, preference, onlyIfMissing) => {
      const conditions = [
        eq(users.id, userId),
        eq(users.userType, "staff"),
      ];
      if (onlyIfMissing) conditions.push(isNull(users.portalAppearance));
      const [updated] = await db.update(users)
        .set({ portalAppearance: preference, updatedAt: new Date() })
        .where(and(...conditions))
        .returning({ portalAppearance: users.portalAppearance });
      if (updated) return updated.portalAppearance;
      if (onlyIfMissing) {
        const current = await storage.getUser(userId);
        if (current?.userType === "staff") return current.portalAppearance;
      }
      return undefined;
    },
  });

  // Initialize services
  const s3Service = new AWSS3Service();
  const isEmailAdmin = (user: any) => ["admin", "super_admin"].includes(user?.role);
  const activeTitanSyncConfigIds = new Set<number>();
  // Draft generation is intentionally in-memory only: no email is sent or persisted.
  const aiSalesDraftRateLimits = new Map<string, number[]>();
  const publicTitanStatus = (config: any) => ({
    hasConfig: !!config,
    configured: !!config,
    connected: !!config?.isConnected && !!config?.titanAppPasswordEncrypted && config?.isActive !== false,
    email: config?.companyEmail || null,
    emailAddress: config?.companyEmail || null,
    displayName: config?.displayName || null,
    provider: "titan",
    serviceType: config?.serviceType || "titan",
    lastSyncAt: config?.imapLastSyncedAt || null,
    lastSyncError: config?.imapLastSyncError || null,
    syncStatus: config?.imapSyncStatus || "idle",
    requiresEmailConnect: !!config && config.isActive !== false && (!config.isConnected || !config.titanAppPasswordEncrypted),
  });
  
  // Multer configuration for WebP processing
  const webpUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
      files: 10 // Max 10 files per upload
    },
    fileFilter: (req, file, cb) => {
      const mimeType = file.mimetype;
      // Images pass by MIME; documents pass by extension allowlist (bytes are validated in the route before S3)
      if (ImageProcessor.isValidImageFormat(mimeType) || isAllowedAttachmentExt(file.originalname)) {
        cb(null, true);
      } else {
        cb(new Error(`Unsupported file type: ${file.originalname}. Supported: images (JPEG, PNG, GIF, TIFF, BMP, WebP) and documents (PDF, Word, Excel, CSV)`));
      }
    }
  });

  // Decides how an uploaded product file must be handled. Any file whose extension is on
  // the attachment allowlist gets its real bytes validated against that extension first —
  // the client-declared MIME type must never route a file around byte validation.
  const IMAGE_ATTACHMENT_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
  const classifyUploadedFile = (file: Express.Multer.File): { kind: 'image' | 'document'; error?: string } => {
    const dot = file.originalname.lastIndexOf('.');
    const ext = dot >= 0 ? file.originalname.slice(dot).toLowerCase() : '';
    const isImageMime = ImageProcessor.isValidImageFormat(file.mimetype);
    if (isAllowedAttachmentExt(file.originalname)) {
      const invalid = validateQualityFileBytes(file.buffer, file.originalname);
      if (invalid) return { kind: 'document', error: `${file.originalname}: ${invalid}` };
      // Image extensions ALWAYS take the decode pipeline — the signature check alone is not
      // proof of a real image, and a forged non-image MIME must not divert bytes to a raw write
      return { kind: IMAGE_ATTACHMENT_EXTS.has(ext) ? 'image' : 'document' };
    }
    // Not an allowlisted extension: only image MIMEs pass the multer filter (e.g. TIFF/BMP).
    // These must decode as images downstream — decode failure is rejected, never raw-uploaded.
    if (isImageMime) return { kind: 'image' };
    return { kind: 'document', error: `${file.originalname}: unsupported file type` };
  };

  // Auth middleware
  await setupAuth(app);
  registerChatRoutes(app);

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

  // ─── Security monitoring helpers ──────────────────────────────────────────
  async function resolveIpLocation(ip: string): Promise<{ city: string | null; country: string | null }> {
    try {
      if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
        return { city: null, country: null };
      }
      const res = await fetch(`http://ip-api.com/json/${ip}?fields=city,country,status`);
      if (!res.ok) return { city: null, country: null };
      const data = await res.json() as { status?: string; city?: string; country?: string };
      if (data.status === 'success') return { city: data.city || null, country: data.country || null };
    } catch { /* ignore */ }
    return { city: null, country: null };
  }

  function extractClientIp(req: any): string {
    const forwarded = req.headers['x-forwarded-for'] as string;
    if (forwarded) return forwarded.split(',')[0].trim();
    return req.headers['x-real-ip'] as string || req.ip || '127.0.0.1';
  }

  // Helper: log staff access events and check for rapid browsing alerts
  async function logStaffAccess(req: any, entityType: string, entityId: number, entityName: string) {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return;
      const user = await storage.getUser(userId).catch(() => null);
      if (!user || user.role === 'customer') return;
      const ip = extractClientIp(req);
      console.log(`[ActivityLog] ${userId} (${user.role}) → ${entityType} #${entityId} "${entityName}" from ${ip}`);
      await storage.createUserAccessEvent({ userId, entityType, entityId, entityName, ipAddress: ip, page: `/${entityType}/${entityId}` });
      const recentCount = await storage.getRecentAccessEventCount(userId, entityType, 5);
      if (recentCount > 0 && recentCount % 9 === 0) { // alert at 9, 18, 27...
        const staffName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || userId;
        await storage.createUserSecurityAlert({ userId, alertType: 'rapid_company_access', severity: 'high', description: `Opened ${recentCount} ${entityType} records in 5 minutes`, isResolved: false });
        await storage.createNotificationsForRole({ type: 'security_alert', title: '🔴 Rapid Data Access Alert', message: `${staffName} opened ${recentCount} ${entityType} records in 5 minutes`, entityType: 'security', link: '/admin/dashboard?section=security-monitor', isRead: false }, ['admin', 'super_admin']);
      }
    } catch (e) {
      console.error('[logStaffAccess] error:', e);
    }
  }

  // Auth routes
  app.get("/api/auth/appearance", isAuthenticated, portalAppearanceHandlers.get);
  app.put("/api/auth/appearance", isAuthenticated, portalAppearanceHandlers.put);

  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);

      // Log login event asynchronously for staff users only (non-blocking)
      if (user.userType === 'staff' && !req.session?.loginLogged) {
        req.session.loginLogged = true;
        setImmediate(async () => {
          try {
            const ip = extractClientIp(req);
            const userAgent = req.headers['user-agent'] || null;
            const { city, country } = await resolveIpLocation(ip);
            const now = new Date();
            const hour = now.getHours();
            const isOffHours = hour < 7 || hour >= 21;

            const recentCities = await storage.getRecentLoginCities(userId, 5);
            const isNewLocation = !!(city && recentCities.length > 0 && !recentCities.includes(city));

            await storage.createUserLoginLog({
              userId,
              ipAddress: ip,
              city,
              country,
              userAgent,
              isOffHours,
              isNewLocation,
            });

            // Create alerts for flagged conditions
            const staffName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || userId;
            const securityLink = '/admin/dashboard?section=security-monitor';

            // Check for concurrent login from a different device/IP (within last 8 hours)
            const concurrentLogin = await storage.getRecentLoginFromDifferentIp(userId, ip, 480);
            if (concurrentLogin) {
              await storage.createUserSecurityAlert({
                userId,
                alertType: 'concurrent_login',
                severity: 'high',
                description: `Account logged in from multiple devices simultaneously. Previous device IP: ${concurrentLogin.ipAddress || 'unknown'}${concurrentLogin.city ? ` (${concurrentLogin.city})` : ''}. New device IP: ${ip}${city ? ` (${city})` : ''}`,
                isResolved: false,
              });
              await storage.createNotificationsForRole({
                type: 'security_alert',
                title: '🔴 Multi-Device Login Detected',
                message: `${staffName} is logged in from multiple devices — previous IP: ${concurrentLogin.ipAddress || 'unknown'}, new IP: ${ip}`,
                entityType: 'security',
                link: securityLink,
                isRead: false,
              }, ['admin', 'super_admin']);
            }

            if (isOffHours) {
              await storage.createUserSecurityAlert({
                userId,
                alertType: 'off_hours_login',
                severity: 'low',
                description: `Login at ${now.toLocaleTimeString()} (${hour}:${String(now.getMinutes()).padStart(2,'0')}) from ${city || ip}`,
                isResolved: false,
              });
              await storage.createNotificationsForRole({
                type: 'security_alert',
                title: 'Off-hours Login Detected',
                message: `${staffName} logged in at ${now.toLocaleTimeString()} from ${city || ip}`,
                entityType: 'security',
                link: securityLink,
                isRead: false,
              }, ['admin', 'super_admin']);
            }
            if (isNewLocation && city) {
              await storage.createUserSecurityAlert({
                userId,
                alertType: 'new_location_login',
                severity: 'high',
                description: `First login detected from ${city}, ${country || ''}. Previous logins from: ${recentCities.slice(0,3).join(', ') || 'N/A'}`,
                isResolved: false,
              });
              await storage.createNotificationsForRole({
                type: 'security_alert',
                title: 'New Location Login Detected',
                message: `${staffName} logged in from a new location: ${city}, ${country || ''}`,
                entityType: 'security',
                link: securityLink,
                isRead: false,
              }, ['admin', 'super_admin']);
            }
          } catch (e) {
            console.error('Login log error:', e);
          }
        });
      }
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
      // First check for potential duplicates
      if (userData.companyName) {
        try {
          const { checkForDuplicates } = await import('./duplicateDetection');
          const duplicateCheck = await checkForDuplicates(
            userData.companyName,
            userData.email,
            userData.phone || undefined
          );
          
          if (duplicateCheck.hasPotentialDuplicates && duplicateCheck.highestConfidence >= 80) {
            // Link to existing company instead of creating duplicate
            const existingCompanyId = duplicateCheck.matches[0].companyId;
            const existingCompany = await storage.getCompany(existingCompanyId);
            
            if (existingCompany) {
              // Update user to link to existing company
              await storage.updateUser(user.id, {
                companyName: existingCompany.companyName
              });
              
              // Create a contact for this new user under the existing company
              await storage.createCompanyContact({
                companyId: existingCompanyId,
                contactName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Contact',
                email: userData.email,
                phone: userData.phone || null,
                isPrimary: false,
                role: 'user',
              });
              
              // Log activity
              await storage.createCompanyActivity({
                companyId: existingCompanyId,
                activityType: 'note',
                subject: 'New Contact Registered',
                description: `New user ${userData.email} registered from website and was linked to this existing company`,
                createdBy: null,
              });
              
              console.log(`Linked new registration to existing company ${existingCompany.companyName} (ID: ${existingCompanyId})`);
            }
          } else {
            // Create new company - no high-confidence duplicates found
            const newCompany = await storage.createCompany({
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
              createdBy: null,
              duplicateStatus: duplicateCheck.hasPotentialDuplicates ? 'suspected' : 'unique',
              duplicateConfidence: duplicateCheck.highestConfidence > 0 ? duplicateCheck.highestConfidence.toString() : null,
            });
            
            // If there are low-confidence potential duplicates, create notification for review
            if (duplicateCheck.hasPotentialDuplicates && duplicateCheck.matches.length > 0) {
              try {
                await storage.createNotificationsForRole({
                  type: 'duplicate_suspected',
                  title: 'Potential Duplicate Company',
                  message: `New company "${userData.companyName}" may be a duplicate of "${duplicateCheck.matches[0].companyName}" (${duplicateCheck.matches[0].confidence}% match)`,
                  entityType: 'company',
                  entityId: newCompany.id,
                  isRead: false,
                  link: '/admin/sales/companies?duplicate=suspected',
                }, ['super_admin', 'admin', 'sales_manager']);
              } catch (notifError) {
                console.error('Failed to create duplicate notification:', notifError);
              }
            }
          }
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

  // Helper function to get the base URL for password reset links
  // Uses production domain when deployed, falls back to development domain
  function getBaseUrl(): string {
    // REPLIT_DOMAINS contains the production domain(s)
    const replitDomains = process.env.REPLIT_DOMAINS;
    const devDomain = process.env.REPLIT_DEV_DOMAIN;
    
    // Prefer production domain if available and we're in production mode
    if (replitDomains && process.env.NODE_ENV === 'production') {
      const primaryDomain = replitDomains.split(',')[0];
      return `https://${primaryDomain}`;
    }
    
    // In development, use the dev domain
    if (devDomain) {
      return `https://${devDomain}`;
    }
    
    // Fallback for local development
    return 'http://localhost:5000';
  }

  function applyConfiguredEmailSignature(
    config: { signatureHtml?: string | null; signatureImageUrl?: string | null; displayName?: string | null },
    bodyHtml: string,
    bodyText: string,
  ): { html: string; text: string } {
    if (config.signatureHtml?.trim()) {
      return appendHtmlSignature(bodyHtml, bodyText, config.signatureHtml);
    }

    if (config.signatureImageUrl) {
      const path = config.signatureImageUrl.startsWith("/objects/")
        ? config.signatureImageUrl
        : new ObjectStorageService().normalizeObjectEntityPath(config.signatureImageUrl);
      return appendLegacyImageSignature(bodyHtml, bodyText, `${getBaseUrl()}${path}`, config.displayName);
    }

    return { html: bodyHtml, text: bodyText };
  }

  // Customer forgot password - request password reset
  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      // Find customer by email
      const customer = await storage.getUserByEmail(email);
      
      // Always return success to prevent email enumeration attacks
      // but only actually send email if customer exists
      if (!customer || customer.userType !== 'customer') {
        console.log(`Password reset requested for non-existent email: ${email}`);
        return res.json({ 
          message: 'If an account exists with this email, you will receive a password reset link.' 
        });
      }

      // Generate a secure random token (32 bytes = 64 hex characters)
      const resetToken = crypto.randomBytes(32).toString('hex');
      
      // Hash the token before storing (so even if DB is compromised, tokens can't be used)
      const tokenHash = await bcrypt.hash(resetToken, 10);
      
      // Set token expiration to 1 hour from now
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      
      // Invalidate any existing tokens for this user
      await storage.invalidateUserPasswordResetTokens(customer.id);
      
      // Store the hashed token
      await storage.createPasswordResetToken(customer.id, tokenHash, expiresAt);
      
      // Build the reset URL
      const baseUrl = getBaseUrl();
      const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
      
      console.log(`Password reset requested for ${email}, URL: ${resetUrl}`);
      
      // Try to send email using admin@bright-organic.com or first available connected email config
      try {
        const emailConfigs = await storage.getUserEmailConfigs();
        // Prioritize admin@bright-organic.com for system emails
        const connectedConfig = emailConfigs.find(config =>
          config.isConnected && config.titanAppPasswordEncrypted && config.companyEmail === 'admin@bright-organic.com'
        ) || emailConfigs.find(config => config.isConnected && config.titanAppPasswordEncrypted);
        
        if (connectedConfig) {
          console.log(`Using email config: ${connectedConfig.companyEmail} for password reset`);
          
          // Send password reset email
          await titanEmailProvider.send({
            email: connectedConfig.companyEmail,
            encryptedAppPassword: connectedConfig.titanAppPasswordEncrypted!,
          }, {
            to: [email],
            subject: 'Reset Your Password - Atlas Ingredients',
            fromName: 'Atlas Ingredients',
            bodyHtml: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #16a34a; margin-bottom: 10px;">Atlas Ingredients</h1>
                </div>
                
                <h2 style="color: #333;">Reset Your Password</h2>
                
                <p>Hello ${customer.firstName || 'Customer'},</p>
                
                <p>We received a request to reset the password for your account associated with ${email}.</p>
                
                <p>Click the button below to reset your password. This link will expire in 1 hour.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resetUrl}" 
                     style="background-color: #16a34a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                    Reset Password
                  </a>
                </div>
                
                <p style="color: #666; font-size: 14px;">
                  If the button above doesn't work, copy and paste this link into your browser:<br>
                  <a href="${resetUrl}" style="color: #16a34a;">${resetUrl}</a>
                </p>
                
                <p style="color: #666; font-size: 14px;">
                  If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
                </p>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                
                <p style="color: #999; font-size: 12px; text-align: center;">
                  &copy; ${new Date().getFullYear()} Atlas Ingredients. All rights reserved.<br>
                  This is an automated message, please do not reply.
                </p>
              </body>
              </html>
            `,
            bodyText: `
Reset Your Password - Atlas Ingredients

Hello ${customer.firstName || 'Customer'},

We received a request to reset the password for your account associated with ${email}.

Click the link below to reset your password. This link will expire in 1 hour.

${resetUrl}

If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.

© ${new Date().getFullYear()} Atlas Ingredients. All rights reserved.
            `,
          });
          
          console.log(`Password reset email sent successfully to ${email}`);
        } else {
          console.warn('No connected email configuration found to send password reset email');
          // Log the reset URL for manual testing/debugging
          console.log(`Password reset URL (email not sent): ${resetUrl}`);
        }
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
        // Don't fail the request - the token was created, user can try again
        console.log(`Password reset URL (email failed): ${resetUrl}`);
      }
      
      res.json({ 
        message: 'If an account exists with this email, you will receive a password reset link.' 
      });
    } catch (error) {
      console.error('Error requesting password reset:', error);
      res.status(500).json({ message: 'Failed to process password reset request' });
    }
  });

  // Validate password reset token
  app.get('/api/auth/reset-password/validate', async (req, res) => {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ valid: false, message: 'Token is required' });
      }

      // Get all password reset tokens from database
      // We'll need to iterate through and check bcrypt matches
      // First, get all valid (non-expired, non-used) tokens
      const result = await db.execute(
        sql`SELECT id, user_id, token_hash, expires_at, used_at 
            FROM password_reset_tokens 
            WHERE used_at IS NULL 
            AND expires_at > NOW()
            ORDER BY created_at DESC
            LIMIT 100`
      );
      
      let matchingToken: any = null;
      
      for (const row of result.rows as any[]) {
        const isMatch = await bcrypt.compare(token, row.token_hash);
        if (isMatch) {
          matchingToken = row;
          break;
        }
      }
      
      if (!matchingToken) {
        return res.json({ 
          valid: false, 
          message: 'This password reset link is invalid or has expired.' 
        });
      }
      
      // Get user info to show masked email
      const user = await storage.getUser(matchingToken.user_id);
      let maskedEmail = '';
      if (user?.email) {
        const [localPart, domain] = user.email.split('@');
        const maskedLocal = localPart.substring(0, 2) + '***';
        maskedEmail = `${maskedLocal}@${domain}`;
      }
      
      res.json({ 
        valid: true, 
        email: maskedEmail 
      });
    } catch (error) {
      console.error('Error validating reset token:', error);
      res.status(500).json({ valid: false, message: 'Failed to validate token' });
    }
  });

  // Reset password with token
  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { token, newPassword, confirmPassword } = req.body;
      
      if (!token) {
        return res.status(400).json({ message: 'Reset token is required' });
      }
      
      if (!newPassword || !confirmPassword) {
        return res.status(400).json({ message: 'New password and confirmation are required' });
      }
      
      if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
      }
      
      if (newPassword.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters long' });
      }

      // Find matching token
      const result = await db.execute(
        sql`SELECT id, user_id, token_hash, expires_at, used_at 
            FROM password_reset_tokens 
            WHERE used_at IS NULL 
            AND expires_at > NOW()
            ORDER BY created_at DESC
            LIMIT 100`
      );
      
      let matchingToken: any = null;
      
      for (const row of result.rows as any[]) {
        const isMatch = await bcrypt.compare(token, row.token_hash);
        if (isMatch) {
          matchingToken = row;
          break;
        }
      }
      
      if (!matchingToken) {
        return res.status(400).json({ 
          message: 'This password reset link is invalid or has expired. Please request a new one.' 
        });
      }
      
      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update user password
      await storage.updateUserPassword(matchingToken.user_id, hashedPassword);
      
      // Mark token as used
      await storage.markPasswordResetTokenUsed(matchingToken.id);
      
      // Invalidate any other tokens for this user
      await storage.invalidateUserPasswordResetTokens(matchingToken.user_id);
      
      console.log(`Password reset successful for user ${matchingToken.user_id}`);
      
      res.json({ 
        message: 'Your password has been reset successfully. You can now log in with your new password.' 
      });
    } catch (error) {
      console.error('Error resetting password:', error);
      res.status(500).json({ message: 'Failed to reset password' });
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


  async function requirePublishedProduct(req: any, res: any, next: any) {
    const rawId = req.params.productId ?? req.params.id;
    if (!/^\d+$/.test(rawId || "")) return res.status(404).json({ message: "Product not found" });
    try {
      const product = await storage.getProduct(Number(rawId));
      if (!product?.isActive || !product.isVisible) {
        return res.status(404).json({ message: "Product not found" });
      }
      next();
    } catch (error) {
      console.error("Error checking public product visibility:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  }

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
        "description": product.description || `High-quality ${product.name} from Atlas Ingredients`,
        "sku": product.productId,
        "mpn": product.productId,
        "brand": {
          "@type": "Brand",
          "name": "Atlas Ingredients",
          "url": baseUrl
        },
        "manufacturer": {
          "@type": "Organization",
          "name": "Atlas Ingredients",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Opp. Murlidhar Guest House, Mehsana-Vishnagar Road, Kansarakui",
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
            "name": "Atlas Ingredients",
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
        "name": "Atlas Ingredients",
        "url": baseUrl,
        "logo": `${baseUrl}/logo.png`,
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Opp. Murlidhar Guest House, Mehsana-Vishnagar Road, Kansarakui",
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
          title: product.seoTitle || `${product.name} - Atlas Ingredients`,
          description: product.seoDescription || product.description || `High-quality ${product.name} from Atlas Ingredients`,
          canonical: productUrl,
          ogTitle: product.seoTitle || `${product.name} - Atlas Ingredients`,
          ogDescription: product.seoDescription || product.description || `High-quality ${product.name} from Atlas Ingredients`,
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

      // Country code to name mapping
      const COUNTRY_NAME_MAP: Record<string, string> = {
        US: 'USA', CA: 'Canada', MX: 'Mexico',
        IN: 'India',
        DE: 'Germany', FR: 'France', IT: 'Italy', ES: 'Spain', NL: 'Netherlands',
        BE: 'Belgium', AT: 'Austria', PT: 'Portugal', IE: 'Ireland', FI: 'Finland',
        LU: 'Luxembourg', MT: 'Malta', CY: 'Cyprus', SK: 'Slovakia', SI: 'Slovenia',
        EE: 'Estonia', LV: 'Latvia', LT: 'Lithuania', GR: 'Greece',
        GB: 'UK', UK: 'UK',
        AU: 'Australia', NZ: 'New Zealand', JP: 'Japan', CN: 'China', KR: 'South Korea',
        SG: 'Singapore', AE: 'UAE', SA: 'Saudi Arabia', ZA: 'South Africa',
        BR: 'Brazil', AR: 'Argentina', CL: 'Chile', CO: 'Colombia',
        RU: 'Russia', PL: 'Poland', CZ: 'Czech Republic', HU: 'Hungary',
        SE: 'Sweden', NO: 'Norway', DK: 'Denmark', CH: 'Switzerland',
        TH: 'Thailand', VN: 'Vietnam', MY: 'Malaysia', ID: 'Indonesia', PH: 'Philippines',
      };

      // Try each service
      for (const service of services) {
        try {
          const result = await service();
          const currency = COUNTRY_CURRENCY_MAP[result.countryCode] || 'USD';
          
          if (result.countryCode) {
            const countryName = COUNTRY_NAME_MAP[result.countryCode] || result.countryCode;
            console.log(`Currency detected: ${result.countryCode} -> ${currency} via ${result.service}`);
            return res.json({ 
              currency, 
              countryCode: result.countryCode,
              countryName,
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
      
      // Load primary product type from relations
      const productWithTypes = await storage.getProductWithTypes(product.id);
      const primaryType = productWithTypes?.primaryType || null;
      
      res.json({ ...product, primaryType });
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  // Get single product by ID - MUST be after specific routes
  app.get('/api/products/:id', requirePublishedProduct, async (req, res) => {
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

  app.post('/api/product-types', isAuthenticated, isAdminOrWebsiteManager, async (req, res) => {
    try {
      const typeData = insertProductTypeSchema.parse(req.body);
      const newType = await storage.createProductType(typeData);
      res.status(201).json(newType);
    } catch (error) {
      console.error("Error creating product type:", error);
      res.status(500).json({ message: "Failed to create product type" });
    }
  });

  app.put('/api/product-types/:id', isAuthenticated, isAdminOrWebsiteManager, async (req, res) => {
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

  app.delete('/api/product-types/:id', isAuthenticated, isAdminOrWebsiteManager, async (req, res) => {
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
  app.post('/api/products/:productId/types', isAuthenticated, isAdminOrWebsiteManager, async (req, res) => {
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

  app.delete('/api/products/:productId/types/:typeId', isAuthenticated, isAdminOrWebsiteManager, async (req, res) => {
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

  app.put('/api/products/:productId/types/:typeId', isAuthenticated, isAdminOrWebsiteManager, async (req, res) => {
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
  app.post('/api/product-types/bulk-assign', isAuthenticated, isAdminOrWebsiteManager, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (!user.role?.includes('admin') && user.role !== 'website_manager' && user.role !== 'quality_manager' && user.role !== 'quality_executive')) {
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

  app.post('/api/health-supports', isAuthenticated, isAdminOrWebsiteManager, async (req, res) => {
    try {
      const validatedData = insertHealthSupportSchema.parse(req.body);
      const newHealthSupport = await storage.createHealthSupport(validatedData);
      res.status(201).json(newHealthSupport);
    } catch (error) {
      console.error("Error creating health support:", error);
      res.status(500).json({ message: "Failed to create health support" });
    }
  });

  app.put('/api/health-supports/:id', isAuthenticated, isAdminOrWebsiteManager, async (req, res) => {
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

  app.delete('/api/health-supports/:id', isAuthenticated, isAdminOrWebsiteManager, async (req, res) => {
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

  app.post('/api/products/:productId/health-supports', isAuthenticated, isAdminOrWebsiteManager, async (req, res) => {
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

  app.delete('/api/products/:productId/health-supports/:healthSupportId', isAuthenticated, isAdminOrWebsiteManager, async (req, res) => {
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

  app.post('/api/products/:productId/health-supports/bulk', isAuthenticated, isAdminOrWebsiteManager, async (req, res) => {
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
  app.post("/api/products/upload-webp", isAuthenticated, isAdminOrWebsiteManager, webpUpload.array('images', 10), async (req: any, res) => {
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
  app.post("/api/products/upload", isAuthenticated, isAdminOrWebsiteManager, async (req, res) => {
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
  app.post("/api/categories/upload", isAuthenticated, isAdminOrWebsiteManager, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getPublicObjectUploadURL();
      return res.json({ uploadURL, provider: 'replit-object-storage-public' });
    } catch (error) {
      console.error("Error generating category upload URL:", error);
      res.status(500).json({ error: "Failed to generate category upload URL" });
    }
  });

  app.put("/api/category-images", isAuthenticated, isAdminOrWebsiteManager, async (req, res) => {
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
  app.put("/api/product-images", isAuthenticated, isAdminOrWebsiteManager, async (req, res) => {
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
      res.json(slides.filter((slide) => slide.isActive));
    } catch (error) {
      console.error("Error fetching hero slides:", error);
      res.status(500).json({ message: "Failed to fetch hero slides" });
    }
  });

  // Get all hero slides for the editor, including inactive slides.
  app.get('/api/admin/hero-slides', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user || (!user.role?.includes('admin') && user.role !== 'website_manager' && user.role !== 'quality_manager' && user.role !== 'quality_executive')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      res.json(await storage.getHeroSlides());
    } catch (error) {
      console.error("Error fetching hero slides for management:", error);
      res.status(500).json({ message: "Failed to fetch hero slides" });
    }
  });

  // Create hero slide
  app.post('/api/hero-slides', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (!user.role?.includes('admin') && user.role !== 'website_manager' && user.role !== 'quality_manager' && user.role !== 'quality_executive')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const slideData = insertHeroSlideSchema.parse(req.body);
      const slide = await storage.createHeroSlide(slideData);
      res.json(slide);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid hero slide data", errors: error.issues });
      }
      console.error("Error creating hero slide:", error);
      res.status(500).json({ message: "Failed to create hero slide" });
    }
  });

  // Update hero slide
  app.put('/api/hero-slides/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (!user.role?.includes('admin') && user.role !== 'website_manager' && user.role !== 'quality_manager' && user.role !== 'quality_executive')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const { id } = req.params;
      const slideData = updateHeroSlideSchema.parse(req.body);
      const slide = await storage.updateHeroSlide(parseInt(id), slideData);
      if (!slide) return res.status(404).json({ message: "Hero slide not found" });
      res.json(slide);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid hero slide data", errors: error.issues });
      }
      console.error("Error updating hero slide:", error);
      res.status(500).json({ message: "Failed to update hero slide" });
    }
  });

  // Delete hero slide
  app.delete('/api/hero-slides/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (!user.role?.includes('admin') && user.role !== 'website_manager' && user.role !== 'quality_manager' && user.role !== 'quality_executive')) {
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
  app.get('/api/products/:id/documents', requirePublishedProduct, async (req, res) => {
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
  app.get('/api/products/:id/frequently-bought-together', requirePublishedProduct, async (req, res) => {
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
  app.get('/api/products/:id/similar', requirePublishedProduct, async (req, res) => {
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
        let productName = req.body.productName || null;
        
        // If productName not provided, fetch from database using productId
        if (!productName && req.body.productId) {
          try {
            const parsedId = parseInt(req.body.productId);
            if (!isNaN(parsedId)) {
              const product = await storage.getProduct(parsedId);
              productName = product?.name || null;
            }
          } catch (e) {
            console.log('Failed to fetch product for notification:', e);
          }
        }
        
        // If still no product name, try to get from inquiry's products array
        if (!productName && inquiry.products && Array.isArray(inquiry.products) && inquiry.products.length > 0) {
          try {
            const productNames = [];
            for (const productItem of inquiry.products) {
              const pid = typeof productItem === 'number' ? productItem : productItem?.productId;
              if (pid && !isNaN(Number(pid))) {
                const prod = await storage.getProduct(Number(pid));
                if (prod?.name) productNames.push(prod.name);
              }
            }
            if (productNames.length > 0) {
              productName = productNames.join(', ');
            }
          } catch (e) {
            console.log('Failed to fetch products array for notification:', e);
          }
        }
        
        productName = productName || 'Product';
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

  app.get('/api/customer/sample-requests/:customerId', isAuthenticated, async (req: any, res) => {
    try {
      const customerId = req.params.customerId;
      const authenticatedCustomerId = req.user?.claims?.sub;
      if (!authenticatedCustomerId || authenticatedCustomerId !== customerId) {
        return res.status(403).json({ message: "You can only view your own sample requests" });
      }
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
      
      // Get customer registration details if available
      let customerDetails: any = null;
      if (inquiryDetails.customerId) {
        customerDetails = await storage.getUser(inquiryDetails.customerId);
      }
      
      let companyId: number;
      if (company.length === 0) {
        // Create new company with customer registration details
        const companyData: any = {
          companyName,
          primaryEmail: inquiryDetails.emailAddress,
          primaryPhone: inquiryDetails.phoneNumber || customerDetails?.phoneNumber,
          dataCompleteness: customerDetails ? 'complete' : 'partial',
          needsEnrichment: !customerDetails,
          assignedTo: userId,
          createdBy: userId,
          origin: 'website', // From customer inquiry
        };
        
        // Copy customer registration details to company
        if (customerDetails) {
          companyData.industryType = customerDetails.industryType || null;
          companyData.addressStreet = customerDetails.streetAddress || customerDetails.address || null;
          companyData.addressCity = customerDetails.city || null;
          companyData.addressState = customerDetails.state || null;
          const { normalizeCountryOrNull } = await import('@shared/countries');
          companyData.addressCountry = normalizeCountryOrNull(customerDetails.country);
          companyData.addressZip = customerDetails.postalCode || null;
          companyData.linkedUserId = customerDetails.id;
        }
        
        const [newCompany] = await db.insert(companies)
          .values(companyData)
          .returning();
        companyId = newCompany.id;
      } else {
        companyId = company[0].id;
        
        // Update existing company with missing customer details if available
        if (customerDetails) {
          const existingCompany = company[0];
          const updateData: any = {};
          
          if (!existingCompany.industryType && customerDetails.industryType) {
            updateData.industryType = customerDetails.industryType;
          }
          if (!existingCompany.addressStreet && (customerDetails.streetAddress || customerDetails.address)) {
            updateData.addressStreet = customerDetails.streetAddress || customerDetails.address;
          }
          if (!existingCompany.addressCity && customerDetails.city) {
            updateData.addressCity = customerDetails.city;
          }
          if (!existingCompany.addressState && customerDetails.state) {
            updateData.addressState = customerDetails.state;
          }
          if (!existingCompany.addressCountry && customerDetails.country) {
            const { normalizeCountryOrNull } = await import('@shared/countries');
            updateData.addressCountry = normalizeCountryOrNull(customerDetails.country);
          }
          if (!existingCompany.addressZip && customerDetails.postalCode) {
            updateData.addressZip = customerDetails.postalCode;
          }
          if (!existingCompany.linkedUserId) {
            updateData.linkedUserId = customerDetails.id;
          }
          
          // Only update if there are changes
          if (Object.keys(updateData).length > 0) {
            await db.update(companies)
              .set(updateData)
              .where(eq(companies.id, companyId));
          }
        }
      }

      // Step 2: Find or create contact person record
      const contactName = inquiryDetails.contactName || (customerDetails ? `${customerDetails.firstName || ''} ${customerDetails.lastName || ''}`.trim() : null);
      let contactPersonId: number | null = null;
      if (contactName) {
        let contact = await db.select().from(companyContacts)
          .where(and(
            eq(companyContacts.companyId, companyId),
            eq(companyContacts.contactName, contactName)
          ))
          .limit(1);
        
        if (contact.length === 0) {
          // Create new contact with customer details
          const [newContact] = await db.insert(companyContacts)
            .values({
              companyId,
              contactName: contactName,
              email: inquiryDetails.emailAddress || customerDetails?.email,
              phone: inquiryDetails.phoneNumber || customerDetails?.phoneNumber,
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
        customerId,
        source: 'website',
      });
      
      const sampleRequest = await storage.createSampleRequest(requestData);
      
      // Create notification for admins and sales managers about new sample request
      try {
        let productName = req.body.productName || null;
        
        // If productName not provided, fetch from database using productId
        if (!productName && req.body.productId) {
          try {
            const parsedId = parseInt(req.body.productId);
            if (!isNaN(parsedId)) {
              const product = await storage.getProduct(parsedId);
              productName = product?.name || null;
            }
          } catch (e) {
            console.log('Failed to fetch product for sample request notification:', e);
          }
        }
        
        productName = productName || 'Product';
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
      
      const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
      const isSalesManager = user?.role === 'sales_manager';
      const isSalesExecutive = user?.role === 'sales_executive';
      const isQuality = user?.role === 'quality_manager' || user?.role === 'quality_executive';
      if (!user || (!isAdmin && !isSalesManager && !isSalesExecutive && !isQuality)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const { status, source, search, limit = '50', offset = '0' } = req.query;
      
      const filters: any = {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      };

      // Quality, sales managers, and administrators can see all requests.
      // Sales executives can see directly assigned requests and lead-linked requests.
      if (isSalesExecutive) filters.salesUserId = userId;

      if (status) {
        filters.status = status as string;
      }
      if (source) filters.source = source as string;
      if (search) filters.search = search as string;

      const result = await storage.getSampleRequests(filters);
      res.json(result);
    } catch (error) {
      console.error("Error fetching sample requests:", error);
      res.status(500).json({ message: "Failed to fetch sample requests" });
    }
  });

  // Update sample request fulfillment details (quality/admin only)
  app.put('/api/sample-requests/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
      const isQuality = user?.role === 'quality_manager' || user?.role === 'quality_executive';
      if (!user || (!isAdmin && !isQuality)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const requestId = parseInt(req.params.id);
      if (isNaN(requestId)) {
        return res.status(400).json({ message: "Invalid sample request ID" });
      }
      const existingRequest = await storage.getSampleRequest(requestId);
      if (!existingRequest) {
        return res.status(404).json({ message: "Sample request not found" });
      }
      const updateData: Record<string, any> = {};
      for (const field of ['status', 'notes', 'trackingNumber', 'dhlNumber']) {
        if (Object.prototype.hasOwnProperty.call(req.body, field)) {
          updateData[field] = req.body[field];
        }
      }

      const allowedStatuses = new Set([
        'pending',
        'approved',
        'sample_received',
        'in_testing',
        'shipped',
        'completed',
        'rejected',
      ]);
      const hasStatusUpdate = Object.prototype.hasOwnProperty.call(updateData, 'status');
      if (hasStatusUpdate && !allowedStatuses.has(updateData.status)) {
        return res.status(400).json({ message: 'Invalid sample request status' });
      }
      const effectiveStatus = updateData.status ?? existingRequest.status;
      if (effectiveStatus === 'shipped') {
        const hasTrackingUpdate = Object.prototype.hasOwnProperty.call(updateData, 'trackingNumber');
        const hasDhlUpdate = Object.prototype.hasOwnProperty.call(updateData, 'dhlNumber');
        const trackingNumber = String(
          (hasTrackingUpdate ? updateData.trackingNumber : existingRequest.trackingNumber) ?? '',
        ).trim();
        const dhlNumber = String(
          (hasDhlUpdate ? updateData.dhlNumber : existingRequest.dhlNumber) ?? '',
        ).trim();
        if (!trackingNumber || !dhlNumber) {
          return res.status(400).json({
            message: 'Tracking number and DHL number are required when marking a sample shipped',
          });
        }
      }
      
      // If status is being changed, add processing metadata
      if (updateData.status && updateData.status !== existingRequest.status) {
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

  // Create a sample request from the sales workspace.
  app.post('/api/sales/sample-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
      const isSalesManager = user?.role === 'sales_manager';
      const isSalesExecutive = user?.role === 'sales_executive';
      if (!user || (!isAdmin && !isSalesManager && !isSalesExecutive)) {
        return res.status(403).json({ message: 'Sales role required' });
      }

      const leadId = req.body.leadId === undefined || req.body.leadId === null || req.body.leadId === ''
        ? undefined
        : Number(req.body.leadId);
      if (leadId !== undefined) {
        if (!Number.isInteger(leadId)) {
          return res.status(400).json({ message: 'Invalid lead ID' });
        }
        const lead = await storage.getLead(leadId);
        if (!lead) {
          return res.status(404).json({ message: 'Lead not found' });
        }
        if (isSalesExecutive && lead.assignedSalesRep !== userId) {
          return res.status(403).json({ message: 'Lead is not assigned to you' });
        }
      }

      const productId = Number(req.body.productId);
      if (!Number.isInteger(productId) || productId <= 0) {
        return res.status(400).json({ message: 'A valid product is required' });
      }
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      const {
        leadId: _clientLeadId,
        productId: _clientProductId,
        customerId: _customerId,
        assignedTo: _assignedTo,
        source: _source,
        status: _status,
        notes: _notes,
        trackingNumber: _trackingNumber,
        dhlNumber: _dhlNumber,
        processedAt: _processedAt,
        processedBy: _processedBy,
        ...clientData
      } = req.body;
      const requestData = insertSampleRequestSchema.parse({
        ...clientData,
        productId,
        ...(leadId === undefined ? {} : { leadId }),
        assignedTo: userId,
        source: 'sales',
      });
      const sampleRequest = await storage.createSampleRequest(requestData);
      res.status(201).json(sampleRequest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid sample request data', errors: error.errors });
      }
      console.error('Error creating sales sample request:', error);
      res.status(500).json({ message: 'Failed to create sample request' });
    }
  });

  // Get sample requests from the sales workspace.
  app.get('/api/sales/sample-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
      const isSalesManager = user?.role === 'sales_manager';
      const isSalesExecutive = user?.role === 'sales_executive';
      if (!user || (!isAdmin && !isSalesManager && !isSalesExecutive)) {
        return res.status(403).json({ message: 'Sales role required' });
      }

      const { status, source, search, limit = '50', offset = '0' } = req.query;
      const filters: any = {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      };
      if (isSalesExecutive) filters.salesUserId = userId;
      if (status) filters.status = status as string;
      if (source) filters.source = source as string;
      if (search) filters.search = search as string;

      res.json(await storage.getSampleRequests(filters));
    } catch (error) {
      console.error('Error fetching sales sample requests:', error);
      res.status(500).json({ message: 'Failed to fetch sample requests' });
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

  // Get quotations with role-based filtering
  app.get('/api/quotations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { status, myOnly, startDate, endDate, dateFrom, dateTo, search, limit = '50', offset = '0' } = req.query;
      
      const filters: any = {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      };

      // Role-based filtering
      if (user.role === 'customer') {
        filters.customerId = userId;
      } else if (myOnly === 'true' || (user.role?.includes('sales') && !user.role?.includes('admin'))) {
        // Sales agents see only their own quotations, or admin can filter to their own with myOnly=true
        filters.createdBy = userId;
      }

      if (status) {
        filters.status = status as string;
      }
      
      // Support both startDate/endDate and dateFrom/dateTo for flexibility
      const fromDate = (startDate || dateFrom) as string;
      const toDate = (endDate || dateTo) as string;
      
      if (fromDate && fromDate.trim()) {
        const parsedDate = new Date(fromDate);
        if (!isNaN(parsedDate.getTime())) {
          filters.startDate = parsedDate;
        }
      }
      
      if (toDate && toDate.trim()) {
        const parsedDate = new Date(toDate);
        if (!isNaN(parsedDate.getTime())) {
          filters.endDate = parsedDate;
        }
      }
      
      // Search by quotation ID
      if (search && (search as string).trim()) {
        filters.search = (search as string).trim();
      }

      const result = await storage.getQuotations(filters);
      res.json(result);
    } catch (error) {
      console.error("Error fetching quotations:", error);
      res.status(500).json({ message: "Failed to fetch quotations" });
    }
  });
  
  // Get sales metrics for dashboard (weekly stats, totals)
  app.get('/api/sales-metrics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const isAdmin = user.role === 'admin' || user.role === 'super_admin';
      
      // Calculate date ranges
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay()); // Start of current week (Sunday)
      weekStart.setHours(0, 0, 0, 0);
      
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // Build filters based on role
      const quotationFilters: any = { startDate: weekStart };
      const soFilters: any = { startDate: weekStart };
      
      if (!isAdmin) {
        quotationFilters.createdBy = userId;
        soFilters.assignedToUserId = userId;
      }
      
      // Get weekly quotations
      const weeklyQuotations = await storage.getQuotations({
        ...quotationFilters,
        limit: 1000,
      });
      
      // Get weekly sales orders
      const weeklySalesOrders = await storage.getSalesOrders({
        ...soFilters,
        limit: 1000,
      });
      
      // Calculate totals
      const weeklyQuotationValue = weeklyQuotations.quotations.reduce((sum: number, q: any) => 
        sum + (parseFloat(q.totalAmount) || 0), 0);
      
      const weeklySoValue = weeklySalesOrders.orders.reduce((sum: number, so: any) => 
        sum + (parseFloat(so.grandTotal) || 0), 0);
      
      // Get all-time totals for current user/all
      const allQuotationFilters: any = { limit: 10000 };
      const allSoFilters: any = { limit: 10000 };
      
      if (!isAdmin) {
        allQuotationFilters.createdBy = userId;
        allSoFilters.assignedToUserId = userId;
      }
      
      const allQuotations = await storage.getQuotations(allQuotationFilters);
      const allSalesOrders = await storage.getSalesOrders(allSoFilters);
      
      const totalQuotationValue = allQuotations.quotations.reduce((sum: number, q: any) => 
        sum + (parseFloat(q.totalAmount) || 0), 0);
      
      const totalSoValue = allSalesOrders.orders.reduce((sum: number, so: any) => 
        sum + (parseFloat(so.grandTotal) || 0), 0);
      
      res.json({
        weekly: {
          quotationsCount: weeklyQuotations.total,
          quotationsValue: weeklyQuotationValue,
          salesOrdersCount: weeklySalesOrders.total,
          salesOrdersValue: weeklySoValue,
        },
        total: {
          quotationsCount: allQuotations.total,
          quotationsValue: totalQuotationValue,
          salesOrdersCount: allSalesOrders.total,
          salesOrdersValue: totalSoValue,
        },
        isAdmin,
      });
    } catch (error) {
      console.error("Error fetching sales metrics:", error);
      res.status(500).json({ message: "Failed to fetch sales metrics" });
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
      
      // Build items array from quotation items for multi-product PDFs
      const pdfItems = quotationItemsResult.length > 0 
        ? quotationItemsResult.map(item => ({
            productName: item.productName || productName,
            quantity: item.quantity || '1',
            unit: item.unit || 'kg',
            unitPrice: item.unitPrice || '0',
            totalPrice: item.totalPrice || String(parseFloat(item.quantity || '0') * parseFloat(item.unitPrice || '0')),
          }))
        : undefined;

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
        leadTime: quotation.leadTime || null,
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
        items: pdfItems,
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

  // Get sales orders with enhanced filtering and role-based access
  app.get('/api/sales-orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { status, companyId, leadId, assignedToUserId, myOnly, startDate, endDate, dateFrom, dateTo, search, limit = '50', offset = '0' } = req.query;
      
      const filters: any = {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      };

      // Role-based filtering
      if (user.role === 'customer') {
        filters.customerId = userId;
      } else if (myOnly === 'true' || (user.role?.includes('sales') && !user.role?.includes('admin'))) {
        // Sales agents see only their assigned sales orders, or admin can filter with myOnly=true
        filters.assignedToUserId = userId;
      }

      if (status) {
        filters.status = status as string;
      }
      
      if (companyId) {
        filters.companyId = parseInt(companyId as string);
      }
      
      if (leadId) {
        filters.leadId = parseInt(leadId as string);
      }
      
      // Only apply assignedToUserId filter if explicitly provided and different from role-based filter
      if (assignedToUserId && !filters.assignedToUserId) {
        filters.assignedToUserId = assignedToUserId as string;
      }
      
      // Support both startDate/endDate and dateFrom/dateTo for flexibility
      const fromDate = (startDate || dateFrom) as string;
      const toDate = (endDate || dateTo) as string;
      
      if (fromDate && fromDate.trim()) {
        const parsedDate = new Date(fromDate);
        if (!isNaN(parsedDate.getTime())) {
          filters.startDate = parsedDate;
        }
      }
      
      if (toDate && toDate.trim()) {
        const parsedDate = new Date(toDate);
        if (!isNaN(parsedDate.getTime())) {
          filters.endDate = parsedDate;
        }
      }
      
      if (search && (search as string).trim()) {
        filters.search = (search as string).trim();
      }

      const result = await storage.getSalesOrders(filters);
      res.json(result);
    } catch (error) {
      console.error("Error fetching sales orders:", error);
      res.status(500).json({ message: "Failed to fetch sales orders" });
    }
  });

  // Get next sales order number - Must be BEFORE :id route
  app.get('/api/sales-orders/next-number', isAuthenticated, async (req: any, res) => {
    try {
      const nextNumber = await storage.getNextSalesOrderNumber();
      res.json({ soNumber: nextNumber });
    } catch (error) {
      console.error("Error getting next sales order number:", error);
      res.status(500).json({ message: "Failed to get next sales order number" });
    }
  });

  // Get single sales order with details
  app.get('/api/sales-orders/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const order = await storage.getSalesOrderWithDetails(parseInt(id));
      
      if (!order) {
        return res.status(404).json({ message: "Sales order not found" });
      }

      // Check access for customers
      if (user.role === 'customer' && order.customerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(order);
    } catch (error) {
      console.error("Error fetching sales order:", error);
      res.status(500).json({ message: "Failed to fetch sales order" });
    }
  });

  // Download Sales Order PDF
  app.get('/api/sales-orders/:id/pdf', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const order = await storage.getSalesOrderWithDetails(parseInt(id));
      
      if (!order) {
        return res.status(404).json({ message: "Sales order not found" });
      }

      // Check access for customers
      if (user.role === 'customer' && order.customerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Generate PDF
      const pdfBuffer = await storage.generateSalesOrderPdf(parseInt(id));

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${order.soNumber}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error generating sales order PDF:", error);
      res.status(500).json({ message: "Failed to generate sales order PDF" });
    }
  });

  // Convert quotation to sales order
  app.post('/api/sales-orders/convert-from-quotation', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user has permission (sales roles or admin)
      const hasPermission = user.role?.includes('sales') || user.role?.includes('admin') || user.role === 'super_admin';
      if (!hasPermission) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const { 
        quotationId,
        paymentTermsAdvancePercent,
        paymentTermsCreditDays,
        expectedDeliveryDate,
        shippingAddress,
        shippingCity,
        shippingState,
        shippingPostalCode,
        shippingCountry,
        shippingMethod,
        billingAddress,
        billingCity,
        billingState,
        billingPostalCode,
        billingCountry,
        portOfLoading,
        portOfDischarge,
        batchNumber,
        creditPeriod,
        internalNotes
      } = req.body;

      if (!quotationId) {
        return res.status(400).json({ message: "Quotation ID is required" });
      }

      // Verify quotation exists and is in accepted status
      const quotation = await storage.getQuotation(quotationId);
      if (!quotation) {
        return res.status(404).json({ message: "Quotation not found" });
      }

      if (quotation.status !== 'accepted' && quotation.status !== 'sent') {
        return res.status(400).json({ message: "Only accepted or sent quotations can be converted to sales orders" });
      }

      const salesOrder = await storage.createSalesOrderFromQuotation(quotationId, {
        paymentTermsAdvancePercent: paymentTermsAdvancePercent ? parseFloat(paymentTermsAdvancePercent) : undefined,
        paymentTermsCreditDays: paymentTermsCreditDays ? parseInt(paymentTermsCreditDays) : undefined,
        expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : undefined,
        shippingAddress,
        shippingCity,
        shippingState,
        shippingPostalCode,
        shippingCountry,
        shippingMethod,
        billingAddress,
        billingCity,
        billingState,
        billingPostalCode,
        billingCountry,
        portOfLoading,
        portOfDischarge,
        batchNumber,
        creditPeriod,
        internalNotes,
        createdBy: userId,
      });

      res.status(201).json(salesOrder);
    } catch (error) {
      console.error("Error converting quotation to sales order:", error);
      res.status(500).json({ message: "Failed to convert quotation to sales order", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Send Sales Order to customer via email
  app.post('/api/sales-orders/:id/send', isAuthenticated, async (req: any, res) => {
    try {
      const orderId = Number(req.params.id), userId = req.user.claims.sub;
      const { emailThreadId, subject, body, to, cc } = req.body || {};
      const [user, order, config] = await Promise.all([storage.getUser(userId), storage.getSalesOrderWithDetails(orderId), storage.getUserEmailConfig(userId)]);
      if (!user) return res.status(404).json({ message: "User not found" });
      if (!(user.role?.includes("sales") || user.role?.includes("admin") || user.role === "super_admin")) return res.status(403).json({ message: "Insufficient permissions" });
      if (!order) return res.status(404).json({ message: "Sales order not found" });
      const mayAccessOrder = canSendSalesOrder(userId, user.role, order);
      if (!mayAccessOrder) return res.status(403).json({ message: "Not authorized to send this sales order" });
      if (!config?.isConnected || !config.titanAppPasswordEncrypted || config.isActive === false) return res.status(400).json({ message: "Titan is not connected.", requiresEmailConnect: true, provider: "titan" });
      const recipients = Array.isArray(to) && to.length ? to : order.customerEmail ? [order.customerEmail] : [];
      if (!recipients.length) return res.status(400).json({ message: "No customer email address found. Please enter a recipient email." });
      const emailSubject = typeof subject === "string" && subject.trim() ? subject.trim() : `Sales Order ${order.soNumber}`;
      let html = typeof body === "string" && body.trim() ? body : `<p>Please find sales order ${order.soNumber} attached.</p>`;
      let text = html.replace(/<[^>]*>/g, "");
      ({ html, text } = applyConfiguredEmailSignature(config, html, text));
      const hasRequestedThread = emailThreadId !== undefined && emailThreadId !== null && emailThreadId !== "";
      const requestedThreadId = hasRequestedThread ? Number(emailThreadId) : undefined;
      if (requestedThreadId !== undefined && (!Number.isInteger(requestedThreadId) || requestedThreadId <= 0)) {
        return res.status(400).json({ message: "Please select a valid email thread or start a new one." });
      }
      let thread = requestedThreadId !== undefined ? await storage.getEmailThread(requestedThreadId) : undefined;
      if (requestedThreadId !== undefined && !thread) {
        return res.status(400).json({ message: "The selected email thread is no longer available. Please choose another thread or start a new one." });
      }
      if (thread && !isSalesOrderEmailThreadCompatible(order, thread)) {
        return res.status(400).json({ message: "This email thread does not belong to the sales order's lead or company." });
      }
      if (!thread && (order.leadId || order.companyId)) {
        thread = await storage.createEmailThread({
          leadId: order.leadId || undefined,
          companyId: order.companyId || undefined,
          subject: emailSubject,
          participantEmails: [config.companyEmail, ...recipients],
          status: "active",
          lastMessageAt: new Date(),
          messageCount: 0,
          isRead: true,
        });
      }
      const parent = thread ? (await storage.getEmailMessages({ threadId: thread.id })).sort((a,b) => Number(b.sentAt || b.receivedAt || 0) - Number(a.sentAt || a.receivedAt || 0)).find(item => item.messageIdHeader) : undefined;
      const inReplyTo = parent?.messageIdHeader || undefined, references = inReplyTo ? [parent?.referencesHeader, inReplyTo].filter(Boolean).join(" ") : undefined;
      const pdf = await storage.generateSalesOrderPdf(orderId);
      const ccRecipients = Array.isArray(cc) ? cc : cc ? [cc] : [];
      const result = await titanEmailProvider.send({ email: config.companyEmail, encryptedAppPassword: config.titanAppPasswordEncrypted }, { to: recipients, cc: ccRecipients, subject: emailSubject, bodyHtml: html, bodyText: text, fromName: config.displayName || undefined, inReplyTo, references, attachments: [{ filename: `${order.soNumber}.pdf`, mimeType: "application/pdf", base64Data: pdf.toString("base64") }] });
      if (thread) {
        if (!thread.threadId) await storage.updateEmailThread(thread.id, { threadId: result.threadId });
        await storage.createEmailMessage({ messageId: result.messageId, messageIdHeader: result.messageId, referencesHeader: references, threadId: thread.id, leadId: order.leadId || undefined, direction: "outbound", fromEmail: config.companyEmail, fromName: config.displayName || undefined, toEmails: recipients, ccEmails: ccRecipients, subject: emailSubject, bodyHtml: html, bodyText: text, attachments: [{ filename: `${order.soNumber}.pdf`, mimeType: "application/pdf", size: pdf.length }], sentAt: new Date(), status: "sent", senderId: userId, isRead: true });
        await storage.updateEmailThread(thread.id, { lastMessageAt: new Date(), participantEmails: Array.from(new Set<string>([...(thread.participantEmails || []), config.companyEmail, ...recipients])) });
      }

      await storage.updateSalesOrder(orderId, {
        status: "confirmed",
        ...(thread ? { emailThreadId: thread.id } : {}),
      });
      await storage.addSalesOrderActivity({
        salesOrderId: orderId,
        activityType: "email_sent",
        title: "Sales Order Sent to Customer",
        description: `Sales order ${order.soNumber} was sent to ${recipients.join(", ")}`,
        performedBy: userId,
        metadata: { toEmails: recipients, ccEmails: ccRecipients, subject: emailSubject } as any,
      });
      if (order.leadId) {
        await storage.createLeadActivity({
          leadId: order.leadId,
          activityType: "sales_order_sent",
          subject: "Sales Order Sent",
          description: `Sales Order ${order.soNumber} sent to ${recipients.join(", ")}`,
          createdBy: userId,
        });
      }
      await storage.addSalesOrderStatusHistory({
        salesOrderId: orderId,
        fromStatus: order.status,
        toStatus: "confirmed",
        changedBy: userId,
        notes: `Sent to customer at ${recipients.join(", ")}`,
      });

      res.json({
        success: true,
        provider: "titan",
        message: "Sales order sent successfully",
        messageId: result.messageId,
        sentFolderSaved: result.sentFolderSaved,
        warning: result.warning,
      });
    } catch (error) { console.error("Titan sales order send error:", error); res.status(500).json({ message: "Failed to send sales order email" }); }
  });

  // Update sales order
  app.patch('/api/sales-orders/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user has permission
      const hasPermission = user.role?.includes('sales') || user.role?.includes('admin') || user.role === 'super_admin';
      if (!hasPermission) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const order = await storage.getSalesOrder(parseInt(id));
      if (!order) {
        return res.status(404).json({ message: "Sales order not found" });
      }

      const updatedOrder = await storage.updateSalesOrder(parseInt(id), req.body);
      
      // Log activity
      await storage.addSalesOrderActivity({
        salesOrderId: parseInt(id),
        activityType: 'updated',
        title: 'Order Updated',
        description: 'Sales order details were updated',
        performedBy: userId,
        createdAt: new Date(),
      });

      res.json(updatedOrder);
    } catch (error) {
      console.error("Error updating sales order:", error);
      res.status(500).json({ message: "Failed to update sales order" });
    }
  });

  // Update sales order status
  app.patch('/api/sales-orders/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user has permission
      const hasPermission = user.role?.includes('sales') || user.role?.includes('admin') || user.role === 'super_admin';
      if (!hasPermission) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }

      const order = await storage.getSalesOrder(parseInt(id));
      if (!order) {
        return res.status(404).json({ message: "Sales order not found" });
      }

      const updatedOrder = await storage.updateSalesOrderStatus(parseInt(id), status, userId, notes);
      res.json(updatedOrder);
    } catch (error) {
      console.error("Error updating sales order status:", error);
      res.status(500).json({ message: "Failed to update sales order status" });
    }
  });

  // Get sales order items
  app.get('/api/sales-orders/:id/items', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const items = await storage.getSalesOrderItems(parseInt(id));
      res.json(items);
    } catch (error) {
      console.error("Error fetching sales order items:", error);
      res.status(500).json({ message: "Failed to fetch sales order items" });
    }
  });

  // Get sales order status history
  app.get('/api/sales-orders/:id/history', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const history = await storage.getSalesOrderStatusHistory(parseInt(id));
      res.json(history);
    } catch (error) {
      console.error("Error fetching sales order history:", error);
      res.status(500).json({ message: "Failed to fetch sales order history" });
    }
  });

  // Get sales order activities
  app.get('/api/sales-orders/:id/activities', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const activities = await storage.getSalesOrderActivities(parseInt(id));
      res.json(activities);
    } catch (error) {
      console.error("Error fetching sales order activities:", error);
      res.status(500).json({ message: "Failed to fetch sales order activities" });
    }
  });

  // Get sales orders by company
  app.get('/api/companies/:companyId/sales-orders', isAuthenticated, async (req: any, res) => {
    try {
      const { companyId } = req.params;
      const orders = await storage.getSalesOrdersByCompany(parseInt(companyId));
      res.json(orders);
    } catch (error) {
      console.error("Error fetching company sales orders:", error);
      res.status(500).json({ message: "Failed to fetch company sales orders" });
    }
  });

  // Get sales orders by lead
  app.get('/api/leads/:leadId/sales-orders', isAuthenticated, async (req: any, res) => {
    try {
      const { leadId } = req.params;
      const orders = await storage.getSalesOrdersByLead(parseInt(leadId));
      res.json(orders);
    } catch (error) {
      console.error("Error fetching lead sales orders:", error);
      res.status(500).json({ message: "Failed to fetch lead sales orders" });
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
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role === 'customer') {
        return res.status(403).json({ message: "Access denied" });
      }
      const stats = await storage.getDashboardStats(user.id);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get('/api/dashboard/overview', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || !['super_admin', 'admin'].includes(user.role || '')) {
        return res.status(403).json({ message: "Access denied" });
      }
      const overview = await storage.getDashboardOverview();
      res.json(overview);
    } catch (error) {
      console.error("Error fetching dashboard overview:", error);
      res.status(500).json({ message: "Failed to fetch dashboard overview" });
    }
  });

  // ─── Admin Security & Activity Monitor ────────────────────────────────────

  function requireAdmin(req: any, res: any, user: any): boolean {
    if (!user || !['super_admin', 'admin'].includes(user.role || '')) {
      res.status(403).json({ message: "Admin access required" });
      return false;
    }
    return true;
  }

  app.get('/api/admin/security/login-logs', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!requireAdmin(req, res, user)) return;
      const { userId, dateFrom, dateTo, flaggedOnly, limit = '50', offset = '0' } = req.query;
      const result = await storage.getLoginLogs({
        userId: userId as string | undefined,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
        flaggedOnly: flaggedOnly === 'true',
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });
      res.json(result);
    } catch (error) {
      console.error('Error fetching login logs:', error);
      res.status(500).json({ message: 'Failed to fetch login logs' });
    }
  });

  app.get('/api/admin/security/activity-logs', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!requireAdmin(req, res, user)) return;
      const { userId, entityType, dateFrom, dateTo, limit = '50', offset = '0' } = req.query;
      const result = await storage.getAccessLogs({
        userId: userId as string | undefined,
        entityType: entityType as string | undefined,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });
      res.json(result);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      res.status(500).json({ message: 'Failed to fetch activity logs' });
    }
  });

  app.get('/api/admin/security/alerts', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!requireAdmin(req, res, user)) return;
      const { userId, isResolved, severity, limit = '50', offset = '0' } = req.query;
      const result = await storage.getSecurityAlerts({
        userId: userId as string | undefined,
        isResolved: isResolved === 'true' ? true : isResolved === 'false' ? false : undefined,
        severity: severity as string | undefined,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });
      res.json(result);
    } catch (error) {
      console.error('Error fetching security alerts:', error);
      res.status(500).json({ message: 'Failed to fetch security alerts' });
    }
  });

  app.put('/api/admin/security/alerts/:id/resolve', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!requireAdmin(req, res, user)) return;
      const alert = await storage.resolveSecurityAlert(parseInt(req.params.id), req.user.claims.sub);
      res.json(alert);
    } catch (error) {
      console.error('Error resolving alert:', error);
      res.status(500).json({ message: 'Failed to resolve alert' });
    }
  });

  app.get('/api/admin/security/user-summary', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!requireAdmin(req, res, user)) return;
      const summary = await storage.getSecurityUserSummary();
      res.json(summary);
    } catch (error) {
      console.error('Error fetching security user summary:', error);
      res.status(500).json({ message: 'Failed to fetch user security summary' });
    }
  });

  // AWS S3 Image Upload Routes

  // Upload hero slider media (images with WebP processing and videos)
  app.post('/api/admin/hero-slides/upload', isAuthenticated, webpUpload.any(), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (!user.role?.includes('admin') && user.role !== 'website_manager' && user.role !== 'quality_manager' && user.role !== 'quality_executive')) {
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

        // Hero slides only accept images. The shared upload filter also admits document
        // extensions (for the product form) — those must never reach raw upload paths here.
        if (!ImageProcessor.isValidImageFormat(file.mimetype)) {
          return res.status(400).json({ message: `${file.originalname}: only image files can be used for hero slides` });
        }

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
            // Decode failure means the bytes are not a real image — never raw-upload them
            console.error(`❌ Not a decodable hero slider image ${file.originalname}:`, error);
            return res.status(400).json({ message: `${file.originalname}: file is not a valid image` });
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
  // Multer is invoked manually so filter/size rejections return a clean 400 (not a generic 500)
  app.post('/api/admin/products/upload', isAuthenticated, isAdminOrWebsiteManager, (req: any, res, next) => {
    webpUpload.any()(req, res, (err: any) => {
      if (err) {
        console.error('Product upload rejected:', err?.message);
        const message = err?.code === 'LIMIT_FILE_SIZE'
          ? 'File is too large (max 10MB)'
          : (err?.message || 'Upload failed');
        return res.status(400).json({ message });
      }
      next();
    });
  }, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (!user.role?.includes('admin') && user.role !== 'website_manager' && user.role !== 'quality_manager' && user.role !== 'quality_executive')) {
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
            const route = classifyUploadedFile(file);
            if (route.error) {
              return res.status(400).json({ message: route.error });
            }
            if (route.kind === 'image') {
              console.log(`📸 Processing image: ${file.originalname} (${file.size} bytes)`);
              let processedImages;
              try {
                // Decode + convert into 3 WebP sizes — decode failure means the bytes are not a real image
                processedImages = await imageProcessor.processProductImage(file.buffer, file.originalname);
              } catch (error) {
                console.error(`❌ Not a decodable image ${file.originalname}:`, error);
                return res.status(400).json({ message: `${file.originalname}: file is not a valid image` });
              }
              // S3 errors here fall through to the route's catch (500) — never a raw-bytes fallback
              const uploadedUrls = await s3Service.uploadProductImages(processedImages, productId);
              processedUrls.push(uploadedUrls.medium);
              console.log(`✅ Successfully processed image ${file.originalname} -> ${uploadedUrls.medium}`);
            } else {
              // Document — bytes already validated by classifyUploadedFile; stored
              // Content-Type is chosen server-side (client MIME/filename are untrusted)
              console.log(`📄 Processing document: ${file.originalname} (${file.size} bytes)`);
              const safeProductId = String(productId).replace(/[^a-zA-Z0-9_-]/g, '_');
              const { url } = await uploadQualityAttachment(file.buffer, file.originalname, `products/${safeProductId}/documents`);
              processedUrls.push(url);
              console.log(`✅ Successfully uploaded document ${file.originalname}`);
            }
          }
          
          uploadedFiles[fieldName] = processedUrls;
        } else {
          // Single file - includes secondImage, thirdImage, mainImage, documents
          const file = fileArray[0];
          if (!file) continue;

          const route = classifyUploadedFile(file);
          if (route.error) {
            return res.status(400).json({ message: route.error });
          }
          if (route.kind === 'image') {
            console.log(`📸 Processing image: ${file.originalname} (${file.size} bytes)`);
            let processedImages;
            try {
              // Decode + convert into 3 WebP sizes — decode failure means the bytes are not a real image
              processedImages = await imageProcessor.processProductImage(file.buffer, file.originalname);
            } catch (error) {
              console.error(`❌ Not a decodable image ${file.originalname}:`, error);
              return res.status(400).json({ message: `${file.originalname}: file is not a valid image` });
            }
            // S3 errors here fall through to the route's catch (500) — never a raw-bytes fallback
            const uploadedUrls = await s3Service.uploadProductImages(processedImages, productId);
            uploadedFiles[fieldName] = uploadedUrls.medium;
            console.log(`✅ Successfully processed image ${file.originalname} -> ${uploadedUrls.medium}`);
          } else {
            // Document — bytes already validated by classifyUploadedFile; stored
            // Content-Type is chosen server-side (client MIME/filename are untrusted)
            console.log(`📄 Processing document: ${file.originalname} (${file.size} bytes)`);
            const safeProductId = String(productId).replace(/[^a-zA-Z0-9_-]/g, '_');
            const { url } = await uploadQualityAttachment(file.buffer, file.originalname, `products/${safeProductId}/documents`);
            uploadedFiles[fieldName] = url;
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
  app.post('/api/admin/products/presigned-url', isAuthenticated, isAdminOrWebsiteManager, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (!user.role?.includes('admin') && user.role !== 'website_manager' && user.role !== 'quality_manager' && user.role !== 'quality_executive')) {
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
  app.delete('/api/admin/products/image/:s3Key', isAuthenticated, isAdminOrWebsiteManager, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (!user.role?.includes('admin') && user.role !== 'website_manager' && user.role !== 'quality_manager' && user.role !== 'quality_executive')) {
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
  // Role guard for website-management endpoints (products, categories, tags, sliders).
  // Reads (GET): any staff account — customers are blocked.
  // Writes: admins, website managers, and quality roles (the quality team manages
  // product content through their dashboard's Website Management section).
  function canManageWebsiteContent(role?: string | null) {
    return !!role && (role.includes('admin') || role === 'website_manager' || role === 'quality_manager' || role === 'quality_executive');
  }

  async function isAdminOrWebsiteManager(req: any, res: any, next: any) {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      if (!user || user.role === 'customer') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      if (req.method !== 'GET' && !canManageWebsiteContent(user.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      req.staffUser = user;
      next();
    } catch (error) {
      console.error("Error verifying website management permissions:", error);
      res.status(500).json({ message: "Failed to verify permissions" });
    }
  }

  async function isSeoManager(req: any, res: any, next: any) {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const user = await storage.getUser(userId);
      if (!user || !["admin", "super_admin", "seo_manager", "website_manager"].includes(user.role || "")) {
        return res.status(403).json({ message: "SEO management access is required" });
      }
      req.staffUser = user;
      next();
    } catch (error) {
      console.error("Error verifying SEO management permissions:", error);
      res.status(500).json({ message: "Failed to verify permissions" });
    }
  }

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
  app.get('/api/admin/products/bulk', isAuthenticated, isAdminOrWebsiteManager, async (req, res) => {
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

  // Delete product (admins/website managers only — quality roles can edit but not delete)
  app.delete('/api/admin/products/:id', isAuthenticated, isAdminOrWebsiteManager, async (req, res) => {
    try {
      const role = (req as any).staffUser?.role as string | undefined;
      if (!role || (!role.includes('admin') && role !== 'website_manager')) {
        return res.status(403).json({ message: "Only administrators or website managers can delete products" });
      }
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
  const getProductCategories = async (req: any, res: any) => {
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
  };
  app.get('/api/products/:id/categories', requirePublishedProduct, getProductCategories);
  app.get('/api/admin/products/:id/category-details', isAuthenticated, isAdminOrWebsiteManager, getProductCategories);

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

  // Bulk generate EU-focused SEO titles and descriptions for all active products
  app.post('/api/admin/products/bulk-seo-generate', isAuthenticated, isAdminOrWebsiteManager, async (req: any, res) => {
    try {
      const userRole = req.user?.claims?.role;
      if (!userRole || !['admin', 'super_admin'].includes(userRole)) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const rows = await db
        .select({
          id: products.id,
          name: products.name,
          botanicalName: products.botanicalName,
          isOrganic: products.isOrganic,
          productType: products.productType,
          form: products.form,
          origin: products.origin,
          category: categories.name,
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(eq(products.isActive, true));

      let organicCount = 0;
      let conventionalCount = 0;

      for (const product of rows) {
        const { seoTitle, seoDescription } = generateProductSEO(product);
        const isOrg = !!(product.isOrganic || product.productType === "organic" || product.name.toLowerCase().includes("organic"));
        if (isOrg) organicCount++; else conventionalCount++;

        await db
          .update(products)
          .set({ seoTitle, seoDescription })
          .where(eq(products.id, product.id));
      }

      res.json({
        success: true,
        updated: rows.length,
        organic: organicCount,
        conventional: conventionalCount,
      });
    } catch (error) {
      console.error("Error bulk generating SEO:", error);
      res.status(500).json({ message: "Failed to generate SEO content" });
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
  app.get('/api/products/:productId/faqs', requirePublishedProduct, async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const faqs = await storage.getProductFaqs(productId);
      res.json(faqs);
    } catch (error) {
      console.error('Error fetching product FAQs:', error);
      res.status(500).json({ message: "Failed to fetch FAQs" });
    }
  });

  app.post('/api/admin/products/:productId/faqs', isAuthenticated, isAdminOrWebsiteManager, async (req: any, res) => {
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

  app.put('/api/admin/products/faqs/:id', isAuthenticated, isAdminOrWebsiteManager, async (req: any, res) => {
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

  app.delete('/api/admin/products/faqs/:id', isAuthenticated, isAdminOrWebsiteManager, async (req: any, res) => {
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

  app.post('/api/admin/blog', isAuthenticated, isAdminOrWebsiteManager, async (req: any, res) => {
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

  app.put('/api/admin/blog/:id', isAuthenticated, isAdminOrWebsiteManager, async (req: any, res) => {
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

  app.delete('/api/admin/blog/:id', isAuthenticated, isAdminOrWebsiteManager, async (req: any, res) => {
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
  // Read-only, intentionally not role-gated: exposes monitoring data with no mutation
  // surface; the write route below is role-gated via isAdminOrWebsiteManager.
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

  app.post('/api/admin/seo/issues', isAuthenticated, isAdminOrWebsiteManager, async (req: any, res) => {
    try {
      const issueData = insertSeoMonitoringSchema.parse(req.body);
      const issue = await storage.createSeoIssue(issueData);
      res.json(issue);
    } catch (error) {
      console.error('Error creating SEO issue:', error);
      res.status(500).json({ message: "Failed to create SEO issue" });
    }
  });

  const searchConsoleDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD").refine((value) => {
    const [year, month, day] = value.split("-").map(Number);
    const parsed = new Date(Date.UTC(year, month - 1, day));
    return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
  }, "Must be a real calendar date");
  const keywordPerformanceImportSchema = z.object({
    periodStart: searchConsoleDate,
    periodEnd: searchConsoleDate,
    rows: z.array(z.object({
      query: z.string().trim().min(1).max(500),
      page: z.string().trim().max(2000).nullable().optional(),
      country: z.string().trim().max(100).nullable().optional(),
      device: z.string().trim().max(50).nullable().optional(),
      clicks: z.number().int().min(0).max(2_147_483_647),
      impressions: z.number().int().min(0).max(2_147_483_647),
      ctr: z.number().min(0).max(1),
      position: z.number().min(0).max(10_000),
      conversions: z.number().int().min(0).max(2_147_483_647).optional(),
    })).min(1).max(5000),
  }).refine((value) => value.periodStart <= value.periodEnd, {
    message: "periodStart must be on or before periodEnd",
    path: ["periodEnd"],
  });

  // Search Console snapshots are explicitly imported by an authorized staff member;
  // no Google credentials are stored by this application.
  app.post('/api/admin/seo/keyword-performance/import', isAuthenticated, isSeoManager, async (req: any, res) => {
    try {
      const input = keywordPerformanceImportSchema.parse(req.body);
      const snapshotRows = new Map<string, typeof input.rows[number]>();
      for (const row of input.rows) {
        const key = [row.query, row.page || "", row.country || "", row.device || ""].join("\u0000");
        snapshotRows.set(key, row);
      }
      const values = Array.from(snapshotRows.values()).map((row) => ({
        ...row,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        page: row.page || "",
        country: row.country || "",
        device: row.device || "",
        ctr: String(row.ctr),
        position: String(row.position),
        conversions: row.conversions ?? 0,
        importedAt: new Date(),
      }));
      await db.insert(seoKeywordPerformance).values(values).onConflictDoUpdate({
        target: [
          seoKeywordPerformance.periodStart, seoKeywordPerformance.periodEnd,
          seoKeywordPerformance.query, seoKeywordPerformance.page,
          seoKeywordPerformance.country, seoKeywordPerformance.device,
        ],
        set: {
          clicks: sql`excluded.clicks`,
          impressions: sql`excluded.impressions`,
          ctr: sql`excluded.ctr`,
          position: sql`excluded.position`,
          conversions: sql`excluded.conversions`,
          importedAt: sql`excluded.imported_at`,
        },
      });
      res.status(201).json({ imported: values.length, periodStart: input.periodStart, periodEnd: input.periodEnd });
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid import data", errors: error.flatten() });
      console.error("Error importing keyword performance:", error);
      res.status(500).json({ message: "Failed to import keyword performance" });
    }
  });

  app.get('/api/admin/seo/keyword-performance', isAuthenticated, isSeoManager, async (req: any, res) => {
    try {
      const days = z.coerce.number().int().min(1).max(365).catch(28).parse(req.query.days);
      const periods = await db.selectDistinct({
        periodStart: seoKeywordPerformance.periodStart,
        periodEnd: seoKeywordPerformance.periodEnd,
      }).from(seoKeywordPerformance)
        .orderBy(desc(seoKeywordPerformance.periodEnd), desc(seoKeywordPerformance.periodStart))
        .limit(100);
      const duration = (period: { periodStart: string; periodEnd: string }) =>
        Math.round((Date.parse(`${period.periodEnd}T00:00:00Z`) - Date.parse(`${period.periodStart}T00:00:00Z`)) / 86_400_000) + 1;
      const preferredPeriods = periods.filter((period) => duration(period) === days);
      const currentPeriod = preferredPeriods[0] || periods[0];
      const previousPeriod = currentPeriod
        ? (preferredPeriods.slice(1).find((period) => period.periodEnd < currentPeriod.periodStart)
          || periods.find((period) => period.periodEnd < currentPeriod.periodStart))
        : undefined;
      const currentCondition = currentPeriod ? and(
        eq(seoKeywordPerformance.periodStart, currentPeriod.periodStart),
        eq(seoKeywordPerformance.periodEnd, currentPeriod.periodEnd),
      ) : undefined;
      const previousCondition = previousPeriod ? and(
        eq(seoKeywordPerformance.periodStart, previousPeriod.periodStart),
        eq(seoKeywordPerformance.periodEnd, previousPeriod.periodEnd),
      ) : undefined;
      const rows = currentCondition
        ? await db.select().from(seoKeywordPerformance).where(previousCondition ? or(currentCondition, previousCondition) : currentCondition)
        : [];
      type Aggregate = { clicks: number; impressions: number; conversions: number; positionWeight: number };
      const aggregate = (source: typeof rows) => {
        const totals: Aggregate = { clicks: 0, impressions: 0, conversions: 0, positionWeight: 0 };
        const queries = new Map<string, Aggregate>();
        for (const row of source) {
          const clicks = row.clicks, impressions = row.impressions, conversions = row.conversions;
          const position = Number(row.position);
          const entry = queries.get(row.query.toLowerCase()) || { clicks: 0, impressions: 0, conversions: 0, positionWeight: 0 };
          for (const item of [totals, entry]) {
            item.clicks += clicks; item.impressions += impressions; item.conversions += conversions;
            item.positionWeight += position * impressions;
          }
          queries.set(row.query.toLowerCase(), entry);
        }
        return { totals, queries };
      };
      const current = aggregate(rows.filter((row) =>
        row.periodStart === currentPeriod?.periodStart && row.periodEnd === currentPeriod?.periodEnd
      ));
      const previous = aggregate(rows.filter((row) =>
        row.periodStart === previousPeriod?.periodStart && row.periodEnd === previousPeriod?.periodEnd
      ));
      const formatMetric = (metrics: Aggregate) => ({
        clicks: metrics.clicks, impressions: metrics.impressions, conversions: metrics.conversions,
        ctr: metrics.impressions ? metrics.clicks / metrics.impressions : 0,
        position: metrics.impressions ? metrics.positionWeight / metrics.impressions : 0,
      });
      const settings = await storage.getGlobalSeoSettings();
      const keywordFields = ["primaryKeywords", "pharmaceuticalKeywords", "nutraceuticalKeywords", "northAmericaKeywords", "europeKeywords", "asiaPacificKeywords", "indiaKeywords", "middleEastKeywords", "latinAmericaKeywords"] as const;
      const targets = Array.from(new Set(keywordFields.flatMap((field) => (settings?.[field] || "").split(",").map((keyword) => keyword.trim()).filter(Boolean).map((keyword) => keyword.toLowerCase()))));
      const normalizeTokens = (value: string) => value.toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((token) => token.length > 3 && token.endsWith("s") ? token.slice(0, -1) : token);
      const matchesTarget = (query: string, keyword: string) => {
        const targetTokens = normalizeTokens(keyword);
        const queryTokens = new Set(normalizeTokens(query));
        if (!targetTokens.length) return false;
        return targetTokens.filter((token) => queryTokens.has(token)).length / targetTokens.length >= 0.6;
      };
      const metricsForTarget = (queries: Map<string, Aggregate>, keyword: string) => {
        const combined: Aggregate = { clicks: 0, impressions: 0, conversions: 0, positionWeight: 0 };
        queries.forEach((metrics, query) => {
          if (!matchesTarget(query, keyword)) return;
          combined.clicks += metrics.clicks;
          combined.impressions += metrics.impressions;
          combined.conversions += metrics.conversions;
          combined.positionWeight += metrics.positionWeight;
        });
        return formatMetric(combined);
      };
      const topQueries = Array.from(current.queries.entries()).map(([query, metrics]) => ({ query, ...formatMetric(metrics) }))
        .sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions || a.query.localeCompare(b.query)).slice(0, 50);
      const replacementCandidates = topQueries.filter((query) =>
        query.impressions >= 20 && !targets.some((keyword) => matchesTarget(query.query, keyword))
      );
      const recommendationFor = (keyword: string, targetIndex: number) => {
        const metric = metricsForTarget(current.queries, keyword);
        const prior = metricsForTarget(previous.queries, keyword);
        let recommendation: "keep" | "improve" | "replace" | "monitor" = "monitor";
        let reason = "Insufficient impressions to make a reliable change recommendation.";
        if (current.totals.impressions > 0 && metric.impressions === 0) {
          recommendation = "replace"; reason = "No visibility was recorded for this target in the imported period.";
        } else if (metric.impressions >= 20 && prior.clicks > 0 && metric.clicks < prior.clicks * 0.8) {
          recommendation = "improve"; reason = "Clicks declined by 20% or more versus the prior period.";
        } else if (metric.impressions >= 20 && metric.position > 20) {
          recommendation = "replace"; reason = "Average position is below 20 despite meaningful impressions.";
        } else if (metric.impressions >= 20 && metric.ctr < 0.02) {
          recommendation = "improve"; reason = "CTR is below 2% with meaningful impressions.";
        } else if (metric.impressions >= 20 && metric.position <= 10 && metric.ctr >= 0.03) {
          recommendation = "keep"; reason = "Top-10 position and CTR of at least 3% are performing well.";
        }
        const suggestedReplacement = recommendation === "replace" && replacementCandidates.length
          ? replacementCandidates[targetIndex % replacementCandidates.length].query
          : null;
        return { keyword, ...metric, previous: prior, recommendation, reason, suggestedReplacement };
      };
      res.json({
        period: currentPeriod ? { start: currentPeriod.periodStart, end: currentPeriod.periodEnd, days: duration(currentPeriod) } : null,
        previousPeriod: previousPeriod ? { start: previousPeriod.periodStart, end: previousPeriod.periodEnd, days: duration(previousPeriod) } : null,
        requestedDays: days,
        current: formatMetric(current.totals),
        previous: formatMetric(previous.totals),
        targets: targets.map(recommendationFor),
        topQueries,
      });
    } catch (error) {
      console.error("Error fetching keyword performance:", error);
      res.status(500).json({ message: "Failed to fetch keyword performance" });
    }
  });

  const keywordReviewSchema = z.object({
    keyword: z.string().trim().min(1).max(500),
    replacement: z.string().trim().min(1).max(500).refine((value) => !value.includes(","), "Replacement must be one keyword without commas").nullable().optional(),
    recommendation: z.enum(["keep", "improve", "replace"]),
    reason: z.string().trim().min(1).max(5000),
    status: z.enum(["proposed", "approved", "rejected"]).default("proposed"),
    metrics: z.record(z.unknown()).optional(),
  }).superRefine((value, context) => {
    if (value.recommendation === "replace" && !value.replacement) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["replacement"], message: "A replacement keyword is required" });
    }
  });
  app.post('/api/admin/seo/keyword-reviews', isAuthenticated, isSeoManager, async (req: any, res) => {
    try {
      const review = keywordReviewSchema.parse(req.body);
      const [created] = await db.insert(seoKeywordReviews).values({
        ...review, reviewedBy: req.staffUser?.id, reviewedAt: new Date(),
      }).returning();
      res.status(201).json(created);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid review data", errors: error.flatten() });
      console.error("Error recording keyword review:", error);
      res.status(500).json({ message: "Failed to record keyword review" });
    }
  });
  app.get('/api/admin/seo/keyword-reviews', isAuthenticated, isSeoManager, async (_req: any, res) => {
    try {
      res.json(await db.select().from(seoKeywordReviews).orderBy(desc(seoKeywordReviews.createdAt)).limit(50));
    } catch (error) {
      console.error("Error fetching keyword reviews:", error);
      res.status(500).json({ message: "Failed to fetch keyword reviews" });
    }
  });

  const seoMappingSchema = z.object({
    keyword: z.string().trim().min(1).max(500),
    pageUrl: z.string().trim().min(1).max(2000),
    pageType: z.enum(["static", "product", "category", "health_support", "blog"]),
    pageId: z.string().trim().max(100).nullable().optional(),
  });
  const seoOpportunityStatusSchema = z.object({
    status: z.enum(["open", "in_progress", "completed", "dismissed"]),
    notes: z.string().trim().max(5000).nullable().optional(),
    evidence: z.record(z.unknown()),
    evidenceToken: z.string().regex(/^[a-f0-9]{64}$/),
  });
  const actionFingerprint = (...parts: string[]) =>
    crypto.createHash("sha256").update(parts.join("\u0000")).digest("hex");
  const evidenceToken = (fingerprint: string, evidence: Record<string, unknown>) => {
    if (!process.env.SESSION_SECRET) throw new Error("SESSION_SECRET is required to sign SEO opportunity evidence");
    return crypto.createHmac("sha256", process.env.SESSION_SECRET)
      .update(`${fingerprint}\u0000${JSON.stringify(evidence)}`).digest("hex");
  };
  const visibleText = (value: unknown) => String(value || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const allTargetKeywords = (settings: any) => {
    const fields = ["primaryKeywords", "pharmaceuticalKeywords", "nutraceuticalKeywords", "northAmericaKeywords", "europeKeywords", "asiaPacificKeywords", "indiaKeywords", "middleEastKeywords", "latinAmericaKeywords"];
    return Array.from(new Set([
      ...fields.flatMap((field) => String(settings?.[field] || "").split(",").map((keyword) => keyword.trim().toLowerCase()).filter(Boolean)),
      ...KEYWORD_ASSIGNMENTS.map((assignment) => assignment.keyword.toLowerCase()),
    ]));
  };
  const staticSeoPaths = new Set(SITEMAP_STATIC_PATHS);
  const loadIndexableSeoPages = async () => {
    const [settings, productRows, categoryRows, healthSupportRows, publishedBlogResult] = await Promise.all([
      storage.getGlobalSeoSettings(),
      db.select().from(products).where(and(eq(products.isActive, true), eq(products.isVisible, true))).limit(5000),
      db.select().from(categories).where(eq(categories.isActive, true)).limit(1000),
      storage.getHealthSupports(),
      storage.getBlogPosts({ published: true, limit: 1000, offset: 0 }),
    ]);
    const indexableProductRows = productRows.filter(isIndexableSitemapProduct);
    const indexableCategoryRows = categoryRows.filter(isIndexableSitemapCategory);
    const indexableHealthSupportRows = healthSupportRows.filter(isIndexableSitemapHealthSupport);
    const indexableBlogPosts = publishedBlogResult.posts.filter(isIndexableSitemapBlogPost);
    const sitemapEntries = buildSitemapEntries({
      products: indexableProductRows,
      categories: indexableCategoryRows,
      healthSupports: indexableHealthSupportRows,
      blogPosts: indexableBlogPosts,
    });
    const sitemapUrls = new Set(sitemapEntries.map((entry) => entry.url));
    const siteTitle = settings?.siteTitle || HOME_SEO.title;
    const siteDescription = settings?.siteDescription || HOME_SEO.description;
    const indexParents = new Set(["/products", "/ingredients", "/health-support", "/blog"]);
    const pages: SeoPage[] = [
      {
        id: "/", type: "static", url: `${CANONICAL_ORIGIN}/`,
        title: siteTitle, description: siteDescription,
        content: `${siteTitle} ${siteDescription}`,
        canonicalUrl: `${CANONICAL_ORIGIN}/`,
        inSitemap: sitemapUrls.has(`${CANONICAL_ORIGIN}/`),
        hasInboundLink: true,
      },
      ...Object.entries(STATIC_PAGE_SEO).map(([path, meta]) => {
        const url = `${CANONICAL_ORIGIN}${path}`;
        return {
          id: path, type: "static" as const, url,
          title: meta.title, description: meta.description, content: `${meta.title} ${meta.description}`,
          canonicalUrl: url, inSitemap: sitemapUrls.has(url), hasInboundLink: true,
        };
      }),
      ...Object.entries(COLLECTION_PAGE_SEO).map(([path, meta]) => {
        const url = `${CANONICAL_ORIGIN}${path}`;
        return {
          id: path, type: "static" as const, url, title: meta.title,
          description: meta.description, content: `${meta.title} ${meta.description}`,
          canonicalUrl: url, inSitemap: sitemapUrls.has(url), hasInboundLink: true,
        };
      }),
      ...indexableProductRows.map((product) => {
        const url = sitemapPageUrl("/products", product.slug);
        return {
          id: String(product.id), type: "product" as const, url,
          title: product.seoTitle || `${product.name} | ${siteTitle}`,
          description: product.seoDescription || product.description || siteDescription,
          content: visibleText(`${product.name} ${product.description || ""} ${product.specificationSheet || ""}`),
          image: product.openGraphImage || product.mainImage, canonicalUrl: product.canonicalUrl || url,
          inSitemap: sitemapUrls.has(url), hasInboundLink: indexParents.has("/products"),
        };
      }),
      ...indexableCategoryRows.map((category) => {
        const url = sitemapPageUrl("/ingredients", category.slug);
        const meta = categoryPageSeo(category.name);
        return {
          id: String(category.id), type: "category" as const, url,
          title: meta.title,
          description: category.description?.trim().length >= 70 ? category.description : meta.description,
          content: visibleText(`${category.name} ${category.description || ""}`),
          image: category.imageUrl, canonicalUrl: url,
          inSitemap: sitemapUrls.has(url), hasInboundLink: indexParents.has("/ingredients"),
        };
      }),
      ...indexableHealthSupportRows.map((healthSupport) => {
        const url = sitemapPageUrl("/health-support", healthSupport.slug);
        const meta = healthSupportPageSeo(healthSupport.name);
        return {
          id: String(healthSupport.id), type: "health_support" as const, url,
          title: meta.title,
          description: healthSupport.description?.trim().length >= 70 ? healthSupport.description : meta.description,
          content: visibleText(`${healthSupport.name} ${healthSupport.description || ""}`),
          canonicalUrl: url,
          inSitemap: sitemapUrls.has(url), hasInboundLink: indexParents.has("/health-support"),
        };
      }),
      ...indexableBlogPosts.map((post) => {
        const url = sitemapPageUrl("/blog", post.slug);
        return {
          id: String(post.id), type: "blog" as const, url,
          title: post.metaTitle || `${post.title} | ${siteTitle}`,
          description: post.metaDescription || post.excerpt || siteDescription,
          content: visibleText(`${post.title} ${post.content}`), image: post.featuredImage,
          canonicalUrl: url, inSitemap: sitemapUrls.has(url), hasInboundLink: indexParents.has("/blog"),
        };
      }),
    ];
    return {
      settings,
      productRows: indexableProductRows,
      publishedBlogPosts: indexableBlogPosts,
      pages: Array.from(new Map(pages.map((page) => [page.url, page])).values()),
    };
  };
  const resolveSeoPageReference = async (input: z.infer<typeof seoMappingSchema>) => {
    const requestedUrl = canonicalPageUrl(input.pageUrl);
    if (!requestedUrl || !input.pageId) return null;
    if (input.pageType === "static") {
      const path = input.pageId === "/" ? "/" : input.pageId.replace(/\/+$/, "");
      const pageUrl = `${CANONICAL_ORIGIN}${path}`;
      return staticSeoPaths.has(path) && pageUrl === requestedUrl ? { pageUrl, pageType: input.pageType, pageId: path } : null;
    }
    const id = Number(input.pageId);
    if (!Number.isInteger(id) || id <= 0) return null;
    if (input.pageType === "product") {
      const [product] = await db.select({ id: products.id, slug: products.slug }).from(products)
        .where(and(eq(products.id, id), eq(products.isActive, true), eq(products.isVisible, true))).limit(1);
      const pageUrl = product ? sitemapPageUrl("/products", product.slug) : null;
      return pageUrl === requestedUrl ? { pageUrl, pageType: input.pageType, pageId: String(id) } : null;
    }
    if (input.pageType === "category") {
      const [category] = await db.select({ id: categories.id, slug: categories.slug }).from(categories)
        .where(and(eq(categories.id, id), eq(categories.isActive, true))).limit(1);
      const pageUrl = category ? sitemapPageUrl("/ingredients", category.slug) : null;
      return pageUrl === requestedUrl ? { pageUrl, pageType: input.pageType, pageId: String(id) } : null;
    }
    if (input.pageType === "health_support") {
      const [healthSupport] = await db.select({ id: healthSupports.id, slug: healthSupports.slug }).from(healthSupports)
        .where(and(eq(healthSupports.id, id), eq(healthSupports.isActive, true))).limit(1);
      const pageUrl = healthSupport ? sitemapPageUrl("/health-support", healthSupport.slug) : null;
      return pageUrl === requestedUrl ? { pageUrl, pageType: input.pageType, pageId: String(id) } : null;
    }
    const [post] = await db.select({ id: blogPosts.id, slug: blogPosts.slug }).from(blogPosts)
      .where(and(eq(blogPosts.id, id), eq(blogPosts.isPublished, true))).limit(1);
    const pageUrl = post ? sitemapPageUrl("/blog", post.slug) : null;
    return pageUrl === requestedUrl ? { pageUrl, pageType: input.pageType, pageId: String(id) } : null;
  };

  app.put('/api/admin/seo/keyword-page-mappings', isAuthenticated, isSeoManager, async (req: any, res) => {
    try {
      const input = seoMappingSchema.parse(req.body);
      const settings = await storage.getGlobalSeoSettings();
      if (!allTargetKeywords(settings).includes(input.keyword.toLowerCase())) {
        return res.status(400).json({ message: "The keyword is no longer configured as a target keyword." });
      }
      const page = await resolveSeoPageReference(input);
      if (!page) return res.status(400).json({ message: "Choose a current indexable page whose URL, type, and ID match." });
      const [mapping] = await db.insert(seoKeywordPageMappings).values({
        ...page,
        keyword: input.keyword.toLowerCase(),
        createdBy: req.staffUser.id,
        updatedAt: new Date(),
      }).onConflictDoUpdate({
        target: seoKeywordPageMappings.keyword,
        set: { ...page, updatedAt: new Date() },
      }).returning();
      res.json(mapping);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid keyword mapping", errors: error.flatten() });
      console.error("Error saving SEO keyword mapping:", error);
      res.status(500).json({ message: "Failed to save keyword mapping" });
    }
  });

  app.delete('/api/admin/seo/keyword-page-mappings/:keyword', isAuthenticated, isSeoManager, async (req, res) => {
    try {
      await db.delete(seoKeywordPageMappings).where(eq(seoKeywordPageMappings.keyword, decodeURIComponent(req.params.keyword).trim().toLowerCase()));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting SEO keyword mapping:", error);
      res.status(500).json({ message: "Failed to delete keyword mapping" });
    }
  });

  app.patch('/api/admin/seo/opportunities/:fingerprint', isAuthenticated, isSeoManager, async (req: any, res) => {
    try {
      const fingerprint = z.string().regex(/^[a-f0-9]{64}$/).parse(req.params.fingerprint);
      const input = seoOpportunityStatusSchema.parse(req.body);
      const expectedToken = evidenceToken(fingerprint, input.evidence);
      if (!crypto.timingSafeEqual(Buffer.from(expectedToken), Buffer.from(input.evidenceToken))) {
        return res.status(400).json({ message: "Opportunity evidence is stale or invalid. Refresh the scan and try again." });
      }
      if (input.status === "completed") {
        const { pages } = await loadIndexableSeoPages();
        if (!isCriticalSeoFindingResolved(pages, fingerprint)) {
          return res.status(409).json({
            message: "This critical issue is still detected by the current scan. Fix the page and refresh before marking it completed.",
          });
        }
      }
      const now = new Date();
      const [action] = await db.transaction(async (tx) => {
        const [updated] = await tx.insert(seoOpportunityActions).values({
          fingerprint,
          status: input.status,
          notes: input.notes || null,
          baselineMetrics: input.evidence,
          reviewedBy: req.staffUser.id,
          reviewedAt: now,
          completedAt: input.status === "completed" ? now : null,
          updatedAt: now,
        }).onConflictDoUpdate({
          target: seoOpportunityActions.fingerprint,
          set: {
            status: input.status,
            notes: input.notes || null,
            baselineMetrics: sql`coalesce(${seoOpportunityActions.baselineMetrics}, excluded.baseline_metrics)`,
            reviewedBy: req.staffUser.id,
            reviewedAt: now,
            completedAt: input.status === "completed"
              ? now
              : sql`coalesce(${seoOpportunityActions.completedAt}, excluded.completed_at)`,
            updatedAt: now,
          },
        }).returning();
        await tx.insert(seoOpportunityActionEvents).values({
          fingerprint,
          status: input.status,
          notes: input.notes || null,
          evidence: input.evidence,
          reviewedBy: req.staffUser.id,
        });
        return [updated];
      });
      res.json(action);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid opportunity update", errors: error.flatten() });
      console.error("Error updating SEO opportunity:", error);
      res.status(500).json({ message: "Failed to update opportunity" });
    }
  });

  app.post('/api/admin/seo/keyword-reviews/:id/apply', isAuthenticated, isSeoManager, async (req: any, res) => {
    try {
      const id = z.coerce.number().int().positive().parse(req.params.id);
      const applied = await db.transaction(async (tx) => {
        const [review] = await tx.select().from(seoKeywordReviews).where(eq(seoKeywordReviews.id, id)).limit(1);
        if (!review || review.recommendation !== "replace" || review.status !== "approved" || !review.replacement) {
          throw new Error("SEO_CONFLICT:Only an approved replacement can be applied.");
        }
        if (review.replacement.includes(",")) {
          throw new Error("SEO_CONFLICT:The replacement must be one keyword without commas.");
        }
        const [settings] = await tx.select().from(globalSeoSettings)
          .where(eq(globalSeoSettings.isActive, true))
          .orderBy(desc(globalSeoSettings.id)).limit(1);
        if (!settings) throw new Error("SEO_CONFLICT:Global SEO settings were not found.");
        const originalValue = settings.primaryKeywords || "";
        let nextValue: string;
        try {
          nextValue = replacePrimaryKeywordList(originalValue, review.keyword, review.replacement);
        } catch (replacementError) {
          throw new Error(`SEO_CONFLICT:${replacementError instanceof Error ? replacementError.message : "The replacement is invalid."}`);
        }
        const updatedSettings = await tx.update(globalSeoSettings).set({
          primaryKeywords: nextValue,
          updatedAt: new Date(),
        }).where(and(eq(globalSeoSettings.id, settings.id), eq(globalSeoSettings.primaryKeywords, originalValue))).returning({ id: globalSeoSettings.id });
        if (!updatedSettings.length) throw new Error("SEO_CONFLICT:Primary Keywords changed while this replacement was being applied. Refresh and review it again.");
        const [updatedReview] = await tx.update(seoKeywordReviews).set({
          status: "applied",
          reviewedBy: req.staffUser.id,
          reviewedAt: new Date(),
        }).where(and(eq(seoKeywordReviews.id, id), eq(seoKeywordReviews.status, "approved"))).returning();
        if (!updatedReview) throw new Error("SEO_CONFLICT:This replacement has already changed.");
        return updatedReview;
      });
      res.json(applied);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid review id" });
      if (error instanceof Error && error.message.startsWith("SEO_CONFLICT:")) {
        return res.status(409).json({ message: error.message.slice("SEO_CONFLICT:".length) });
      }
      console.error("Error applying SEO keyword replacement:", error);
      res.status(500).json({ message: "Failed to apply keyword replacement" });
    }
  });

  app.post('/api/admin/seo/crawler-audit', isAuthenticated, isSeoManager, async (req: any, res) => {
    try {
      const host = String(req.get("host") || "").trim();
      const hostUrl = new URL(`https://${host}`);
      const hostname = hostUrl.hostname.toLowerCase();
      const canonicalHostname = new URL(CANONICAL_ORIGIN).hostname;
      const isLocalHost = hostname === "localhost" || hostname === "127.0.0.1";
      const expectedLocalPort = String(Number(process.env.PORT || 5000));
      const isAllowedLocalHost = isLocalHost && hostUrl.port === expectedLocalPort;
      const isAllowedPublicHost = !hostUrl.port && (
        hostname === canonicalHostname
        || hostname === `www.${canonicalHostname}`
        || hostname.endsWith(".replit.dev")
        || hostname.endsWith(".replit.app")
      );
      const isAllowedHost = isAllowedLocalHost || isAllowedPublicHost;
      if (!isAllowedHost) return res.status(400).json({ message: "SEO crawl is only available for this site's public host." });
      const protocol = isLocalHost ? "http" : "https";
      const baseUrl = `${protocol}://${hostUrl.host}`;
      const environment = req.app.get("env") === "production" ? "production" : "development";
      const report = await runSeoCrawlerAudit({ baseUrl, environment, maxPages: 300, concurrency: 3 });
      res.json(report);
    } catch (error) {
      console.error("SEO crawler audit failed:", error);
      res.status(500).json({ message: "Could not complete the read-only crawler audit." });
    }
  });

  app.get('/api/admin/seo/growth-opportunities', isAuthenticated, isSeoManager, async (_req: any, res) => {
    try {
      const [{ settings, productRows, publishedBlogPosts, pages: uniquePages }, mappings, actionRows, actionEvents, periods] = await Promise.all([
        loadIndexableSeoPages(),
        db.select().from(seoKeywordPageMappings).orderBy(asc(seoKeywordPageMappings.keyword)).limit(5000),
        db.select().from(seoOpportunityActions).orderBy(desc(seoOpportunityActions.updatedAt)).limit(5000),
        db.select().from(seoOpportunityActionEvents).orderBy(desc(seoOpportunityActionEvents.createdAt)).limit(5000),
        db.selectDistinct({ periodStart: seoKeywordPerformance.periodStart, periodEnd: seoKeywordPerformance.periodEnd })
          .from(seoKeywordPerformance).orderBy(desc(seoKeywordPerformance.periodEnd), desc(seoKeywordPerformance.periodStart)).limit(1),
      ]);
      const latestPeriod = periods[0];
      const performanceRows = latestPeriod ? await db.select().from(seoKeywordPerformance).where(and(
        eq(seoKeywordPerformance.periodStart, latestPeriod.periodStart),
        eq(seoKeywordPerformance.periodEnd, latestPeriod.periodEnd),
      )).limit(50000) : [];
      const actionsByFingerprint = new Map(actionRows.map((action) => [action.fingerprint, action]));
      const historyByFingerprint = new Map<string, typeof actionEvents>();
      for (const event of actionEvents) {
        const history = historyByFingerprint.get(event.fingerprint) || [];
        if (history.length < 20) history.push(event);
        historyByFingerprint.set(event.fingerprint, history);
      }
      const withState = (finding: any) => {
        const action = actionsByFingerprint.get(finding.fingerprint);
        const baseline = action?.baselineMetrics && typeof action.baselineMetrics === "object"
          ? action.baselineMetrics as Record<string, unknown>
          : null;
        const baselineComparison = baseline ? Object.fromEntries(Object.entries(finding.evidence)
          .filter(([key, value]) => typeof value === "number" && typeof baseline[key] === "number")
          .map(([key, value]) => [key, Number(value) - Number(baseline[key])])) : null;
        return {
          ...finding,
          evidenceToken: evidenceToken(finding.fingerprint, finding.evidence),
          status: action?.status || "open",
          notes: action?.notes || "",
          baselineMetrics: action?.baselineMetrics || null,
          baselineComparison,
          reviewedAt: action?.reviewedAt || null,
          history: historyByFingerprint.get(finding.fingerprint) || [],
        };
      };
      const auditFindings = auditSeoPages(uniquePages).map(withState);
      const targets = allTargetKeywords(settings);
      const pageByUrl = new Map(uniquePages.map((page) => [page.url, page]));
      const aggregateMetrics = (rows: typeof performanceRows) => {
        const impressions = rows.reduce((sum, row) => sum + row.impressions, 0);
        const clicks = rows.reduce((sum, row) => sum + row.clicks, 0);
        const positionWeight = rows.reduce((sum, row) => sum + Number(row.position) * row.impressions, 0);
        return { clicks, impressions, ctr: impressions ? clicks / impressions : 0, position: impressions ? positionWeight / impressions : 0 };
      };
      const mappingByKeyword = new Map(mappings.map((mapping) => [mapping.keyword, mapping]));
      const keywordMappings = targets.map((keyword) => {
        const matchedRows = performanceRows.filter((row) => keywordMatches(row.query, keyword));
        const competingPages = detectCompetingPages(matchedRows, keyword);
        const mapping = mappingByKeyword.get(keyword);
        return {
          keyword,
          mapping: mapping || null,
          mappedPageExists: mapping ? pageByUrl.has(mapping.pageUrl) : false,
          competingPages,
          warning: !mapping ? "No preferred page assigned" : !pageByUrl.has(mapping.pageUrl) ? "Assigned page is no longer indexable" : competingPages.length > 1 ? `${competingPages.length} pages compete for this keyword` : null,
          metrics: aggregateMetrics(matchedRows),
        };
      });
      const unmatchedQueryGroups = new Map<string, typeof performanceRows>();
      for (const row of performanceRows) {
        const key = row.query.toLowerCase();
        if (!unmatchedQueryGroups.has(key)) unmatchedQueryGroups.set(key, []);
        unmatchedQueryGroups.get(key)!.push(row);
      }
      const contentOpportunities = Array.from(unmatchedQueryGroups.entries()).flatMap(([query, rows]) => {
        const metrics = aggregateMetrics(rows);
        if (metrics.impressions < 20 || targets.some((keyword) => keywordMatches(query, keyword))) return [];
        const evidencePages = Array.from(new Set(rows.map((row) => canonicalPageUrl(row.page)).filter((url): url is string => !!url)));
        const existingPage = evidencePages.find((url) => pageByUrl.has(url));
        const sourceUrl = existingPage || `${CANONICAL_ORIGIN}/`;
        const title = existingPage ? `Improve the page already appearing for “${query}”` : `Review a content gap for “${query}”`;
        const recommendation = existingPage
          ? "Improve the existing page before creating another page. Address the query directly using factual content."
          : "Review search intent and create a factual brief only if no existing page can answer this query.";
        const fingerprint = actionFingerprint("content", query, sourceUrl);
        return [withState({
          fingerprint, category: "content", severity: metrics.impressions >= 100 ? "high" : "medium",
          title, description: `${metrics.impressions} impressions, ${metrics.clicks} clicks, ${(metrics.ctr * 100).toFixed(2)}% CTR, average position ${metrics.position.toFixed(1)}.`,
          recommendation, sourceUrl, targetUrl: existingPage || null,
          evidence: { query, ...metrics, intent: "Derived from the exact imported query; validate intent before publishing.", suggestedTitle: existingPage ? null : `${query.replace(/\b\w/g, (character) => character.toUpperCase())} | Atlas Ingredients`, questions: [`What does a buyer need to know about ${query}?`, `Which existing Atlas Ingredients products or capabilities factually relate to ${query}?`] },
        })];
      }).sort((a, b) => Number(b.evidence.impressions) - Number(a.evidence.impressions)).slice(0, 50);
      const internalLinkOpportunities: any[] = [];
      const linkableProducts = productRows.map((product) => ({ product, tokens: normalizeKeywordTokens(product.name) }));
      for (const post of publishedBlogPosts) {
        const postText = visibleText(post.content);
        const postTokens = new Set(normalizeKeywordTokens(postText));
        for (const { product, tokens } of linkableProducts) {
          const targetUrl = `${CANONICAL_ORIGIN}/products/${product.slug}`;
          const tokenMatch = tokens.length > 0 && tokens.filter((token) => postTokens.has(token)).length / tokens.length >= 0.75;
          if (!tokenMatch || String(post.content).includes(`/products/${product.slug}`)) continue;
          const sourceUrl = `${CANONICAL_ORIGIN}/blog/${post.slug}`;
          const fingerprint = actionFingerprint("internal-link", sourceUrl, targetUrl);
          internalLinkOpportunities.push(withState({
            fingerprint, category: "internal_link", severity: "low",
            title: `Review a link from “${post.title}” to “${product.name}”`,
            description: "The article text mentions terms matching this product, but no direct product link was detected.",
            recommendation: `If the context genuinely discusses ${product.name}, add a descriptive link after human review.`,
            sourceUrl, targetUrl, evidence: { matchedProduct: product.name, heuristic: true },
          }));
          if (internalLinkOpportunities.length >= 30) break;
        }
        if (internalLinkOpportunities.length >= 30) break;
      }
      const opportunities = [...auditFindings, ...contentOpportunities, ...internalLinkOpportunities];
      const summary = opportunities.reduce((result: any, opportunity: any) => {
        result.total += 1;
        result.bySeverity[opportunity.severity] = (result.bySeverity[opportunity.severity] || 0) + 1;
        result.byStatus[opportunity.status] = (result.byStatus[opportunity.status] || 0) + 1;
        result.byCategory[opportunity.category] = (result.byCategory[opportunity.category] || 0) + 1;
        return result;
      }, { total: 0, bySeverity: {}, byStatus: {}, byCategory: {} });
      res.json({
        generatedAt: new Date().toISOString(),
        period: latestPeriod || null,
        summary,
        pages: uniquePages.map(({ content, ...page }) => page),
        keywordMappings,
        opportunities,
      });
    } catch (error) {
      console.error("Error building SEO growth opportunities:", error);
      res.status(500).json({ message: "Failed to build SEO growth opportunities" });
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
  const normalizeAnalyticsId = (value: string | null | undefined, pattern: RegExp) =>
    typeof value === "string" && pattern.test(value.trim()) ? value.trim() : null;
  const googleAnalyticsIdPattern = /^(?:G-[A-Z0-9]{4,20}|UA-\d{4,12}-\d{1,4})$/;
  const googleTagManagerIdPattern = /^GTM-[A-Z0-9]{4,20}$/;
  const facebookPixelIdPattern = /^\d{5,20}$/;
  const optionalAnalyticsId = (pattern: RegExp, label: string) => z.union([
    z.literal(""),
    z.string().trim().regex(pattern, `Invalid ${label}`),
    z.null(),
  ]).optional().transform((value) => value || null);
  const publicSeoSettingsUpdateSchema = insertGlobalSeoSettingsSchema.extend({
    googleAnalyticsId: optionalAnalyticsId(googleAnalyticsIdPattern, "Google Analytics ID"),
    googleTagManagerId: optionalAnalyticsId(googleTagManagerIdPattern, "Google Tag Manager ID"),
    facebookPixelId: optionalAnalyticsId(facebookPixelIdPattern, "Facebook Pixel ID"),
  });

  // Public pages need rendering-safe configuration. Measurement IDs are public
  // by design (they are embedded in page source); edit operations stay protected.
  app.get('/api/seo/settings', async (_req, res) => {
    try {
      const settings = await storage.getGlobalSeoSettings();
      if (!settings || settings.isActive === false) return res.status(404).json({ message: "SEO settings not configured" });
      const {
        siteTitle, siteDescription, primaryKeywords, primaryTargetRegion,
        businessLocation, pharmaceuticalKeywords, nutraceuticalKeywords,
        enableAutoMetaTags, enableStructuredData, enableLocalSeo, enableHreflang,
        twitterHandle, googleAnalyticsId, googleTagManagerId,
        facebookPixelId,
      } = settings;
      res.json({
        siteTitle, siteDescription, primaryKeywords, primaryTargetRegion,
        businessLocation, pharmaceuticalKeywords, nutraceuticalKeywords,
        enableAutoMetaTags, enableStructuredData, enableLocalSeo, enableHreflang,
        twitterHandle,
        googleAnalyticsId: normalizeAnalyticsId(googleAnalyticsId, googleAnalyticsIdPattern),
        googleTagManagerId: normalizeAnalyticsId(googleTagManagerId, googleTagManagerIdPattern),
        facebookPixelId: normalizeAnalyticsId(facebookPixelId, facebookPixelIdPattern),
      });
    } catch (error) {
      console.error('Error fetching public SEO settings:', error);
      res.status(500).json({ message: "Failed to fetch SEO settings" });
    }
  });

  // Read-only, intentionally not role-gated: client/src/services/seoService.ts fetches
  // this from public pages for any logged-in session (incl. customers) to render meta
  // tags; blocking reads would break that. The PUT below is role-gated.
  app.get('/api/admin/seo/settings', isAuthenticated, async (req: any, res) => {
    try {
      const settings = await storage.getGlobalSeoSettings();
      res.json(settings);
    } catch (error) {
      console.error('Error fetching global SEO settings:', error);
      res.status(500).json({ message: "Failed to fetch SEO settings" });
    }
  });

  app.put('/api/admin/seo/settings', isAuthenticated, isSeoManager, async (req: any, res) => {
    try {
      const settingsData = publicSeoSettingsUpdateSchema.parse(req.body);
      const settings = await storage.updateGlobalSeoSettings(settingsData);
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid SEO settings", errors: error.flatten() });
      console.error('Error updating global SEO settings:', error);
      res.status(500).json({ message: "Failed to update SEO settings" });
    }
  });

  // Document Number Settings routes
  app.get('/api/admin/document-number-settings', isAuthenticated, async (req: any, res) => {
    try {
      const settings = await storage.getDocumentNumberSettings();
      res.json(settings);
    } catch (error) {
      console.error('Error fetching document number settings:', error);
      res.status(500).json({ message: "Failed to fetch document number settings" });
    }
  });

  app.get('/api/admin/document-number-settings/:documentType', isAuthenticated, async (req: any, res) => {
    try {
      const setting = await storage.getDocumentNumberSetting(req.params.documentType);
      if (!setting) {
        return res.status(404).json({ message: "Document number setting not found" });
      }
      res.json(setting);
    } catch (error) {
      console.error('Error fetching document number setting:', error);
      res.status(500).json({ message: "Failed to fetch document number setting" });
    }
  });

  app.put('/api/admin/document-number-settings/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updateDocumentNumberSettings(id, req.body);
      res.json(updated);
    } catch (error) {
      console.error('Error updating document number settings:', error);
      res.status(500).json({ message: "Failed to update document number settings" });
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
        dateFrom, dateTo, assignedDateFrom, assignedDateTo,
        country, isIrrelevant,
        limit = '1000', offset = '0' 
      } = req.query;
      
      const userId = req.user.claims.sub;
      // Get role from user record in database, fallback to claims
      const user = await storage.getUser(userId);
      const userRole = user?.role || req.user.claims.role || req.user.claims['https://brightfameorganic.com/roles']?.[0] || 'customer';
      
      console.log('[Companies API] User:', userId, 'Role:', userRole, 'Origin filter:', origin, 'AssignedDateFrom:', assignedDateFrom, 'AssignedDateTo:', assignedDateTo);
      
      const filters: any = {
        search,
        industryType,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        user: { id: userId, role: userRole }
      };
      
      if (needsEnrichment !== undefined) filters.needsEnrichment = needsEnrichment === 'true';
      if (origin) filters.origin = origin;
      if (status === 'merged') {
        filters.duplicateStatus = 'merged';
      } else if (status) {
        filters.status = status;
      }
      if (companyStage) filters.companyStage = companyStage;
      if (priority) filters.priority = priority;
      if (assignedTo) filters.assignedTo = assignedTo;
      if (createdFrom) filters.createdFrom = createdFrom;
      if (dateFrom) filters.dateFrom = dateFrom;
      if (dateTo) filters.dateTo = dateTo;
      if (assignedDateFrom) filters.assignedDateFrom = assignedDateFrom;
      if (assignedDateTo) filters.assignedDateTo = assignedDateTo;
      if (country) filters.country = country as string;
      // Support both ?isIrrelevant and ?irrelevant aliases
      const irrelevantParam = req.query.irrelevant ?? isIrrelevant;
      if (irrelevantParam !== undefined) filters.isIrrelevant = irrelevantParam === 'true';
      
      const result = await storage.getCompanies(filters);
      console.log('[Companies API] Found', result.total, 'companies, origins:', result.companies.map(c => c.origin).filter((v, i, a) => a.indexOf(v) === i));

      // Enrich irrelevantMarkedBy with user display name for Not Relevant view
      let enrichedCompanies = result.companies;
      if (isIrrelevant === 'true') {
        const markerIds = [...new Set(result.companies.map(c => c.irrelevantMarkedBy).filter(Boolean))] as string[];
        const markerMap: Record<string, string> = {};
        await Promise.all(markerIds.map(async (mid) => {
          const markerUser = await storage.getUser(mid);
          if (markerUser) {
            markerMap[mid] = [markerUser.firstName, markerUser.lastName].filter(Boolean).join(' ') || markerUser.email || mid;
          }
        }));
        enrichedCompanies = result.companies.map(c => ({
          ...c,
          irrelevantMarkedByName: c.irrelevantMarkedBy ? (markerMap[c.irrelevantMarkedBy] || c.irrelevantMarkedBy) : null,
        }));
      }

      res.json({ companies: enrichedCompanies, total: result.total });
    } catch (error) {
      console.error('Error fetching companies:', error);
      res.status(500).json({ message: "Failed to fetch companies" });
    }
  });

  // Export all companies as multi-sheet Excel file (super_admin only)
  app.get('/api/crm/companies/export', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const userRole = user?.role || '';
      if (userRole !== 'super_admin') {
        return res.status(403).json({ message: 'Only super admins can export company data' });
      }

      // Sheet 1: Companies
      const companiesRows = await db
        .select({
          id: companies.id,
          companyName: companies.companyName,
          primaryEmail: companies.primaryEmail,
          primaryPhone: companies.primaryPhone,
          gstNumber: companies.gstNumber,
          industryType: companies.industryType,
          companySize: companies.companySize,
          annualTurnover: companies.annualTurnover,
          website: companies.website,
          addressStreet: companies.addressStreet,
          addressCity: companies.addressCity,
          addressState: companies.addressState,
          addressCountry: companies.addressCountry,
          addressZip: companies.addressZip,
          factoryAddressStreet: companies.factoryAddressStreet,
          factoryAddressCity: companies.factoryAddressCity,
          factoryAddressState: companies.factoryAddressState,
          factoryAddressCountry: companies.factoryAddressCountry,
          factoryAddressZip: companies.factoryAddressZip,
          status: companies.status,
          companyStage: companies.companyStage,
          priority: companies.priority,
          origin: companies.origin,
          assignedToName: sql<string>`(SELECT COALESCE(first_name || ' ' || last_name, '') FROM users WHERE id = ${companies.assignedTo})`,
          createdByName: sql<string>`(SELECT COALESCE(first_name || ' ' || last_name, '') FROM users WHERE id = ${companies.createdBy})`,
          lastContactDate: companies.lastContactDate,
          nextFollowUpDate: companies.nextFollowUpDate,
          notes: companies.notes,
          createdAt: companies.createdAt,
          updatedAt: companies.updatedAt,
        })
        .from(companies)
        .orderBy(companies.id);

      // Aggregate contacts per company using a raw GROUP BY query, then merge by company ID
      const contactAggRows = await db.execute<{ company_id: number; all_names: string | null; all_emails: string | null; all_phones: string | null }>(sql`
        SELECT
          company_id,
          STRING_AGG(contact_name, ', ' ORDER BY is_primary DESC, id) FILTER (WHERE contact_name IS NOT NULL AND contact_name <> '') AS all_names,
          STRING_AGG(email, ', ' ORDER BY is_primary DESC, id) FILTER (WHERE email IS NOT NULL AND email <> '') AS all_emails,
          STRING_AGG(COALESCE(NULLIF(phone, ''), NULLIF(whatsapp, '')), ', ' ORDER BY is_primary DESC, id) FILTER (WHERE COALESCE(NULLIF(phone, ''), NULLIF(whatsapp, '')) IS NOT NULL) AS all_phones
        FROM company_contacts
        GROUP BY company_id
      `);
      const contactAggMap = new Map(
        contactAggRows.rows.map((r) => [
          r.company_id,
          { allNames: r.all_names ?? '', allEmails: r.all_emails ?? '', allPhones: r.all_phones ?? '' },
        ])
      );

      // Sheet 2: Contacts
      const contactsRows = await db
        .select({
          companyId: companyContacts.companyId,
          companyName: companies.companyName,
          contactName: companyContacts.contactName,
          designation: companyContacts.designation,
          email: companyContacts.email,
          countryCode: companyContacts.countryCode,
          phone: companyContacts.phone,
          whatsapp: companyContacts.whatsapp,
          role: companyContacts.role,
          isPrimary: companyContacts.isPrimary,
          isActive: companyContacts.isActive,
          createdAt: companyContacts.createdAt,
        })
        .from(companyContacts)
        .leftJoin(companies, eq(companyContacts.companyId, companies.id))
        .orderBy(companyContacts.companyId, companyContacts.id);

      // Sheet 3: Notes
      const notesRows = await db
        .select({
          companyId: companyNotes.companyId,
          companyName: companies.companyName,
          noteType: companyNotes.noteType,
          title: companyNotes.title,
          content: companyNotes.content,
          priority: companyNotes.priority,
          isPinned: companyNotes.isPinned,
          isPrivate: companyNotes.isPrivate,
          createdByName: sql<string>`(SELECT COALESCE(first_name || ' ' || last_name, '') FROM users WHERE id = ${companyNotes.createdBy})`,
          createdAt: companyNotes.createdAt,
        })
        .from(companyNotes)
        .leftJoin(companies, eq(companyNotes.companyId, companies.id))
        .orderBy(companyNotes.companyId, companyNotes.id);

      // Build xlsx workbook
      const wb = xlsx.utils.book_new();

      const companiesSheet = xlsx.utils.json_to_sheet(companiesRows.map((c) => ({
        'Company ID': c.id,
        'Company Name': c.companyName ?? '',
        'Primary Email': c.primaryEmail ?? '',
        'Primary Phone': c.primaryPhone ?? '',
        'All Contact Names': contactAggMap.get(c.id)?.allNames ?? '',
        'All Contact Emails': contactAggMap.get(c.id)?.allEmails ?? '',
        'All Contact Phones': contactAggMap.get(c.id)?.allPhones ?? '',
        'GST Number': c.gstNumber ?? '',
        'Industry Type': c.industryType ?? '',
        'Company Size': c.companySize ?? '',
        'Annual Turnover': c.annualTurnover ?? '',
        'Website': c.website ?? '',
        'Address Street': c.addressStreet ?? '',
        'Address City': c.addressCity ?? '',
        'Address State': c.addressState ?? '',
        'Address Country': c.addressCountry ?? '',
        'Address ZIP': c.addressZip ?? '',
        'Factory Street': c.factoryAddressStreet ?? '',
        'Factory City': c.factoryAddressCity ?? '',
        'Factory State': c.factoryAddressState ?? '',
        'Factory Country': c.factoryAddressCountry ?? '',
        'Factory ZIP': c.factoryAddressZip ?? '',
        'Status': c.status ?? '',
        'Stage': c.companyStage ?? '',
        'Priority': c.priority ?? '',
        'Origin': c.origin ?? '',
        'Assigned To': c.assignedToName ?? '',
        'Created By': c.createdByName ?? '',
        'Last Contact Date': c.lastContactDate ? new Date(c.lastContactDate).toISOString().slice(0, 10) : '',
        'Next Follow-Up Date': c.nextFollowUpDate ? new Date(c.nextFollowUpDate).toISOString().slice(0, 10) : '',
        'Notes': c.notes ?? '',
        'Created At': c.createdAt ? new Date(c.createdAt).toISOString() : '',
        'Updated At': c.updatedAt ? new Date(c.updatedAt).toISOString() : '',
      })));
      xlsx.utils.book_append_sheet(wb, companiesSheet, 'Companies');

      const contactsSheet = xlsx.utils.json_to_sheet(contactsRows.map((c) => ({
        'Company ID': c.companyId,
        'Company Name': c.companyName ?? '',
        'Contact Name': c.contactName ?? '',
        'Designation': c.designation ?? '',
        'Email': c.email ?? '',
        'Country Code': c.countryCode ?? '',
        'Phone': c.phone ?? '',
        'WhatsApp': c.whatsapp ?? '',
        'Role': c.role ?? '',
        'Is Primary': c.isPrimary ? 'Yes' : 'No',
        'Is Active': c.isActive ? 'Yes' : 'No',
        'Created At': c.createdAt ? new Date(c.createdAt).toISOString() : '',
      })));
      xlsx.utils.book_append_sheet(wb, contactsSheet, 'Contacts');

      const notesSheet = xlsx.utils.json_to_sheet(notesRows.map((n) => ({
        'Company ID': n.companyId,
        'Company Name': n.companyName ?? '',
        'Note Type': n.noteType ?? '',
        'Title': n.title ?? '',
        'Content': n.content ?? '',
        'Priority': n.priority ?? '',
        'Is Pinned': n.isPinned ? 'Yes' : 'No',
        'Is Private': n.isPrivate ? 'Yes' : 'No',
        'Created By': n.createdByName ?? '',
        'Created At': n.createdAt ? new Date(n.createdAt).toISOString() : '',
      })));
      xlsx.utils.book_append_sheet(wb, notesSheet, 'Notes');

      const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
      const today = new Date().toISOString().slice(0, 10);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="companies_export_${today}.xlsx"`);
      res.send(buffer);
    } catch (error) {
      console.error('Error exporting companies:', error);
      res.status(500).json({ message: 'Failed to export company data' });
    }
  });

  // Get distinct countries from companies (for filter dropdown) — RBAC-aware
  app.get('/api/crm/companies/distinct-countries', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const userRole = user?.role || 'sales_executive';

      const adminRoles = ['admin', 'super_admin', 'sales_manager'];
      const isAdminRole = adminRoles.includes(userRole);
      const crmIntakeRoles = ['admin', 'super_admin', 'sales_manager', 'sales_executive', 'sales'];
      const canSeeWebsite = crmIntakeRoles.includes(userRole);

      const conditions: any[] = [
        isNotNull(companies.addressCountry),
        sql`BTRIM(${companies.addressCountry}) != ''`,
      ];

      if (!isAdminRole) {
        if (canSeeWebsite) {
          conditions.push(
            or(
              eq(companies.assignedTo, userId),
              eq(companies.createdBy, userId),
              eq(companies.origin, 'website')
            )
          );
        } else {
          conditions.push(
            or(
              eq(companies.assignedTo, userId),
              eq(companies.createdBy, userId)
            )
          );
        }
      }

      // Return stored values as-is (canonical after cleanup) — INITCAP produced
      // artifacts like "Usa"/"Uk". Trim + case-insensitive dedupe stays as a safety net.
      const rows = await db
        .select({ country: sql<string>`MIN(BTRIM(${companies.addressCountry}))` })
        .from(companies)
        .where(and(...conditions))
        .groupBy(sql`LOWER(BTRIM(${companies.addressCountry}))`)
        .orderBy(sql`LOWER(BTRIM(${companies.addressCountry}))`);

      const countries = rows.map((r: any) => r.country as string).filter(Boolean);
      res.json(countries);
    } catch (error) {
      console.error('Error fetching distinct countries:', error);
      res.status(500).json({ message: 'Failed to fetch countries' });
    }
  });

  // Super-admin maintenance action: normalize every company's country values to
  // canonical names (idempotent — safe to run repeatedly, e.g. once on production
  // after republishing). Returns per-mapping change counts.
  app.post('/api/crm/companies/normalize-countries', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'super_admin') {
        return res.status(403).json({ message: 'Only the super admin can run this cleanup' });
      }
      const result = await storage.normalizeAllCompanyCountries();
      console.log(`[CountryCleanup] run by ${userId}: scanned=${result.scanned} updated=${result.updated}`);
      res.json(result);
    } catch (error) {
      console.error('Error normalizing company countries:', error);
      res.status(500).json({ message: 'Failed to normalize countries' });
    }
  });

  // Client-side view tracking endpoint — tracks all entity types including companies
  app.post('/api/crm/track-view', isAuthenticated, async (req: any, res) => {
    res.json({ ok: true });
    const { entityType, entityId, entityName } = req.body;
    if (!entityType || !entityId) return;
    logStaffAccess(req, String(entityType), Number(entityId), String(entityName || ''));
  });

  app.get('/api/crm/companies/:id', isAuthenticated, async (req: any, res) => {
    try {
      const company = await storage.getCompany(parseInt(req.params.id));
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      res.json(company);

      // Log access event for staff users (non-blocking)
      const userId = req.user?.claims?.sub;
      if (userId) {
        const user = await storage.getUser(userId).catch(() => null);
        if (user?.userType === 'staff') {
          setImmediate(async () => {
            try {
              const ip = extractClientIp(req);
              await storage.createUserAccessEvent({
                userId,
                entityType: 'company',
                entityId: company.id,
                entityName: company.companyName,
                ipAddress: ip,
                page: `/crm/companies/${company.id}`,
              });
              // Check for rapid browsing pattern (>8 company opens in 5 minutes)
              const recentCount = await storage.getRecentAccessEventCount(userId, 'company', 5);
              if (recentCount >= 9) {
                await storage.createUserSecurityAlert({
                  userId,
                  alertType: 'rapid_company_access',
                  severity: 'high',
                  description: `Opened ${recentCount} company records in 5 minutes — possible bulk data access`,
                  isResolved: false,
                });
                const staffName2 = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || userId;
                await storage.createNotificationsForRole({
                  type: 'security_alert',
                  title: '🔴 Rapid Company Access Alert',
                  message: `${staffName2} opened ${recentCount} company records in 5 minutes — possible bulk data theft`,
                  entityType: 'security',
                  link: '/admin/dashboard?section=security-monitor',
                  isRead: false,
                }, ['admin', 'super_admin']);
              }
            } catch (e) {
              console.error('Access event log error:', e);
            }
          });
        }
      }
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

      // Log access event for staff users (non-blocking)
      const userId = req.user?.claims?.sub;
      if (userId) {
        const user = await storage.getUser(userId).catch(() => null);
        if (user?.userType === 'staff') {
          setImmediate(async () => {
            try {
              const ip = extractClientIp(req);
              await storage.createUserAccessEvent({
                userId,
                entityType: 'company',
                entityId: company.id,
                entityName: company.companyName,
                ipAddress: ip,
                page: `/crm/companies/${company.id}`,
              });
              // Check for rapid browsing pattern (>8 company opens in 5 minutes)
              const recentCount = await storage.getRecentAccessEventCount(userId, 'company', 5);
              if (recentCount >= 9) {
                await storage.createUserSecurityAlert({
                  userId,
                  alertType: 'rapid_company_access',
                  severity: 'high',
                  description: `Opened ${recentCount} company records in 5 minutes — possible bulk data access`,
                  isResolved: false,
                });
                const staffName3 = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || userId;
                await storage.createNotificationsForRole({
                  type: 'security_alert',
                  title: '🔴 Rapid Company Access Alert',
                  message: `${staffName3} opened ${recentCount} company records in 5 minutes — possible bulk data theft`,
                  entityType: 'security',
                  link: '/admin/dashboard?section=security-monitor',
                  isRead: false,
                }, ['admin', 'super_admin']);
              }
            } catch (e) {
              console.error('Access event log error:', e);
            }
          });
        }
      }
    } catch (error) {
      console.error('Error fetching company details:', error);
      res.status(500).json({ message: "Failed to fetch company details" });
    }
  });

  app.post('/api/crm/companies', isAuthenticated, async (req: any, res) => {
    try {
      const lengthErrors = companyLengthErrors(req.body);
      if (lengthErrors.length) {
        return res.status(400).json({ message: lengthErrors.map(error => error.message).join(" "), errors: lengthErrors });
      }
      const userId = req.user.claims.sub;
      const { departmentPhones, additionalEmails, ...companyFields } = req.body;
      
      // Get user role to determine auto-assignment
      const user = await storage.getUser(userId);
      const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
      
      // Auto-assign to creating user if they're a sales agent (not admin)
      // Admins can manually assign, so we don't auto-assign for them
      const assignedTo = isAdmin ? companyFields.assignedTo : userId;
      
      const companyData = insertCompanySchema.parse({
        ...companyFields,
        origin: companyFields.origin || 'manual',
        createdBy: userId,
        assignedTo: assignedTo || null,
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

  const updateCompanyDetails = async (req: any, res: any) => {
    try {
      const companyId = Number(req.params.id);
      if (!Number.isSafeInteger(companyId) || companyId <= 0) {
        return res.status(400).json({ message: "Invalid company ID" });
      }
      const lengthErrors = companyLengthErrors(req.body);
      if (lengthErrors.length) {
        return res.status(400).json({ message: lengthErrors.map(error => error.message).join(" "), errors: lengthErrors });
      }
      const company = await storage.updateCompany(companyId, req.body);
      if (!company) return res.status(404).json({ message: "Company not found" });
      res.json(company);
    } catch (error: any) {
      console.error('Error updating company:', error);
      if (error.code === '23505' && error.constraint === 'companies_gst_number_key') {
        return res.status(400).json({ message: "A company with this GST number already exists. Please use a different GST number or leave it blank." });
      }
      res.status(500).json({ message: "Failed to update company" });
    }
  };
  app.patch('/api/crm/companies/:id', isAuthenticated, updateCompanyDetails);
  // Explicit update action avoids PATCH restrictions in some browser/network paths.
  // Use the same handler; never retry a write whose delivery is uncertain.
  app.post('/api/crm/companies/:id/update', isAuthenticated, updateCompanyDetails);

  // Mark / Unmark company as irrelevant
  app.patch('/api/crm/companies/:id/mark-irrelevant', isAuthenticated, async (req: any, res) => {
    try {
      const companyId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const dbUser = await storage.getUser(userId);
      const userRole = dbUser?.role || req.user.claims.role || 'customer';

      // Authorization: sales agents may only mark their assigned companies
      const adminRoles = ['super_admin', 'admin', 'sales_manager'];
      if (!adminRoles.includes(userRole)) {
        const targetCompany = await storage.getCompany(companyId);
        if (!targetCompany || targetCompany.assignedTo !== userId) {
          return res.status(403).json({ message: "You can only flag companies assigned to you" });
        }
      }

      const { isIrrelevant, irrelevantReason } = req.body;
      const updateData: any = { isIrrelevant };
      if (isIrrelevant) {
        const trimmedReason = (irrelevantReason || '').slice(0, 200) || null;
        updateData.irrelevantReason = trimmedReason;
        updateData.irrelevantMarkedBy = userId;
        updateData.irrelevantMarkedAt = new Date();
      } else {
        updateData.irrelevantReason = null;
        updateData.irrelevantMarkedBy = null;
        updateData.irrelevantMarkedAt = null;
      }
      const company = await storage.updateCompany(companyId, updateData);
      res.json(company);
    } catch (error) {
      console.error('Error updating company irrelevant status:', error);
      res.status(500).json({ message: "Failed to update company" });
    }
  });

  // Get company contacts
  app.get('/api/crm/companies/:id/contacts', isAuthenticated, async (req: any, res) => {
    const companyId = parseInt(req.params.id);
    try {
      const contacts = await storage.getCompanyContacts(companyId);
      res.json(contacts);
    } catch (error) {
      console.error('Error fetching company contacts:', error);
      res.status(500).json({ message: "Failed to fetch contacts" });
      return;
    }
    // Log access event after response is sent — safe to run async after try-catch
    storage.getCompany(companyId).then(company => {
      logStaffAccess(req, 'company', companyId, company?.companyName || `Company ${companyId}`);
    }).catch(() => {
      logStaffAccess(req, 'company', companyId, `Company ${companyId}`);
    });
  });

  // Bulk Company Import - Template Download
  app.get('/api/crm/companies/import/template', isAuthenticated, async (req: any, res) => {
    try {
      const headers = [
        'companyName*',
        'primaryEmail',
        'primaryPhone',
        'gstNumber',
        'industryType',
        'companySize',
        'website',
        'addressStreet',
        'addressCity',
        'addressState',
        'addressCountry',
        'addressZip',
        'factoryAddressStreet',
        'factoryAddressCity',
        'factoryAddressState',
        'factoryAddressCountry',
        'factoryAddressZip',
        'priority',
        'notes',
        'additionalEmail1',
        'additionalEmail1Designation',
        'additionalEmail2',
        'additionalEmail2Designation',
        'additionalEmail3',
        'additionalEmail3Designation',
        'departmentPhone1',
        'departmentPhone1Name',
        'departmentPhone2',
        'departmentPhone2Name',
        'departmentPhone3',
        'departmentPhone3Name'
      ];
      
      const sampleRow = [
        'Example Company Ltd',
        'contact@example.com',
        '+1-555-123-4567',
        '22AAAAA0000A1Z5',
        'food',
        'medium',
        'https://example.com',
        '123 Main Street',
        'New York',
        'NY',
        'USA',
        '10001',
        '456 Factory Lane',
        'Chicago',
        'IL',
        'USA',
        '60601',
        'normal',
        'Sample company notes',
        'sales@example.com',
        'Sales Manager',
        'support@example.com',
        'Customer Support',
        'hr@example.com',
        'HR Department',
        '+1-555-111-2222',
        'Sales Department',
        '+1-555-333-4444',
        'Customer Support',
        '+1-555-555-6666',
        'Accounts'
      ];
      
      const csvContent = [headers.join(','), sampleRow.join(',')].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=company_import_template.csv');
      res.send(csvContent);
    } catch (error) {
      console.error('Error generating template:', error);
      res.status(500).json({ message: 'Failed to generate template' });
    }
  });

  // Bulk Company Import - Validate
  app.post('/api/crm/companies/import/validate', isAuthenticated, multer({ storage: multer.memoryStorage() }).single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const fileBuffer = req.file.buffer;
      const fileName = req.file.originalname.toLowerCase();
      let parsedData: any[] = [];

      if (fileName.endsWith('.csv')) {
        // Try to detect and handle different character encodings
        let csvContent: string;
        
        // Check for UTF-8 BOM
        if (fileBuffer[0] === 0xEF && fileBuffer[1] === 0xBB && fileBuffer[2] === 0xBF) {
          csvContent = fileBuffer.toString('utf-8').slice(1); // Remove BOM
        } else {
          // Try UTF-8 first
          csvContent = fileBuffer.toString('utf-8');
          
          // Check if there are replacement characters (indicates encoding issue)
          if (csvContent.includes('\uFFFD')) {
            // Try Latin-1 (ISO-8859-1) which is common for European files
            csvContent = fileBuffer.toString('latin1');
          }
        }
        
        const lines = csvContent.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
          return res.status(400).json({ message: 'File must contain headers and at least one data row' });
        }
        
        const headers = lines[0].split(',').map(h => h.trim().replace(/^\*/, '').replace(/\*$/, ''));
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          const row: any = {};
          headers.forEach((header, idx) => {
            const cleanHeader = header.replace('*', '');
            if (values[idx]) {
              row[cleanHeader] = values[idx];
            }
          });
          if (row.companyName) {
            parsedData.push(row);
          }
        }
      } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        const xlsx = await import('xlsx');
        const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = xlsx.utils.sheet_to_json(sheet);
        
        parsedData = jsonData.map((row: any) => {
          const cleanRow: any = {};
          Object.keys(row).forEach(key => {
            const cleanKey = key.replace('*', '').trim();
            cleanRow[cleanKey] = row[key];
          });
          return cleanRow;
        }).filter((row: any) => row.companyName);
      } else {
        return res.status(400).json({ message: 'Unsupported file format. Use CSV or Excel files.' });
      }

      if (parsedData.length === 0) {
        return res.status(400).json({ message: 'No valid company data found in file' });
      }

      const errors: Array<{ row: number; field: string; message: string }> = [];
      const { checkForDuplicates, normalizeCompanyName, extractEmailDomain } = await import('./duplicateDetection');

      const withinFileNames = new Map<string, number>();
      const withinFileDomains = new Map<string, number>();

      for (let i = 0; i < parsedData.length; i++) {
        const company = parsedData[i];
        const rowNum = i + 2;
        if (company.companyName) {
          const norm = normalizeCompanyName(company.companyName);
          if (norm) {
            if (withinFileNames.has(norm)) {
              const firstRow = withinFileNames.get(norm)!;
              errors.push({ row: rowNum, field: 'companyName', message: `Duplicate within file - same company name as row ${firstRow}` });
            } else {
              withinFileNames.set(norm, rowNum);
            }
          }
        }
        if (company.primaryEmail) {
          const domain = extractEmailDomain(company.primaryEmail);
          if (domain) {
            if (!withinFileDomains.has(domain)) {
              withinFileDomains.set(domain, rowNum);
            }
          }
        }
      }

      const validatedCompanies = await Promise.all(parsedData.map(async (company, index) => {
        const rowNum = index + 2;
        
        if (!company.companyName || company.companyName.trim().length === 0) {
          errors.push({ row: rowNum, field: 'companyName', message: 'Company name is required' });
        }

        if (company.primaryEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(company.primaryEmail)) {
          errors.push({ row: rowNum, field: 'primaryEmail', message: 'Invalid email format' });
        }

        if (company.website && !/^https?:\/\//.test(company.website)) {
          company.website = 'https://' + company.website;
        }

        let duplicateWarning = null;
        let isBlocked = false;
        let blockReason = '';
        try {
          const duplicateCheck = await checkForDuplicates(
            company.companyName,
            company.primaryEmail,
            company.primaryPhone
          );
          if (duplicateCheck.hasPotentialDuplicates) {
            const topMatch = duplicateCheck.matches[0];
            if (topMatch.matchType === 'exact_name' || topMatch.matchType === 'normalized_name') {
              isBlocked = true;
              blockReason = `Company "${topMatch.companyName}" already exists in the database (${topMatch.matchDetails})`;
              errors.push({ row: rowNum, field: 'companyName', message: blockReason });
            } else if (topMatch.matchType === 'email_domain') {
              isBlocked = true;
              blockReason = `A company with the same email domain already exists: "${topMatch.companyName}" (${topMatch.matchDetails})`;
              errors.push({ row: rowNum, field: 'primaryEmail', message: blockReason });
            } else if (duplicateCheck.highestConfidence >= 70) {
              duplicateWarning = topMatch;
            }
          }
        } catch (e) {
          console.error('Error checking duplicates for row', rowNum, e);
        }

        const norm = normalizeCompanyName(company.companyName || '');
        const domain = company.primaryEmail ? extractEmailDomain(company.primaryEmail) : null;
        const hasWithinFileDup = norm && withinFileNames.has(norm) && withinFileNames.get(norm) !== rowNum;

        if (hasWithinFileDup) {
          isBlocked = true;
        }

        return {
          ...company,
          rowNumber: rowNum,
          duplicateWarning,
          isBlocked,
          blockReason: blockReason || (hasWithinFileDup ? 'Duplicate entry within the uploaded file' : ''),
        };
      }));

      const blockedCount = validatedCompanies.filter(c => c.isBlocked).length;
      const readyCount = validatedCompanies.filter(c => !c.isBlocked).length;

      res.json({
        companies: validatedCompanies,
        errors,
        totalRows: parsedData.length,
        blockedCount,
        readyCount,
      });
    } catch (error) {
      console.error('Error validating import file:', error);
      res.status(500).json({ message: 'Failed to validate file' });
    }
  });

  // Bulk Company Import - Confirm
  app.post('/api/crm/companies/import/confirm', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { companies } = req.body;

      if (!companies || !Array.isArray(companies) || companies.length === 0) {
        return res.status(400).json({ message: 'No companies to import' });
      }

      let success = 0;
      let failed = 0;
      let skippedDuplicates = 0;
      const importErrors: string[] = [];
      const { checkForDuplicates } = await import('./duplicateDetection');

      for (const companyData of companies) {
        try {
          if (companyData.isBlocked) {
            skippedDuplicates++;
            importErrors.push(`${companyData.companyName}: Skipped - ${companyData.blockReason || 'duplicate detected'}`);
            continue;
          }

          const dupCheck = await checkForDuplicates(
            companyData.companyName,
            companyData.primaryEmail,
            companyData.primaryPhone
          );
          if (dupCheck.hasPotentialDuplicates) {
            const topMatch = dupCheck.matches[0];
            if (topMatch.matchType === 'exact_name' || topMatch.matchType === 'normalized_name' || topMatch.matchType === 'email_domain') {
              skippedDuplicates++;
              importErrors.push(`${companyData.companyName}: Skipped - duplicate of "${topMatch.companyName}" (${topMatch.matchDetails})`);
              continue;
            }
          }

          const cleanData = { ...companyData };
          delete cleanData.rowNumber;
          delete cleanData.duplicateWarning;
          delete cleanData.isBlocked;
          delete cleanData.blockReason;

          // Process additional emails into array format
          const additionalEmails: Array<{ email: string; designation: string }> = [];
          if (cleanData.additionalEmail1) {
            additionalEmails.push({
              email: cleanData.additionalEmail1,
              designation: cleanData.additionalEmail1Designation || ''
            });
          }
          if (cleanData.additionalEmail2) {
            additionalEmails.push({
              email: cleanData.additionalEmail2,
              designation: cleanData.additionalEmail2Designation || ''
            });
          }
          if (cleanData.additionalEmail3) {
            additionalEmails.push({
              email: cleanData.additionalEmail3,
              designation: cleanData.additionalEmail3Designation || ''
            });
          }

          // Process department phones into array format
          const departmentPhones: Array<{ phone: string; department: string }> = [];
          if (cleanData.departmentPhone1) {
            departmentPhones.push({
              phone: cleanData.departmentPhone1,
              department: cleanData.departmentPhone1Name || ''
            });
          }
          if (cleanData.departmentPhone2) {
            departmentPhones.push({
              phone: cleanData.departmentPhone2,
              department: cleanData.departmentPhone2Name || ''
            });
          }
          if (cleanData.departmentPhone3) {
            departmentPhones.push({
              phone: cleanData.departmentPhone3,
              department: cleanData.departmentPhone3Name || ''
            });
          }

          // Remove individual fields
          delete cleanData.additionalEmail1;
          delete cleanData.additionalEmail1Designation;
          delete cleanData.additionalEmail2;
          delete cleanData.additionalEmail2Designation;
          delete cleanData.additionalEmail3;
          delete cleanData.additionalEmail3Designation;
          delete cleanData.departmentPhone1;
          delete cleanData.departmentPhone1Name;
          delete cleanData.departmentPhone2;
          delete cleanData.departmentPhone2Name;
          delete cleanData.departmentPhone3;
          delete cleanData.departmentPhone3Name;

          await storage.createCompany({
            ...cleanData,
            additionalEmails: additionalEmails.length > 0 ? additionalEmails : undefined,
            departmentPhones: departmentPhones.length > 0 ? departmentPhones : undefined,
            origin: 'import',
            createdBy: userId,
            status: 'active',
            companyStage: 'new',
            priority: cleanData.priority || 'normal',
          });
          success++;
        } catch (error: any) {
          failed++;
          const errorMsg = error.message || 'Unknown error';
          importErrors.push(`${companyData.companyName}: ${errorMsg}`);
        }
      }

      res.json({
        success,
        failed,
        skippedDuplicates,
        errors: importErrors,
      });
    } catch (error) {
      console.error('Error importing companies:', error);
      res.status(500).json({ message: 'Failed to import companies' });
    }
  });

  app.delete('/api/crm/companies/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      if (!user.role?.includes('admin') && !user.role?.includes('sales_manager')) {
        return res.status(403).json({ message: "Only admins and sales managers can delete companies" });
      }
      
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

  // Bulk delete companies (admin only)
  app.post('/api/crm/companies/bulk-delete', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get user from database to check actual role
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      if (!user.role?.includes('admin') && !user.role?.includes('sales_manager')) {
        return res.status(403).json({ message: "Only admins and sales managers can delete companies in bulk" });
      }
      
      const { companyIds } = req.body;
      if (!companyIds || !Array.isArray(companyIds) || companyIds.length === 0) {
        return res.status(400).json({ message: "companyIds array is required" });
      }
      
      // Use optimized bulk delete for large operations
      const result = await storage.bulkDeleteCompanies(companyIds);
      
      res.json(result);
    } catch (error) {
      console.error('Error bulk deleting companies:', error);
      res.status(500).json({ message: "Failed to bulk delete companies" });
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
    const companyId = parseInt(req.params.id);
    try {
      const userId = req.user.claims.sub;
      const activityData = { ...req.body, companyId, createdBy: userId };
      const activity = await storage.createCompanyActivity(activityData);
      res.json(activity);
    } catch (error) {
      console.error('Error creating company activity:', error);
      res.status(500).json({ message: "Failed to create activity" });
      return;
    }
    const company = await storage.getCompany(companyId).catch(() => null);
    logStaffAccess(req, 'activity-logged', companyId, company?.companyName || `Company ${companyId}`);
  });

  // Convert company to lead (supports multiple products)
  app.post('/api/crm/companies/:id/convert-to-lead', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const companyId = parseInt(req.params.id);
      const { products: selectedProducts, productName, productDescription, quantity, unit, productId } = req.body;
      
      // Support both legacy single-product and new multi-product format
      let productsList: Array<{ productId: number; productName: string; quantity: string; unit: string }> = [];
      
      if (selectedProducts && Array.isArray(selectedProducts) && selectedProducts.length > 0) {
        productsList = selectedProducts;
      } else if (productName && quantity && productId) {
        productsList = [{ productId, productName, quantity, unit: unit || 'kg' }];
      }
      
      if (productsList.length === 0) {
        return res.status(400).json({ message: "At least one product must be selected" });
      }
      
      for (const p of productsList) {
        if (!p.productId) return res.status(400).json({ message: "Product selection is required for all items" });
        if (!p.quantity) return res.status(400).json({ message: "Quantity is required for all items" });
      }
      
      const companyWithDetails = await storage.getCompanyWithDetails(companyId);
      if (!companyWithDetails) {
        return res.status(404).json({ message: "Company not found" });
      }
      
      const user = await storage.getUser(userId);
      const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'sales_manager';
      if (!isAdmin && companyWithDetails.assignedTo !== userId) {
        return res.status(403).json({ message: "You don't have permission to convert this company" });
      }
      
      const primaryContact = companyWithDetails.primaryContact;
      const productIds = productsList.map(p => p.productId);
      const productNames = productsList.map(p => p.productName).join(', ');
      const truncatedProductName = productNames.length > 250
        ? productNames.substring(0, 247) + '...'
        : productNames;
      const firstProduct = productsList[0];
      
      const leadData = {
        companyId,
        contactPersonId: primaryContact?.id || null,
        productName: truncatedProductName,
        productDescription: productsList.length > 1 ? `Multiple products: ${productNames}` : (productDescription || null),
        productsInterested: productIds,
        requiredQuantity: firstProduct.quantity,
        unit: firstProduct.unit || 'kg',
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
      
      // Create lead_products entries for each product
      for (const p of productsList) {
        await storage.createLeadProduct({
          leadId: lead.id,
          productId: p.productId,
          productName: p.productName,
          quantity: p.quantity,
          unit: p.unit || 'kg',
        });
      }
      
      const productSummary = productsList.map(p => `${p.productName} (${p.quantity} ${p.unit || 'kg'})`).join(', ');
      
      await storage.createCompanyActivity({
        companyId,
        activityType: 'lead_created',
        subject: `Lead ${lead.leadId} created`,
        description: `Converted to lead with ${productsList.length} product(s): ${productSummary}`,
        createdBy: userId,
      });
      
      await storage.createLeadActivity({
        leadId: lead.id,
        activityType: 'note',
        subject: 'Company conversion details',
        description: `Lead created by converting company "${companyWithDetails.companyName}" with ${productsList.length} product(s): ${productSummary}`,
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
      const userId = req.user.claims.sub;
      const [company, user, companyLeads] = await Promise.all([
        storage.getCompany(companyId),
        storage.getUser(userId),
        db.select({ assignedSalesRep: leads.assignedSalesRep }).from(leads).where(eq(leads.companyId, companyId)),
      ]);
      if (!company) return res.status(404).json({ message: "Company not found" });
      const mayAccess = ["admin", "super_admin", "sales_manager"].includes(user?.role || "") ||
        company.assignedTo === userId || companyLeads.some(item => item.assignedSalesRep === userId);
      if (!mayAccess) return res.status(403).json({ message: "Not authorized to read this company's email" });
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

  // Context and generation here are draft-only. They deliberately do not use any mail provider.
  app.get('/api/crm/companies/:id/emails/ai-context', isAuthenticated, async (req: any, res) => {
    try {
      const companyId = Number(req.params.id);
      const userId = req.user.claims.sub;
      if (!Number.isInteger(companyId) || companyId <= 0) return res.status(400).json({ message: "Invalid company ID" });
      const [company, user, companyLeads, contacts, activeProducts] = await Promise.all([
        storage.getCompany(companyId), storage.getUser(userId),
        db.select({ assignedSalesRep: leads.assignedSalesRep }).from(leads).where(eq(leads.companyId, companyId)),
        storage.getCompanyContacts(companyId),
        db.select({ id: products.id, name: products.name }).from(products).where(and(eq(products.isActive, true), or(eq(products.stopSell, false), isNull(products.stopSell)))).orderBy(asc(products.name)),
      ]);
      if (!company) return res.status(404).json({ message: "Company not found" });
      const mayAccess = ["admin", "super_admin", "sales_manager"].includes(user?.role || "") || company.assignedTo === userId || companyLeads.some(item => item.assignedSalesRep === userId);
      if (!mayAccess) return res.status(403).json({ message: "Not authorized to read this company's email" });
      const primaryEmail = normalizeEmailAddress(company.primaryEmail);
      const validContacts = contacts.flatMap(contact => {
        const email = normalizeEmailAddress(contact.email);
        return contact.isActive !== false && email ? [{ ...contact, email }] : [];
      });
      const invalidRecipientCount =
        Number(Boolean(company.primaryEmail && !primaryEmail)) +
        contacts.filter(contact => contact.isActive !== false && contact.email && !normalizeEmailAddress(contact.email)).length;
      res.json({
        company: { id: company.id, name: company.companyName, website: normalizeWebsiteUrl(company.website)?.toString(), primaryEmail },
        contacts: validContacts.map(contact => ({ id: contact.id, name: contact.contactName, email: contact.email, designation: contact.designation, role: contact.role, isPrimary: contact.isPrimary })),
        products: activeProducts,
        recipientWarning: invalidRecipientCount
          ? `${invalidRecipientCount} saved CRM email ${invalidRecipientCount === 1 ? "address is" : "addresses are"} invalid and cannot be used until corrected in the company or contact details.`
          : undefined,
      });
    } catch (error) {
      console.error("AI sales context error:", error);
      res.status(500).json({ message: "Failed to load AI sales context" });
    }
  });

  app.post('/api/crm/companies/:id/emails/ai-draft', isAuthenticated, async (req: any, res) => {
    try {
      const companyId = Number(req.params.id);
      const userId = req.user.claims.sub;
      const body = req.body || {};
      if (!Number.isInteger(companyId) || companyId <= 0) return res.status(400).json({ message: "Invalid company ID" });
      if (!["cold", "reply", "follow_up"].includes(body.mode)) return res.status(400).json({ message: "mode must be cold, reply, or follow_up" });
      if (typeof body.instruction !== "undefined" && (typeof body.instruction !== "string" || body.instruction.length > 2_000)) return res.status(400).json({ message: "instruction must be plain text up to 2000 characters" });
      const requestedProductIds = normalizeRequestedProductIds(body.productIds);
      if (!requestedProductIds.valid) return res.status(400).json({ message: "productIds must contain numeric IDs" });
      const draftDeadlineAt = Date.now() + AI_DRAFT_TOTAL_TIMEOUT_MS;
      const now = Date.now();
      const attempts = (aiSalesDraftRateLimits.get(userId) || []).filter(time => time > now - 60_000);
      if (attempts.length >= 6) return res.status(429).json({ message: "Too many draft generations. Please wait a minute." });
      attempts.push(now); aiSalesDraftRateLimits.set(userId, attempts);

      const [company, user, companyLeads, contacts, allProducts] = await Promise.all([
        storage.getCompany(companyId), storage.getUser(userId),
        db.select({ assignedSalesRep: leads.assignedSalesRep }).from(leads).where(eq(leads.companyId, companyId)),
        storage.getCompanyContacts(companyId),
        db.select().from(products).where(and(eq(products.isActive, true), or(eq(products.stopSell, false), isNull(products.stopSell)))),
      ]);
      if (!company) return res.status(404).json({ message: "Company not found" });
      const mayAccess = ["admin", "super_admin", "sales_manager"].includes(user?.role || "") || company.assignedTo === userId || companyLeads.some(item => item.assignedSalesRep === userId);
      if (!mayAccess) return res.status(403).json({ message: "Not authorized to draft this company's email" });

      const activeContacts = contacts.flatMap(contact => {
        const email = normalizeEmailAddress(contact.email);
        return contact.isActive !== false && email ? [{ ...contact, email }] : [];
      });
      const requestedContact = Number.isInteger(body.contactId) ? activeContacts.find(contact => contact.id === body.contactId) : undefined;
      if (body.contactId !== undefined && !requestedContact) return res.status(400).json({ message: "contactId must be an active contact belonging to this company" });
      const recipientEmail = normalizeEmailAddress(body.recipientEmail) || normalizeEmailAddress(requestedContact?.email);
      if (body.recipientEmail && !recipientEmail) return res.status(400).json({ message: "The selected CRM recipient does not have a valid email address. Correct it in the company or contact details first." });
      const companyPrimary = normalizeEmailAddress(company.primaryEmail);
      const contactMatch = activeContacts.find(contact => contact.email.toLowerCase() === recipientEmail?.toLowerCase());
      if (!recipientEmail || (requestedContact && requestedContact.email?.toLowerCase() !== recipientEmail) || (!contactMatch && recipientEmail !== companyPrimary)) return res.status(400).json({ message: "Recipient must be the company primary email or an active company contact" });

      let thread: any;
      let threadMessages: any[] = [];
      if (body.mode === "cold") {
        // Cold messages intentionally do not read a supplied thread.
      } else {
        if (!Number.isInteger(body.threadId) || body.threadId <= 0) return res.status(400).json({ message: "reply and follow_up drafts require a valid threadId" });
        thread = await storage.getEmailThread(body.threadId);
        if (!thread || thread.companyId !== companyId) return res.status(400).json({ message: "This email thread does not belong to the selected company" });
        threadMessages = await storage.getEmailMessages({ threadId: thread.id });
        if (!emailThreadIncludesRecipient(thread, threadMessages, recipientEmail)) {
          return res.status(400).json({ message: "Recipient must be a participant in the selected email thread." });
        }
      }

      const normalizedWebsite = normalizeWebsiteUrl(company.website);
      let website: { status: "fetched" | "unavailable" | "not_configured"; url?: string; message?: string; pages?: number } =
        !company.website ? { status: "not_configured", message: "No website is configured." } :
          !normalizedWebsite ? { status: "unavailable", message: "The configured website URL is invalid." } : { status: "unavailable" };
      let websiteText = "";
      if (normalizedWebsite) {
        try {
          const fetched = await fetchWebsiteText(company.website, { deadlineAt: draftDeadlineAt });
          website = { status: "fetched", url: fetched.url };
          websiteText = fetched.text;
          website.pages = fetched.pages.length;
        } catch (error: any) { website = { status: "unavailable", message: error?.message || "Website could not be safely fetched." }; }
      }
      const websiteProductMatches: WebsiteProductMatch[] = websiteText
        ? findWebsiteProductMatches(allProducts as DraftProduct[], websiteText, 12)
        : [];
      const rankedCandidates = websiteProductMatches
        .map(match => (allProducts as DraftProduct[]).find(product => product.id === match.productId)!)
        .filter(Boolean);
      const suppliedIds = requestedProductIds.ids;
      const eligibleProductsById = new Map((allProducts as DraftProduct[]).map(product => [product.id, product]));
      if (suppliedIds?.some(id => !eligibleProductsById.has(id))) return res.status(400).json({ message: "Each selected product must be active and available for sale." });
      const selectedCandidates = suppliedIds
        ? Array.from(new Set(suppliedIds)).map(id => eligibleProductsById.get(id)!)
        : rankedCandidates;

      let threadText = "";
      if (thread) {
        threadText = threadMessages.sort((a, b) => Number(b.sentAt || b.receivedAt || 0) - Number(a.sentAt || a.receivedAt || 0)).slice(0, 8)
          .map(message => `${message.direction}: ${(message.bodyText || message.bodyHtml || "").replace(/<[^>]*>/g, " ").slice(0, 1_000)}`).join("\n").slice(0, 6_000);
      }
      const recipientContact = requestedContact || contactMatch;
      const generated = await generateSalesDraft(buildSalesDraftPrompt({
        mode: body.mode,
        companyName: company.companyName,
        recipient: recipientEmail,
        recipientName: recipientContact?.contactName,
        recipientDesignation: recipientContact?.designation || recipientContact?.role || undefined,
        crmContext: {
          industry: company.industryType || undefined,
          companySize: company.companySize || undefined,
          city: company.addressCity || undefined,
          state: company.addressState || undefined,
          country: company.addressCountry || undefined,
          relationshipStage: company.companyStage || undefined,
          relationshipPriority: company.priority || undefined,
          generalNotesReferenceData: company.notes?.slice(0, 1_500) || undefined,
        },
        instruction: body.instruction?.trim(),
        websiteText,
        websiteProductEvidence: websiteProductMatches
          .filter(match => selectedCandidates.some(product => product.id === match.productId))
          .map(({ productId, productName, evidence }) => ({ productId, productName, evidence })),
        products: selectedCandidates,
        threadText,
      }), selectedCandidates, { deadlineAt: draftDeadlineAt });
      if (!generated.subject || !generated.bodyText) return res.status(502).json({ message: "AI returned an incomplete draft. Please try again." });
      const generatedProducts = generated.recommendedProductIds
        .map(id => selectedCandidates.find(product => product.id === id))
        .filter((product): product is DraftProduct => Boolean(product));
      const productsToMention = (suppliedIds
        ? selectedCandidates
        : body.mode === "cold"
          ? selectedCandidates.slice(0, 3)
          : generatedProducts
      ).slice(0, 3);
      const finalBodyText = ensureProductMentions(generated.bodyText, productsToMention, suppliedIds ? "manual" : "website");
      const recommendedProducts = productsToMention.map(product => ({ id: product.id, name: product.name }));
      const sourceSummary = ["Company profile", `Products: ${selectedCandidates.length} eligible candidate${selectedCandidates.length === 1 ? "" : "s"}`];
      if (thread) sourceSummary.push("Recent company email thread");
      if (website.status === "fetched") {
        sourceSummary.push(`Public website scanned${website.pages && website.pages > 1 ? ` (${website.pages} pages)` : ""}`);
        sourceSummary.push(websiteProductMatches.length
          ? `Website product matches: ${websiteProductMatches.length}`
          : "No specific spice or herb products found on website");
      } else {
        sourceSummary.push(`Website ${website.status.replace("_", " ")}`);
      }
      res.json({
        subject: generated.subject,
        bodyText: finalBodyText,
        recommendedProducts,
        selectedProductIds: productsToMention.map(product => product.id),
        sourceSummary,
        website,
        websiteProductMatches: websiteProductMatches.map(({ productId, productName, evidence }) => ({ productId, productName, evidence })),
      });
    } catch (error: any) {
      console.error("AI sales draft error:", error);
      const message = error?.message || "Failed to generate AI sales draft";
      const timedOut = error?.name === "TimeoutError" || /timed out|timeout/i.test(message);
      res.status(timedOut ? 504 : 502).json({ message: timedOut ? "AI draft generation timed out. Please try again." : message });
    }
  });

  // Shared Titan delivery. The AI-specific route adds a final company-recipient
  // boundary check without changing the existing manual composer behavior.
  const sendCompanyEmail = async (req: any, res: any) => {
    try {
      const companyId = Number(req.params.id);
      const userId = req.user.claims.sub;
      const { to, cc, bcc, subject, bodyHtml, bodyText, productIds, attachments, threadId: requestedThreadId, isReply } = req.body || {};
      const aiRestricted = req.path.endsWith("/ai-send");
      if ((!Array.isArray(to) ? !to : !to.length) || !subject || !bodyHtml) {
        return res.status(400).json({ message: "Missing required fields: to, subject, bodyHtml" });
      }
      let recipients = Array.isArray(to) ? to : [to];
      const [company, user, config] = await Promise.all([
        storage.getCompany(companyId), storage.getUser(userId), storage.getUserEmailConfig(userId),
      ]);
      if (!company) return res.status(404).json({ message: "Company not found" });
      const companyLeads = await db.select({ assignedSalesRep: leads.assignedSalesRep }).from(leads).where(eq(leads.companyId, companyId));
      const mayAccess = ["admin", "super_admin", "sales_manager"].includes(user?.role || "") ||
        company.assignedTo === userId || companyLeads.some(item => item.assignedSalesRep === userId);
      if (!mayAccess) return res.status(403).json({ message: "Not authorized to email this company" });
      if (aiRestricted) {
        if (typeof to !== "string" || (Array.isArray(cc) ? cc.length : !!cc) || (Array.isArray(bcc) ? bcc.length : !!bcc)) {
          return res.status(400).json({ message: "AI-assisted email must have exactly one recipient and no CC or BCC." });
        }
        const normalizedRecipient = normalizeEmailAddress(to);
        if (!normalizedRecipient) {
          return res.status(400).json({ message: "The selected CRM recipient does not have a valid email address. Correct it in the company or contact details first." });
        }
        const contacts = await storage.getCompanyContacts(companyId);
        const allowedRecipient = normalizedRecipient.toLowerCase() === normalizeEmailAddress(company.primaryEmail)?.toLowerCase() ||
          contacts.some(contact => contact.isActive !== false && normalizeEmailAddress(contact.email)?.toLowerCase() === normalizedRecipient.toLowerCase());
        if (!allowedRecipient) {
          return res.status(400).json({ message: "Recipient must be the company primary email or an active company contact." });
        }
        recipients = [normalizedRecipient];
        const requestedProductIds = normalizeRequestedProductIds(productIds);
        if (!requestedProductIds.valid) {
          return res.status(400).json({ message: "AI productIds must contain numeric IDs." });
        }
        const includedProductIds = requestedProductIds.ids || [];
        if (includedProductIds.length) {
          const includedProducts = await db.select({ id: products.id, name: products.name })
            .from(products)
            .where(and(
              inArray(products.id, includedProductIds),
              eq(products.isActive, true),
              or(eq(products.stopSell, false), isNull(products.stopSell)),
            ));
          if (includedProducts.length !== includedProductIds.length) {
            return res.status(400).json({ message: "One or more AI email products are no longer active or available for sale." });
          }
          const missingNames = includedProducts.filter(product => !productNameMentioned(bodyText || "", product.name)).map(product => product.name);
          if (missingNames.length) {
            return res.status(400).json({ message: `The email text no longer mentions: ${missingNames.join(", ")}. Regenerate the draft or add the exact product name before sending.` });
          }
        }
      }
      if (!config?.isConnected || !config.titanAppPasswordEncrypted || config.isActive === false) {
        return res.status(400).json({ message: "Titan is not connected.", requiresEmailConnect: true, provider: "titan" });
      }
      const replyRequested = isReply === true;
      const replyThreadId = requestedReplyThreadId(requestedThreadId, isReply);
      if (replyRequested && replyThreadId === undefined) {
        return res.status(400).json({ message: "Please select a valid email thread to reply to." });
      }
      let thread = replyThreadId !== undefined ? await storage.getEmailThread(replyThreadId) : undefined;
      if (replyRequested && !thread) {
        return res.status(400).json({ message: "The selected email thread is no longer available. Please start a new email." });
      }
      if (thread && thread.companyId !== companyId) {
        return res.status(400).json({ message: "This email thread does not belong to the selected company." });
      }
      let threadMessages = thread ? await storage.getEmailMessages({ threadId: thread.id }) : [];
      if (aiRestricted && replyRequested && thread && !emailThreadIncludesRecipient(thread, threadMessages, recipients[0])) {
        return res.status(400).json({ message: "Reply recipient must be a participant in the selected email thread." });
      }
      if (!thread) thread = await storage.createEmailThread({
        companyId, subject, participantEmails: [config.companyEmail, ...recipients],
        lastMessageAt: new Date(), messageCount: 0, isRead: true, status: "active",
      });
      let html = bodyHtml;
      let text = bodyText || bodyHtml.replace(/<[^>]*>/g, "");
      ({ html, text } = applyConfiguredEmailSignature(config, html, text));
      const titanAttachments: any[] = [];
      for (const attachment of Array.isArray(attachments) ? attachments : []) {
        if (!attachment.fileUrl) continue;
        const service = new ObjectStorageService();
        const path = attachment.fileUrl.startsWith("/objects/") ? attachment.fileUrl : service.normalizeObjectEntityPath(attachment.fileUrl);
        const file = await service.getObjectEntityFile(path);
        const [downloadResponse, metadataResponse] = await Promise.all([file.download(), file.getMetadata()]);
        const [content] = downloadResponse;
        const [metadata] = metadataResponse;
        titanAttachments.push({ filename: attachment.fileName || "attachment", mimeType: metadata.contentType || "application/octet-stream", base64Data: Buffer.from(content).toString("base64") });
      }
      if (!threadMessages.length) threadMessages = await storage.getEmailMessages({ threadId: thread.id });
      const prior = threadMessages
        .sort((a, b) => Number(b.sentAt || b.receivedAt || 0) - Number(a.sentAt || a.receivedAt || 0))
        .find(message => message.messageIdHeader);
      const inReplyTo = replyRequested ? prior?.messageIdHeader || undefined : undefined;
      const references = inReplyTo ? [prior?.referencesHeader, inReplyTo].filter(Boolean).join(" ") : undefined;
      const result = await titanEmailProvider.send(
        { email: config.companyEmail, encryptedAppPassword: config.titanAppPasswordEncrypted },
        { to: recipients, cc: Array.isArray(cc) ? cc : cc ? [cc] : [], bcc: Array.isArray(bcc) ? bcc : bcc ? [bcc] : [], subject, bodyHtml: html, bodyText: text, fromName: config.displayName || undefined, inReplyTo, references, attachments: titanAttachments },
      );
      if (!thread.threadId) await storage.updateEmailThread(thread.id, { threadId: result.threadId });
      const message = await storage.createEmailMessage({ messageId: result.messageId, messageIdHeader: result.messageId, referencesHeader: references, threadId: thread.id, direction: "outbound", fromEmail: config.companyEmail, fromName: config.displayName || undefined, toEmails: recipients, ccEmails: Array.isArray(cc) ? cc : cc ? [cc] : [], bccEmails: Array.isArray(bcc) ? bcc : bcc ? [bcc] : [], subject, bodyHtml: html, bodyText: text, attachments: titanAttachments.map(({ filename, mimeType, base64Data }) => ({ filename, mimeType, size: Buffer.from(base64Data, "base64").length })), sentAt: new Date(), status: "sent", senderId: userId, isRead: true });
      await storage.updateEmailThread(thread.id, { lastMessageAt: new Date(), participantEmails: Array.from(new Set<string>([...(thread.participantEmails || []), config.companyEmail, ...recipients])) });
      await storage.createCompanyActivity({ companyId, activityType: "email", subject: `Email sent: ${subject}`, description: `Email sent to ${recipients.join(", ")}`, createdBy: userId });
      res.status(201).json({
        success: true,
        provider: "titan",
        message: "Email sent successfully",
        emailMessage: message,
        threadId: thread.id,
        messageId: result.messageId,
        sentFolderSaved: result.sentFolderSaved,
        warning: result.warning,
      });
    } catch (error) {
      console.error("Titan company email send error:", error);
      res.status(500).json({ message: "Failed to send email" });
    }
  };
  app.post('/api/crm/companies/:id/emails/send', isAuthenticated, sendCompanyEmail);
  app.post('/api/crm/companies/:id/emails/ai-send', isAuthenticated, sendCompanyEmail);

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
      const companyId = parseInt(req.params.id);
      const rawDueDate = req.body.dueDate;
      const parsedDueDate = rawDueDate ? new Date(rawDueDate) : null;
      const taskType = req.body.taskType || 'call';
      const title = req.body.title || '';
      const description = req.body.description || null;
      const priority = req.body.priority || 'medium';
      const status = req.body.status || 'pending';
      const assignedTo = req.body.assignedTo || userId;

      const result = await db.execute(sql`
        INSERT INTO company_tasks (company_id, task_type, title, description, due_date, priority, status, assigned_to, created_by)
        VALUES (${companyId}, ${taskType}, ${title}, ${description}, ${parsedDueDate}, ${priority}, ${status}, ${assignedTo}, ${userId})
        RETURNING *
      `);
      const task = (result as any).rows?.[0] ?? result[0];
      res.json(task);
    } catch (error: any) {
      console.error('Error creating company task:', error?.message || error);
      res.status(500).json({ message: error?.message || "Failed to create task" });
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
  // CRM - FOLLOW-UP SYSTEM ROUTES
  // ========================================

  // Today's follow-ups for current user (or team for admin/manager)
  app.get('/api/crm/follow-ups/today', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      const upcomingEnd = new Date();
      upcomingEnd.setDate(upcomingEnd.getDate() + 6);
      upcomingEnd.setHours(23, 59, 59, 999);

      // Always filter by the current user — everyone sees only their own personal follow-ups
      // Managers can use the /team endpoint for cross-agent visibility
      const rawTasks = await db
        .select({
          id: companyTasks.id,
          companyId: companyTasks.companyId,
          companyName: companies.companyName,
          primaryPhone: companies.primaryPhone,
          primaryEmail: companies.primaryEmail,
          taskType: companyTasks.taskType,
          title: companyTasks.title,
          description: companyTasks.description,
          dueDate: companyTasks.dueDate,
          priority: companyTasks.priority,
          status: companyTasks.status,
          assignedTo: companyTasks.assignedTo,
          completedAt: companyTasks.completedAt,
          createdAt: companyTasks.createdAt,
        })
        .from(companyTasks)
        .leftJoin(companies, eq(companyTasks.companyId, companies.id))
        .where(
          and(
            eq(companyTasks.assignedTo, userId),
            sql`${companyTasks.status} IN ('pending', 'in_progress')`
          )
        )
        .orderBy(companyTasks.dueDate);

      const overdue = rawTasks.filter(t => t.dueDate && new Date(t.dueDate) < todayStart);
      const today = rawTasks.filter(t => t.dueDate && new Date(t.dueDate) >= todayStart && new Date(t.dueDate) <= todayEnd);
      const upcoming = rawTasks.filter(t => t.dueDate && new Date(t.dueDate) > todayEnd && new Date(t.dueDate) <= upcomingEnd);
      // Tasks due beyond this week, or without a due date — surfaced on the Follow-ups page
      const later = rawTasks.filter(t => !t.dueDate || new Date(t.dueDate) > upcomingEnd);

      // Completed today — also only for current user
      const completedToday = await db
        .select({
          id: companyTasks.id,
          companyName: companies.companyName,
          taskType: companyTasks.taskType,
          title: companyTasks.title,
          completedAt: companyTasks.completedAt,
        })
        .from(companyTasks)
        .leftJoin(companies, eq(companyTasks.companyId, companies.id))
        .where(
          and(
            eq(companyTasks.assignedTo, userId),
            eq(companyTasks.status, 'completed'),
            gte(companyTasks.completedAt, todayStart),
            lte(companyTasks.completedAt, todayEnd)
          )
        );

      res.json({
        overdue,
        today,
        upcoming,
        later,
        completedToday,
        overdueCount: overdue.length,
        todayCount: today.length,
        upcomingCount: upcoming.length,
        laterCount: later.length,
        completedTodayCount: completedToday.length,
      });
    } catch (error) {
      console.error('Error fetching today follow-ups:', error);
      res.status(500).json({ message: "Failed to fetch follow-ups" });
    }
  });

  // Team follow-up overview (admin/manager only)
  app.get('/api/crm/follow-ups/team', isAuthenticated, async (req: any, res) => {
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const tasks = await db
        .select({
          id: companyTasks.id,
          companyName: companies.companyName,
          taskType: companyTasks.taskType,
          title: companyTasks.title,
          dueDate: companyTasks.dueDate,
          priority: companyTasks.priority,
          status: companyTasks.status,
          assignedTo: companyTasks.assignedTo,
          assigneeName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
        })
        .from(companyTasks)
        .leftJoin(companies, eq(companyTasks.companyId, companies.id))
        .leftJoin(users, eq(companyTasks.assignedTo, users.id))
        .where(sql`${companyTasks.status} IN ('pending', 'in_progress')`)
        .orderBy(companyTasks.dueDate);

      const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < todayStart);
      const today = tasks.filter(t => t.dueDate && new Date(t.dueDate) >= todayStart && new Date(t.dueDate) <= todayEnd);

      // Group by assignee
      const byAgent: Record<string, { name: string; overdue: number; today: number; upcoming: number }> = {};
      for (const t of tasks) {
        const key = t.assignedTo || 'unassigned';
        if (!byAgent[key]) byAgent[key] = { name: t.assigneeName || key, overdue: 0, today: 0, upcoming: 0 };
        if (t.dueDate && new Date(t.dueDate) < todayStart) byAgent[key].overdue++;
        else if (t.dueDate && new Date(t.dueDate) >= todayStart && new Date(t.dueDate) <= todayEnd) byAgent[key].today++;
        else byAgent[key].upcoming++;
      }

      res.json({ tasks, byAgent, overdueCount: overdue.length, todayCount: today.length });
    } catch (error) {
      console.error('Error fetching team follow-ups:', error);
      res.status(500).json({ message: "Failed to fetch team follow-ups" });
    }
  });

  // Send daily follow-up notifications (called once per day from frontend)
  app.post('/api/crm/follow-ups/notify-due', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      // Check if we already created notifications today for this user
      const existingToday = await db
        .select({ id: sql<number>`count(*)` })
        .from(sql`notifications`)
        .where(sql`user_id = ${userId} AND type = 'follow_up_due' AND created_at >= ${todayStart.toISOString()} AND created_at <= ${todayEnd.toISOString()}`);

      if (Number(existingToday[0]?.id) > 0) {
        return res.json({ notificationsCreated: 0, alreadySent: true });
      }

      // Get overdue + today tasks
      const tasks = await db
        .select({
          id: companyTasks.id,
          companyId: companyTasks.companyId,
          companyName: companies.companyName,
          title: companyTasks.title,
          dueDate: companyTasks.dueDate,
        })
        .from(companyTasks)
        .leftJoin(companies, eq(companyTasks.companyId, companies.id))
        .where(
          and(
            eq(companyTasks.assignedTo, userId),
            sql`${companyTasks.status} IN ('pending', 'in_progress')`,
            lte(companyTasks.dueDate, todayEnd)
          )
        );

      let created = 0;
      for (const task of tasks) {
        const isOverdue = task.dueDate && new Date(task.dueDate) < todayStart;
        await storage.createNotification({
          userId,
          type: isOverdue ? 'follow_up_overdue' : 'follow_up_due',
          title: isOverdue ? 'Overdue Follow-up' : 'Follow-up Due Today',
          message: `${task.companyName || 'Company'} — ${task.title}`,
          entityType: 'company_task',
          entityId: task.id,
          link: `/sales/my-companies?company=${task.companyId}&tab=followups`,
          isRead: false,
        });
        created++;
      }

      res.json({ notificationsCreated: created });
    } catch (error) {
      console.error('Error creating follow-up notifications:', error);
      res.status(500).json({ message: "Failed to create notifications" });
    }
  });

  // Complete task with outcome notes + optional next follow-up scheduling
  app.patch('/api/crm/company-tasks/:id/complete-with-notes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const taskId = parseInt(req.params.id);
      const { outcomeType, outcomeNotes, callDuration, scheduleNext, nextTask } = req.body;

      // Get existing task to know companyId
      const [existingTask] = await db
        .select()
        .from(companyTasks)
        .where(eq(companyTasks.id, taskId));

      if (!existingTask) return res.status(404).json({ message: "Task not found" });

      // Complete the task
      const [completedTask] = await db
        .update(companyTasks)
        .set({
          status: 'completed',
          completedAt: new Date(),
          completedBy: userId,
          updatedAt: new Date(),
        })
        .where(eq(companyTasks.id, taskId))
        .returning();

      // Log activity in company_activities
      await storage.createCompanyActivity({
        companyId: existingTask.companyId,
        activityType: existingTask.taskType === 'meeting' ? 'meeting' : 'call',
        subject: existingTask.title,
        description: outcomeNotes || null,
        outcome: outcomeType || null,
        duration: callDuration ? String(callDuration) : null,
        createdBy: userId,
        activityDate: new Date(),
      });

      // Create next task if requested
      let createdNextTask = null;
      if (scheduleNext && nextTask) {
        const [newTask] = await db
          .insert(companyTasks)
          .values({
            companyId: existingTask.companyId,
            taskType: nextTask.taskType || 'call',
            title: nextTask.title || `Follow-up with company`,
            description: nextTask.description || null,
            dueDate: nextTask.dueDate ? new Date(nextTask.dueDate) : null,
            priority: nextTask.priority || 'medium',
            status: 'pending',
            assignedTo: nextTask.assignedTo || userId,
            createdBy: userId,
          })
          .returning();
        createdNextTask = newTask;

        // Update company nextFollowUpDate
        if (newTask.dueDate) {
          await db
            .update(companies)
            .set({ nextFollowUpDate: new Date(newTask.dueDate) })
            .where(eq(companies.id, existingTask.companyId));
        }
      }

      res.json({ completedTask, nextTask: createdNextTask });
    } catch (error) {
      console.error('Error completing task with notes:', error);
      res.status(500).json({ message: "Failed to complete task" });
    }
  });

  // ========================================
  // CRM - COMPANY CONTACT ROUTES
  // ========================================

  app.get('/api/crm/companies/:companyId/contacts', isAuthenticated, async (req: any, res) => {
    try {
      const companyId = parseInt(req.params.companyId);
      const contacts = await storage.getCompanyContacts(companyId);
      res.json(contacts);

      // Log contact access for staff users (non-blocking)
      const userId = req.user?.claims?.sub;
      if (userId && contacts.length > 0) {
        const user = await storage.getUser(userId).catch(() => null);
        if (user?.userType === 'staff') {
          setImmediate(async () => {
            try {
              const company = await storage.getCompany(companyId).catch(() => null);
              await storage.createUserAccessEvent({
                userId,
                entityType: 'contact',
                entityId: companyId,
                entityName: company ? `${contacts.length} contacts — ${company.companyName}` : `Contacts for company #${companyId}`,
                ipAddress: extractClientIp(req),
                page: `/crm/companies/${companyId}/contacts`,
              });
            } catch (e) { /* ignore */ }
          });
        }
      }
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

  app.get('/api/crm/contacts/:id', isAuthenticated, async (req: any, res) => {
    const contactId = parseInt(req.params.id);
    let contact: any = null;
    try {
      contact = await storage.getCompanyContact(contactId);
      if (!contact) return res.status(404).json({ message: "Contact not found" });
      res.json(contact);
    } catch (error) {
      console.error('Error fetching contact:', error);
      res.status(500).json({ message: "Failed to fetch contact" });
      return;
    }
    const contactName = [contact?.firstName, contact?.lastName].filter(Boolean).join(' ') || `Contact #${contactId}`;
    logStaffAccess(req, 'contact', contactId, contactName);
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
      const user = await storage.getUser(userId);
      const userRole = user?.role || '';
      const adminRoles = ['admin', 'super_admin', 'sales_manager'];
      const isAdmin = adminRoles.includes(userRole);
      // Admins see ALL notes (public + private from any user); others see public + their own private
      const notes = await storage.getCompanyNotes(parseInt(req.params.companyId), isAdmin ? undefined : userId, isAdmin);
      res.json(notes);
    } catch (error) {
      console.error('Error fetching company notes:', error);
      res.status(500).json({ message: "Failed to fetch notes" });
    }
  });

  app.post('/api/crm/companies/:companyId/notes', isAuthenticated, async (req: any, res) => {
    const companyId = parseInt(req.params.companyId);
    let noteSaved = false;
    try {
      const userId = req.user.claims.sub;
      const noteData = insertCompanyNoteSchema.parse({ ...req.body, companyId, createdBy: userId });
      const note = await storage.createCompanyNote(noteData);
      res.json(note);
      noteSaved = true;
    } catch (error: any) {
      console.error('Error creating company note:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid note data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create note" });
    }
    if (noteSaved) {
      const company = await storage.getCompany(companyId).catch(() => null);
      logStaffAccess(req, 'note-added', companyId, company?.companyName || `Company ${companyId}`);
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
    const leadId = parseInt(req.params.id);
    let lead: any = null;
    try {
      lead = await storage.getLead(leadId);
      if (!lead) return res.status(404).json({ message: "Lead not found" });
      res.json(lead);
    } catch (error) {
      console.error('Error fetching lead:', error);
      res.status(500).json({ message: "Failed to fetch lead" });
      return;
    }
    logStaffAccess(req, 'lead', leadId, lead?.companyName || `Lead #${leadId}`);
  });

  // Get lead products
  app.get('/api/crm/leads/:id/products', isAuthenticated, async (req: any, res) => {
    try {
      const leadId = parseInt(req.params.id);
      const products = await storage.getLeadProducts(leadId);
      res.json(products);
    } catch (error) {
      console.error('Error fetching lead products:', error);
      res.status(500).json({ message: "Failed to fetch lead products" });
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
      
      // Only admins can assign leads
      const isAdmin = user.role === 'admin' || user.role === 'super_admin';
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
          // Fetch the full lead with company details for the notification
          let companyName = 'New Company';
          try {
            if (lead.companyId) {
              const company = await storage.getCompany(lead.companyId);
              if (company?.companyName) {
                companyName = company.companyName;
              }
            }
          } catch (e) {
            console.log('Failed to fetch company for lead notification:', e);
          }
          
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
      
      // Only admins can bulk assign leads
      const isAdmin = user.role === 'admin' || user.role === 'super_admin';
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
  // CRM - LEAD COMPANY CONTACTS ROUTES
  // ========================================

  // Get all contacts for a lead's company
  app.get('/api/crm/leads/:leadId/company-contacts', isAuthenticated, async (req: any, res) => {
    try {
      const leadId = parseInt(req.params.leadId);
      const lead = await storage.getLead(leadId);
      
      if (!lead) {
        return res.status(404).json({ message: 'Lead not found' });
      }

      if (!lead.companyId) {
        return res.json([]);
      }

      const contacts = await storage.getCompanyContacts(lead.companyId);
      res.json(contacts);
    } catch (error) {
      console.error('Error fetching lead company contacts:', error);
      res.status(500).json({ message: 'Failed to fetch company contacts' });
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
        storage.getSampleRequests(
          user.role === 'sales_manager' || user.role === 'admin' || user.role === 'super_admin'
            ? { limit: 1000 }
            : { salesUserId: userId, limit: 1000 }
        ),
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

      const { status, source, search, limit = '50', offset = '0' } = req.query;
      const filters: any = {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      };
      if (user.role !== 'sales_manager' && user.role !== 'admin' && user.role !== 'super_admin') {
        filters.salesUserId = userId;
      }
      if (status) filters.status = status;
      if (source) filters.source = source;
      if (search) filters.search = search;

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

  // Admin preview only. The public robots.txt is owned by server/index.ts.
  app.get('/api/admin/seo/robots-preview.txt', isAuthenticated, isAdminOrWebsiteManager, (_req, res) => {
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
      if (!isEmailAdmin(await storage.getUser(req.user.claims.sub))) {
        return res.status(403).json({ message: "Administrator access required" });
      }
      // Use getSalesReps which returns users with admin, super_admin, sales_manager, sales_executive roles
      const eligibleUsers = await storage.getSalesReps();
      res.json(eligibleUsers.map(user => ({
        id: user.id,
        username: user.email || user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      })));
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  // Get user's email configuration
  app.get('/api/email/config', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const config = await storage.getPublicUserEmailConfig(userId);
      res.json(config || null);
    } catch (error) {
      console.error('Error fetching email config:', error);
      res.status(500).json({ message: 'Failed to fetch email configuration' });
    }
  });

  // Self-service Titan connection.  The assigned address is always the SMTP/IMAP username.
  app.post('/api/email/connect', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const config = await storage.getUserEmailConfig(userId);
      if (!config) {
        return res.status(404).json({ message: 'No assigned Titan email configuration found. Contact an administrator.' });
      }
      if (config.isActive === false) {
        return res.status(403).json({ message: "This Titan mailbox assignment is inactive. Contact an administrator." });
      }
      const appPassword = typeof req.body?.appPassword === "string" ? req.body.appPassword.trim() : "";
      if (!appPassword) return res.status(400).json({ message: "Titan app password is required" });
      // Encrypt before handing the temporary credential to the provider, so plaintext is
      // never retained in an object beyond this request.
      const encryptedAppPassword = encryptEmailCredential(appPassword);
      await titanEmailProvider.verifyCredentials({ email: config.companyEmail, encryptedAppPassword });
      await storage.updateTitanCredentials(config.id, appPassword);
      res.json({ success: true, provider: "titan", connected: true, email: config.companyEmail });
    } catch (error) {
      console.error('Titan credential verification failed:', error instanceof Error ? error.message : error);
      res.status(400).json({ message: 'Unable to verify Titan SMTP/IMAP credentials. Check your assigned email and app password.' });
    }
  });

  app.post('/api/email/disconnect', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const config = await storage.getUserEmailConfig(userId);
      
      if (!config) {
        return res.status(404).json({ message: 'No email configuration found' });
      }
      
      await storage.clearTitanCredentials(config.id);
      res.json({ success: true, provider: "titan" });
    } catch (error) {
      console.error('Error disconnecting Titan:', error);
      res.status(500).json({ message: 'Failed to disconnect Titan' });
    }
  });

  app.get('/api/email/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const config = await storage.getUserEmailConfig(userId);
      
      res.json(publicTitanStatus(config));
    } catch (error) {
      console.error('Error checking Titan status:', error);
      res.status(500).json({ message: 'Failed to check Titan status' });
    }
  });

  // Admin: Get all email configurations
  app.get('/api/admin/email-configs', isAuthenticated, async (req: any, res) => {
    try {
      if (!isEmailAdmin(await storage.getUser(req.user.claims.sub))) return res.status(403).json({ message: "Administrator access required" });
      const configs = await storage.getPublicUserEmailConfigs();
      res.json(configs);
    } catch (error) {
      console.error('Error fetching email configs:', error);
      res.status(500).json({ message: 'Failed to fetch email configurations' });
    }
  });

  // Admin: Create email configuration for user
  app.post('/api/admin/email-configs', isAuthenticated, async (req: any, res) => {
    try {
      if (!isEmailAdmin(await storage.getUser(req.user.claims.sub))) return res.status(403).json({ message: "Administrator access required" });
      const { userId, companyEmail, displayName, department, isPrimary, isActive } = req.body || {};
      if (!userId || !companyEmail) return res.status(400).json({ message: "userId and companyEmail are required" });
      const config = await storage.createUserEmailConfig({ userId, companyEmail, displayName, department, isPrimary, isActive, serviceType: "titan" });
      res.status(201).json((await storage.getPublicUserEmailConfigs()).find(item => item.id === config.id));
    } catch (error) {
      console.error('Error creating email config:', error);
      res.status(500).json({ message: 'Failed to create email configuration' });
    }
  });

  // Admin: Update email configuration
  app.patch('/api/admin/email-configs/:id', isAuthenticated, async (req: any, res) => {
    try {
      if (!isEmailAdmin(await storage.getUser(req.user.claims.sub))) return res.status(403).json({ message: "Administrator access required" });
      const id = parseInt(req.params.id);
      const existing = await storage.getEmailConfigById(id);
      if (!existing) return res.status(404).json({ message: "Email configuration not found" });
      const { userId, companyEmail, displayName, department, isPrimary, isActive } = req.body || {};
      const assignmentChanged = (typeof companyEmail === "string" &&
        companyEmail.trim().toLowerCase() !== existing.companyEmail.toLowerCase()) ||
        (typeof userId === "string" && userId !== existing.userId);
      const config = await storage.updateUserEmailConfig(id, {
        userId,
        companyEmail: typeof companyEmail === "string" ? companyEmail.trim() : companyEmail,
        displayName,
        department,
        isPrimary,
        isActive,
        serviceType: "titan",
      });
      if (assignmentChanged) await storage.clearTitanCredentials(id);
      res.json((await storage.getPublicUserEmailConfigs()).find(item => item.id === config.id));
    } catch (error) {
      console.error('Error updating email config:', error);
      res.status(500).json({ message: 'Failed to update email configuration' });
    }
  });

  // Admin: Delete email configuration
  app.delete('/api/admin/email-configs/:id', isAuthenticated, async (req: any, res) => {
    try {
      if (!isEmailAdmin(await storage.getUser(req.user.claims.sub))) return res.status(403).json({ message: "Administrator access required" });
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
      if (!isEmailAdmin(await storage.getUser(req.user.claims.sub))) return res.status(403).json({ message: "Administrator access required" });
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

  // Admin: Save sanitized HTML signature for an email configuration
  app.put('/api/admin/email-configs/:id/signature-html', isAuthenticated, async (req: any, res) => {
    try {
      if (!isEmailAdmin(await storage.getUser(req.user.claims.sub))) {
        return res.status(403).json({ message: "Administrator access required" });
      }
      const configId = Number(req.params.id);
      const { signatureHtml } = req.body || {};
      if (!Number.isInteger(configId) || configId <= 0) {
        return res.status(400).json({ message: "Invalid email configuration" });
      }
      if (typeof signatureHtml !== "string" || !signatureHtml.trim()) {
        return res.status(400).json({ message: "HTML signature is required" });
      }

      const config = await storage.getEmailConfigById(configId);
      if (!config) {
        return res.status(404).json({ message: "Email configuration not found" });
      }

      let sanitizedSignature: string;
      try {
        sanitizedSignature = sanitizeSignatureHtml(signatureHtml);
      } catch (error) {
        return res.status(400).json({
          message: error instanceof Error ? error.message : "Invalid HTML signature",
        });
      }
      if (!hasSupportedSignatureContent(sanitizedSignature)) {
        return res.status(400).json({
          message: "The signature does not contain any supported text, links, tables, or images.",
        });
      }

      const updatedConfig = await storage.updateUserEmailConfig(configId, {
        signatureHtml: sanitizedSignature,
      });
      res.json({
        success: true,
        signatureHtml: sanitizedSignature,
        config: (await storage.getPublicUserEmailConfigs()).find(item => item.id === updatedConfig.id),
      });
    } catch (error) {
      console.error("Error updating HTML signature:", error);
      res.status(500).json({ message: "Failed to update HTML signature" });
    }
  });

  // Admin: Update signature image URL for email configuration
  app.put('/api/admin/email-configs/:id/signature', isAuthenticated, async (req: any, res) => {
    try {
      if (!isEmailAdmin(await storage.getUser(req.user.claims.sub))) return res.status(403).json({ message: "Administrator access required" });
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
          config: (await storage.getPublicUserEmailConfigs()).find(item => item.id === updatedConfig.id)
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
          config: (await storage.getPublicUserEmailConfigs()).find(item => item.id === updatedConfig.id),
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
      if (!isEmailAdmin(await storage.getUser(req.user.claims.sub))) return res.status(403).json({ message: "Administrator access required" });
      const configId = parseInt(req.params.id);
      const config = await storage.getEmailConfigById(configId);
      
      if (!config) {
        return res.status(404).json({ message: 'Email configuration not found' });
      }

      // Explicit removal clears both the current HTML signature and legacy image fallback.
      const updatedConfig = await storage.updateUserEmailConfig(configId, {
        signatureHtml: null,
        signatureImageUrl: null,
      });

      res.json({ success: true, config: (await storage.getPublicUserEmailConfigs()).find(item => item.id === updatedConfig.id) });
    } catch (error) {
      console.error('Error removing signature:', error);
      res.status(500).json({ message: 'Failed to remove signature' });
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
  // FREJUN VOICE/SMS INTEGRATION ROUTES
  // ========================================

  // Check Frejun configuration status
  app.get('/api/voice/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;
      const { frejunService } = await import('./frejunService');
      const status = frejunService.getConfigStatus();
      
      // Check if user has connected their Frejun account via OAuth (now async)
      const userToken = await frejunService.getUserToken(userId);
      
      // Check if token exists and is not expired (with 5 minute buffer)
      let isUserConnected = false;
      let tokenExpired = false;
      
      if (userToken) {
        const bufferMs = 5 * 60 * 1000;
        const isExpired = new Date().getTime() >= (userToken.expiresAt.getTime() - bufferMs);
        
        if (isExpired) {
          // Token is expired - try to refresh it silently
          tokenExpired = true;
          console.log('Frejun: Token expired for user', userId, '- needs re-authentication');
        } else {
          isUserConnected = true;
        }
      }
      
      // Always include OAuth URL for Connect button functionality
      const oauthUrl = frejunService.getAuthorizationUrl(userId);
      
      res.json({
        ...status,
        isUserConnected,
        tokenExpired,
        dialerWidgetUrl: frejunService.getDialerWidgetUrl(),
        oauthUrl,
      });
    } catch (error) {
      console.error('Error checking Frejun status:', error);
      res.status(500).json({ message: 'Failed to check voice service status' });
    }
  });

  // Get Frejun OAuth authorization URL
  app.get('/api/voice/frejun/auth-url', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;
      const { frejunService } = await import('./frejunService');
      
      if (!frejunService.isReady()) {
        return res.status(400).json({ message: 'Frejun is not configured' });
      }
      
      const authUrl = frejunService.getAuthorizationUrl(userId);
      res.json({ authUrl });
    } catch (error) {
      console.error('Error getting Frejun auth URL:', error);
      res.status(500).json({ message: 'Failed to get authorization URL' });
    }
  });

  // Shared Frejun OAuth callback handler (supports both GET and POST)
  const handleFrejunOAuthCallback = async (req: any, res: any) => {
    try {
      // Support both query params (GET) and body params (POST)
      const code = req.query.code || req.body?.code;
      const email = req.query.email || req.body?.email;
      const state = req.query.state || req.body?.state;
      const { frejunService } = await import('./frejunService');
      
      console.log('Frejun OAuth callback received - method:', req.method, 'code:', code ? 'present' : 'missing', 'email:', email, 'state:', state);
      
      if (!code) {
        return res.redirect('/admin/settings?frejun=error&reason=no_code');
      }
      
      const tokenResult = await frejunService.exchangeCodeForTokens(code as string);
      
      console.log('Frejun token exchange result:', tokenResult.success ? 'success' : 'failed', tokenResult.error || '');
      
      if (!tokenResult.success || !tokenResult.accessToken) {
        const errorReason = encodeURIComponent(tokenResult.error || 'token_exchange_failed');
        return res.redirect(`/admin/settings?frejun=error&reason=${errorReason}`);
      }
      
      // Store the token for this user (state contains userId)
      const userId = state as string;
      if (userId) {
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + (tokenResult.expiresIn || 3600));
        
        await frejunService.storeUserToken(userId, {
          accessToken: tokenResult.accessToken,
          refreshToken: tokenResult.refreshToken || '',
          expiresAt,
          userEmail: email as string || '',
        });
      }
      
      // Return HTML that closes the popup and notifies the parent window
      res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>Frejun Connected</title></head>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'frejun-auth-success' }, '*');
              window.close();
            } else {
              window.location.href = '/admin/settings?frejun=connected';
            }
          </script>
          <p>Frejun connected successfully! This window will close automatically.</p>
        </body>
        </html>
      `);
    } catch (error) {
      console.error('Error in Frejun OAuth callback:', error);
      res.redirect('/admin/settings?frejun=error&reason=callback_failed');
    }
  };

  // Frejun OAuth callback (supports both GET and POST methods)
  app.get('/api/voice/frejun/oauth/callback', handleFrejunOAuthCallback);
  app.post('/api/voice/frejun/oauth/callback', handleFrejunOAuthCallback);

  // Legacy callback path (backward compatibility) - supports both GET and POST
  app.get('/api/voice/frejun/callback', handleFrejunOAuthCallback);
  app.post('/api/voice/frejun/callback', handleFrejunOAuthCallback);

  // Get Frejun dialer widget configuration
  app.get('/api/voice/frejun/dialer-config', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;
      const { frejunService } = await import('./frejunService');
      
      const tokenData = await frejunService.getUserToken(userId);
      if (!tokenData) {
        return res.status(400).json({ 
          message: 'Please connect your Frejun account first',
          needsAuth: true,
          authUrl: frejunService.getAuthorizationUrl(userId),
        });
      }
      
      const config = frejunService.getDialerWidgetConfig(tokenData.userEmail, tokenData.accessToken);
      res.json({
        ...config,
        userEmail: tokenData.userEmail,
      });
    } catch (error) {
      console.error('Error getting dialer config:', error);
      res.status(500).json({ message: 'Failed to get dialer configuration' });
    }
  });

  // Sync call logs from Frejun API (to get recordings and updated call details)
  app.post('/api/voice/frejun/sync-call-logs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { frejunService } = await import('./frejunService');
      
      // Get Frejun call logs from the last 7 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const result = await frejunService.getCallLogs(userId, {
        limit: 100,
        startDate,
        endDate,
      });

      if (!result.success || !result.data) {
        return res.status(400).json({ 
          success: false, 
          message: result.error || 'Failed to fetch call logs from Frejun' 
        });
      }

      let synced = 0;
      let updated = 0;

      // Process each call log from Frejun
      for (const frejunCall of result.data.results) {
        // Try to find matching call log by Frejun call ID
        const existingLog = await storage.getCallLogByUuid(frejunCall.callId);
        
        if (existingLog) {
          // Update existing call log with Frejun data (recording, duration, etc.)
          const hasUpdates = !existingLog.recordingUrl && frejunCall.recordingUrl;
          
          if (hasUpdates || !existingLog.durationSeconds) {
            await storage.updateCallLog(existingLog.id, {
              recordingUrl: frejunCall.recordingUrl || existingLog.recordingUrl,
              transcription: frejunCall.transcription || existingLog.transcription,
              durationSeconds: frejunCall.duration || existingLog.durationSeconds,
              status: frejunCall.status || existingLog.status,
            });
            updated++;

            // Create activity if we just got a recording
            if (hasUpdates && existingLog.leadId) {
              const durationMinutes = Math.ceil((frejunCall.duration || 0) / 60);
              await storage.createLeadActivity({
                leadId: existingLog.leadId,
                activityType: 'call',
                subject: `Call recording available for ${existingLog.recipientName || existingLog.recipientPhone}`,
                description: `Call duration: ${durationMinutes} min. Recording synced from Frejun.`,
                outcome: 'Recording Available',
                duration: durationMinutes,
                direction: existingLog.direction || 'outbound',
                createdBy: existingLog.callerUserId || null,
              });
            }
          }
          synced++;
        }
      }

      res.json({ 
        success: true, 
        message: `Synced ${synced} calls, updated ${updated} with recordings`,
        total: result.data.count,
      });
    } catch (error) {
      console.error('Error syncing Frejun call logs:', error);
      res.status(500).json({ message: 'Failed to sync call logs from Frejun' });
    }
  });

  // Get call history from Frejun API
  app.get('/api/voice/frejun/call-history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { limit, offset, startDate, endDate } = req.query;
      const { frejunService } = await import('./frejunService');

      const result = await frejunService.getCallLogs(userId, {
        limit: limit ? parseInt(limit as string) : 50,
        offset: offset ? parseInt(offset as string) : 0,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      if (!result.success) {
        return res.status(400).json({ 
          success: false, 
          message: result.error || 'Failed to fetch call history' 
        });
      }

      res.json(result.data);
    } catch (error) {
      console.error('Error fetching Frejun call history:', error);
      res.status(500).json({ message: 'Failed to fetch call history' });
    }
  });

  // Initiate a voice call via Frejun (network-based 2-legged call)
  app.post('/api/voice/call', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { phoneNumber, leadId, companyId, contactName, callType = 'network' } = req.body;
      
      if (!phoneNumber) {
        return res.status(400).json({ message: 'Phone number is required' });
      }

      const { frejunService } = await import('./frejunService');
      
      // Check if user has Frejun connected (now async)
      const tokenData = await frejunService.getUserToken(userId);
      if (!tokenData) {
        return res.status(400).json({ 
          success: false,
          message: 'Please connect your Frejun account first',
          needsAuth: true,
        });
      }
      
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

      // Initiate call via Frejun (network-based call)
      const result = await frejunService.initiateNetworkCall(userId, {
        userEmail: tokenData.userEmail,
        candidateNumber: phoneNumber,
        candidateName: contactName,
        transactionId: callLog.id.toString(),
      });

      if (result.success && result.callId) {
        // Update call log with Frejun call ID
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

  // End a call (Frejun calls are ended via the dialer widget)
  app.post('/api/voice/call/:callId/end', isAuthenticated, async (req: any, res) => {
    try {
      const { callId } = req.params;
      
      // Update call log (Frejun calls are ended via the dialer widget, we just update our records)
      await storage.updateCallLogByUuid(callId, {
        status: 'completed',
        endedAt: new Date(),
      });
      
      res.json({ success: true });
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

  // Create call log (lightweight endpoint for VoIP calls - no network call initiation)
  app.post('/api/voice/call-log', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { phoneNumber, leadId, companyId, contactName } = req.body;
      
      if (!phoneNumber) {
        return res.status(400).json({ message: 'Phone number is required' });
      }

      // Get user info for activity logging
      const user = await storage.getUser(userId);
      const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : 'Unknown';

      // Create call log in database (VoIP call initiated via widget, not via API)
      const callLog = await storage.createCallLog({
        callerUserId: userId,
        recipientPhone: phoneNumber,
        recipientName: contactName,
        direction: 'outbound',
        status: 'dialing',
        leadId: leadId || null,
        companyId: companyId || null,
      });

      // Also create a lead activity if this is associated with a lead
      if (leadId) {
        await storage.createLeadActivity({
          leadId: parseInt(leadId),
          activityType: 'call',
          subject: `Outbound call to ${contactName || phoneNumber}`,
          description: `Call initiated to ${phoneNumber}${contactName ? ` (${contactName})` : ''} by ${userName}`,
          direction: 'outbound',
          createdBy: userId,
        });
      }

      res.json({ 
        success: true, 
        callLogId: callLog.id,
        message: 'Call log created for VoIP call',
      });
    } catch (error) {
      console.error('Error creating call log:', error);
      res.status(500).json({ message: 'Failed to create call log' });
    }
  });

  // Update call log when call ends (with duration, recording, etc.)
  app.post('/api/voice/call-log/:id/complete', isAuthenticated, async (req: any, res) => {
    try {
      const callLogId = parseInt(req.params.id);
      const { duration, status, recordingUrl, transcription, notes, disposition } = req.body;
      
      const existingLog = await storage.getCallLog(callLogId);
      if (!existingLog) {
        return res.status(404).json({ message: 'Call log not found' });
      }

      // Update the call log with completion details
      const updated = await storage.updateCallLog(callLogId, {
        status: status || 'completed',
        duration: duration || 0,
        recordingUrl: recordingUrl || null,
        transcription: transcription || null,
        notes: notes || existingLog.notes,
        disposition: disposition || existingLog.disposition,
        endedAt: new Date(),
      });

      // Update the lead activity with call outcome if this was a lead call
      if (existingLog.leadId && duration) {
        const durationMinutes = Math.ceil(duration / 60);
        const user = await storage.getUser(existingLog.callerUserId || '');
        const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : 'System';
        
        // Create a follow-up activity showing call completion with recording
        await storage.createLeadActivity({
          leadId: existingLog.leadId,
          activityType: 'call',
          subject: `Call ${status === 'completed' ? 'completed' : status} with ${existingLog.recipientName || existingLog.recipientPhone}`,
          description: recordingUrl 
            ? `Call duration: ${durationMinutes} min. Recording available. (${userName})`
            : `Call duration: ${durationMinutes} min. (${userName})`,
          outcome: disposition || (status === 'completed' ? 'Connected' : 'Not connected'),
          duration: durationMinutes,
          direction: 'outbound',
          createdBy: existingLog.callerUserId || null,
        });
      }

      res.json({ success: true, callLog: updated });
    } catch (error) {
      console.error('Error completing call log:', error);
      res.status(500).json({ message: 'Failed to complete call log' });
    }
  });

  // Send SMS (Note: Frejun focuses on voice; SMS may need alternative provider)
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

      // Create SMS record in database (SMS provider integration pending)
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

      // Note: Frejun is primarily for voice calls
      // SMS functionality would need a separate provider (e.g., Twilio, MSG91)
      // For now, we log the SMS locally
      await storage.updateSmsMessage(smsRecord.id, {
        status: 'sent',
        sentAt: new Date(),
      });

      res.json({ 
        success: true, 
        messageId: smsRecord.id,
        note: 'SMS logged locally. External SMS delivery requires additional configuration.',
      });
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

  // Webhook for Frejun call events
  app.post('/api/voice/webhook/status', async (req, res) => {
    try {
      const { frejunService } = await import('./frejunService');
      const event = frejunService.processWebhook(req.body, req.headers['frejun-signature'] as string);
      
      console.log('Frejun webhook received:', event.type, event.callId);

      if (!event.callId) {
        return res.status(200).json({ received: true });
      }

      switch (event.type) {
        case 'call_started':
          await storage.updateCallLogByUuid(event.callId, {
            status: 'ringing',
            ringingAt: new Date(),
          });
          break;
        case 'call_answered':
          await storage.updateCallLogByUuid(event.callId, {
            status: 'answered',
            answeredAt: new Date(),
          });
          break;
        case 'call_ended':
          const endedCallLog = await storage.getCallLogByUuid(event.callId);
          await storage.updateCallLogByUuid(event.callId, {
            status: 'completed',
            endedAt: new Date(),
            durationSeconds: event.duration || 0,
            recordingUrl: event.recordingUrl,
            transcription: event.transcription,
          });
          
          // Create lead activity for call completion with recording info
          if (endedCallLog?.leadId) {
            const durationMinutes = Math.ceil((event.duration || 0) / 60);
            const callerUser = endedCallLog.callerUserId ? await storage.getUser(endedCallLog.callerUserId) : null;
            const userName = callerUser ? `${callerUser.firstName || ''} ${callerUser.lastName || ''}`.trim() || callerUser.email : 'System';
            
            await storage.createLeadActivity({
              leadId: endedCallLog.leadId,
              activityType: 'call',
              subject: `Call completed with ${endedCallLog.recipientName || endedCallLog.recipientPhone}`,
              description: event.recordingUrl 
                ? `Call duration: ${durationMinutes} min. Recording available. (${userName})`
                : `Call duration: ${durationMinutes} min. (${userName})`,
              outcome: event.duration && event.duration > 0 ? 'Connected' : 'Not answered',
              duration: durationMinutes,
              direction: endedCallLog.direction || 'outbound',
              createdBy: endedCallLog.callerUserId || null,
            });
          }
          break;
        case 'call_missed':
          await storage.updateCallLogByUuid(event.callId, {
            status: 'missed',
            endedAt: new Date(),
          });
          break;
        case 'voicemail':
          const callLog = await storage.getCallLogByUuid(event.callId);
          if (callLog) {
            await storage.createVoicemail({
              voicemailUuid: event.callId,
              userId: callLog.callerUserId,
              callerPhone: event.callerNumber || callLog.recipientPhone,
              callerName: event.candidateName,
              recordingUrl: event.recordingUrl,
              transcription: event.transcription,
              durationSeconds: event.duration,
              leadId: callLog.leadId,
              companyId: callLog.companyId,
              callLogId: callLog.id,
            });

            await storage.updateCallLog(callLog.id, {
              status: 'voicemail',
              voicemailUrl: event.recordingUrl,
            });
          }
          break;
      }

      res.status(200).json({ received: true });
    } catch (error) {
      console.error('Error processing Frejun webhook:', error);
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
  // RETIRED GMAIL OAUTH ROUTES
  // ========================================

  // Start Gmail OAuth flow for an email configuration
  app.get('/api/admin/email-configs/:id/connect', isAuthenticated, async (req: any, res) => {
    res.status(410).json({ message: "Gmail OAuth has been retired. Each assigned staff member must connect their own Titan app password in Email Settings.", provider: "titan" });
  });

  // Gmail OAuth callback - handles both admin-initiated and self-service connections
  app.get('/api/auth/gmail/callback', async (req: any, res) => {
    return res.status(410).json({ message: "Gmail OAuth has been retired. Connect Titan from Email Settings.", provider: "titan" });
  });

  // Administratively clear Titan credentials from an email configuration
  app.post('/api/admin/email-configs/:id/disconnect', isAuthenticated, async (req: any, res) => {
    try {
      if (!isEmailAdmin(await storage.getUser(req.user.claims.sub))) return res.status(403).json({ message: "Administrator access required" });
      const configId = parseInt(req.params.id);
      await storage.clearTitanCredentials(configId);
      res.json({ success: true, provider: "titan" });
    } catch (error) {
      console.error('Error disconnecting Titan:', error);
      res.status(500).json({ message: 'Failed to disconnect Titan' });
    }
  });

  // Check Titan connection status for an email config
  app.get('/api/admin/email-configs/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      if (!isEmailAdmin(await storage.getUser(req.user.claims.sub))) return res.status(403).json({ message: "Administrator access required" });
      const configId = parseInt(req.params.id);
      const config = await storage.getEmailConfigById(configId);
      
      if (!config) {
        return res.status(404).json({ message: 'Email configuration not found' });
      }

      res.json(publicTitanStatus(config));
    } catch (error) {
      console.error('Error checking Titan status:', error);
      res.status(500).json({ message: 'Failed to check Titan status' });
    }
  });

  // ========================================
  // END RETIRED GMAIL OAUTH ROUTES
  // ========================================

  // Get email threads for a lead
  app.get('/api/crm/leads/:leadId/emails', isAuthenticated, async (req: any, res) => {
    try {
      const leadId = parseInt(req.params.leadId);
      const leadForAccess = await storage.getLead(leadId);
      const accessUser = await storage.getUser(req.user.claims.sub);
      if (!leadForAccess) return res.status(404).json({ message: "Lead not found" });
      if (!["admin", "super_admin", "sales_manager"].includes(accessUser?.role || "") && leadForAccess.assignedSalesRep !== req.user.claims.sub) {
        return res.status(403).json({ message: "Not authorized to read this lead's email" });
      }
      
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
      const lead = await storage.getLead(leadId);
      const accessUser = await storage.getUser(req.user.claims.sub);
      if (!lead) return res.status(404).json({ message: "Lead not found" });
      if (!["admin", "super_admin", "sales_manager"].includes(accessUser?.role || "") && lead.assignedSalesRep !== req.user.claims.sub) {
        return res.status(403).json({ message: "Not authorized to read this lead's email" });
      }
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
      const leadId = Number(req.params.leadId), userId = req.user.claims.sub;
      const { to, cc, bcc, subject, bodyHtml, bodyText, attachments, threadId: requestedThreadId, isReply } = req.body || {};
      if ((!Array.isArray(to) ? !to : !to.length) || !subject || !bodyHtml) return res.status(400).json({ message: "Missing required fields: to, subject, bodyHtml" });
      const [lead, user, config] = await Promise.all([storage.getLead(leadId), storage.getUser(userId), storage.getUserEmailConfig(userId)]);
      if (!lead) return res.status(404).json({ message: "Lead not found" });
      if (!["admin", "super_admin", "sales_manager"].includes(user?.role || "") && lead.assignedSalesRep !== userId) return res.status(403).json({ message: "Not authorized to email this lead" });
      if (!config?.isConnected || !config.titanAppPasswordEncrypted || config.isActive === false) return res.status(400).json({ message: "Titan is not connected.", requiresEmailConnect: true, provider: "titan" });
      const recipients = Array.isArray(to) ? to : [to];
      let thread = requestedThreadId && isReply ? await storage.getEmailThread(Number(requestedThreadId)) : undefined;
      if (thread && thread.leadId !== leadId && (!lead.companyId || thread.companyId !== lead.companyId)) return res.status(400).json({ message: "Invalid email thread" });
      if (!thread) thread = await storage.createEmailThread({ leadId, companyId: lead.companyId, subject, participantEmails: [config.companyEmail, ...recipients], lastMessageAt: new Date(), messageCount: 0, isRead: true, status: "active" });
      let html = bodyHtml, text = bodyText || bodyHtml.replace(/<[^>]*>/g, "");
      ({ html, text } = applyConfiguredEmailSignature(config, html, text));
      const providerAttachments: any[] = [];
      for (const item of Array.isArray(attachments) ? attachments : []) {
        if (!item.fileUrl) continue;
        const service = new ObjectStorageService(), path = item.fileUrl.startsWith("/objects/") ? item.fileUrl : service.normalizeObjectEntityPath(item.fileUrl);
        const object = await service.getObjectEntityFile(path), [downloadResponse, metadataResponse] = await Promise.all([object.download(), object.getMetadata()]);
        const [content] = downloadResponse;
        const [metadata] = metadataResponse;
        providerAttachments.push({ filename: item.fileName || "attachment", mimeType: metadata.contentType || "application/octet-stream", base64Data: Buffer.from(content).toString("base64") });
      }
      const parent = (await storage.getEmailMessages({ threadId: thread.id })).sort((a,b) => Number(b.sentAt || b.receivedAt || 0) - Number(a.sentAt || a.receivedAt || 0)).find(item => item.messageIdHeader);
      const inReplyTo = isReply ? parent?.messageIdHeader || undefined : undefined;
      const references = inReplyTo ? [parent?.referencesHeader, inReplyTo].filter(Boolean).join(" ") : undefined;
      const sent = await titanEmailProvider.send({ email: config.companyEmail, encryptedAppPassword: config.titanAppPasswordEncrypted }, { to: recipients, cc: Array.isArray(cc) ? cc : cc ? [cc] : [], bcc: Array.isArray(bcc) ? bcc : bcc ? [bcc] : [], subject, bodyHtml: html, bodyText: text, fromName: config.displayName || undefined, inReplyTo, references, attachments: providerAttachments });
      if (!thread.threadId) await storage.updateEmailThread(thread.id, { threadId: sent.threadId });
      const message = await storage.createEmailMessage({ messageId: sent.messageId, messageIdHeader: sent.messageId, referencesHeader: references, threadId: thread.id, leadId, direction: "outbound", fromEmail: config.companyEmail, fromName: config.displayName || undefined, toEmails: recipients, ccEmails: Array.isArray(cc) ? cc : cc ? [cc] : [], bccEmails: Array.isArray(bcc) ? bcc : bcc ? [bcc] : [], subject, bodyHtml: html, bodyText: text, attachments: providerAttachments.map(({ filename, mimeType, base64Data }) => ({ filename, mimeType, size: Buffer.from(base64Data, "base64").length })), sentAt: new Date(), status: "sent", senderId: userId, isRead: true });
      await storage.updateEmailThread(thread.id, { lastMessageAt: new Date(), participantEmails: Array.from(new Set<string>([...(thread.participantEmails || []), config.companyEmail, ...recipients])) });
      await storage.createLeadActivity({ leadId, activityType: "email", subject: `Email sent: ${subject}`, description: `Email sent to ${recipients.join(", ")}`, createdBy: userId });
      res.status(201).json({
        success: true,
        provider: "titan",
        message: "Email sent successfully",
        emailMessage: message,
        threadId: thread.id,
        messageId: sent.messageId,
        sentFolderSaved: sent.sentFolderSaved,
        warning: sent.warning,
      });
    } catch (error) { console.error("Titan lead email send error:", error); res.status(500).json({ message: "Failed to send email" }); }
  });

  // Retired manual provider-ingestion endpoint. Titan replies are imported through
  // the authenticated mailbox sync route, which performs mailbox and CRM matching.
  app.post('/api/emails/receive', isAuthenticated, async (req: any, res) => {
    res.status(410).json({ message: "Manual email ingestion has been retired. Sync replies from the connected Titan mailbox.", provider: "titan" });
  });

  // Sync the current user's Titan inbox, then report replies relevant to this lead.
  app.post('/api/crm/leads/:leadId/emails/sync', isAuthenticated, async (req: any, res) => {
    const leadId = Number(req.params.leadId), userId = req.user?.id || req.user?.claims?.sub;
    let config: any;
    let activeSyncConfigId: number | undefined;
    try {
      const [lead, user] = await Promise.all([storage.getLead(leadId), storage.getUser(userId)]);
      if (!lead) return res.status(404).json({ message: "Lead not found" });
      if (!["admin", "super_admin", "sales_manager"].includes(user?.role || "") && lead.assignedSalesRep !== userId) return res.status(403).json({ message: "Not authorized to sync this lead's email" });
      config = await storage.getUserEmailConfig(userId);
      if (!config?.isConnected || !config.titanAppPasswordEncrypted || config.isActive === false) return res.status(400).json({ message: "Titan is not connected.", requiresEmailConnect: true, provider: "titan" });
      if (activeTitanSyncConfigIds.has(config.id)) return res.status(409).json({ message: "This Titan mailbox is already syncing. Please wait a moment and try again." });
      activeTitanSyncConfigIds.add(config.id);
      activeSyncConfigId = config.id;
      await storage.updateImapSyncState(config.id, { status: "syncing", lastError: null });
      const synced = await titanEmailProvider.syncInbox({ email: config.companyEmail, encryptedAppPassword: config.titanAppPasswordEncrypted }, { lastUid: config.imapLastUid, uidValidity: config.imapUidValidity });
      const outbound = await db.select().from(emailMessages).where(and(
        eq(emailMessages.direction, "outbound"),
        sql`lower(${emailMessages.fromEmail}) = ${config.companyEmail.toLowerCase()}`,
      ));
      const candidateThreadIds = Array.from(new Set<number>(
        outbound.reduce<number[]>((ids, message) => {
          if (typeof message.threadId === "number") ids.push(message.threadId);
          return ids;
        }, []),
      ));
      const threads = candidateThreadIds.length
        ? await db.select().from(emailThreads).where(inArray(emailThreads.id, candidateThreadIds))
        : [];
      const threadMessages = candidateThreadIds.length
        ? await db.select().from(emailMessages).where(inArray(emailMessages.threadId, candidateThreadIds))
        : [];
      const messageToThread = new Map<string, number>();
      for (const message of threadMessages) {
        if (message.threadId === null) continue;
        if (message.messageIdHeader) messageToThread.set(message.messageIdHeader, message.threadId);
        if (message.messageId) messageToThread.set(message.messageId, message.threadId);
      }

      let imported = 0, importedForLead = 0;
      for (const inbound of synced.messages) {
        if (!inbound.from.email || inbound.from.email.toLowerCase() === config.companyEmail.toLowerCase()) continue;
        const mailboxMessageId = titanInboundProviderId(config.id, inbound.messageId);
        if (await storage.getEmailMessageByExternalId(mailboxMessageId)) continue;
        const referenceIds = `${inbound.inReplyTo} ${inbound.references}`.match(/<[^>]+>/g) || [];
        const referencedThreadId = referenceIds.map(id => messageToThread.get(id)).find(Boolean);
        let thread = referencedThreadId ? threads.find(candidate => candidate.id === referencedThreadId) : undefined;
        if (!thread) {
          const participants = new Set([inbound.from.email.toLowerCase(), ...inbound.to.map(item => item.toLowerCase()), ...inbound.cc.map(item => item.toLowerCase())]);
          thread = threads.find(candidate => normalizeReplySubject(candidate.subject || "") === normalizeReplySubject(inbound.subject) && (candidate.participantEmails || []).some(item => participants.has(item.toLowerCase())));
        }
        if (!thread) {
          const campaignMatches = await db
            .select({
              companyId: emailCampaignRecipients.companyId,
              recipientEmail: emailCampaignRecipients.email,
              contactName: emailCampaignRecipients.contactName,
              companyName: emailCampaignRecipients.companyName,
              recipientSentAt: emailCampaignRecipients.sentAt,
              campaignSubject: emailCampaigns.subject,
              replyToEmail: emailCampaigns.replyToEmail,
              createdBy: emailCampaigns.createdBy,
            })
            .from(emailCampaignRecipients)
            .innerJoin(emailCampaigns, eq(emailCampaignRecipients.campaignId, emailCampaigns.id))
            .where(and(
              sql`lower(${emailCampaignRecipients.email}) = ${inbound.from.email.toLowerCase()}`,
              inArray(emailCampaignRecipients.status, ["sent", "delivered", "opened", "clicked"]),
            ))
            .orderBy(desc(emailCampaignRecipients.sentAt))
            .limit(20);
          const isManager = ["admin", "super_admin", "sales_manager"].includes(user?.role || "");
          const exactCampaignMatches = campaignMatches.filter(match => {
            const replyMailbox = (match.replyToEmail || "sales@bright-organic.com").toLowerCase();
            const renderedSubject = renderCampaignRecipientSubject(match.campaignSubject, {
              contactName: match.contactName,
              companyName: match.companyName,
              email: match.recipientEmail,
            });
            return replyMailbox === config.companyEmail.toLowerCase() &&
              normalizeReplySubject(renderedSubject) === normalizeReplySubject(inbound.subject) &&
              (isManager || match.createdBy === userId);
          });
          const companyId = uniquelyMatchedCampaignCompanyId(exactCampaignMatches);
          if (companyId !== undefined) {
            const companyThreads = await storage.getEmailThreads({ companyId });
            const possibleLeads = (await storage.getLeads({ companyId, limit: 100 })).leads
              .filter(candidate => isManager || candidate.assignedSalesRep === userId);
            const matchedLead = uniquelyMatchingLeadBySender(possibleLeads, inbound.from.email);
            thread = companyThreads.find(candidate =>
              candidate.leadId === (matchedLead?.id || null) &&
              normalizeReplySubject(candidate.subject || "") === normalizeReplySubject(inbound.subject) &&
              (candidate.participantEmails || []).some(email => email.toLowerCase() === inbound.from.email.toLowerCase()),
            );
            if (!thread) {
              thread = await storage.createEmailThread({ companyId, leadId: matchedLead?.id, subject: inbound.subject, participantEmails: [config.companyEmail, inbound.from.email], status: "active", lastMessageAt: inbound.receivedAt, messageCount: 0, isRead: inbound.flags.includes("\\Seen") });
              threads.push(thread);
            }
          }
        }
        if (!thread) continue; // Leave unrelated mailbox traffic outside the CRM.
        try {
          await storage.createEmailMessage({ messageId: mailboxMessageId, messageIdHeader: /^<[^>]+>$/.test(inbound.messageId) ? inbound.messageId.slice(0, 500) : undefined, referencesHeader: inbound.references || undefined, threadId: thread.id, leadId: thread.leadId || undefined, direction: "inbound", fromEmail: inbound.from.email, fromName: inbound.from.name || undefined, toEmails: inbound.to, ccEmails: inbound.cc, bccEmails: inbound.bcc, subject: inbound.subject, bodyHtml: inbound.bodyHtml, bodyText: inbound.bodyText, attachments: inbound.attachments.map(item => ({ filename: item.filename, mimeType: item.mimeType, size: item.size })), receivedAt: inbound.receivedAt, status: "received", isRead: inbound.flags.includes("\\Seen") });
        } catch (error: any) {
          if (error?.code === "23505") continue;
          throw error;
        }
        await storage.updateEmailThread(thread.id, { lastMessageAt: inbound.receivedAt, isRead: inbound.flags.includes("\\Seen"), participantEmails: Array.from(new Set<string>([...(thread.participantEmails || []), inbound.from.email, ...inbound.to, ...inbound.cc])) });
        if (thread.leadId) {
          await storage.createLeadActivity({ leadId: thread.leadId, activityType: "email", subject: `Email received: ${inbound.subject}`, description: `Reply from ${inbound.from.name || inbound.from.email}`, createdBy: "system" });
        } else if (thread.companyId) {
          await storage.createCompanyActivity({ companyId: thread.companyId, activityType: "email", subject: `Email received: ${inbound.subject}`, description: `Reply from ${inbound.from.name || inbound.from.email}`, createdBy: userId });
        }
        messageToThread.set(inbound.messageId, thread.id);
        imported++;
        if (thread.leadId === leadId || (!!lead.companyId && thread.companyId === lead.companyId)) importedForLead++;
      }
      await storage.updateImapSyncState(config.id, { status: "idle", lastUid: synced.lastUid, uidValidity: synced.uidValidity, lastSyncedAt: new Date(), lastError: null });
      res.json({ success: true, provider: "titan", message: `Synced ${importedForLead} new replies for this lead`, newMessages: importedForLead, totalNewMessages: imported });
    } catch (error) {
      console.error("Titan IMAP sync error:", error);
      if (config?.id) await storage.updateImapSyncState(config.id, { status: "error", lastError: error instanceof Error ? error.message.slice(0, 1000) : "Titan IMAP sync failed" }).catch(() => undefined);
      res.status(500).json({ message: "Failed to sync email" });
    } finally {
      if (activeSyncConfigId !== undefined) activeTitanSyncConfigIds.delete(activeSyncConfigId);
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
      const user = await storage.getUser(userId);
      if (!["admin", "super_admin", "sales_manager"].includes(user?.role || "") && lead.assignedSalesRep !== userId) {
        return res.status(403).json({ message: "Not authorized to update this lead's email" });
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

      const user = await storage.getUser(userId);
      const canViewAllLeadSamples = [
        'admin',
        'super_admin',
        'sales_manager',
        'quality_manager',
        'quality_executive',
      ].includes(user?.role || '');
      const isAssignedSalesRep = lead.assignedSalesRep === userId;
      if (!canViewAllLeadSamples && !isAssignedSalesRep) {
        return res.status(403).json({ message: 'Not authorized to view sample requests for this lead' });
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

      // Create sample request with lead link and assign to the creating user
      const sampleRequest = await storage.createSampleRequest({
        ...req.body,
        leadId,
        assignedTo: userId,
        createdBy: userId,
        source: 'lead',
      });

      // Log activity
      await storage.createLeadActivity({
        leadId,
        activityType: 'sample_request',
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
      // Extract items array before creating (they go in separate table)
      const items = req.body.items || [];
      
      console.log('[QUOTATION DEBUG] Received body currency:', req.body.currency);
      console.log('[QUOTATION DEBUG] Received body paymentTerms:', req.body.paymentTerms);
      console.log('[QUOTATION DEBUG] Received body leadTime:', req.body.leadTime);
      
      // Convert validUntil from string to Date if present
      const quotationData = {
        ...req.body,
        leadId,
        createdBy: userId,
      };
      
      // Remove items from quotationData before parsing (they go in separate table)
      delete quotationData.items;
      
      if (quotationData.validUntil && typeof quotationData.validUntil === 'string') {
        quotationData.validUntil = new Date(quotationData.validUntil);
      }
      
      console.log('[QUOTATION DEBUG] Final quotationData currency:', quotationData.currency);
      
      const quotation = await storage.createQuotation(quotationData);
      console.log('[QUOTATION DEBUG] Created quotation currency:', quotation.currency);

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
      const leadId = Number(req.params.leadId), quotationId = Number(req.params.quotationId), userId = req.user?.id || req.user?.claims?.sub;
      const { email, to, cc, subject, body, attachPdf, threadId } = req.body || {};
      const [lead, quotation, user, config] = await Promise.all([storage.getLead(leadId), storage.getQuotation(quotationId), storage.getUser(userId), storage.getUserEmailConfig(userId)]);
      if (!lead) return res.status(404).json({ message: "Lead not found" });
      if (!quotation || quotation.leadId !== leadId) return res.status(404).json({ message: "Quotation not found or does not belong to this lead" });
      if (!["admin", "super_admin"].includes(user?.role || "") && lead.assignedSalesRep !== userId) return res.status(403).json({ message: "Not authorized to send quotations for this lead" });
      if (!config?.isConnected || !config.titanAppPasswordEncrypted || config.isActive === false) return res.status(400).json({ message: "Titan is not connected.", requiresEmailConnect: true, provider: "titan" });
      const recipients = to ? (Array.isArray(to) ? to : [to]) : email ? [email] : [];
      if (!recipients.length) return res.status(400).json({ message: "Recipient email is required" });
      const attachments: { base64Data: string; mimeType: string; filename: string }[] = [];
      if (attachPdf !== false) {
        const { generateQuotationPDF } = await import('./pdf-generator');
        const quotationItemsResult = await db
          .select()
          .from(quotationItems)
          .where(eq(quotationItems.quotationId, quotationId));
        const firstItem = quotationItemsResult[0];
        let productName = 'your inquiry';
        if (lead.productsInterested?.length) {
          const productsResult = await db
            .select({ name: products.name })
            .from(products)
            .where(inArray(products.id, lead.productsInterested));
          productName = productsResult.map(product => product.name).join(', ') || productName;
        }
        const companyName = lead.company?.companyName || '';
        const salesRepName = user?.firstName && user?.lastName
          ? `${user.firstName} ${user.lastName}`
          : config.displayName || 'Sales Team';
        const customerData = {
          name: companyName,
          contactPerson: lead.contactPerson?.contactName || '',
          email: lead.contactPerson?.email || lead.company?.primaryEmail || email || recipients[0] || '',
          companyName,
          phone: lead.contactPerson?.phone || lead.company?.primaryPhone || '',
          address: lead.company?.addressStreet || '',
          city: lead.company?.addressCity || '',
          state: lead.company?.addressState || '',
          country: lead.company?.addressCountry || '',
          postalCode: lead.company?.addressZip || '',
          salesPersonName: salesRepName,
        };
        const quantity = firstItem?.quantity || lead.requiredQuantity || '1';
        const unit = firstItem?.unit || lead.unit || 'units';
        const totalAmount = quotation.totalAmount || '0';
        const parsedQuantity = parseFloat(String(quantity));
        const unitPrice = firstItem?.unitPrice ||
          (parsedQuantity > 0 ? (parseFloat(totalAmount) / parsedQuantity).toFixed(2) : '0');
        const pdfItems = quotationItemsResult.length
          ? quotationItemsResult.map(item => ({
              productName,
              quantity: item.quantity || '1',
              unit: item.unit || 'kg',
              unitPrice: item.unitPrice || '0',
              totalPrice: item.totalPrice ||
                String(parseFloat(item.quantity || '0') * parseFloat(item.unitPrice || '0')),
            }))
          : undefined;
        const quotationData = {
          id: quotation.id,
          quotationId: quotation.quotationId,
          quotationDate: (quotation.createdAt || new Date()).toISOString(),
          validUntil: (quotation.validUntil || new Date()).toISOString(),
          productName,
          quantity: String(quantity),
          unit,
          unitPrice: String(unitPrice),
          totalAmount,
          currency: quotation.currency || 'USD',
          terms: quotation.terms || '',
          notes: quotation.notes || '',
          paymentTerms: quotation.paymentTerms || 'As per agreement',
          deliveryTerms: quotation.priceType || 'Ex-Works',
          leadTime: quotation.leadTime || undefined,
          subtotal: quotation.subtotal || undefined,
          discountPercent: quotation.discountPercent || undefined,
          discountAmount: quotation.discountAmount || undefined,
          includeGst: quotation.includeGst ?? undefined,
          gstNumber: quotation.gstNumber || undefined,
          gstPercentage: quotation.gstPercentage || undefined,
          gstAmount: quotation.gstAmount || undefined,
          sellerGstin: quotation.sellerGstin || undefined,
          sellerPan: quotation.sellerPan || undefined,
          buyerGstin: quotation.buyerGstin || undefined,
          buyerPan: quotation.buyerPan || undefined,
          customerCompanyName: quotation.customerCompanyName || undefined,
          customerAddress: quotation.customerAddress || undefined,
          customerCity: quotation.customerCity || undefined,
          customerState: quotation.customerState || undefined,
          customerCountry: quotation.customerCountry || undefined,
          customerPostalCode: quotation.customerPostalCode || undefined,
          placeOfSupply: quotation.placeOfSupply || undefined,
          countryOfSupply: quotation.countryOfSupply || undefined,
          items: pdfItems,
        };
        const pdfBuffer = await generateQuotationPDF(quotationData, customerData);
        attachments.push({
          base64Data: pdfBuffer.toString('base64'),
          mimeType: 'application/pdf',
          filename: `Quotation-${quotation.quotationId}.pdf`,
        });
      }
      const emailSubject = subject || `Quotation ${quotation.quotationId}`;
      let thread = threadId ? await storage.getEmailThread(Number(threadId)) : undefined;
      if (thread && thread.leadId !== leadId && (!lead.companyId || thread.companyId !== lead.companyId)) return res.status(400).json({ message: "Invalid email thread" });
      if (!thread) thread = await storage.createEmailThread({ leadId, companyId: lead.companyId, subject: emailSubject, participantEmails: [config.companyEmail, ...recipients], status: "active", lastMessageAt: new Date(), messageCount: 0, isRead: true });
      const parent = (await storage.getEmailMessages({ threadId: thread.id })).sort((a,b) => Number(b.sentAt || b.receivedAt || 0) - Number(a.sentAt || a.receivedAt || 0)).find(item => item.messageIdHeader);
      const inReplyTo = parent?.messageIdHeader || undefined, references = inReplyTo ? [parent?.referencesHeader, inReplyTo].filter(Boolean).join(" ") : undefined;
      let html = body || `<p>Please find quotation ${quotation.quotationId} attached.</p>`;
      let text = html.replace(/<[^>]*>/g, "");
      ({ html, text } = applyConfiguredEmailSignature(config, html, text));
      const ccRecipients = Array.isArray(cc) ? cc : cc ? [cc] : [];
      const result = await titanEmailProvider.send({ email: config.companyEmail, encryptedAppPassword: config.titanAppPasswordEncrypted }, { to: recipients, cc: ccRecipients, subject: emailSubject, bodyHtml: html, bodyText: text, fromName: config.displayName || undefined, inReplyTo, references, attachments });
      if (!thread.threadId) await storage.updateEmailThread(thread.id, { threadId: result.threadId });
      const message = await storage.createEmailMessage({ messageId: result.messageId, messageIdHeader: result.messageId, referencesHeader: references, threadId: thread.id, leadId, direction: "outbound", fromEmail: config.companyEmail, fromName: config.displayName || undefined, toEmails: recipients, ccEmails: ccRecipients, subject: emailSubject, bodyHtml: html, bodyText: text, attachments: attachments.map(({ filename, mimeType, base64Data }) => ({ filename, mimeType, size: Buffer.from(base64Data, "base64").length })), sentAt: new Date(), status: "sent", senderId: userId, isRead: true });
      await storage.updateEmailThread(thread.id, { lastMessageAt: new Date(), participantEmails: Array.from(new Set<string>([...(thread.participantEmails || []), config.companyEmail, ...recipients])) });
      await storage.updateQuotation(quotationId, { status: "sent", sentAt: new Date(), sentBy: userId });
      await storage.createLeadActivity({ leadId, activityType: "email", subject: `Quotation sent: ${quotation.quotationId}`, description: `Quotation sent to ${recipients.join(", ")}`, createdBy: userId });
      res.status(201).json({
        success: true,
        provider: "titan",
        message: "Quotation sent successfully",
        emailMessage: message,
        messageId: result.messageId,
        sentFolderSaved: result.sentFolderSaved,
        warning: result.warning,
      });
    } catch (error) { console.error("Titan quotation send error:", error); res.status(500).json({ message: "Failed to send quotation" }); }
  });

  // Admin-only preview. The public sitemap is owned by server/index.ts so
  // there can be no competing /sitemap.xml response.
  app.get('/api/admin/seo/sitemap-preview.xml', isAuthenticated, isSeoManager, async (req, res) => {
    try {
      const [productResult, categoryRows, healthSupportRows, blogResult] = await Promise.all([
        storage.getProducts({ limit: 5000, offset: 0 }),
        storage.getCategories(),
        storage.getHealthSupports(),
        storage.getBlogPosts({ published: true, limit: 5000, offset: 0 }),
      ]);
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'private, no-store');
      res.send(renderSitemapXml(buildSitemapEntries({
        products: productResult.products,
        categories: categoryRows,
        healthSupports: healthSupportRows,
        blogPosts: blogResult.posts,
      })));
    } catch (error) {
      console.error("Error generating sitemap preview:", error);
      res.status(500).json({ message: "Failed to generate sitemap preview" });
    }
  });

  // Static routes removed from here - they're now handled as fallback in server/index.ts

  // ========================================
  // DUPLICATE DETECTION API ROUTES
  // ========================================

  // Check for potential duplicate companies (for registration form)
  app.post('/api/check-duplicate-company', async (req, res) => {
    try {
      const { companyName, email, phone, excludeCompanyId } = req.body;
      
      if (!companyName) {
        return res.status(400).json({ message: 'Company name is required' });
      }
      
      const { checkForDuplicates } = await import('./duplicateDetection');
      const result = await checkForDuplicates(companyName, email, phone, excludeCompanyId);
      
      res.json(result);
    } catch (error) {
      console.error('Error checking for duplicates:', error);
      res.status(500).json({ message: 'Failed to check for duplicates' });
    }
  });

  app.get('/api/admin/companies/duplicates', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (!user.role?.includes('admin') && !user.role?.includes('sales_manager'))) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }
      
      const allCompanies = await db.select({
        id: companies.id,
        companyName: companies.companyName,
        primaryEmail: companies.primaryEmail,
        primaryPhone: companies.primaryPhone,
        website: companies.website,
        addressCity: companies.addressCity,
        addressState: companies.addressState,
        addressCountry: companies.addressCountry,
        origin: companies.origin,
        status: companies.status,
        assignedTo: companies.assignedTo,
        createdAt: companies.createdAt,
        duplicateStatus: companies.duplicateStatus,
        normalizedName: companies.normalizedName,
      }).from(companies).where(ne(companies.duplicateStatus, 'merged'));

      const assignedUserIds = new Set<string>();
      for (const c of allCompanies) {
        if (c.assignedTo) assignedUserIds.add(c.assignedTo);
      }
      const userMap = new Map<string, string>();
      if (assignedUserIds.size > 0) {
        const usersList = await db.select({ id: users.id, firstName: users.firstName, lastName: users.lastName })
          .from(users).where(inArray(users.id, Array.from(assignedUserIds)));
        for (const u of usersList) {
          userMap.set(u.id, [u.firstName, u.lastName].filter(Boolean).join(' ') || 'Unknown');
        }
      }

      const { normalizeCompanyName, calculateNameSimilarity } = await import('./duplicateDetection');

      function pickBestToKeep(group: any[]): any {
        const assigned = group.filter((c: any) => c.assignedTo);
        const unassigned = group.filter((c: any) => !c.assignedTo);
        if (assigned.length > 0) {
          return assigned.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];
        }
        return unassigned.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];
      }

      const nameGroups: Map<string, any[]> = new Map();
      for (const c of allCompanies) {
        const norm = c.normalizedName || normalizeCompanyName(c.companyName);
        if (!nameGroups.has(norm)) nameGroups.set(norm, []);
        nameGroups.get(norm)!.push({ ...c, normalizedKey: norm });
      }

      const exactDuplicateIds = new Set<number>();
      const exactGroups: any[] = [];

      for (const [normName, group] of nameGroups) {
        if (group.length > 1) {
          for (const c of group) exactDuplicateIds.add(c.id);
          const best = pickBestToKeep(group);
          const sorted = group.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          exactGroups.push({
            groupName: best.companyName,
            matchType: 'exact_name',
            confidence: 100,
            keepId: best.id,
            companies: sorted.map((c: any) => ({
              ...c,
              assignedToName: c.assignedTo ? userMap.get(c.assignedTo) || null : null,
              isOldest: c.id === sorted[0].id,
              suggestion: c.id === best.id ? 'keep' : 'delete',
            })),
          });
        }
      }

      const nonDuplicateCompanies = allCompanies.filter(c => !exactDuplicateIds.has(c.id));
      const duplicateGroups: any[] = [];

      const tokenIndex = new Map<string, any[]>();
      for (const c of nonDuplicateCompanies) {
        const norm = normalizeCompanyName(c.companyName);
        const tokens = norm.split(' ').filter((t: string) => t.length >= 3);
        for (const token of tokens) {
          if (!tokenIndex.has(token)) tokenIndex.set(token, []);
          tokenIndex.get(token)!.push(c);
        }
      }
      const fuzzyChecked = new Set<number>();
      for (const c1 of nonDuplicateCompanies) {
        if (fuzzyChecked.has(c1.id)) continue;
        const norm1 = normalizeCompanyName(c1.companyName);
        const tokens1 = norm1.split(' ').filter((t: string) => t.length >= 3);
        const candidateIds = new Set<number>();
        for (const token of tokens1) {
          const bucket = tokenIndex.get(token) || [];
          for (const cand of bucket) {
            if (cand.id !== c1.id && !fuzzyChecked.has(cand.id)) candidateIds.add(cand.id);
          }
        }
        const candidateMap = new Map(nonDuplicateCompanies.filter(c => candidateIds.has(c.id)).map(c => [c.id, c]));
        const similarGroup = [c1];
        for (const [cid, c2] of candidateMap) {
          const similarity = calculateNameSimilarity(c1.companyName, c2.companyName);
          if (similarity >= 70) {
            similarGroup.push(c2);
          }
        }
        if (similarGroup.length > 1) {
          for (const c of similarGroup) fuzzyChecked.add(c.id);
          const best = pickBestToKeep(similarGroup);
          const sorted = similarGroup.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          duplicateGroups.push({
            groupName: best.companyName,
            matchType: 'fuzzy_name',
            confidence: calculateNameSimilarity(sorted[0].companyName, sorted[1].companyName),
            companies: sorted.map((c: any) => ({
              ...c,
              assignedToName: c.assignedTo ? userMap.get(c.assignedTo) || null : null,
              isOldest: c.id === sorted[0].id,
              suggestion: c.id === best.id ? 'keep' : 'review',
            })),
          });
        }
      }

      duplicateGroups.sort((a, b) => b.companies.length - a.companies.length || b.confidence - a.confidence);
      
      res.json({ exactGroups, fuzzyGroups: duplicateGroups });
    } catch (error) {
      console.error('Error fetching duplicate companies:', error);
      res.status(500).json({ message: 'Failed to fetch duplicate companies' });
    }
  });

  app.post('/api/admin/companies/auto-clean-duplicates', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (!user.role?.includes('admin') && !user.role?.includes('sales_manager'))) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }

      const { normalizeCompanyName } = await import('./duplicateDetection');

      const allCompanies = await db.select({
        id: companies.id,
        companyName: companies.companyName,
        assignedTo: companies.assignedTo,
        createdAt: companies.createdAt,
        duplicateStatus: companies.duplicateStatus,
        normalizedName: companies.normalizedName,
      }).from(companies).where(ne(companies.duplicateStatus, 'merged'));

      const nameGroups: Map<string, any[]> = new Map();
      for (const c of allCompanies) {
        const norm = c.normalizedName || normalizeCompanyName(c.companyName);
        if (!nameGroups.has(norm)) nameGroups.set(norm, []);
        nameGroups.get(norm)!.push(c);
      }

      function pickBestToKeep(group: any[]): any {
        const assigned = group.filter((c: any) => c.assignedTo);
        const unassigned = group.filter((c: any) => !c.assignedTo);
        if (assigned.length > 0) {
          return assigned.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];
        }
        return unassigned.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];
      }

      const deleteIds: number[] = [];
      const keptIds: number[] = [];

      for (const [normName, group] of nameGroups) {
        if (group.length > 1) {
          const best = pickBestToKeep(group);
          keptIds.push(best.id);
          for (const c of group) {
            if (c.id !== best.id) deleteIds.push(c.id);
          }
        }
      }

      let totalDeleted = 0;
      const failedIds: number[] = [];
      const batchSize = 100;
      for (let i = 0; i < deleteIds.length; i += batchSize) {
        const batch = deleteIds.slice(i, i + batchSize);
        try {
          const result = await storage.bulkDeleteCompanies(batch);
          totalDeleted += result.deleted;
        } catch (e) {
          console.error('Error auto-deleting exact duplicates batch:', e);
          failedIds.push(...batch);
        }
      }

      res.json({ deleted: totalDeleted, failed: failedIds.length, kept: keptIds.length });
    } catch (error) {
      console.error('Error auto-cleaning duplicates:', error);
      res.status(500).json({ message: 'Failed to auto-clean duplicates' });
    }
  });

  // Mark company as duplicate of another
  app.post('/api/admin/companies/:id/mark-duplicate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (!user.role?.includes('admin') && !user.role?.includes('sales_manager'))) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }
      
      const companyId = parseInt(req.params.id);
      const { masterCompanyId, confidence } = req.body;
      
      if (!masterCompanyId) {
        return res.status(400).json({ message: 'Master company ID is required' });
      }
      
      const { markAsDuplicate } = await import('./duplicateDetection');
      await markAsDuplicate(companyId, masterCompanyId, confidence || 100, userId);
      
      res.json({ success: true, message: 'Company marked as duplicate' });
    } catch (error) {
      console.error('Error marking company as duplicate:', error);
      res.status(500).json({ message: 'Failed to mark company as duplicate' });
    }
  });

  // Mark company as unique (not a duplicate)
  app.post('/api/admin/companies/:id/mark-unique', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (!user.role?.includes('admin') && !user.role?.includes('sales_manager'))) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }
      
      const companyId = parseInt(req.params.id);
      
      const { markAsUnique } = await import('./duplicateDetection');
      await markAsUnique(companyId, userId);
      
      res.json({ success: true, message: 'Company marked as unique' });
    } catch (error) {
      console.error('Error marking company as unique:', error);
      res.status(500).json({ message: 'Failed to mark company as unique' });
    }
  });

  // Merge two companies (master absorbs duplicate)
  app.post('/api/admin/companies/merge', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (!user.role?.includes('admin') && !user.role?.includes('super_admin'))) {
        return res.status(403).json({ message: 'Only admins can merge companies' });
      }
      
      const { masterCompanyId, duplicateCompanyId } = req.body;
      
      if (!masterCompanyId || !duplicateCompanyId) {
        return res.status(400).json({ message: 'Both master and duplicate company IDs are required' });
      }
      
      if (masterCompanyId === duplicateCompanyId) {
        return res.status(400).json({ message: 'Cannot merge a company with itself' });
      }
      
      // Get both companies
      const masterCompany = await storage.getCompany(masterCompanyId);
      const duplicateCompany = await storage.getCompany(duplicateCompanyId);
      
      if (!masterCompany || !duplicateCompany) {
        return res.status(404).json({ message: 'One or both companies not found' });
      }
      
      // Move contacts from duplicate to master
      const duplicateContacts = await storage.getCompanyContacts(duplicateCompanyId);
      for (const contact of duplicateContacts) {
        await db.update(companyContacts)
          .set({ companyId: masterCompanyId, isPrimary: false })
          .where(eq(companyContacts.id, contact.id));
      }
      
      // Move leads from duplicate to master
      await db.update(leads)
        .set({ companyId: masterCompanyId, updatedAt: new Date() })
        .where(eq(leads.companyId, duplicateCompanyId));
      
      // Move activities from duplicate to master
      await db.update(companyActivities)
        .set({ companyId: masterCompanyId })
        .where(eq(companyActivities.companyId, duplicateCompanyId));
      
      // Move tasks from duplicate to master
      await db.update(companyTasks)
        .set({ companyId: masterCompanyId })
        .where(eq(companyTasks.companyId, duplicateCompanyId));
      
      // Move notes from duplicate to master
      await db.update(companyNotes)
        .set({ companyId: masterCompanyId })
        .where(eq(companyNotes.companyId, duplicateCompanyId));
      
      // Update linked user if exists
      if (duplicateCompany.linkedUserId && !masterCompany.linkedUserId) {
        await storage.updateCompany(masterCompanyId, {
          linkedUserId: duplicateCompany.linkedUserId
        });
      }
      
      // Mark duplicate company as merged
      await storage.updateCompany(duplicateCompanyId, {
        status: 'inactive',
        duplicateStatus: 'merged',
        duplicateOf: masterCompanyId,
        duplicateReviewedAt: new Date(),
        duplicateReviewedBy: userId,
        notes: `${duplicateCompany.notes || ''}\n\n[MERGED] This company was merged into ${masterCompany.companyName} (ID: ${masterCompanyId}) on ${new Date().toISOString()} by user ${userId}`.trim()
      });
      
      // Log activity on master company
      await storage.createCompanyActivity({
        companyId: masterCompanyId,
        activityType: 'note',
        subject: 'Company Merged',
        description: `Company "${duplicateCompany.companyName}" (ID: ${duplicateCompanyId}) was merged into this company. ${duplicateContacts.length} contacts were transferred.`,
        createdBy: userId,
      });
      
      res.json({ 
        success: true, 
        message: `Successfully merged "${duplicateCompany.companyName}" into "${masterCompany.companyName}"`,
        mergedContacts: duplicateContacts.length
      });
    } catch (error) {
      console.error('Error merging companies:', error);
      res.status(500).json({ message: 'Failed to merge companies' });
    }
  });

  // Backfill normalized fields for existing companies
  app.post('/api/admin/companies/backfill-normalized', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'super_admin') {
        return res.status(403).json({ message: 'Only super admins can run backfill' });
      }
      
      const { backfillNormalizedFields } = await import('./duplicateDetection');
      const result = await backfillNormalizedFields();
      
      res.json({ 
        success: true, 
        message: `Backfill completed: ${result.updated} companies updated, ${result.errors} errors`,
        ...result
      });
    } catch (error) {
      console.error('Error backfilling normalized fields:', error);
      res.status(500).json({ message: 'Failed to backfill normalized fields' });
    }
  });

  // ============================================
  // BULK EMAIL CAMPAIGNS (Mailchimp delivery)
  // ============================================

  // Mailchimp provider readiness (admin only)
  app.get('/api/email-campaigns/test-key', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'super_admin' && user.role !== 'admin')) {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
       const { readiness } = await import("./mailchimpService");
       res.json(await readiness());
    } catch (error: any) {
       console.error('Error checking Mailchimp readiness:', error?.message);
       res.status(error?.status || 503).type("application/problem+json").json(error?.problem?.() || { type: "https://bright-organic.com/problems/mailchimp-not-ready", title: "Mailchimp not ready", status: 503, detail: "Mailchimp is unavailable." });
    }
  });

  // Get companies available for bulk email (role-based) - must be before :id route
  app.get('/api/email-campaigns/companies', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const { getCompaniesForBulkEmail, isEligibleBulkEmailSender } = await import('./bulkEmailCampaignService');
      if (!isEligibleBulkEmailSender(user)) {
        return res.status(403).json({ message: "An active sales or admin account is required" });
      }
      const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';
      
      const companies = await getCompaniesForBulkEmail(userId, isAdmin);
      res.json(companies);
    } catch (error) {
      console.error('Error fetching companies for bulk email:', error);
      res.status(500).json({ message: 'Failed to fetch companies' });
    }
  });

  // A salesperson can inspect their own Mailchimp readiness without seeing
  // another user's audience. Administrators configure assignments separately.
  app.get("/api/email-campaigns/readiness", isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);
    const {
      BULK_EMAIL_FROM_EMAIL,
      BULK_EMAIL_FROM_NAME,
      BULK_EMAIL_REPLY_TO_EMAIL,
      getUserConfig,
      isBulkEmailAdmin,
      isEligibleBulkEmailSender,
    } = await import("./bulkEmailCampaignService");
    if (!isEligibleBulkEmailSender(user)) {
      return res.json({
        ready: false,
        provider: "mailchimp",
        configured: false,
        writeAccess: false,
        audienceId: null,
        audienceName: null,
        fromEmail: null,
        fromName: null,
        replyToEmail: null,
        message: "An active sales or admin account is required.",
        isAdmin: false,
      });
    }
    try {
      const config = await getUserConfig(userId);
      const { hasMailchimpWriteConfiguration } = await import("./mailchimpService");
      const writeAccess = hasMailchimpWriteConfiguration();
      res.json({
        ready: writeAccess, provider: "mailchimp", configured: writeAccess, writeAccess,
        audienceId: config?.audienceId || null, audienceName: null,
        fromEmail: BULK_EMAIL_FROM_EMAIL, fromName: BULK_EMAIL_FROM_NAME,
        replyToEmail: BULK_EMAIL_REPLY_TO_EMAIL,
        message: !writeAccess
          ? "Mailchimp sending is unavailable."
          : config
            ? "Mailchimp is ready. The provider will be verified when you send."
            : "Mailchimp will select and verify the account audience when you send.",
        isAdmin: isBulkEmailAdmin(user?.role),
      });
    } catch (error: any) {
      res.json({
        ready: false, provider: "mailchimp", configured: false, writeAccess: false,
        audienceId: null, audienceName: null, fromEmail: BULK_EMAIL_FROM_EMAIL,
        fromName: BULK_EMAIL_FROM_NAME, replyToEmail: BULK_EMAIL_REPLY_TO_EMAIL,
        message: error.message, isAdmin: isBulkEmailAdmin(user?.role),
      });
    }
  });

  app.get("/api/email-campaigns/configurations", isAuthenticated, async (req: any, res) => {
    const user = await storage.getUser(req.user.claims.sub);
    if (user?.role !== "admin" && user?.role !== "super_admin") return res.status(403).json({ message: "Admin access required" });
    const { bulkEmailUserConfigs } = await import("@shared/schema");
    const configs = await db.select().from(bulkEmailUserConfigs);
    const mailboxConfigs = await db.select({ userId: userEmailConfigs.userId, companyEmail: userEmailConfigs.companyEmail, isPrimary: userEmailConfigs.isPrimary, createdAt: userEmailConfigs.createdAt })
      .from(userEmailConfigs).orderBy(desc(userEmailConfigs.isPrimary), desc(userEmailConfigs.createdAt));
    const { getSharedMailchimpConfiguration, resolveBulkEmailReplyTo } = await import("./bulkEmailCampaignService");
    const shared = await getSharedMailchimpConfiguration();
    let audienceNames = new Map<string, string>();
    try {
      const { audiences } = await import("./mailchimpService");
      audienceNames = new Map((await audiences()).map((audience: any) => [audience.id, audience.name]));
    } catch {
      // Existing assignments remain editable even while Mailchimp is unavailable.
    }
    const salesUsers = await db.select({ id: users.id, email: users.email, firstName: users.firstName, lastName: users.lastName, role: users.role })
      .from(users).where(and(eq(users.accountStatus, "active"), inArray(users.role, ["sales_manager", "sales_executive", "admin", "super_admin"])));
    res.json({ users: salesUsers.map(u => {
      const c = configs.find(x => x.userId === u.id);
       const mailbox = mailboxConfigs.find(x => x.userId === u.id && x.isPrimary === true);
       const replyToEmail = resolveBulkEmailReplyTo(mailbox, u.email);
      return {
        user: u,
        replyToEmail,
        replyToReady: !!replyToEmail,
        configuration: c ? {
          audienceId: c.audienceId,
          audienceName: audienceNames.get(c.audienceId) || null,
          fromEmail: c.fromEmail,
          fromName: c.fromName,
          isEnabled: c.enabled,
          lastValidatedAt: c.lastCheckedAt,
          validationStatus: c.readyAt ? "ready" : "not_ready",
          validationMessage: c.readinessError,
        } : null,
      };
    }), sharedConfiguration: shared.configuration, conflicts: shared.conflicts });
  });

  app.get("/api/email-campaigns/mailchimp/audiences", isAuthenticated, async (req: any, res) => {
    const user = await storage.getUser(req.user.claims.sub);
    if (user?.role !== "admin" && user?.role !== "super_admin") return res.status(403).json({ message: "Admin access required" });
    try { const { audiences, readiness } = await import("./mailchimpService"); const list = await audiences(); res.json({ account: await readiness(), audiences: list.map((a: any) => ({ id: a.id, name: a.name, memberCount: a.stats?.member_count || 0 })) }); }
    catch (error: any) { res.status(error.status || 503).type("application/problem+json").json(error.problem?.() || { title: "Mailchimp unavailable", status: 503 }); }
  });

  app.put("/api/email-campaigns/configurations/shared", isAuthenticated, async (req: any, res) => {
    const admin = await storage.getUser(req.user.claims.sub);
    if (admin?.role !== "admin" && admin?.role !== "super_admin") return res.status(403).json({ message: "Admin access required" });
    return res.status(410).json({ message: "Mailchimp sender and access configuration is automatic and can no longer be changed here." });
  });

  app.put("/api/email-campaigns/configurations/:userId/access", isAuthenticated, async (req: any, res) => {
    const admin = await storage.getUser(req.user.claims.sub);
    if (admin?.role !== "admin" && admin?.role !== "super_admin") return res.status(403).json({ message: "Admin access required" });
    return res.status(410).json({ message: "Bulk email access is automatic for active sales and admin users and can no longer be changed here." });
  });

  app.post("/api/email-campaigns/configurations/enable-all", isAuthenticated, async (req: any, res) => {
    const admin = await storage.getUser(req.user.claims.sub);
    if (admin?.role !== "admin" && admin?.role !== "super_admin") return res.status(403).json({ message: "Admin access required" });
    return res.status(410).json({ message: "Bulk email access is already automatic for active sales and admin users." });
  });

  // Get all email campaigns (admin sees all, sales sees own)
  app.get('/api/email-campaigns', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const { isEligibleBulkEmailSender } = await import("./bulkEmailCampaignService");
      if (!isEligibleBulkEmailSender(user)) {
        return res.status(403).json({ message: "An active sales or admin account is required" });
      }
      const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';
      
       const { getCampaigns } = await import('./bulkEmailCampaignService');
      const campaigns = await getCampaigns(userId, isAdmin);
      res.json(campaigns);
    } catch (error) {
      console.error('Error fetching email campaigns:', error);
      res.status(500).json({ message: 'Failed to fetch email campaigns' });
    }
  });

  app.post('/api/email-campaigns/:id/refresh', isAuthenticated, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return res.status(400).json({ message: "Invalid campaign ID" });
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const isAdmin = user?.role === "admin" || user?.role === "super_admin";
      const { getCampaignForUser, getCampaignStats, reconcileMailchimpCampaign } = await import("./bulkEmailCampaignService");
      const campaign = await getCampaignForUser(id, userId, isAdmin);
      if (!campaign) return res.status(404).json({ message: "Campaign not found" });
      if (campaign.provider !== "mailchimp" || !campaign.providerCampaignId) {
        return res.status(400).json({ message: "Historical SendGrid campaigns do not have Mailchimp reports." });
      }
      const updated = await reconcileMailchimpCampaign(id);
      res.json({ ...updated, stats: await getCampaignStats(id) });
    } catch (error: any) {
      res.status(error?.status || 502).type("application/problem+json").json(
        error?.problem?.() || {
          type: "https://bright-organic.com/problems/mailchimp-report-failed",
          title: "Mailchimp report refresh failed",
          status: error?.status || 502,
          detail: error?.message || "Mailchimp report refresh failed.",
        },
      );
    }
  });

  // Get campaign by ID with stats
  app.get('/api/email-campaigns/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
       const { getCampaignForUser, getCampaignStats } = await import('./bulkEmailCampaignService');
       const user = await storage.getUser(req.user.claims.sub);
       const isAdmin = user?.role === "admin" || user?.role === "super_admin";
      
       const campaign = await getCampaignForUser(parseInt(id), req.user.claims.sub, isAdmin);
      if (!campaign) {
        return res.status(404).json({ message: 'Campaign not found' });
      }
      
      const stats = await getCampaignStats(parseInt(id));
      res.json({ ...campaign, stats });
    } catch (error) {
      console.error('Error fetching campaign:', error);
      res.status(500).json({ message: 'Failed to fetch campaign' });
    }
  });

  // Get campaign recipients
  app.get('/api/email-campaigns/:id/recipients', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
       const { getCampaignRecipientsForUser } = await import('./bulkEmailCampaignService');
       const user = await storage.getUser(req.user.claims.sub);
       const recipients = await getCampaignRecipientsForUser(parseInt(id), req.user.claims.sub, user?.role === "admin" || user?.role === "super_admin");
       if (!recipients) return res.status(404).json({ message: "Campaign not found" });
      res.json(recipients);
    } catch (error) {
      console.error('Error fetching campaign recipients:', error);
      res.status(500).json({ message: 'Failed to fetch campaign recipients' });
    }
  });

  // Create and send bulk email campaign
  app.post('/api/email-campaigns', isAuthenticated, async (req: any, res) => {
    let requestLock: import("./bulkEmailRequestLock").BulkEmailRequestLock | null = null;
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const { isEligibleBulkEmailSender } = await import("./bulkEmailCampaignService");
      if (!isEligibleBulkEmailSender(user)) {
        return res.status(403).json({ message: "An active sales or admin account is required" });
      }
      
      const { bulkEmailCampaignRequestSchema } = await import("@shared/bulkEmailCampaign");
      const validationResult = bulkEmailCampaignRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: 'Validation failed', 
          errors: validationResult.error.errors 
        });
      }
      
      const { name, subject, htmlContent, textContent, companyIds, templateId, scheduledAt, attachments, idempotencyKey } = validationResult.data;
       const { acquireBulkEmailRequestLock } = await import("./bulkEmailRequestLock");
       requestLock = await acquireBulkEmailRequestLock(userId, idempotencyKey);
       if (!requestLock) {
         return res.status(409).json({
           message: "This campaign request is already being processed. Do not submit it again.",
           idempotent: true,
         });
       }
       const { createCampaign, getCampaignByIdempotencyKey, getEligibleRecipients, getUserConfig, parseCampaignSchedule } = await import("./bulkEmailCampaignService");
       let scheduledDate: Date | undefined;
       try {
         scheduledDate = parseCampaignSchedule(scheduledAt);
       } catch (error: any) {
         return res.status(error?.status || 400).json({ message: error.message });
       }
      const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';
       const existingCampaign = await getCampaignByIdempotencyKey(idempotencyKey, userId);
       if (existingCampaign) {
         if (existingCampaign.status === "draft" || existingCampaign.status === "sending") {
           const lastUpdate = existingCampaign.updatedAt || existingCampaign.createdAt;
           const stale = !!lastUpdate &&
             Date.now() - new Date(lastUpdate).getTime() > 10 * 60 * 1000;
           if (stale) {
             try {
               const { recoverStaleCampaignAttempt } = await import("./mailchimpService");
               const recovery = await recoverStaleCampaignAttempt({
                 campaignKey: idempotencyKey,
                 audienceId: existingCampaign.providerAudienceId!,
                 campaignId: existingCampaign.providerCampaignId,
                 segmentId: existingCampaign.providerSegmentId,
               });
               await requestLock.assertHeld();
               if (recovery.outcome === "delivery_possible") {
                 await db.update(emailCampaigns).set({
                   status: "delivery_uncertain",
                   providerCampaignId: recovery.campaignId,
                   providerSegmentId: recovery.segmentId,
                   providerError: `Recovered stale Mailchimp status: ${recovery.providerStatus || "unknown"}.`,
                   updatedAt: new Date(),
                 }).where(eq(emailCampaigns.id, existingCampaign.id));
                 return res.status(409).json({
                   message: "Mailchimp may already have accepted this campaign. Refresh its report before taking any further action.",
                   campaignId: existingCampaign.id,
                   idempotent: true,
                   deliveryUncertain: true,
                 });
               }

               const stored = Array.isArray(existingCampaign.attachments)
                 ? existingCampaign.attachments as any[]
                 : [];
               let cleanupFailed = false;
               if (stored.length) {
                 const { removeBulkAttachments } = await import("./bulkEmailAttachments");
                 await removeBulkAttachments(stored).catch(() => {
                   cleanupFailed = true;
                 });
               }
               await db.update(emailCampaigns).set({
                 status: "failed",
                 attachments: cleanupFailed ? stored : [],
                 providerCampaignId: null,
                 providerSegmentId: null,
                 providerError: "A stale campaign attempt was recovered before delivery.",
                 failedCount: existingCampaign.totalRecipients || 0,
                 updatedAt: new Date(),
               }).where(eq(emailCampaigns.id, existingCampaign.id));
               return res.status(409).json({
                 message: "The previous campaign attempt stopped before delivery. Submit again to start a new attempt.",
                 campaignId: existingCampaign.id,
                 idempotent: true,
               });
             } catch (error: any) {
               return res.status(error?.status || 503).type("application/problem+json").json(
                 error?.problem?.() || {
                   type: "https://bright-organic.com/problems/mailchimp-recovery-unavailable",
                   title: "Campaign recovery is unavailable",
                   status: error?.status || 503,
                   detail: "The earlier campaign attempt remains blocked to prevent a duplicate send. Try again after Mailchimp is available.",
                 },
               );
             }
           }
           return res.status(409).json({
             message: "This campaign request is still being processed. Do not submit it again.",
             campaignId: existingCampaign.id,
             idempotent: true,
           });
         }
         if (existingCampaign.status === "delivery_uncertain") {
           return res.status(409).json({
             message: "Mailchimp may already have accepted this campaign. Refresh its report before taking any further action.",
             campaignId: existingCampaign.id,
             idempotent: true,
             deliveryUncertain: true,
           });
         }
         if (existingCampaign.status === "failed") {
           return res.status(409).json({
             message: "This campaign request previously failed. Submit again to start a new attempt.",
             campaignId: existingCampaign.id,
             idempotent: true,
           });
         }
         return res.json({
           success: true,
           campaignId: existingCampaign.id,
            status: existingCampaign.status,
           sent: existingCampaign.sentCount || 0,
           failed: existingCampaign.failedCount || 0,
           excluded: existingCampaign.excludedCount || 0,
           message: "This campaign request was already processed.",
           idempotent: true,
         });
       }
       const {
         BULK_EMAIL_REPLY_TO_EMAIL,
         getSharedMailchimpConfiguration,
         resolveAutomaticMailchimpConfiguration,
       } = await import("./bulkEmailCampaignService");
       const { audiences, readiness: mailchimpReadiness } = await import("./mailchimpService");
       const provider = await mailchimpReadiness();
       if (!provider.writeAccess) {
         return res.status(503).type("application/problem+json").json({
           type: "https://bright-organic.com/problems/mailchimp-unavailable",
           title: "Mailchimp is unavailable", status: 503, detail: provider.message,
         });
       }
       const config = resolveAutomaticMailchimpConfiguration(
         await getSharedMailchimpConfiguration(),
         await audiences(),
       );
       const replyToEmail = BULK_EMAIL_REPLY_TO_EMAIL;
       const candidateRecipients = await getEligibleRecipients(companyIds, userId, isAdmin);
       if (!candidateRecipients.length) return res.status(400).json({ message: "Selected companies have no email recipients" });
       const validRecipients = candidateRecipients.filter((recipient) => z.string().email().safeParse(recipient.email).success);
       const invalidRecipients = candidateRecipients.filter((recipient) => !z.string().email().safeParse(recipient.email).success);
       if (!validRecipients.length) return res.status(400).json({ message: "Selected companies have no valid email recipients" });

       const { validateBulkAttachments } = await import("./bulkEmailAttachments");
       const validatedAttachments = validateBulkAttachments(attachments || []);
       const permissionConfirmedAt = new Date();
       const permissionBasis = "staff_attested_business_email_eligibility";

      // Create campaign
       let campaignId: number;
       try {
         campaignId = await createCampaign({
         name,
         subject,
         htmlContent,
         textContent: textContent || null,
         createdBy: userId,
         fromName: config.fromName,
          replyToEmail,
         templateId,
         scheduledAt: scheduledDate,
         providerAudienceId: config.audienceId,
         idempotencyKey,
         recipientPermissionBasis: permissionBasis,
         recipientPermissionConfirmedAt: permissionConfirmedAt,
         recipientPermissionConfirmedBy: userId,
         });
       } catch (error: any) {
         if (error?.code === "23505") {
           const duplicate = await getCampaignByIdempotencyKey(idempotencyKey, userId);
           if (duplicate) {
             const deliveryUncertain = duplicate.status === "delivery_uncertain";
             const processing = duplicate.status === "draft" || duplicate.status === "sending";
             return res.status(duplicate.status === "failed" || deliveryUncertain || processing ? 409 : 200).json({
               success: duplicate.status !== "failed" && !deliveryUncertain && !processing,
               campaignId: duplicate.id,
               sent: duplicate.sentCount || 0,
               failed: duplicate.failedCount || 0,
               excluded: duplicate.excludedCount || 0,
               message: duplicate.status === "failed"
                 ? "This campaign request previously failed. Submit again to start a new attempt."
                 : deliveryUncertain
                   ? "Mailchimp may already have accepted this campaign. Refresh its report before taking any further action."
                 : processing
                   ? "This campaign request is still being processed. Do not submit it again."
                 : "This campaign request was already processed.",
               idempotent: true,
               deliveryUncertain,
             });
           }
         }
         throw error;
       }

       let storedAttachments: Array<{ key: string; url: string; filename: string; contentType: string; size: number }> = [];
       let providerResult: any = null;
       // Send acceptance is not delivery. Retain uncertain attempts and their files.
       let deliveryState: Awaited<ReturnType<typeof import("./mailchimpService").getMailchimpDeliveryState>> = {
         status: "delivery_uncertain",
         sentCount: 0,
         sentAt: null,
         providerError: "Mailchimp accepted the request but sending has not been confirmed. Check its status before resending.",
       };
       let recipientLedgerPrepared = false;
       const recipientRows = (members: any[], allowedStatus: "pending" | "sent") => [
         ...members.map((member: any) => ({
           campaignId,
           companyId: member.recipient.companyId,
           email: member.recipient.email,
           contactName: member.recipient.contactName,
           companyName: member.recipient.companyName,
           providerMemberId: member.id,
           providerMemberHash: member.hash,
           providerStatus: member.status,
           status: member.excluded ? "excluded" : allowedStatus,
           exclusionReason: member.excluded ? member.reason : null,
           permissionBasis,
           permissionConfirmedAt,
           permissionConfirmedBy: userId,
           failedAt: member.status === "sync_failed" ? new Date() : null,
           failureReason: member.status === "sync_failed" ? member.reason : null,
           sentAt: !member.excluded && allowedStatus === "sent" ? new Date() : null,
         })),
         ...invalidRecipients.map((recipient) => ({
           campaignId,
           companyId: recipient.companyId,
           email: recipient.email,
           contactName: recipient.contactName,
           companyName: recipient.companyName,
           providerStatus: "invalid",
           status: "excluded",
           exclusionReason: "Invalid email address.",
           permissionBasis,
           permissionConfirmedAt,
           permissionConfirmedBy: userId,
         })),
       ];
       try {
         const { storeBulkAttachments } = await import("./bulkEmailAttachments");
         storedAttachments = await storeBulkAttachments(userId, campaignId, validatedAttachments);
         if (storedAttachments.length) {
           await db.update(emailCampaigns).set({ attachments: storedAttachments, updatedAt: new Date() }).where(eq(emailCampaigns.id, campaignId));
         }
         const { createAndSend } = await import("./mailchimpService");
         providerResult = await createAndSend({
           audienceId: config.audienceId,
           campaignKey: idempotencyKey,
           name,
           subject,
           fromEmail: config.fromEmail,
           fromName: config.fromName,
            replyToEmail,
           html: htmlContent,
           attachments: storedAttachments,
           recipients: validRecipients,
           scheduledAt: scheduledDate,
            authorizeDispatch: async (dispatch) => {
              await requestLock!.assertHeld();
              const { authorizeBulkEmailDispatch } = await import("./bulkEmailDispatch");
              await authorizeBulkEmailDispatch(userId, companyIds, {
                audienceId: config.audienceId,
                fromEmail: config.fromEmail,
                fromName: config.fromName,
                replyToEmail,
              }, dispatch);
            },
           onProgress: async () => {
             await requestLock!.assertHeld();
             await db.update(emailCampaigns).set({
               updatedAt: new Date(),
             }).where(eq(emailCampaigns.id, campaignId));
           },
           onPrepared: async (prepared) => {
             const allowedCount = prepared.members.filter(member => !member.excluded).length;
             const excludedCount = prepared.members.length - allowedCount + invalidRecipients.length;
             await db.transaction(async (tx) => {
               await tx.update(emailCampaigns).set({
                 providerCampaignId: prepared.campaignId,
                 providerSegmentId: prepared.segmentId,
                 status: "sending",
                 totalRecipients: candidateRecipients.length,
                 sentCount: 0,
                 failedCount: prepared.members.filter(member => member.status === "sync_failed").length,
                 excludedCount,
                 providerError: null,
                 attachments: storedAttachments,
                 updatedAt: new Date(),
               }).where(eq(emailCampaigns.id, campaignId));
               await tx.insert(emailCampaignRecipients).values(recipientRows(prepared.members, "pending"));
             });
             await requestLock!.assertHeld();
             recipientLedgerPrepared = true;
           },
         });
         const { getMailchimpDeliveryState } = await import("./mailchimpService");
         try {
           deliveryState = await getMailchimpDeliveryState(providerResult.campaignId);
         } catch {
           // A failed confirmation read must never trigger another send or cleanup.
         }
         const allowedCount = providerResult.members.filter((member: any) => !member.excluded).length;
         const excludedCount = providerResult.members.length - allowedCount + invalidRecipients.length;
         await db.transaction(async (tx) => {
           await tx.update(emailCampaigns).set({
             ...deliveryState,
             updatedAt: new Date(),
           }).where(eq(emailCampaigns.id, campaignId));
           // Per-recipient statuses are confirmed only from provider activity.
         });
         res.json({ success: true, campaignId, status: deliveryState.status, sent: deliveryState.sentCount, failed: providerResult.members.filter((member: any) => member.status === "sync_failed").length, excluded: excludedCount, message: deliveryState.providerError });
       } catch (error: any) {
         if (!storedAttachments.length && Array.isArray(error?.recoverableAttachments)) {
           storedAttachments = error.recoverableAttachments;
         }
         const providerAccepted = !!providerResult;
         const deliveryUncertain = !providerAccepted && error?.deliveryUncertain === true;
         const members = providerResult?.members || (Array.isArray(error?.members) ? error.members : []);
         const allowedCount = members.filter((member: any) => !member.excluded).length;
         const excludedCount = members.filter((member: any) => member.excluded).length + invalidRecipients.length;
         const syncFailureCount = members.filter((member: any) => member.status === "sync_failed").length;
         let attachmentCleanupFailed = false;

         if (!providerAccepted && !deliveryUncertain && storedAttachments.length) {
           const { removeBulkAttachments } = await import("./bulkEmailAttachments");
           await removeBulkAttachments(storedAttachments).catch(() => {
             attachmentCleanupFailed = true;
             console.error("[Bulk Email] Attachment cleanup failed");
           });
         }

         try {
           await db.transaction(async (tx) => {
             await tx.update(emailCampaigns).set({
               status: providerAccepted
                 ? deliveryState.status
                 : deliveryUncertain ? "delivery_uncertain" : "failed",
               attachments: providerAccepted || deliveryUncertain || attachmentCleanupFailed ? storedAttachments : [],
               providerCampaignId: providerResult?.campaignId || error?.providerCampaignId,
               providerSegmentId: providerResult?.segmentId || error?.providerSegmentId,
               providerError: providerAccepted ? deliveryState.providerError : error.message,
               totalRecipients: members.length || recipientLedgerPrepared ? candidateRecipients.length : undefined,
               sentCount: providerAccepted ? deliveryState.sentCount : deliveryUncertain ? 0 : undefined,
               sentAt: providerAccepted ? deliveryState.sentAt : undefined,
               excludedCount: members.length ? excludedCount : undefined,
               failedCount: providerAccepted || deliveryUncertain
                 ? syncFailureCount
                 : (members.length ? allowedCount + syncFailureCount : candidateRecipients.length),
               updatedAt: new Date(),
             }).where(eq(emailCampaigns.id, campaignId));

             if (!recipientLedgerPrepared && members.length) {
               await tx.insert(emailCampaignRecipients).values(
                 recipientRows(members, "pending"),
               );
             }
             if (!providerAccepted && !deliveryUncertain) {
               await tx.update(emailCampaignRecipients).set({
                 status: "failed",
                 failedAt: new Date(),
                 failureReason: "Mailchimp rejected the campaign before delivery.",
               }).where(and(
                 eq(emailCampaignRecipients.campaignId, campaignId),
                 eq(emailCampaignRecipients.status, "pending"),
               ));
             }
           });
         } catch {
           console.error("[Bulk Email] Local campaign recovery failed");
           return res.status(500).type("application/problem+json").json({
             type: "https://bright-organic.com/problems/bulk-email-recording-failed",
             title: "Campaign state could not be recorded",
             status: 500,
             detail: providerAccepted || deliveryUncertain
               ? "Do not resend this campaign. Mailchimp may already have it; refresh the campaign report after the database is available."
               : "The failed campaign could not be fully recorded.",
             campaignId,
           });
         }

         if (providerAccepted) {
           return res.json({
             success: true,
             campaignId,
             status: deliveryState.status,
             sent: deliveryState.sentCount,
             failed: syncFailureCount,
             excluded: excludedCount,
             message: deliveryState.providerError,
             recovered: true,
           });
         }
         if (deliveryUncertain) {
           return res.status(502).type("application/problem+json").json({
             type: "https://bright-organic.com/problems/mailchimp-delivery-uncertain",
             title: "Mailchimp delivery status is not confirmed",
             status: 502,
             detail: "Mailchimp may already have accepted this campaign. Do not resend it; refresh the campaign report to reconcile its status.",
             campaignId,
           });
         }
         return res.status(error.status || 502).type("application/problem+json").json(error.problem?.() || { type: "https://bright-organic.com/problems/mailchimp-send-failed", title: "Mailchimp campaign failed", status: error.status || 502, detail: error.message });
       }
    } catch (error: any) {
      const { publicBulkEmailError } = await import("./bulkEmailCampaignService");
      const response = publicBulkEmailError(error);
      if (response.status === 500) {
        console.error("[Bulk Email] Campaign request failed");
      }
      res.status(response.status).json({ message: response.message });
     } finally {
       await requestLock?.release().catch(() => {
         console.error("[Bulk Email] Failed to release campaign request lock");
       });
    }
  });

  // ============================================
  // AI EMAIL GENERATOR
  // ============================================

  app.post('/api/email-generator/generate', isAuthenticated, async (req: any, res) => {
    try {
      const { prompt, subject, currentHtml, usePersonalization } = req.body || {};

      if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        return res.status(400).json({ message: 'Please describe what the email should say' });
      }

      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ message: 'OpenAI API key is not configured. Add OPENAI_API_KEY to Secrets.' });
      }

      const logoUrl = process.env.EMAIL_LOGO_URL;

      let systemPrompt = `You are a world-class HTML email designer and senior B2B copywriter for Atlas Ingredients, a premium B2B spice and food ingredient exporter. Never use the abbreviation "BFI" anywhere — the company is always called "Atlas Ingredients". Your job is to produce COMPLETE, production-ready, visually stunning HTML email documents that look like they came from a Fortune 500 marketing team — not plain text, not basic boxes.

THE BRIEF IS THE BLUEPRINT: Briefs may be long structured documents (markdown with headings, bullet lists, exact copy, multiple buttons with labels and links, color directions, greetings and sign-offs). When the brief specifies its own sections, order, wording, colors or buttons, follow the brief EXACTLY — reproduce its sections in its order with its exact headlines, copy, button labels and URLs. The brief's color directions override the default green palette below: when the brief asks for specific accent colours (e.g. "red and green"), genuinely apply them across headline colors, highlight-row borders and backgrounds, and buttons, using tasteful email-safe hexes (e.g. deep red #b91c1c with light red background #fef2f2). Use the DEFAULT STRUCTURE below only for whatever the brief leaves unspecified.

DEFAULT STRUCTURE (for anything the brief does not itself define; a simple brief gets all of these in order): 1. LOGO HEADER BAND: If a logo URL is provided, the band background must be WHITE (#ffffff) with a 4px solid #15803d bottom border, and the logo centered using EXACTLY this tag and no other: <img src="REPLACE_WITH_YOUR_LOGO_URL" alt="Atlas Ingredients" width="200" style="display:block;width:200px;max-width:65%;height:auto;border:0;margin:0 auto;padding:20px 0;">. If no logo URL is provided, render a full-width band with background color #15803d and a styled text header instead: white bold 26px company name "Atlas Ingredients" centered on the green band. 2. HERO SECTION: A bold, attention-grabbing headline in dark green #15803d, 26–30px, font-weight 800. Below it, a compelling 2–3 sentence opening paragraph in #374151, 16px, line-height 1.7. 3. VALUE / PRODUCT SECTION: One highlight row per product or key point in the brief — create as many rows as the brief requires (minimum 2, no upper limit). Each row is a table cell with background #f0fdf4 (very light green), a 4px solid left border in #16a34a, padding 16px 20px, with a bold title in #15803d and a description in #4b5563. 4. SOCIAL PROOF OR TRUST LINE: One row with centered italic text in #6b7280 — use a real fact from the brief if one is given, otherwise a modest generic line like "Your trusted partner for premium organic ingredients" — styled with a subtle top and bottom border in #d1fae5. Never invent statistics. 5. CTA BUTTONS: Prominent buttons, each centered in its own table row. Every button <a> tag must have: background-color #15803d (or the accent color the brief requests); color #ffffff; font-weight bold; font-size 16px; padding 15px 40px; border-radius 8px; text-decoration none; display inline-block; letter-spacing 0.5px; box-shadow 0 4px 12px rgba(21,128,61,0.35). If the brief defines multiple buttons, render EVERY one of them in the brief's order with its exact label (emojis included) and its exact URL — never invent, alter or drop a URL. Secondary buttons may use a white background with a 2px solid border and text in the accent color. 6. CLOSING: A warm 2-sentence closing paragraph, a sign-off with a name placeholder, and "The Atlas Ingredients Team". 7. FOOTER: Full-width light gray #f9fafb band with small 12px #9ca3af centered text containing EXACTLY this company info (never a placeholder): line 1: "Atlas Ingredients" — line 2: "Opp. Murlidhar Guest House, Mehsana-Vishnagar Road, Kansarakui, Mehsana, Gujarat 384001, India" — line 3: "+91-7249847439 | admin@bright-organic.com" — line 4: "© ${new Date().getFullYear()} Atlas Ingredients All rights reserved." — then a plain "Unsubscribe" hyperlink. If the brief asks for extra footer items (website link, registration link, copyright line, etc.), add them as centered text links ABOVE the address lines — the address block is always present and never replaced. Never invent social media URLs: if the brief asks for LinkedIn or other social icons without giving their URLs, leave them out and use only links you actually have.

CONTENT COMPLETENESS — HIGHEST PRIORITY: The user's brief is the single source of truth. Include EVERY fact from the brief: product names, specifications, numbers, certifications, prices, MOQs, packaging details, dates, AND all shipping/logistics/timeline/location/contact details — nothing may be dropped, shortened away or vaguely summarized. If the brief lists many items, create one highlight row per item rather than omitting any. Shipping, delivery and logistics facts that do not fit a product row must still appear — put them in the hero paragraph, an extra highlight row, or the closing paragraph. Before you output, silently re-read the brief sentence by sentence and confirm each fact appears somewhere in the email; if any fact is missing, add it. Never invent products, certifications, statistics or claims that are not in the brief.

WRITING QUALITY: Write specific, benefit-led B2B copy aimed at bulk buyers and food manufacturers: lead with what they care about (quality, certifications, consistency of supply, pricing, logistics). Short paragraphs of at most 3 sentences. Concrete facts over adjectives — avoid empty filler like "we are committed to excellence". The hero headline must deliver the core promise of the brief.

PERSONALIZATION: Only when the request explicitly states that personalization is ENABLED may you use the variables {{contact_name}} and {{company_name}} (they are replaced with each recipient's real details at send time) — in that case greet with {{contact_name}}. When personalization is DISABLED, do NOT output any {{...}} tokens anywhere in the email — use the greeting written in the brief if it has one (e.g. "Dear Purchaser,"), otherwise a natural generic greeting such as "Dear Partner,".

IMAGES — STRICT RULES: The only image you may include without an explicit URL is the official logo tag above (it may be repeated smaller in the footer if the brief asks). NEVER invent, guess or hotlink any other image URL (no stock-photo links, no placeholder services) — a broken image in a buyer's inbox destroys trust. These image rules OVERRIDE the brief: even when the brief asks for hero images, product photos or icons, if it does not give an https URL you must NOT fabricate one (never use example.com, unsplash, placeholder services or any made-up link) — an <img> with a fake URL renders as an ugly broken icon in the inbox. If the brief asks for product photos, hero imagery or icons WITHOUT providing https URLs, create the visual impact instead with bold colored bands, solid background sections, large emoji accents and strong typography. If the brief explicitly provides an https image URL, use it with an explicit width and inline styles. Requests for animations, hover effects or video cannot work reliably in email clients — silently skip them and deliver the closest static design.

DESIGN RULES (follow all of them, no exceptions): - Outer page wrapper: <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f3f4f6;padding:40px 0;"> — this creates the gray page background. - Inner email card: centered table, max-width 600px, background #ffffff, border-radius 10px, overflow hidden, box-shadow 0 4px 24px rgba(0,0,0,0.08). - ALL CSS must be inline on every element — no <style> blocks, no class names, no external CSS. - Font stack everywhere: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif. - Never use <img> tags for icons, bullets or decorations unless the brief itself provided that exact https URL (see IMAGES rules). - If revising existing HTML, keep the official logo and any images whose URLs came from the brief; remove all other images (keep their text). - Never include script tags, external CSS links, or email-provider merge tags. - Respond with ONLY the raw HTML document starting with <!DOCTYPE html> and ending with </html>. Zero explanation, zero markdown fences.`;

      if (logoUrl) {
        systemPrompt = systemPrompt.replace('REPLACE_WITH_YOUR_LOGO_URL', logoUrl);
      }

      let userMessage = `EMAIL BRIEF (include every detail from it):\n${prompt.trim()}`;
      if (subject && typeof subject === 'string' && subject.trim()) {
        userMessage += `\n\nEmail subject line: ${subject.trim()}`;
      }
      userMessage += usePersonalization === true
        ? `\n\nPersonalization is ENABLED — greet with {{contact_name}}.`
        : `\n\nPersonalization is DISABLED — do not use any {{...}} variables anywhere in the email.`;
      if (currentHtml && typeof currentHtml === 'string' && currentHtml.trim()) {
        userMessage += `\n\nHere is the current HTML to revise — keep what works and apply the requested changes: ${currentHtml}`;
      }
      if (!logoUrl) {
        userMessage += `\n\nNote: No logo URL is provided — use the styled text header on the green band instead of an image.`;
      }

      const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          temperature: 0.6,
          max_tokens: 12000,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
        }),
        signal: AbortSignal.timeout(120000),
      });

      let html = '';
      let truncated = false;

      if (openaiRes.ok) {
        const data = await openaiRes.json();
        const choice = data?.choices?.[0];
        html = choice?.message?.content || '';
        truncated = choice?.finish_reason === 'length';
      } else {
        const errText = await openaiRes.text();
        console.error('[AI Email] OpenAI API error:', openaiRes.status, errText.slice(0, 500));
        const quotaExhausted = openaiRes.status === 429 && /insufficient_quota|credit_balance_exhausted/i.test(errText);
        const retriable = openaiRes.status === 429 || openaiRes.status >= 500;
        if (!retriable) {
          return res.status(502).json({ message: `AI generation failed (OpenAI error ${openaiRes.status}). Please try again.` });
        }

        // OpenAI is out of credits or rate-limited — fall back to Gemini
        // (GEMINI_API_KEY is already configured) so generation keeps working.
        console.warn('[AI Email] OpenAI unavailable — falling back to Gemini');
        // Two-model cascade: flash-latest can throw transient 503s under load.
        const geminiModels = ['gemini-flash-latest', 'gemini-3-flash-preview'];
        let gData: any = null;
        let gLastErr = '';
        for (const gModel of geminiModels) {
          const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${gModel}:generateContent`, {
            method: 'POST',
            headers: {
              'x-goog-api-key': process.env.GEMINI_API_KEY || '',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: systemPrompt }] },
              contents: [{ role: 'user', parts: [{ text: userMessage }] }],
              generationConfig: { temperature: 0.6, maxOutputTokens: 16000 },
            }),
            signal: AbortSignal.timeout(120000),
          });
          if (geminiRes.ok) {
            gData = await geminiRes.json();
            console.log(`[AI Email] Gemini fallback served the request (${gModel})`);
            break;
          }
          gLastErr = `${geminiRes.status} ${(await geminiRes.text()).slice(0, 300)}`;
          console.error(`[AI Email] Gemini ${gModel} error:`, gLastErr);
        }

        if (!gData) {
          if (quotaExhausted && gLastErr.startsWith('429')) {
            return res.status(502).json({ message: 'The OpenAI account is out of credits, and the Gemini backup hit its daily limit too. Add OpenAI credits at platform.openai.com → Settings → Billing, then try again.' });
          }
          return res.status(502).json({ message: 'AI generation is temporarily unavailable — wait a minute and try again. (For full reliability, add OpenAI credits at platform.openai.com → Settings → Billing.)' });
        }

        const gCand = gData?.candidates?.[0];
        html = (gCand?.content?.parts || []).map((p: any) => p?.text || '').join('');
        truncated = gCand?.finishReason === 'MAX_TOKENS';
      }

      if (truncated) {
        console.warn('[AI Email] Output hit the token limit — likely truncated');
        return res.status(502).json({ message: 'The generated email was cut off — please try a slightly shorter brief.' });
      }

      // Strip accidental markdown fences
      html = html.trim()
        .replace(/^```(?:html)?\s*/i, '')
        .replace(/```\s*$/, '')
        .trim();

      // Defense in depth: the model is instructed never to emit scripts, but strip
      // any script tags / inline event handlers / javascript: URLs before returning
      html = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
        .replace(/javascript:/gi, '');

      // Strip active-content tags that never belong in a marketing email
      html = html
        .replace(/<(iframe|object|embed|form)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
        .replace(/<(iframe|object|embed|form|base|link)\b[^>]*\/?>/gi, '')
        .replace(/<meta\b[^>]*http-equiv[^>]*\/?>/gi, '');

      // Strip hallucinated images: only the official logo or image URLs the user
      // actually provided (in the brief or the HTML being revised) are allowed.
      // Exact-URL allowlist (entity-decoded) — a fabricated URL renders as a broken image.
      const decodeEntities = (s: string) => s
        .replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#0?39;/g, "'")
        .replace(/&lt;/gi, '<').replace(/&gt;/gi, '>');
      const providedText = `${prompt}\n${typeof currentHtml === 'string' ? currentHtml : ''}`;
      const allowedImageUrls = new Set<string>(
        (decodeEntities(providedText).match(/https?:\/\/[^\s"'<>)\]]+/gi) || []).map(u => u.replace(/[.,;:!?]+$/, ''))
      );
      if (logoUrl) allowedImageUrls.add(logoUrl);
      html = html.replace(/<img\b[^>]*?\/?>/gi, (tag) => {
        const srcMatch = tag.match(/\ssrc\s*=\s*("([^"]*)"|'([^']*)')/i);
        const src = decodeEntities(srcMatch?.[2] ?? srcMatch?.[3] ?? '').trim();
        if (!src || !allowedImageUrls.has(src)) {
          console.warn('[AI Email] Stripped non-allowlisted image:', src.slice(0, 120) || '(missing/unquoted src)');
          return '';
        }
        // srcset could smuggle other URLs past the src check — drop it
        return tag.replace(/\ssrcset\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
      });

      if (!html) {
        return res.status(502).json({ message: 'AI returned an empty response. Please try again.' });
      }

      res.json({ html });
    } catch (error: any) {
      console.error('[AI Email] Generation error:', error);
      const isTimeout = error?.name === 'TimeoutError' || error?.name === 'AbortError';
      res.status(500).json({
        message: isTimeout ? 'AI generation timed out. Please try again.' : 'Failed to generate email',
        error: error?.message || 'Unknown error',
      });
    }
  });

  // ============================================
  // EMAIL TEMPLATES
  // ============================================

  // Get all templates
  app.get('/api/email-templates', isAuthenticated, async (req: any, res) => {
    try {
      const { getTemplates } = await import('./sendgridService');
      const templates = await getTemplates();
      res.json(templates);
    } catch (error) {
      console.error('Error fetching email templates:', error);
      res.status(500).json({ message: 'Failed to fetch email templates' });
    }
  });

  // Create template
  app.post('/api/email-templates', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Validate request body with Zod
      const templateSchema = z.object({
        name: z.string().min(1, "Template name is required").max(255),
        subject: z.string().min(1, "Subject is required").max(500),
        htmlContent: z.string().min(1, "HTML content is required"),
        textContent: z.string().optional().nullable(),
        description: z.string().optional().nullable(),
        variables: z.array(z.string()).optional(),
      });
      
      const validationResult = templateSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: 'Validation failed', 
          errors: validationResult.error.errors 
        });
      }
      
      const { name, subject, htmlContent, textContent, description, variables } = validationResult.data;

      const { createTemplate } = await import('./sendgridService');
      const templateId = await createTemplate(
        name,
        subject,
        htmlContent,
        textContent || null,
        description || null,
        variables || ['contact_name', 'company_name'],
        userId
      );

      res.json({ success: true, id: templateId });
    } catch (error) {
      console.error('Error creating email template:', error);
      res.status(500).json({ message: 'Failed to create email template' });
    }
  });

  // Update template
  app.patch('/api/email-templates/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      // Validate request body with Zod
      const updateTemplateSchema = z.object({
        name: z.string().min(1).max(255).optional(),
        subject: z.string().min(1).max(500).optional(),
        htmlContent: z.string().min(1).optional(),
        textContent: z.string().nullable().optional(),
        description: z.string().nullable().optional(),
        variables: z.array(z.string()).optional(),
        isActive: z.boolean().optional(),
      });
      
      const validationResult = updateTemplateSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: 'Validation failed', 
          errors: validationResult.error.errors 
        });
      }
      
      const { updateTemplate } = await import('./sendgridService');
      await updateTemplate(parseInt(id), validationResult.data);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating email template:', error);
      res.status(500).json({ message: 'Failed to update email template' });
    }
  });

  // Delete template (soft delete)
  app.delete('/api/email-templates/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { deleteTemplate } = await import('./sendgridService');
      await deleteTemplate(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting email template:', error);
      res.status(500).json({ message: 'Failed to delete email template' });
    }
  });

  // Mailchimp supports HTTP Basic credentials embedded in the callback URL:
  // https://mailchimp:<secret>@<published-host>/api/webhooks/mailchimp
  app.post('/api/webhooks/mailchimp', async (req, res) => {
    if (!process.env.MAILCHIMP_WEBHOOK_SECRET) {
      return res.status(503).send("Mailchimp webhook is not configured");
    }
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
    const { mapWebhookEvent, verifyWebhookBasicAuth } = await import("./mailchimpService");
    if (!verifyWebhookBasicAuth(req.headers.authorization)) {
      return res.status(401).send("Unauthorized");
    }
    try {
      const contentType = String(req.headers["content-type"] || "");
      const body = contentType.includes("application/json")
        ? JSON.parse(rawBody.toString("utf8"))
        : Object.fromEntries(new URLSearchParams(rawBody.toString("utf8")));
      const event = mapWebhookEvent(body);
      if (event.type !== "other") {
        const { applyMailchimpWebhookEvent } = await import("./bulkEmailCampaignService");
        await applyMailchimpWebhookEvent(event);
      }
      res.status(200).send("OK");
    } catch (error) {
      console.error("[Mailchimp Webhook] Processing failed");
      // A verified provider request should not retry forever because of an
      // internal transient event-processing error. Report success and rely on
      // explicit report reconciliation for campaign metrics.
      res.status(200).send("OK");
    }
  });

  // Legacy SendGrid webhook remains available only for historical campaign
  // events. New campaigns never use SendGrid delivery.
  // Optionally configure SENDGRID_WEBHOOK_VERIFICATION_KEY in secrets for signature verification
  app.post('/api/webhooks/sendgrid', async (req, res) => {
    try {
      // Optional: Verify webhook signature if verification key is configured
      // For setup, enable Signed Event Webhook in SendGrid and set the verification key
      const verificationKey = process.env.SENDGRID_WEBHOOK_VERIFICATION_KEY;
      if (verificationKey) {
        const signature = req.headers['x-twilio-email-event-webhook-signature'];
        const timestamp = req.headers['x-twilio-email-event-webhook-timestamp'];
        
        if (!signature || !timestamp) {
          console.warn('[SendGrid Webhook] Missing signature headers');
          return res.status(401).send('Unauthorized');
        }
        // Note: For full signature verification, install @sendgrid/eventwebhook
        // and use EventWebhook.verifySignature(publicKey, payload, signature, timestamp)
      }
      
      const events = req.body;
      
      // Validate that the request body is an array (SendGrid sends events as arrays)
      if (!Array.isArray(events)) {
        console.warn('[SendGrid Webhook] Invalid request: expected array of events');
        return res.status(400).send('Invalid request format');
      }
      
      // Validate each event has required fields
      const validEvents = ['delivered', 'open', 'click', 'bounce', 'dropped', 'processed', 'deferred', 'spam_report'];
      const { updateRecipientStatus } = await import('./sendgridService');
      
      for (const event of events) {
        // Basic validation - must have event type and message ID
        if (!event || typeof event !== 'object' || !event.event || !event.sg_message_id) {
          continue;
        }
        
        // Only process known event types
        if (!validEvents.includes(event.event)) {
          continue;
        }
        
        const messageId = event.sg_message_id?.split('.')[0];
        if (!messageId) continue;

        let status: string | null = null;
        let additionalData: any = {};

        switch (event.event) {
          case 'delivered':
            status = 'delivered';
            break;
          case 'open':
            status = 'opened';
            break;
          case 'click':
            status = 'clicked';
            break;
          case 'bounce':
          case 'dropped':
            status = 'bounced';
            additionalData.bounceReason = event.reason || event.type;
            break;
        }

        if (status) {
          await updateRecipientStatus(messageId, status, additionalData);
        }
      }

      res.status(200).send('OK');
    } catch (error) {
      console.error('Error processing SendGrid webhook:', error);
      res.status(200).send('OK');
    }
  });

  // ==========================================
  // QUALITY MANAGEMENT API ROUTES
  // ==========================================

  const qualityAllRoles = ['super_admin', 'admin', 'quality_manager', 'quality_executive'];
  const qualitySalesRoles = [...qualityAllRoles, 'sales_manager', 'sales_executive'];

  const isQualityAuthorized = async (req: any, res: any, next: any) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      if (!user || !qualityAllRoles.includes(user.role || '')) {
        return res.status(403).json({ message: "Forbidden: insufficient permissions" });
      }
      next();
    } catch (error) {
      return res.status(500).json({ message: "Authorization check failed" });
    }
  };

  const isQualityOrSalesAuthorized = async (req: any, res: any, next: any) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      if (!user || !qualitySalesRoles.includes(user.role || '')) {
        return res.status(403).json({ message: "Forbidden: insufficient permissions" });
      }
      next();
    } catch (error) {
      return res.status(500).json({ message: "Authorization check failed" });
    }
  };

  // Quality Document Requests
  app.get('/api/quality/document-requests', isAuthenticated, isQualityOrSalesAuthorized, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const currentUser = await storage.getUser(userId);
      const isSalesRole = currentUser && ['sales_manager', 'sales_executive'].includes(currentUser.role || '');
      const { status, requesterId, assignedToId, limit = '50', offset = '0' } = req.query;
      const filters: any = { limit: parseInt(limit as string), offset: parseInt(offset as string) };
      if (status) filters.status = status;
      // Sales roles only see their own requests; quality/admin see all
      if (isSalesRole) {
        filters.requesterId = userId;
      } else {
        if (requesterId) filters.requesterId = requesterId;
      }
      if (assignedToId) filters.assignedToId = assignedToId;
      const result = await storage.getQualityDocumentRequests(filters);
      const requesterIds = [...new Set(result.requests.map((r: any) => r.requesterId).filter(Boolean))];
      const requesterMap: Record<string, string> = {};
      for (const uid of requesterIds) {
        const user = await storage.getUser(uid);
        if (user) requesterMap[uid] = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email || uid;
      }
      const enrichedRequests = result.requests.map((r: any) => ({
        ...r,
        requesterName: requesterMap[r.requesterId] || r.requesterId,
      }));
      res.json({ requests: enrichedRequests, total: result.total });
    } catch (error) {
      console.error('Error fetching quality document requests:', error);
      res.status(500).json({ message: 'Failed to fetch document requests' });
    }
  });

  app.get('/api/quality/document-requests/:id', isAuthenticated, isQualityOrSalesAuthorized, async (req: any, res) => {
    try {
      const request = await storage.getQualityDocumentRequest(parseInt(req.params.id));
      if (!request) return res.status(404).json({ message: 'Document request not found' });
      res.json(request);
    } catch (error) {
      console.error('Error fetching quality document request:', error);
      res.status(500).json({ message: 'Failed to fetch document request' });
    }
  });

  app.post('/api/quality/document-requests', isAuthenticated, isQualityOrSalesAuthorized, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.session?.user?.id || req.user?.id;
      const custName = req.body.customerName || 'Unknown';
      const now = new Date();
      const monthYear = `${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getFullYear()).slice(-2)}`;
      const countResult = await db.select({ count: sql<number>`count(*)::int` }).from(qualityDocumentRequests).where(sql`customer_name = ${custName} AND to_char(created_at, 'MMYY') = ${monthYear}`);
      const seq = String((countResult[0]?.count || 0) + 1).padStart(3, '0');
      const referenceId = `QDR-${custName}-${monthYear}-${seq}`;
      const body = {
        ...req.body,
        requesterId: userId,
        referenceId,
        requestType: req.body.requestType || req.body.documentType || 'coa',
        title: req.body.title || `${(req.body.documentType || req.body.requestType || 'document').toUpperCase()} - ${req.body.materialName || 'Request'}`,
        materialName: req.body.materialName || req.body.productName || null,
        customerName: custName,
      };
      const validated = insertQualityDocumentRequestSchema.parse(body);
      const result = await storage.createQualityDocumentRequest(validated);
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Error creating quality document request:', error);
      res.status(500).json({ message: 'Failed to create document request' });
    }
  });

  app.patch('/api/quality/document-requests/:id', isAuthenticated, isQualityAuthorized, async (req: any, res) => {
    try {
      const result = await storage.updateQualityDocumentRequest(parseInt(req.params.id), req.body);
      res.json(result);
    } catch (error) {
      console.error('Error updating quality document request:', error);
      res.status(500).json({ message: 'Failed to update document request' });
    }
  });

  // Quality Testing Requests
  app.get('/api/quality/testing-requests', isAuthenticated, isQualityOrSalesAuthorized, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const currentUser = await storage.getUser(userId);
      const isSalesRole = currentUser && ['sales_manager', 'sales_executive'].includes(currentUser.role || '');
      const { status, requestType, requesterId, assignedToId, limit = '50', offset = '0' } = req.query;
      const filters: any = { limit: parseInt(limit as string), offset: parseInt(offset as string) };
      if (status) filters.status = status;
      if (requestType) filters.requestType = requestType;
      // Sales roles only see their own requests; quality/admin see all
      if (isSalesRole) {
        filters.requesterId = userId;
      } else {
        if (requesterId) filters.requesterId = requesterId;
      }
      if (assignedToId) filters.assignedToId = assignedToId;
      const result = await storage.getQualityTestingRequests(filters);
      const requesterIds = [...new Set(result.requests.map((r: any) => r.requesterId).filter(Boolean))];
      const requesterMap: Record<string, string> = {};
      for (const uid of requesterIds) {
        const user = await storage.getUser(uid);
        if (user) requesterMap[uid] = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email || uid;
      }
      const enrichedRequests = result.requests.map((r: any) => ({
        ...r,
        requesterName: requesterMap[r.requesterId] || r.requesterId,
      }));
      res.json({ requests: enrichedRequests, total: result.total });
    } catch (error) {
      console.error('Error fetching quality testing requests:', error);
      res.status(500).json({ message: 'Failed to fetch testing requests' });
    }
  });

  app.get('/api/quality/testing-requests/:id', isAuthenticated, isQualityOrSalesAuthorized, async (req: any, res) => {
    try {
      const request = await storage.getQualityTestingRequest(parseInt(req.params.id));
      if (!request) return res.status(404).json({ message: 'Testing request not found' });
      res.json(request);
    } catch (error) {
      console.error('Error fetching quality testing request:', error);
      res.status(500).json({ message: 'Failed to fetch testing request' });
    }
  });

  app.post('/api/quality/testing-requests', isAuthenticated, isQualityOrSalesAuthorized, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.session?.user?.id || req.user?.id;
      const custName = req.body.customerName || 'Unknown';
      const now = new Date();
      const monthYear = `${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getFullYear()).slice(-2)}`;
      const countResult = await db.select({ count: sql<number>`count(*)::int` }).from(qualityTestingRequests).where(sql`customer_name = ${custName} AND to_char(created_at, 'MMYY') = ${monthYear}`);
      const seq = String((countResult[0]?.count || 0) + 1).padStart(3, '0');
      const referenceId = `QTR-${custName}-${monthYear}-${seq}`;
      const body = {
        ...req.body,
        requesterId: userId,
        referenceId,
        title: req.body.title || `${(req.body.requestType || 'IRF').toUpperCase()} - ${req.body.materialName || 'Test Request'}`,
        materialName: req.body.materialName || null,
        customerName: custName,
      };
      const validated = insertQualityTestingRequestSchema.parse(body);
      const result = await storage.createQualityTestingRequest(validated);
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Error creating quality testing request:', error);
      res.status(500).json({ message: 'Failed to create testing request' });
    }
  });

  app.patch('/api/quality/testing-requests/:id', isAuthenticated, isQualityAuthorized, async (req: any, res) => {
    try {
      const result = await storage.updateQualityTestingRequest(parseInt(req.params.id), req.body);
      res.json(result);
    } catch (error) {
      console.error('Error updating quality testing request:', error);
      res.status(500).json({ message: 'Failed to update testing request' });
    }
  });

  // Quality Test Reports
  app.get('/api/quality/test-reports', isAuthenticated, isQualityAuthorized, async (req: any, res) => {
    try {
      const { testingRequestId, batchId, limit = '50', offset = '0' } = req.query;
      const filters: any = { limit: parseInt(limit as string), offset: parseInt(offset as string) };
      if (testingRequestId) filters.testingRequestId = parseInt(testingRequestId as string);
      if (batchId) filters.batchId = parseInt(batchId as string);
      const result = await storage.getQualityTestReports(filters);
      res.json(result);
    } catch (error) {
      console.error('Error fetching quality test reports:', error);
      res.status(500).json({ message: 'Failed to fetch test reports' });
    }
  });

  app.post('/api/quality/test-reports', isAuthenticated, isQualityAuthorized, async (req: any, res) => {
    try {
      const validated = insertQualityTestReportSchema.parse(req.body);
      const result = await storage.createQualityTestReport(validated);
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Error creating quality test report:', error);
      res.status(500).json({ message: 'Failed to create test report' });
    }
  });

  // Quality Batch Numbers
  app.get('/api/quality/batches', isAuthenticated, isQualityAuthorized, async (req: any, res) => {
    try {
      const { batchType, status, limit = '50', offset = '0' } = req.query;
      const filters: any = { limit: parseInt(limit as string), offset: parseInt(offset as string) };
      if (batchType) filters.batchType = batchType;
      if (status) filters.status = status;
      const result = await storage.getQualityBatchNumbers(filters);
      res.json(result);
    } catch (error) {
      console.error('Error fetching quality batches:', error);
      res.status(500).json({ message: 'Failed to fetch batches' });
    }
  });

  // Approved RM batches (for FG creation) - must be before :id route
  app.get('/api/quality/batches/approved-rm', isAuthenticated, isQualityAuthorized, async (req: any, res) => {
    try {
      const batches = await storage.getApprovedRMBatches();
      res.json(batches);
    } catch (error) {
      console.error('Error fetching approved RM batches:', error);
      res.status(500).json({ message: 'Failed to fetch approved RM batches' });
    }
  });

  app.get('/api/quality/batches/:id', isAuthenticated, isQualityAuthorized, async (req: any, res) => {
    try {
      const batch = await storage.getQualityBatchNumber(parseInt(req.params.id));
      if (!batch) return res.status(404).json({ message: 'Batch not found' });
      res.json(batch);
    } catch (error) {
      console.error('Error fetching quality batch:', error);
      res.status(500).json({ message: 'Failed to fetch batch' });
    }
  });

  app.post('/api/quality/batches', isAuthenticated, isQualityAuthorized, async (req: any, res) => {
    try {
      const userId = req.session?.user?.id || req.user?.id;
      const body = { ...req.body, createdById: userId };
      const validated = insertQualityBatchNumberSchema.parse(body);
      const result = await storage.createQualityBatchNumber(validated);
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Error creating quality batch:', error);
      res.status(500).json({ message: 'Failed to create batch' });
    }
  });

  app.patch('/api/quality/batches/:id', isAuthenticated, isQualityAuthorized, async (req: any, res) => {
    try {
      const result = await storage.updateQualityBatchNumber(parseInt(req.params.id), req.body);
      res.json(result);
    } catch (error) {
      console.error('Error updating quality batch:', error);
      res.status(500).json({ message: 'Failed to update batch' });
    }
  });

  // Batch Approval
  app.post('/api/quality/batches/:id/approve', isAuthenticated, isQualityAuthorized, async (req: any, res) => {
    try {
      const userId = req.session?.user?.id || req.user?.id;
      const batch = await storage.getQualityBatchNumber(parseInt(req.params.id));
      if (!batch) return res.status(404).json({ message: 'Batch not found' });
      const result = await storage.updateQualityBatchNumber(parseInt(req.params.id), {
        status: 'approved',
        approvedById: userId,
        approvedAt: new Date(),
        approvedQuantity: req.body.approvedQuantity || batch.totalQuantity,
        remainingQuantity: req.body.approvedQuantity || batch.totalQuantity,
      } as any);
      res.json(result);
    } catch (error) {
      console.error('Error approving batch:', error);
      res.status(500).json({ message: 'Failed to approve batch' });
    }
  });

  app.post('/api/quality/batches/:id/reject', isAuthenticated, isQualityAuthorized, async (req: any, res) => {
    try {
      const result = await storage.updateQualityBatchNumber(parseInt(req.params.id), {
        status: 'rejected',
        notes: req.body.notes || 'Batch rejected',
      } as any);
      res.json(result);
    } catch (error) {
      console.error('Error rejecting batch:', error);
      res.status(500).json({ message: 'Failed to reject batch' });
    }
  });

  // Batch Test Results
  app.get('/api/quality/batches/:id/test-results', isAuthenticated, isQualityAuthorized, async (req: any, res) => {
    try {
      const results = await storage.getBatchTestResults(parseInt(req.params.id));
      res.json(results);
    } catch (error) {
      console.error('Error fetching batch test results:', error);
      res.status(500).json({ message: 'Failed to fetch test results' });
    }
  });

  app.post('/api/quality/batches/:id/test-results', isAuthenticated, isQualityAuthorized, async (req: any, res) => {
    try {
      const userId = req.session?.user?.id || req.user?.id;
      const body = { ...req.body, batchId: parseInt(req.params.id), testedById: userId, testedAt: new Date() };
      const validated = insertBatchTestResultSchema.parse(body);
      const result = await storage.createBatchTestResult(validated);
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Error creating batch test result:', error);
      res.status(500).json({ message: 'Failed to create test result' });
    }
  });

  app.patch('/api/quality/batch-test-results/:id', isAuthenticated, isQualityAuthorized, async (req: any, res) => {
    try {
      const result = await storage.updateBatchTestResult(parseInt(req.params.id), req.body);
      res.json(result);
    } catch (error) {
      console.error('Error updating batch test result:', error);
      res.status(500).json({ message: 'Failed to update test result' });
    }
  });

  // Batch Material Consumption (RM to FG transfer)
  app.get('/api/quality/batches/:id/consumptions', isAuthenticated, isQualityAuthorized, async (req: any, res) => {
    try {
      const type = (req.query.type as string) || 'fg';
      const results = await storage.getBatchConsumptions(parseInt(req.params.id), type as 'fg' | 'rm');
      res.json(results);
    } catch (error) {
      console.error('Error fetching batch consumptions:', error);
      res.status(500).json({ message: 'Failed to fetch consumptions' });
    }
  });

  app.post('/api/quality/batches/transfer-rm-to-fg', isAuthenticated, isQualityAuthorized, async (req: any, res) => {
    try {
      const userId = req.session?.user?.id || req.user?.id;
      const { fgBatchData, rmConsumptions } = req.body;

      if (!fgBatchData || !rmConsumptions || !Array.isArray(rmConsumptions) || rmConsumptions.length === 0) {
        return res.status(400).json({ message: 'FG batch data and RM consumptions are required' });
      }

      const fgBody = { ...fgBatchData, createdById: userId, batchType: 'finished_good' };
      const fgValidated = insertQualityBatchNumberSchema.parse(fgBody);
      const fgBatch = await storage.createQualityBatchNumber(fgValidated);

      let totalRMInput = 0;
      for (const rm of rmConsumptions) {
        const consumptionData = {
          fgBatchId: fgBatch.id,
          rmBatchId: rm.rmBatchId,
          quantityUsed: String(rm.quantityUsed),
          unit: rm.unit || fgBatchData.unitOfMeasure,
          notes: rm.notes,
          createdById: userId,
        };
        const validated = insertBatchMaterialConsumptionSchema.parse(consumptionData);
        await storage.createBatchConsumption(validated);

        totalRMInput += parseFloat(rm.quantityUsed);

        const rmBatch = await storage.getQualityBatchNumber(rm.rmBatchId);
        if (rmBatch) {
          const currentUsed = parseFloat(rmBatch.usedQuantity || '0');
          const currentRemaining = parseFloat(rmBatch.remainingQuantity || rmBatch.totalQuantity || '0');
          const newUsed = currentUsed + parseFloat(rm.quantityUsed);
          const newRemaining = currentRemaining - parseFloat(rm.quantityUsed);
          await storage.updateQualityBatchNumber(rm.rmBatchId, {
            usedQuantity: String(newUsed),
            remainingQuantity: String(Math.max(0, newRemaining)),
            status: newRemaining <= 0 ? 'consumed' : 'partially_used',
          } as any);
        }
      }

      const fgOutputQty = parseFloat(fgBatchData.totalQuantity || '0');
      const processLoss = totalRMInput - fgOutputQty;
      const processLossPct = totalRMInput > 0 ? (processLoss / totalRMInput) * 100 : 0;
      await storage.updateQualityBatchNumber(fgBatch.id, {
        processLossQty: String(Math.max(0, processLoss)),
        processLossPct: String(Math.max(0, processLossPct).toFixed(2)),
      } as any);

      const updatedFgBatch = await storage.getQualityBatchNumber(fgBatch.id);
      res.status(201).json({ fgBatch: updatedFgBatch, totalRMInput, processLoss, processLossPct });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Error transferring RM to FG:', error);
      res.status(500).json({ message: 'Failed to transfer RM to FG' });
    }
  });

  // Quality Vendors
  app.get('/api/quality/vendors', isAuthenticated, isQualityAuthorized, async (req: any, res) => {
    try {
      const { approvalStatus, search, limit = '50', offset = '0' } = req.query;
      const filters: any = { limit: parseInt(limit as string), offset: parseInt(offset as string) };
      if (approvalStatus) filters.approvalStatus = approvalStatus;
      if (search) filters.search = search;
      const result = await storage.getQualityVendors(filters);
      res.json(result);
    } catch (error) {
      console.error('Error fetching quality vendors:', error);
      res.status(500).json({ message: 'Failed to fetch vendors' });
    }
  });

  app.get('/api/quality/vendors/:id', isAuthenticated, isQualityAuthorized, async (req: any, res) => {
    try {
      const vendor = await storage.getQualityVendor(parseInt(req.params.id));
      if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
      res.json(vendor);
    } catch (error) {
      console.error('Error fetching quality vendor:', error);
      res.status(500).json({ message: 'Failed to fetch vendor' });
    }
  });

  app.post('/api/quality/vendors', isAuthenticated, isQualityAuthorized, async (req: any, res) => {
    try {
      const validated = insertQualityVendorSchema.parse(req.body);
      const result = await storage.createQualityVendor(validated);
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Error creating quality vendor:', error);
      res.status(500).json({ message: 'Failed to create vendor' });
    }
  });

  app.patch('/api/quality/vendors/:id', isAuthenticated, isQualityAuthorized, async (req: any, res) => {
    try {
      const result = await storage.updateQualityVendor(parseInt(req.params.id), req.body);
      res.json(result);
    } catch (error) {
      console.error('Error updating quality vendor:', error);
      res.status(500).json({ message: 'Failed to update vendor' });
    }
  });

  // Customer Vendor Approvals
  app.get('/api/quality/customer-vendor-approvals', isAuthenticated, isQualityOrSalesAuthorized, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const currentUser = await storage.getUser(userId);
      const isSalesRole = currentUser && ['sales_manager', 'sales_executive'].includes(currentUser.role || '');
      const { status, requesterId, assignedToId, limit = '50', offset = '0' } = req.query;
      const filters: any = { limit: parseInt(limit as string), offset: parseInt(offset as string) };
      if (status) filters.status = status;
      // Sales roles only see their own requests; quality/admin see all
      if (isSalesRole) {
        filters.requesterId = userId;
      } else {
        if (requesterId) filters.requesterId = requesterId;
      }
      if (assignedToId) filters.assignedToId = assignedToId;
      const result = await storage.getQualityCustomerVendorApprovals(filters);
      res.json(result);
    } catch (error) {
      console.error('Error fetching customer vendor approvals:', error);
      res.status(500).json({ message: 'Failed to fetch customer vendor approvals' });
    }
  });

  app.get('/api/quality/customer-vendor-approvals/:id', isAuthenticated, isQualityOrSalesAuthorized, async (req: any, res) => {
    try {
      const approval = await storage.getQualityCustomerVendorApproval(parseInt(req.params.id));
      if (!approval) return res.status(404).json({ message: 'Customer vendor approval not found' });
      res.json(approval);
    } catch (error) {
      console.error('Error fetching customer vendor approval:', error);
      res.status(500).json({ message: 'Failed to fetch customer vendor approval' });
    }
  });

  app.post('/api/quality/customer-vendor-approvals', isAuthenticated, isQualityOrSalesAuthorized, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.session?.user?.id || req.user?.id;
      const body = { ...req.body, requesterId: userId };
      const validated = insertQualityCustomerVendorApprovalSchema.parse(body);
      const result = await storage.createQualityCustomerVendorApproval(validated);
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Error creating customer vendor approval:', error);
      res.status(500).json({ message: 'Failed to create customer vendor approval' });
    }
  });

  app.patch('/api/quality/customer-vendor-approvals/:id', isAuthenticated, isQualityAuthorized, async (req: any, res) => {
    try {
      const result = await storage.updateQualityCustomerVendorApproval(parseInt(req.params.id), req.body);
      res.json(result);
    } catch (error) {
      console.error('Error updating customer vendor approval:', error);
      res.status(500).json({ message: 'Failed to update customer vendor approval' });
    }
  });

  // Quality NCRs
  app.get('/api/quality/ncrs', isAuthenticated, isQualityAuthorized, async (req: any, res) => {
    try {
      const { status, severity, limit = '50', offset = '0' } = req.query;
      const filters: any = { limit: parseInt(limit as string), offset: parseInt(offset as string) };
      if (status) filters.status = status;
      if (severity) filters.severity = severity;
      const result = await storage.getQualityNcrs(filters);
      res.json(result);
    } catch (error) {
      console.error('Error fetching quality NCRs:', error);
      res.status(500).json({ message: 'Failed to fetch NCRs' });
    }
  });

  app.get('/api/quality/ncrs/:id', isAuthenticated, isQualityAuthorized, async (req: any, res) => {
    try {
      const ncr = await storage.getQualityNcr(parseInt(req.params.id));
      if (!ncr) return res.status(404).json({ message: 'NCR not found' });
      res.json(ncr);
    } catch (error) {
      console.error('Error fetching quality NCR:', error);
      res.status(500).json({ message: 'Failed to fetch NCR' });
    }
  });

  app.post('/api/quality/ncrs', isAuthenticated, isQualityAuthorized, async (req: any, res) => {
    try {
      const userId = req.session?.user?.id || req.user?.id;
      const body = { ...req.body, reportedById: req.body.reportedById || userId };
      const validated = insertQualityNcrSchema.parse(body);
      const result = await storage.createQualityNcr(validated);
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Error creating quality NCR:', error);
      res.status(500).json({ message: 'Failed to create NCR' });
    }
  });

  app.patch('/api/quality/ncrs/:id', isAuthenticated, isQualityAuthorized, async (req: any, res) => {
    try {
      const result = await storage.updateQualityNcr(parseInt(req.params.id), req.body);
      res.json(result);
    } catch (error) {
      console.error('Error updating quality NCR:', error);
      res.status(500).json({ message: 'Failed to update NCR' });
    }
  });

  // Quality Attachments
  app.get('/api/quality/attachments/:entityType/:entityId', isAuthenticated, isQualityAuthorized, async (req: any, res) => {
    try {
      const { entityType, entityId } = req.params;
      const attachments = await storage.getQualityAttachments(entityType, parseInt(entityId));
      res.json(attachments);
    } catch (error) {
      console.error('Error fetching quality attachments:', error);
      res.status(500).json({ message: 'Failed to fetch attachments' });
    }
  });

  app.post('/api/quality/attachments', isAuthenticated, isQualityAuthorized, async (req: any, res) => {
    try {
      const validated = insertQualityAttachmentSchema.parse(req.body);
      if (validated.entityType === 'field_quality_record') {
        const result = await db.transaction(async (tx) => {
          // Serialize attachment creation with permanent field-record deletion.
          const parent = await tx.execute(sql`
            SELECT id FROM field_quality_records
            WHERE id = ${validated.entityId}
            FOR UPDATE
          `);
          if (!(parent as any).rows?.[0]) return null;
          const [created] = await tx.insert(qualityAttachments).values(validated).returning();
          return created;
        });
        if (!result) {
          // A file may already have been uploaded by the two-step UI flow.
          // Delete only a key that our own uploader could have produced.
          const key = extractOwnedQualityAttachmentKey(validated.fileUrl);
          if (key) {
            try {
              await deleteFromS3(key);
            } catch (cleanupError) {
              console.error('Failed to clean up attachment uploaded for missing field record:', cleanupError);
            }
          }
          return res.status(404).json({ message: 'Field quality record not found' });
        }
        return res.status(201).json(result);
      }
      const result = await storage.createQualityAttachment(validated);
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Error creating quality attachment:', error);
      res.status(500).json({ message: 'Failed to create attachment' });
    }
  });

  app.delete('/api/quality/attachments/:id', isAuthenticated, isQualityAuthorized, async (req: any, res) => {
    try {
      await storage.deleteQualityAttachment(parseInt(req.params.id));
      res.json({ message: 'Attachment deleted successfully' });
    } catch (error) {
      console.error('Error deleting quality attachment:', error);
      res.status(500).json({ message: 'Failed to delete attachment' });
    }
  });

  // Upload a quality attachment file to AWS S3 (stored under quality-attachments/).
  // File bytes are validated against the extension BEFORE anything reaches S3, and
  // the stored Content-Type is set server-side — client MIME/filename are untrusted.
  app.post('/api/quality/attachments/upload', isAuthenticated, isQualityAuthorized, (req: any, res) => {
    qualityAttachmentUpload.single('file')(req, res, async (err: any) => {
      if (err) {
        console.error('Quality attachment upload error:', err);
        const message = err?.code === 'LIMIT_FILE_SIZE'
          ? 'File is too large (max 10MB)'
          : (err?.message || 'Upload failed');
        return res.status(400).json({ message });
      }
      const file = req.file as Express.Multer.File | undefined;
      if (!file || !file.buffer) {
        return res.status(400).json({ message: 'No file received' });
      }
      try {
        const invalid = validateQualityFileBytes(file.buffer, file.originalname);
        if (invalid) {
          return res.status(400).json({ message: invalid });
        }
        const { url } = await uploadQualityAttachment(file.buffer, file.originalname);
        res.status(201).json({
          fileUrl: url,
          fileName: file.originalname,
          size: file.size,
        });
      } catch (uploadErr) {
        console.error('Quality attachment upload error:', uploadErr);
        res.status(500).json({ message: 'Upload failed' });
      }
    });
  });

  // ==================== FIELD QUALITY RECORDS (IRF / TRF / Loading Inspection) ====================
  // Ensure tables exist (idempotent bootstrap for fresh environments)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS field_quality_records (
      id SERIAL PRIMARY KEY,
      record_number VARCHAR(50) NOT NULL UNIQUE,
      form_type VARCHAR(30) NOT NULL,
      product_name VARCHAR(255) NOT NULL,
      product_code VARCHAR(100),
      quantity DECIMAL(12,3),
      unit VARCHAR(30),
      scheduled_date TIMESTAMP,
      actual_date TIMESTAMP,
      expected_due_date TIMESTAMP,
      sampling_location VARCHAR(500),
      sampling_city VARCHAR(100),
      sampling_state VARCHAR(100),
      contact_person_name VARCHAR(255),
      contact_person_phone VARCHAR(30),
      contact_person_email VARCHAR(255),
      party_name VARCHAR(500),
      party_gst VARCHAR(20),
      party_address TEXT,
      party_city VARCHAR(100),
      party_state VARCHAR(100),
      party_pincode VARCHAR(20),
      party_contact VARCHAR(255),
      lab_name VARCHAR(255),
      lab_address TEXT,
      lab_contact_person VARCHAR(255),
      lab_phone VARCHAR(30),
      lab_email VARCHAR(255),
      sample_id VARCHAR(100),
      linked_irf_id INTEGER,
      test_parameters JSONB,
      form_data JSONB,
      invoice_number VARCHAR(100),
      invoice_date TIMESTAMP,
      invoice_amount DECIMAL(12,2),
      status VARCHAR(30) NOT NULL DEFAULT 'scheduled',
      overall_conclusion VARCHAR(30),
      conclusion_notes TEXT,
      linked_batch_id INTEGER,
      inspector_id VARCHAR,
      created_by_id VARCHAR,
      notes TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `).catch(() => {}); // ignore if already exists
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS field_quality_test_results (
      id SERIAL PRIMARY KEY,
      record_id INTEGER NOT NULL REFERENCES field_quality_records(id),
      parameter_name VARCHAR(255) NOT NULL,
      method VARCHAR(255),
      spec_limit VARCHAR(255),
      result_value VARCHAR(255),
      unit VARCHAR(50),
      pass_or_fail VARCHAR(20),
      notes TEXT,
      tested_by_id VARCHAR,
      tested_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `).catch(() => {}); // ignore if already exists

  const fqrTable = fieldQualityRecords;
  const fqtrTable = fieldQualityTestResults;

  // Auto-generate record number
  async function generateFieldQualityRecordNumber(formType: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = formType === 'IRF' ? 'IRF' : formType === 'TRF' ? 'TRF' : 'LI';
    const [row] = await db.execute(sql`
      SELECT COUNT(*) as cnt FROM field_quality_records
      WHERE form_type = ${formType} AND EXTRACT(YEAR FROM created_at) = ${year}
    `).then((r: any) => r.rows);
    const seq = (parseInt(row?.cnt || '0') + 1).toString().padStart(4, '0');
    return `BFO-${prefix}-${year}-${seq}`;
  }

  // List field quality records
  app.get('/api/quality/field-records', isAuthenticated, isQualityAuthorized, async (req: any, res) => {
    try {
      const { formType, status, search, dateFrom, dateTo, limit = '100', offset = '0' } = req.query;
      const conditions: any[] = [];
      if (formType) conditions.push(eq(fqrTable.formType, formType as string));
      if (status) conditions.push(eq(fqrTable.status, status as string));
      if (dateFrom) conditions.push(gte(fqrTable.createdAt, new Date(dateFrom as string)));
      if (dateTo) {
        const to = new Date(dateTo as string);
        to.setHours(23, 59, 59, 999);
        conditions.push(lte(fqrTable.createdAt, to));
      }
      if (search) {
        conditions.push(
          sql`(${fqrTable.productName} ILIKE ${'%' + search + '%'} OR ${fqrTable.recordNumber} ILIKE ${'%' + search + '%'} OR ${fqrTable.partyName} ILIKE ${'%' + search + '%'} OR ${fqrTable.labName} ILIKE ${'%' + search + '%'})`
        );
      }
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      const [records, countResult] = await Promise.all([
        db.select().from(fqrTable).where(whereClause).orderBy(desc(fqrTable.createdAt)).limit(parseInt(limit as string)).offset(parseInt(offset as string)),
        db.select({ count: sql<number>`COUNT(*)` }).from(fqrTable).where(whereClause),
      ]);
      // Enrich with inspector name
      const enriched = await Promise.all(records.map(async (r: any) => {
        let inspectorName = null;
        if (r.inspectorId) {
          const u = await storage.getUser(r.inspectorId);
          if (u) inspectorName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email;
        }
        return { ...r, inspectorName };
      }));
      res.json({ records: enriched, total: Number(countResult[0]?.count || 0) });
    } catch (error) {
      console.error('Error fetching field quality records:', error);
      res.status(500).json({ message: 'Failed to fetch field quality records' });
    }
  });

  // Get single field quality record with test results and attachments
  app.get('/api/quality/field-records/:id', isAuthenticated, isQualityAuthorized, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const [record] = await db.select().from(fqrTable).where(eq(fqrTable.id, id));
      if (!record) return res.status(404).json({ message: 'Record not found' });
      const [testResults, attachments] = await Promise.all([
        db.select().from(fqtrTable).where(eq(fqtrTable.recordId, id)).orderBy(asc(fqtrTable.id)),
        db.execute(sql`SELECT * FROM quality_attachments WHERE entity_type = 'field_quality_record' AND entity_id = ${id} ORDER BY created_at DESC`).then((r: any) => r.rows),
      ]);
      res.json({ ...record, testResults, attachments });
    } catch (error) {
      console.error('Error fetching field quality record:', error);
      res.status(500).json({ message: 'Failed to fetch field quality record' });
    }
  });

  // Create field quality record
  app.post('/api/quality/field-records', isAuthenticated, isQualityAuthorized, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const body = req.body;
      const linkedIrfReference = body.linkedIrfId ? String(body.linkedIrfId) : null;
      if (linkedIrfReference && body.formType !== 'TRF') {
        return res.status(400).json({ message: 'Only TRF records can link to an IRF' });
      }
      const recordNumber = await generateFieldQualityRecordNumber(body.formType);
      const insertData: any = {
        recordNumber,
        formType: body.formType,
        productName: body.productName,
        productCode: body.productCode || null,
        quantity: body.quantity ? body.quantity.toString() : null,
        unit: body.unit || null,
        scheduledDate: body.scheduledDate ? new Date(body.scheduledDate) : null,
        // For IRF, samplingDate is stored as actualDate (the date sampling physically occurred)
        actualDate: (body.samplingDate || body.actualDate) ? new Date(body.samplingDate || body.actualDate) : null,
        expectedDueDate: body.expectedDueDate ? new Date(body.expectedDueDate) : null,
        samplingLocation: body.samplingLocation || null,
        samplingCity: body.samplingCity || null,
        samplingState: body.samplingState || null,
        contactPersonName: body.contactPersonName || null,
        contactPersonPhone: body.contactPersonPhone || null,
        contactPersonEmail: body.contactPersonEmail || null,
        partyName: body.partyName || null,
        partyGst: body.partyGst || null,
        partyAddress: body.partyAddress || null,
        partyCity: body.partyCity || null,
        partyState: body.partyState || null,
        partyPincode: body.partyPincode || null,
        partyContact: body.partyContact || null,
        labName: body.labName || null,
        labAddress: body.labAddress || null,
        labContactPerson: body.labContactPerson || null,
        labPhone: body.labPhone || null,
        labEmail: body.labEmail || null,
        sampleId: body.sampleId || null,
        linkedIrfId: null,
        testParameters: body.testParameters || [],
        formData: body.formData || {},
        invoiceNumber: body.invoiceNumber || null,
        invoiceDate: body.invoiceDate ? new Date(body.invoiceDate) : null,
        invoiceAmount: body.invoiceAmount ? body.invoiceAmount.toString() : null,
        // TRF lifecycle starts at "sent"; IRF and LI start at "scheduled"
        status: body.status || (body.formType === 'TRF' ? 'sent' : 'scheduled'),
        overallConclusion: body.overallConclusion || null,
        conclusionNotes: body.conclusionNotes || null,
        linkedBatchId: body.linkedBatchId ? parseInt(body.linkedBatchId) : null,
        // inspectorAssigned is a display name (free text) stored in inspectorId which is VARCHAR
        inspectorId: body.inspectorAssigned || body.inspectorId || null,
        createdById: userId,
        notes: body.notes || null,
      };
      let created: any;
      if (linkedIrfReference) {
        created = await db.transaction(async (tx) => {
          // Coordinate with permanent IRF deletion. DELETE locks this same row,
          // so creation either commits first and is unlinked, or sees no IRF.
          const target = await tx.execute(sql`
            SELECT id FROM field_quality_records
            WHERE form_type = 'IRF'
              AND ${/^[1-9]\d*$/.test(linkedIrfReference)
                ? sql`id = ${Number(linkedIrfReference)}`
                : sql`record_number = ${linkedIrfReference}`}
            FOR UPDATE
          `);
          const irfId = (target as any).rows?.[0]?.id;
          if (!irfId) return null;
          const [row] = await tx.insert(fqrTable).values({ ...insertData, linkedIrfId: Number(irfId) }).returning();
          return row;
        });
        if (!created) return res.status(400).json({ message: 'Linked IRF record not found' });
      } else {
        [created] = await db.insert(fqrTable).values(insertData).returning();
      }
      res.json(created);
    } catch (error) {
      console.error('Error creating field quality record:', error);
      res.status(500).json({ message: 'Failed to create field quality record' });
    }
  });

  // Update field quality record
  app.patch('/api/quality/field-records/:id', isAuthenticated, isQualityAuthorized, async (req: any, res) => {
    try {
      if (!/^[1-9]\d*$/.test(req.params.id)) {
        return res.status(400).json({ message: 'Invalid record ID' });
      }
      const id = Number(req.params.id);
      const [existing] = await db.select({ id: fqrTable.id }).from(fqrTable).where(eq(fqrTable.id, id));
      if (!existing) return res.status(404).json({ message: 'Record not found' });
      const body = req.body;
      const updateData: any = { updatedAt: new Date() };
      const fields = ['status', 'overallConclusion', 'conclusionNotes', 'notes', 'invoiceNumber', 'invoiceAmount',
        'linkedBatchId', 'inspectorId', 'labName', 'labAddress', 'labContactPerson', 'labPhone', 'labEmail',
        'productName', 'productCode', 'quantity', 'unit', 'samplingLocation', 'samplingCity', 'samplingState',
        'contactPersonName', 'contactPersonPhone', 'contactPersonEmail', 'partyName', 'partyGst', 'partyAddress',
        'partyCity', 'partyState', 'partyPincode', 'partyContact', 'sampleId', 'testParameters', 'formData'];
      for (const f of fields) {
        if (body[f] !== undefined) updateData[f] = body[f];
      }
      for (const field of ['quantity', 'invoiceAmount'] as const) {
        if (body[field] !== undefined) {
          if (body[field] === '' || body[field] === null) updateData[field] = null;
          else if (!Number.isFinite(Number(body[field]))) return res.status(400).json({ message: `Invalid ${field}` });
          else updateData[field] = String(body[field]);
        }
      }
      if (body.linkedBatchId !== undefined) {
        const value = body.linkedBatchId === '' || body.linkedBatchId === null ? null : Number(body.linkedBatchId);
        if (value !== null && (!Number.isInteger(value) || value <= 0)) return res.status(400).json({ message: 'Invalid linkedBatchId' });
        updateData.linkedBatchId = value;
      }
      let linkedIrfReference: string | null | undefined;
      if (body.linkedIrfId !== undefined) {
        if (body.linkedIrfId === '' || body.linkedIrfId === null) {
          updateData.linkedIrfId = null;
        } else {
          linkedIrfReference = String(body.linkedIrfId);
        }
      }
      const asDate = (field: string, value: any) => {
        if (!value) return null;
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) throw new Error(`INVALID_DATE:${field}`);
        return date;
      };
      if (body.scheduledDate !== undefined) updateData.scheduledDate = asDate('scheduledDate', body.scheduledDate);
      // samplingDate (from IRF form) maps to actualDate
      if (body.samplingDate !== undefined) updateData.actualDate = asDate('samplingDate', body.samplingDate);
      else if (body.actualDate !== undefined) updateData.actualDate = asDate('actualDate', body.actualDate);
      if (body.expectedDueDate !== undefined) updateData.expectedDueDate = asDate('expectedDueDate', body.expectedDueDate);
      if (body.invoiceDate !== undefined) updateData.invoiceDate = asDate('invoiceDate', body.invoiceDate);
      // inspectorAssigned (text) maps to inspectorId (which is VARCHAR in DB)
      if (body.inspectorAssigned !== undefined) updateData.inspectorId = body.inspectorAssigned;
      let updated: any;
      if (linkedIrfReference) {
        const linkedValue = linkedIrfReference;
        const result = await db.transaction(async (tx) => {
          // Lock the IRF until this TRF update commits. DELETE locks this same
          // row before nulling links, so the two operations cannot race.
          const target = await tx.execute(sql`
            SELECT id FROM field_quality_records
            WHERE form_type = 'IRF'
              AND ${/^[1-9]\d*$/.test(linkedValue)
                ? sql`id = ${Number(linkedValue)}`
                : sql`record_number = ${linkedValue}`}
            FOR UPDATE
          `);
          const irfId = (target as any).rows?.[0]?.id;
          if (!irfId) return null;
          updateData.linkedIrfId = Number(irfId);
          const [row] = await tx.update(fqrTable).set(updateData).where(eq(fqrTable.id, id)).returning();
          return row;
        });
        if (!result) return res.status(400).json({ message: 'Linked IRF record not found' });
        updated = result;
      } else {
        [updated] = await db.update(fqrTable).set(updateData).where(eq(fqrTable.id, id)).returning();
      }
      res.json(updated);
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('INVALID_DATE:')) {
        return res.status(400).json({ message: `Invalid ${error.message.split(':')[1]}` });
      }
      console.error('Error updating field quality record:', error);
      res.status(500).json({ message: 'Failed to update field quality record' });
    }
  });

  // Permanently delete a field quality record and all database-owned children.
  app.delete('/api/quality/field-records/:id', isAuthenticated, isQualityAuthorized, async (req: any, res) => {
    try {
      if (!/^[1-9]\d*$/.test(req.params.id)) {
        return res.status(400).json({ message: 'Invalid record ID' });
      }
      const id = Number(req.params.id);
      const deleted = await db.transaction(async (tx) => {
        // This lock is intentionally held through S3 cleanup: attachment POST
        // locks the same row, so it either commits before this read or waits and
        // then observes the missing parent and cleans up its uploaded file.
        const locked = await tx.execute(sql`SELECT id, form_type FROM field_quality_records WHERE id = ${id} FOR UPDATE`);
        const parent = (locked as any).rows?.[0];
        if (!parent) throw new Error('FIELD_RECORD_NOT_FOUND');
        if (parent.form_type !== 'IRF' && parent.form_type !== 'TRF') throw new Error('FIELD_RECORD_NOT_DELETABLE');

        const attachments = await tx.select({ fileUrl: qualityAttachments.fileUrl })
          .from(qualityAttachments)
          .where(and(eq(qualityAttachments.entityType, 'field_quality_record'), eq(qualityAttachments.entityId, id)));
        const ownedKeys = attachments
          .map((attachment) => extractOwnedQualityAttachmentKey(attachment.fileUrl))
          .filter((key): key is string => !!key);
        for (const key of ownedKeys) {
          let deletedFromStorage = false;
          let lastError: unknown;
          for (let attempt = 0; attempt < 3 && !deletedFromStorage; attempt++) {
            try {
              await deleteFromS3(key);
              deletedFromStorage = true;
            } catch (error) {
              lastError = error;
            }
          }
          if (!deletedFromStorage) {
            console.error(`Failed to clean up field quality attachment for record ${id} after 3 attempts:`, lastError);
            throw new Error('FIELD_RECORD_STORAGE_DELETE_FAILED');
          }
        }
        const unlinked = await tx.update(fqrTable).set({ linkedIrfId: null, updatedAt: new Date() })
          .where(eq(fqrTable.linkedIrfId, id)).returning({ id: fqrTable.id });
        const results = await tx.delete(fqtrTable).where(eq(fqtrTable.recordId, id)).returning({ id: fqtrTable.id });
        const attachmentRows = await tx.delete(qualityAttachments)
          .where(and(eq(qualityAttachments.entityType, 'field_quality_record'), eq(qualityAttachments.entityId, id)))
          .returning({ id: qualityAttachments.id });
        await tx.delete(fqrTable).where(eq(fqrTable.id, id));
        return { unlinked: unlinked.length, testResults: results.length, attachmentRows: attachmentRows.length, storageFiles: ownedKeys.length };
      });
      res.json({
        success: true,
        deleted: {
          records: 1,
          testResults: deleted.testResults,
          attachments: deleted.attachmentRows,
          unlinkedRecords: deleted.unlinked,
          storageFiles: deleted.storageFiles,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'FIELD_RECORD_NOT_FOUND') {
        return res.status(404).json({ message: 'Record not found' });
      }
      if (error instanceof Error && error.message === 'FIELD_RECORD_NOT_DELETABLE') {
        return res.status(400).json({ message: 'Only IRF and TRF records can be permanently deleted' });
      }
      if (error instanceof Error && error.message === 'FIELD_RECORD_STORAGE_DELETE_FAILED') {
        return res.status(502).json({
          message: 'Could not delete an attached storage file. The record was not deleted and can be retried.',
        });
      }
      console.error('Error deleting field quality record:', error);
      res.status(500).json({ message: 'Failed to delete field quality record' });
    }
  });

  // Get test results for a record
  app.get('/api/quality/field-records/:id/test-results', isAuthenticated, isQualityAuthorized, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const results = await db.select().from(fqtrTable).where(eq(fqtrTable.recordId, id)).orderBy(asc(fqtrTable.id));
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch test results' });
    }
  });

  // Add test result to a record
  app.post('/api/quality/field-records/:id/test-results', isAuthenticated, isQualityAuthorized, async (req: any, res) => {
    try {
      const recordId = parseInt(req.params.id);
      const userId = req.user?.claims?.sub;
      const { parameterName, method, specLimit, resultValue, unit, passOrFail, notes } = req.body;
      const [created] = await db.insert(fqtrTable).values({
        recordId,
        parameterName,
        method: method || null,
        specLimit: specLimit || null,
        resultValue: resultValue || null,
        unit: unit || null,
        passOrFail: passOrFail || null,
        notes: notes || null,
        testedById: userId,
        testedAt: new Date(),
      }).returning();
      res.json(created);
    } catch (error) {
      res.status(500).json({ message: 'Failed to add test result' });
    }
  });

  // Update a single test result
  app.patch('/api/quality/field-test-results/:id', isAuthenticated, isQualityAuthorized, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { parameterName, method, specLimit, resultValue, unit, passOrFail, notes } = req.body;
      const [updated] = await db.update(fqtrTable).set({
        parameterName: parameterName ?? undefined,
        method: method ?? undefined,
        specLimit: specLimit ?? undefined,
        resultValue: resultValue ?? undefined,
        unit: unit ?? undefined,
        passOrFail: passOrFail ?? undefined,
        notes: notes ?? undefined,
      }).where(eq(fqtrTable.id, id)).returning();
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update test result' });
    }
  });

  // Delete a test result
  app.delete('/api/quality/field-test-results/:id', isAuthenticated, isQualityAuthorized, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await db.delete(fqtrTable).where(eq(fqtrTable.id, id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete test result' });
    }
  });

  // Quality Dashboard Stats
  app.get('/api/quality/dashboard-stats', isAuthenticated, isQualityAuthorized, async (req: any, res) => {
    try {
      const [docRequests, testingRequests, batches, vendorApprovals, ncrs, customerVendorApprovals] = await Promise.all([
        storage.getQualityDocumentRequests({ limit: 1000, offset: 0 }),
        storage.getQualityTestingRequests({ limit: 1000, offset: 0 }),
        storage.getQualityBatchNumbers({ limit: 1000, offset: 0 }),
        storage.getQualityVendors({ limit: 1000, offset: 0 }),
        storage.getQualityNcrs({ limit: 1000, offset: 0 }),
        storage.getQualityCustomerVendorApprovals({ limit: 1000, offset: 0 }),
      ]);

      // Field quality records stats
      const fqrRows = await db.select({
        formType: fqrTable.formType,
        status: fqrTable.status,
        overallConclusion: fqrTable.overallConclusion,
      }).from(fqrTable);

      const stats = {
        documentRequests: {
          total: docRequests.total,
          open: docRequests.requests.filter((r: any) => r.status === 'open' || r.status === 'pending' || r.status === 'in_progress').length,
        },
        testingRequests: {
          total: testingRequests.total,
          pending: testingRequests.requests.filter((r: any) => r.status === 'pending' || r.status === 'submitted').length,
        },
        batches: {
          total: batches.total,
          active: batches.batches.filter((b: any) => b.status === 'active' || b.status === 'in_production').length,
        },
        vendorApprovals: {
          total: vendorApprovals.total,
          pending: vendorApprovals.vendors.filter((v: any) => v.approvalStatus === 'pending' || v.approvalStatus === 'under_review').length,
        },
        ncrs: {
          total: ncrs.total,
          open: ncrs.ncrs.filter((n: any) => n.status === 'open' || n.status === 'in_progress' || n.status === 'under_investigation').length,
        },
        customerVendorApprovals: {
          total: customerVendorApprovals.total,
          received: customerVendorApprovals.approvals.filter((a: any) => a.status === 'received' || a.status === 'pending').length,
        },
        fieldQualityRecords: {
          total: fqrRows.length,
          irf: fqrRows.filter((r: any) => r.formType === 'IRF').length,
          trf: fqrRows.filter((r: any) => r.formType === 'TRF').length,
          loadingInspection: fqrRows.filter((r: any) => r.formType === 'loading_inspection').length,
          inTesting: fqrRows.filter((r: any) => ['in_testing', 'sent', 'results_received'].includes(r.status)).length,
          completed: fqrRows.filter((r: any) => r.status === 'completed').length,
          accepted: fqrRows.filter((r: any) => r.overallConclusion === 'accepted').length,
          rejected: fqrRows.filter((r: any) => r.overallConclusion === 'rejected').length,
        },
      };

      res.json(stats);
    } catch (error) {
      console.error('Error fetching quality dashboard stats:', error);
      res.status(500).json({ message: 'Failed to fetch dashboard stats' });
    }
  });

  // Admin: Apply a company document to all products (e.g., Export House Certificate)
  app.post('/api/admin/products/apply-company-document', isAuthenticated, isAdminOrWebsiteManager, webpUpload.single('document'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user || !user.role?.includes('admin')) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { fieldName } = req.body;
      if (!fieldName) {
        return res.status(400).json({ message: "fieldName is required (e.g., exportHouseCert)" });
      }

      const file = req.file;
      if (!file) {
        return res.status(400).json({ message: "No document file provided" });
      }

      // Map camelCase field names to snake_case column names.
      // Checked BEFORE uploading so a bad request never stores an orphaned file.
      const columnMap: Record<string, string> = {
        exportHouseCert: 'export_house_cert',
        exportCert: 'export_cert',
        spiceBoardCert: 'spice_board_cert',
        fssaiLicense: 'fssai_license',
        businessLicense: 'business_license',
        halalCert: 'halal_cert',
        euOrganicCert: 'eu_organic_cert',
        indiaOrganicCert: 'india_organic_cert',
        usdaOrganicCert: 'usda_organic_cert',
      };
      const columnName = columnMap[fieldName];
      if (!columnName) {
        return res.status(400).json({ message: `Unknown field: ${fieldName}` });
      }

      // Company documents are stored as .pdf on a public bucket — verify the real
      // bytes are a PDF and force the Content-Type (client MIME is untrusted)
      if (!file.originalname.toLowerCase().endsWith('.pdf') || validateQualityFileBytes(file.buffer, file.originalname) !== null) {
        return res.status(400).json({ message: "Only PDF files are allowed for company documents" });
      }

      const objectKey = `products/company-documents/${fieldName}-${Date.now()}-${crypto.randomUUID()}.pdf`;
      const { PutObjectCommand } = await import('@aws-sdk/client-s3');
      const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Key: objectKey,
        Body: file.buffer,
        ContentType: 'application/pdf',
      });
      const { s3Client } = await import('./awsS3Service');
      await s3Client.send(command);

      const s3Url = getImageUrl(objectKey);

      // Update all products with this document URL using drizzle update
      const result = await db.update(products).set({ [fieldName]: s3Url });

      console.log(`[Admin] Applied ${fieldName} to all products: ${s3Url}`);
      res.json({ message: `Document applied to all products`, url: s3Url, updatedCount: result.rowCount });
    } catch (error) {
      console.error('Error applying company document:', error);
      res.status(500).json({ message: 'Failed to apply document' });
    }
  });

  // ==================== SALES CALL / EMAIL LOG ROUTES ====================

  // POST /api/sales-logs — create a new log entry
  app.post("/api/sales-logs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const userRole = (user as any)?.role || "sales_executive";
      const allowedRoles = ["sales_executive", "sales_manager", "admin", "super_admin"];
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({ message: "Only sales staff can create activity logs" });
      }

      const VALID_ACTIVITY_TYPES = ["cold_call", "warm_call", "cold_email", "warm_email", "enquiry_email", "reply_email"];
      const VALID_INTEREST_LEVELS = ["hot", "warm", "cold"];

      const { companyId, activities, contactPersonName, contactPhone, contactEmail,
              productsDiscussed, discussionSummary, buyerRequirement, interestLevel, buyerResponse,
              // Legacy single-entry support
              activityType: legacyActivityType, callType: legacyCallType, callOutcome: legacyCallOutcome } = req.body;

      // Normalize to activities[] format (supports both new multi-entry and legacy single-entry)
      const entriesInput: Array<{ activityType: string; callType?: string | null; callOutcome?: string | null }> =
        Array.isArray(activities) && activities.length > 0
          ? activities
          : legacyActivityType
            ? [{ activityType: legacyActivityType, callType: legacyCallType, callOutcome: legacyCallOutcome }]
            : [];

      const companyIdNum = parseInt(companyId);
      if (!companyId || isNaN(companyIdNum) || entriesInput.length === 0) {
        return res.status(400).json({ message: "Valid companyId and at least one activity are required" });
      }
      if (entriesInput.length > 5) {
        return res.status(400).json({ message: "At most 5 activities per submission" });
      }
      for (const e of entriesInput) {
        if (!VALID_ACTIVITY_TYPES.includes(e.activityType)) {
          return res.status(400).json({ message: `Invalid activityType "${e.activityType}". Must be one of: ${VALID_ACTIVITY_TYPES.join(", ")}` });
        }
      }
      if (interestLevel && !VALID_INTEREST_LEVELS.includes(interestLevel)) {
        return res.status(400).json({ message: `Invalid interestLevel. Must be one of: ${VALID_INTEREST_LEVELS.join(", ")}` });
      }

      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      const tsBase = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
      const firstName = ((user as any)?.firstName || (user as any)?.email?.split("@")[0] || "user").toLowerCase().replace(/\s+/g, "").slice(0, 10);
      const logDate = now.toISOString().slice(0, 10);
      const logTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

      const activityLabels: Record<string, string> = {
        cold_call: "Cold Call", warm_call: "Warm Call",
        cold_email: "Cold Email", warm_email: "Warm Email",
        enquiry_email: "Enquiry Email", reply_email: "Reply Email",
      };

      // Wrap multi-insert + note creation in a transaction so partial writes don't persist
      const createdEntries = await db.transaction(async (tx) => {
        const created: any[] = [];
        for (let i = 0; i < entriesInput.length; i++) {
          const e = entriesInput[i];
          const randSuffix = Math.random().toString(36).slice(2, 6).toUpperCase();
          const logId = `LD-${tsBase}${i > 0 ? `-${i}` : ""}-${firstName}-${randSuffix}`;
          const trimmedOutcome = (e.callOutcome || "").toString().trim().slice(0, 100) || null;

          const [entry] = await tx.insert(salesCallLogs).values({
            logId,
            userId,
            companyId: companyIdNum,
            activityType: e.activityType,
            callType: e.callType ? String(e.callType).slice(0, 30) : null,
            callOutcome: trimmedOutcome,
            contactPersonName: contactPersonName || null,
            contactPhone: contactPhone || null,
            contactEmail: contactEmail || null,
            productsDiscussed: Array.isArray(productsDiscussed) && productsDiscussed.length > 0 ? productsDiscussed : null,
            discussionSummary: discussionSummary || null,
            buyerRequirement: buyerRequirement || null,
            interestLevel: interestLevel || null,
            buyerResponse: buyerResponse || null,
            logDate,
            logTime,
          }).returning();
          created.push(entry);
        }

        // Auto-create a single combined company note summarising the activity/activities
        const channelsLabel = entriesInput.map(e => activityLabels[e.activityType] || e.activityType).join(" + ");
        const noteLines: string[] = [`[${channelsLabel}]`];
        if (contactPersonName) noteLines.push(`Contact: ${contactPersonName}${contactPhone ? ` (${contactPhone})` : ""}`);
        for (const e of entriesInput) {
          if (e.callOutcome) noteLines.push(`${activityLabels[e.activityType] || e.activityType} Outcome: ${e.callOutcome}`);
        }
        if (productsDiscussed?.length) noteLines.push(`Products: ${productsDiscussed.join(", ")}`);
        if (interestLevel) noteLines.push(`Interest: ${interestLevel.toUpperCase()}`);
        if (buyerResponse) noteLines.push(`Buyer Response: ${buyerResponse}`);
        if (buyerRequirement) noteLines.push(`Requirement: ${buyerRequirement}`);
        if (discussionSummary) noteLines.push(`\n${discussionSummary}`);

        const hasCall = entriesInput.some(e => ["cold_call", "warm_call"].includes(e.activityType));
        await tx.insert(companyNotes).values({
          companyId: companyIdNum,
          noteType: hasCall ? "call_log" : "email_log",
          content: noteLines.join("\n"),
          createdBy: userId,
        });

        return created;
      });

      res.json(createdEntries.length === 1 ? createdEntries[0] : createdEntries);
    } catch (error) {
      console.error("Error creating sales log:", error);
      res.status(500).json({ message: "Failed to create log entry" });
    }
  });

  // GET /api/sales-logs — admin/manager fetch all logs with filters
  app.get("/api/sales-logs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const userRole = (user as any)?.role || "sales_executive";
      const adminRoles = ["super_admin", "admin", "sales_manager"];
      if (!adminRoles.includes(userRole)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { dateFrom, dateTo, staffId, type } = req.query as Record<string, string>;
      const conds: any[] = [];
      if (dateFrom) conds.push(sql`scl.log_date >= ${dateFrom}`);
      if (dateTo) conds.push(sql`scl.log_date <= ${dateTo}`);
      if (staffId) conds.push(sql`scl.user_id = ${staffId}`);
      if (type) conds.push(sql`scl.activity_type = ${type}`);

      const whereClause = conds.length ? sql`WHERE ${sql.join(conds, sql` AND `)}` : sql``;
      const rows = await db.execute(sql`
        SELECT
          scl.id,
          scl.log_id AS "logId",
          scl.user_id AS "userId",
          COALESCE(NULLIF(TRIM(u.first_name || ' ' || COALESCE(u.last_name,'')), ''), u.email, 'Unknown') AS "userName",
          scl.company_id AS "companyId",
          c.company_name AS "companyName",
          scl.activity_type AS "activityType",
          scl.call_type AS "callType",
          scl.call_outcome AS "callOutcome",
          scl.contact_person_name AS "contactPersonName",
          scl.contact_phone AS "contactPhone",
          scl.contact_email AS "contactEmail",
          scl.products_discussed AS "productsDiscussed",
          scl.discussion_summary AS "discussionSummary",
          scl.buyer_requirement AS "buyerRequirement",
          scl.interest_level AS "interestLevel",
          scl.buyer_response AS "buyerResponse",
          scl.log_date AS "logDate",
          scl.log_time AS "logTime",
          scl.created_at AS "createdAt"
        FROM sales_call_logs scl
        LEFT JOIN users u ON scl.user_id = u.id
        LEFT JOIN companies c ON scl.company_id = c.id
        ${whereClause}
        ORDER BY scl.log_date DESC, scl.created_at DESC
      `);

      res.json(rows.rows);
    } catch (error) {
      console.error("Error fetching sales logs:", error);
      res.status(500).json({ message: "Failed to fetch logs" });
    }
  });

  // GET /api/sales-logs/my — own logs for sales user
  app.get("/api/sales-logs/my", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { dateFrom, dateTo, type, companyId } = req.query as Record<string, string>;

      const myConditions: any[] = [sql`scl.user_id = ${userId}`];
      if (dateFrom) myConditions.push(sql`scl.log_date >= ${dateFrom}`);
      if (dateTo) myConditions.push(sql`scl.log_date <= ${dateTo}`);
      if (type) myConditions.push(sql`scl.activity_type = ${type}`);
      if (companyId && !isNaN(parseInt(companyId))) myConditions.push(sql`scl.company_id = ${parseInt(companyId)}`);

      const rows = await db.execute(sql`
        SELECT
          scl.id,
          scl.log_id AS "logId",
          scl.user_id AS "userId",
          COALESCE(NULLIF(TRIM(u.first_name || ' ' || COALESCE(u.last_name,'')), ''), u.email, 'Unknown') AS "userName",
          scl.company_id AS "companyId",
          c.company_name AS "companyName",
          scl.activity_type AS "activityType",
          scl.call_type AS "callType",
          scl.call_outcome AS "callOutcome",
          scl.contact_person_name AS "contactPersonName",
          scl.contact_phone AS "contactPhone",
          scl.contact_email AS "contactEmail",
          scl.products_discussed AS "productsDiscussed",
          scl.discussion_summary AS "discussionSummary",
          scl.buyer_requirement AS "buyerRequirement",
          scl.interest_level AS "interestLevel",
          scl.buyer_response AS "buyerResponse",
          scl.log_date AS "logDate",
          scl.log_time AS "logTime",
          scl.created_at AS "createdAt"
        FROM sales_call_logs scl
        LEFT JOIN users u ON scl.user_id = u.id
        LEFT JOIN companies c ON scl.company_id = c.id
        WHERE ${sql.join(myConditions, sql` AND `)}
        ORDER BY scl.log_date DESC, scl.created_at DESC
      `);

      res.json(rows.rows);
    } catch (error) {
      console.error("Error fetching my sales logs:", error);
      res.status(500).json({ message: "Failed to fetch logs" });
    }
  });

  // GET /api/sales-logs/staff-list — list of staff who have logs (for filter dropdown)
  app.get("/api/sales-logs/staff-list", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const userRole = (user as any)?.role || "sales_executive";
      const adminRoles = ["super_admin", "admin", "sales_manager"];
      if (!adminRoles.includes(userRole)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const rows = await db.execute(sql`
        SELECT
          u.id,
          COALESCE(NULLIF(TRIM(u.first_name || ' ' || COALESCE(u.last_name,'')), ''), u.email) AS name
        FROM users u
        WHERE u.is_active = true
          AND (u.role IN ('sales_executive', 'sales_manager') OR u.department = 'sales')
        ORDER BY name
      `);

      res.json(rows.rows);
    } catch (error) {
      console.error("Error fetching staff list:", error);
      res.status(500).json({ message: "Failed to fetch staff list" });
    }
  });

  // GET /api/admin/sales-logs/export — Excel download (admin/super_admin only)
  app.get("/api/admin/sales-logs/export", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const userRole = (user as any)?.role || "sales_executive";
      const adminOnlyRoles = ["super_admin", "admin"];
      if (!adminOnlyRoles.includes(userRole)) {
        return res.status(403).json({ message: "Access denied. Admin only." });
      }

      const { dateFrom, dateTo, staffId, type } = req.query as Record<string, string>;
      const conds: any[] = [];
      if (dateFrom) conds.push(sql`scl.log_date >= ${dateFrom}`);
      if (dateTo) conds.push(sql`scl.log_date <= ${dateTo}`);
      if (staffId) conds.push(sql`scl.user_id = ${staffId}`);
      if (type) conds.push(sql`scl.activity_type = ${type}`);

      const whereClause = conds.length ? sql`WHERE ${sql.join(conds, sql` AND `)}` : sql``;
      const result = await db.execute(sql`
        SELECT
          scl.log_id AS "logId",
          COALESCE(NULLIF(TRIM(u.first_name || ' ' || COALESCE(u.last_name,'')), ''), u.email, 'Unknown') AS "userName",
          c.company_name AS "companyName",
          c.address_country AS "companyCountry",
          c.company_stage AS "companyStage",
          scl.log_date AS "logDate",
          scl.log_time AS "logTime",
          scl.activity_type AS "activityType",
          scl.call_type AS "callType",
          scl.call_outcome AS "callOutcome",
          scl.contact_person_name AS "contactPersonName",
          scl.contact_phone AS "contactPhone",
          scl.contact_email AS "contactEmail",
          scl.products_discussed AS "productsDiscussed",
          scl.interest_level AS "interestLevel",
          scl.buyer_response AS "buyerResponse",
          scl.buyer_requirement AS "buyerRequirement",
          scl.discussion_summary AS "discussionSummary"
        FROM sales_call_logs scl
        LEFT JOIN users u ON scl.user_id = u.id
        LEFT JOIN companies c ON scl.company_id = c.id
        ${whereClause}
        ORDER BY scl.user_id ASC, scl.log_date DESC
      `);
      const rows = result.rows as any[];

      const activityLabels: Record<string, string> = {
        cold_call: "Cold Call", warm_call: "Warm Call",
        cold_email: "Cold Email", warm_email: "Warm Email",
        enquiry_email: "Enquiry Email", reply_email: "Reply Email",
      };

      // Build workbook: one sheet per staff + one "All Staff" sheet
      const wb = xlsx.utils.book_new();

      const toRow = (r: any) => ({
        "Log ID": r.logId,
        "Staff Name": r.userName,
        "Company Name": r.companyName || "",
        "Country": r.companyCountry || "",
        "Company Stage": r.companyStage || "",
        "Date": r.logDate || "",
        "Time": r.logTime || "",
        "Activity Type": activityLabels[r.activityType] || r.activityType,
        "Call Sub-Type": r.callType || "",
        "Outcome": r.callOutcome || "",
        "Contact Person": r.contactPersonName || "",
        "Contact Phone": r.contactPhone || "",
        "Contact Email": r.contactEmail || "",
        "Products Discussed": Array.isArray(r.productsDiscussed) ? r.productsDiscussed.join(", ") : "",
        "Interest Level": r.interestLevel || "",
        "Buyer Response": r.buyerResponse || "",
        "Buyer Requirement": r.buyerRequirement || "",
        "Discussion Summary / Notes": r.discussionSummary || "",
      });

      // All Staff sheet
      const allSheet = xlsx.utils.json_to_sheet(rows.map(toRow));
      xlsx.utils.book_append_sheet(wb, allSheet, "All Staff");

      // Per-staff sheets
      const byStaff = new Map<string, typeof rows>();
      for (const row of rows) {
        const name = (row.userName || "Unknown").slice(0, 28);
        if (!byStaff.has(name)) byStaff.set(name, []);
        byStaff.get(name)!.push(row);
      }
      for (const [name, staffRows] of byStaff) {
        const sheet = xlsx.utils.json_to_sheet(staffRows.map(toRow));
        xlsx.utils.book_append_sheet(wb, sheet, name);
      }

      const buffer = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
      const today = new Date().toISOString().slice(0, 10);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="sales_activity_log_${today}.xlsx"`);
      res.send(buffer);
    } catch (error) {
      console.error("Error exporting sales logs:", error);
      res.status(500).json({ message: "Failed to export logs" });
    }
  });

  // ========================================
  // DOCUMENT UPLOAD ROUTES (Super Admin only)
  // ========================================

  // Get presigned URL for direct S3 upload
  app.post("/api/documents/presign", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'super_admin') {
        return res.status(403).json({ message: "Only Super Admin can upload documents." });
      }

      const { fileName, contentType = 'application/octet-stream' } = req.body;
      if (!fileName) {
        return res.status(400).json({ message: "fileName is required" });
      }

      const ext = fileName.includes('.') ? fileName.split('.').pop() : 'bin';
      const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const s3Key = `documents/${Date.now()}-${safeName}`;

      const presignedUrl = await generateDocumentPresignedUrl(s3Key, contentType);
      const cdnUrl = getDocumentPublicUrl(s3Key);

      res.json({ presignedUrl, s3Key, cdnUrl });
    } catch (error) {
      console.error("Error generating document presigned URL:", error);
      res.status(500).json({ message: "Failed to generate upload URL" });
    }
  });

  // Save document metadata after upload
  app.post("/api/documents", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'super_admin') {
        return res.status(403).json({ message: "Only Super Admin can save documents." });
      }

      const validated = insertUploadedDocumentSchema.parse(req.body);
      const doc = await storage.createUploadedDocument({
        ...validated,
        uploadedBy: req.user.claims.sub,
      });
      res.status(201).json(doc);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error saving document:", error);
      res.status(500).json({ message: "Failed to save document" });
    }
  });

  // List all uploaded documents
  app.get("/api/documents", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'super_admin') {
        return res.status(403).json({ message: "Only Super Admin can view documents." });
      }

      const docs = await storage.getUploadedDocuments();
      res.json(docs);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  // Delete a document
  app.delete("/api/documents/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'super_admin') {
        return res.status(403).json({ message: "Only Super Admin can delete documents." });
      }

      const doc = await storage.getUploadedDocument(parseInt(req.params.id));
      if (!doc) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Try to delete from documents bucket if s3Key exists
      if (doc.s3Key) {
        try {
          await deleteDocumentFromS3(doc.s3Key);
        } catch (s3Error) {
          console.warn("S3 delete failed (key may not exist):", s3Error);
        }
      }

      await storage.deleteUploadedDocument(parseInt(req.params.id));
      res.json({ message: "Document deleted successfully" });
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // Generate QR code for a document
  app.get("/api/documents/:id/qr-code", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'super_admin') {
        return res.status(403).json({ message: "Only Super Admin can generate QR codes." });
      }

      const doc = await storage.getUploadedDocument(parseInt(req.params.id));
      if (!doc) {
        return res.status(404).json({ message: "Document not found" });
      }

      const qrDataUrl = await QRCode.toDataURL(doc.fileUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      res.json({ qrCodeDataUrl: qrDataUrl, documentId: doc.id, fileUrl: doc.fileUrl });
    } catch (error) {
      console.error("Error generating QR code:", error);
      res.status(500).json({ message: "Failed to generate QR code" });
    }
  });

  // Register HR Management routes
  app.use(hrRoutes);

  const httpServer = createServer(app);
  return httpServer;
}
