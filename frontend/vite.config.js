import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Single consolidated FastAPI backend — everything runs on ONE port (8000).
// Run it with:  uvicorn main:app --reload --port 8000
const BACKEND_URL = 'http://127.0.0.1:8000'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Auth, users, messaging, notifications, appointments, rehab sessions,
      // patients, reports — all served by the single FastAPI backend.
      '/api': {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: false,
      },
      // Legacy path kept for compatibility with rehabApi.js, which prefixes
      // its calls with '/rehab' and already includes '/api/...' after that.
      // Both proxies now point at the SAME single backend.
      '/rehab': {
        target: BACKEND_URL,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/rehab/, ''),
      },
    },
  }
})
