# BFI Organic B2B Platform

## Overview
This platform is a comprehensive B2B solution for organic products, integrating a customer-facing e-commerce website with a role-based internal CRM system. Inspired by Green Jeeva, its core purpose is to facilitate product discovery, streamline inquiry management, and support end-to-end business operations across various departments. The platform aims to simplify B2B transactions for organic products.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Critical Fixes (January 2025)
- **Product Card Consistency Issue Resolved**: Fixed mobile layout inconsistency where ProductGroupCard (for products with variants) showed different styling than ProductCard (single products). Both components now use identical structures with the same Link wrapper, CardContent sections, button layouts, and responsive classes. This ensures all products display uniformly regardless of whether they have variants.
- **Architecture Decision**: ProductGroupCard completely rebuilt to match ProductCard structure instead of maintaining separate layouts. This prevents future inconsistencies when new products are uploaded, as both single products and product groups now use the same rendering logic.
- **Google Indexing Solution (January 21, 2025)**: Diagnosed and fixed "164 discovered pages not indexed" issue by implementing comprehensive internal linking strategy, adding Industries navigation menu, homepage industry cards, and enhanced sitemap optimization to accelerate Google's indexing process for B2B industry-specific pages.
- **Google Sitelinks SEO Enhancement (January 2025)**: Implemented comprehensive structured data improvements to help Google display sitelinks (sub-pages beneath main search result) similar to competitor websites. Added SiteNavigationElement schema defining 8 key pages hierarchy, enhanced Organization schema with hasOfferCatalog and subOrganization signals, updated sitemap with Certifications and Blog pages, and ensured all key pages have optimized meta descriptions. These enhancements provide Google with clear site structure signals to improve search result appearance and increase click-through rates.
- **Soft 404 Errors Fix (January 2025)**: Resolved critical issue where 238 pages were flagged as Soft 404 errors in Google Search Console. Problem: Server was returning HTTP 200 status for ALL URLs, including non-existent products/categories, causing Google to flag them as Soft 404s (empty content with 200 status). Solution: Implemented universal 404 validation middleware that runs BEFORE SEO middleware for `/products/:slug`, `/ingredients/:slug`, and `/health-support/:slug` routes. Now all requests (including those with query parameters like `?hl=en&gl=GB` from Google's international crawlers) receive proper 404 status codes when resources don't exist. Added noindex meta tags to 404 responses and empty result pages to prevent future indexing issues. Expected outcome: All 238 Soft 404 errors should resolve within 3-4 weeks as Google re-crawls the site.
- **"Crawled - Currently Not Indexed" Prevention (January 2025)**: Implemented comprehensive solution to prevent 227 "Crawled - currently not indexed" errors caused by low-value filter combinations and pagination URLs. Solution includes: (1) Enhanced robots.txt to block all filtered URLs (/products with query parameters like category=, origin=, form=, etc.), pagination parameters (page=, offset=), search results (/search with query params), and admin/test pages; (2) Added noindex meta tags to ALL pages with active filters or pagination (page > 1) in Products, SearchResults, and CategoryPage components; (3) Verified canonical tags are properly implemented via useSEO hook for all pages. This multi-layered approach ensures Google only indexes valuable, unique content pages while ignoring low-value filtered/paginated variations that provide minimal SEO benefit.

## System Architecture

### Frontend Architecture
- **Technology Stack**: React with TypeScript, Vite for fast builds, Wouter for routing, TanStack Query for state management.
- **Styling**: Tailwind CSS for utility-first styling, shadcn/ui for pre-built components leveraging Radix UI primitives.
- **Responsiveness**: Mobile-first approach with full responsiveness across devices.
- **UI/UX Decisions**: Custom color scheme, accessible UI components, OptimizedImage for performance, dynamic hero slider, three-column category navigation, consistent product card design.
- **Product Card Architecture**: Unified component structure where ProductCard and ProductGroupCard use identical layouts, styling, and responsive behavior. Both components share the same Link wrapper, CardContent sections, button layouts, and mobile breakpoints to ensure consistent user experience across all product types.

### Backend Architecture
- **Technology Stack**: Express.js with TypeScript.
- **API**: RESTful API for all CRUD operations.
- **Authentication**: Session-based authentication using Replit's OpenID Connect, supporting role-based access control (RBAC).
- **Project Structure**: Clear separation between `client/`, `server/`, `shared/` types, and `migrations/`.

### Database Layer
- **Database**: PostgreSQL as the primary database.
- **ORM**: Drizzle ORM for type-safe database operations.
- **Schema Design**: Comprehensive tables designed for all major modules (products, users, orders, inventory, etc.).
- **Performance**: Optimized with performance indexes for filtering, search, and sorting; PostgreSQL full-text search for fast product searches; optimized queries using native date functions and composite indexes.

### Key Modules and Features
- **Product Management**: Upload, categorization (multiple categories per product with primary designation), SEO metadata, specifications, visibility controls, MOQ, packaging. Includes a bulk product upload system with robust validation.
- **User & Role Management**: Replit Auth integration, comprehensive role-based access control (Super Admin to various departmental roles), customer registration.
- **Sales & CRM**: Lead tracking, inquiry system, customer interaction, quotation creation, sales team assignments.
- **Purchase Management**: Purchase order system, vendor management, PO tracking.
- **Inventory Management**: Stock tracking (batch/lot, expiry, location), stock level monitoring, stock reduction on dispatch.
- **Logistics Management**: Inventory visibility, dispatch tracking.
- **SEO & Structured Data**: Meta titles, descriptions, SEO-friendly URLs (`/ingredients/:slug`), structured data (JSON-LD), OpenGraph support, 301 redirects for URL changes, sitemap generation.
- **Category Management**: CRUD operations for product categories with admin interface, auto-generated SEO-friendly slugs, soft delete, dynamic loading. Includes image upload and display.
- **Admin Dashboard**: APIs ready for analytics and data aggregation.
- **Product Information Display**: Dynamic display of comprehensive product details (specifications, physical properties, storage, processing, FAQs).
- **Website Navigation & Filtering**: Advanced multi-faceted product filtering (category, materials, health support, origin, form, stock, price range, search) with URL parameter support. Dynamic ingredients navigation menu.
- **Homepage Elements**: Dynamic hero slider, enhanced product listings including "Most Popular Products", mobile-responsive featured products carousel.
- **Security & Verification**: Google reCAPTCHA v3 integration for customer registration with invisible verification, score-based protection, and graceful fallback for development environments.
- **Unified Product Cards**: Consistent product card rendering across all product types (single products and product groups with variants) using identical layout structures, ensuring uniform appearance in all views including mobile responsiveness.

### Business Logic
- **B2B Platform**: Designed for comprehensive B2B operations with integrated modules.
- **CRM Workflow**: Manages the entire inquiry-to-order lifecycle.
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
- **Environment Configuration**: Robust handling of environment variables (e.g., PORT) with validation on startup.
- **SPA Routing**: Production server configured with explicit SPA fallback middleware to handle client-side routing for direct access to application routes (e.g., product pages).

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
- **Radix UI**: Provides accessible and unstyled component primitives for building robust UI.
- **Lucide React**: An icon library for various UI elements.
- **Date-fns**: Utilized for efficient date manipulation operations.