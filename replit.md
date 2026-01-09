# BFI Organic B2B Platform

## Overview
This platform is a comprehensive B2B solution for organic products, featuring a customer-facing e-commerce website and a role-based internal CRM system. Its primary purpose is to facilitate product discovery, streamline inquiry management, and support end-to-end business operations across various departments. The platform aims to simplify B2B transactions for organic products, managing the entire inquiry-to-order lifecycle with a company-centric approach. The business vision is to provide a robust, scalable platform that streamlines B2B organic product transactions, enhancing efficiency for both buyers and sellers and opening new market potentials.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Technology Stack**: React with TypeScript, Vite, Wouter for routing, TanStack Query for state management.
- **Styling**: Tailwind CSS for utility-first styling, shadcn/ui for pre-built components leveraging Radix UI primitives.
- **Responsiveness**: Mobile-first approach with full responsiveness.
- **UI/UX Decisions**: Custom color scheme, accessible UI components, optimized image loading, dynamic hero slider, three-column category navigation, consistent product card design.
- **Admin Navigation**: Clean sidebar structure with Sales Management as parent category containing Customer Inquiries, Sample Requests, High Volume Bids, Quote Negotiations, Lead Management, and Customer Management.

### Backend Architecture
- **Technology Stack**: Express.js with TypeScript.
- **API**: RESTful API.
- **Authentication**: Session-based authentication using Replit's OpenID Connect, supporting role-based access control (RBAC).
- **Project Structure**: Clear separation between `client/`, `server/`, `shared/` types, and `migrations/`.

### Database Layer
- **Database**: PostgreSQL.
- **ORM**: Drizzle ORM for type-safe database operations.
- **Schema Design**: Comprehensive tables for products, users, orders, inventory, CRM entities, and email-related data (`user_email_configs`, `email_threads`, `email_messages`).
- **Performance**: Optimized with performance indexes, PostgreSQL full-text search, and optimized queries.

### Key Modules and Features
- **Product Management**: Upload, categorization, SEO metadata, specifications, visibility, MOQ, packaging, bulk upload.
- **User & Role Management**: Replit Auth integration, comprehensive RBAC from Super Admin to departmental roles.
- **Sales & CRM**: Comprehensive B2B Lead Management System with a 15-stage sales pipeline, company-centric design, drag-and-drop Kanban board, activity timeline, lead detail dialog, and role-based access control. Includes robust lead generation from high-volume bids and quotation conversions. Features include:
    - **Email Integration**: Full email history, compose functionality, email thread tracking, activity logging, RFC Email Threading, Per-User Gmail OAuth, unread email badges, attachment handling, digital signature upload, and a professional rich text editor.
    - **Quotation Management**: Status badges, visibility of customer acceptance/rejection, PDF generation with "amount in words" functionality.
    - **Customer Notes**: Field for capturing additional customer notes.
    - **Detailed Customer Address**: Collection of complete address details during registration for accurate quotation.
    - **Frejun Voice Integration**: VoIP calling via Frejun Dialer Widget (iframe-based), OAuth 2.0 authentication, network-based 2-legged calls, call logging, voicemail management, and webhook-based call status updates. Replaces previous Net2Phone integration.
- **Purchase Management**: Purchase order system, vendor management, PO tracking.
- **Inventory Management**: Stock tracking (batch/lot, expiry, location), stock level monitoring.
- **Logistics Management**: Inventory visibility, dispatch tracking.
- **SEO & Structured Data**: Meta titles, descriptions, SEO-friendly URLs, structured data (JSON-LD), OpenGraph support, 301 redirects, sitemap generation, and server-side SEO middleware for marketing pages.
- **Category Management**: CRUD operations for product categories with admin interface, auto-generated SEO-friendly slugs, soft delete.
- **Admin Dashboard**: APIs for analytics and data aggregation.
- **Website Navigation & Filtering**: Advanced multi-faceted product filtering with URL parameter support and dynamic ingredients navigation.
- **Security & Verification**: Google reCAPTCHA v3 integration for customer registration.

### Bulk Email Campaigns (SendGrid Integration)
**Status**: Implemented
**Approach**: Hybrid model using SendGrid for sending + Gmail OAuth for receiving replies
**Features**:
- Bulk email sending from My Companies page via "Bulk Email" button
- Company selection with checkboxes and "Select All" functionality
- Role-based access: Admin can email all companies, Sales agents can only email their assigned companies
- Rich text email composer with variable substitution ({{contact_name}}, {{company_name}}, {{email}})
- Email templates for reusable content
- Scheduled sending with date/time picker
- Campaign delivery reports dashboard (sent, delivered, opened, bounced)
- Replies sync via existing Gmail OAuth integration to CRM activity timeline
- Zod validation for all campaign/template endpoints
- Optional webhook signature verification (configure SENDGRID_WEBHOOK_VERIFICATION_KEY)

**Database Tables**: email_campaigns, email_campaign_recipients, email_templates
**API Endpoints**: /api/email-campaigns, /api/email-templates, /api/webhooks/sendgrid

## Pending Features (To Be Continued)

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