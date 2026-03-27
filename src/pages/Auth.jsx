import { useState } from 'react'
import { supabase } from '../lib/supabase'
import Spinner from '../components/Spinner'

export default function Auth({ onNavigate }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setMessage('Check your email to confirm your account.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    }
    setLoading(false)
  }

  const inp = {
    width: '100%', padding: '11px 12px', background: '#0a0a0a',
    border: '1px solid #333', borderRadius: '8px', color: '#fff',
    fontSize: '14px', outline: 'none', boxSizing: 'border-box', minHeight: '44px'
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0a0a', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{
          background: '#141414', border: '1px solid #222',
          borderRadius: '12px', padding: '40px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: '600', margin: '0 0 8px' }}>
              TradePath
            </h1>
            <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
              Decision intelligence for traveling tradespeople
            </p>
          </div>

          <div style={{
            display: 'flex', background: '#0a0a0a', borderRadius: '8px',
            padding: '4px', marginBottom: '24px'
          }}>
            {['login', 'signup'].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1, padding: '8px', border: 'none', borderRadius: '6px',
                cursor: 'pointer', fontSize: '13px', fontWeight: '500',
                background: mode === m ? '#222' : 'transparent',
                color: mode === m ? '#fff' : '#666', transition: 'all 0.15s',
                minHeight: '44px'
              }}>
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#aaa', fontSize: '13px', marginBottom: '6px' }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                required placeholder="you@email.com" style={inp} />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', color: '#aaa', fontSize: '13px', marginBottom: '6px' }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                required placeholder="••••••••" minLength={6} style={inp} />
            </div>

            {error && (
              <div style={{ background: '#2e1a1a', border: '1px solid #5a1a1a', borderRadius: '8px',
                padding: '10px 12px', color: '#e05252', fontSize: '13px', marginBottom: '16px' }}>
                {error}
              </div>
            )}
            {message && (
              <div style={{ background: '#1a2e1a', border: '1px solid #1a5a1a', borderRadius: '8px',
                padding: '10px 12px', color: '#4caf50', fontSize: '13px', marginBottom: '16px' }}>
                {message}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '12px', background: loading ? '#333' : '#4caf50',
              border: 'none', borderRadius: '8px', color: '#fff', fontSize: '14px',
              fontWeight: '500', cursor: loading ? 'not-allowed' : 'pointer',
              minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}>
              {loading ? <><Spinner /> Please wait...</> : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button onClick={() => onNavigate?.('ba-register')} style={{
            background: 'none', border: '1px solid #2a2a2a', borderRadius: '8px',
            color: '#7eb8f7', fontSize: '12px', cursor: 'pointer', padding: '10px 20px',
            width: '100%', marginBottom: '12px'
          }}>Business Agent / Contractor? Set up your BA Portal</button>
        </div>

        <div style={{ textAlign: 'center', marginTop: '4px' }}>
          <button onClick={() => onNavigate?.('tos')} style={{
            background: 'none', border: 'none', color: '#555', fontSize: '12px',
            cursor: 'pointer', padding: '4px 8px'
          }}>Terms of Service</button>
          <span style={{ color: '#333' }}>&middot;</span>
          <button onClick={() => onNavigate?.('privacy')} style={{
            background: 'none', border: 'none', color: '#555', fontSize: '12px',
            cursor: 'pointer', padding: '4px 8px'
          }}>Privacy Policy</button>
        </div>
      </div>
    </div>
  )
}
