# Chatwoot Integration Setup

This document explains how the Chatwoot live chat widget is integrated into the application.

## Overview

Chatwoot is a customer support chat platform that provides a widget for live chat support. The integration is implemented using a custom React hook that dynamically loads the Chatwoot SDK.

## Configuration

### Current Setup (Hardcoded)

The widget is currently configured in the Admin Dashboard at [src/pages/admin/AdminDashboard.tsx](src/pages/admin/AdminDashboard.tsx):

```typescript
useChatwoot({
  websiteToken: 'w6ca8SJxutDVrXby1mjDTj5D',
  baseUrl: 'https://woot.guria.lat',
  enabled: true,
  position: 'right',
  locale: 'es',
});
```

**Note**: The widget only appears in `/admin` (Admin Dashboard) to provide support to store administrators.

### Moving to Environment Variables (Recommended)

For better security and flexibility, move these values to environment variables:

1. Add to your `.env` file:
```env
VITE_CHATWOOT_WEBSITE_TOKEN=w6ca8SJxutDVrXby1mjDTj5D
VITE_CHATWOOT_BASE_URL=https://woot.guria.lat
```

2. Update [src/App.tsx](src/App.tsx):
```typescript
useChatwoot({
  websiteToken: import.meta.env.VITE_CHATWOOT_WEBSITE_TOKEN || '',
  baseUrl: import.meta.env.VITE_CHATWOOT_BASE_URL || '',
  enabled: !!(import.meta.env.VITE_CHATWOOT_WEBSITE_TOKEN && import.meta.env.VITE_CHATWOOT_BASE_URL),
  position: 'right',
  locale: 'es',
});
```

## Features

### Basic Features
- ✅ Automatic widget loading on app initialization
- ✅ Configurable position (left/right)
- ✅ Multi-language support (configured for Spanish)
- ✅ Responsive design
- ✅ Automatic cleanup on unmount

### Advanced Features (Available via Hook API)

The `useChatwoot` hook returns helper functions:

```typescript
const chatwoot = useChatwoot({...config});

// Open/close widget programmatically
chatwoot.toggle('open');
chatwoot.toggle('close');

// Set user information (after authentication)
chatwoot.setUser('user-123', {
  email: 'user@example.com',
  name: 'John Doe',
  avatar_url: 'https://example.com/avatar.jpg',
  phone_number: '+1234567890',
});

// Set custom attributes (for context)
chatwoot.setCustomAttributes({
  store_id: 'store-123',
  role: 'customer',
  order_count: 5,
});

// Reset widget (on logout)
chatwoot.reset();
```

## Conditional Loading

You can conditionally enable/disable the widget based on routes or user roles:

### Example 1: Hide on Admin Routes

```typescript
import { useLocation } from 'react-router-dom';

const AppContent = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  useChatwoot({
    websiteToken: 'w6ca8SJxutDVrXby1mjDTj5D',
    baseUrl: 'https://woot.guria.lat',
    enabled: !isAdminRoute, // Disable on admin routes
    position: 'right',
    locale: 'es',
  });

  return <Routes>...</Routes>;
};
```

### Example 2: Different Settings per User Role

```typescript
import { useStore } from '@/contexts/StoreContext';

const AppContent = () => {
  const { isStoreOwner } = useStore();

  useChatwoot({
    websiteToken: 'w6ca8SJxutDVrXby1mjDTj5D',
    baseUrl: 'https://woot.guria.lat',
    enabled: !isStoreOwner, // Only show to customers
    position: 'right',
    locale: 'es',
  });

  return <Routes>...</Routes>;
};
```

## Integration with User Context

To automatically identify users when they log in:

```typescript
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth'; // Assuming you have an auth hook

const AppContent = () => {
  const { user } = useAuth();

  const chatwoot = useChatwoot({
    websiteToken: 'w6ca8SJxutDVrXby1mjDTj5D',
    baseUrl: 'https://woot.guria.lat',
    enabled: true,
    position: 'right',
    locale: 'es',
  });

  // Set user info when authenticated
  useEffect(() => {
    if (user && chatwoot) {
      chatwoot.setUser(user.id, {
        email: user.email,
        name: user.name,
      });
    }
  }, [user, chatwoot]);

  return <Routes>...</Routes>;
};
```

## Files

- **Hook Implementation**: [src/hooks/useChatwoot.ts](src/hooks/useChatwoot.ts)
- **Integration Point**: [src/App.tsx](src/App.tsx) (AppContent component)
- **Environment Variables**: [.env.example](.env.example)

## Chatwoot Settings

Available configuration options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `websiteToken` | string | required | Your Chatwoot inbox website token |
| `baseUrl` | string | required | Your Chatwoot instance URL |
| `enabled` | boolean | `true` | Enable/disable the widget |
| `hideMessageBubble` | boolean | `false` | Hide the bubble when widget is closed |
| `position` | 'left' \| 'right' | `'right'` | Position of the widget |
| `locale` | string | `'es'` | Language code (es, en, fr, etc.) |

## Troubleshooting

### Widget Not Appearing

1. Check browser console for errors
2. Verify the `websiteToken` is correct
3. Verify the `baseUrl` is accessible
4. Check if widget is enabled: `enabled: true`

### Widget Appearing on Wrong Routes

Use conditional loading as shown in the examples above.

### User Information Not Syncing

Make sure to call `setUser()` after the user authenticates and the widget loads.

## Resources

- [Chatwoot Documentation](https://www.chatwoot.com/docs)
- [Chatwoot SDK Reference](https://www.chatwoot.com/docs/product/channels/live-chat/sdk/setup)
- [Custom Attributes](https://www.chatwoot.com/docs/product/channels/live-chat/sdk/custom-attributes)
