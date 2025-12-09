/**
 * Exchange Rate Types
 * Types for currency conversion (EUR/USD -> VES) using BCV rates
 */

export interface BCVResponse {
  fuente: string;
  nombre: string;
  promedio: number;
  fechaActualizacion: string;
}

export interface ExchangeRate {
  id: string;
  from_currency: 'USD' | 'EUR';
  to_currency: 'VES';
  rate: number;
  source: 'bcv_auto' | 'manual';
  store_id: string | null;
  last_updated: string;
  created_at: string;
}

export interface ExchangeRateInsert {
  from_currency: 'USD' | 'EUR';
  to_currency: 'VES';
  rate: number;
  source: 'bcv_auto' | 'manual';
  store_id?: string | null;
}

export interface ExchangeRateUpdate {
  rate?: number;
  source?: 'bcv_auto' | 'manual';
  last_updated?: string;
}

export interface StoreExchangeRateSettings {
  enable_currency_conversion: boolean;
  use_manual_exchange_rate: boolean;
  manual_usd_ves_rate: number | null;
  manual_eur_ves_rate: number | null;
}

export interface ExchangeRateResult {
  rate: number | null;
  isLoading: boolean;
  lastUpdate: string | null;
  source: 'bcv_auto' | 'manual' | null;
  error: string | null;
}

export type CurrencyPair = 'USD-VES' | 'EUR-VES';

export const BCV_WEBHOOKS = {
  'USD-VES': 'https://webhooks.guria.lat/webhook/a4b29525-f9a9-4374-a76f-c462046357b5',
  'EUR-VES': 'https://webhooks.guria.lat/webhook/6ed6fb33-d736-43af-9038-7a7e2a2a1116',
} as const;
