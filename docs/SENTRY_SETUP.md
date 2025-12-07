# Sentry Integration - Setup Guide

This document provides comprehensive information about the Sentry integration in the PideAI Restaurant App.

## Overview

Sentry is fully integrated with the following features:
- ✅ **Error Tracking** - Automatic error capture and reporting
- ✅ **Performance Monitoring** - Track application performance and bottlenecks
- ✅ **Session Replay** - Record user sessions for debugging
- ✅ **User Feedback** - Built-in widget for users to report issues
- ✅ **Release Tracking** - Track deployments and regressions
- ✅ **Source Maps** - Debug production errors with original source code
- ✅ **Multi-tenant Context** - Automatic store and user context enrichment
- ✅ **Browser Profiling** - Deep performance insights

## Configuration

### DSN (Data Source Name)

The Sentry DSN is already configured in `src/main.tsx`:

```
https://63afd0c5a58daa15228eba85ac8356eb@o172702.ingest.us.sentry.io/4510482187878400
```

### Environment Variables

#### Required for Production Builds

```bash
# Auth token for uploading source maps (SECRET - never commit!)
SENTRY_AUTH_TOKEN=sntrys_xxxxxxxxxxxx

# Application version for release tracking
VITE_APP_VERSION=1.0.0  # Or use git commit hash
```

#### Getting Your Sentry Auth Token

1. Go to https://sentry.io/settings/account/api/auth-tokens/
2. Create a new token with the following scopes:
   - `project:read`
   - `project:releases`
   - `org:read`
3. Set it in your environment:
   - **Local**: Add to `.env` (never commit!)
   - **CI/CD**: Set as environment variable in your pipeline

## Features Breakdown

### 1. Error Tracking

All errors are automatically captured and sent to Sentry with:
- Full stack traces
- User context (ID, email, role)
- Store context (ID, name, subdomain)
- Browser information
- Custom breadcrumbs

**Error Boundary**: Wraps the entire app to catch React errors.

**Custom Error Tracking**:
```typescript
import { captureException } from '@/lib/sentry-utils';

captureException(error, {
  tags: { module: 'checkout' },
  extra: { orderId: '123' }
});
```

### 2. Performance Monitoring

**Sampling Rates**:
- Development: 100% of transactions
- Production: 20% of transactions

**Automatic Tracking**:
- Page loads
- Navigation (React Router)
- API calls (fetch/XHR)
- Long tasks (> 50ms)
- User interactions

**Manual Performance Tracking**:
```typescript
import { measureAsyncOperation } from '@/lib/sentry-utils';

await measureAsyncOperation('Load Products', async () => {
  return await fetchProducts();
}, { category: 'Menu' });
```

### 3. Session Replay

**Sampling Rates**:
- Development: 100% of sessions
- Production: 10% of normal sessions, 100% of error sessions

**Privacy Controls**:
- All text is masked by default
- All inputs are masked
- Media is not blocked (product images are visible)
- Network requests are captured

**Manually Trigger Replay**:
Session replay automatically starts on errors. No manual intervention needed.

### 4. User Feedback Widget

A feedback button is automatically added to the UI. Users can:
- Report bugs directly from the app
- Attach screenshots automatically
- Provide context about what they were doing

**Configuration**: Localized in Spanish with custom labels.

### 5. Release Tracking

**Automatic Setup**:
- Releases are created during production builds
- Source maps are uploaded automatically
- Git commits are tracked

**Manual Release Creation** (if needed):
```bash
# In CI/CD
export VITE_APP_VERSION=$(git rev-parse --short HEAD)
npm run build
```

### 6. Source Maps

Source maps are:
- Generated during production builds only
- Uploaded to Sentry automatically
- Deleted from the build output (not served to users)
- Used to de-minify stack traces in Sentry

**Configuration**: See `vite.config.ts` - `sentryVitePlugin`

### 7. Multi-tenant Context

Automatic context enrichment with:

**Store Context**:
- Store ID
- Store Name
- Subdomain
- Operating modes
- Active status

**User Context**:
- User ID
- Email
- Role (owner/customer)
- Store ownership status

**Location**: `src/contexts/StoreContext.tsx`

### 8. Browser Profiling

Captures detailed performance profiles including:
- Function call stacks
- Execution times
- Memory usage

**Sampling**: 100% in dev, 10% in production

## Custom Utilities

The app includes a comprehensive utilities file: `src/lib/sentry-utils.ts`

### Available Functions

#### Business Event Tracking
```typescript
import { trackOrderEvent, trackPaymentEvent } from '@/lib/sentry-utils';

// Track orders
trackOrderEvent('created', orderId, { total: 100, items: 3 });

// Track payments
trackPaymentEvent('completed', { method: 'cash', amount: 100 });
```

#### Performance Tracking
```typescript
import { measureAsyncOperation, createSpan } from '@/lib/sentry-utils';

// Measure async operations
const result = await measureAsyncOperation('Fetch Categories', fetchCategories);

// Create spans for detailed tracking
const span = createSpan('database', 'Query products');
// ... do work
span?.finish();
```

#### Breadcrumbs
```typescript
import { addBreadcrumb, trackUserAction } from '@/lib/sentry-utils';

// Add custom breadcrumb
addBreadcrumb('Product viewed', 'catalog', { productId: '123' });

// Track user actions
trackUserAction('click', 'checkout-button', { cartTotal: 150 });
```

#### Error Tracking
```typescript
import { captureException, trackSupabaseError } from '@/lib/sentry-utils';

// Capture exception with context
captureException(error, {
  tags: { module: 'orders' },
  extra: { orderId: '123' }
});

// Track Supabase errors
trackSupabaseError('insert_order', error, { table: 'orders' });
```

## Testing the Integration

### 1. Test Error Tracking

Add this button to any component temporarily:

```typescript
<button onClick={() => {
  throw new Error('Test Sentry Error!');
}}>
  Test Sentry
</button>
```

### 2. Test Performance Monitoring

Check the Sentry Performance dashboard after navigating around the app.

### 3. Test Session Replay

1. Trigger an error (see above)
2. Go to Sentry Issues
3. Click on the error
4. Look for the "Replay" tab

### 4. Test User Feedback

Look for the feedback button in the UI (usually bottom-right) and submit a test report.

## Viewing Data in Sentry

### Dashboard
- Go to: https://sentry.io/organizations/pideai/projects/pideai-restaurant-app/

### Issues (Errors)
- https://sentry.io/organizations/pideai/issues/

### Performance
- https://sentry.io/organizations/pideai/performance/

### Replays
- https://sentry.io/organizations/pideai/replays/

### Releases
- https://sentry.io/organizations/pideai/releases/

## Production Build

### Local Production Build

```bash
# Set environment variables
export SENTRY_AUTH_TOKEN=your_token_here
export VITE_APP_VERSION=$(git rev-parse --short HEAD)

# Build
npm run build

# Source maps will be uploaded automatically
```

### CI/CD Setup

Add these environment variables to your CI/CD:

```yaml
environment:
  SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
  VITE_APP_VERSION: ${{ github.sha }}
```

## Best Practices

### 1. Don't Over-Log
- Use appropriate log levels (info, warning, error)
- Don't send sensitive data (passwords, tokens, etc.)
- Filter out noise (ResizeObserver errors are already filtered)

### 2. Add Context
Always add relevant context to errors:
```typescript
Sentry.setTag('order_id', orderId);
Sentry.setContext('order', { items, total });
```

### 3. Use Breadcrumbs
Add breadcrumbs for important user actions to help debug:
```typescript
addBreadcrumb('User added item to cart', 'cart', { productId });
```

### 4. Monitor Performance
Track slow operations:
```typescript
await measureAsyncOperation('Heavy Operation', heavyFunction);
```

### 5. Privacy First
- Never send PII without consent
- Mask sensitive form fields
- Use Sentry's privacy controls

## Troubleshooting

### Source Maps Not Uploading

1. Check `SENTRY_AUTH_TOKEN` is set
2. Verify token has correct permissions
3. Check Sentry organization and project names in `vite.config.ts`
4. Run build with `--mode production`

### Errors Not Appearing

1. Check DSN is correct in `main.tsx`
2. Verify network access to Sentry
3. Check browser console for Sentry initialization messages
4. Ensure errors are being thrown in a trackable way

### Performance Data Missing

1. Check `tracesSampleRate` in config
2. Verify React Router integration is working
3. Check browser console for errors

### Session Replay Not Working

1. Check `replaysSessionSampleRate` is > 0
2. Verify you're using HTTPS (required for replay)
3. Trigger an error to force a replay capture

## Cost Optimization

Sentry pricing is based on:
- Error events
- Performance transactions
- Replay sessions

**Current Configuration**:
- Errors: All captured (optimize by filtering noise)
- Performance: 20% sampling in production
- Replays: 10% normal sessions, 100% error sessions
- Profiling: 10% in production

To reduce costs:
- Lower `tracesSampleRate`
- Lower `replaysSessionSampleRate`
- Filter out more error types in `beforeSend`

## Support & Documentation

- Sentry Docs: https://docs.sentry.io/platforms/javascript/guides/react/
- Sentry Support: https://sentry.io/support/
- Internal Team: Check with DevOps/Engineering leads

## Maintenance

### Regular Tasks

1. **Review Alerts** - Check Sentry daily for new critical errors
2. **Update SDK** - Keep `@sentry/react` up to date
3. **Clean Old Releases** - Archive old releases in Sentry UI
4. **Monitor Quotas** - Check usage doesn't exceed plan
5. **Review Filters** - Update `beforeSend` to filter noise

### Updates

To update Sentry packages:

```bash
npm update @sentry/react @sentry/vite-plugin
```

Check changelog: https://github.com/getsentry/sentry-javascript/releases

---

**Last Updated**: 2025-12-05
**Sentry Version**: @sentry/react v10.29.0
**Contact**: Development Team
