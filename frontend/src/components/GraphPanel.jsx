/**
 * GraphPanel.jsx — premium chart panel (JWT blob fetch preserved)
 */

import { useState, useEffect, useCallback } from 'react'
import { ImageOff, ChevronDown, ChevronUp, LineChart, BarChart, RefreshCw } from 'lucide-react'
import api from '../utils/api'

export default function GraphPanel({ sessionId, hasAngleGraph, hasProgressGraph }) {
  const [activeGraph, setActiveGraph] = useState(null)
  const [blobUrls, setBlobUrls] = useState({})
  const [loading, setLoading] = useState({})
  const [errors, setErrors] = useState({})

  const fetchGraph = useCallback(async (key) => {
    if (blobUrls[key] || loading[key] || errors[key]) return
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

  useEffect(() => {
    if (activeGraph) fetchGraph(activeGraph)
  }, [activeGraph, fetchGraph])

  useEffect(() => {
    return () => Object.values(blobUrls).forEach(URL.revokeObjectURL)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!hasAngleGraph && !hasProgressGraph) {
    return (
      <div className="fp-alert fp-alert--info" style={{ marginTop: 14 }}>
        <ImageOff size={18} strokeWidth={1.5} />
        Graphs are being generated — check back in a moment.
      </div>
    )
  }

  const tabs = [
    hasAngleGraph && { key: 'angle', label: 'Angle vs Time', Icon: LineChart },
    hasProgressGraph && { key: 'progress', label: 'Progress', Icon: BarChart },
  ].filter(Boolean)

  return (
    <div style={{ marginTop: 14 }}>
      <div className="fp-tabs" style={{ marginBottom: 12 }}>
        {tabs.map(({ key, label, Icon }) => {
          const active = activeGraph === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveGraph(active ? null : key)}
              className={`fp-tab ${active ? 'fp-tab--active' : ''}`}
            >
              <Icon size={16} strokeWidth={2} />
              {label}
              {active
                ? <ChevronUp size={14} strokeWidth={2.5} />
                : <ChevronDown size={14} strokeWidth={2.5} />}
            </button>
          )
        })}
      </div>

      {activeGraph && (
        <div className="fp-card" style={{ background: 'var(--bg-app)', minHeight: 100 }}>
          <div className="fp-card__body" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            minHeight: 100, padding: loading[activeGraph] || errors[activeGraph] ? 24 : 0,
          }}>
            {loading[activeGraph] && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-muted)', fontSize: 14 }}>
                <div className="fp-spinner" />
                Loading graph…
              </div>
            )}

            {errors[activeGraph] && (
              <div className="fp-empty" style={{ padding: 24 }}>
                <div className="fp-empty__icon">
                  <ImageOff size={28} strokeWidth={1.5} />
                </div>
                <div className="fp-empty__title">Graph unavailable</div>
              </div>
            )}

            {blobUrls[activeGraph] && !loading[activeGraph] && !errors[activeGraph] && (
              <img
                src={blobUrls[activeGraph]}
                alt={activeGraph === 'angle' ? 'Angle vs Time' : 'Progress Chart'}
                style={{ width: '100%', display: 'block', borderRadius: 8 }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
