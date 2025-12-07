# Chatwoot Implementation Summary

## Overview

Chatwoot live chat widget has been successfully integrated into the PideAI application. The implementation uses a custom React hook for better control and follows React best practices.

## What Was Implemented

### 1. Custom React Hook
**File**: [src/hooks/useChatwoot.ts](src/hooks/useChatwoot.ts)

A fully-featured React hook that:
- Dynamically loads the Chatwoot SDK script
- Provides configuration options (position, locale, visibility)
- Returns helper functions for programmatic control
- Handles cleanup on component unmount
- Includes TypeScript definitions for the Chatwoot SDK

Features:
```typescript
const chatwoot = useChatwoot({
  websiteToken: 'w6ca8SJxutDVrXby1mjDTj5D',
  baseUrl: 'https://woot.guria.lat',
  enabled: true,
  position: 'right',
  locale: 'es',
});

// Available methods:
chatwoot.toggle('open' | 'close');
chatwoot.setUser(id, userData);
chatwoot.setCustomAttributes(attributes);
chatwoot.reset();
```

### 2. Admin Dashboard Integration
**File**: [src/pages/admin/AdminDashboard.tsx](src/pages/admin/AdminDashboard.tsx)

The hook is integrated in the Admin Dashboard component:
- Loads only when admin visits `/admin` (dashboard)
- Automatically identifies logged-in admin users
- Positioned on the right side
- Spanish locale by default
- Sets custom attributes for context (user_type, role)

Current configuration:
```typescript
const chatwoot = useChatwoot({
  websiteToken: 'w6ca8SJxutDVrXby1mjDTj5D',
  baseUrl: 'https://woot.guria.lat',
  enabled: true,
  position: 'right',
  locale: 'es',
});

// Auto-identify admin user
if (chatwoot && session.user) {
  chatwoot.setUser(session.user.id, {
    email: session.user.email,
    name: session.user.user_metadata?.name || session.user.email,
  });

  chatwoot.setCustomAttributes({
    user_type: 'store_admin',
    role: 'admin',
    logged_in_at: new Date().toISOString(),
  });
}
```

### 3. Demo Component (Optional)
**File**: [src/components/ChatwootControl.tsx](src/components/ChatwootControl.tsx)

A demonstration component showing how to:
- Open/close the widget programmatically
- Set user information
- Set custom attributes
- Reset the widget

**Note**: This is for testing purposes. Remove from production or use only in development mode.

### 4. Documentation
Created comprehensive documentation:
- **[CHATWOOT_SETUP.md](CHATWOOT_SETUP.md)**: Complete setup guide with examples
- **[CHATWOOT_IMPLEMENTATION.md](CHATWOOT_IMPLEMENTATION.md)**: This file
- Updated **[.env.example](.env.example)**: Added Chatwoot environment variables

## Configuration

### Current Setup (Hardcoded)
The widget is currently configured with hardcoded values in `App.tsx`. This is fine for development but should be moved to environment variables for production.

### Recommended: Environment Variables

1. Add to `.env`:
```env
VITE_CHATWOOT_WEBSITE_TOKEN=w6ca8SJxutDVrXby1mjDTj5D
VITE_CHATWOOT_BASE_URL=https://woot.guria.lat
```

2. Update `App.tsx`:
```typescript
useChatwoot({
  websiteToken: import.meta.env.VITE_CHATWOOT_WEBSITE_TOKEN || '',
  baseUrl: import.meta.env.VITE_CHATWOOT_BASE_URL || '',
  enabled: !!(
    import.meta.env.VITE_CHATWOOT_WEBSITE_TOKEN &&
    import.meta.env.VITE_CHATWOOT_BASE_URL
  ),
  position: 'right',
  locale: 'es',
});
```

## Advanced Usage Examples

### Example 1: Conditional Loading Based on Route
```typescript
import { useLocation } from 'react-router-dom';

const AppContent = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  useChatwoot({
    websiteToken: 'w6ca8SJxutDVrXby1mjDTj5D',
    baseUrl: 'https://woot.guria.lat',
    enabled: !isAdminRoute, // Hide on admin pages
    position: 'right',
    locale: 'es',
  });

  return <Routes>...</Routes>;
};
```

### Example 2: Auto-identify Users After Login
```typescript
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

const AppContent = () => {
  const { user } = useAuth();

  const chatwoot = useChatwoot({
    websiteToken: 'w6ca8SJxutDVrXby1mjDTj5D',
    baseUrl: 'https://woot.guria.lat',
    enabled: true,
    position: 'right',
    locale: 'es',
  });

  // Identify user when they log in
  useEffect(() => {
    if (user && chatwoot) {
      chatwoot.setUser(user.id, {
        email: user.email,
        name: user.name,
        phone_number: user.phone,
      });

      // Add context
      chatwoot.setCustomAttributes({
        subscription: user.subscription_tier,
        store_count: user.stores?.length || 0,
        last_login: new Date().toISOString(),
      });
    }
  }, [user, chatwoot]);

  return <Routes>...</Routes>;
};
```

### Example 3: Reset on Logout
```typescript
const handleLogout = () => {
  if (window.$chatwoot) {
    window.$chatwoot.reset();
  }
  // Your logout logic...
};
```

## Testing

### Build Test
The implementation has been tested and builds successfully:
```bash
npm run build
# ✓ built in 18.89s
```

### Manual Testing Steps

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Check Widget Appearance**
   - Look for the Chatwoot bubble in the bottom-right corner
   - It should appear on all pages

3. **Test Basic Functionality**
   - Click the bubble to open the chat
   - Send a test message
   - Check if messages appear in your Chatwoot dashboard

4. **Test Control Panel (Optional)**
   - Import `ChatwootControl` component
   - Test all buttons (Open, Close, Set User, Set Attributes, Reset)

## Integration with Existing Features

### Store Context Integration
```typescript
import { useStore } from '@/contexts/StoreContext';

const AppContent = () => {
  const { store, isStoreOwner } = useStore();

  const chatwoot = useChatwoot({
    websiteToken: 'w6ca8SJxutDVrXby1mjDTj5D',
    baseUrl: 'https://woot.guria.lat',
    enabled: !isStoreOwner, // Only show to customers
    position: 'right',
    locale: 'es',
  });

  useEffect(() => {
    if (store && chatwoot) {
      chatwoot.setCustomAttributes({
        store_name: store.name,
        store_subdomain: store.subdomain,
        operating_mode: store.operating_mode,
      });
    }
  }, [store, chatwoot]);

  return <Routes>...</Routes>;
};
```

### Cart Context Integration
```typescript
import { useCart } from '@/contexts/CartContext';

const AppContent = () => {
  const { items } = useCart();

  const chatwoot = useChatwoot({
    websiteToken: 'w6ca8SJxutDVrXby1mjDTj5D',
    baseUrl: 'https://woot.guria.lat',
    enabled: true,
    position: 'right',
    locale: 'es',
  });

  useEffect(() => {
    if (chatwoot) {
      chatwoot.setCustomAttributes({
        cart_items: items.length,
        cart_total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      });
    }
  }, [items, chatwoot]);

  return <Routes>...</Routes>;
};
```

## Browser Console Logs

The implementation includes helpful console logs:
- `[Chatwoot] SDK already loaded` - Widget already initialized
- `[Chatwoot] Widget initialized successfully` - Successful initialization
- `[Chatwoot] Failed to initialize widget:` - Initialization error
- `[Chatwoot] Failed to load SDK script` - Script loading error
- `[Chatwoot] Error during cleanup:` - Cleanup error

## Files Modified/Created

### Created Files

1. `src/hooks/useChatwoot.ts` - Main hook implementation
2. `src/components/ChatwootControl.tsx` - Demo control panel
3. `CHATWOOT_SETUP.md` - Comprehensive setup guide
4. `CHATWOOT_IMPLEMENTATION.md` - This file

### Modified Files

1. `src/pages/admin/AdminDashboard.tsx` - Added Chatwoot widget integration
2. `.env.example` - Added Chatwoot environment variables

## Next Steps

### Immediate (Optional)
1. Move configuration to environment variables
2. Test on different routes
3. Test user identification flow
4. Configure conditional loading based on user role

### Future Enhancements
1. **Auto-identify users**: Integrate with authentication system
2. **Context-aware attributes**: Pass store, cart, and order data
3. **Route-based visibility**: Hide on specific pages (admin panel, checkout, etc.)
4. **Custom triggers**: Open widget on specific events (order issues, etc.)
5. **Localization**: Support multiple languages based on store settings
6. **Analytics**: Track chat engagement with PostHog

## Troubleshooting

### Widget Not Showing
- Check browser console for errors
- Verify `websiteToken` and `baseUrl` are correct
- Check if `enabled: true` in configuration
- Clear browser cache and reload

### Widget Shows But Can't Connect
- Verify Chatwoot instance is accessible: https://woot.guria.lat
- Check network tab for failed requests
- Verify website token is valid in Chatwoot dashboard

### Widget Shows on Wrong Routes
- Use conditional `enabled` prop based on route
- Example: `enabled: !location.pathname.startsWith('/admin')`

## Resources

- [Chatwoot Official Docs](https://www.chatwoot.com/docs)
- [Chatwoot SDK Reference](https://www.chatwoot.com/docs/product/channels/live-chat/sdk/setup)
- [Custom Attributes Guide](https://www.chatwoot.com/docs/product/channels/live-chat/sdk/custom-attributes)
- [Chatwoot API](https://www.chatwoot.com/developers/api/)

## Support

For issues with:
- **Integration**: Check this documentation and [CHATWOOT_SETUP.md](CHATWOOT_SETUP.md)
- **Chatwoot Platform**: Contact Chatwoot support or check their documentation
- **Custom Implementation**: Review [src/hooks/useChatwoot.ts](src/hooks/useChatwoot.ts)
