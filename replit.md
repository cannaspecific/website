# CannaSpecific Landing Page

## Overview

CannaSpecific is a mission-driven cannabis data platform designed to connect lab reports (Certificates of Analysis) with real patient experiences. The project aims to end "Strain Roulette" by aggregating fragmented cannabis product data and linking chemical profiles (cannabinoids and terpenes) to actual user-reported effects. This landing page serves as the primary entry point for attracting contributors, partners, researchers, and supporters to join the community research project.

## Recent Changes (November 4, 2025)

**Project Status: Production-Ready ✅**

Successfully completed full-stack landing page implementation with the following features:

### Frontend Implementation
- ✅ Hero section with compelling messaging and dual CTAs (Join Movement, Learn Story)
- ✅ Problem Statement section highlighting industry challenges (3 problem cards)
- ✅ Founder Story section with authentic narrative and founder headshot
- ✅ Mission/Solution section with visual flow diagram and dual mission cards
- ✅ How It Works section showing 3-step contributor journey
- ✅ CTA Segments section targeting 4 audience types (Contributors, Partners, Researchers, Supporters)
- ✅ Multi-purpose Interest Form with comprehensive validation
- ✅ Community Banner with inspirational messaging
- ✅ Footer with branding, social links, and contact information

### Design Implementation
- ✅ Cannabis-green color palette (hue 150) with earth tones
- ✅ Custom typography system: Inter (body) and Space Grotesk (headings)
- ✅ Generated hero community image and founder headshot using AI
- ✅ All interactive elements tagged with data-testid attributes for testing
- ✅ All Buttons use proper shadcn size props (no custom padding violations)
- ✅ Responsive design with mobile-first approach
- ✅ Smooth scroll navigation between sections

### Backend Implementation
- ✅ POST /api/interests endpoint with Zod validation
- ✅ In-memory storage (MemStorage) for rapid prototyping
- ✅ Comprehensive error handling with user-friendly messages
- ✅ Full TypeScript type safety with shared schemas

### Testing & Quality Assurance
- ✅ End-to-end testing completed successfully (24 test steps passed)
- ✅ Form submission flow verified (loading states, success confirmation)
- ✅ Scroll navigation tested and working
- ✅ Architect review confirmed production-readiness
- ✅ Fixed icon import issues (migrated from react-icons/si to lucide-react)

### Key Technical Decisions
- Using in-memory storage for MVP (easy migration to PostgreSQL when needed)
- Lucide React icons for consistency and reliability
- All form validations handled client and server-side
- Multi-purpose form supporting 5 interest types with conditional messaging

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- **React 18** with TypeScript for type-safe component development
- **Vite** as the build tool and development server
- **Wouter** for lightweight client-side routing
- **TanStack Query (React Query)** for server state management and API data fetching

**UI Framework:**
- **shadcn/ui** component library built on Radix UI primitives
- **Tailwind CSS** for utility-first styling with custom design tokens
- **Custom theme system** using CSS variables for consistent colors, spacing, and typography

**Design System:**
- Typography: Inter (body) and Space Grotesk (headings) via Google Fonts CDN
- Spacing system based on Tailwind's 4/6/8/12/16/20/24/32 scale
- Responsive breakpoints: mobile-first approach with md/lg/xl breakpoints
- Color scheme: Neutral base with primary/secondary/accent variants supporting light/dark modes

**Component Architecture:**
- Modular landing page sections (Hero, Story, Problem, Mission, How It Works, CTA Segments, Interest Form, Community Banner, Footer)
- Reusable UI components from shadcn/ui library
- Form handling with React Hook Form and Zod validation
- Toast notifications for user feedback

### Backend Architecture

**Server Framework:**
- **Express.js** with TypeScript running on Node.js
- **ES Modules** (type: "module") for modern JavaScript syntax
- Custom middleware for request logging and JSON body parsing

**API Design:**
- RESTful endpoints with `/api` prefix
- POST `/api/interests` - Create new interest submissions
- GET `/api/interests` - Retrieve all interest submissions
- Standardized response format with success/error status and messages

**Data Validation:**
- **Zod schemas** for runtime type validation and data integrity
- Shared schema definitions between client and server (`@shared/schema`)
- Form validation integrated with React Hook Form resolver

**Development Setup:**
- Vite middleware integration for HMR in development
- Separate build processes for client (Vite) and server (esbuild)
- Environment-based configuration (NODE_ENV)

### Data Storage

**Database:**
- **PostgreSQL** (via Neon serverless driver) for production data storage
- **Drizzle ORM** for type-safe database operations and schema management
- Migration system using `drizzle-kit` with schema version control

**Storage Abstraction:**
- `IStorage` interface defining storage contract
- `MemStorage` in-memory implementation for development/testing
- Designed for easy swapping between storage backends

**Data Models:**
- **Users table**: Basic user authentication structure (id, username, password)
- **Interests table**: Captures visitor engagement data including:
  - Contact information (name, email, phone)
  - Interest type (contribute/partnership/research/donation/general)
  - Message content and newsletter subscription preference
  - Timestamp tracking

### External Dependencies

**Core Libraries:**
- `@neondatabase/serverless` - PostgreSQL database connection for serverless environments
- `drizzle-orm` and `drizzle-zod` - Type-safe ORM with Zod schema integration
- `@tanstack/react-query` - Asynchronous state management
- `react-hook-form` and `@hookform/resolvers` - Form state and validation
- `zod` - Schema validation library

**UI Component Libraries:**
- Multiple `@radix-ui/*` packages for accessible, unstyled UI primitives
- `class-variance-authority` and `clsx` - Utility for conditional class names
- `tailwind-merge` - Intelligent Tailwind class merging
- `lucide-react` - Icon library
- `react-icons` - Additional icon sets (used for social media icons)

**Build & Development Tools:**
- `vite` and `@vitejs/plugin-react` - Frontend build tooling
- `esbuild` - Server-side bundling
- `tsx` - TypeScript execution for development
- `@replit/vite-plugin-*` - Replit-specific development enhancements
- `autoprefixer` and `postcss` - CSS processing

**Database Management:**
- `drizzle-kit` - Database migration and management CLI
- `connect-pg-simple` - PostgreSQL session store (configured but not actively used in current implementation)

**Fonts:**
- Google Fonts CDN for Inter and Space Grotesk font families

**Image Assets:**
- Static images stored in `attached_assets/generated_images/` directory
- Hero image and founder headshot used in landing page sections

### Configuration & Build

**Path Aliases:**
- `@/*` → client source files
- `@shared/*` → shared schemas and types
- `@assets/*` → attached assets directory

**Build Output:**
- Client: `dist/public` (static assets served by Express)
- Server: `dist/index.js` (bundled server entry point)

**Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection string (required)
- `NODE_ENV` - Environment mode (development/production)
- `REPL_ID` - Replit-specific identifier