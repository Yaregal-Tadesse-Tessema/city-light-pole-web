import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3011',
        changeOrigin: true,
        secure: false,
        // Don't rewrite. Backend routes already use /api/v1 under the same /api prefix.
      },
    },
  },
  preview: {
    host: true,
    allowedHosts: true, // Allow all hosts (e.g. smartpole.aaesaa.gov.et)
  },
});

