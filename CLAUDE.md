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

**Platform Admin Routes (platform.pideai.com):**
- Accessed via subdomain `platform.pideai.com` (NOT via `/platform-admin` path)
- `/` - Platform dashboard
- `/stores` - Stores management
- `/subscriptions` - Subscriptions management
- `/payments` - Payment validations
- `/plans` - Plans manager
- `/admins` - Platform administrators
- `/posthog` - Analytics dashboard
- `/catalogs` - Catalog views tracking
- `/payment-methods` - Platform payment methods

**Development:** Use `localStorage.setItem("dev_subdomain", "platform")` to access platform admin locally

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

**Live Chat Support (Chatwoot):**
- Integrated Chatwoot widget in admin dashboard only
- Automatic user identification with Supabase session
- Custom attributes: user_type, role, logged_in_at
- Custom React hook: src/hooks/useChatwoot.ts
- Configuration: websiteToken and baseUrl from Chatwoot instance
- Replaces Sentry feedback widget for support

**Error Monitoring (Sentry):**
- Error tracking and performance monitoring
- No feedback widget (using Chatwoot instead)
- Configured in src/main.tsx

**Driver App Features:**
- PWA for delivery drivers
- GPS tracking with real-time location updates
- Photo capture for delivery proof (with improved error handling)
- Signature capture for delivery confirmation
- Camera access with proper error messages and loading states

**Product Image Gallery:**
- Multiple images per product (for non-food/catalog stores only)
- Plan-based image limits: free=3, starter=5, pro=8, enterprise=unlimited
- Database trigger validates image count against subscription plan
- Primary `image_url` maintained for backward compatibility
- Additional images stored in `images` JSONB array column
- Gallery disabled automatically for food business stores (`is_food_business=true`)

**Product Extras Enhancements:**
- Each extra can have a description field displayed to customers
- Individual extras can be enabled/disabled without deletion (via `is_available` toggle)
- Disabled extras are hidden from customer-facing catalog but preserved in database
- Extra groups support category-level inheritance with product-level overrides
- Drag-and-drop reordering for groups and extras within groups

**Currency Conversion & Price Display:**
- Automatic conversion from USD/EUR to VES using BCV rates or manual rates
- Dual price display: original currency (large) + converted VES (small)
- **Hide Original Price** feature (`hide_original_price` field):
  - When enabled: Shows ONLY VES price (hides USD/EUR)
  - Use case: Merchants using custom exchange rates who don't want to reveal their rate
  - Configured in Admin → Settings → Conversion tab
  - Default: Shows both prices (dual display)
- Active currency selection for checkout calculations
- Manual exchange rate override option

**Inventory/Stock Management (Non-Food Stores Only):**
- **Applies ONLY to non-food stores** (`is_food_business = false`)
- Food stores always allow orders regardless of stock levels
- Stock tracking fields per product:
  - `track_stock`: Enable/disable stock tracking for product
  - `stock_quantity`: Current available units
  - `stock_minimum`: Low stock alert threshold
- **Automatic Stock Reduction:**
  - Stock decreases when order status becomes "confirmed"
  - Stock is restored when order status becomes "cancelled" (if previously confirmed)
  - All changes logged in `stock_history` table for audit trail
- **Real-time Validation:**
  - Validates stock when adding to cart
  - Validates stock when increasing quantity
  - Validates entire cart at checkout
  - Clear error messages: "Solo quedan X unidades de [Producto]"
- **Visual Indicators:**
  - Products with stock = 0 show "Agotado" badge
  - Out-of-stock products shown in grayscale
  - No "add to cart" button for out-of-stock items
- **Stock Validation Library:** `src/lib/stockValidator.ts`
- **React Hook:** `src/hooks/useStockValidation.ts`
- **RPC Functions:**
  - `validate_cart_stock(store_id, items)` - Validates cart before checkout
  - `get_low_stock_products(store_id)` - Dashboard low stock alerts
  - `adjust_product_stock(item_id, quantity, type, notes)` - Manual adjustments

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

## Performance Optimizations

**Platform Admin RPC Functions:**
To avoid RLS (Row Level Security) recursion issues and improve query performance, several optimized RPC functions have been implemented:

- `get_user_id_by_email(email)` - Secure email lookup for platform admins
- `get_pending_payment_validations()` - Single query for pending payments with store/plan data
- `get_recent_payment_validations()` - Single query for recent validations
- All queries avoid `profiles` table joins which cause RLS recursion
- Data is fetched in single optimized queries instead of multiple sequential queries

**Stock Validation:**
- `validate_cart_stock(store_id, items)` - Batch validates all cart items in single query
- Only runs for non-food stores to avoid unnecessary checks

**Best Practices:**
- Always use RPC functions for complex joins involving `profiles` table
- Fetch related data in separate queries and merge in application layer
- Use `maybeSingle()` instead of `single()` when records may not exist
- Implement proper error handling and fallback mechanisms
