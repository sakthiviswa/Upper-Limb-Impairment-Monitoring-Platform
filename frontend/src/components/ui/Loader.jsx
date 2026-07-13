export default function Loader({ message = 'Loading…', fullScreen = false }) {
  return (
    <div
      className={fullScreen ? 'ui-loader-screen' : ''}
      style={fullScreen
        ? { minHeight: '100vh', background: 'var(--bg-app)' }
        : { padding: '48px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}
    >
      <div className="ui-spinner" role="status" aria-label="Loading" />
      {message && <p className="text-secondary">{message}</p>}
    </div>
  )
}

export function LoadingScreen({ message = 'Loading dashboard…', fullScreen = true }) {
  return <Loader message={message} fullScreen={fullScreen} />
}
