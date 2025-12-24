/**
 * Subdomain Validation Utilities
 *
 * Client-side validation for subdomains before making server requests.
 * Server-side validation is the authority (validate_subdomain RPC function).
 */

export interface SubdomainValidationResult {
  isValid: boolean;
  errorMessage: string | null;
}

/**
 * List of reserved subdomains that cannot be used for stores
 */
export const RESERVED_SUBDOMAINS = [
  // 'www',
  'admin',
  'api',
  'app',
  'dashboard',
  'auth',
  'login',
  'signup',
  'register',
  'mail',
  'email',
  'ftp',
  'localhost',
  'staging',
  'dev',
  'test',
  'demo',
  'beta',
  'secure',
  'ssl',
  'support',
  'help',
  'status',
  'blog',
  'docs',
  'cdn',
  'static',
  'assets',
  'media',
  'files',
  'upload',
  'download',
] as const;

/**
 * Validates subdomain format (client-side)
 *
 * Rules:
 * - Minimum 3 characters
 * - Maximum 63 characters (DNS limit)
 * - Only lowercase letters, numbers, and hyphens
 * - Cannot start or end with hyphen
 * - Cannot have consecutive hyphens
 * - Cannot be a reserved subdomain
 *
 * @param subdomain - The subdomain to validate
 * @returns Validation result with error message if invalid
 */
export function validateSubdomainFormat(subdomain: string): SubdomainValidationResult {
  // Check if empty
  if (!subdomain || subdomain.trim().length === 0) {
    return {
      isValid: false,
      errorMessage: 'El subdominio no puede estar vacío',
    };
  }

  const trimmed = subdomain.trim().toLowerCase();

  // Check minimum length
  if (trimmed.length < 3) {
    return {
      isValid: false,
      errorMessage: 'El subdominio debe tener al menos 3 caracteres',
    };
  }

  // Check maximum length (DNS limit)
  if (trimmed.length > 63) {
    return {
      isValid: false,
      errorMessage: 'El subdominio debe tener menos de 63 caracteres',
    };
  }

  // Check format: only lowercase letters, numbers, and hyphens
  const formatRegex = /^[a-z0-9-]+$/;
  if (!formatRegex.test(trimmed)) {
    return {
      isValid: false,
      errorMessage: 'El subdominio solo puede contener letras minúsculas, números y guiones',
    };
  }

  // Check: cannot start or end with hyphen
  if (trimmed.startsWith('-') || trimmed.endsWith('-')) {
    return {
      isValid: false,
      errorMessage: 'El subdominio no puede comenzar o terminar con un guion',
    };
  }

  // Check: cannot have consecutive hyphens
  if (trimmed.includes('--')) {
    return {
      isValid: false,
      errorMessage: 'El subdominio no puede contener guiones consecutivos',
    };
  }

  // Check if reserved
  if (RESERVED_SUBDOMAINS.includes(trimmed as any)) {
    return {
      isValid: false,
      errorMessage: 'Este subdominio está reservado y no puede ser usado',
    };
  }

  return {
    isValid: true,
    errorMessage: null,
  };
}

/**
 * Supported domains for multi-tenant deployment
 */
const SUPPORTED_DOMAINS = ['pideai.com', 'artex.lat'] as const;

/**
 * Extracts subdomain from hostname
 *
 * Development: Uses localStorage 'dev_subdomain' (default: 'totus')
 * Production: Extracts from hostname (e.g., 'tienda1.pideai.com' -> 'tienda1' or 'tienda1.artex.lat' -> 'tienda1')
 *
 * @returns The extracted subdomain
 */
export function getSubdomainFromHostname(): string {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');

  // Development mode (localhost)
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
    const devSubdomain = localStorage.getItem('dev_subdomain') || 'www';
    // If dev_subdomain is 'www', return empty string to indicate main domain
    return devSubdomain === 'www' ? '' : devSubdomain;
  }

  // Production mode - check all supported domains
  for (const domain of SUPPORTED_DOMAINS) {
    if (hostname.endsWith(domain) && parts.length >= 3) {
      // Extract subdomain (first part before domain)
      const domainParts = domain.split('.');
      const subdomainParts = parts.slice(0, parts.length - domainParts.length);
      const subdomain = subdomainParts.join('.');

      console.log('Extracted subdomain:', subdomain);
      console.log('AQUI');

      // Si es 'www', tratar como dominio principal (no es un subdomain de tienda)
      if (subdomain === 'www') {
        return ''; // Retornar string vacía para indicar dominio principal
      }

      return subdomain;
    }
  }

  // Si es exactamente el dominio raíz (pideai.com o artex.lat)
  if (SUPPORTED_DOMAINS.includes(hostname as any)) {
    return ''; // Dominio principal
  }

  // Fallback
  return localStorage.getItem('dev_subdomain') || 'totus';
}

/**
 * Generates subdomain suggestions based on store name
 *
 * @param storeName - The store name to generate suggestions from
 * @returns Array of suggested subdomains
 */
export function generateSubdomainSuggestions(storeName: string): string[] {
  if (!storeName || storeName.trim().length === 0) {
    return [];
  }

  const normalized = storeName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove consecutive hyphens
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

  if (normalized.length < 3) {
    return [];
  }

  const suggestions: string[] = [];

  // Suggestion 1: Direct conversion
  if (normalized.length >= 3 && normalized.length <= 63) {
    suggestions.push(normalized);
  }

  // Suggestion 2: Add number suffix
  suggestions.push(`${normalized}-1`);

  // Suggestion 3: Add 'store' suffix
  if (`${normalized}-store`.length <= 63) {
    suggestions.push(`${normalized}-store`);
  }

  // Suggestion 4: Shortened version (first 10 chars + random)
  if (normalized.length > 10) {
    const short = normalized.substring(0, 10);
    const random = Math.floor(Math.random() * 999);
    suggestions.push(`${short}${random}`);
  }

  return suggestions.filter((s) => {
    const validation = validateSubdomainFormat(s);
    return validation.isValid;
  });
}

/**
 * Get the current domain being used
 *
 * @returns The current domain (pideai.com or artex.lat)
 */
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

/**
 * Format subdomain display for UI
 *
 * @param subdomain - The subdomain to format
 * @returns Formatted subdomain with current domain
 */
export function formatSubdomainDisplay(subdomain: string): string {
  const domain = getCurrentDomain();
  return `${subdomain}.${domain}`;
}

/**
 * Check if current hostname is the main domain (www or empty subdomain)
 *
 * @returns True if the current domain is www.pideai.com, pideai.com, www.artex.lat, or artex.lat
 */
export function isMainDomain(): boolean {
  const hostname = window.location.hostname;

  // En desarrollo, considerar localhost como dominio principal
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
    return true;
  }
  console.log('hostname', hostname);
  // En producción, verificar si es www o el dominio raíz
  return (
    hostname === 'www.pideai.com' ||
    hostname === 'pideai.com' ||
    hostname === 'www.artex.lat' ||
    hostname === 'artex.lat'
  );
}

/**
 * Check if current hostname is specifically www.pideai.com (for platform admin access)
 *
 * @returns True only if the current domain is exactly www.pideai.com (or localhost in dev)
 */
export function isPlatformAdminDomain(): boolean {
  const hostname = window.location.hostname;

  // En desarrollo, permitir localhost
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
    return true;
  }

  // En producción, solo permitir www.pideai.com
  return hostname === 'www.pideai.com';
}
