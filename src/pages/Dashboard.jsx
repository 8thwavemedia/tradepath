import { useState } from 'react'
import { supabase } from '../lib/supabase'
import PayCalculator from './PayCalculator'
import JobRankings from './JobRankings'

const s = {
  page: {
    minHeight: '100vh',
    background: '#0a0a0a',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  },
  nav: {
    background: '#141414',
    borderBottom: '1px solid #222',
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '56px'
  },
  navLeft: { display: 'flex', alignItems: 'center', gap: '32px' },
  logo: { color: '#fff', fontSize: '17px', fontWeight: '600', margin: 0 },
  navTabs: { display: 'flex', gap: '4px' },
  tab: (active) => ({
    padding: '6px 14px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    background: active ? '#222' : 'transparent',
    color: active ? '#fff' : '#666',
    transition: 'all 0.15s'
  }),
  navRight: { display: 'flex', alignItems: 'center', gap: '12px' },
  userEmail: { color: '#555', fontSize: '12px' },
  signOutBtn: {
    padding: '5px 12px',
    background: 'transparent',
    border: '1px solid #2a2a2a',
    borderRadius: '6px',
    color: '#666',
    fontSize: '12px',
    cursor: 'pointer'
  },
  homeWrap: { padding: '40px 24px', maxWidth: '1000px', margin: '0 auto' },
  greeting: { color: '#fff', fontSize: '20px', fontWeight: '500', marginBottom: '6px' },
  greetingSub: { color: '#555', fontSize: '13px', marginBottom: '36px' },
  featureGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '10px',
    marginBottom: '32px'
  },
  featureCard: (active) => ({
    background: '#141414',
    border: `1px solid ${active ? '#2a3a2a' : '#1e1e1e'}`,
    borderRadius: '10px',
    padding: '18px',
    cursor: active ? 'pointer' : 'default',
    opacity: active ? 1 : 0.45,
    transition: 'border-color 0.15s'
  }),
  featureIcon: { fontSize: '22px', marginBottom: '10px' },
  featureTitle: { color: '#ddd', fontSize: '13px', fontWeight: '500', marginBottom: '3px' },
  featureDesc: { color: '#555', fontSize: '12px' },
  badge: {
    display: 'inline-block', marginTop: '8px',
    background: '#1a2040', color: '#7eb8f7',
    fontSize: '10px', padding: '2px 8px', borderRadius: '4px'
  },
  statusCard: {
    background: '#141414', border: '1px solid #1e1e1e',
    borderRadius: '10px', padding: '18px'
  },
  statusTitle: { color: '#aaa', fontSize: '13px', fontWeight: '500', marginBottom: '12px' },
  statusRow: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '7px 0', borderBottom: '1px solid #161616'
  },
  dot: (status) => ({
    width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0,
    background: status === 'complete' ? '#4caf50' : status === 'active' ? '#f0b429' : '#2a2a2a'
  }),
  statusPhase: { color: '#ccc', fontSize: '12px', fontWeight: '500' },
  statusDetail: { color: '#555', fontSize: '11px' }
}

const FEATURES = [
  { id: 'calculator', label: 'Pay Calculator', desc: 'Real net take-home for any job', icon: '💰', active: true },
  { id: 'jobs', label: 'Job Rankings', desc: 'Compare and rank opportunities', icon: '📋', active: true },
  { id: 'campgrounds', label: 'Campground Finder', desc: 'Near any job site', icon: '🗺️', active: false },
  { id: 'career', label: 'Career Path', desc: 'Salaried role tracker', icon: '📈', active: false },
  { id: 'ba', label: 'BA Dashboard', desc: 'For Business Agents', icon: '🏛️', active: false },
  { id: 'reports', label: 'Reports', desc: 'Financial analytics', icon: '📊', active: false },
]

const BUILD_STATUS = [
  { phase: 'Phase 1 — Infrastructure', status: 'complete', detail: 'React · Vite · Supabase · Vercel · GitHub CI · Auth' },
  { phase: 'Phase 2 — Core Product', status: 'active', detail: 'Pay calculator ✅ · Job rankings · User profiles' },
  { phase: 'Phase 3 — Campgrounds', status: 'planned', detail: 'Google Maps · Campendium API · Affiliate links' },
  { phase: 'Phase 4 — Live Job Feed', status: 'planned', detail: 'UANet scraper · Job parser · Auto-population' },
  { phase: 'Phase 5 — Subscriptions', status: 'planned', detail: 'Stripe billing · Free / Pro / BA License tiers' },
]

export default function Dashboard({ user, profile, onProfileUpdate }) {
  const [activeTab, setActiveTab] = useState('home')

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const firstName = profile?.full_name?.split(' ')[0] || 'there'

  return (
    <div style={s.page}>
      {/* Nav */}
      <div style={s.nav}>
        <div style={s.navLeft}>
          <h1 style={s.logo}>TradePath</h1>
          <div style={s.navTabs}>
            {[
              { id: 'home', label: 'Home' },
              { id: 'calculator', label: 'Pay Calculator' },
              { id: 'jobs', label: 'Job Rankings' },
            ].map(t => (
              <button key={t.id} style={s.tab(activeTab === t.id)}
                onClick={() => setActiveTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div style={s.navRight}>
          <span style={s.userEmail}>{user.email}</span>
          <button style={s.signOutBtn} onClick={handleSignOut}>Sign out</button>
        </div>
      </div>

      {/* Home tab */}
      {activeTab === 'home' && (
        <div style={s.homeWrap}>
          <h2 style={s.greeting}>Welcome back, {firstName}</h2>
          <p style={s.greetingSub}>
            {profile?.trade} · {profile?.home_state} · {profile?.years_experience} yrs experience
          </p>

          <div style={s.featureGrid}>
            {FEATURES.map(f => (
              <div key={f.id}
                style={s.featureCard(f.active)}
                onClick={() => f.active && setActiveTab(f.id)}>
                <div style={s.featureIcon}>{f.icon}</div>
                <div style={s.featureTitle}>{f.label}</div>
                <div style={s.featureDesc}>{f.desc}</div>
                {!f.active && <div style={s.badge}>Coming soon</div>}
              </div>
            ))}
          </div>

          <div style={s.statusCard}>
            <div style={s.statusTitle}>Platform Build Status</div>
            {BUILD_STATUS.map(item => (
              <div key={item.phase} style={s.statusRow}>
                <div style={s.dot(item.status)} />
                <div>
                  <div style={s.statusPhase}>{item.phase}</div>
                  <div style={s.statusDetail}>{item.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pay Calculator tab */}
      {activeTab === 'calculator' && (
        <PayCalculator profile={profile} user={user} onProfileUpdate={onProfileUpdate} />
      )}

      {/* Job Rankings tab */}
      {activeTab === 'jobs' && (
        <JobRankings user={user} profile={profile} />
      )}
    </div>
  )
}
