/**
 * NotificationsPanel
 * Reusable panel showing real-time notifications with accept/decline for doctors.
 * Props:
 *   role        – "patient" | "doctor" | "admin"
 *   onCountChange(n) – called when unread count changes
 */

import { useState, useEffect, useCallback } from 'react'
import api from '../utils/api'

const TYPE_STYLES = {
  doctor_request:    { bg: '#eff6ff', border: '#93c5fd', icon: '👨‍⚕️', color: '#1e40af' },
  request_accepted:  { bg: '#f0fdf4', border: '#86efac', icon: '✅', color: '#15803d' },
  request_declined:  { bg: '#fef2f2', border: '#fca5a5', icon: '❌', color: '#991b1b' },
}

export default function NotificationsPanel({ role, onCountChange }) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading]             = useState(true)
  const [acting, setActing]               = useState({}) // { [notifId]: bool }

  const fetchNotifications = useCallback(() => {
    api.get('/notifications')
      .then((res) => {
        setNotifications(res.data.notifications || [])
        const unread = (res.data.notifications || []).filter(n => !n.isRead).length
        if (onCountChange) onCountChange(unread)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [onCountChange])

  useEffect(() => {
    fetchNotifications()
    // Poll every 30s for new notifications
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  const markRead = async (notifId) => {
    await api.post(`/notifications/${notifId}/read`).catch(() => {})
    setNotifications(prev =>
      prev.map(n => n.id === notifId ? { ...n, isRead: true } : n)
    )
    const unread = notifications.filter(n => !n.isRead && n.id !== notifId).length
    if (onCountChange) onCountChange(unread)
  }

  const markAllRead = async () => {
    await api.post('/notifications/read-all').catch(() => {})
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    if (onCountChange) onCountChange(0)
  }

  const handleAccept = async (notif) => {
    setActing(prev => ({ ...prev, [notif.id]: true }))
    try {
      await api.post(`/doctor/accept-patient/${notif.senderId}`)
      await markRead(notif.id)
      fetchNotifications()
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to accept patient.')
    } finally {
      setActing(prev => ({ ...prev, [notif.id]: false }))
    }
  }

  const handleDecline = async (notif) => {
    setActing(prev => ({ ...prev, [notif.id]: true }))
    try {
      await api.post(`/doctor/decline-patient/${notif.senderId}`)
      await markRead(notif.id)
      fetchNotifications()
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to decline patient.')
    } finally {
      setActing(prev => ({ ...prev, [notif.id]: false }))
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '1rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.8125rem' }}>
        Loading notifications…
      </div>
    )
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.75rem 1rem',
        borderBottom: '1px solid #f3f4f6',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>Notifications</span>
          {unreadCount > 0 && (
            <span style={{
              background: '#ef4444', color: '#fff',
              borderRadius: 10, padding: '0.1rem 0.45rem',
              fontSize: '0.7rem', fontWeight: 700,
            }}>
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '0.75rem', color: '#2563eb', fontWeight: 500,
            }}
          >
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      {notifications.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.8125rem' }}>
          No notifications yet.
        </div>
      ) : (
        <div style={{ maxHeight: 480, overflowY: 'auto' }}>
          {notifications.map((notif) => {
            const style = TYPE_STYLES[notif.type] || TYPE_STYLES.doctor_request
            const isActing = acting[notif.id]
            return (
              <div
                key={notif.id}
                style={{
                  padding: '0.875rem 1rem',
                  background: notif.isRead ? '#fff' : style.bg,
                  borderBottom: '1px solid #f3f4f6',
                  borderLeft: `3px solid ${notif.isRead ? 'transparent' : style.border}`,
                  transition: 'background 0.2s',
                }}
              >
                <div style={{ display: 'flex', gap: '0.625rem' }}>
                  <span style={{ fontSize: '1rem', flexShrink: 0 }}>{style.icon}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{
                      margin: '0 0 0.375rem',
                      fontSize: '0.8125rem',
                      color: notif.isRead ? '#6b7280' : '#111827',
                      lineHeight: 1.45,
                      fontWeight: notif.isRead ? 400 : 500,
                    }}>
                      {notif.message}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.375rem' }}>
                      <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
                        {new Date(notif.createdAt).toLocaleString()}
                      </span>
                      {/* Doctor-only: accept / decline buttons */}
                      {role === 'doctor' && notif.type === 'doctor_request' && !notif.isRead && (
                        <div style={{ display: 'flex', gap: '0.375rem' }}>
                          <button
                            onClick={() => handleAccept(notif)}
                            disabled={isActing}
                            style={{
                              padding: '0.3rem 0.75rem',
                              background: '#16a34a', color: '#fff',
                              border: 'none', borderRadius: 5,
                              fontSize: '0.75rem', fontWeight: 600,
                              cursor: isActing ? 'not-allowed' : 'pointer',
                              opacity: isActing ? 0.6 : 1,
                            }}
                          >
                            {isActing ? '…' : 'Accept'}
                          </button>
                          <button
                            onClick={() => handleDecline(notif)}
                            disabled={isActing}
                            style={{
                              padding: '0.3rem 0.75rem',
                              background: '#fff', color: '#dc2626',
                              border: '1px solid #fca5a5', borderRadius: 5,
                              fontSize: '0.75rem', fontWeight: 600,
                              cursor: isActing ? 'not-allowed' : 'pointer',
                              opacity: isActing ? 0.6 : 1,
                            }}
                          >
                            Decline
                          </button>
                        </div>
                      )}
                      {/* Mark read link for read notifications */}
                      {!notif.isRead && role !== 'doctor' && (
                        <button
                          onClick={() => markRead(notif.id)}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            fontSize: '0.7rem', color: '#2563eb',
                          }}
                        >
                          Dismiss
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}