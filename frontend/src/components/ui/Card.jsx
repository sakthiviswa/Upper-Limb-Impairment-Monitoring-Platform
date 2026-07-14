import { MotionCard } from './motion'

export function Card({ children, className = '', style, interactive = false, onClick, noPad = false, ...props }) {
  const classes = [
    'ui-card',
    interactive ? 'ui-card--interactive' : '',
    className,
  ].filter(Boolean).join(' ')

  const body = (
    <div className={noPad ? 'ui-card__body ui-card__body--flush' : 'ui-card__body'} style={noPad ? style : undefined}>
      {children}
    </div>
  )

  if (interactive) {
    return (
      <MotionCard className={classes} style={noPad ? style : undefined} onClick={onClick} interactive {...props}>
        {noPad ? children : body}
      </MotionCard>
    )
  }

  return (
    <div className={classes} style={noPad ? style : undefined} onClick={onClick} {...props}>
      {noPad ? children : <div className="ui-card__body" style={style}>{children}</div>}
    </div>
  )
}

export function SectionCard({ title, subtitle, action, children, noPad = false, className = '' }) {
  return (
    <div className={`ui-card ${className}`}>
      {(title || action) && (
        <div className="ui-card__header">
          <div>
            {title && <h3 className="ui-card__title">{title}</h3>}
            {subtitle && <p className="ui-card__subtitle">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={noPad ? 'ui-card__body ui-card__body--flush' : 'ui-card__body'}>
        {children}
      </div>
    </div>
  )
}

export function StatCard({ label, value, icon: Icon, color, loading, trend, onClick }) {
  const iconStyle = color
    ? { background: `${color}15`, borderColor: `${color}30`, color }
    : undefined

  return (
    <Card interactive={!!onClick} onClick={onClick} className="ui-stat-card">
      <div className="ui-stat-card__row">
        {Icon && (
          <div className="ui-stat-card__icon" style={iconStyle}>
            <Icon size={28} strokeWidth={2} />
          </div>
        )}
        <div style={{ flex: 1 }}>
          {loading ? (
            <div className="ui-skeleton" style={{ width: 48, height: 32, marginBottom: 8 }} />
          ) : (
            <div className="ui-stat-card__value">{value ?? '—'}</div>
          )}
          <div className="ui-stat-card__label">{label}</div>
          {trend != null && (
            <div className="text-caption" style={{ marginTop: 4, color: trend >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

export function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="ui-card__header">
      <div>
        {title && <h3 className="ui-card__title">{title}</h3>}
        {subtitle && <p className="ui-card__subtitle">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function PageHeader({ title, subtitle, icon: Icon, action, children }) {
  return (
    <div className="page-header">
      <div className="page-header__left">
        {Icon && (
          <div className="page-header__icon">
            <Icon size={32} strokeWidth={2} />
          </div>
        )}
        <div>
          <h1 className="text-page-title" style={{ margin: 0 }}>{title}</h1>
          {subtitle && <p className="text-secondary" style={{ marginTop: 8 }}>{subtitle}</p>}
          {children}
        </div>
      </div>
      {action}
    </div>
  )
}

export function PageSection({ title, subtitle, icon: Icon, action, children }) {
  return (
    <div className="page-container">
      
      {children}
    </div>
  )
}
