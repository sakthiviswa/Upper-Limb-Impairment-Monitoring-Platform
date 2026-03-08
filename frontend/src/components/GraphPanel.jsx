/**
 * GraphPanel.jsx
 * 
 * Drop-in replacement for the GraphPanel inside AnalysisAssignment.jsx.
 * 
 * Problem: Flask graph endpoints are JWT-protected, but <img src="..."> cannot
 * send Authorization headers. Solution: fetch the image as a blob using the
 * api instance (which has the JWT interceptor), then create a local object URL.
 *
 * Usage — already integrated in AnalysisAssignment.jsx.
 * This file is provided separately for clarity. You do NOT need this as a
 * separate file — the code is already embedded in AnalysisAssignment.jsx.
 * 
 * If you want it as a standalone component, place at:
 *   src/components/GraphPanel.jsx
 * and import it in AnalysisAssignment.jsx.
 */

import { useState, useEffect, useCallback } from 'react'
import { ImageOff, ChevronDown, ChevronUp, LineChart, BarChart, RefreshCw } from 'lucide-react'
import api from '../utils/api'

export default function GraphPanel({ sessionId, hasAngleGraph, hasProgressGraph }) {
  const [activeGraph, setActiveGraph] = useState(null)   // 'angle' | 'progress' | null
  const [blobUrls,    setBlobUrls]    = useState({})      // { angle: '...', progress: '...' }
  const [loading,     setLoading]     = useState({})      // { angle: bool, progress: bool }
  const [errors,      setErrors]      = useState({})      // { angle: bool, progress: bool }

  // Fetch image as blob once per key (cached in blobUrls)
  const fetchGraph = useCallback(async (key) => {
    if (blobUrls[key] || loading[key] || errors[key]) return   // already have it or in flight
    setLoading(p => ({ ...p, [key]: true }))
    try {
      const endpoint = `/doctor/session-graph/${sessionId}/${key}`
      const res = await api.get(endpoint, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      setBlobUrls(p => ({ ...p, [key]: url }))
    } catch {
      setErrors(p => ({ ...p, [key]: true }))
    } finally {
      setLoading(p => ({ ...p, [key]: false }))
    }
  }, [sessionId, blobUrls, loading, errors])

  // When user opens a tab, start fetching
  useEffect(() => {
    if (activeGraph) fetchGraph(activeGraph)
  }, [activeGraph, fetchGraph])

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => Object.values(blobUrls).forEach(URL.revokeObjectURL)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!hasAngleGraph && !hasProgressGraph) {
    return (
      <div style={{
        marginTop: 14, padding: '12px 14px',
        background: 'var(--bg-card2)', borderRadius: 10,
        border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 8,
        color: 'var(--text-muted)', fontSize: 12,
      }}>
        <ImageOff size={14} strokeWidth={1.5} />
        Graphs are being generated — check back in a moment.
      </div>
    )
  }

  const tabs = [
    hasAngleGraph    && { key: 'angle',    label: 'Angle vs Time', Icon: LineChart },
    hasProgressGraph && { key: 'progress', label: 'Progress',      Icon: BarChart  },
  ].filter(Boolean)

  return (
    <div style={{ marginTop: 14 }}>
      {/* Tab row */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {tabs.map(({ key, label, Icon }) => {
          const active = activeGraph === key
          return (
            <button
              key={key}
              onClick={() => setActiveGraph(active ? null : key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 13px', borderRadius: 8,
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit', transition: 'all 0.15s',
                background: active ? 'var(--brand)' : 'var(--bg-card2)',
                color:      active ? '#fff'        : 'var(--text-secondary)',
                border: `1px solid ${active ? 'var(--brand)' : 'var(--border)'}`,
              }}
            >
              <Icon size={12} strokeWidth={2} />
              {label}
              {active
                ? <ChevronUp   size={11} strokeWidth={2.5} />
                : <ChevronDown size={11} strokeWidth={2.5} />}
            </button>
          )
        })}
      </div>

      {/* Graph display */}
      {activeGraph && (
        <div style={{
          borderRadius: 10, overflow: 'hidden',
          border: '1px solid var(--border)',
          background: '#0d1117',
          minHeight: 80,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'aa-fadein 0.2s ease',
        }}>
          <style>{`
            @keyframes aa-fadein {
              from { opacity: 0; transform: translateY(-4px) }
              to   { opacity: 1; transform: none }
            }
            @keyframes aa-spin { to { transform: rotate(360deg) } }
          `}</style>

          {/* Loading state */}
          {loading[activeGraph] && (
            <div style={{ padding: 24, color: 'var(--text-muted)', fontSize: 12,
                          display: 'flex', alignItems: 'center', gap: 8 }}>
              <RefreshCw size={14} style={{ animation: 'aa-spin 0.8s linear infinite' }} />
              Loading graph…
            </div>
          )}

          {/* Error state */}
          {errors[activeGraph] && (
            <div style={{ padding: 24, textAlign: 'center',
                          color: 'var(--text-muted)', fontSize: 12 }}>
              <ImageOff size={20} strokeWidth={1} style={{ marginBottom: 6, opacity: 0.4 }} />
              <div>Graph unavailable</div>
            </div>
          )}

          {/* Image */}
          {blobUrls[activeGraph] && !loading[activeGraph] && !errors[activeGraph] && (
            <img
              src={blobUrls[activeGraph]}
              alt={activeGraph === 'angle' ? 'Angle vs Time' : 'Progress Chart'}
              style={{ width: '100%', display: 'block' }}
            />
          )}
        </div>
      )}
    </div>
  )
}