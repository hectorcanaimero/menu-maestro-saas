#!/usr/bin/env node

/**
 * Google Analytics 4 Verification Script
 *
 * This script verifies that GA4 is properly configured and initialized
 */

import { chromium } from 'playwright';
import { readFileSync } from 'fs';

const PORT = 8081; // Adjust if your dev server uses a different port
const URL = `http://localhost:${PORT}`;

async function verifyGA4() {
  console.log('🔍 Verificando instalación de Google Analytics 4...\n');

  // Check environment variable
  try {
    const envContent = readFileSync('.env', 'utf-8');
    const ga4Match = envContent.match(/VITE_GA4_MEASUREMENT_ID=(.+)/);

    if (ga4Match && ga4Match[1] && ga4Match[1] !== 'G-XXXXXXXXXX') {
      console.log('✅ Variable de entorno VITE_GA4_MEASUREMENT_ID configurada');
      console.log(`   Measurement ID: ${ga4Match[1].trim()}`);
    } else {
      console.log('❌ Variable VITE_GA4_MEASUREMENT_ID no configurada en .env');
      process.exit(1);
    }
  } catch (error) {
    console.log('❌ Archivo .env no encontrado');
    process.exit(1);
  }

  // Check if server is running
  console.log('\n🌐 Verificando servidor de desarrollo...');

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // Array to capture console logs
    const consoleLogs = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);

      if (text.includes('Google Analytics')) {
        console.log(`   📝 ${text}`);
      }
    });

    // Array to capture network requests
    const ga4Requests = [];
    page.on('request', request => {
      const url = request.url();
      if (url.includes('google-analytics.com') || url.includes('googletagmanager.com')) {
        ga4Requests.push(url);
      }
    });

    console.log(`   Navegando a ${URL}...`);

    // Navigate to the page
    await page.goto(URL, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait a bit for GA4 to initialize
    await page.waitForTimeout(3000);

    // Check if GA4 initialized
    const gaInitialized = consoleLogs.some(log =>
      log.includes('✅ Google Analytics initialized') ||
      log.includes('Google Analytics')
    );

    console.log('\n📊 Resultados de verificación:\n');

    if (gaInitialized) {
      console.log('✅ Google Analytics se inicializó correctamente en el navegador');
    } else {
      console.log('⚠️  No se detectó mensaje de inicialización (puede ser normal en producción)');
    }

    // Check for GA4 script in page
    const ga4ScriptExists = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script'));
      return scripts.some(script =>
        script.src.includes('googletagmanager.com') ||
        script.src.includes('google-analytics.com')
      );
    });

    if (ga4ScriptExists) {
      console.log('✅ Script de Google Analytics encontrado en la página');
    } else {
      console.log('ℹ️  Script de GA se carga dinámicamente (normal con react-ga4)');
    }

    // Check for network requests
    if (ga4Requests.length > 0) {
      console.log(`✅ Se detectaron ${ga4Requests.length} peticiones a Google Analytics`);
      console.log('\n   Peticiones detectadas:');
      ga4Requests.slice(0, 3).forEach(req => {
        const url = new URL(req);
        console.log(`   - ${url.hostname}${url.pathname}`);
      });
    } else {
      console.log('⚠️  No se detectaron peticiones HTTP a Google Analytics');
      console.log('   Esto puede ser normal si el Measurement ID no está configurado');
    }

    // Check for gtag in window
    const gtagExists = await page.evaluate(() => {
      return typeof window.gtag !== 'undefined' || typeof window.dataLayer !== 'undefined';
    });

    if (gtagExists) {
      console.log('✅ Objeto gtag/dataLayer detectado en window');
    } else {
      console.log('❌ Objeto gtag/dataLayer NO encontrado en window');
    }

    console.log('\n📝 Resumen:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const checksPassedCount = [
      gaInitialized || ga4Requests.length > 0,
      ga4ScriptExists || gtagExists,
      consoleLogs.length > 0
    ].filter(Boolean).length;

    if (checksPassedCount >= 2) {
      console.log('✅ Google Analytics 4 está instalado y funcionando correctamente');
      console.log('\n💡 Próximos pasos:');
      console.log('   1. Visita tu sitio web');
      console.log('   2. Ve a Google Analytics → Reports → Realtime');
      console.log('   3. Deberías ver tu actividad en tiempo real');
    } else {
      console.log('⚠️  Verificar configuración de Google Analytics');
      console.log('\n💡 Pasos de solución:');
      console.log('   1. Verifica que VITE_GA4_MEASUREMENT_ID esté en .env');
      console.log('   2. Reinicia el servidor: npm run dev');
      console.log('   3. Verifica que el Measurement ID sea correcto');
    }

    await browser.close();

  } catch (error) {
    if (browser) await browser.close();

    if (error.message.includes('net::ERR_CONNECTION_REFUSED')) {
      console.log('❌ No se pudo conectar al servidor de desarrollo');
      console.log('   Asegúrate de que el servidor esté corriendo: npm run dev');
    } else {
      console.log('❌ Error durante la verificación:', error.message);
    }
    process.exit(1);
  }
}

verifyGA4().catch(console.error);
