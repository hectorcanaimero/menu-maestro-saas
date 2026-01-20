#!/usr/bin/env node

/**
 * Verification script for PostHog events implementation
 * Checks if event tracking code is properly implemented
 */

import { readFileSync } from 'fs';
import { glob } from 'glob';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  bright: '\x1b[1m',
};

console.log(`\n${colors.bright}${colors.cyan}PostHog Events Implementation Verification${colors.reset}\n`);

// Events to check
const eventsToCheck = [
  {
    name: 'catalog_page_view',
    file: 'src/pages/Index.tsx',
    expectedProperties: ['store_id', 'store_name', 'subdomain', 'pathname', 'url'],
  },
  {
    name: 'product_added_to_cart',
    file: 'src/contexts/CartContext.tsx',
    expectedProperties: ['store_id', 'product_id', 'product_name', 'quantity', 'price', 'cart_total'],
  },
  {
    name: 'checkout_started',
    file: 'src/pages/Checkout.tsx',
    expectedProperties: ['store_id', 'cart_total', 'items_count', 'order_type', 'payment_method'],
  },
  {
    name: 'order_placed',
    file: 'src/pages/ConfirmOrder.tsx',
    expectedProperties: ['store_id', 'order_id', 'total', 'items_count', 'order_type'],
  },
];

let allPassed = true;

eventsToCheck.forEach((event) => {
  try {
    const content = readFileSync(event.file, 'utf-8');

    // Check if event is captured
    const hasCapture = content.includes(`posthog.capture('${event.name}'`);

    if (hasCapture) {
      console.log(`${colors.green}✓${colors.reset} ${event.name}`);
      console.log(`  ${colors.cyan}File:${colors.reset} ${event.file}`);

      // Check for expected properties
      const missingProperties = event.expectedProperties.filter((prop) => {
        const regex = new RegExp(`${prop}:\\s*`, 'g');
        return !regex.test(content);
      });

      if (missingProperties.length > 0) {
        console.log(`  ${colors.yellow}⚠ Missing properties:${colors.reset} ${missingProperties.join(', ')}`);
      } else {
        console.log(`  ${colors.green}✓ All expected properties present${colors.reset}`);
      }

      // Check for error handling
      const hasErrorHandling = content.includes('console.error') && content.includes('[PostHog]');
      if (hasErrorHandling) {
        console.log(`  ${colors.green}✓ Error handling implemented${colors.reset}`);
      } else {
        console.log(`  ${colors.yellow}⚠ No error handling found${colors.reset}`);
      }
    } else {
      console.log(`${colors.red}✗${colors.reset} ${event.name}`);
      console.log(`  ${colors.red}Not implemented in ${event.file}${colors.reset}`);
      allPassed = false;
    }

    console.log('');
  } catch (error) {
    console.log(`${colors.red}✗${colors.reset} ${event.name}`);
    console.log(`  ${colors.red}Error reading ${event.file}: ${error.message}${colors.reset}\n`);
    allPassed = false;
  }
});

// Summary
console.log(`\n${colors.bright}Summary${colors.reset}\n`);

if (allPassed) {
  console.log(`${colors.green}✓ All critical events are implemented!${colors.reset}\n`);
  console.log(`${colors.cyan}Next steps:${colors.reset}`);
  console.log(`1. Start your dev server: ${colors.bright}npm run dev${colors.reset}`);
  console.log(`2. Navigate through your app (catalog, add to cart, checkout)`);
  console.log(`3. Check PostHog Live Events: https://us.i.posthog.com/project/88656/events`);
  console.log(`4. Verify events are appearing in real-time\n`);
} else {
  console.log(`${colors.red}✗ Some events are missing or incomplete${colors.reset}`);
  console.log(`${colors.yellow}Please review the issues above${colors.reset}\n`);
}

// Check PostHog initialization
console.log(`${colors.bright}PostHog Configuration${colors.reset}\n`);

try {
  const mainContent = readFileSync('src/main.tsx', 'utf-8');

  const hasInit = mainContent.includes('posthog.init');
  const hasApiKey = mainContent.includes('VITE_POSTHOG_KEY');
  const hasHost = mainContent.includes('VITE_POSTHOG_HOST');

  if (hasInit && hasApiKey && hasHost) {
    console.log(`${colors.green}✓ PostHog is properly initialized in main.tsx${colors.reset}`);
  } else {
    console.log(`${colors.yellow}⚠ PostHog initialization may be incomplete:${colors.reset}`);
    if (!hasInit) console.log(`  - Missing posthog.init() call`);
    if (!hasApiKey) console.log(`  - Missing VITE_POSTHOG_KEY`);
    if (!hasHost) console.log(`  - Missing VITE_POSTHOG_HOST`);
  }
} catch (error) {
  console.log(`${colors.red}✗ Error checking PostHog configuration: ${error.message}${colors.reset}`);
}

console.log('');
