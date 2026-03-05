import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;

          if (
            id.includes('react-dom') ||
            id.includes('react-router') ||
            id.includes('react/jsx-runtime') ||
            id.endsWith('/react/index.js') ||
            id.includes('\\react\\')
          ) {
            return 'vendor-react';
          }

          if (id.includes('@mantine')) {
            return 'vendor-mantine';
          }

          if (id.includes('@tanstack')) {
            return 'vendor-tanstack';
          }

          if (id.includes('i18next') || id.includes('react-i18next')) {
            return 'vendor-i18n';
          }

          if (id.includes('leaflet')) {
            return 'vendor-maps';
          }

          if (id.includes('@tabler/icons-react')) {
            return 'vendor-icons';
          }

          if (id.includes('recharts') || id.includes('/d3-')) {
            return 'vendor-charts';
          }

          if (id.includes('html2canvas')) {
            return 'vendor-html2canvas';
          }

          if (id.includes('xlsx')) {
            return 'vendor-xlsx';
          }

          if (id.includes('jspdf') || id.includes('jspdf-autotable')) {
            return 'vendor-jspdf';
          }

          if (id.includes('file-saver')) {
            return 'vendor-file-saver';
          }

          if (
            id.includes('canvg') ||
            id.includes('css-line-break') ||
            id.includes('dompurify')
          ) {
            return 'vendor-reports';
          }

          if (id.includes('axios')) {
            return 'vendor-axios';
          }

          return 'vendor-misc';
        },
      },
    },
  },
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
