# BFI Organic B2B Platform

## Overview

This is a comprehensive B2B platform combining a customer-facing e-commerce website with a role-based internal CRM system, inspired by Green Jeeva. Its main purpose is to support product discovery, inquiry management, and complete business operations across multiple departments. The platform aims to streamline B2B transactions for organic products.

## User Preferences

Preferred communication style: Simple, everyday language.

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

### Critical Issues Resolved (Jan 8, 2025)
- **React Preamble Error**: Persistent @vitejs/plugin-react preamble detection error resolved with emergency app loader
- **Original Design Preserved**: emergency-app.js recreates exact original website view using vanilla JavaScript when React fails
- **Product Page Refresh**: All product URLs now work correctly on direct access and refresh
- **Visual Consistency**: Emergency app maintains identical styling and layout to original React design  
- **Real Data Integration**: Product pages fetch actual data from /api/products/slug/ endpoints
- **Comprehensive Fallback**: System detects React loading failure and seamlessly switches to working fallback
- **Multi-Page Support**: Homepage, product pages, and admin sections all work with original design
- **Status**: Product refresh functionality fully operational with exact original website appearance maintained

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