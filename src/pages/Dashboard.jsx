import { useState } from 'react'
import { supabase } from '../lib/supabase'
import useIsMobile from '../hooks/useIsMobile'
import PayCalculator from './PayCalculator'
import JobRankings from './JobRankings'
import ProfileEdit from './ProfileEdit'

const TABS = [
  { id: 'home', label: 'Home', icon: '\u2302' },
  { id: 'calculator', label: 'Pay Calc', icon: '\uD83D\uDCB0' },
  { id: 'jobs', label: 'Jobs', icon: '\uD83D\uDCCB' },
  { id: 'settings', label: 'Settings', icon: '\u2699' },
]

const FEATURES = [
  { id: 'calculator', label: 'Pay Calculator', desc: 'Real net take-home for any job', icon: '\uD83D\uDCB0', active: true },
  { id: 'jobs', label: 'Job Rankings', desc: 'Compare and rank opportunities', icon: '\uD83D\uDCCB', active: true },
  { id: 'campgrounds', label: 'Campground Finder', desc: 'Near any job site', icon: '\uD83D\uDDFA\uFE0F', active: false },
  { id: 'career', label: 'Career Path', desc: 'Salaried role tracker', icon: '\uD83D\uDCC8', active: false },
  { id: 'ba', label: 'BA Dashboard', desc: 'For Business Agents', icon: '\uD83C\uDFDB\uFE0F', active: false },
  { id: 'reports', label: 'Reports', desc: 'Financial analytics', icon: '\uD83D\uDCCA', active: false },
]

const BUILD_STATUS = [
  { phase: 'Phase 1 \u2014 Infrastructure', status: 'complete', detail: 'React \u00B7 Vite \u00B7 Supabase \u00B7 Vercel \u00B7 GitHub CI \u00B7 Auth' },
  { phase: 'Phase 2 \u2014 Core Product', status: 'complete', detail: 'Pay calculator \u2705 \u00B7 Job rankings \u2705 \u00B7 User profiles \u2705 \u00B7 Scoring \u2705' },
  { phase: 'Phase 3 \u2014 Campgrounds', status: 'planned', detail: 'Google Maps \u00B7 Campendium API \u00B7 Affiliate links' },
  { phase: 'Phase 4 \u2014 Live Job Feed', status: 'planned', detail: 'UANet scraper \u00B7 Job parser \u00B7 Auto-population' },
  { phase: 'Phase 5 \u2014 Subscriptions', status: 'planned', detail: 'Stripe billing \u00B7 Free / Pro / BA License tiers' },
]

export default function Dashboard({ user, profile, onProfileUpdate }) {
  const [activeTab, setActiveTab] = useState('home')
  const mobile = useIsMobile()

  const handleSignOut = async () => { await supabase.auth.signOut() }

  const firstName = profile?.full_name?.split(' ')[0] || 'there'

  // Shared styles
  const page = {
    minHeight: '100vh', background: '#0a0a0a',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    paddingBottom: mobile ? '64px' : 0
  }

  return (
    <div style={page}>
      {/* Desktop top nav */}
      {!mobile && (
        <div style={{
          background: '#141414', borderBottom: '1px solid #222', padding: '0 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '56px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <h1 style={{ color: '#fff', fontSize: '17px', fontWeight: '600', margin: 0 }}>TradePath</h1>
            <div style={{ display: 'flex', gap: '4px' }}>
              {TABS.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                  padding: '6px 14px', border: 'none', borderRadius: '6px',
                  cursor: 'pointer', fontSize: '13px', fontWeight: '500',
                  background: activeTab === t.id ? '#222' : 'transparent',
                  color: activeTab === t.id ? '#fff' : '#666', transition: 'all 0.15s'
                }}>{t.label}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: '#555', fontSize: '12px' }}>{user.email}</span>
            <button onClick={handleSignOut} style={{
              padding: '5px 12px', background: 'transparent', border: '1px solid #2a2a2a',
              borderRadius: '6px', color: '#666', fontSize: '12px', cursor: 'pointer'
            }}>Sign out</button>
          </div>
        </div>
      )}

      {/* Mobile header — minimal */}
      {mobile && (
        <div style={{
          background: '#141414', borderBottom: '1px solid #222', padding: '0 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '48px'
        }}>
          <h1 style={{ color: '#fff', fontSize: '16px', fontWeight: '600', margin: 0 }}>TradePath</h1>
          <button onClick={handleSignOut} style={{
            padding: '4px 10px', background: 'transparent', border: '1px solid #2a2a2a',
            borderRadius: '6px', color: '#666', fontSize: '11px', cursor: 'pointer'
          }}>Sign out</button>
        </div>
      )}

      {/* Home tab */}
      {activeTab === 'home' && (
        <div style={{ padding: mobile ? '24px 16px' : '40px 24px', maxWidth: '1000px', margin: '0 auto' }}>
          <h2 style={{ color: '#fff', fontSize: mobile ? '18px' : '20px', fontWeight: '500', marginBottom: '6px' }}>
            Welcome back, {firstName}
          </h2>
          <p style={{ color: '#555', fontSize: '13px', marginBottom: '36px' }}>
            {profile?.trade} &middot; {profile?.home_state} &middot; {profile?.years_experience} yrs experience
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: mobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '10px', marginBottom: '32px'
          }}>
            {FEATURES.map(f => (
              <div key={f.id}
                style={{
                  background: '#141414',
                  border: `1px solid ${f.active ? '#2a3a2a' : '#1e1e1e'}`,
                  borderRadius: '10px', padding: mobile ? '14px' : '18px',
                  cursor: f.active ? 'pointer' : 'default',
                  opacity: f.active ? 1 : 0.45
                }}
                onClick={() => f.active && setActiveTab(f.id)}>
                <div style={{ fontSize: '22px', marginBottom: '10px' }}>{f.icon}</div>
                <div style={{ color: '#ddd', fontSize: '13px', fontWeight: '500', marginBottom: '3px' }}>{f.label}</div>
                <div style={{ color: '#555', fontSize: '12px' }}>{f.desc}</div>
                {!f.active && (
                  <div style={{
                    display: 'inline-block', marginTop: '8px', background: '#1a2040',
                    color: '#7eb8f7', fontSize: '10px', padding: '2px 8px', borderRadius: '4px'
                  }}>Coming soon</div>
                )}
              </div>
            ))}
          </div>

          <div style={{ background: '#141414', border: '1px solid #1e1e1e', borderRadius: '10px', padding: '18px' }}>
            <div style={{ color: '#aaa', fontSize: '13px', fontWeight: '500', marginBottom: '12px' }}>
              Platform Build Status
            </div>
            {BUILD_STATUS.map(item => (
              <div key={item.phase} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '7px 0', borderBottom: '1px solid #161616'
              }}>
                <div style={{
                  width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0,
                  background: item.status === 'complete' ? '#4caf50' : item.status === 'active' ? '#f0b429' : '#2a2a2a'
                }} />
                <div>
                  <div style={{ color: '#ccc', fontSize: '12px', fontWeight: '500' }}>{item.phase}</div>
                  <div style={{ color: '#555', fontSize: '11px' }}>{item.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'calculator' && (
        <PayCalculator profile={profile} user={user} onProfileUpdate={onProfileUpdate} />
      )}

      {activeTab === 'jobs' && (
        <JobRankings user={user} profile={profile} />
      )}

      {activeTab === 'settings' && (
        <ProfileEdit user={user} profile={profile} onProfileUpdate={onProfileUpdate} />
      )}

      {/* Mobile bottom tab bar */}
      {mobile && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: '#141414', borderTop: '1px solid #222',
          display: 'flex', height: '60px', zIndex: 90
        }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: '2px', border: 'none', background: 'transparent',
              cursor: 'pointer', color: activeTab === t.id ? '#4caf50' : '#555',
              fontSize: '18px', padding: 0, minHeight: '44px'
            }}>
              <span>{t.icon}</span>
              <span style={{ fontSize: '9px', fontWeight: '500' }}>{t.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
