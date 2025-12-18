# Product Requirements Document (PRD)
# PideAI - Multi-tenant Food Ordering Platform

**Document Version:** 1.0
**Date:** December 17, 2025
**Status:** Active Development
**Owner:** Product Team

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Overview](#2-product-overview)
3. [Goals & Objectives](#3-goals--objectives)
4. [Target Users](#4-target-users)
5. [User Stories & Use Cases](#5-user-stories--use-cases)
6. [Functional Requirements](#6-functional-requirements)
7. [Non-Functional Requirements](#7-non-functional-requirements)
8. [Technical Architecture](#8-technical-architecture)
9. [User Flows](#9-user-flows)
10. [Success Metrics](#10-success-metrics)
11. [Roadmap & Future Enhancements](#11-roadmap--future-enhancements)
12. [Dependencies & Integrations](#12-dependencies--integrations)
13. [Risks & Mitigation](#13-risks--mitigation)

---

## 1. Executive Summary

### 1.1 Product Vision
PideAI is a comprehensive multi-tenant SaaS platform that empowers restaurants and food businesses to digitalize their operations, manage orders, and provide seamless customer experiences across delivery, pickup, and dine-in service modes.

### 1.2 Problem Statement
Small to medium-sized restaurants struggle with:
- Managing multiple order channels (delivery, pickup, dine-in)
- Tracking real-time deliveries and driver performance
- Converting online visitors to paying customers
- Managing inventory and menu updates efficiently
- Processing payments with multiple currencies
- Providing live customer support
- Analyzing business performance with actionable insights

### 1.3 Solution
A unified platform that provides:
- **Multi-tenant architecture** with subdomain-based store isolation
- **Flexible operating modes** supporting delivery, pickup, and digital menu
- **Real-time delivery tracking** with GPS-enabled driver app
- **WhatsApp integration** for automated order notifications
- **Advanced analytics** via PostHog integration
- **AI-powered features** including product photo enhancement
- **Subscription-based pricing** with feature gating
- **Comprehensive admin dashboard** for complete business management

### 1.4 Success Criteria
- Onboard 100+ restaurants in the first 6 months
- Achieve 95%+ platform uptime
- Process 10,000+ orders monthly across all stores
- Reduce abandoned cart rate by 30% through analytics insights
- Enable stores to increase online orders by 40%

---

## 2. Product Overview

### 2.1 Core Value Propositions

**For Restaurant Owners:**
- Complete digital storefront with custom branding
- Unified order management across all channels
- Real-time delivery tracking and driver management
- Automated WhatsApp notifications to reduce manual work
- Data-driven insights to optimize menu and pricing
- Flexible payment options including dual currency support

**For Customers:**
- User-friendly ordering experience
- Real-time order tracking
- Multiple payment methods
- Order history and reordering capability
- Transparent pricing with promotions and coupons

**For Delivery Drivers:**
- Dedicated PWA mobile app
- Clear delivery assignments
- GPS-guided navigation
- Digital proof of delivery (photo + signature)
- Earnings tracking

### 2.2 Key Differentiators
1. **Multi-tenant SaaS Architecture**: Each store gets isolated data and custom subdomain
2. **Operating Mode Flexibility**: Support delivery, pickup, and dine-in from one platform
3. **WhatsApp Automation**: Template-based order notifications reduce manual communication
4. **AI Product Enhancement**: Professional product photos in 6 artistic styles
5. **Real-time Analytics**: PostHog integration for abandoned cart recovery and funnel analysis
6. **Dual Currency Support**: Critical for markets with currency volatility
7. **Kitchen Display System**: Real-time order queue for kitchen operations
8. **Driver GPS Tracking**: Live delivery tracking for customers and admin

---

## 3. Goals & Objectives

### 3.1 Business Goals
- **Q1 2026**: Launch MVP with 10 pilot restaurants
- **Q2 2026**: Expand to 50 active stores
- **Q3 2026**: Achieve $50K MRR (Monthly Recurring Revenue)
- **Q4 2026**: Process 100,000+ orders monthly
- **Year 1**: Establish market presence in primary geographic market

### 3.2 Product Goals
- **User Acquisition**: Reduce friction in store onboarding (< 30 minutes setup)
- **Conversion Optimization**: Increase catalog-to-order conversion by 25%
- **Retention**: Achieve 90%+ month-over-month store retention
- **Engagement**: Drive 60%+ daily active usage among active stores
- **Performance**: Maintain <2s page load times and 99.5% uptime

### 3.3 Technical Goals
- Scalable infrastructure supporting 1,000+ concurrent stores
- <100ms average API response time
- 99.9% data accuracy across multi-tenant database
- Zero critical security vulnerabilities
- Automated deployment pipeline with <5 minute deployment time

---

## 4. Target Users

### 4.1 Primary Personas

#### Persona 1: Restaurant Owner (Maria)
**Demographics:**
- Age: 35-50
- Role: Restaurant owner/manager
- Technical proficiency: Medium
- Business size: 1-3 locations
- Monthly order volume: 200-1,000 orders

**Goals:**
- Increase online order volume
- Reduce order processing time
- Track business performance
- Manage menu and pricing efficiently
- Improve customer satisfaction

**Pain Points:**
- Using multiple disconnected tools
- Manual order entry and WhatsApp messages
- Difficulty tracking delivery drivers
- No visibility into business metrics
- Currency conversion complexity

**User Journey:**
1. Discovers PideAI through marketing
2. Signs up for free trial
3. Configures store settings and menu
4. Shares store link on social media
5. Receives first order via platform
6. Upgrades to paid plan

#### Persona 2: End Customer (Carlos)
**Demographics:**
- Age: 18-45
- Location: Urban/suburban
- Technical proficiency: High
- Order frequency: 2-4 times/month

**Goals:**
- Quick and easy ordering
- Track delivery in real-time
- Apply discounts and promotions
- Reorder favorite items
- Multiple payment options

**Pain Points:**
- Complicated checkout processes
- Unclear delivery times
- Limited payment options
- No order history
- Poor mobile experience

**User Journey:**
1. Discovers restaurant via social media or QR code
2. Browses menu on mobile device
3. Adds items with custom extras
4. Applies coupon code
5. Completes checkout
6. Tracks delivery in real-time
7. Receives order and confirms delivery

#### Persona 3: Delivery Driver (Luis)
**Demographics:**
- Age: 20-40
- Role: Part-time/full-time delivery driver
- Technical proficiency: Medium
- Daily deliveries: 10-30

**Goals:**
- Clear delivery instructions
- Efficient route navigation
- Easy proof of delivery
- Track daily earnings
- Manage availability

**Pain Points:**
- Confusing delivery addresses
- Manual proof of delivery processes
- No GPS navigation
- Unclear order priorities
- Payment tracking difficulties

**User Journey:**
1. Logs into driver PWA
2. Sets status to "online"
3. Receives delivery assignment notification
4. Reviews order details and customer info
5. Navigates to pickup location
6. Updates status to "picked up"
7. Navigates to delivery address with GPS
8. Captures photo proof of delivery
9. Collects digital signature
10. Completes delivery and receives next assignment

### 4.2 Secondary Personas
- **Platform Administrator**: Manages stores, subscriptions, and platform analytics
- **Kitchen Staff**: Uses Kitchen Display System to prepare orders
- **Support Team**: Uses Chatwoot integration to assist users

---

## 5. User Stories & Use Cases

### 5.1 Restaurant Owner Stories

#### Epic: Store Setup & Configuration
- **US-001**: As a restaurant owner, I want to create a store with my business information so that I can start accepting online orders.
- **US-002**: As a restaurant owner, I want to upload my logo and banner so that my store reflects my brand identity.
- **US-003**: As a restaurant owner, I want to configure my operating modes (delivery/pickup/dine-in) so that I only show available order types.
- **US-004**: As a restaurant owner, I want to set my business hours so that customers know when I'm open.
- **US-005**: As a restaurant owner, I want to manually override my store status so that I can close unexpectedly or open on holidays.

#### Epic: Menu Management
- **US-006**: As a restaurant owner, I want to create product categories so that my menu is organized.
- **US-007**: As a restaurant owner, I want to add menu items with prices, descriptions, and images so that customers can see what I offer.
- **US-008**: As a restaurant owner, I want to add product extras (sizes, toppings, etc.) so that customers can customize their orders.
- **US-009**: As a restaurant owner, I want to use AI to enhance product photos so that my menu looks professional.
- **US-010**: As a restaurant owner, I want to reorder categories and products so that popular items appear first.
- **US-011**: As a restaurant owner, I want to hide/show menu items so that I can manage availability.

#### Epic: Order Management
- **US-012**: As a restaurant owner, I want to receive real-time notifications when new orders arrive so that I can prepare them promptly.
- **US-013**: As a restaurant owner, I want to view order details including items, extras, and customer information so that I can fulfill orders accurately.
- **US-014**: As a restaurant owner, I want to update order status (preparing, ready, delivered) so that customers know the progress.
- **US-015**: As a restaurant owner, I want to manually create orders so that I can enter phone/in-person orders into the system.
- **US-016**: As a restaurant owner, I want to view order history with filters so that I can track past performance.
- **US-017**: As a restaurant owner, I want to use a Kitchen Display System so that my kitchen staff can see orders in real-time.

#### Epic: Delivery Management
- **US-018**: As a restaurant owner, I want to configure delivery zones with pricing so that I can charge based on distance.
- **US-019**: As a restaurant owner, I want to add and manage drivers so that I can assign deliveries.
- **US-020**: As a restaurant owner, I want to assign drivers to orders so that deliveries are tracked.
- **US-021**: As a restaurant owner, I want to track driver locations in real-time so that I know delivery status.
- **US-022**: As a restaurant owner, I want to view delivery proof (photos and signatures) so that I can verify completed deliveries.

#### Epic: Payment & Financial
- **US-023**: As a restaurant owner, I want to configure multiple payment methods so that customers have options.
- **US-024**: As a restaurant owner, I want to set up dual currency pricing so that customers can pay in their preferred currency.
- **US-025**: As a restaurant owner, I want to review payment proofs for bank transfers so that I can confirm payment receipt.

#### Epic: Marketing & Promotions
- **US-026**: As a restaurant owner, I want to create percentage or fixed-amount promotions so that I can attract customers.
- **US-027**: As a restaurant owner, I want to create coupon codes with usage limits so that I can run targeted campaigns.
- **US-028**: As a restaurant owner, I want to send WhatsApp campaign messages so that I can announce promotions.
- **US-029**: As a restaurant owner, I want to track abandoned carts so that I can recover lost sales.

#### Epic: Analytics & Insights
- **US-030**: As a restaurant owner, I want to view dashboard statistics (orders, revenue, customers) so that I can monitor business health.
- **US-031**: As a restaurant owner, I want to see catalog view metrics so that I can measure marketing effectiveness.
- **US-032**: As a restaurant owner, I want to analyze abandoned carts so that I can identify friction points.
- **US-033**: As a restaurant owner, I want to view best-selling products so that I can optimize my menu.

#### Epic: Support & Communication
- **US-034**: As a restaurant owner, I want to configure WhatsApp templates so that order confirmations are sent automatically.
- **US-035**: As a restaurant owner, I want to access live chat support so that I can get help when needed.
- **US-036**: As a restaurant owner, I want to generate a QR code for my store so that customers can scan to order.

### 5.2 Customer Stories

#### Epic: Discovery & Browsing
- **US-037**: As a customer, I want to view a restaurant's menu with categories so that I can easily find what I want.
- **US-038**: As a customer, I want to search for products so that I can quickly find specific items.
- **US-039**: As a customer, I want to see product images, descriptions, and prices so that I can make informed decisions.
- **US-040**: As a customer, I want to see store hours and status so that I know if they're open.

#### Epic: Ordering
- **US-041**: As a customer, I want to add items to my cart with custom extras so that I can personalize my order.
- **US-042**: As a customer, I want to view my cart with itemized pricing so that I know the total cost.
- **US-043**: As a customer, I want to apply coupon codes so that I can get discounts.
- **US-044**: As a customer, I want to select my preferred payment method so that I can pay conveniently.
- **US-045**: As a customer, I want to choose between delivery, pickup, or dine-in so that I can order my way.
- **US-046**: As a customer, I want to enter my delivery address so that my order is delivered correctly.
- **US-047**: As a customer, I want to see delivery fees before checkout so that there are no surprises.
- **US-048**: As a customer, I want to add order notes so that I can communicate special requests.

#### Epic: Order Tracking
- **US-049**: As a customer, I want to view my order confirmation so that I know my order was received.
- **US-050**: As a customer, I want to track my delivery in real-time on a map so that I know when it will arrive.
- **US-051**: As a customer, I want to receive WhatsApp notifications about my order status so that I'm kept informed.
- **US-052**: As a customer, I want to view my order history so that I can reorder favorites.

#### Epic: Account Management
- **US-053**: As a customer, I want to create an account so that I can save my order history.
- **US-054**: As a customer, I want to verify my email so that my account is secure.
- **US-055**: As a customer, I want to reset my password so that I can regain access if I forget it.

### 5.3 Driver Stories

#### Epic: Driver Operations
- **US-056**: As a driver, I want to log into a mobile app so that I can manage my deliveries.
- **US-057**: As a driver, I want to toggle my online/offline status so that I only receive deliveries when available.
- **US-058**: As a driver, I want to view assigned deliveries with order details so that I know what to deliver.
- **US-059**: As a driver, I want to see customer contact information so that I can call if needed.
- **US-060**: As a driver, I want GPS navigation to delivery addresses so that I can find locations easily.
- **US-061**: As a driver, I want to update delivery status (picked up, in transit, delivered) so that everyone knows the progress.
- **US-062**: As a driver, I want to capture a photo proof of delivery so that I can document completion.
- **US-063**: As a driver, I want to collect a digital signature so that I can confirm delivery.
- **US-064**: As a driver, I want to view my delivery history so that I can track my performance.

### 5.4 Platform Admin Stories

#### Epic: Store Management
- **US-065**: As a platform admin, I want to view all stores so that I can manage the platform.
- **US-066**: As a platform admin, I want to approve new store registrations so that I can control quality.
- **US-067**: As a platform admin, I want to suspend stores for violations so that I can enforce policies.

#### Epic: Subscription Management
- **US-068**: As a platform admin, I want to view subscription status for all stores so that I can track revenue.
- **US-069**: As a platform admin, I want to manually upgrade/downgrade store plans so that I can handle special cases.
- **US-070**: As a platform admin, I want to view payment history so that I can track transactions.

#### Epic: Platform Analytics
- **US-071**: As a platform admin, I want to view platform-wide analytics so that I can measure success.
- **US-072**: As a platform admin, I want to compare store performance so that I can identify best practices.

---

## 6. Functional Requirements

### 6.1 Multi-Tenant Architecture

#### FR-001: Subdomain-based Store Isolation
- **Requirement**: Each store must have a unique subdomain (e.g., `store1.pideai.com`)
- **Details**:
  - Subdomain extracted from hostname in production
  - Development mode uses `localStorage.getItem("dev_subdomain")`
  - Store resolution in `StoreContext`
  - 404 error for invalid subdomains
- **Priority**: P0 (Critical)
- **Dependencies**: DNS configuration, Supabase RLS policies

#### FR-002: Data Isolation
- **Requirement**: All data must be scoped to the correct store using Row-Level Security
- **Details**:
  - PostgreSQL RLS policies on all tables
  - `store_id` foreign key on all multi-tenant tables
  - No cross-store data access
- **Priority**: P0 (Critical)
- **Dependencies**: Database schema, Supabase configuration

#### FR-003: Store Ownership Validation
- **Requirement**: Only authenticated store owners can access admin panel
- **Details**:
  - `isStoreOwner` check in `StoreContext`
  - Protected routes in React Router
  - Session validation with Supabase Auth
- **Priority**: P0 (Critical)
- **Dependencies**: Authentication system

### 6.2 Operating Modes

#### FR-004: Delivery Mode
- **Requirement**: Stores can accept delivery orders with address and zone-based pricing
- **Details**:
  - Customer enters full delivery address
  - Address validation (minimum 5 characters)
  - Delivery zone selection based on neighborhood
  - Distance-based pricing calculation
  - Driver assignment capability
- **Priority**: P0 (Critical)
- **Dependencies**: Delivery zones configuration, driver management

#### FR-005: Pickup Mode
- **Requirement**: Stores can accept pickup orders with simplified customer info
- **Details**:
  - No address fields required
  - Estimated pickup time display
  - Pickup instructions from store
- **Priority**: P0 (Critical)
- **Dependencies**: None

#### FR-006: Digital Menu Mode
- **Requirement**: Stores can use platform as digital menu for dine-in service
- **Details**:
  - Table number input required
  - No delivery/pickup logic
  - In-store order fulfillment
- **Priority**: P1 (High)
- **Dependencies**: None

#### FR-007: Operating Mode Toggle
- **Requirement**: Store owners can enable/disable each operating mode independently
- **Details**:
  - Checkbox toggles in store settings
  - Changes reflected immediately on customer-facing site
  - At least one mode must be enabled
- **Priority**: P0 (Critical)
- **Dependencies**: Store settings management

### 6.3 Product Catalog Management

#### FR-008: Category Management
- **Requirement**: Store owners can create, edit, delete, and reorder categories
- **Details**:
  - Category name (required, max 100 chars)
  - Display order (drag-and-drop)
  - Visibility toggle
  - Image upload (optional)
  - Minimum 1 category required
- **Priority**: P0 (Critical)
- **Dependencies**: Supabase Storage for images

#### FR-009: Menu Item Management
- **Requirement**: Store owners can manage menu items with detailed information
- **Details**:
  - Product name (required, max 150 chars)
  - Description (optional, max 500 chars)
  - Price (required, decimal with 2 places)
  - Currency (store default)
  - Category assignment (required)
  - Product image upload
  - Visibility toggle
  - Stock/availability indicator
- **Priority**: P0 (Critical)
- **Dependencies**: Categories, Supabase Storage

#### FR-010: Product Extras
- **Requirement**: Store owners can add customizable extras to products
- **Details**:
  - Extra name (e.g., "Size", "Toppings")
  - Extra options (e.g., "Small", "Medium", "Large")
  - Price modifier per option
  - Required vs optional extras
  - Multiple selection support
  - Maximum selection limits
- **Priority**: P0 (Critical)
- **Dependencies**: Menu items

#### FR-011: AI Product Photo Enhancement
- **Requirement**: Store owners can enhance product photos using AI
- **Details**:
  - 6 artistic styles available
  - Upload base product photo
  - Select enhancement style
  - AI processing via external API
  - Save enhanced photo to product
  - AI credit deduction from subscription
- **Priority**: P2 (Medium)
- **Dependencies**: AI API integration, subscription system

#### FR-012: Product Search
- **Requirement**: Customers can search for products by name or description
- **Details**:
  - Full-text search across product names
  - Real-time search results
  - Debounced input (300ms)
  - Highlight matching terms
- **Priority**: P1 (High)
- **Dependencies**: None

### 6.4 Shopping Cart

#### FR-013: Add to Cart
- **Requirement**: Customers can add products with extras to cart
- **Details**:
  - Product + extras combination creates unique cart item
  - Quantity selector (default: 1)
  - Cart item ID generation: `{productId}-{extrasHash}`
  - Toast notification on add
  - Cart icon badge update
- **Priority**: P0 (Critical)
- **Dependencies**: Product catalog

#### FR-014: Cart Persistence
- **Requirement**: Cart data persists across sessions
- **Details**:
  - Encrypted localStorage storage
  - Cart tied to store subdomain
  - Clear cart on subdomain change
  - Maximum cart age: 7 days
- **Priority**: P1 (High)
- **Dependencies**: None

#### FR-015: Cart Operations
- **Requirement**: Customers can modify cart contents
- **Details**:
  - Update quantity (min: 1, max: 99)
  - Remove individual items
  - Clear entire cart
  - View itemized totals
  - Apply coupon codes
- **Priority**: P0 (Critical)
- **Dependencies**: None

#### FR-016: Cart Analytics
- **Requirement**: Cart events tracked for abandoned cart analysis
- **Details**:
  - PostHog event: `product_added_to_cart`
  - PostHog event: `product_removed_from_cart`
  - Event properties: product ID, price, quantity, store
  - Session identification
- **Priority**: P2 (Medium)
- **Dependencies**: PostHog integration

### 6.5 Checkout Process

#### FR-017: Multi-Step Checkout
- **Requirement**: Checkout must guide customers through information collection
- **Details**:
  - **Step 1**: Customer information (name, email, phone)
  - **Step 2**: Order details (delivery/pickup/table)
  - **Step 3**: Payment method selection
  - **Step 4**: Order review and confirmation
  - Progress indicator
  - Back/Next navigation
  - Validation at each step
- **Priority**: P0 (Critical)
- **Dependencies**: None

#### FR-018: Customer Information Validation
- **Requirement**: Customer data must be validated before proceeding
- **Details**:
  - Name: 2-100 characters, alphabetic
  - Email: Valid email format (RFC 5322)
  - Phone: 10-20 digits, numeric
  - Real-time validation with error messages
  - Form cannot submit with errors
- **Priority**: P0 (Critical)
- **Dependencies**: React Hook Form, Zod validation

#### FR-019: Delivery Information Collection
- **Requirement**: For delivery orders, collect complete delivery address
- **Details**:
  - Address street (5-200 chars)
  - Address number (optional if disabled in settings)
  - Apartment/complement info (optional)
  - Neighborhood selection (dropdown)
  - ZIP code (optional if disabled in settings)
  - Delivery notes (optional, max 500 chars)
- **Priority**: P0 (Critical)
- **Dependencies**: Delivery zones

#### FR-020: Payment Method Selection
- **Requirement**: Customers select from enabled payment methods
- **Details**:
  - Display only enabled methods for store
  - Payment method icons/labels
  - Bank transfer requires payment proof upload
  - Cash on delivery option
  - Other configured methods
- **Priority**: P0 (Critical)
- **Dependencies**: Store payment settings

#### FR-021: Coupon Application
- **Requirement**: Customers can apply discount coupons at checkout
- **Details**:
  - Coupon code input field
  - Case-insensitive code matching
  - Validation checks:
    - Coupon exists and is active
    - Usage limit not exceeded
    - Customer-specific limits not exceeded
    - Minimum order value met
    - Current date within coupon validity
  - Discount calculation (percentage or fixed)
  - Maximum discount cap enforcement
  - Display discount in order summary
- **Priority**: P1 (High)
- **Dependencies**: Coupon management system

#### FR-022: Order Summary
- **Requirement**: Display complete order breakdown before confirmation
- **Details**:
  - Line items with quantities and prices
  - Extras listed per item
  - Subtotal calculation
  - Delivery fee (if applicable)
  - Coupon discount (if applied)
  - Grand total
  - Selected payment method
  - Delivery address (if applicable)
- **Priority**: P0 (Critical)
- **Dependencies**: Cart, pricing logic

#### FR-023: Order Creation
- **Requirement**: Submit validated order to database
- **Details**:
  - Generate sequential order number
  - Create order record with status "pending"
  - Create order_items records
  - Deduct coupon usage
  - Create customer record if new
  - PostHog event: `order_completed`
  - Redirect to confirmation page
- **Priority**: P0 (Critical)
- **Dependencies**: Database, analytics

### 6.6 Order Management

#### FR-024: Order Status Workflow
- **Requirement**: Orders progress through defined statuses
- **Details**:
  - Status flow: `pending` → `preparing` → `ready` → `out_for_delivery` → `delivered`
  - Pickup flow: `pending` → `preparing` → `ready` → `picked_up`
  - Dine-in flow: `pending` → `preparing` → `served`
  - Admin can update status
  - Customer sees current status
  - Timestamp recorded for each status change
- **Priority**: P0 (Critical)
- **Dependencies**: Database schema

#### FR-025: Order Notifications
- **Requirement**: Store owners receive real-time notifications for new orders
- **Details**:
  - Browser push notification (if permitted)
  - Audio alert with configurable volume
  - Alert repeat count (1-10 times)
  - Toast notification in admin panel
  - Supabase realtime subscription
- **Priority**: P0 (Critical)
- **Dependencies**: Supabase Realtime, browser permissions

#### FR-026: Kitchen Display System
- **Requirement**: Kitchen staff view live order queue
- **Details**:
  - Display only "pending" and "preparing" orders
  - Order cards with:
    - Order number
    - Order type (delivery/pickup/dine-in)
    - Customer name
    - Items list with quantities
    - Special instructions
    - Time since order placed
  - One-click status update buttons
  - Auto-refresh every 5 seconds
  - Sound alert on new order
- **Priority**: P1 (High)
- **Dependencies**: Order system, Supabase Realtime

#### FR-027: Order Details View
- **Requirement**: Admin can view complete order information
- **Details**:
  - Customer contact information
  - Order items with extras
  - Delivery address (if applicable)
  - Payment method and proof (if applicable)
  - Order timeline with status history
  - Driver assignment (if applicable)
  - Delivery tracking link (if applicable)
- **Priority**: P0 (Critical)
- **Dependencies**: Order system

#### FR-028: Manual Order Creation
- **Requirement**: Admin can manually create orders (phone/walk-in)
- **Details**:
  - Same form as customer checkout
  - Pre-fill customer info if existing
  - Skip payment step (mark as pending)
  - Immediate order creation
  - Email confirmation optional
- **Priority**: P1 (High)
- **Dependencies**: Order system

#### FR-029: Order History & Filtering
- **Requirement**: Admin can view and filter past orders
- **Details**:
  - Date range filter
  - Status filter (all, pending, completed, cancelled)
  - Order type filter (delivery, pickup, dine-in)
  - Search by order number or customer name
  - Pagination (20 orders per page)
  - Export to CSV
- **Priority**: P1 (High)
- **Dependencies**: Database indexes

### 6.7 Delivery Management

#### FR-030: Delivery Zones Configuration
- **Requirement**: Store owners define geographic delivery zones with pricing
- **Details**:
  - Zone name (e.g., "Downtown", "North Side")
  - Delivery fee per zone
  - Neighborhoods/areas per zone
  - Enable/disable zones
  - Minimum order value per zone (optional)
- **Priority**: P0 (Critical for delivery mode)
- **Dependencies**: None

#### FR-031: Driver Management
- **Requirement**: Store owners manage delivery driver roster
- **Details**:
  - Driver name
  - Phone number
  - Email (optional)
  - Vehicle type
  - License plate
  - Photo (optional)
  - Active/inactive status
- **Priority**: P0 (Critical for delivery mode)
- **Dependencies**: None

#### FR-032: Delivery Assignment
- **Requirement**: Admin can assign drivers to delivery orders
- **Details**:
  - View unassigned delivery orders
  - Select available driver from dropdown
  - Assign button
  - Notification sent to driver app
  - Order status updates to "assigned"
  - Reassignment capability
- **Priority**: P0 (Critical for delivery mode)
- **Dependencies**: Driver management

#### FR-033: Real-time Driver Tracking
- **Requirement**: Track driver GPS location during delivery
- **Details**:
  - Driver app shares location every 10 seconds while online
  - Location stored in `driver_locations` table
  - Admin dashboard displays driver pins on map
  - Customer tracking page shows driver location
  - Route polyline drawn from store → driver → customer
  - ETA calculation based on distance and average speed
- **Priority**: P1 (High)
- **Dependencies**: Google Maps API, driver PWA

#### FR-034: Delivery Proof Capture
- **Requirement**: Drivers capture proof of delivery
- **Details**:
  - Photo capture via device camera
  - Image upload to Supabase Storage
  - Digital signature canvas
  - Signature saved as image
  - GPS coordinates recorded
  - Timestamp recorded
  - Delivery notes (optional)
- **Priority**: P1 (High)
- **Dependencies**: Driver PWA, Supabase Storage

### 6.8 Driver PWA

#### FR-035: Driver Authentication
- **Requirement**: Drivers log into dedicated mobile app
- **Details**:
  - Email/password login
  - Driver role verification
  - Session persistence
  - Logout functionality
- **Priority**: P0 (Critical for delivery mode)
- **Dependencies**: Supabase Auth

#### FR-036: Driver Dashboard
- **Requirement**: Drivers view assigned deliveries
- **Details**:
  - List of assigned orders
  - Order details (items, customer, address)
  - Customer contact (click to call)
  - Navigation button (opens Maps app)
  - Status update buttons
  - Delivery history
- **Priority**: P0 (Critical for delivery mode)
- **Dependencies**: Delivery assignments

#### FR-037: Driver Availability Toggle
- **Requirement**: Drivers control when they receive assignments
- **Details**:
  - Online/Offline toggle switch
  - When online: GPS tracking enabled
  - When offline: No new assignments
  - Status visible to admin
- **Priority**: P1 (High)
- **Dependencies**: None

#### FR-038: Delivery Status Updates
- **Requirement**: Drivers update delivery progress
- **Details**:
  - "Picked Up" button at store
  - "In Transit" automatic on departure
  - "Delivered" after proof capture
  - Each status sends notification to customer
- **Priority**: P0 (Critical for delivery mode)
- **Dependencies**: Order system, notifications

### 6.9 Payment Processing

#### FR-039: Payment Method Configuration
- **Requirement**: Store owners enable payment methods
- **Details**:
  - Cash on delivery toggle
  - Bank transfer toggle
    - Bank name
    - Account holder
    - Account number
    - Payment proof required
  - Other methods (future: card processors)
  - Display order on customer checkout
- **Priority**: P0 (Critical)
- **Dependencies**: None

#### FR-040: Dual Currency Support
- **Requirement**: Display and accept payments in multiple currencies
- **Details**:
  - Primary currency: USD or EUR
  - Secondary currency: VES (Venezuelan Bolivar)
  - Manual exchange rate entry
  - Automatic rate fetching from BCV
  - Both prices displayed on products
  - Customer selects payment currency at checkout
  - Currency formatting (symbols, decimals, separators)
- **Priority**: P1 (High - critical for certain markets)
- **Dependencies**: BCV API integration

#### FR-041: Payment Proof Upload
- **Requirement**: Customers upload bank transfer receipts
- **Details**:
  - Image upload field on checkout
  - Supported formats: JPG, PNG, PDF
  - Max file size: 5MB
  - Preview before submission
  - Stored in Supabase Storage
  - Admin can view proof in order details
- **Priority**: P1 (High)
- **Dependencies**: Supabase Storage

### 6.10 Promotions & Coupons

#### FR-042: Promotion Creation
- **Requirement**: Store owners create promotional discounts
- **Details**:
  - Promotion name
  - Discount type: percentage or fixed amount
  - Discount value
  - Scope: store-wide, category, or specific products
  - Start date/time
  - End date/time
  - Active/inactive toggle
  - Automatic application on customer checkout
- **Priority**: P2 (Medium)
- **Dependencies**: Product catalog

#### FR-043: Coupon Management
- **Requirement**: Store owners create and manage coupon codes
- **Details**:
  - Coupon code (alphanumeric, uppercase)
  - Discount type: percentage or fixed amount
  - Discount value
  - Minimum order value requirement
  - Maximum discount cap
  - Usage limit (total)
  - Usage limit per customer
  - Start/end date validity
  - Active/inactive toggle
  - Usage tracking
- **Priority**: P1 (High)
- **Dependencies**: Order system

#### FR-044: Discount Calculation
- **Requirement**: System correctly applies discounts to orders
- **Details**:
  - Promotions applied automatically to matching products
  - Coupons applied when code entered by customer
  - Best discount selected if multiple apply
  - Promotions and coupons can stack (configurable)
  - Discount reflected in order subtotal
  - Discount line item in order summary
- **Priority**: P1 (High)
- **Dependencies**: Pricing logic

### 6.11 WhatsApp Integration

#### FR-045: WhatsApp Order Notifications
- **Requirement**: Send order confirmations via WhatsApp automatically
- **Details**:
  - Template-based message generation
  - Different templates per operating mode (delivery/pickup/dine-in)
  - Variable substitution:
    - `{order-number}`, `{order-date-time}`
    - `{customer-name}`, `{customer-phone}`
    - `{order-products}`, `{order-total}`
    - `{customer-address}`, `{payment-method}`
    - `{order-coupon-code}`, `{shipping-price}`
    - And more...
  - Send to customer phone number
  - Redirect to WhatsApp Web or app
- **Priority**: P1 (High)
- **Dependencies**: WhatsApp Business API or direct link method

#### FR-046: WhatsApp Template Management
- **Requirement**: Store owners configure message templates
- **Details**:
  - Template editor with variable placeholders
  - Preview with sample data
  - Product listing format (configurable)
  - Separate templates for each order type
  - Save and activate templates
- **Priority**: P1 (High)
- **Dependencies**: None

#### FR-047: WhatsApp Campaign Messages
- **Requirement**: Store owners send bulk promotional messages
- **Details**:
  - Compose message with variables
  - Select customer segments (all, recent, inactive)
  - Preview recipients
  - Send bulk messages via WhatsApp links
  - Track message delivery (manual confirmation)
- **Priority**: P2 (Medium)
- **Dependencies**: Customer database

### 6.12 Analytics & Reporting

#### FR-048: Admin Dashboard Statistics
- **Requirement**: Display key business metrics on admin home
- **Details**:
  - **Today's Metrics**:
    - Total orders
    - Total revenue
    - Average order value
  - **This Month**:
    - Total orders
    - Total revenue
    - New customers
  - **Comparison to Previous Period**:
    - Percentage change indicators
  - Auto-refresh every 5 minutes
- **Priority**: P1 (High)
- **Dependencies**: Database queries

#### FR-049: PostHog Event Tracking
- **Requirement**: Track user behavior for funnel analysis
- **Details**:
  - **Events Captured**:
    - `catalog_page_view`: User visits store
    - `product_added_to_cart`: Item added to cart
    - `product_removed_from_cart`: Item removed
    - `checkout_started`: User begins checkout
    - `order_completed`: Order successfully placed
  - **Event Properties**:
    - Store ID and name
    - Product details
    - Cart value
    - User session ID
  - **User Identification**: Email when available
- **Priority**: P2 (Medium)
- **Dependencies**: PostHog integration

#### FR-050: Catalog Views Tracking
- **Requirement**: Track and display catalog page views
- **Details**:
  - Increment view count on each catalog load
  - Store in Supabase database
  - Display total views in admin dashboard
  - PostHog dashboard for unique visitors
  - Date range filtering (last 7, 30, 90 days)
- **Priority**: P2 (Medium)
- **Dependencies**: PostHog integration

#### FR-051: Abandoned Cart Analysis
- **Requirement**: Identify and track abandoned carts
- **Details**:
  - Cart considered abandoned if:
    - Items added to cart
    - No order completed
    - 24+ hours elapsed
  - Admin dashboard shows:
    - Number of abandoned carts
    - Total value of abandoned items
    - Recovery rate
  - PostHog funnel: Catalog → Cart → Checkout → Order
- **Priority**: P2 (Medium)
- **Dependencies**: PostHog integration

#### FR-052: Sales Reports
- **Requirement**: Generate sales reports with visualizations
- **Details**:
  - Daily/weekly/monthly revenue charts
  - Order count trends
  - Average order value over time
  - Best-selling products
  - Revenue by payment method
  - Revenue by order type (delivery/pickup/dine-in)
  - Export to CSV
- **Priority**: P2 (Medium)
- **Dependencies**: Recharts library, database queries

### 6.13 Subscription Management

#### FR-053: Subscription Plans
- **Requirement**: Platform offers tiered subscription plans
- **Details**:
  - **Free Trial**:
    - 14 days
    - Limited features
    - Max 50 catalog views
    - Max 10 products
  - **Starter Plan**:
    - $29/month
    - Max 100 products
    - Unlimited orders
    - Basic analytics
  - **Professional Plan**:
    - $79/month
    - Unlimited products
    - Unlimited orders
    - Advanced analytics
    - WhatsApp integration
    - AI photo enhancement (50 credits/month)
  - **Enterprise Plan**:
    - $199/month
    - All Professional features
    - Multi-location support
    - Priority support
    - Custom integrations
- **Priority**: P0 (Critical)
- **Dependencies**: Subscription database schema

#### FR-054: Feature Gating
- **Requirement**: Restrict features based on subscription plan
- **Details**:
  - Check plan limits before:
    - Adding products (max count)
    - Creating orders (max count per month)
    - Adding categories
    - Using AI enhancement (credit balance)
    - Accessing WhatsApp module
    - Accessing delivery module
  - Display upgrade prompt when limit reached
  - Grace period after plan downgrade (7 days)
- **Priority**: P0 (Critical)
- **Dependencies**: Subscription system

#### FR-055: Usage Tracking
- **Requirement**: Track resource usage against plan limits
- **Details**:
  - Current product count
  - Current category count
  - Orders this month
  - AI credits remaining
  - Catalog views (for free tier)
  - Reset monthly counters on billing date
  - Display usage in admin settings
- **Priority**: P1 (High)
- **Dependencies**: Database triggers, scheduled functions

#### FR-056: Subscription Status Management
- **Requirement**: Handle subscription lifecycle states
- **Details**:
  - **Active**: Full access
  - **Trial**: Trial period access
  - **Past Due**: Payment failed, limited access
  - **Cancelled**: Read-only access for 30 days
  - **Suspended**: No access, data retained for 90 days
  - Status checks on every admin page load
  - Banner notification for non-active status
- **Priority**: P0 (Critical)
- **Dependencies**: Payment processor integration

### 6.14 Store Settings

#### FR-057: Business Information
- **Requirement**: Store owners configure basic business details
- **Details**:
  - Store name (required, max 100 chars)
  - Store description (optional, max 500 chars)
  - Contact email (required)
  - Contact phone (required)
  - Address (optional)
  - Logo upload (max 2MB, JPG/PNG)
  - Banner image (max 5MB, JPG/PNG)
  - Favicon (optional)
- **Priority**: P0 (Critical)
- **Dependencies**: Supabase Storage

#### FR-058: Business Hours Configuration
- **Requirement**: Store owners set weekly operating schedule
- **Details**:
  - Hours for each day of week (Monday-Sunday)
  - Open time and close time selectors
  - "Closed" option per day
  - Multiple time ranges per day (future)
  - Force open/close override toggle
  - Display on customer-facing site
- **Priority**: P0 (Critical)
- **Dependencies**: None

#### FR-059: Store Status Control
- **Requirement**: System determines if store is open or closed
- **Details**:
  - Check current time against business hours
  - Respect force open/close override
  - Display status badge on catalog
  - Prevent orders when closed (unless force open)
  - Status indicator in admin panel
- **Priority**: P0 (Critical)
- **Dependencies**: Business hours

#### FR-060: Design Customization
- **Requirement**: Store owners customize visual appearance
- **Details**:
  - Primary color picker (brand color)
  - Price color picker
  - Button style (rounded, square)
  - Font selection (3-5 options)
  - Dark mode toggle (future)
  - Live preview of changes
- **Priority**: P2 (Medium)
- **Dependencies**: CSS variables, Tailwind theme

### 6.15 Customer Experience

#### FR-061: Responsive Catalog
- **Requirement**: Customer-facing store works on all devices
- **Details**:
  - Mobile-first design
  - Responsive grid (1 column mobile, 2-4 columns desktop)
  - Touch-friendly buttons and inputs
  - Optimized images (WebP format)
  - Fast load times (<2s on 3G)
- **Priority**: P0 (Critical)
- **Dependencies**: None

#### FR-062: Product Detail Modal
- **Requirement**: Customers view product details in modal
- **Details**:
  - Product image (zoom capability)
  - Product name and description
  - Price display
  - Extras selection
  - Quantity selector
  - Add to cart button
  - Close/back button
- **Priority**: P1 (High)
- **Dependencies**: Product catalog

#### FR-063: Order Tracking Page
- **Requirement**: Customers track their delivery in real-time
- **Details**:
  - Order status timeline
  - Live map with driver location (for delivery)
  - ETA display
  - Driver contact button
  - Order details summary
  - Public URL (no login required)
  - Auto-refresh every 10 seconds
- **Priority**: P1 (High)
- **Dependencies**: Delivery tracking system

#### FR-064: Order History
- **Requirement**: Logged-in customers view past orders
- **Details**:
  - List of previous orders
  - Order date and status
  - Items ordered
  - Total amount paid
  - Reorder button (add same items to cart)
  - Track delivery button (if in progress)
- **Priority**: P2 (Medium)
- **Dependencies**: Customer accounts

### 6.16 Support & Help

#### FR-065: Chatwoot Live Chat
- **Requirement**: Store owners access live support chat
- **Details**:
  - Embedded Chatwoot widget in admin panel
  - Automatic user identification (name, email)
  - Custom attributes (store name, plan, role)
  - Chat history persistence
  - File upload in chat
  - Response time: <1 hour during business hours
- **Priority**: P2 (Medium)
- **Dependencies**: Chatwoot integration

#### FR-066: Help Documentation
- **Requirement**: In-app help and documentation links
- **Details**:
  - Help icon in admin nav
  - Links to documentation articles
  - Video tutorials (YouTube embeds)
  - FAQs page
  - Tooltips on complex features
- **Priority**: P2 (Medium)
- **Dependencies**: Documentation content

### 6.17 Security & Privacy

#### FR-067: User Authentication
- **Requirement**: Secure user authentication system
- **Details**:
  - Email/password signup
  - Email verification required
  - Password reset via email
  - Session tokens (JWT)
  - Automatic session refresh
  - Logout functionality
  - Password requirements: min 8 chars, 1 uppercase, 1 number
- **Priority**: P0 (Critical)
- **Dependencies**: Supabase Auth

#### FR-068: Data Privacy
- **Requirement**: Protect customer personal data
- **Details**:
  - Encrypted data in transit (HTTPS)
  - Encrypted data at rest (Supabase encryption)
  - Row-level security (RLS) policies
  - No cross-store data access
  - No sharing customer data with third parties
  - GDPR compliance (data export, deletion)
- **Priority**: P0 (Critical)
- **Dependencies**: Supabase security, SSL certificates

#### FR-069: Error Monitoring
- **Requirement**: Track and report application errors
- **Details**:
  - Sentry integration
  - Error capture with stack traces
  - User context (store, session)
  - Breadcrumb tracking (user actions)
  - Performance monitoring
  - Alert on critical errors
  - Development mode: enhanced error details
- **Priority**: P1 (High)
- **Dependencies**: Sentry integration

---

## 7. Non-Functional Requirements

### 7.1 Performance

#### NFR-001: Page Load Time
- **Requirement**: Pages load in <2 seconds on 3G connection
- **Measurement**: Lighthouse performance score >85
- **Priority**: P0

#### NFR-002: API Response Time
- **Requirement**: API calls return in <100ms average
- **Measurement**: Supabase query monitoring
- **Priority**: P1

#### NFR-003: Real-time Updates
- **Requirement**: Order status updates appear in <1 second
- **Measurement**: Supabase Realtime latency
- **Priority**: P1

#### NFR-004: Concurrent Users
- **Requirement**: Support 1,000+ concurrent users across platform
- **Measurement**: Load testing with K6 or Artillery
- **Priority**: P1

### 7.2 Scalability

#### NFR-005: Store Capacity
- **Requirement**: Support 10,000+ stores on platform
- **Measurement**: Database performance at scale
- **Priority**: P1

#### NFR-006: Order Volume
- **Requirement**: Process 100,000+ orders per day across platform
- **Measurement**: Database writes per second
- **Priority**: P1

#### NFR-007: Storage Capacity
- **Requirement**: Support unlimited product images (with CDN)
- **Measurement**: Supabase Storage usage and costs
- **Priority**: P2

### 7.3 Availability

#### NFR-008: Uptime
- **Requirement**: 99.5% uptime (3.65 hours downtime/month)
- **Measurement**: Uptime monitoring (UptimeRobot, Pingdom)
- **Priority**: P0

#### NFR-009: Disaster Recovery
- **Requirement**: Daily database backups with <24 hour recovery time
- **Measurement**: Supabase backup configuration
- **Priority**: P1

#### NFR-010: Maintenance Windows
- **Requirement**: Scheduled maintenance during low-traffic hours
- **Measurement**: Advance notification (72 hours)
- **Priority**: P2

### 7.4 Security

#### NFR-011: Data Encryption
- **Requirement**: All data encrypted in transit (TLS 1.3) and at rest (AES-256)
- **Measurement**: SSL Labs A+ rating
- **Priority**: P0

#### NFR-012: Authentication Security
- **Requirement**: Multi-factor authentication support (future)
- **Measurement**: Auth0 or Supabase MFA implementation
- **Priority**: P2

#### NFR-013: Penetration Testing
- **Requirement**: Annual security audit and penetration testing
- **Measurement**: Third-party security report
- **Priority**: P1

#### NFR-014: Data Retention
- **Requirement**: Customer data deleted 90 days after store cancellation
- **Measurement**: Automated data deletion job
- **Priority**: P1

### 7.5 Usability

#### NFR-015: Mobile Responsiveness
- **Requirement**: All features work on mobile devices (iOS/Android)
- **Measurement**: Cross-browser testing on 5+ devices
- **Priority**: P0

#### NFR-016: Accessibility
- **Requirement**: WCAG 2.1 AA compliance
- **Measurement**: Lighthouse accessibility score >90
- **Priority**: P2

#### NFR-017: Browser Support
- **Requirement**: Support latest 2 versions of Chrome, Firefox, Safari, Edge
- **Measurement**: Automated cross-browser testing
- **Priority**: P1

#### NFR-018: Internationalization
- **Requirement**: Support for Spanish and English UI (future)
- **Measurement**: i18n implementation with react-i18next
- **Priority**: P2

### 7.6 Maintainability

#### NFR-019: Code Quality
- **Requirement**: ESLint compliance with <10 warnings
- **Measurement**: CI/CD linting pipeline
- **Priority**: P1

#### NFR-020: Test Coverage
- **Requirement**: 70%+ unit test coverage (future)
- **Measurement**: Jest/Vitest coverage report
- **Priority**: P2

#### NFR-021: Documentation
- **Requirement**: Comprehensive README and API documentation
- **Measurement**: Documentation review quarterly
- **Priority**: P2

#### NFR-022: Deployment
- **Requirement**: Automated CI/CD pipeline with <10 minute deploy time
- **Measurement**: GitHub Actions or similar
- **Priority**: P1

### 7.7 Compliance

#### NFR-023: GDPR Compliance
- **Requirement**: User data export and deletion on request
- **Measurement**: GDPR audit
- **Priority**: P1 (required for EU customers)

#### NFR-024: PCI Compliance
- **Requirement**: No storage of credit card data (use payment processor)
- **Measurement**: PCI DSS compliance review
- **Priority**: P0 (when card payments enabled)

#### NFR-025: Tax Compliance
- **Requirement**: Support for tax calculation and reporting (future)
- **Measurement**: Integration with tax service (TaxJar, Avalara)
- **Priority**: P2

---

## 8. Technical Architecture

### 8.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
├─────────────────────────────────────────────────────────────────┤
│  Customer Web App (React)     Admin Web App (React)              │
│  Driver PWA (React)            Platform Admin (React)            │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 │ HTTPS
                                 │
┌─────────────────────────────────────────────────────────────────┐
│                      Application Layer                           │
├─────────────────────────────────────────────────────────────────┤
│  React Router  │  TanStack Query  │  React Context              │
│  React Hook Form  │  Zod Validation  │  Framer Motion          │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 │
┌─────────────────────────────────────────────────────────────────┐
│                     Backend Services (Supabase)                  │
├─────────────────────────────────────────────────────────────────┤
│  PostgreSQL Database  │  Supabase Auth  │  Supabase Storage    │
│  Supabase Realtime    │  Edge Functions │  Row-Level Security  │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 │
┌─────────────────────────────────────────────────────────────────┐
│                   External Integrations                          │
├─────────────────────────────────────────────────────────────────┤
│  PostHog Analytics  │  Sentry Errors  │  Chatwoot Support      │
│  Google Maps API    │  WhatsApp API   │  AI Enhancement API    │
│  BCV Exchange Rates │  Payment Processors (future)              │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 Data Flow

#### Order Creation Flow
```
Customer → Add to Cart → Checkout Form → Validate Data →
Create Order (DB) → PostHog Event → WhatsApp Notification →
Admin Notification → Kitchen Display → Driver Assignment →
Delivery Tracking → Delivery Proof → Order Complete
```

#### Real-time Update Flow
```
Database Change → Supabase Realtime → WebSocket → React App →
Context Update → Component Re-render → UI Update
```

### 8.3 Database Schema Overview

**Core Tables:**
- `stores`: Store configuration and settings
- `users`: User authentication records
- `subscriptions`: Store subscription data
- `subscription_plans`: Available plans

**Product Tables:**
- `categories`: Product categories per store
- `menu_items`: Products per store
- `product_extras`: Customization options

**Order Tables:**
- `orders`: Customer orders
- `order_items`: Line items in orders
- `customers`: Customer profiles

**Marketing Tables:**
- `promotions`: Store promotional campaigns
- `coupons`: Discount codes

**Delivery Tables:**
- `delivery_zones`: Geographic zones with pricing
- `drivers`: Driver profiles
- `delivery_assignments`: Order-driver assignments
- `driver_locations`: Real-time GPS coordinates

**Configuration Tables:**
- `payment_methods`: Store payment options
- `store_hours`: Weekly operating schedule
- `whatsapp_message_templates`: Order notification templates
- `exchange_rates`: Currency conversion rates

### 8.4 Technology Stack

**Frontend:**
- React 18.3
- TypeScript 5.8
- Vite 5.4
- React Router 6.30
- TanStack Query 5.83
- React Hook Form 7.61
- Zod 3.25
- shadcn/ui + Radix UI
- Tailwind CSS 3.4
- Framer Motion
- Recharts

**Backend:**
- Supabase (PostgreSQL)
- Supabase Auth
- Supabase Storage
- Supabase Realtime
- Supabase Edge Functions

**Integrations:**
- PostHog (analytics)
- Sentry (error tracking)
- Chatwoot (live chat)
- Google Maps API (geocoding, directions)
- WhatsApp Business API (notifications)
- BCV API (exchange rates)

**DevOps:**
- GitHub (version control)
- GitHub Actions (CI/CD)
- Vercel/Netlify (hosting)
- Cloudflare (CDN, DNS)

---

## 9. User Flows

### 9.1 Customer Ordering Flow

```
1. Customer visits store subdomain (e.g., restaurant1.pideai.com)
2. Views hero banner and categories
3. Browses products by category
4. Clicks product to view details
5. Selects extras (if available)
6. Adds to cart
7. Clicks cart icon
8. Reviews cart items
9. Applies coupon code (optional)
10. Clicks "Checkout"
11. Enters customer information (name, email, phone)
12. Selects order type (delivery/pickup/dine-in)
13. If delivery: enters address and selects neighborhood
14. Selects payment method
15. Uploads payment proof (if bank transfer)
16. Reviews order summary
17. Confirms order
18. Redirected to confirmation page
19. Receives WhatsApp notification (optional)
20. Tracks order status in real-time
21. Receives order when delivered/ready
```

### 9.2 Store Owner Setup Flow

```
1. Visits PideAI homepage
2. Clicks "Start Free Trial"
3. Enters store name, email, password
4. Verifies email
5. Completes onboarding wizard:
   a. Business information
   b. Operating modes
   c. Business hours
   d. Payment methods
   e. Delivery zones (if applicable)
6. Uploads logo and banner
7. Creates first category
8. Adds first products
9. Shares store link on social media
10. Waits for first order
11. Receives order notification
12. Updates order status
13. Assigns driver (if delivery)
14. Marks order complete
15. Reviews dashboard analytics
16. Upgrades to paid plan
```

### 9.3 Driver Delivery Flow

```
1. Opens driver PWA on mobile
2. Logs in with credentials
3. Sets status to "Online"
4. GPS tracking begins
5. Receives delivery assignment notification
6. Views order details
7. Navigates to restaurant
8. Picks up order
9. Updates status to "Picked Up"
10. Navigates to customer address with GPS
11. Arrives at delivery location
12. Captures photo proof
13. Collects digital signature
14. Adds delivery notes (optional)
15. Marks delivery complete
16. Returns online for next assignment
```

### 9.4 Admin Order Management Flow

```
1. Admin logs into dashboard
2. Hears audio notification for new order
3. Views order in Kitchen Display System
4. Reviews order items and customer info
5. Clicks "Start Preparing"
6. Kitchen prepares order
7. Clicks "Ready for Pickup/Delivery"
8. If delivery:
   a. Assigns available driver
   b. Driver notified
   c. Tracks driver location on map
9. If pickup:
   a. Customer notified order is ready
10. Order marked "Completed" after delivery/pickup
11. Reviews delivery proof (if applicable)
12. Archives order to history
```

---

## 10. Success Metrics

### 10.1 Product Metrics (KPIs)

**User Acquisition:**
- Monthly Active Stores (MAS): Target 100 by Month 6
- New Store Signups: Target 20/month
- Trial-to-Paid Conversion: Target 30%
- Store Activation Rate: Target 80% (complete setup)

**Engagement:**
- Daily Active Stores: Target 60% of MAS
- Orders per Store per Month: Target 150
- Catalog Views per Store: Target 1,000/month
- Cart Abandonment Rate: Target <50%

**Retention:**
- Month-over-Month Retention: Target 90%
- Churn Rate: Target <10%/month
- Customer Lifetime Value (LTV): Target $500
- Net Promoter Score (NPS): Target 40+

**Revenue:**
- Monthly Recurring Revenue (MRR): Target $10K by Month 6
- Average Revenue Per User (ARPU): Target $50
- MRR Growth Rate: Target 20%/month
- Payment Success Rate: Target 95%

**Performance:**
- Platform Uptime: Target 99.5%
- Average Page Load Time: Target <2s
- API Response Time: Target <100ms
- Error Rate: Target <0.1%

**Customer Satisfaction:**
- Order Completion Rate: Target 98%
- On-Time Delivery Rate: Target 90%
- Customer Support Response Time: Target <1 hour
- Customer Support Satisfaction: Target 4.5/5

### 10.2 Analytics Events to Track

**Acquisition Funnel:**
1. Landing page visit
2. Signup started
3. Email verified
4. Store created
5. First product added
6. First order received

**Conversion Funnel:**
1. Catalog page view
2. Product clicked
3. Product added to cart
4. Checkout started
5. Customer info entered
6. Payment method selected
7. Order completed

**Engagement Events:**
- Store login
- Menu item created/edited
- Category created
- Promotion created
- Coupon created
- Driver assigned
- Order status updated
- Analytics dashboard viewed

**Critical Events:**
- Payment failed
- Error occurred
- Feature limit reached
- Subscription upgraded/downgraded
- Store suspended
- Support chat initiated

---

## 11. Roadmap & Future Enhancements

### 11.1 Short-term (Next 3 Months)

**Q1 2026:**
- [ ] Complete MVP feature set
- [ ] Launch with 10 pilot stores
- [ ] Implement automated testing (70% coverage)
- [ ] Add email notification system
- [ ] Improve mobile app performance
- [ ] Add product inventory tracking
- [ ] Implement multi-language support (Spanish/English)
- [ ] Add CSV import/export for menu items
- [ ] Optimize database queries for performance
- [ ] Launch affiliate program

### 11.2 Mid-term (3-6 Months)

**Q2 2026:**
- [ ] Integrate credit card payment processors (Stripe, PayPal)
- [ ] Add customer loyalty program
- [ ] Implement SMS notifications (Twilio)
- [ ] Add scheduled orders (order for later)
- [ ] Create mobile apps (React Native) for iOS/Android
- [ ] Add table reservation system (for dine-in)
- [ ] Implement recipe management
- [ ] Add multi-location support per store
- [ ] Create marketplace/directory of all stores
- [ ] Add customer reviews and ratings

### 11.3 Long-term (6-12 Months)

**Q3-Q4 2026:**
- [ ] Advanced inventory management with supplier integration
- [ ] Staff/employee management with roles and permissions
- [ ] Commission-based driver payout system
- [ ] Integration with third-party delivery services (Uber Eats, DoorDash)
- [ ] POS (Point of Sale) integration
- [ ] Advanced reporting and business intelligence
- [ ] White-label solution for enterprise clients
- [ ] Franchise management features
- [ ] Kitchen equipment integration (receipt printers, displays)
- [ ] API for third-party integrations
- [ ] Mobile app for customers (order from multiple stores)
- [ ] Voice ordering integration (Alexa, Google Assistant)
- [ ] AR menu visualization
- [ ] Blockchain-based loyalty tokens

### 11.4 Research & Exploration

**Future Possibilities:**
- AI-powered demand forecasting
- Automated pricing optimization
- Computer vision for food quality control
- Drone delivery integration
- Blockchain for supply chain transparency
- Virtual kitchen/ghost kitchen management
- Catering and event management
- Subscription meal plans
- Nutritional information and allergen tracking
- Carbon footprint tracking for deliveries

---

## 12. Dependencies & Integrations

### 12.1 Critical Dependencies

**Supabase:**
- Database hosting and management
- Authentication and authorization
- Real-time subscriptions
- File storage
- Edge functions
- **Risk**: Single point of failure
- **Mitigation**: Regular backups, consider multi-cloud strategy

**Hosting Provider (Vercel/Netlify):**
- Frontend hosting and CDN
- Automated deployments
- SSL certificates
- **Risk**: Service outage
- **Mitigation**: Multi-region deployment, CDN caching

**Domain & DNS (Cloudflare):**
- Subdomain routing
- DNS management
- DDoS protection
- **Risk**: DNS propagation issues
- **Mitigation**: Cloudflare's high availability SLA

### 12.2 Integration Dependencies

**PostHog:**
- Event tracking and analytics
- Feature flags (future)
- Session recordings (future)
- **Alternative**: Mixpanel, Amplitude

**Sentry:**
- Error tracking and monitoring
- Performance monitoring
- **Alternative**: Rollbar, Bugsnag

**Chatwoot:**
- Live chat support
- Customer communication
- **Alternative**: Intercom, Zendesk

**Google Maps:**
- Geocoding services
- Distance calculation
- Route mapping
- **Cost**: Pay-per-use pricing
- **Alternative**: Mapbox, OpenStreetMap

**WhatsApp Business API:**
- Order notifications
- Customer communication
- **Risk**: API rate limits, approval required
- **Alternative**: Direct WhatsApp links, SMS (Twilio)

**BCV API:**
- Exchange rate data (Venezuelan market)
- **Risk**: API downtime or deprecation
- **Mitigation**: Cache last known rate, manual override

### 12.3 Future Integrations

**Payment Processors:**
- Stripe (credit cards)
- PayPal (PayPal balance)
- Square (POS integration)
- Mercado Pago (Latin America)

**Communication:**
- Twilio (SMS notifications)
- SendGrid (email notifications)
- Firebase Cloud Messaging (push notifications)

**Delivery Services:**
- Uber Direct API
- DoorDash Drive
- Stuart API

**Accounting:**
- QuickBooks Online
- Xero
- Wave

**Marketing:**
- Mailchimp (email campaigns)
- Facebook/Instagram Shops
- Google My Business

---

## 13. Risks & Mitigation

### 13.1 Technical Risks

**Risk 1: Database Performance Degradation**
- **Probability**: Medium
- **Impact**: High
- **Mitigation**:
  - Implement database indexing strategy
  - Use connection pooling
  - Regular query optimization audits
  - Implement caching layer (Redis)
  - Monitor slow queries with Supabase dashboard

**Risk 2: Supabase Service Outage**
- **Probability**: Low
- **Impact**: Critical
- **Mitigation**:
  - Daily automated backups
  - Multi-region failover plan (future)
  - Status page monitoring
  - Incident response playbook
  - Consider self-hosted Supabase for enterprise

**Risk 3: Third-party API Rate Limits**
- **Probability**: Medium
- **Impact**: Medium
- **Mitigation**:
  - Implement request throttling
  - Cache API responses
  - Queue non-critical requests
  - Monitor usage against limits
  - Have fallback providers

**Risk 4: Frontend Performance on Low-end Devices**
- **Probability**: Medium
- **Impact**: Medium
- **Mitigation**:
  - Code splitting and lazy loading
  - Image optimization and lazy loading
  - Minimize JavaScript bundle size
  - Test on low-end Android devices
  - Implement service worker caching

**Risk 5: Security Vulnerability Exploitation**
- **Probability**: Medium
- **Impact**: Critical
- **Mitigation**:
  - Regular dependency updates
  - Security scanning in CI/CD (Snyk, Dependabot)
  - Penetration testing annually
  - Bug bounty program (future)
  - Security training for developers

### 13.2 Business Risks

**Risk 6: Low Store Adoption**
- **Probability**: High (early stage)
- **Impact**: Critical
- **Mitigation**:
  - Offer generous free trial (14 days)
  - Provide onboarding support and tutorials
  - Gather and act on user feedback
  - Referral program for early adopters
  - Partner with restaurant associations

**Risk 7: High Churn Rate**
- **Probability**: Medium
- **Impact**: High
- **Mitigation**:
  - Regular check-ins with store owners
  - Proactive support for underperforming stores
  - Analyze churn reasons
  - Implement usage-based pricing
  - Loyalty discounts for long-term customers

**Risk 8: Competition from Established Players**
- **Probability**: High
- **Impact**: Medium
- **Mitigation**:
  - Focus on niche markets (small restaurants)
  - Differentiate with unique features (WhatsApp, AI)
  - Superior customer support
  - Competitive pricing
  - Build strong community

**Risk 9: Payment Processing Issues**
- **Probability**: Medium
- **Impact**: High
- **Mitigation**:
  - Multiple payment method support
  - Clear payment proof process
  - Manual payment verification
  - Partner with local payment providers
  - Implement payment retry logic

**Risk 10: Regulatory Compliance Changes**
- **Probability**: Low
- **Impact**: High
- **Mitigation**:
  - Monitor regulatory changes (GDPR, PCI, local laws)
  - Consult legal experts
  - Build flexible compliance architecture
  - Regular compliance audits
  - Privacy-first approach

### 13.3 Operational Risks

**Risk 11: Support Scalability**
- **Probability**: High (as user base grows)
- **Impact**: Medium
- **Mitigation**:
  - Comprehensive self-service documentation
  - Chatbot for common questions (future)
  - Community forum
  - Tiered support (email, chat, phone)
  - Hire support staff proactively

**Risk 12: Feature Creep and Scope Expansion**
- **Probability**: High
- **Impact**: Medium
- **Mitigation**:
  - Strict product roadmap prioritization
  - Regular PRD reviews
  - User research to validate features
  - MVP mindset for new features
  - Say "no" to non-strategic requests

**Risk 13: Developer Knowledge Drain**
- **Probability**: Medium
- **Impact**: High
- **Mitigation**:
  - Comprehensive code documentation
  - Knowledge sharing sessions
  - Pair programming
  - Video documentation for complex features
  - Maintain architectural decision records (ADRs)

---

## 14. Appendices

### 14.1 Glossary

- **Cart Item ID**: Unique identifier for cart items based on product ID and selected extras hash
- **Delivery Zone**: Geographic area with defined delivery pricing
- **Force Status**: Manual override to open/close store regardless of business hours
- **KDS**: Kitchen Display System for real-time order queue
- **Multi-tenant**: Architecture where single application serves multiple independent customers (stores)
- **Operating Mode**: Type of order service (delivery, pickup, dine-in)
- **PostHog**: Product analytics platform for event tracking
- **PWA**: Progressive Web App - installable web application
- **RLS**: Row-Level Security - PostgreSQL security feature for data isolation
- **Subdomain**: Part of domain before main domain (e.g., `store1` in `store1.pideai.com`)
- **Supabase**: Open-source Firebase alternative (database, auth, storage, realtime)

### 14.2 References

- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev)
- [TanStack Query Documentation](https://tanstack.com/query)
- [PostHog Documentation](https://posthog.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### 14.3 Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-17 | Product Team | Initial PRD creation based on codebase analysis |

---

**End of Document**

*This PRD is a living document and will be updated as the product evolves. For questions or suggestions, contact the Product Team.*
