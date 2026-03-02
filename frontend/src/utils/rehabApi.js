/**
 * Rehab API Client
 * ================
 * Separate Axios instance pointing to the FastAPI rehab backend (port 8000).
 * The Flask auth backend runs on port 5000.
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