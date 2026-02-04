import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { componentTagger } from 'lovable-tagger';
import { visualizer } from 'rollup-plugin-visualizer';
import { sentryVitePlugin } from '@sentry/vite-plugin';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: '::',
    port: 8080,
    hmr: {
      overlay: true,
    },
    // Prevent full page reload when switching tabs
    watch: {
      // Only watch source files, not node_modules
      ignored: ['**/node_modules/**', '**/dist/**'],
    },
    allowedHosts: ['cf81-2804-14c-87df-b2df-24d9-ae59-c23-f23d.ngrok-free.app'],
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    mode === 'production' &&
      visualizer({
        filename: './dist/stats.html',
        open: false,
        gzipSize: true,
        brotliSize: true,
      }),
    // Sentry plugin for source maps upload (only in production builds)
    mode === 'production' &&
      sentryVitePlugin({
        org: 'pideai',
        project: 'pideai-restaurant-app',
        authToken: process.env.SENTRY_AUTH_TOKEN,

        // Upload source maps to Sentry
        sourcemaps: {
          assets: './dist/**',
          ignore: ['node_modules'],
          filesToDeleteAfterUpload: ['./dist/**/*.map'],
        },

        // Release configuration
        release: {
          name: process.env.VITE_APP_VERSION || 'development',
          setCommits: {
            auto: true,
          },
        },

        // Telemetry
        telemetry: false,

        // Debug mode for troubleshooting
        debug: false,
      }),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Generate source maps for production (required for Sentry)
    sourcemap: mode === 'production',
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],

          // UI libraries
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-switch',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-label',
            '@radix-ui/react-slot',
          ],

          // Backend
          supabase: ['@supabase/supabase-js'],
          'tanstack-query': ['@tanstack/react-query'],

          // Charts (heavy library)
          charts: ['recharts'],

          // Icons
          icons: ['lucide-react'],

          // Utilities
          utils: ['date-fns', 'sonner', 'clsx', 'tailwind-merge'],

          // Sentry
          sentry: ['@sentry/react'],
        },
      },
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 600,
    // Enable minification with esbuild (faster than terser)
    minify: 'esbuild',
    target: 'es2020',
  },
}));
