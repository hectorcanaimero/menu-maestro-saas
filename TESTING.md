# Testing Guide - PideAI

## 🎯 Overview

This project uses **Vitest** as the testing framework with **React Testing Library** for component testing. We aim for **60% code coverage** on critical paths before production deployment.

## 📦 Test Stack

- **Vitest 4.0.17** - Fast unit test framework
- **@testing-library/react 16.3.1** - React component testing utilities
- **@testing-library/jest-dom 6.9.1** - Custom jest matchers for DOM
- **@testing-library/user-event 14.6.1** - User interaction simulation
- **jsdom 27.4.0** - DOM implementation for Node.js

## 🚀 Running Tests

### Basic Commands

```bash
# Run all tests in watch mode
npm run test

# Run tests once (CI mode)
npm run test -- --run

# Run specific test file
npm run test CartContext.test.tsx

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Coverage Thresholds

The project is configured with **60% minimum coverage** for:
- Statements
- Branches
- Functions
- Lines

## 📁 Test Structure

```
src/
├── test/
│   ├── setup.ts              # Global test setup
│   └── mocks/
│       └── supabase.ts        # Supabase client mocks
├── contexts/
│   ├── CartContext.tsx
│   └── CartContext.test.tsx   # ✅ 16/16 tests passing
├── lib/
│   ├── secureStorage.ts
│   ├── secureStorage.test.ts  # ✅ 25/27 tests passing
│   ├── priceFormatter.ts
│   └── priceFormatter.test.ts # ✅ 30/30 tests passing
```

## 🧪 Test Examples

### Testing a Context

```typescript
import { renderHook, act, waitFor } from '@testing-library/react';
import { CartProvider, useCart } from './CartContext';

describe('CartContext', () => {
  it('should add item to cart', async () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    act(() => {
      result.current.addItem({
        id: '1',
        name: 'Pizza',
        price: 10,
        image_url: null,
      });
    });

    await waitFor(() => {
      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].name).toBe('Pizza');
    });
  });
});
```

### Testing a Utility Function

```typescript
import { describe, it, expect } from 'vitest';
import { formatPrice } from './priceFormatter';

describe('formatPrice', () => {
  it('should format USD price correctly', () => {
    const result = formatPrice(10.99, {
      currency: 'USD',
      decimalPlaces: 2,
      decimalSeparator: '.',
      thousandsSeparator: ',',
    });

    expect(result).toBe('$10.99');
  });
});
```

### Using Supabase Mocks

```typescript
import { mockSupabaseClient, mockAuthenticatedUser } from '@/test/mocks/supabase';

// Mock authenticated user
mockAuthenticatedUser('user-id', 'user@example.com');

// Mock RPC response
mockSupabaseClient.rpc.mockResolvedValue({
  data: { result: 'success' },
  error: null,
});
```

## 📊 Current Test Coverage

### Passing Tests (57/67 = 85% pass rate)

✅ **CartContext** - 16/16 tests (100%)
- generateCartItemId logic
- Add/remove/update cart items
- Total calculations
- localStorage persistence

✅ **priceFormatter** - 30/30 tests (100%)
- Currency formatting (USD, EUR, GBP, BRL, VES, etc.)
- Decimal separators
- Thousands separators
- Edge cases

⚠️ **secureStorage** - 25/27 tests (93%)
- Encryption/decryption
- Multiple data types
- Error handling
- 2 edge cases need crypto mock fixes

⚠️ **StoreContext** - 1/10 tests (10%)
- Complex async mocking needed
- Will be improved incrementally

## 🎯 Testing Priorities

### High Priority (Week 1-2)
- [x] CartContext
- [x] secureStorage
- [x] priceFormatter
- [ ] StoreContext (fix async mocks)
- [ ] useStoreStatus hook
- [ ] Checkout flow

### Medium Priority (Week 3-4)
- [ ] OrdersManager component
- [ ] MenuItemsManager component
- [ ] Payment validation
- [ ] WhatsApp integration

### Low Priority (Post-launch)
- [ ] Admin dashboard components
- [ ] Analytics components
- [ ] UI components

## 🔧 Configuration

### vitest.config.ts

```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      statements: 60,
      branches: 60,
      functions: 60,
      lines: 60,
    },
  },
});
```

### Mocked APIs

The test setup automatically mocks:
- `window.matchMedia` - Media query matching
- `IntersectionObserver` - Intersection observation
- `ResizeObserver` - Element resize observation
- `crypto.subtle` - Web Crypto API
- `localStorage` - Local storage
- `sessionStorage` - Session storage
- Supabase client - Database operations

## 🚦 CI/CD Integration

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Node.js versions: 18.x and 20.x

### GitHub Actions Workflow

```yaml
- name: Run tests
  run: npm run test -- --run

- name: Generate coverage
  run: npm run test:coverage
```

## 📝 Writing New Tests

### Checklist

- [ ] Import necessary testing utilities
- [ ] Mock external dependencies (Supabase, contexts)
- [ ] Clear mocks in `beforeEach`
- [ ] Use descriptive test names
- [ ] Test happy path first
- [ ] Test edge cases
- [ ] Test error scenarios
- [ ] Use `waitFor` for async operations
- [ ] Clean up side effects in `afterEach`

### Best Practices

1. **Test behavior, not implementation**
   - Focus on what the user sees/does
   - Avoid testing internal state

2. **Use semantic queries**
   - `getByRole`, `getByLabelText` over `getByTestId`
   - Follow accessibility best practices

3. **Keep tests isolated**
   - Each test should be independent
   - Don't rely on test execution order

4. **Mock at the right level**
   - Mock network calls, not components
   - Use real components when possible

5. **Make tests readable**
   - Use clear variable names
   - Add comments for complex scenarios
   - Follow AAA pattern (Arrange, Act, Assert)

## 🐛 Debugging Tests

```bash
# Run tests in debug mode
npm run test -- --inspect

# Run specific test with more info
npm run test CartContext.test.tsx -- --reporter=verbose

# Open Vitest UI for interactive debugging
npm run test:ui
```

## 📚 Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## 🎉 Contributing

Before submitting a PR:
1. Run `npm run test` - All tests should pass
2. Run `npm run test:coverage` - Coverage should meet thresholds
3. Add tests for new features
4. Update this guide if adding new test patterns

---

**Last Updated**: January 15, 2026
**Current Coverage**: ~40% overall, targeting 60%
