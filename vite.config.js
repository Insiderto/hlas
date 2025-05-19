import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // This allows the demo to import from the src directory
      '@': path.resolve(__dirname, './src'),
      '@hlas': path.resolve(__dirname, './src')
    },
  },
  server: {
    port: 3000,
    open: true
  },
  root: '.', // Set root to project directory
  build: {
    outDir: 'dist'
  },
  optimizeDeps: {
    include: ['react', 'react-dom']
  }
});
