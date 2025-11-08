# BFI Organic B2B Platform

## Overview
This platform is a comprehensive B2B solution for organic products, integrating a customer-facing e-commerce website with a role-based internal CRM system. Its core purpose is to facilitate product discovery, streamline inquiry management, and support end-to-end business operations across various departments. The platform aims to simplify B2B transactions for organic products.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Updates (October-November 2025)

### High Volume Bid Admin Workflow Simplification (November 8, 2025)
- **Business Decision**: Removed "Reject Bid" functionality entirely from admin interface
- **Rationale**: Admins must respond to high-volume bids by either approving them (creating CRM lead) or counter-offering with revised quote - no reject option needed
- **Changes Made**:
  1. Removed reject mutation, state variables, and UI from HighVolumeBidsPage.tsx
  2. Removed reject mutation, button, and rejection form from HighVolumeBidDetailsDialog.tsx
  3. Fixed TypeScript error in approve mutation (JSON.stringify body)
  4. Fixed "View Full Details" button to open HighVolumeBidDetailsDialog instead of navigating to non-existent route
  5. Added query invalidation for `/api/admin/high-volume-bids` to both approve and revised quote mutations
- **Current Admin Actions**: Only two actions available - "Approve Bid & Create Lead" and "Give Revised Quote" (counter offer)
- **Expected Outcomes**:
  - ✅ Simplified admin workflow with only constructive actions
  - ✅ Admin bids list auto-refreshes after approve/revise actions
  - ✅ View Full Details dialog shows complete bid information
  - ✅ No TypeScript errors in bid management pages

### Critical Routing Fix for Product Structured Data (November 3, 2025)
- **Issue**: Product pages on bright-organic.com were not serving structured data despite correct code in server
- **Root Cause**: Duplicate SPA fallback middleware at line 1168 in server/index.ts was catching ALL requests (except /api/) BEFORE product handler could run
- **Symptoms**: 
  - Google Rich Results Test showed "No items detected"
  - curl showed base index.html being served for all product URLs  
  - Express WAS running (x-powered-by header present) but middleware wasn't executing
  - No `[SEO Check]` logs appearing in production
- **Solution**: Removed duplicate SPA fallback middleware that competed with serveStatic()
- **Technical Details**:
  - Product handlers at line 857 were registered but never reached due to earlier catch-all
  - serveStatic() already provides proper SPA fallback via vite.ts line 82-84
  - Removed redundant middleware to allow proper route matching order
  - Now requests flow: product handlers → API routes → serveStatic catch-all
- **Expected Outcome**:
  - ✅ Product pages serve full structured data on deployed URLs
  - ✅ Google Rich Results Test detects Product schema
  - ✅ Server-side SEO injection works for all crawlers
  - ✅ Production deployment serves correct HTML with metadata

### Google Search Console Fixes (November 3, 2025)
- **Issues Fixed**:
  1. 404 errors on www subdomain (www.bright-organic.com returning 404)
  2. 404 errors on legacy /product/ URLs
  3. Noindex tags blocking search engines from indexing important pages
- **Solutions Implemented**:
  1. Added www to non-www redirect middleware with X-Forwarded-Proto support for proxy SSL termination
  2. Existing /product/:slug to /products/:slug 301 redirect confirmed working
  3. Removed all noindex tags from SearchResults.tsx, Products.tsx, and CategoryPage.tsx
- **Technical Details**:
  - www redirect positioned BEFORE registerRoutes to prevent redirect loops
  - Protocol detection handles comma-separated X-Forwarded-Proto headers (multi-proxy deployments)
  - Legitimate 404 pages still use noindex (category/ingredient not found pages)
  - Search pages, filtered product pages, and category pages now fully indexable
- **Expected Outcomes**:
  - ✅ www.bright-organic.com properly redirects to bright-organic.com with 301
  - ✅ Legacy /product/ URLs redirect to /products/ 
  - ✅ Search Console noindex errors eliminated
  - ✅ Improved crawl and index coverage in Google Search Console

### Product Structured Data Fix (October 29, 2025)
- **Issue**: Google Structured Data test was failing for product pages on live website with "No items detected" error
- **Root Causes**: 
  1. `/products` was accidentally added to marketingRoutes array, creating routing conflicts with `/products/:slug` handlers
  2. Bot detection logic was too restrictive and not catching Google's Rich Results Test tool
  3. HTML injection was using string literal `'</head>'` which failed to match the actual HTML template's `  </head>` (with whitespace)
- **Solution**: Three-part fix:
  1. Removed `/products` from marketingRoutes array to prevent interference with individual product page structured data
  2. Simplified structured data injection to work for ALL requests on deployed URLs (not just detected bots)
  3. Fixed HTML injection to use regex `/\s*<\/head>/` that handles whitespace before closing head tag
- **Technical Details**: 
  - `/products` listing page already has proper SEO via listingPagesSEO handler with CollectionPage schema
  - `/products/:slug` product detail pages have dedicated structured data handlers with full Product schema, breadcrumbs, FAQs, organization schema
  - Removed complex bot detection heuristics that were failing to catch Google's testing tools
  - Now: all requests to deployed URLs (bright-organic.com) receive full structured data injection
  - Non-deployed URLs (localhost, dev) still use React client-side rendering
  - Regex-based HTML replacement ensures injection works regardless of HTML formatting/whitespace
- **Expected Outcome**: 
  - ✅ Google Structured Data test passes for all product pages
  - ✅ Google Rich Results Test properly detects Product schema
  - ✅ Product schema with pricing, availability, reviews, and other details visible to all search engines
  - ✅ No negative impact on regular users (browsers ignore JSON-LD scripts)

## System Architecture

### Frontend Architecture
- **Technology Stack**: React with TypeScript, Vite for fast builds, Wouter for routing, TanStack Query for state management.
- **Styling**: Tailwind CSS for utility-first styling, shadcn/ui for pre-built components leveraging Radix UI primitives.
- **Responsiveness**: Mobile-first approach with full responsiveness across devices.
- **UI/UX Decisions**: Custom color scheme, accessible UI components, optimized image loading, dynamic hero slider, three-column category navigation, consistent product card design.
- **Product Card Architecture**: Unified component structure ensuring consistent layouts and styling for all product types (single products and product groups with variants).

### Backend Architecture
- **Technology Stack**: Express.js with TypeScript.
- **API**: RESTful API for all CRUD operations.
- **Authentication**: Session-based authentication using Replit's OpenID Connect, supporting role-based access control (RBAC).
- **Project Structure**: Clear separation between `client/`, `server/`, `shared/` types, and `migrations/`.

### Database Layer
- **Database**: PostgreSQL as the primary database.
- **ORM**: Drizzle ORM for type-safe database operations.
- **Schema Design**: Comprehensive tables designed for all major modules (products, users, orders, inventory, CRM entities).
- **Performance**: Optimized with performance indexes, PostgreSQL full-text search, and optimized queries.

### Key Modules and Features
- **Product Management**: Upload, categorization, SEO metadata, specifications, visibility controls, MOQ, packaging, bulk upload.
- **User & Role Management**: Replit Auth integration, comprehensive role-based access control (RBAC) from Super Admin to departmental roles, customer registration.
- **Sales & CRM**: Comprehensive B2B Lead Management System with a 15-stage sales pipeline, company-centric design, drag-and-drop Kanban board, activity timeline, lead detail dialog, and role-based access control.
- **Purchase Management**: Purchase order system, vendor management, PO tracking.
- **Inventory Management**: Stock tracking (batch/lot, expiry, location), stock level monitoring, stock reduction on dispatch.
- **Logistics Management**: Inventory visibility, dispatch tracking.
- **SEO & Structured Data**: Meta titles, descriptions, SEO-friendly URLs, structured data (JSON-LD), OpenGraph support, 301 redirects, sitemap generation, and server-side SEO middleware for marketing pages. Includes comprehensive solutions for Google indexing issues (Soft 404s, "Crawled - not indexed", sitelinks).
- **Category Management**: CRUD operations for product categories with admin interface, auto-generated SEO-friendly slugs, soft delete, dynamic loading, and image upload.
- **Admin Dashboard**: APIs for analytics and data aggregation.
- **Website Navigation & Filtering**: Advanced multi-faceted product filtering with URL parameter support and dynamic ingredients navigation.
- **Homepage Elements**: Dynamic hero slider, enhanced product listings including "Most Popular Products", mobile-responsive featured products carousel.
- **Security & Verification**: Google reCAPTCHA v3 integration for customer registration.

### Business Logic
- **B2B Platform**: Designed for comprehensive B2B operations.
- **CRM Workflow**: Manages the entire inquiry-to-order lifecycle with a company-centric approach.
- **Multi-department Operations**: Facilitated by role-based access.
- **Document Management**: Supports certificates, specifications, and compliance documents.

### Data Flow
- **Public Website**: Handles product discovery, Replit Auth-based authentication, inquiry submission, and quotation responses.
- **CRM Workflow**: Provides role-based dashboards, supports inter-department communication, document management, and order processing.
- **API Structure**: Public APIs for listings, protected APIs for user/inquiry data, and role-specific APIs for admin functions.

### Deployment Strategy
- **Development**: Vite Dev Server for frontend, TSX for backend with file watching.
- **Production**: Vite for frontend bundle, ESBuild for backend, static asset serving.
- **Database Management**: Drizzle Kit for migrations, environment variables for configuration, SSL for security.
- **Environment Configuration**: Robust handling of environment variables with validation.
- **SPA Routing**: Production server configured with explicit SPA fallback middleware to handle client-side routing.

## External Dependencies

### Database
- **Neon PostgreSQL**: Serverless PostgreSQL database solution.

### Authentication
- **Replit OpenID Connect**: Third-party authentication provider integrated for user authentication.

### Development Tools
- **ESBuild**: Used for efficient production bundling of server-side code.
- **PostCSS**: Employed for CSS processing.
- **TypeScript**: Used across the entire stack for type checking and compilation.

### UI Libraries
- **Radix UI**: Provides accessible and unstyled component primitives.
- **Lucide React**: An icon library for various UI elements.
- **Date-fns**: Utilized for efficient date manipulation operations.