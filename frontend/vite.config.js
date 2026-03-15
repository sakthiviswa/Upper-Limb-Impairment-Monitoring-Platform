import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Flask backend (auth, dashboard, appointments) – must be running on port 5000
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
      },
      // FastAPI rehab backend (patients, sessions, reports)
      '/rehab': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/rehab/, ''),
      },
    },
  }
})