import { useState, useRef, useEffect } from 'react'
import { CERT_CATEGORIES, ALL_CERTS } from '../lib/certifications'

const styles = {
  wrap: { position: 'relative' },
  input: {
    width: '100%', padding: '11px 12px', background: '#0a0a0a',
    border: '1px solid #2a2a2a', borderRadius: '8px', color: '#fff',
    fontSize: '13px', outline: 'none', boxSizing: 'border-box', minHeight: '44px'
  },
  inputFocused: {
    width: '100%', padding: '11px 12px', background: '#0a0a0a',
    border: '1px solid #4caf50', borderRadius: '8px', color: '#fff',
    fontSize: '13px', outline: 'none', boxSizing: 'border-box', minHeight: '44px'
  },
  dropdown: {
    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
    background: '#141414', border: '1px solid #2a2a2a', borderRadius: '8px',
    marginTop: '4px', maxHeight: '240px', overflowY: 'auto',
    boxShadow: '0 8px 24px rgba(0,0,0,.5)'
  },
  catLabel: {
    padding: '8px 12px 4px', fontSize: '10px', fontWeight: '700',
    color: '#555', letterSpacing: '.08em', textTransform: 'uppercase',
    position: 'sticky', top: 0, background: '#141414'
  },
  option: (selected) => ({
    padding: '7px 12px', fontSize: '12px', cursor: 'pointer',
    color: selected ? '#4caf50' : '#ccc',
    background: selected ? '#1a2e1a' : 'transparent'
  }),
  tags: { display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' },
  tag: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    padding: '4px 10px', background: '#1a2e1a', border: '1px solid #2a4a2a',
    borderRadius: '6px', color: '#4caf50', fontSize: '11px'
  },
  tagX: {
    background: 'none', border: 'none', color: '#4caf50', cursor: 'pointer',
    fontSize: '13px', padding: 0, lineHeight: 1
  },
  empty: { padding: '12px', color: '#555', fontSize: '12px', textAlign: 'center' }
}

export default function CertSelect({ value = [], onChange }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const toggle = (cert) => {
    onChange(value.includes(cert) ? value.filter(c => c !== cert) : [...value, cert])
  }

  const remove = (cert) => onChange(value.filter(c => c !== cert))

  const q = query.toLowerCase()

  // Build filtered categories
  const filtered = Object.entries(CERT_CATEGORIES)
    .map(([cat, certs]) => [cat, certs.filter(c => c.toLowerCase().includes(q))])
    .filter(([, certs]) => certs.length > 0)

  const totalMatches = filtered.reduce((n, [, c]) => n + c.length, 0)

  return (
    <div style={styles.wrap} ref={wrapRef}>
      <input
        style={open ? styles.inputFocused : styles.input}
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder={value.length ? `${value.length} selected — type to search...` : 'Search certifications...'}
      />

      {open && (
        <div style={styles.dropdown}>
          {totalMatches === 0 ? (
            <div style={styles.empty}>No certifications match "{query}"</div>
          ) : (
            filtered.map(([cat, certs]) => (
              <div key={cat}>
                <div style={styles.catLabel}>{cat}</div>
                {certs.map(cert => (
                  <div key={cert} style={styles.option(value.includes(cert))}
                    onMouseDown={(e) => { e.preventDefault(); toggle(cert) }}>
                    {value.includes(cert) ? '✓ ' : ''}{cert}
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      )}

      {value.length > 0 && (
        <div style={styles.tags}>
          {value.map(cert => (
            <span key={cert} style={styles.tag}>
              {cert}
              <button style={styles.tagX} onClick={() => remove(cert)}>&times;</button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
