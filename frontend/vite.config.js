import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Flask auth + dashboard (login, register, patient/doctor dashboards)
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
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