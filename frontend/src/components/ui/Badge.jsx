const VARIANTS = {
  default: 'ui-badge--default',
  success: 'ui-badge--success',
  warning: 'ui-badge--warning',
  danger: 'ui-badge--danger',
  info: 'ui-badge--info',
  brand: 'ui-badge--brand',
  purple: 'ui-badge--brand',
}

export default function Badge({ label, variant = 'default', dot = true, className = '' }) {
  return (
    <span className={`ui-badge ${VARIANTS[variant] || VARIANTS.default} ${className}`}>
      {dot && <span className="ui-badge__dot" />}
      {label}
    </span>
  )
}
