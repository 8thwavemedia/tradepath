import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { FullPageSpinner } from './components/Spinner'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import ProfileSetup from './pages/ProfileSetup'
import ToS from './pages/ToS'
import Privacy from './pages/Privacy'

export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(null) // null = normal flow, 'tos', 'privacy'

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        if (session) fetchProfile(session.user.id)
        else { setProfile(null); setLoading(false) }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
    setLoading(false)
  }

  const handleProfileComplete = () => {
    fetchProfile(session.user.id)
  }

  // Legal pages — accessible from anywhere
  if (page === 'tos') return <ToS onBack={() => setPage(null)} />
  if (page === 'privacy') return <Privacy onBack={() => setPage(null)} />

  if (loading) return <FullPageSpinner />

  if (!session) return <Auth onNavigate={setPage} />
  if (!profile) return <ProfileSetup user={session.user} onComplete={handleProfileComplete} />
  return <Dashboard user={session.user} profile={profile} onProfileUpdate={() => fetchProfile(session.user.id)} />
}
