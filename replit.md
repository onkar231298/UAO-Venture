# BFI Organic B2B Platform

## Overview
This platform is a comprehensive B2B solution for organic products, featuring a customer-facing e-commerce website and a role-based internal CRM system. Its primary purpose is to facilitate product discovery, streamline inquiry management, and support end-to-end business operations across various departments. The platform aims to simplify B2B transactions for organic products.

## Recent Changes (December 5, 2025)
- **Digital Signature Image Upload**: Added digital signature image upload feature to email configuration management. Features include:
  - Signature image upload in admin email settings (Settings > Email Configuration)
  - Recommended dimensions: 300x100px (max 400x150px)
  - Client-side dimension validation with user-friendly error messages
  - File type validation (PNG, JPG, GIF) and size limit (2MB max)
  - Signature preview with remove option
  - Purple "Signature Added" badge on email configs with signatures
  - Signature button to manage signatures per email configuration

- **Professional Rich Text Email Composer**: Enhanced email composition with TipTap editor. Features include:
  - Full formatting toolbar: bold, italic, underline, strikethrough
  - Text highlighting (6 colors) and text color selection (8 colors)
  - Bullet and numbered lists, text alignment options
  - Block quotes, horizontal rules, link insertion/removal
  - Undo/Redo functionality
  - File attachments (multiple files, max 25MB each)
  - Email threading with "Reply to existing thread" or "Start new thread" toggle
  - "View Complete Email" dialog and "Reply" buttons in email history

## Recent Changes (December 4, 2025)
- **Email Integration for Lead Management**: Added comprehensive email communication system within Lead Detail Dialog. Features include:
  - Email tab in Lead Detail Dialog showing full email history (sent/received)
  - Compose email functionality with To, CC, Subject, and Message fields
  - Pre-populated recipient from lead contact email
  - Email thread tracking linked to leads and companies
  - Activity logging for all email communications
- **Admin Email Configuration Management**: New Settings page for managing company email addresses. Features include:
  - Admin interface to configure email addresses for sales team users
  - Assign company email addresses to specific users (sales managers, executives)
  - Display name configuration for sent emails
  - Primary email and active status toggles
  - Gmail API integration setup instructions
- **Database Schema for Email**: Added three new tables: `user_email_configs` (user-to-email mapping), `email_threads` (conversation grouping), `email_messages` (individual emails with direction, status, attachments)
- **Sales Manager RBAC Fix**: Fixed critical bug where Sales Managers could see all organization leads. Now properly filters to show only leads assigned to themselves and their sales executives using the `salesManager` field.

## Recent Changes (November 12, 2025)
- **Quotation Status Badges in Admin Inquiry List**: Added color-coded quotation status badges to admin inquiry list view for at-a-glance visibility. Modified backend getInquiries method to use LATERAL join to efficiently fetch latest quotation status for each inquiry. Displays green "Quote Accepted", red "Quote Rejected", or blue "Quote Sent" badges directly in the inquiry list, eliminating need to open details dialog to check status. Properly typed latestQuotationStatus field through shared schema and API response types.
- **Quotation Status Visibility in Admin Inquiry Management**: Enhanced InquiryDetailsDialog to display customer quotation acceptance/rejection status with visual indicators (green for accepted, red for rejected, blue for sent, gray for expired). Added API endpoint GET /api/inquiries/:id/quotations to fetch quotation data, updated storage interface to support inquiryId filtering, and implemented loading states for better UX. Admin can now instantly see if customer has accepted or rejected sent quotes directly in the inquiry details view.
- **Customer Notes Field**: Added `notes` field to inquiries table to capture and display customer additional notes in admin inquiry view
- **PDF Amount in Words**: Enhanced quotation PDF generator with currency-aware number-to-words conversion supporting multiple currencies (USD/INR/EUR/GBP/AUD/CAD/SGD/AED/SAR) with correct fractional units (cents/paise/pence/fils/halalas) and safety checks for invalid amounts
- **Lead Conversion Data Transfer**: Fixed lead conversion from regular inquiries to properly fetch and transfer quotation total amount to CRM lead expectedOrderValue field
- **Activity Logging**: Verified comprehensive activity logging for lead assignments and stage changes (assignLead and updateLeadStage methods create proper activity entries)
- **Detailed Customer Address Collection**: Enhanced customer registration to collect complete address details (street address, city, state/province, postal code) for accurate quotation generation. Updated users table schema, registration form UI, and quotation PDF generator with backward compatibility for existing records.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Technology Stack**: React with TypeScript, Vite, Wouter for routing, TanStack Query for state management.
- **Styling**: Tailwind CSS for utility-first styling, shadcn/ui for pre-built components leveraging Radix UI primitives.
- **Responsiveness**: Mobile-first approach with full responsiveness.
- **UI/UX Decisions**: Custom color scheme, accessible UI components, optimized image loading, dynamic hero slider, three-column category navigation, consistent product card design.
- **Admin Navigation**: Clean sidebar structure with Sales Management as parent category containing Customer Inquiries, Sample Requests, High Volume Bids, Quote Negotiations, Lead Management, and Customer Management (renamed from Company Management for clarity).

### Backend Architecture
- **Technology Stack**: Express.js with TypeScript.
- **API**: RESTful API.
- **Authentication**: Session-based authentication using Replit's OpenID Connect, supporting role-based access control (RBAC).
- **Project Structure**: Clear separation between `client/`, `server/`, `shared/` types, and `migrations/`.

### Database Layer
- **Database**: PostgreSQL.
- **ORM**: Drizzle ORM for type-safe database operations.
- **Schema Design**: Comprehensive tables for products, users, orders, inventory, and CRM entities.
- **Performance**: Optimized with performance indexes, PostgreSQL full-text search, and optimized queries.

### Key Modules and Features
- **Product Management**: Upload, categorization, SEO metadata, specifications, visibility, MOQ, packaging, bulk upload.
- **User & Role Management**: Replit Auth integration, comprehensive RBAC from Super Admin to departmental roles.
- **Sales & CRM**: Comprehensive B2B Lead Management System with a 15-stage sales pipeline, company-centric design, drag-and-drop Kanban board, activity timeline, lead detail dialog, and role-based access control. Includes robust lead generation from high-volume bids and quotation conversions.
- **Purchase Management**: Purchase order system, vendor management, PO tracking.
- **Inventory Management**: Stock tracking (batch/lot, expiry, location), stock level monitoring.
- **Logistics Management**: Inventory visibility, dispatch tracking.
- **SEO & Structured Data**: Meta titles, descriptions, SEO-friendly URLs, structured data (JSON-LD), OpenGraph support, 301 redirects, sitemap generation, and server-side SEO middleware for marketing pages. Includes solutions for Google indexing issues (Soft 404s, "Crawled - not indexed", sitelinks, www to non-www redirects).
- **Category Management**: CRUD operations for product categories with admin interface, auto-generated SEO-friendly slugs, soft delete.
- **Admin Dashboard**: APIs for analytics and data aggregation.
- **Website Navigation & Filtering**: Advanced multi-faceted product filtering with URL parameter support and dynamic ingredients navigation.
- **Security & Verification**: Google reCAPTCHA v3 integration for customer registration.

### Business Logic
- **B2B Platform**: Designed for comprehensive B2B operations.
- **CRM Workflow**: Manages the entire inquiry-to-order lifecycle with a company-centric approach.
- **Multi-department Operations**: Facilitated by role-based access.
- **Document Management**: Supports certificates, specifications, and compliance documents.

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