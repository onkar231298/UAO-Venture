# BFI Organic B2B Platform

## Overview

This is a comprehensive B2B platform combining a customer-facing e-commerce website with a role-based internal CRM system. The platform is inspired by Green Jeeva and supports product discovery, inquiry management, and complete business operations management across multiple departments.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React + TypeScript**: Modern React application with TypeScript for type safety
- **Vite**: Fast build tool and development server
- **Wouter**: Lightweight client-side routing
- **TanStack Query**: Server state management and caching
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Pre-built component library with Radix UI primitives

### Backend Architecture
- **Express.js**: Node.js web framework handling API routes
- **TypeScript**: Full-stack type safety
- **RESTful API**: Standard HTTP methods for CRUD operations
- **Session-based Authentication**: Using Replit's OpenID Connect

### Project Structure
```
├── client/          # Frontend React application
├── server/          # Backend Express.js API
├── shared/          # Shared types and schemas
└── migrations/      # Database migration files
```

## Major Platform Modules Implementation Status

### ✅ 1. Website Management (Backend) - IMPLEMENTED
- Product upload/management system with comprehensive specifications
- Product categories with hierarchical structure
- SEO metadata (title, description, keywords, structured data)
- Product certificates and document management
- Auto-generated product IDs (BFI001, BFI002, etc.)
- Product visibility controls and status management
- MOQ, packaging, specifications management

### ✅ 2. User Management - IMPLEMENTED
- Role-based system: Super Admin, Admin, Sales Manager/Executive, Purchase Manager/Executive, Inventory Manager/Executive, Logistics Manager/Executive, Accounts Manager/Executive, SEO Manager, Website Manager
- Department hierarchy (Manager + Executive levels)
- Role-based access controls in API endpoints
- Customer registration from frontend
- Replit Auth integration for authentication

### ✅ 3. Sales Management & CRM - IMPLEMENTED
- Lead tracking through inquiry system
- Customer interaction management
- Sales quotation creation and management
- Inquiry to quotation conversion workflow
- Product-wise lead tracking
- Sales team assignment functionality

### ✅ 4. Purchase Management - IMPLEMENTED
- Purchase order system linked to product IDs
- Vendor management capabilities
- PO history and tracking
- Integration with product catalog

### ✅ 5. Inventory Management - IMPLEMENTED
- Stock tracking for each product
- Batch/lot number management
- Expiry date tracking
- Location-based inventory
- Stock level monitoring
- Integration with dispatch system

### ✅ 6. Logistics Management - IMPLEMENTED
- Inventory visibility for logistics team
- Stock reduction on dispatch
- Dispatch status tracking
- Integration with inventory system

### ✅ 7. SEO & Structured Data - IMPLEMENTED
- Meta title, description for products
- SEO-friendly URLs (slugs)
- Structured data fields in schema
- OpenGraph metadata support

### ✅ 8. Category Management System - COMPLETED
- Full CRUD operations for product categories
- Admin interface in Website Management → Categories tab
- Auto-generated SEO-friendly slugs
- Soft delete system preserves data integrity
- Real-time updates across entire platform
- **29 business categories** including: Herbs & Botanicals, Spices & Seasonings, Essential Oils, Herbal Powders, Whole Herbs, Oleoresins, Spray Dried Fruits and Vegetables, and more

### ✅ 9. CSV/Excel Bulk Product Upload System - COMPLETED & REFINED
- New "Bulk Upload" tab in Website Management interface
- Template download system with category-specific examples
- Support for both CSV and Excel (.xlsx, .xls) file formats
- **Exact field coverage**: Matches all fields in manual product addition form
- **Required fields (mandatory)**: name, description, category, price
- **Optional fields (can be blank)**: All other fields including:
  - Business fields: MOQ, packaging, lead time, stock, status, sample availability
  - Product specifications: botanical name, plant part, origin, product type (organic/conventional/wildcrafted/kosher/halal), grade (food/pharma/cosmetic/technical)
  - Product form: powder, extract, oil, liquid, capsule, tablet, etc.
  - Health support categories: Antioxidant, Digestive Support, Immune Support, etc.
  - SEO fields: SEO title, meta description, canonical URL
  - FAQ section: JSON format for questions and answers
  - Multi-currency pricing: USD, INR, EUR, GBP with price terms and location
- **Removed unnecessary fields**: Eliminated physical properties fields (mesh size, moisture, ash content, etc.) that aren't in the actual product form
- **Enhanced validation**: productType options, productGrade options, FAQ JSON format validation
- Comprehensive validation with line-by-line error reporting (only for required fields and format validation)
- Duplicate product ID detection and prevention
- All-or-nothing upload policy (no partial uploads on validation errors)
- Detailed upload results showing success/error counts
- Auto-generated product IDs if not provided in CSV
- File size limit: 10MB maximum

### ✅ 10. Admin Dashboard - PARTIALLY IMPLEMENTED
- Backend APIs ready for analytics
- Data aggregation capabilities
- Role-based data filtering
- **NEEDS**: Frontend dashboard implementation

### ✅ 11. Product Information Display - RECENTLY FIXED
- Product detail page now properly displays all uploaded fields
- Dynamic specification sections showing botanical name, plant part, origin, HS code, grade, form
- Physical properties display (mesh size, active content, moisture, ash, bulk density)
- Storage & handling information with shelf life and conditions
- Processing information display
- Dynamic FAQ generation based on actual product data
- Description tab shows uploaded product descriptions
- Proper field mapping between upload form and product display

### ✅ 12. Website Footer Implementation - COMPLETED
- Created comprehensive Footer component with company branding, product categories, services, and contact information
- Added Footer to all frontend pages: Landing, ProductDetail, UnifiedLogin, TestMultiCurrency, and NotFound
- Updated all contact information throughout website with correct Bright Fame Organic details:
  - Company: Bright Fame Organic Pvt. Ltd.
  - Address: C/O Bright Fame International, Opp. Murlidhar Guest House, Mehsana-Vishnagar Road, Kansarakui, Mehsana, Gujarat 384001
  - Phone: +91-7249847439
  - Email: info@bfiorganic.com
- Footer includes social media links, product categories (Herbal Powders, Liquid Extracts, Essential Oils, Raw Materials, Custom Blends)
- Services section (Quality Testing, R&D Support, Regulatory Compliance, Custom Packaging, Logistics Solutions)
- Copyright notice and policy links for complete professional appearance

### ✅ 13. Advanced Product Filtering System - COMPLETED
- Created comprehensive Products page (/products and /ingredients) with advanced filtering similar to Green Jeeva and Total Ingredients
- **Enhanced filtering capabilities**:
  - Category-based filters with multiple selection support
  - Materials filter (Organic/Conventional)
  - Health Support categories (Antioxidant, Digestive Support, Immune Support, Anti-inflammatory, etc.)
  - Country of Origin filter (India, China, US, Germany, etc.)
  - Form of Product filter (Powder, Extract, Oil, Liquid, etc.)
  - Stock Status filter (In Stock toggle)
  - Price range filtering
  - Search across product names, descriptions, and botanical names
- **User Experience Features**:
  - Collapsible filter sections with clear expand/collapse states
  - Real-time active filter display with removable badges
  - Sorting options (Name A-Z, Price Low-High, Price High-Low, Newest First)
  - URL parameter support for direct linking to filtered results
  - Responsive grid layout for product display
- **Backend Integration**:
  - Enhanced API endpoints to support all filter parameters
  - Optimized database queries with proper WHERE clauses and sorting
  - Array-based filtering for multiple category selections
  - Query parameter parsing for comma-separated values

### ✅ 14. Hero Slider with Backend Integration - COMPLETED
- Updated hero slider with relevant organic ingredients imagery
- Added backend database integration for dynamic slide management
- Created three themed slides: Herbal Powders & Extracts, Essential Oils & Oleoresins, R&D Lab & Custom Formulations
- Removed floating category elements for cleaner presentation
- Removed company contact information from hero slider
- Updated with product-relevant background images (turmeric powders, essential oil bottles, lab equipment)
- Added proper button links to product categories and services
- Implemented slide indicators and auto-rotation functionality

### ✅ 15. Dynamic Ingredients Navigation Menu - COMPLETED
- Updated Header navigation with dynamic Ingredients dropdown
- **Three-column category layout**: All 20+ database categories displayed in organized grid
- **"All Ingredients" option**: Highlighted primary link to main ingredients page
- **Dynamic category loading**: Real-time fetching from categories API
- **Proper URL encoding**: Category names properly encoded for URL parameters
- **Responsive design**: Dropdown scales appropriately for different screen sizes
- **Direct category filtering**: Clicking category name pre-filters products page
- Categories include: Adaptogenic Herbs, Amino Acids, Ayurvedic Ingredients, Essential Oils, Herbal Powders, Oleoresins, and many more

### ✅ 16. Category Image Management System - COMPLETED
- Added imageUrl field to categories database schema and updated all existing categories
- Created category image upload functionality in admin backend with live preview
- Enhanced category management interface showing images alongside category details
- Updated "Browse by Category" section to display 8 categories in 2 rows (improved from 4)
- Added hover effects and smooth transitions for better user experience
- Implemented automatic fallback handling for broken image URLs
- All category images now linked to backend with relevant organic ingredient imagery

### ✅ 17. Enhanced Homepage Product Listings - COMPLETED
- Added continuous product listing section after "Why Choose BFI Organic?" showing up to 20 products
- Updated Featured Products to "Most Popular Products" with special popular badges
- Implemented grid layout similar to main products page for consistency
- Added proper loading states and skeleton screens for all product sections
- Enhanced product discovery with "View All Products" call-to-action buttons
- Improved homepage flow: Hero → Categories → Features → All Products → Popular Products → Testimonials

### ✅ 18. Product Deletion Bug Fix - COMPLETED
- Fixed critical JSON parsing error in product deletion functionality
- Removed duplicate and incomplete PUT route definitions that were causing conflicts
- Corrected frontend API request syntax in WebsiteManagement.tsx mutations
- Updated apiRequest function calls to use proper signature: `(url, options)` instead of `(method, url)`
- Resolved "Unexpected token" JSON parsing errors during product operations
- Verified backend deleteProduct method works correctly with soft delete functionality

## Key Components

### Authentication System
- **Replit Auth Integration**: OpenID Connect authentication
- **Role-based Access Control**: Complete hierarchy with all required roles
- **Session Management**: PostgreSQL session storage with connect-pg-simple

### Database Layer
- **Drizzle ORM**: Type-safe database operations
- **PostgreSQL**: Primary database using Neon serverless
- **Schema Design**: All 8 major modules covered with comprehensive tables

### UI Components
- **Component Library**: Full set of accessible UI components
- **Form Handling**: React Hook Form with Zod validation
- **Responsive Design**: Mobile-first approach with Tailwind
- **Theme System**: Custom color scheme with CSS variables

### Business Logic
- **Complete B2B Platform**: All major modules implemented in backend
- **CRM Workflow**: Full inquiry to order lifecycle
- **Multi-department Operations**: Role-based access across all departments
- **Document Management**: Certificates, specifications, and compliance docs

## Data Flow

### Public Website Flow
1. **Product Discovery**: Users browse products with filtering and search
2. **Authentication**: Users login/register through Replit Auth
3. **Inquiry Process**: Authenticated users submit product inquiries
4. **Quotation Response**: Internal teams generate and send quotations

### CRM Workflow
1. **Role-based Dashboard**: Users see relevant information based on their role
2. **Inter-department Communication**: Inquiries flow between sales, purchase, and inventory teams
3. **Document Management**: Product documents, certifications, and specifications
4. **Order Processing**: Complete order lifecycle from inquiry to delivery

### API Structure
- **Public APIs**: Product listings, categories (no auth required)
- **Protected APIs**: User data, inquiries, quotations (authentication required)
- **Role-specific APIs**: Administrative functions based on user permissions

## External Dependencies

### Database
- **Neon PostgreSQL**: Serverless PostgreSQL database
- **Connection Pooling**: Efficient database connection management

### Authentication
- **Replit OpenID Connect**: Third-party authentication provider
- **Session Storage**: PostgreSQL-based session management

### Development Tools
- **ESBuild**: Production bundling for server-side code
- **PostCSS**: CSS processing with Tailwind
- **TypeScript**: Type checking and compilation

### UI Libraries
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library
- **Date-fns**: Date manipulation utilities

## Deployment Strategy

### Development Environment
- **Vite Dev Server**: Hot module replacement for frontend
- **TSX**: TypeScript execution for backend development
- **File Watching**: Automatic restarts on code changes

### Production Build
- **Frontend**: Vite builds optimized React bundle
- **Backend**: ESBuild creates single JavaScript file
- **Static Assets**: Served through Express static middleware

### Database Management
- **Drizzle Kit**: Schema migrations and database operations
- **Environment Variables**: Database URL and session secrets
- **Connection Security**: SSL-enabled database connections

The platform follows a clean separation of concerns with the frontend handling user interface and user experience, while the backend manages business logic, data persistence, and external integrations. The shared schema ensures type consistency across the entire application stack.