import { Loader2 } from 'lucide-react'

const VARIANTS = {
  primary: 'ui-btn--primary',
  secondary: 'ui-btn--secondary',
  ghost: 'ui-btn--ghost',
  danger: 'ui-btn--danger',
}

const SIZES = {
  sm: 'ui-btn--sm',
  md: '',
  lg: 'ui-btn--lg',
  icon: 'ui-btn--icon',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  loading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  block = false,
  type = 'button',
  ...props
}) {
  const classes = [
    'ui-btn',
    VARIANTS[variant] || VARIANTS.primary,
    SIZES[size] || '',
    block ? 'ui-btn--block' : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 size={size === 'sm' ? 14 : 18} className="ui-spinner-inline" style={{ animation: 'ui-spin 0.7s linear infinite' }} />}
      {!loading && Icon && iconPosition === 'left' && <Icon size={size === 'sm' ? 16 : size === 'lg' ? 22 : 20} strokeWidth={2} />}
      {children}
      {!loading && Icon && iconPosition === 'right' && <Icon size={size === 'sm' ? 16 : size === 'lg' ? 22 : 20} strokeWidth={2} />}
    </button>
  )
}
