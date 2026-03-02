export function StatCard({ label, value, icon: Icon, trend, accent = '#0f172a' }) {
    return (
      <div style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 10,
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{
            width: 36, height: 36,
            background: '#f8fafc',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#374151',
          }}>
            {Icon && <Icon size={16} strokeWidth={1.75} />}
          </div>
          {trend !== undefined && (
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 600,
              color: trend >= 0 ? '#059669' : '#dc2626',
              background: trend >= 0 ? '#f0fdf4' : '#fef2f2',
              border: `1px solid ${trend >= 0 ? '#bbf7d0' : '#fecaca'}`,
              borderRadius: 4,
              padding: '0.125rem 0.375rem',
            }}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </span>
          )}
        </div>
        <div>
          <div style={{ fontSize: '1.625rem', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.025em', lineHeight: 1 }}>
            {value}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem', fontWeight: 500 }}>
            {label}
          </div>
        </div>
      </div>
    )
  }
  
  export function SectionCard({ title, subtitle, action, children, noPad }) {
    return (
      <div style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 10,
        overflow: 'hidden',
      }}>
        {(title || action) && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.25rem',
            borderBottom: '1px solid #f3f4f6',
          }}>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>{title}</div>
              {subtitle && <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: 2 }}>{subtitle}</div>}
            </div>
            {action}
          </div>
        )}
        <div style={noPad ? {} : { padding: '1.25rem' }}>
          {children}
        </div>
      </div>
    )
  }
  
  export function Badge({ label, variant = 'default' }) {
    const styles = {
      default:   { color: '#374151', bg: '#f3f4f6', border: '#e5e7eb' },
      success:   { color: '#065f46', bg: '#f0fdf4', border: '#bbf7d0' },
      warning:   { color: '#92400e', bg: '#fffbeb', border: '#fde68a' },
      danger:    { color: '#991b1b', bg: '#fef2f2', border: '#fecaca' },
      info:      { color: '#1e40af', bg: '#eff6ff', border: '#bfdbfe' },
      purple:    { color: '#5b21b6', bg: '#f5f3ff', border: '#ddd6fe' },
    }
    const s = styles[variant] || styles.default
    return (
      <span style={{
        fontSize: '0.7rem',
        fontWeight: 600,
        color: s.color,
        background: s.bg,
        border: `1px solid ${s.border}`,
        borderRadius: 4,
        padding: '0.1875rem 0.5rem',
        whiteSpace: 'nowrap',
      }}>
        {label}
      </span>
    )
  }
  
  export function DataTable({ columns, rows }) {
    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
          <thead>
            <tr>
              {columns.map((col, i) => (
                <th key={i} style={{
                  padding: '0.625rem 1rem',
                  textAlign: 'left',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: '#6b7280',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  background: '#f9fafb',
                  borderBottom: '1px solid #e5e7eb',
                  whiteSpace: 'nowrap',
                }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} style={{ borderBottom: '1px solid #f3f4f6' }}>
                {row.map((cell, ci) => (
                  <td key={ci} style={{
                    padding: '0.75rem 1rem',
                    color: '#374151',
                    verticalAlign: 'middle',
                  }}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }