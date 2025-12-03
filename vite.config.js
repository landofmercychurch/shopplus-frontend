import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000, // Increase warning limit to 1 MB
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          ui: ['@heroicons/react', 'react-icons', 'lucide-react'],
          supabase: ['@supabase/supabase-js'],
          vendors: ['axios', 'framer-motion', 'uuid', 'dompurify']
        }
      }
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://shopplus-backend.onrender.com', // keep for local development
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
