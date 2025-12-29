// Payment method types and interfaces

export type PaymentMethodType = 'pago_movil' | 'zelle' | 'binance' | 'otros';

// Type-specific payment details
export interface PagoMovilDetails {
  bank_code: string;
  cedula: string;
  phone: string;
}

export interface ZelleDetails {
  email: string;
  holder_name: string;
}

export interface BinanceDetails {
  key: string;
}

export interface OtrosDetails {
  name: string;
  description: string;
}

export type PaymentDetails = PagoMovilDetails | ZelleDetails | BinanceDetails | OtrosDetails;

// Main payment method interface
export interface PaymentMethod {
  id: string;
  store_id: string;
  name: string;
  description: string | null;
  is_active: boolean | null;
  display_order: number | null;
  payment_type: PaymentMethodType;
  payment_details: PaymentDetails | null;
  created_at?: string;
  updated_at?: string;
}

// Venezuelan bank codes for Pago Movil
export const VENEZUELAN_BANKS = [
  { code: '0102', name: 'Banco de Venezuela' },
  { code: '0104', name: 'Banco Venezolano de Crédito' },
  { code: '0105', name: 'Banco Mercantil' },
  { code: '0108', name: 'Banco Provincial' },
  { code: '0114', name: 'Banco del Caribe (Bancaribe)' },
  { code: '0115', name: 'Banco Exterior' },
  { code: '0128', name: 'Banco Caroni' },
  { code: '0134', name: 'Banesco' },
  { code: '0137', name: 'Banco Sofitasa' },
  { code: '0138', name: 'Banco Plaza' },
  { code: '0146', name: 'Bangente' },
  { code: '0151', name: 'Banco Fondo Común (BFC)' },
  { code: '0156', name: '100% Banco' },
  { code: '0157', name: 'Del Sur Banco Universal' },
  { code: '0163', name: 'Banco del Tesoro' },
  { code: '0166', name: 'Banco Agrícola de Venezuela' },
  { code: '0168', name: 'Bancrecer' },
  { code: '0169', name: 'Mi Banco' },
  { code: '0171', name: 'Banco Activo' },
  { code: '0172', name: 'Bancamiga' },
  { code: '0173', name: 'Banco Internacional de Desarrollo' },
  { code: '0174', name: 'Banplus' },
  { code: '0175', name: 'Banco Bicentenario' },
  { code: '0177', name: 'Banco de la Fuerza Armada Nacional Bolivariana' },
  { code: '0191', name: 'Banco Nacional de Crédito (BNC)' },
] as const;

// Helper functions for payment method copy text
export const formatPagoMovilCopyText = (details: PagoMovilDetails): string => {
  return `${details.bank_code} ${details.cedula} ${details.phone}`;
};

export const formatZelleCopyText = (details: ZelleDetails): string => {
  return details.email;
};

export const formatBinanceCopyText = (details: BinanceDetails): string => {
  return details.key;
};

export const formatOtrosCopyText = (details: OtrosDetails): string => {
  return details.description;
};
