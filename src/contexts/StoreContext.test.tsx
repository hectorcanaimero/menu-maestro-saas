import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { StoreProvider, useStore } from './StoreContext';
import { mockSupabaseClient, mockStore, mockAuthenticatedUser, resetSupabaseMocks } from '@/test/mocks/supabase';

// Mock dependencies
vi.mock('@/lib/subdomain-validation', () => ({
  getSubdomainFromHostname: vi.fn(() => 'totus'),
  getCurrentDomain: vi.fn(() => 'pideai.com'),
}));

vi.mock('@/hooks/useAutoUpdateRates', () => ({
  useAutoUpdateRates: vi.fn(),
}));

vi.mock('posthog-js', () => ({
  default: {
    identify: vi.fn(),
    people: { set: vi.fn() },
    reset: vi.fn(),
    register: vi.fn(),
  },
}));

vi.mock('@sentry/react', () => ({
  setContext: vi.fn(),
  setUser: vi.fn(),
  setTag: vi.fn(),
}));

describe('StoreContext', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    vi.clearAllMocks();
  });

  describe('loadStore', () => {
    it('should load store data successfully via RPC', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: [
          {
            store_data: mockStore,
            is_owner: false,
            rate_limit_ok: true,
            error_message: null,
          },
        ],
        error: null,
      });

      const { result } = renderHook(() => useStore(), {
        wrapper: StoreProvider,
      });

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.store).toMatchObject({
        id: mockStore.id,
        subdomain: mockStore.subdomain,
        name: mockStore.name,
      });
      expect(result.current.isStoreOwner).toBe(false);
    });

    it('should fallback to direct query if RPC fails', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: null,
        error: { message: 'RPC failed' },
      });

      const mockFromChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockStore,
          error: null,
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockFromChain);

      const { result } = renderHook(() => useStore(), {
        wrapper: StoreProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.store).toMatchObject({
        id: mockStore.id,
        subdomain: mockStore.subdomain,
      });
    });

    it('should set store to null if not found', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: [
          {
            store_data: null,
            is_owner: false,
            rate_limit_ok: true,
            error_message: 'Store not found',
          },
        ],
        error: null,
      });

      const { result } = renderHook(() => useStore(), {
        wrapper: StoreProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.store).toBeNull();
    });

    it('should set store to null if rate limit exceeded', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: [
          {
            store_data: mockStore,
            is_owner: false,
            rate_limit_ok: false,
            error_message: 'Rate limit exceeded',
          },
        ],
        error: null,
      });

      const { result } = renderHook(() => useStore(), {
        wrapper: StoreProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.store).toBeNull();
    });
  });

  describe('checkOwnership', () => {
    it('should identify store owner correctly', async () => {
      mockAuthenticatedUser('test-user-id', 'owner@example.com');

      mockSupabaseClient.rpc.mockResolvedValue({
        data: [
          {
            store_data: mockStore,
            is_owner: true,
            rate_limit_ok: true,
            error_message: null,
          },
        ],
        error: null,
      });

      const { result } = renderHook(() => useStore(), {
        wrapper: StoreProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isStoreOwner).toBe(true);
    });

    it('should identify non-owner correctly', async () => {
      mockAuthenticatedUser('different-user-id', 'customer@example.com');

      mockSupabaseClient.rpc.mockResolvedValue({
        data: [
          {
            store_data: mockStore,
            is_owner: false,
            rate_limit_ok: true,
            error_message: null,
          },
        ],
        error: null,
      });

      const { result } = renderHook(() => useStore(), {
        wrapper: StoreProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isStoreOwner).toBe(false);
    });

    it('should redirect user to their own store if they own a different one', async () => {
      mockAuthenticatedUser('other-user-id', 'owner@otherstore.com');

      const userOwnedStore = {
        subdomain: 'mystore',
        name: 'My Store',
      };

      // Mock RPC to return user's owned store
      const mockRpcImplementation = vi.fn((functionName: string) => {
        if (functionName === 'get_store_by_subdomain_secure') {
          return Promise.resolve({
            data: [
              {
                store_data: mockStore,
                is_owner: false,
                rate_limit_ok: true,
                error_message: null,
              },
            ],
            error: null,
          });
        } else if (functionName === 'get_user_owned_store') {
          return {
            single: vi.fn().mockResolvedValue({
              data: userOwnedStore,
              error: null,
            }),
          };
        }
        return Promise.resolve({ data: null, error: null });
      });

      mockSupabaseClient.rpc.mockImplementation(mockRpcImplementation as any);

      const originalLocation = window.location;
      delete (window as any).location;
      window.location = { ...originalLocation, href: '' } as any;

      renderHook(() => useStore(), {
        wrapper: StoreProvider,
      });

      await waitFor(
        () => {
          expect(window.location.href).toContain('mystore.pideai.com');
        },
        { timeout: 3000 }
      );

      window.location = originalLocation;
    });
  });

  describe('reloadStore', () => {
    it('should reload store data when called', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: [
          {
            store_data: mockStore,
            is_owner: false,
            rate_limit_ok: true,
            error_message: null,
          },
        ],
        error: null,
      });

      const { result } = renderHook(() => useStore(), {
        wrapper: StoreProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockSupabaseClient.rpc).toHaveBeenCalledTimes(1);

      // Update mock to return different data
      const updatedStore = { ...mockStore, name: 'Updated Store Name' };
      mockSupabaseClient.rpc.mockResolvedValue({
        data: [
          {
            store_data: updatedStore,
            is_owner: false,
            rate_limit_ok: true,
            error_message: null,
          },
        ],
        error: null,
      });

      await result.current.reloadStore();

      await waitFor(() => {
        expect(result.current.store?.name).toBe('Updated Store Name');
      });

      expect(mockSupabaseClient.rpc).toHaveBeenCalledTimes(2);
    });
  });

  describe('auth state changes', () => {
    it('should update ownership when user signs in', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: [
          {
            store_data: mockStore,
            is_owner: false,
            rate_limit_ok: true,
            error_message: null,
          },
        ],
        error: null,
      });

      let authCallback: any;
      mockSupabaseClient.auth.onAuthStateChange.mockImplementation((callback) => {
        authCallback = callback;
        return {
          data: {
            subscription: {
              unsubscribe: vi.fn(),
            },
          },
        };
      });

      const { result } = renderHook(() => useStore(), {
        wrapper: StoreProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isStoreOwner).toBe(false);

      // Simulate SIGNED_IN event with owner user
      mockAuthenticatedUser(mockStore.owner_id, 'owner@example.com');

      if (authCallback) {
        authCallback('SIGNED_IN', {
          user: {
            id: mockStore.owner_id,
            email: 'owner@example.com',
          },
        });
      }

      await waitFor(() => {
        expect(result.current.isStoreOwner).toBe(true);
      });
    });

    it('should reset ownership when user signs out', async () => {
      mockAuthenticatedUser(mockStore.owner_id);

      mockSupabaseClient.rpc.mockResolvedValue({
        data: [
          {
            store_data: mockStore,
            is_owner: true,
            rate_limit_ok: true,
            error_message: null,
          },
        ],
        error: null,
      });

      let authCallback: any;
      mockSupabaseClient.auth.onAuthStateChange.mockImplementation((callback) => {
        authCallback = callback;
        return {
          data: {
            subscription: {
              unsubscribe: vi.fn(),
            },
          },
        };
      });

      const { result } = renderHook(() => useStore(), {
        wrapper: StoreProvider,
      });

      await waitFor(() => {
        expect(result.current.isStoreOwner).toBe(true);
      });

      // Simulate SIGNED_OUT event
      if (authCallback) {
        authCallback('SIGNED_OUT', null);
      }

      await waitFor(() => {
        expect(result.current.isStoreOwner).toBe(false);
      });
    });
  });

  describe('error handling', () => {
    it('should handle RPC errors gracefully', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      // Fallback should also fail
      const mockFromChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockFromChain);

      const { result } = renderHook(() => useStore(), {
        wrapper: StoreProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.store).toBeNull();
      expect(result.current.isStoreOwner).toBe(false);
    });
  });
});
