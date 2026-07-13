/**
 * Rehab API Client
 * ================
 * Axios instance for rehab-specific endpoints (patients, sessions, reports).
 * As of the backend consolidation, this hits the SAME single FastAPI
 * backend as `api.js` (see vite.config.js — both '/api' and '/rehab'
 * proxy to the one backend on port 8000). Kept as a separate instance
 * only so existing call sites (`rehabApi.get('/api/sessions/...')`)
 * did not need to change.
 * JWT token from localStorage is attached automatically.
 */

import axios from 'axios'

const rehabApi = axios.create({
  baseURL: '/rehab',   // proxied to http://localhost:8000 by Vite
  headers: { 'Content-Type': 'application/json' },
})

rehabApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default rehabApi