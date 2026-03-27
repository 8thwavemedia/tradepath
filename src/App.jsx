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
  const [page, setPage] = useState(null) // null, 'tos', 'privacy', 'ba-register'

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

  if (loading) return <FullPageSpinner />

  // Not signed in
  if (!session) return <Auth onNavigate={setPage} />

  // BA registration flow
  if (page === 'ba-register') {
    return <BARegister user={session.user} onComplete={handleBAComplete} onBack={() => setPage(null)} />
  }

  // BA user — route to BA dashboard
  if (baUser && local) {
    return <BADashboard user={session.user} baUser={baUser} local={local} />
  }

  // Worker flows
  if (!profile) return <ProfileSetup user={session.user} onComplete={handleProfileComplete} />
  return <Dashboard user={session.user} profile={profile} onProfileUpdate={() => fetchUserData(session.user.id)} />
}
