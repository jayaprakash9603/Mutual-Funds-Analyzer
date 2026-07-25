import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const DEMO_MODE_ENV = 'import.meta.env.VITE_DEMO_MODE'

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  // Injected here rather than in a .env file, since .gitignore excludes .env.* and the
  // demo build needs to be reproducible from a clean checkout.
  define: {
    [DEMO_MODE_ENV]: JSON.stringify(mode === 'demo' ? 'true' : 'false'),
  },
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
}))
