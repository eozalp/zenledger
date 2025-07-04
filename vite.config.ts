import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import fs from 'fs';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: './',
      server: {
        https: true
      },
      build: {
        minify: true,
      },
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.')
        }
      },
      plugins: [
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['favicon.svg', 'icons/icon-192.png', 'icons/icon-512.png'],
          manifest: {
            name: 'ZenLedger - Offline Accounting',
            short_name: 'ZenLedger',
            description: 'A local-first, offline-ready, double-entry accounting system designed for simplicity and privacy. All your financial data is stored securely on your device.',
            theme_color: '#18181b',
            background_color: '#09090b',
            display: 'standalone',
            icons: [
              {
                src: 'icons/icon-192.png',
                sizes: '192x192',
                type: 'image/png',
              },
              {
                src: 'icons/icon-512.png',
                sizes: '512x512',
                type: 'image/png',
              },
            ],
          },
          workbox: {
            sourcemap: false,
            mode: 'development',
          }
        })
      ],
    };
});
