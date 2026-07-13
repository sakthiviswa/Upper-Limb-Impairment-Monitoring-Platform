import { Search } from 'lucide-react'

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search patients, reports, sessions…',
  className = '',
  ...props
}) {
  return (
    <div className={`ui-search ${className}`}>
      <Search size={20} color="var(--text-muted)" strokeWidth={2} />
      <input
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-label="Search"
        {...props}
      />
    </div>
  )
}
