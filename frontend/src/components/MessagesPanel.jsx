/**
 * MessagesPanel — Chat between doctor and patient
 * Shows conversation threads in the sidebar; clicking opens the chat.
 * CSS-only styles (no Tailwind), uses native fetch/polling.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'

/* ─── tiny inline styles helper ─────────────────────────────────────── */
const S = {
  root: {
    fontFamily: "'Sora', sans-serif",
    display: 'flex',
    height: '100%',
    minHeight: 520,
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    overflow: 'hidden',
  },
  /* Left: conversation list */
  sidebar: {
    width: 260,
    borderRight: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
  },
  sidebarHeader: {
    padding: '1rem 1rem 0.75rem',
    borderBottom: '1px solid #f3f4f6',
  },
  sidebarTitle: {
    fontSize: '0.875rem',
    fontWeight: 700,
    color: '#0d1117',
    margin: 0,
    letterSpacing: '-0.01em',
  },
  sidebarSubtitle: {
    fontSize: '0.7rem',
    color: '#9ca3af',
    marginTop: 2,
  },
  convList: {
    flex: 1,
    overflowY: 'auto',
  },
  convItem: (active, unread) => ({
    padding: '0.75rem 1rem',
    cursor: 'pointer',
    borderBottom: '1px solid #f9fafb',
    background: active ? '#f1f5f9' : '#fff',
    borderLeft: active ? '3px solid #0f172a' : '3px solid transparent',
    transition: 'background 0.12s',
    display: 'flex',
    gap: '0.625rem',
    alignItems: 'flex-start',
  }),
  avatar: (color) => ({
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: color,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#fff',
    flexShrink: 0,
  }),
  convInfo: { flex: 1, minWidth: 0 },
  convName: (unread) => ({
    fontSize: '0.8125rem',
    fontWeight: unread ? 700 : 500,
    color: '#0d1117',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }),
  convPreview: {
    fontSize: '0.7rem',
    color: '#9ca3af',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    marginTop: 2,
  },
  unreadBadge: {
    background: '#ef4444',
    color: '#fff',
    borderRadius: 10,
    padding: '0.05rem 0.35rem',
    fontSize: '0.6rem',
    fontWeight: 700,
    flexShrink: 0,
    marginTop: 3,
  },
  /* Right: chat pane */
  chatPane: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    background: '#f8fafc',
  },
  chatHeader: {
    padding: '0.875rem 1.125rem',
    background: '#fff',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  chatHeaderInfo: { flex: 1 },
  chatHeaderName: { fontSize: '0.9375rem', fontWeight: 700, color: '#0d1117' },
  chatHeaderRole: { fontSize: '0.7rem', color: '#9ca3af', marginTop: 1 },
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '1.25rem 1.125rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  msgRow: (mine) => ({
    display: 'flex',
    justifyContent: mine ? 'flex-end' : 'flex-start',
  }),
  bubble: (mine) => ({
    maxWidth: '72%',
    padding: '0.625rem 0.875rem',
    borderRadius: mine ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
    background: mine ? '#0f172a' : '#fff',
    color: mine ? '#f1f5f9' : '#0d1117',
    fontSize: '0.8125rem',
    lineHeight: 1.5,
    boxShadow: mine ? 'none' : '0 1px 2px rgba(0,0,0,0.06)',
    border: mine ? 'none' : '1px solid #e5e7eb',
  }),
  bubbleTime: (mine) => ({
    fontSize: '0.65rem',
    color: mine ? '#94a3b8' : '#9ca3af',
    marginTop: 4,
    textAlign: mine ? 'right' : 'left',
  }),
  inputRow: {
    padding: '0.875rem 1.125rem',
    background: '#fff',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'flex-end',
  },
  textarea: {
    flex: 1,
    resize: 'none',
    border: '1px solid #d1d5db',
    borderRadius: 10,
    padding: '0.625rem 0.875rem',
    fontSize: '0.8125rem',
    fontFamily: "'Sora', sans-serif",
    color: '#0d1117',
    outline: 'none',
    lineHeight: 1.5,
    maxHeight: 120,
    transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  sendBtn: (disabled) => ({
    padding: '0.625rem 1.125rem',
    background: disabled ? '#e5e7eb' : '#0f172a',
    color: disabled ? '#9ca3af' : '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: '0.8125rem',
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: "'Sora', sans-serif",
    transition: 'background 0.15s',
    whiteSpace: 'nowrap',
    alignSelf: 'flex-end',
  }),
  emptyState: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#9ca3af',
    gap: '0.5rem',
  },
}

const AVATAR_COLORS = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed']
function avatarColor(str = '') {
  let h = 0; for (let c of str) h = (h * 31 + c.charCodeAt(0)) % AVATAR_COLORS.length
  return AVATAR_COLORS[h]
}
function initials(name = '') {
  return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase()).join('')
}
function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function MessagesPanel() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState([])
  const [activeConv, setActiveConv]       = useState(null)
  const [messages, setMessages]           = useState([])
  const [text, setText]                   = useState('')
  const [sending, setSending]             = useState(false)
  const [loadingConvs, setLoadingConvs]   = useState(true)
  const [loadingMsgs, setLoadingMsgs]     = useState(false)
  const bottomRef = useRef(null)
  const pollRef   = useRef(null)

  /* ── Load conversations ── */
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

  /* ── Load messages for active conversation ── */
  const fetchMessages = useCallback((convId) => {
    if (!convId) return
    setLoadingMsgs(true)
    api.get(`/messages/conversation/${convId}`)
      .then(r => setMessages(r.data.messages || []))
      .catch(console.error)
      .finally(() => setLoadingMsgs(false))
  }, [])

  useEffect(() => {
    if (!activeConv) return
    fetchMessages(activeConv.id)
    clearInterval(pollRef.current)
    pollRef.current = setInterval(() => fetchMessages(activeConv.id), 5000)
    return () => clearInterval(pollRef.current)
  }, [activeConv, fetchMessages])

  /* ── Scroll to bottom on new message ── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const openConv = (conv) => {
    setActiveConv(conv)
    setMessages([])
    setText('')
    /* mark as read locally */
    setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unread: 0 } : c))
    api.post(`/messages/conversation/${conv.id}/read`).catch(() => {})
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
      setText(body) // restore on error
      alert(e.response?.data?.message || 'Failed to send message.')
    } finally {
      setSending(false)
    }
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <div style={S.root}>
      {/* ── Conversation list ── */}
      <div style={S.sidebar}>
        <div style={S.sidebarHeader}>
          <div style={S.sidebarTitle}>Messages</div>
          <div style={S.sidebarSubtitle}>{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</div>
        </div>
        <div style={S.convList}>
          {loadingConvs ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', fontSize: '0.8rem', color: '#9ca3af' }}>Loading…</div>
          ) : conversations.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', fontSize: '0.8rem', color: '#9ca3af' }}>
              No conversations yet.
            </div>
          ) : conversations.map(conv => (
            <div
              key={conv.id}
              style={S.convItem(activeConv?.id === conv.id, conv.unread > 0)}
              onClick={() => openConv(conv)}
            >
              <div style={S.avatar(avatarColor(conv.otherName))}>
                {initials(conv.otherName)}
              </div>
              <div style={S.convInfo}>
                <div style={S.convName(conv.unread > 0)}>{conv.otherName}</div>
                <div style={S.convPreview}>{conv.lastMessage || 'No messages yet'}</div>
              </div>
              {conv.unread > 0 && (
                <span style={S.unreadBadge}>{conv.unread}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Chat pane ── */}
      {!activeConv ? (
        <div style={{ ...S.chatPane, ...S.emptyState }}>
          <div style={{ fontSize: '2rem' }}>💬</div>
          <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>Select a conversation</div>
          <div style={{ fontSize: '0.75rem' }}>Choose a contact from the left to start chatting</div>
        </div>
      ) : (
        <div style={S.chatPane}>
          {/* Chat header */}
          <div style={S.chatHeader}>
            <div style={S.avatar(avatarColor(activeConv.otherName))}>
              {initials(activeConv.otherName)}
            </div>
            <div style={S.chatHeaderInfo}>
              <div style={S.chatHeaderName}>{activeConv.otherName}</div>
              <div style={S.chatHeaderRole}>{activeConv.otherRole === 'doctor' ? '👨‍⚕️ Physician' : '🧑 Patient'}</div>
            </div>
          </div>

          {/* Messages */}
          <div style={S.messages}>
            {loadingMsgs ? (
              <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.8rem' }}>Loading messages…</div>
            ) : messages.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.8rem', marginTop: '2rem' }}>
                No messages yet. Say hello! 👋
              </div>
            ) : messages.map(msg => {
              const mine = msg.senderId === user?.id
              return (
                <div key={msg.id} style={S.msgRow(mine)}>
                  <div>
                    <div style={S.bubble(mine)}>{msg.content}</div>
                    <div style={S.bubbleTime(mine)}>{fmtTime(msg.createdAt)}</div>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={S.inputRow}>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Type a message… (Enter to send)"
              rows={1}
              style={S.textarea}
              onFocus={e => { e.target.style.borderColor = '#0f172a'; e.target.style.boxShadow = '0 0 0 3px rgba(15,23,42,0.07)' }}
              onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none' }}
            />
            <button
              onClick={send}
              disabled={!text.trim() || sending}
              style={S.sendBtn(!text.trim() || sending)}
            >
              {sending ? '…' : 'Send'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}