# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a multi-tenant food ordering platform built with React, TypeScript, Vite, and Supabase. The application supports multiple restaurant stores with subdomain-based routing, where each store has its own catalog, orders, and admin panel.

## Development Commands

```bash
# Install dependencies
npm i

# Start development server (runs on port 8080)
npm run dev

# Build for production
npm run build

# Build for development mode
npm run build:dev

# Run linter
npm run lint

# Preview production build
npm run preview
```

## Architecture

### Multi-tenant Structure

The application uses subdomain-based store routing:
- In development: Uses `localStorage.getItem("dev_subdomain")` to simulate subdomains (defaults to "totus")
- In production: Extracts subdomain from hostname (e.g., `tienda1.pideai.com` → `tienda1`)
- Store resolution happens in `StoreContext` (src/contexts/StoreContext.tsx)

### Core Contexts

**StoreContext** (src/contexts/StoreContext.tsx)
- Loads store data based on subdomain
- Provides `store`, `loading`, and `isStoreOwner` to the app
- Checks if current user is the store owner for admin access

**CartContext** (src/contexts/CartContext.tsx)
- Manages shopping cart with localStorage persistence
- Handles items with extras (unique cart items based on product + extras combination)
- Uses `cartItemId` for distinguishing items with different extras

### Route Structure

All routes are defined in src/App.tsx:

**Public Routes:**
- `/` - Main catalog page (Index)
- `/welcome` - Welcome/landing page
- `/auth` - Authentication
- `/products/:id` - Product detail page
- `/checkout` - Checkout flow
- `/confirm-order` - Order confirmation
- `/my-orders` - Customer order history

**Admin Routes:**
- `/admin` - Dashboard (AdminDashboard)
- `/admin/orders` - Orders management
- `/admin/categories` - Category management
- `/admin/menu-items` - Menu items management
- `/admin/customers` - Customer management
- `/admin/settings` - Store settings
- `/create-store` - Store creation

**Important:** Add custom routes ABOVE the catch-all `*` route (NotFound)

### Database Integration

- Uses Supabase for backend (auth, database, realtime)
- Supabase client configured in src/integrations/supabase/client.ts
- Type definitions auto-generated in src/integrations/supabase/types.ts
- Database tables include: stores, categories, menu_items, orders, customers, delivery_zones, product_extras, payment_methods, store_hours

### Component Organization

**src/components/catalog/** - Customer-facing components
- Header, Footer, HeroBanner
- CategoriesSection, CategoryCard
- ProductGrid, ProductCard, ProductExtrasDialog
- StoreHoursDisplay

**src/components/admin/** - Admin panel components
- AdminLayout, AppSidebar
- CategoriesManager, MenuItemsManager, OrdersManager, CustomersManager
- Various settings tabs (BusinessHoursTab, PaymentSettingsTab, OrderSettingsTab, DeliverySettingsTab, AdvancedSettingsTab)
- DashboardStats, ProductExtrasManager, PaymentMethodsManager

**src/components/ui/** - shadcn/ui components
- Pre-built UI components from shadcn/ui library
- Uses Radix UI primitives with Tailwind CSS styling

### Key Features

**Store Operating Modes:**
- `delivery` - Delivery orders
- `pickup` - Pickup orders
- `digital_menu` - Digital menu only (no ordering)

**Store Status:**
- Normal operation based on business hours
- Force open/closed override via `force_status`
- Handled by useStoreStatus hook (src/hooks/useStoreStatus.ts)

**Order Notifications:**
- Real-time order notifications for store owners
- Audio notifications with configurable volume and repeat count
- Managed by useOrderNotifications hook (src/hooks/useOrderNotifications.ts)

**WhatsApp Integration:**
- Optional redirect to WhatsApp for orders
- Template-based order messages (configurable per operating mode)
- Message generator in src/lib/whatsappMessageGenerator.ts

## Path Aliases

The project uses `@/` as an alias for the `src/` directory:
```typescript
import { Button } from "@/components/ui/button"
import { supabase } from "@/integrations/supabase/client"
```

## TypeScript Configuration

- Relaxed TypeScript settings for faster development
- `noImplicitAny: false`
- `strictNullChecks: false`
- `skipLibCheck: true`

## State Management

- React Context for global state (StoreContext, CartContext)
- TanStack Query (React Query) for server state
- localStorage for cart persistence
- Supabase realtime subscriptions for live order updates

## Styling

- Tailwind CSS with custom configuration (tailwind.config.ts)
- CSS variables for theming
- shadcn/ui component system
- Responsive design utilities
