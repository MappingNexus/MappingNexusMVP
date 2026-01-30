import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 5173,
      host: '0.0.0.0',
      // Proxy API requests to Express backend (optional - only if backend is running)
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              // Silently handle proxy errors when backend is not running
              // This allows frontend to run standalone for UI development
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('🔄 Proxying:', req.method, req.url, '→', proxyReq.path);
            });
          },
        },
      },
    },
    plugins: [react()],
    // Vite automatically exposes VITE_* env variables via import.meta.env
    // No need for define - just use VITE_GEMINI_API_KEY in .env
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
