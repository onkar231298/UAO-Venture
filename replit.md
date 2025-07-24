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

## Key Components

### Authentication System
- **Replit Auth Integration**: OpenID Connect authentication
- **Role-based Access Control**: Multiple user roles (customer, admin, sales, purchase, inventory, logistics, accounts, SEO, website managers)
- **Session Management**: PostgreSQL session storage with connect-pg-simple

### Database Layer
- **Drizzle ORM**: Type-safe database operations
- **PostgreSQL**: Primary database using Neon serverless
- **Schema Design**: Comprehensive tables for users, products, categories, inquiries, quotations, orders, and inventory

### UI Components
- **Component Library**: Full set of accessible UI components
- **Form Handling**: React Hook Form with Zod validation
- **Responsive Design**: Mobile-first approach with Tailwind
- **Theme System**: Custom color scheme with CSS variables

### Business Logic
- **Product Management**: Complete product catalog with categories, certifications, and documents
- **Inquiry System**: Customer inquiry workflow with quotation generation
- **Order Management**: Sales and purchase order processing
- **Inventory Tracking**: Stock management and monitoring

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