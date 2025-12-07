# Multi-Domain Setup Guide

## Overview

The PideAI platform supports multiple domains for multi-tenant deployment. This allows the same application to serve stores under different domain names.

## Supported Domains

The platform currently supports:
- **Production**: `pideai.com`
- **Staging/Homologation**: `artex.lat`

## How It Works

### 1. Subdomain Extraction

The application automatically detects which domain is being accessed and extracts the subdomain:

- `tienda1.pideai.com` → `tienda1`
- `tienda1.artex.lat` → `tienda1`
- `localhost` → Uses `localStorage.getItem("dev_subdomain")` (default: `totus`)

### 2. Domain Detection

The system uses the `getCurrentDomain()` function from `src/lib/subdomain-validation.ts` to detect the current domain:

```typescript
export function getCurrentDomain(): string {
  const hostname = window.location.hostname;

  // Check which domain we're on
  for (const domain of SUPPORTED_DOMAINS) {
    if (hostname.endsWith(domain)) {
      return domain;
    }
  }

  // Default to pideai.com for development or unknown domains
  return 'pideai.com';
}
```

### 3. Dynamic Domain Display

All UI components use `formatSubdomainDisplay()` to show the correct domain:

```typescript
// Example in CreateStore component
<span className="text-sm text-muted-foreground whitespace-nowrap">
  .{getCurrentDomain()}
</span>

// This will display either:
// - .pideai.com (production)
// - .artex.lat (staging)
```

## Configuration Files

### 1. Subdomain Validation (`src/lib/subdomain-validation.ts`)

This file contains all the domain-related logic:

```typescript
const SUPPORTED_DOMAINS = ['pideai.com', 'artex.lat'] as const;
```

**Key Functions:**
- `getSubdomainFromHostname()` - Extracts subdomain from URL
- `getCurrentDomain()` - Returns the active domain
- `formatSubdomainDisplay(subdomain)` - Formats subdomain with domain

### 2. Docker Configuration

#### Dockerfile.production

The Dockerfile is domain-agnostic and works with any subdomain configuration. No changes needed.

#### nginx.conf

The nginx configuration uses a wildcard server name and handles all subdomains uniformly:

```nginx
server {
    listen 80;
    server_name _;  # Accept any domain

    # SPA routing - all routes redirect to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 3. Traefik Configuration

When deploying with Traefik, configure multiple domains in your docker-compose or stack file:

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.pideai-app.rule=Host(`pideai.com`) || HostRegexp(`{subdomain:[a-z0-9-]+}.pideai.com`)"
  - "traefik.http.routers.pideai-app-staging.rule=Host(`artex.lat`) || HostRegexp(`{subdomain:[a-z0-9-]+}.artex.lat`)"
```

## Adding a New Domain

To add support for a new domain:

### 1. Update Domain List

Edit `src/lib/subdomain-validation.ts`:

```typescript
const SUPPORTED_DOMAINS = [
  'pideai.com',
  'artex.lat',
  'yournewdomain.com'  // Add here
] as const;
```

### 2. Update Traefik Configuration

Add the new domain to your Traefik labels:

```yaml
labels:
  - "traefik.http.routers.pideai-app-custom.rule=Host(`yournewdomain.com`) || HostRegexp(`{subdomain:[a-z0-9-]+}.yournewdomain.com`)"
```

### 3. DNS Configuration

Ensure your DNS has:
- A record for `yournewdomain.com` → Your server IP
- Wildcard A record for `*.yournewdomain.com` → Your server IP

### 4. SSL Certificates

If using Traefik with Let's Encrypt:

```yaml
labels:
  - "traefik.http.routers.pideai-app-custom.tls=true"
  - "traefik.http.routers.pideai-app-custom.tls.certresolver=letsencrypt"
```

## Development Setup

### Local Testing with Different Domains

1. **Using localhost**:
   ```javascript
   // The app will use localStorage for subdomain
   localStorage.setItem('dev_subdomain', 'mystore');
   ```

2. **Using /etc/hosts**:
   ```
   127.0.0.1 mystore.pideai.local
   127.0.0.1 mystore.artex.local
   ```

   Then update `getSubdomainFromHostname()` to recognize `.local` domains:
   ```typescript
   if (hostname.endsWith('.local')) {
     const parts = hostname.split('.');
     return parts[0];
   }
   ```

## Testing

### Test Subdomain Extraction

```javascript
// Console test
import { getSubdomainFromHostname, getCurrentDomain, formatSubdomainDisplay } from '@/lib/subdomain-validation';

console.log('Current subdomain:', getSubdomainFromHostname());
console.log('Current domain:', getCurrentDomain());
console.log('Full URL:', formatSubdomainDisplay('mystore'));
```

### Expected Outputs

| URL | Subdomain | Domain | Display |
|-----|-----------|--------|---------|
| `tienda1.pideai.com` | `tienda1` | `pideai.com` | `tienda1.pideai.com` |
| `tienda1.artex.lat` | `tienda1` | `artex.lat` | `tienda1.artex.lat` |
| `localhost:8080` | `totus` (from localStorage) | `pideai.com` | `totus.pideai.com` |

## Files Updated for Multi-Domain Support

### Core Libraries
- ✅ `src/lib/subdomain-validation.ts` - Domain detection and formatting

### Pages
- ✅ `src/pages/CreateStore.tsx` - Dynamic domain display
- ✅ `src/pages/platform-admin/StoresManager.tsx` - Store links
- ✅ `src/pages/platform-admin/PaymentValidations.tsx` - Payment info
- ✅ `src/pages/platform-admin/SubscriptionsManager.tsx` - Subscription display

### Infrastructure
- ✅ `Dockerfile.production` - Domain-agnostic
- ✅ `nginx.conf` - Wildcard server name
- ✅ `docker-compose.swarm.yml` - Traefik labels (if configured)

## Production Deployment

### Environment Variables

No special environment variables are needed for multi-domain support. The standard Supabase and PostHog variables apply:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-key
VITE_POSTHOG_KEY=your-key
VITE_POSTHOG_HOST=https://app.posthog.com
```

### Deployment Checklist

- [ ] DNS records configured for all domains
- [ ] SSL certificates obtained (via Traefik Let's Encrypt or manual)
- [ ] Traefik rules configured for all domains
- [ ] Database stores table contains correct subdomains
- [ ] Test subdomain resolution on all domains
- [ ] Verify CORS settings in Supabase allow all domains

## Troubleshooting

### Issue: Wrong domain displayed in UI

**Solution**: Clear browser cache and hard refresh. The domain is detected on page load.

### Issue: Subdomain not recognized

**Check**:
1. DNS is properly configured
2. Subdomain exists in `stores` table in database
3. Browser console for `getSubdomainFromHostname()` output

### Issue: CORS errors

**Solution**: Add all domains to Supabase CORS settings:
- `https://pideai.com`
- `https://*.pideai.com`
- `https://artex.lat`
- `https://*.artex.lat`

## Notes

- The application is **stateless** regarding domains - no server-side configuration needed
- Domain detection happens **client-side** in the browser
- The same Docker image works for **all domains**
- Store data is **shared across domains** (same database)
- A store with subdomain `tienda1` will be accessible as:
  - `tienda1.pideai.com`
  - `tienda1.artex.lat`

## Future Enhancements

Potential improvements for multi-domain support:

1. **Domain-specific branding**: Allow different logos/colors per domain
2. **Domain restrictions**: Limit certain stores to specific domains
3. **Custom domains**: Allow stores to use their own domains (e.g., `tienda.midominio.com`)
4. **Geographic routing**: Route to different databases based on domain
