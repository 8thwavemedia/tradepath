import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { FullPageSpinner } from './components/Spinner'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import ProfileSetup from './pages/ProfileSetup'
import BARegister from './pages/BARegister'
import BADashboard from './pages/BADashboard'
import AdminInvite from './pages/AdminInvite'
import ToS from './pages/ToS'
import Privacy from './pages/Privacy'

const ADMIN_EMAIL = 'cameron@8thwavemedia.com'

function getInviteToken() {
  const params = new URLSearchParams(window.location.search)
  return params.get('token') || null
}

function isAdminRoute() {
  return window.location.pathname === '/admin/invite' ||
    new URLSearchParams(window.location.search).get('page') === 'admin-invite'
}

function clearTokenFromUrl() {
  const url = new URL(window.location.href)
  url.searchParams.delete('token')
  window.history.replaceState({}, '', url.pathname + url.search)
}

export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [baUser, setBaUser] = useState(null)
  const [local, setLocal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(() => isAdminRoute() ? 'admin-invite' : null)
  const [inviteToken, setInviteToken] = useState(getInviteToken)

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
    // Check BA user first — if they are a BA, skip profiles query entirely
    const { data: ba } = await supabase
      .from('ba_users').select('*, locals(*)').eq('id', userId).maybeSingle()

    setBaUser(ba)
    if (ba?.locals) {
      setLocal(ba.locals)
      setLoading(false)
      return
    }

    // Not a BA user — fetch worker profile
    const { data: prof } = await supabase
      .from('profiles').select('*').eq('id', userId).single()
    setProfile(prof)
    setLoading(false)
  }

  const handleProfileComplete = () => fetchUserData(session.user.id)
  const handleBAComplete = () => {
    setInviteToken(null)
    clearTokenFromUrl()
    // Re-fetch with the session that BARegister created internally
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (s) {
        setSession(s)
        fetchUserData(s.user.id)
      }
    })
  }

  // Legal pages
  if (page === 'tos') return <ToS onBack={() => setPage(null)} />
  if (page === 'privacy') return <Privacy onBack={() => setPage(null)} />

  // Admin invite panel (gated by email)
  if (page === 'admin-invite') {
    if (session && session.user.email === ADMIN_EMAIL) {
      return <AdminInvite user={session.user} onBack={() => setPage(null)} />
    }
  }

  // BA registration flow — no session required, BARegister handles auth internally
  if (inviteToken) {
    return (
      <BARegister
        token={inviteToken}
        onComplete={handleBAComplete}
        onBack={() => { clearTokenFromUrl(); window.location.reload() }}
      />
    )
  }

  if (loading) return <FullPageSpinner />

  // Not signed in
  if (!session) return <Auth onNavigate={setPage} />

  // BA user — route to BA dashboard
  if (baUser && local) {
    return <BADashboard user={session.user} baUser={baUser} local={local} />
  }

  // Worker flows
  if (!profile) return <ProfileSetup user={session.user} onComplete={handleProfileComplete} />
  return <Dashboard user={session.user} profile={profile} onProfileUpdate={() => fetchUserData(session.user.id)} />
}
