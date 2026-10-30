import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite config for the SmartStock web client.
 * Dev server proxies `/api` to the local backend so the browser and API share an origin
 * during development (ui-design: API base URL from env; dev proxy avoids CORS).
 *
 * `@smartstock/shared` is published as CommonJS (tsconfig.base → module: CommonJS) and its barrel
 * re-exports via `__exportStar`, which defeats Rollup's static named-export detection in a
 * production build. We include it in the commonjs transform (mixedEsModules) and pre-bundle it so
 * named value exports like `ErrorCode`/`StockStatus` resolve — without modifying the shared source.
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_DEV_API_TARGET ?? 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    include: ['@smartstock/shared'],
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    commonjsOptions: {
      include: [/shared/, /node_modules/],
      transformMixedEsModules: true,
    },
  },
});
