import express from 'express';
import compression from 'compression';
import { readFileSync, existsSync } from 'fs';
import { resolve, join } from 'path';
import { createClient } from '@supabase/supabase-js';

// ─── Config ────────────────────────────────────────────────────────
const PORT = process.env.PORT || 80;
const DIST_DIR = resolve(process.cwd(), 'dist');
const INDEX_HTML_PATH = join(DIST_DIR, 'index.html');
const SUPPORTED_DOMAINS = ['pideai.com', 'artex.lat'];
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Supabase client (uses same env vars as the SPA build, but for runtime we need them as server env vars)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

let supabase = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// ─── Read index.html template ──────────────────────────────────────
if (!existsSync(INDEX_HTML_PATH)) {
  console.error(`[SEO Server] dist/index.html not found at ${INDEX_HTML_PATH}`);
  process.exit(1);
}
const indexHtmlTemplate = readFileSync(INDEX_HTML_PATH, 'utf-8');

// ─── In-memory cache ───────────────────────────────────────────────
const storeCache = new Map();
const productCache = new Map();

function getCachedStore(subdomain) {
  const entry = storeCache.get(subdomain);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
    return entry.data;
  }
  storeCache.delete(subdomain);
  return null;
}

function setCachedStore(subdomain, data) {
  storeCache.set(subdomain, { data, timestamp: Date.now() });
}

function getCachedProduct(storeId, productId) {
  const key = `${storeId}:${productId}`;
  const entry = productCache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
    return entry.data;
  }
  productCache.delete(key);
  return null;
}

function setCachedProduct(storeId, productId, data) {
  const key = `${storeId}:${productId}`;
  productCache.set(key, { data, timestamp: Date.now() });
}

// ─── Subdomain extraction ──────────────────────────────────────────
function getSubdomain(hostname) {
  // Remove port if present
  const host = hostname.split(':')[0];

  for (const domain of SUPPORTED_DOMAINS) {
    if (host.endsWith(domain)) {
      const parts = host.split('.');
      const domainParts = domain.split('.');
      if (parts.length > domainParts.length) {
        const subdomain = parts.slice(0, parts.length - domainParts.length).join('.');
        if (subdomain === 'www' || subdomain === 'platform') {
          return null;
        }
        return subdomain;
      }
    }
  }
  return null;
}

// ─── Fetch store data ──────────────────────────────────────────────
async function fetchStoreData(subdomain) {
  if (!supabase) return null;

  const cached = getCachedStore(subdomain);
  if (cached) return cached;

  try {
    const { data, error } = await supabase
      .from('stores')
      .select('id, name, description, logo_url, banner_url, subdomain, phone, address, currency, operating_modes, is_food_business')
      .eq('subdomain', subdomain)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !data) return null;

    setCachedStore(subdomain, data);
    return data;
  } catch {
    return null;
  }
}

// ─── Fetch product data ────────────────────────────────────────────
async function fetchProductData(storeId, productId) {
  if (!supabase) return null;

  const cached = getCachedProduct(storeId, productId);
  if (cached) return cached;

  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select('id, name, description, image_url, price, category_id')
      .eq('id', productId)
      .eq('store_id', storeId)
      .eq('is_available', true)
      .maybeSingle();

    if (error || !data) return null;

    setCachedProduct(storeId, productId, data);
    return data;
  } catch {
    return null;
  }
}

// ─── Fetch categories for sitemap ──────────────────────────────────
async function fetchStoreCategories(storeId) {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name')
      .eq('store_id', storeId)
      .eq('is_active', true);

    return error ? [] : data || [];
  } catch {
    return [];
  }
}

// ─── Fetch products for sitemap ────────────────────────────────────
async function fetchStoreProducts(storeId) {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select('id, name, updated_at')
      .eq('store_id', storeId)
      .eq('is_available', true);

    return error ? [] : data || [];
  } catch {
    return [];
  }
}

// ─── Escape HTML for meta tags ─────────────────────────────────────
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ─── Build meta tags HTML ──────────────────────────────────────────
function buildStoreMetaTags(store, url) {
  const title = escapeHtml(store.name || 'Tienda');
  const description = escapeHtml(
    store.description || `Pide en ${store.name} de forma rápida y sencilla`
  );
  const image = store.logo_url || 'https://pideai.com/og-image.jpg';
  const canonicalUrl = url;

  // Schema.org LocalBusiness / Restaurant
  const schemaType = store.is_food_business ? 'Restaurant' : 'Store';
  const schema = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    name: store.name,
    description: store.description || '',
    url: canonicalUrl,
    image: store.logo_url || '',
    ...(store.phone && { telephone: store.phone }),
    ...(store.address && {
      address: {
        '@type': 'PostalAddress',
        streetAddress: store.address,
      },
    }),
  };

  return `
    <title>${title} | PideAí</title>
    <meta name="title" content="${title} | PideAí" />
    <meta name="description" content="${description}" />
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
    <meta property="og:title" content="${title} | PideAí" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${escapeHtml(image)}" />
    <meta property="og:site_name" content="${title}" />
    <meta property="og:locale" content="es_ES" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${escapeHtml(canonicalUrl)}" />
    <meta name="twitter:title" content="${title} | PideAí" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${escapeHtml(image)}" />
    <script type="application/ld+json">${JSON.stringify(schema)}</script>`;
}

function buildProductMetaTags(store, product, url) {
  const title = escapeHtml(`${product.name} - ${store.name}`);
  const description = escapeHtml(
    product.description || `${product.name} disponible en ${store.name}`
  );
  const image = product.image_url || store.logo_url || 'https://pideai.com/og-image.jpg';
  const canonicalUrl = url;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || '',
    image: product.image_url || '',
    url: canonicalUrl,
    offers: {
      '@type': 'Offer',
      price: product.price || 0,
      priceCurrency: store.currency || 'USD',
      availability: 'https://schema.org/InStock',
    },
    brand: {
      '@type': 'Organization',
      name: store.name,
    },
  };

  return `
    <title>${title} | PideAí</title>
    <meta name="title" content="${title} | PideAí" />
    <meta name="description" content="${description}" />
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
    <meta property="og:type" content="product" />
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
    <meta property="og:title" content="${title} | PideAí" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${escapeHtml(image)}" />
    <meta property="og:site_name" content="${escapeHtml(store.name)}" />
    <meta property="og:locale" content="es_ES" />
    <meta property="product:price:amount" content="${product.price || 0}" />
    <meta property="product:price:currency" content="${escapeHtml(store.currency || 'USD')}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${escapeHtml(canonicalUrl)}" />
    <meta name="twitter:title" content="${title} | PideAí" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${escapeHtml(image)}" />
    <script type="application/ld+json">${JSON.stringify(schema)}</script>`;
}

// ─── Inject meta tags into HTML ────────────────────────────────────
function injectMetaTags(html, metaTags) {
  // Remove existing meta tags that we'll replace
  let modified = html;

  // Remove existing <title> tag
  modified = modified.replace(/<title>[^<]*<\/title>/, '');

  // Remove existing SEO meta tags (title, description, keywords, canonical, og:*, twitter:*)
  modified = modified.replace(/<meta\s+name="(?:title|description|keywords|author)"[^>]*\/?\s*>/gi, '');
  modified = modified.replace(/<meta\s+property="og:[^"]*"[^>]*\/?\s*>/gi, '');
  modified = modified.replace(/<meta\s+name="twitter:[^"]*"[^>]*\/?\s*>/gi, '');
  modified = modified.replace(/<link\s+rel="canonical"[^>]*\/?\s*>/gi, '');

  // Inject new meta tags after <meta charset>
  modified = modified.replace(
    /(<meta charset="UTF-8"\s*\/?>)/i,
    `$1\n    <!-- SEO: Server-injected meta tags -->${metaTags}\n    <!-- /SEO -->`
  );

  return modified;
}

// ─── Express app ───────────────────────────────────────────────────
const app = express();

// Compression
app.use(compression());

// Health check endpoint (used by Traefik)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Dynamic robots.txt per subdomain
app.get('/robots.txt', (req, res) => {
  const subdomain = getSubdomain(req.hostname);
  const domain = SUPPORTED_DOMAINS.find((d) => req.hostname.endsWith(d)) || 'pideai.com';
  const host = subdomain ? `${subdomain}.${domain}` : `www.${domain}`;

  let robotsTxt = `User-agent: *\nAllow: /\n`;

  // Disallow admin and auth pages from indexing
  robotsTxt += `Disallow: /admin\n`;
  robotsTxt += `Disallow: /auth\n`;
  robotsTxt += `Disallow: /checkout\n`;
  robotsTxt += `Disallow: /my-orders\n`;
  robotsTxt += `Disallow: /create-store\n`;

  if (subdomain) {
    robotsTxt += `\nSitemap: https://${host}/sitemap.xml\n`;
  }

  res.type('text/plain').send(robotsTxt);
});

// Dynamic sitemap per store subdomain
app.get('/sitemap.xml', async (req, res) => {
  const subdomain = getSubdomain(req.hostname);
  const domain = SUPPORTED_DOMAINS.find((d) => req.hostname.endsWith(d)) || 'pideai.com';

  if (!subdomain) {
    // Main domain sitemap - list all active stores
    if (!supabase) {
      return res.status(503).type('text/plain').send('Supabase not configured');
    }

    try {
      const { data: stores } = await supabase
        .from('stores')
        .select('subdomain, updated_at')
        .eq('is_active', true);

      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      xml += `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

      for (const store of stores || []) {
        xml += `  <sitemap>\n`;
        xml += `    <loc>https://${store.subdomain}.${domain}/sitemap.xml</loc>\n`;
        if (store.updated_at) {
          xml += `    <lastmod>${new Date(store.updated_at).toISOString().split('T')[0]}</lastmod>\n`;
        }
        xml += `  </sitemap>\n`;
      }

      xml += `</sitemapindex>`;
      res.type('application/xml').send(xml);
    } catch {
      res.status(500).type('text/plain').send('Error generating sitemap');
    }
    return;
  }

  // Store-specific sitemap
  const store = await fetchStoreData(subdomain);
  if (!store) {
    return res.status(404).type('text/plain').send('Store not found');
  }

  const baseUrl = `https://${subdomain}.${domain}`;
  const products = await fetchStoreProducts(store.id);
  const now = new Date().toISOString().split('T')[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  // Home page
  xml += `  <url>\n    <loc>${baseUrl}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n    <lastmod>${now}</lastmod>\n  </url>\n`;

  // Product pages
  for (const product of products) {
    const lastmod = product.updated_at
      ? new Date(product.updated_at).toISOString().split('T')[0]
      : now;
    xml += `  <url>\n    <loc>${baseUrl}/products/${product.id}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n    <lastmod>${lastmod}</lastmod>\n  </url>\n`;
  }

  xml += `</urlset>`;
  res.type('application/xml').send(xml);
});

// Serve static assets from dist (JS, CSS, images, etc.) BEFORE the catch-all
app.use(express.static(DIST_DIR, {
  maxAge: '1y',
  immutable: true,
  index: false, // Don't serve index.html for directory requests
  setHeaders(res, filePath) {
    // Don't cache HTML files
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  },
}));

// Catch-all: Serve index.html with injected meta tags
app.get('*', async (req, res) => {
  const subdomain = getSubdomain(req.hostname);
  const domain = SUPPORTED_DOMAINS.find((d) => req.hostname.endsWith(d)) || 'pideai.com';
  const fullUrl = `https://${subdomain ? subdomain + '.' : 'www.'}${domain}${req.path}`;

  // If no subdomain (main domain), serve original HTML
  if (!subdomain) {
    res.type('html').send(indexHtmlTemplate);
    return;
  }

  // Fetch store data
  const store = await fetchStoreData(subdomain);

  if (!store) {
    // Store not found - serve original HTML (SPA will handle 404)
    res.type('html').send(indexHtmlTemplate);
    return;
  }

  // Check if this is a product page
  const productMatch = req.path.match(/^\/products\/([a-f0-9-]+)$/i);
  let metaTags;

  if (productMatch) {
    const productId = productMatch[1];
    const product = await fetchProductData(store.id, productId);

    if (product) {
      metaTags = buildProductMetaTags(store, product, fullUrl);
    } else {
      metaTags = buildStoreMetaTags(store, fullUrl);
    }
  } else {
    metaTags = buildStoreMetaTags(store, fullUrl);
  }

  const html = injectMetaTags(indexHtmlTemplate, metaTags);
  res.type('html').send(html);
});

// ─── Start server ──────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[SEO Server] Running on port ${PORT}`);
  console.log(`[SEO Server] Serving static files from ${DIST_DIR}`);
  console.log(`[SEO Server] Supabase: ${supabase ? 'connected' : 'not configured (serving static HTML only)'}`);
});
