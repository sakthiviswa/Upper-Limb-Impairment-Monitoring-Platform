/**
 * MessagesPanel.jsx — fully theme-aware via CSS variables
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { Send, MessageSquare, Search, CheckCheck } from 'lucide-react'

/* ── Helpers ─────────────────────────────────────────────────────── */
const AVATAR_COLORS = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed']
function avatarColor(str = '') {
  let h = 0
  for (let c of str) h = (h * 31 + c.charCodeAt(0)) % AVATAR_COLORS.length
  return AVATAR_COLORS[h]
}
function initials(name = '') {
  return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase()).join('')
}
function fmtTime(iso) {
  const d = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}
function fmtFull(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

/* ── Avatar ──────────────────────────────────────────────────────── */
function Avatar({ name, size = 36 }) {
  const color = avatarColor(name)
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.33, fontWeight: 700, color: '#fff', flexShrink: 0,
      letterSpacing: '-0.02em',
    }}>
      {initials(name)}
    </div>
  )
}

/* ── Main ─────────────────────────────────────────────────────────── */
export default function MessagesPanel() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState([])
  const [activeConv, setActiveConv]       = useState(null)
  const [messages, setMessages]           = useState([])
  const [text, setText]                   = useState('')
  const [sending, setSending]             = useState(false)
  const [loadingConvs, setLoadingConvs]   = useState(true)
  const [loadingMsgs, setLoadingMsgs]     = useState(false)
  const [search, setSearch]               = useState('')
  const bottomRef = useRef(null)
  const pollRef   = useRef(null)
  const textareaRef = useRef(null)

  /* conversations */
  const fetchConversations = useCallback(() => {
    api.get('/messages/conversations')
      .then(r => setConversations(r.data.conversations || []))
      .catch(console.error)
      .finally(() => setLoadingConvs(false))
  }, [])

  useEffect(() => {
    fetchConversations()
    const i = setInterval(fetchConversations, 15000)
    return () => clearInterval(i)
  }, [fetchConversations])

  /* messages */
  const fetchMessages = useCallback((convId) => {
    if (!convId) return
    api.get(`/messages/conversation/${convId}`)
      .then(r => setMessages(r.data.messages || []))
      .catch(console.error)
      .finally(() => setLoadingMsgs(false))
  }, [])

  useEffect(() => {
    if (!activeConv) return
    setLoadingMsgs(true)
    fetchMessages(activeConv.id)
    clearInterval(pollRef.current)
    pollRef.current = setInterval(() => fetchMessages(activeConv.id), 5000)
    return () => clearInterval(pollRef.current)
  }, [activeConv, fetchMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const openConv = (conv) => {
    setActiveConv(conv)
    setMessages([])
    setText('')
    setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unread: 0 } : c))
    api.post(`/messages/conversation/${conv.id}/read`).catch(() => {})
    setTimeout(() => textareaRef.current?.focus(), 100)
  }

  const send = async () => {
    if (!text.trim() || !activeConv || sending) return
    setSending(true)
    const body = text.trim()
    setText('')
    try {
      await api.post('/messages/send', { conversationId: activeConv.id, content: body })
      fetchMessages(activeConv.id)
      fetchConversations()
    } catch (e) {
      setText(body)
    } finally {
      setSending(false)
    }
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const filtered = conversations.filter(c =>
    !search || c.otherName?.toLowerCase().includes(search.toLowerCase())
  )
  const totalUnread = conversations.reduce((s, c) => s + (c.unread || 0), 0)

  /* ── Group messages by date ── */
  const grouped = messages.reduce((acc, msg) => {
    const day = new Date(msg.createdAt).toDateString()
    if (!acc[day]) acc[day] = []
    acc[day].push(msg)
    return acc
  }, {})

  return (
    <div style={{
      fontFamily: "'Sora', sans-serif",
      display: 'flex',
      height: 620,
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 14,
      overflow: 'hidden',
      boxShadow: 'var(--shadow-md)',
    }}>

      {/* ══ Left: Conversation list ══════════════════════════════════ */}
      <div style={{
        width: 272,
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        background: 'var(--bg-card)',
      }}>

        {/* Header */}
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <MessageSquare size={15} color="var(--text-muted)" strokeWidth={2} />
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                Messages
              </span>
            </div>
            {totalUnread > 0 && (
              <span style={{ background: '#ef4444', color: '#fff', borderRadius: 99, padding: '2px 7px', fontSize: 10, fontWeight: 700 }}>
                {totalUnread}
              </span>
            )}
          </div>

          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={12} color="var(--text-muted)" strokeWidth={2} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search…"
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '7px 10px 7px 28px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                fontSize: 12, color: 'var(--text-secondary)',
                fontFamily: 'inherit', outline: 'none',
              }}
              onFocus={e => { e.target.style.borderColor = 'var(--border-focus)'; e.target.style.boxShadow = '0 0 0 2px rgba(59,130,246,0.1)' }}
              onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
            />
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loadingConvs ? (
            <div style={{ padding: '2rem', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
              Loading…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
              {search ? 'No results found.' : 'No conversations yet.'}
            </div>
          ) : filtered.map(conv => {
            const isActive = activeConv?.id === conv.id
            const hasUnread = conv.unread > 0

            return (
              <div
                key={conv.id}
                onClick={() => openConv(conv)}
                style={{
                  padding: '11px 14px',
                  cursor: 'pointer',
                  display: 'flex', gap: 10, alignItems: 'center',
                  background: isActive ? 'var(--bg-active)' : 'transparent',
                  borderLeft: `3px solid ${isActive ? 'var(--brand)' : 'transparent'}`,
                  borderBottom: '1px solid var(--border-light)',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{ position: 'relative' }}>
                  <Avatar name={conv.otherName} size={38} />
                  {hasUnread && (
                    <span style={{ position: 'absolute', top: -1, right: -1, width: 10, height: 10, borderRadius: '50%', background: '#ef4444', border: '2px solid var(--bg-card)' }} />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: hasUnread ? 700 : 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {conv.otherName}
                    </span>
                    {conv.lastMessageAt && (
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>
                        {fmtTime(conv.lastMessageAt)}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: hasUnread ? 'var(--text-secondary)' : 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: hasUnread ? 600 : 400 }}>
                    {conv.lastMessage || 'No messages yet'}
                  </div>
                </div>

                {conv.unread > 0 && (
                  <span style={{ background: 'var(--brand)', color: '#fff', borderRadius: 99, padding: '1px 6px', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                    {conv.unread}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ══ Right: Chat pane ════════════════════════════════════════ */}
      {!activeConv ? (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 12,
          background: 'var(--bg-card2)',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <MessageSquare size={22} color="var(--text-muted)" strokeWidth={1.5} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)' }}>Your Messages</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 220, lineHeight: 1.6 }}>
            Select a conversation from the left to start chatting
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-card2)' }}>

          {/* Chat header */}
          <div style={{
            padding: '12px 18px',
            background: 'var(--bg-card)',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <Avatar name={activeConv.otherName} size={36} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{activeConv.otherName}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' }} />
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {activeConv.otherRole === 'doctor' ? 'Physician' : 'Patient'}
                </span>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: 'auto',
            padding: '20px 18px',
            display: 'flex', flexDirection: 'column', gap: 6,
          }}>
            {loadingMsgs ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>Loading messages…</div>
            ) : messages.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <div style={{ fontSize: 28, opacity: 0.3 }}>💬</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>No messages yet</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Be the first to say hello!</div>
              </div>
            ) : (
              Object.entries(grouped).map(([day, dayMsgs]) => (
                <div key={day}>
                  {/* Date separator */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0 10px' }}>
                    <div style={{ flex: 1, height: 1, background: 'var(--border-light)' }} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', padding: '2px 8px', background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 99 }}>
                      {new Date(day).toDateString() === new Date().toDateString() ? 'Today' : new Date(day).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <div style={{ flex: 1, height: 1, background: 'var(--border-light)' }} />
                  </div>

                  {dayMsgs.map((msg, idx) => {
                    const mine = msg.senderId === user?.id
                    const isLast = idx === dayMsgs.length - 1 || dayMsgs[idx + 1]?.senderId !== msg.senderId
                    const isFirst = idx === 0 || dayMsgs[idx - 1]?.senderId !== msg.senderId

                    return (
                      <div key={msg.id} style={{
                        display: 'flex',
                        justifyContent: mine ? 'flex-end' : 'flex-start',
                        marginBottom: isLast ? 8 : 2,
                        alignItems: 'flex-end', gap: 7,
                      }}>
                        {/* Other person avatar */}
                        {!mine && (
                          <div style={{ opacity: isLast ? 1 : 0, transition: 'opacity 0.15s', flexShrink: 0 }}>
                            <Avatar name={activeConv.otherName} size={24} />
                          </div>
                        )}

                        <div style={{ maxWidth: '68%' }}>
                          {/* Bubble */}
                          <div style={{
                            padding: '9px 13px',
                            borderRadius: mine
                              ? (isFirst ? '14px 14px 4px 14px' : '14px 4px 4px 14px')
                              : (isFirst ? '14px 14px 14px 4px' : '4px 14px 14px 4px'),
                            background: mine ? 'var(--text-primary)' : 'var(--bg-card)',
                            color: mine ? 'var(--bg-card)' : 'var(--text-primary)',
                            fontSize: 13,
                            lineHeight: 1.55,
                            boxShadow: mine ? 'none' : 'var(--shadow-sm)',
                            border: mine ? 'none' : '1px solid var(--border)',
                            wordBreak: 'break-word',
                          }}>
                            {msg.content}
                          </div>

                          {/* Timestamp + read receipt */}
                          {isLast && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3, justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{fmtFull(msg.createdAt)}</span>
                              {mine && <CheckCheck size={11} color="var(--brand)" strokeWidth={2.5} />}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '12px 16px',
            background: 'var(--bg-card)',
            borderTop: '1px solid var(--border)',
            display: 'flex', gap: 8, alignItems: 'flex-end',
          }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <textarea
                ref={textareaRef}
                value={text}
                onChange={e => {
                  setText(e.target.value)
                  e.target.style.height = 'auto'
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
                }}
                onKeyDown={onKeyDown}
                placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
                rows={1}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  resize: 'none', overflow: 'hidden',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: '9px 40px 9px 13px',
                  fontSize: 13,
                  fontFamily: "'Sora', sans-serif",
                  color: 'var(--text-primary)',
                  background: 'var(--bg-input)',
                  outline: 'none',
                  lineHeight: 1.5,
                  maxHeight: 120,
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                  display: 'block',
                }}
                onFocus={e => { e.target.style.borderColor = 'var(--border-focus)'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)' }}
                onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
              />
            </div>
            <button
              onClick={send}
              disabled={!text.trim() || sending}
              style={{
                width: 38, height: 38, flexShrink: 0,
                background: !text.trim() || sending ? 'var(--bg-hover)' : 'var(--brand)',
                color: !text.trim() || sending ? 'var(--text-muted)' : '#fff',
                border: 'none', borderRadius: 10,
                cursor: !text.trim() || sending ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s, transform 0.1s',
              }}
              onMouseDown={e => { if (text.trim() && !sending) e.currentTarget.style.transform = 'scale(0.92)' }}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <Send size={15} strokeWidth={2.5} style={{ transform: 'translateX(1px)' }} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}