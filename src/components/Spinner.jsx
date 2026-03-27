export default function Spinner({ size = 'sm', style }) {
  return (
    <div className={`tp-spinner${size === 'lg' ? ' tp-spinner-lg' : ''}`}
      style={{ margin: size === 'lg' ? '0 auto' : undefined, ...style }} />
  )
}

export function FullPageSpinner() {
  return (
    <div style={{
      minHeight: '100vh', background: '#0a0a0a',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="tp-spinner tp-spinner-lg" />
    </div>
  )
}
