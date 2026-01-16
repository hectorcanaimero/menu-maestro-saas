import { vi } from 'vitest';

// Mock Supabase client
export const mockSupabaseClient = {
  auth: {
    getSession: vi.fn().mockResolvedValue({
      data: { session: null },
      error: null,
    }),
    getUser: vi.fn().mockResolvedValue({
      data: { user: null },
      error: null,
    }),
    signInWithPassword: vi.fn().mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    }),
    signOut: vi.fn().mockResolvedValue({
      error: null,
    }),
    onAuthStateChange: vi.fn().mockReturnValue({
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    }),
    updateUser: vi.fn().mockResolvedValue({
      data: { user: null },
      error: null,
    }),
    resetPasswordForEmail: vi.fn().mockResolvedValue({
      data: {},
      error: null,
    }),
  },
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: null,
      error: null,
    }),
    maybeSingle: vi.fn().mockResolvedValue({
      data: null,
      error: null,
    }),
  }),
  rpc: vi.fn().mockResolvedValue({
    data: null,
    error: null,
  }),
  storage: {
    from: vi.fn().mockReturnValue({
      upload: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
      download: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
      remove: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
      getPublicUrl: vi.fn().mockReturnValue({
        data: { publicUrl: 'https://example.com/image.jpg' },
      }),
    }),
  },
};

// Mock Supabase module
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabaseClient,
}));

// Helper to reset all mocks
export const resetSupabaseMocks = () => {
  Object.values(mockSupabaseClient.auth).forEach((mock) => {
    if (typeof mock === 'function' && 'mockClear' in mock) {
      (mock as any).mockClear();
    }
  });
  mockSupabaseClient.from.mockClear();
  mockSupabaseClient.rpc.mockClear();
};

// Helper to mock authenticated user
export const mockAuthenticatedUser = (userId: string = 'test-user-id', email: string = 'test@example.com') => {
  mockSupabaseClient.auth.getSession.mockResolvedValue({
    data: {
      session: {
        user: {
          id: userId,
          email,
          aud: 'authenticated',
          role: 'authenticated',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          app_metadata: {},
          user_metadata: {},
        },
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
        expires_at: Date.now() / 1000 + 3600,
        token_type: 'bearer',
      },
    },
    error: null,
  });

  mockSupabaseClient.auth.getUser.mockResolvedValue({
    data: {
      user: {
        id: userId,
        email,
        aud: 'authenticated',
        role: 'authenticated',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {},
      },
    },
    error: null,
  });
};

// Helper to mock unauthenticated user
export const mockUnauthenticatedUser = () => {
  mockSupabaseClient.auth.getSession.mockResolvedValue({
    data: { session: null },
    error: null,
  });

  mockSupabaseClient.auth.getUser.mockResolvedValue({
    data: { user: null },
    error: null,
  });
};

// Mock store data
export const mockStore = {
  id: 'mock-store-id',
  subdomain: 'totus',
  name: 'Test Store',
  owner_id: 'test-user-id',
  description: 'Test store description',
  logo_url: null,
  banner_url: null,
  phone: '+1234567890',
  email: 'store@example.com',
  address: 'Test Address',
  is_active: true,
  operating_modes: ['delivery', 'pickup'],
  force_status: 'normal',
  currency: 'USD',
  decimal_places: 2,
  decimal_separator: '.',
  thousands_separator: ',',
  accept_cash: true,
  payment_on_delivery: 'optional',
  require_payment_proof: false,
  minimum_order_price: 10,
  redirect_to_whatsapp: false,
  order_product_template: null,
  order_message_template_delivery: null,
  order_message_template_pickup: null,
  order_message_template_digital_menu: null,
  estimated_delivery_time: '30-45 min',
  skip_payment_digital_menu: false,
  delivery_price_mode: 'fixed',
  fixed_delivery_price: 5,
  remove_zipcode: false,
  remove_address_number: false,
  enable_audio_notifications: true,
  notification_volume: 80,
  notification_repeat_count: 3,
  primary_color: '#000000',
  price_color: '#00FF00',
  enable_currency_conversion: false,
  use_manual_exchange_rate: false,
  manual_usd_ves_rate: null,
  manual_eur_ves_rate: null,
  active_currency: 'original',
  catalog_mode: false,
  is_food_business: true,
};
