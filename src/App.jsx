import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { FullPageSpinner } from './components/Spinner'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import ProfileSetup from './pages/ProfileSetup'
import BARegister from './pages/BARegister'
import BADashboard from './pages/BADashboard'
import ToS from './pages/ToS'
import Privacy from './pages/Privacy'

export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [baUser, setBaUser] = useState(null)
  const [local, setLocal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(null) // null, 'tos', 'privacy', 'ba-register', 'role-choice'

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchUserData(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        if (session) fetchUserData(session.user.id)
        else { setProfile(null); setBaUser(null); setLocal(null); setLoading(false) }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserData = async (userId) => {
    // Fetch profile and BA user in parallel
    const [{ data: prof }, { data: ba }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('ba_users').select('*, locals(*)').eq('id', userId).maybeSingle()
    ])
    setProfile(prof)
    setBaUser(ba)
    if (ba?.locals) setLocal(ba.locals)
    setLoading(false)
  }

  const handleProfileComplete = () => fetchUserData(session.user.id)
  const handleBAComplete = () => { setPage(null); fetchUserData(session.user.id) }

  // Legal pages
  if (page === 'tos') return <ToS onBack={() => setPage(null)} />
  if (page === 'privacy') return <Privacy onBack={() => setPage(null)} />

  // BA registration flow (requires sign-in)
  if (page === 'ba-register' && session) {
    return <BARegister user={session.user} onComplete={handleBAComplete} onBack={() => setPage(null)} />
  }

  if (loading) return <FullPageSpinner />

  // Not signed in
  if (!session) return <Auth onNavigate={setPage} />

  // BA user — route to BA dashboard
  if (baUser && local) {
    return <BADashboard user={session.user} baUser={baUser} local={local} />
  }

  // New user with no profile and no BA record — let them choose their role
  if (!profile && !baUser) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0a0a0a', display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: '20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      }}>
        <div style={{ width: '100%', maxWidth: '440px' }}>
          <div style={{
            background: '#141414', border: '1px solid #222',
            borderRadius: '12px', padding: '40px', textAlign: 'center'
          }}>
            <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: '600', margin: '0 0 8px' }}>
              Welcome to TradePath
            </h1>
            <p style={{ color: '#666', fontSize: '14px', margin: '0 0 32px' }}>
              How will you be using TradePath?
            </p>
            <button onClick={() => setPage(null)} style={{
              width: '100%', padding: '16px', background: '#1a2e1a', border: '1px solid #2a4a2a',
              borderRadius: '10px', color: '#fff', fontSize: '15px', fontWeight: '500',
              cursor: 'pointer', marginBottom: '12px', textAlign: 'left'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>Tradesperson</div>
              <div style={{ color: '#888', fontSize: '12px' }}>Find jobs, track per diem, and manage your travel</div>
            </button>
            <button onClick={() => setPage('ba-register')} style={{
              width: '100%', padding: '16px', background: '#141414', border: '1px solid #2a2a2a',
              borderRadius: '10px', color: '#fff', fontSize: '15px', fontWeight: '500',
              cursor: 'pointer', textAlign: 'left'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>Business Agent</div>
              <div style={{ color: '#888', fontSize: '12px' }}>Post jobs, dispatch workers, and manage your local</div>
            </button>
          </div>
        </div>
      </div>
    )
  }
  return <Dashboard user={session.user} profile={profile} onProfileUpdate={() => fetchUserData(session.user.id)} />
}
