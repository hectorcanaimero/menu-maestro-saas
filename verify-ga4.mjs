#!/usr/bin/env node

/**
 * Google Analytics 4 (GA4) Implementation Verification
 * Validates GA4 setup and configuration
 */

import { readFileSync } from 'fs';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  bright: '\x1b[1m',
};

console.log(`\n${colors.bright}${colors.cyan}Google Analytics 4 (GA4) Verification${colors.reset}\n`);

let allPassed = true;

// 1. Check .env for GA4 Measurement ID
console.log(`${colors.bright}1. Environment Configuration${colors.reset}\n`);

try {
  const envContent = readFileSync('.env', 'utf-8');
  const measurementIdMatch = envContent.match(/VITE_GA4_MEASUREMENT_ID=(.+)/);

  if (measurementIdMatch) {
    const measurementId = measurementIdMatch[1].trim();
    console.log(`${colors.green}✓${colors.reset} GA4 Measurement ID found in .env`);
    console.log(`  ${colors.cyan}ID:${colors.reset} ${measurementId}`);

    // Validate format (should be G-XXXXXXXXXX)
    if (/^G-[A-Z0-9]{10}$/.test(measurementId)) {
      console.log(`  ${colors.green}✓${colors.reset} Valid GA4 Measurement ID format`);
    } else {
      console.log(`  ${colors.yellow}⚠${colors.reset} Measurement ID format may be invalid (expected: G-XXXXXXXXXX)`);
    }
  } else {
    console.log(`${colors.red}✗${colors.reset} VITE_GA4_MEASUREMENT_ID not found in .env`);
    allPassed = false;
  }
} catch (error) {
  console.log(`${colors.red}✗${colors.reset} Error reading .env: ${error.message}`);
  allPassed = false;
}

console.log('');

// 2. Check main.tsx initialization
console.log(`${colors.bright}2. GA4 Initialization (main.tsx)${colors.reset}\n`);

try {
  const mainContent = readFileSync('src/main.tsx', 'utf-8');

  // Check imports
  const hasReactGA = mainContent.includes("import ReactGA from 'react-ga4'");
  if (hasReactGA) {
    console.log(`${colors.green}✓${colors.reset} ReactGA imported correctly`);
  } else {
    console.log(`${colors.red}✗${colors.reset} ReactGA not imported`);
    allPassed = false;
  }

  // Check initialization
  const hasInit = mainContent.includes('ReactGA.initialize');
  if (hasInit) {
    console.log(`${colors.green}✓${colors.reset} ReactGA.initialize() called`);

    // Check configuration options
    const hasAnonymizeIP = mainContent.includes('anonymize_ip: true');
    const hasCookieFlags = mainContent.includes("cookie_flags: 'SameSite=None;Secure'");
    const hasSendPageView = mainContent.includes('send_page_view: false');
    const hasAllowSignals = mainContent.includes('allow_google_signals: false');
    const hasAllowAdPersonalization = mainContent.includes('allow_ad_personalization_signals: false');

    console.log(`  ${hasAnonymizeIP ? colors.green + '✓' : colors.yellow + '⚠'}${colors.reset} anonymize_ip: ${hasAnonymizeIP ? 'true' : 'not set'}`);
    console.log(`  ${hasCookieFlags ? colors.green + '✓' : colors.yellow + '⚠'}${colors.reset} cookie_flags configured`);
    console.log(`  ${hasSendPageView ? colors.green + '✓' : colors.yellow + '⚠'}${colors.reset} send_page_view: false (manual tracking)`);
    console.log(`  ${hasAllowSignals ? colors.green + '✓' : colors.yellow + '⚠'}${colors.reset} allow_google_signals: false (privacy)`);
    console.log(`  ${hasAllowAdPersonalization ? colors.green + '✓' : colors.yellow + '⚠'}${colors.reset} allow_ad_personalization_signals: false (privacy)`);
  } else {
    console.log(`${colors.red}✗${colors.reset} ReactGA.initialize() not called`);
    allPassed = false;
  }

  // Check conditional initialization
  const hasConditionalInit = mainContent.includes('if (import.meta.env.VITE_GA4_MEASUREMENT_ID)');
  if (hasConditionalInit) {
    console.log(`${colors.green}✓${colors.reset} Conditional initialization (only when Measurement ID is set)`);
  } else {
    console.log(`${colors.yellow}⚠${colors.reset} Initialization not conditional`);
  }
} catch (error) {
  console.log(`${colors.red}✗${colors.reset} Error reading main.tsx: ${error.message}`);
  allPassed = false;
}

console.log('');

console.log(`${colors.bright}Summary${colors.reset}\n`);

if (allPassed) {
  console.log(`${colors.green}✓ GA4 is properly configured!${colors.reset}\n`);
} else {
  console.log(`${colors.red}✗ GA4 configuration has issues${colors.reset}\n`);
}
