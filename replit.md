# BFI Organic B2B Platform

## Overview
This platform is a comprehensive B2B solution for organic products, integrating a customer-facing e-commerce website with a role-based internal CRM system. Its core purpose is to facilitate product discovery, streamline inquiry management, and support end-to-end business operations across various departments. The platform aims to simplify B2B transactions for organic products.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Updates (October 2025)

### Product Structured Data Fix (October 29, 2025)
- **Issue**: Google Structured Data test was failing for product pages on live website after sitelinks implementation
- **Root Cause**: `/products` was accidentally added to marketingRoutes array, creating routing conflicts with `/products/:slug` handlers that inject Product schema
- **Solution**: Removed `/products` from marketingRoutes array to prevent interference with individual product page structured data
- **Technical Details**: 
  - `/products` listing page already has proper SEO via listingPagesSEO handler with CollectionPage schema
  - `/products/:slug` product detail pages have dedicated structured data handlers with full Product schema, breadcrumbs, FAQs, organization schema
  - The conflict was preventing Google from seeing the rich Product schema for individual products
- **Expected Outcome**: Google Structured Data test now passes for product pages; Product schema with pricing, availability, and other details properly visible to search engines

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