import { Inbox } from 'lucide-react'
import Button from './Button'

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'No data yet',
  description,
  actionLabel,
  onAction,
}) {
  return (
    <div className="ui-empty">
      <div className="ui-empty__icon">
        <Icon size={36} strokeWidth={1.5} />
      </div>
      <div>
        <h3 className="text-heading" style={{ marginBottom: 8 }}>{title}</h3>
        {description && <p className="text-secondary">{description}</p>}
      </div>
      {actionLabel && onAction && (
        <Button onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  )
}
