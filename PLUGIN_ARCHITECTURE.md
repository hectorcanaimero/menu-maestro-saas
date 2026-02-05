# Plugin Architecture for PideAI

## Executive Summary

Diseño de arquitectura de plugins para PideAI, comenzando con la migración de WhatsApp como primer plugin. El objetivo es crear un sistema extensible que eventualmente soporte un marketplace de plugins de terceros.

---

## Decisiones de Arquitectura

| Aspecto | Decisión |
|---------|----------|
| Backend | NestJS |
| Deployment | VPS/Container (Railway, Render, DO) |
| Lógica core | Híbrida - Supabase mantiene lógica actual |
| Plugins externos | Webhooks (plugin vive en infra del desarrollador) |
| Auth | JWT de Supabase (NestJS lo valida) |
| Primer plugin | WhatsApp (migrar integración actual) |
| Monorepo | Sí - `/backend` en mismo repo |
| WhatsApp Provider | Mantener Evolution API (abstraer para futuro cambio) |
| Sistema de Créditos | Por plugin (cada plugin tiene sus propios créditos) |

---

## Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                      React Frontend                          │
│                   (cambios mínimos)                          │
└──────────────┬──────────────────────────┬───────────────────┘
               │                          │
               ▼                          ▼
┌──────────────────────────┐   ┌─────────────────────────────┐
│        Supabase          │   │      NestJS Backend         │
│  ────────────────────    │   │  ─────────────────────────  │
│  • Auth                  │   │  • Plugin Registry          │
│  • Database              │◄──│  • Event Dispatcher         │
│  • Realtime              │   │  • Webhook Manager          │
│  • Storage               │   │  • Plugin Config API        │
└──────────────────────────┘   └──────────────┬──────────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    ▼                         ▼                         ▼
            ┌───────────────┐         ┌───────────────┐         ┌───────────────┐
            │  WhatsApp     │         │  Payment      │         │  Delivery     │
            │  Plugin       │         │  Plugins      │         │  Plugin       │
            └───────────────┘         └───────────────┘         └───────────────┘
```

---

## Estructura del Repositorio (Monorepo)

```
/pideai
├── /app                    # React frontend (actual)
│   ├── src/
│   ├── package.json
│   ├── Dockerfile
│   └── vite.config.ts
│
├── /backend                # NestJS backend (nuevo)
│   ├── src/
│   │   ├── app.module.ts
│   │   ├── config/
│   │   │   └── configuration.ts
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.guard.ts
│   │   │   └── supabase-jwt.strategy.ts
│   │   ├── core/
│   │   │   ├── events/
│   │   │   │   ├── events.module.ts
│   │   │   │   ├── events.service.ts
│   │   │   │   └── event.types.ts
│   │   │   ├── plugins/
│   │   │   │   ├── plugins.module.ts
│   │   │   │   ├── plugins.service.ts
│   │   │   │   ├── plugins.registry.ts
│   │   │   │   ├── plugins.dispatcher.ts
│   │   │   │   └── plugin.interface.ts
│   │   │   └── database/
│   │   │       ├── database.module.ts
│   │   │       └── supabase.service.ts
│   │   ├── webhooks/
│   │   │   ├── webhooks.module.ts
│   │   │   ├── supabase.controller.ts
│   │   │   └── plugins.controller.ts
│   │   ├── api/
│   │   │   └── store-plugins/
│   │   │       ├── store-plugins.module.ts
│   │   │       └── store-plugins.controller.ts
│   │   └── plugins/
│   │       └── whatsapp/
│   │           ├── whatsapp.module.ts
│   │           ├── whatsapp.plugin.ts
│   │           ├── whatsapp.service.ts
│   │           └── providers/
│   │               └── evolution.provider.ts
│   ├── package.json
│   ├── Dockerfile
│   └── nest-cli.json
│
├── /packages               # (opcional) tipos compartidos
│   └── /shared-types
│       ├── package.json
│       └── src/
│           ├── events.ts
│           └── plugins.ts
│
├── .github/
│   └── workflows/
│       ├── deploy-frontend.yml
│       └── deploy-backend.yml
│
├── package.json            # Root con workspaces
└── pnpm-workspace.yaml
```

---

## Phase 1: Core Plugin Engine

### 1.1 Modelo de Datos

```sql
-- Tabla: plugins (catálogo de plugins disponibles)
CREATE TABLE plugins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,              -- 'whatsapp', 'stripe', 'pago-movil'
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,                     -- 'notification', 'payment', 'delivery'
  version TEXT DEFAULT '1.0.0',
  icon_url TEXT,
  is_internal BOOLEAN DEFAULT true,       -- true = built by PideAI
  is_active BOOLEAN DEFAULT true,         -- available for installation
  config_schema JSONB,                    -- JSON Schema for validation
  required_events TEXT[],                 -- ['order.created', 'order.ready']
  pricing_model TEXT DEFAULT 'free',      -- 'free', 'paid', 'per_use'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: store_plugins (instalaciones por tienda)
CREATE TABLE store_plugins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  plugin_id UUID REFERENCES plugins(id) ON DELETE CASCADE,
  config JSONB DEFAULT '{}',              -- Store-specific configuration
  enabled BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,             -- For ordering (e.g., multiple payment methods)
  webhook_url TEXT,                       -- For external plugins
  webhook_secret TEXT,                    -- HMAC signing key
  installed_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(store_id, plugin_id)
);

-- Tabla: plugin_events_log (auditoría de eventos)
CREATE TABLE plugin_events_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id),
  plugin_id UUID REFERENCES plugins(id),
  event_type TEXT NOT NULL,               -- 'order.created', 'payment.completed'
  payload JSONB,
  status TEXT DEFAULT 'pending',          -- 'pending', 'sent', 'delivered', 'failed'
  attempts INTEGER DEFAULT 0,
  response_code INTEGER,
  response_body TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- Índices
CREATE INDEX idx_store_plugins_store ON store_plugins(store_id);
CREATE INDEX idx_store_plugins_plugin ON store_plugins(plugin_id);
CREATE INDEX idx_plugin_events_store ON plugin_events_log(store_id);
CREATE INDEX idx_plugin_events_status ON plugin_events_log(status);
```

### 1.2 Sistema de Eventos

```typescript
// src/core/events/event.types.ts

export enum EventType {
  // Order events
  ORDER_CREATED = 'order.created',
  ORDER_UPDATED = 'order.updated',
  ORDER_STATUS_CHANGED = 'order.status_changed',
  ORDER_READY = 'order.ready',
  ORDER_COMPLETED = 'order.completed',
  ORDER_CANCELLED = 'order.cancelled',

  // Payment events
  PAYMENT_INITIATED = 'payment.initiated',
  PAYMENT_COMPLETED = 'payment.completed',
  PAYMENT_FAILED = 'payment.failed',
  PAYMENT_REFUNDED = 'payment.refunded',

  // Customer events
  CUSTOMER_REGISTERED = 'customer.registered',
  CART_ABANDONED = 'cart.abandoned',
}

export interface PluginEvent<T = unknown> {
  id: string;
  type: EventType;
  storeId: string;
  timestamp: Date;
  payload: T;
  metadata?: Record<string, unknown>;
}

export interface OrderCreatedPayload {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  orderType: 'delivery' | 'pickup' | 'dine_in';
  items: OrderItem[];
  total: number;
  currency: string;
  deliveryAddress?: Address;
  notes?: string;
}
```

### 1.3 Plugin Interface

```typescript
// src/core/plugins/plugin.interface.ts

export interface PluginDefinition {
  slug: string;
  name: string;
  version: string;
  type: 'notification' | 'payment' | 'delivery' | 'analytics';

  // Events this plugin listens to
  subscribedEvents: EventType[];

  // JSON Schema for configuration
  configSchema: object;

  // Lifecycle hooks
  onInstall?(storeId: string, config: unknown): Promise<void>;
  onUninstall?(storeId: string): Promise<void>;
  onEnable?(storeId: string): Promise<void>;
  onDisable?(storeId: string): Promise<void>;

  // Event handler
  handleEvent(event: PluginEvent, config: unknown): Promise<PluginEventResult>;
}

export interface PluginEventResult {
  success: boolean;
  data?: unknown;
  error?: string;
}
```

---

## Phase 2: WhatsApp Plugin Migration

### 2.1 What Gets Migrated

| Component | Current Location | New Location |
|-----------|-----------------|--------------|
| Message Generator | `src/lib/whatsappMessageGenerator.ts` | NestJS: `plugins/whatsapp/whatsapp.service.ts` |
| Send Logic | Edge Function: `send-whatsapp-message` | NestJS: `plugins/whatsapp/providers/evolution.provider.ts` |
| Instance Management | Edge Function: `manage-whatsapp-instance` | NestJS: `plugins/whatsapp/providers/evolution.provider.ts` |
| Webhook Handler | Edge Function: `whatsapp-webhook` | NestJS: `webhooks/plugins.controller.ts` |
| DB Triggers | `notify_new_order_whatsapp()` | Supabase DB Webhook → NestJS Event Dispatcher |
| Settings UI | `AdminWhatsApp.tsx` | Stays in React (API calls change) |
| Templates | `whatsapp_message_templates` table | Stays in Supabase (accessed via NestJS) |
| Credits | `whatsapp_credits` table | Stays in Supabase (accessed via NestJS) |

### 2.2 WhatsApp Plugin Structure

```typescript
// src/plugins/whatsapp/whatsapp.plugin.ts

import { Injectable } from '@nestjs/common';
import { PluginDefinition, PluginEvent, EventType } from '@/core/plugins';
import { WhatsAppService } from './whatsapp.service';

@Injectable()
export class WhatsAppPlugin implements PluginDefinition {
  slug = 'whatsapp';
  name = 'WhatsApp Notifications';
  version = '1.0.0';
  type = 'notification' as const;

  subscribedEvents = [
    EventType.ORDER_CREATED,
    EventType.ORDER_READY,
    EventType.ORDER_COMPLETED,
    EventType.ORDER_CANCELLED,
    EventType.CART_ABANDONED,
  ];

  configSchema = {
    type: 'object',
    properties: {
      provider: { type: 'string', enum: ['evolution', 'twilio'] },
      instanceName: { type: 'string' },
      autoOrderConfirmation: { type: 'boolean' },
      autoOrderReady: { type: 'boolean' },
    },
    required: ['provider'],
  };

  constructor(private whatsAppService: WhatsAppService) {}

  async handleEvent(event: PluginEvent, config: WhatsAppConfig) {
    switch (event.type) {
      case EventType.ORDER_CREATED:
        if (config.autoOrderConfirmation) {
          return this.whatsAppService.sendOrderConfirmation(event, config);
        }
        break;
      case EventType.ORDER_READY:
        if (config.autoOrderReady) {
          return this.whatsAppService.sendOrderReady(event, config);
        }
        break;
    }
    return { success: true };
  }
}
```

### 2.3 API Endpoints (NestJS)

```
# Plugin Management
GET    /api/plugins                         # List available plugins
GET    /api/plugins/:slug                   # Get plugin details

# Store Plugin Management
GET    /api/stores/:storeId/plugins         # List installed plugins
POST   /api/stores/:storeId/plugins         # Install plugin
PUT    /api/stores/:storeId/plugins/:slug   # Update plugin config
DELETE /api/stores/:storeId/plugins/:slug   # Uninstall plugin

# WhatsApp Specific
POST   /api/stores/:storeId/whatsapp/connect     # Start connection (QR)
GET    /api/stores/:storeId/whatsapp/status      # Connection status
POST   /api/stores/:storeId/whatsapp/disconnect  # Disconnect
POST   /api/stores/:storeId/whatsapp/send        # Send message manually
GET    /api/stores/:storeId/whatsapp/messages    # Message history
GET    /api/stores/:storeId/whatsapp/credits     # Credit balance

# Templates
GET    /api/stores/:storeId/whatsapp/templates
PUT    /api/stores/:storeId/whatsapp/templates/:type

# Webhooks
POST   /webhooks/supabase                   # Supabase DB webhooks
POST   /webhooks/plugins/:slug              # Plugin-specific webhooks
```

---

## Phase 3: Payment Plugins (Future)

### 3.1 Payment Plugin Interface

```typescript
export interface PaymentPlugin extends PluginDefinition {
  type: 'payment';

  createPaymentIntent(order: Order, config: unknown): Promise<PaymentIntent>;
  verifyPayment(paymentId: string, config: unknown): Promise<PaymentStatus>;
  processRefund(paymentId: string, amount: number, config: unknown): Promise<RefundResult>;
  handleWebhook(payload: unknown, config: unknown): Promise<WebhookResult>;

  getCheckoutComponent(): string;
}
```

### 3.2 Planned Payment Plugins

1. **Pago Móvil** - Venezuelan mobile payment
2. **Stripe** - International cards
3. **PayPal** - International
4. **Binance Pay** - Crypto
5. **Zelle** - US/Venezuela popular

---

## Implementation Plan

### Week 1: Core Setup
- [ ] Initialize NestJS project
- [ ] Configure Supabase client
- [ ] Implement JWT validation (Supabase tokens)
- [ ] Create plugin core module (registry, dispatcher)
- [ ] Create event system
- [ ] Create database tables (plugins, store_plugins, plugin_events_log)
- [ ] Setup deployment (Railway/Render)

### Week 2: WhatsApp Migration
- [ ] Create WhatsApp plugin module
- [ ] Port message generation logic
- [ ] Port Evolution API provider
- [ ] Implement event handlers (order.created, order.ready)
- [ ] Create API endpoints
- [ ] Setup Supabase Database Webhooks

### Week 3: Frontend Integration
- [ ] Update React hooks to call NestJS API
- [ ] Test connection flow (QR code)
- [ ] Test automatic notifications
- [ ] Test manual message sending
- [ ] Update admin UI if needed

### Week 4: Testing & Cleanup
- [ ] End-to-end testing
- [ ] Performance testing
- [ ] Deprecate Edge Functions
- [ ] Documentation
- [ ] Deploy to production

---

## Technical Considerations

### Authentication Flow

```
1. User logs in via Supabase Auth (unchanged)
2. Frontend gets Supabase JWT
3. Frontend calls NestJS API with JWT in Authorization header
4. NestJS validates JWT using Supabase JWKS
5. NestJS extracts user_id and validates store ownership
```

### Supabase Database Webhooks

Instead of pg_net in DB triggers, we'll use Supabase Database Webhooks:

1. Go to Supabase Dashboard → Database → Webhooks
2. Create webhook for `orders` table INSERT/UPDATE
3. Point to NestJS endpoint: `POST /webhooks/supabase`
4. NestJS receives event, dispatches to appropriate plugins

### Error Handling & Retries

```typescript
async dispatchEvent(event: PluginEvent) {
  const plugins = await this.getActivePlugins(event.storeId, event.type);

  for (const plugin of plugins) {
    try {
      await this.executeWithRetry(plugin, event, {
        maxRetries: 3,
        backoffMs: [1000, 5000, 30000],
      });
    } catch (error) {
      await this.logFailure(event, plugin, error);
    }
  }
}
```

### Security Considerations

1. **Webhook Signatures**: Sign outgoing webhooks with HMAC-SHA256
2. **Rate Limiting**: Implement per-store rate limits
3. **Input Validation**: Validate all plugin configs against JSON Schema
4. **Secrets Management**: Store API keys encrypted (or use Vault)
5. **Audit Logging**: Log all plugin events and config changes

---

## Deployment Setup

### GitHub Actions - Deploy Selectivo

```yaml
# .github/workflows/deploy-frontend.yml
name: Deploy Frontend

on:
  push:
    branches: [main]
    paths:
      - 'app/**'
      - 'packages/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm ci
        working-directory: ./app
      - name: Build
        run: npm run build
        working-directory: ./app
      - name: Deploy to Railway/Render
        # Configurar según tu proveedor
```

```yaml
# .github/workflows/deploy-backend.yml
name: Deploy Backend

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'
      - 'packages/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm ci
        working-directory: ./backend
      - name: Build
        run: npm run build
        working-directory: ./backend
      - name: Deploy to Railway/Render
        # Configurar según tu proveedor
```

### Dockerfile Backend

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 3000
CMD ["node", "dist/main.js"]
```

### Railway Setup (Recomendado)

1. Conectar repositorio a Railway
2. Crear dos servicios en el mismo proyecto:
   - **Frontend**: Root Directory = `/app`
   - **Backend**: Root Directory = `/backend`
3. Configurar variables de entorno para cada servicio
4. Railway detecta cambios por directorio automáticamente

---

## Files to Modify (React Frontend)

```
src/hooks/useWhatsAppSettings.ts      # Change API calls to NestJS
src/hooks/useWhatsAppMessages.ts      # Change API calls to NestJS
src/hooks/useWhatsAppCredits.ts       # Change API calls to NestJS
```

## Files to Deprecate (After Migration)

```
supabase/functions/send-whatsapp-message/
supabase/functions/manage-whatsapp-instance/
supabase/functions/whatsapp-webhook/
```

---

## Verification Plan

### Development Testing
1. Run NestJS locally alongside React dev server
2. Test WhatsApp connection flow with QR code
3. Create test order, verify WhatsApp notification received
4. Test message history and credits

### Staging Testing
1. Deploy NestJS to staging environment
2. Configure Supabase webhooks to staging NestJS
3. Full E2E test with real WhatsApp number
4. Load test with multiple simultaneous orders

### Production Rollout
1. Deploy NestJS to production
2. Configure Supabase webhooks (gradual rollout by store)
3. Monitor error rates and latency
4. Remove Edge Functions after 1 week stable
