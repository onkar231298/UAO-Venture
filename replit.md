# BFI Organic B2B Platform

## Overview

This is a comprehensive B2B platform combining a customer-facing e-commerce website with a role-based internal CRM system, inspired by Green Jeeva. Its main purpose is to support product discovery, inquiry management, and complete business operations across multiple departments. The platform aims to streamline B2B transactions for organic products.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (January 2025)

### Product Type Selection System Implementation (Jan 8, 2025)
- **Feature**: Implemented comprehensive multiple product type selection system for B2B e-commerce
- **Issue**: User requirement for multiple product type selection (organic/conventional/wild crafted) without product duplication
- **Solution**: Created junction table-based product type system with primary type designation
- **Database Implementation**: 
  - Added `product_types` table with slug, description, color, icon, display order
  - Added `product_type_relations` junction table with primary type designation
  - Created unique constraints and performance indexes
  - Populated with default types: Organic, Conventional, Wild Crafted
- **Backend API**: 
  - Complete CRUD operations for product types (`/api/product-types`)
  - Product-type relationship management (`/api/products/:id/types`)
  - Enhanced product filtering by type using junction table queries
  - Updated `getProducts` method with proper type-based filtering
- **Frontend Components**:
  - `ProductTypesManager`: Admin interface for managing product types
  - `ProductTypeSelector`: Component for assigning types to products with primary designation
  - `ProductTypeDisplay`: Display component with icons and color coding
  - Updated Products page with dynamic product type filtering
- **Features**: Products can have multiple types with one designated as primary, clean URL filtering, no duplication
- **Data Migration**: Sample relationships created for testing (6 product-type assignments)
- **Date**: 2025-01-08

### Category Image Upload Fix (Jan 8, 2025)
- **Issue**: Category images uploaded but not displaying, object storage path mismatch
- **Root Cause**: Files uploaded to private directory but served from public search paths 
- **Solution**: Implemented dedicated public upload system for category images
- **Implementation**:
  - Added `getPublicObjectUploadURL()` method for public directory uploads
  - Created `/api/categories/upload` endpoint using public object storage
  - Updated `getObjectEntityFile()` to search public paths first, then private
  - Modified `normalizeObjectEntityPath()` to handle both public and private paths
  - Fixed frontend to use category-specific upload endpoint
- **Features**: Category images now properly upload to public directory and display correctly
- **Date**: 2025-01-08

### Multiple Categories Per Product Implementation (Jan 8, 2025)
- **Feature**: Implemented comprehensive many-to-many relationship between products and categories
- **Database**: Added `productCategoryRelations` junction table with primary category designation
- **Backend**: Complete API endpoints for managing product-category relationships
- **Implementation**: 
  - Junction table with unique constraint and performance indexes
  - Primary category designation (`isPrimary` boolean field)
  - Migration script populated 1456 existing product-category relationships
  - New storage methods: `getProductWithCategories`, `getProductsByCategory`, `addProductToCategory`, etc.
  - RESTful API endpoints for category relationship management
- **Features**: Products can belong to multiple categories while maintaining clean URL structure and preventing duplication
- **Data Integrity**: Migrated all existing single-category assignments as primary categories
- **Date**: 2025-01-08

### SEO URL Structure Optimization (Jan 8, 2025)
- **Issue**: Google Search Console showing indexing problems with category URLs
- **Root Cause**: Site using `/category/:slug` URLs while Google expects `/ingredients/:slug` structure
- **Solution**: Implemented comprehensive URL structure change for better SEO indexing
- **Implementation**: 
  - Changed primary routing from `/category/:slug` to `/ingredients/:slug`
  - Added 301 server-side redirects from old `/category/` URLs to new `/ingredients/` URLs
  - Updated all internal navigation links (Header, CategorySidebar, App routing)
  - Modified sitemap generation to use new URL structure
  - Fixed TypeScript errors in CategoryPage component (mainImage vs images property)
  - Maintained backward compatibility with client-side redirects
- **Features**: Better Google indexing, consistent URL structure, proper 301 redirects, updated sitemap
- **Date**: 2025-01-08

### Mobile-Responsive Featured Products Carousel (Jan 8, 2025)
- **Issue**: Featured Products carousel not mobile-friendly, inconsistent design with standard ProductCard components
- **Root Cause**: Fixed 4-column grid layout breaking on mobile, missing product type badges, extra description text
- **Solution**: Implemented fully responsive FeaturedCarouselSection with ProductCard-inspired design
- **Implementation**: 
  - Mobile: 1 product per row, Tablet: 2 products, Desktop: 4 products
  - Added OptimizedImage component with proper placeholders
  - Product type badges (Organic, Natural, etc.) instead of product IDs
  - Removed unnecessary description text for consistency
  - Hidden navigation arrows on mobile (single column doesn't need them)
  - Touch-friendly sizing and spacing
- **Features**: Responsive grid layout, product type badges, OptimizedImage, mobile-optimized navigation
- **Date**: 2025-01-08

### Featured Products Carousel Implementation (Jan 8, 2025)
- **Issue**: Featured Products section appearing as static grid instead of interactive carousel
- **Root Cause**: TypeScript errors in UI library components preventing React component mounting
- **Solution**: Created StandaloneFeaturedCarousel using pure React.createElement() approach
- **Implementation**: Bypassed complex UI dependencies with vanilla React approach, direct API integration
- **Features**: Horizontal scrolling carousel with navigation arrows, green gradient background, positioned above categories
- **Date**: 2025-01-08

## Recent Changes (January 2025)

### Google Rich Results Test Integration (Jan 8, 2025)
- **Issue**: Google Rich Results Test showing "No items detected" despite structured data injection
- **Root Cause**: Bot detection logic not recognizing Google's Rich Results testing tool user agents
- **Solution**: Enhanced bot detection with specific patterns for Google's testing tools
- **Implementation**: Added detection for Nexus 5X mobile testing, Chrome from Google domains, and referer-based detection
- **Features**: Selective structured data injection that serves SEO tools without interfering with regular user navigation
- **Date**: 2025-01-08

### Production SPA Routing Fix  
- **Issue**: Page refreshes on deployed app resulted in blank pages for product and other routes
- **Root Cause**: Production server wasn't properly handling SPA fallback routing  
- **Solution**: Added explicit SPA fallback middleware in `server/index.ts` for production environment
- **Implementation**: Routes excluding API endpoints now serve `index.html` for HTML requests, allowing React to handle client-side routing
- **Date**: 2025-01-07

## System Architecture

### Frontend Architecture
- **React + TypeScript**: Modern React application with TypeScript for type safety.
- **Vite**: Fast build tool and development server.
- **Wouter**: Lightweight client-side routing.
- **TanStack Query**: Server state management and caching.
- **Tailwind CSS**: Utility-first CSS framework.
- **shadcn/ui**: Pre-built component library with Radix UI primitives.

### Backend Architecture
- **Express.js**: Node.js web framework handling API routes.
- **TypeScript**: Full-stack type safety.
- **RESTful API**: Standard HTTP methods for CRUD operations.
- **Session-based Authentication**: Using Replit's OpenID Connect.

### Project Structure
- `client/`: Frontend React application.
- `server/`: Backend Express.js API.
- `shared/`: Shared types and schemas.
- `migrations/`: Database migration files.

### Key Modules and Features
- **Website Management**: Product management (upload, categories, SEO, specifications, visibility, MOQ, packaging).
- **User Management**: Role-based access control (Super Admin to various departmental Managers/Executives), customer registration, Replit Auth integration.
- **Sales Management & CRM**: Lead tracking, inquiry system, customer interaction, quotation creation, sales team assignment.
- **Purchase Management**: Purchase order system, vendor management, PO tracking.
- **Inventory Management**: Stock tracking (batch/lot, expiry, location), stock level monitoring.
- **Logistics Management**: Inventory visibility, dispatch tracking, stock reduction on dispatch.
- **SEO & Structured Data**: Meta titles, descriptions, SEO-friendly URLs, structured data, OpenGraph.
- **Category Management System**: CRUD for product categories, admin interface, auto-generated SEO-friendly slugs, soft delete, dynamic category loading.
- **Bulk Product Upload System**: Supports CSV/Excel, template download, comprehensive field mapping (required/optional fields), robust validation with error reporting, duplicate detection, all-or-nothing policy.
- **Admin Dashboard**: APIs ready for analytics and data aggregation.
- **Product Information Display**: Dynamic display of all product details (specifications, physical properties, storage, processing, FAQs).
- **Website Footer**: Comprehensive footer with company branding, categories, services, and contact information.
- **Advanced Product Filtering System**: Multi-faceted filtering on products page (category, materials, health support, origin, form, stock, price range, search), URL parameter support, responsive grid layout.
- **Hero Slider**: Dynamic, backend-integrated hero slider with themed imagery and links.
- **Dynamic Ingredients Navigation Menu**: Three-column category layout in header, dynamic loading, direct category filtering.
- **Category Image Management**: Image upload and display for categories, enhanced "Browse by Category" section.
- **Enhanced Homepage Product Listings**: Continuous product listing, "Most Popular Products" section, improved homepage flow.

### Authentication System
- **Replit Auth Integration**: OpenID Connect authentication.
- **Role-based Access Control**: Complete hierarchy with defined roles.
- **Session Management**: PostgreSQL session storage.

### Database Layer
- **Drizzle ORM**: Type-safe database operations.
- **PostgreSQL**: Primary database with performance optimization.
- **Schema Design**: Comprehensive tables for all major modules.
- **Performance Indexes**: Optimized indexes for filtering, search, and sorting operations.
- **Full-Text Search**: PostgreSQL full-text search for fast product search.
- **Query Optimization**: Native date functions, composite indexes, and optimized query patterns.

### UI Components
- **Component Library**: Full set of accessible UI components.
- **Form Handling**: React Hook Form with Zod validation.
- **Responsive Design**: Mobile-first approach with Tailwind.
- **Theme System**: Custom color scheme.

### Business Logic
- **Complete B2B Platform**: All major modules integrated.
- **CRM Workflow**: Inquiry to order lifecycle.
- **Multi-department Operations**: Role-based access.
- **Document Management**: Certificates, specifications, compliance.

### Data Flow
- **Public Website Flow**: Product discovery, authentication via Replit Auth, inquiry submission, quotation response.
- **CRM Workflow**: Role-based dashboards, inter-department communication, document management, order processing.
- **API Structure**: Public APIs for listings, protected for user/inquiry data, role-specific for admin functions.

### Deployment Strategy
- **Development**: Vite Dev Server for frontend, TSX for backend, file watching.
- **Production Build**: Vite for frontend bundle, ESBuild for backend, static asset serving.
- **Database Management**: Drizzle Kit for migrations, environment variables for configuration, SSL for security.
- **Environment Configuration**: PORT environment variable with fallback to 5000, critical environment validation on startup.
- **Deployment Fixes Applied (Jan 5, 2025)**: Fixed duplicate updateQuotation method in storage.ts, enhanced PORT environment variable handling with validation, added critical environment variables validation on server startup.

### Product Page Refresh Issue - FINAL RESOLUTION (Jan 8, 2025)
- **React Initialization**: Console shows "React main.tsx loading..." and "Mounting React app..." - React IS loading successfully
- **Server-Side Routing**: Added comprehensive SPA fallback routes for /product/*, /products, /category/*, etc.
- **Component Fixes**: Resolved TypeScript errors in ProductDetailBFI preventing proper rendering
- **Image Loading**: Fixed infinite console logging loop in SimpleHeroSlider component
- **Current Status**: React app initializes correctly, server routing configured, waiting for final visual rendering
- **User Requirement**: Maintain exact original React website design with working product page refresh
- **Next Step**: Ensure React components render visually after successful mounting

## External Dependencies

### Database
- **Neon PostgreSQL**: Serverless PostgreSQL database.

### Authentication
- **Replit OpenID Connect**: Third-party authentication provider.

### Development Tools
- **ESBuild**: Production bundling for server-side code.
- **PostCSS**: CSS processing.
- **TypeScript**: Type checking and compilation.

### UI Libraries
- **Radix UI**: Accessible component primitives.
- **Lucide React**: Icon library.
- **Date-fns**: Date manipulation utilities.