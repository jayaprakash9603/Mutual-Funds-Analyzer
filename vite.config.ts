import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        // Prefer 127.0.0.1 over localhost to avoid Windows IPv6 (::1) proxy failures
        // when Spring Boot is only bound on IPv4.
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
    },
  },
})
