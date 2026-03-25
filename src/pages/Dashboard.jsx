import { supabase } from '../lib/supabase'

export default function Dashboard({ user }) {
  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    }}>
      {/* Top nav */}
      <div style={{
        background: '#141414',
        borderBottom: '1px solid #222',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '56px'
      }}>
        <h1 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', margin: 0 }}>
          TradePath
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ color: '#666', fontSize: '13px' }}>{user.email}</span>
          <button
            onClick={handleSignOut}
            style={{
              padding: '6px 14px',
              background: 'transparent',
              border: '1px solid #333',
              borderRadius: '6px',
              color: '#aaa',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ padding: '40px 24px', maxWidth: '1100px', margin: '0 auto' }}>
        <h2 style={{ color: '#fff', fontSize: '22px', fontWeight: '500', marginBottom: '8px' }}>
          Welcome back
        </h2>
        <p style={{ color: '#666', fontSize: '14px', marginBottom: '40px' }}>
          TradePath is being built. More features coming soon.
        </p>

        {/* Placeholder cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          marginBottom: '40px'
        }}>
          {[
            { label: 'Job Rankings', desc: 'Compare available jobs', icon: '📋', soon: false },
            { label: 'Pay Calculator', desc: 'Net take-home estimator', icon: '💰', soon: false },
            { label: 'Campground Finder', desc: 'Near any job site', icon: '🗺️', soon: true },
            { label: 'Career Path', desc: 'Salaried role tracker', icon: '📈', soon: true },
            { label: 'BA Dashboard', desc: 'For Business Agents', icon: '🏛️', soon: true },
            { label: 'Reports', desc: 'Financial analytics', icon: '📊', soon: true },
          ].map((item) => (
            <div key={item.label} style={{
              background: '#141414',
              border: '1px solid #222',
              borderRadius: '10px',
              padding: '20px',
              opacity: item.soon ? 0.5 : 1,
              cursor: item.soon ? 'default' : 'pointer'
            }}>
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>{item.icon}</div>
              <div style={{ color: '#fff', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                {item.label}
              </div>
              <div style={{ color: '#555', fontSize: '12px' }}>{item.desc}</div>
              {item.soon && (
                <div style={{
                  display: 'inline-block',
                  marginTop: '8px',
                  background: '#1a2040',
                  color: '#7eb8f7',
                  fontSize: '10px',
                  padding: '2px 8px',
                  borderRadius: '4px'
                }}>
                  Coming soon
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Build status */}
        <div style={{
          background: '#141414',
          border: '1px solid #222',
          borderRadius: '10px',
          padding: '20px'
        }}>
          <h3 style={{ color: '#fff', fontSize: '15px', fontWeight: '500', marginBottom: '12px' }}>
            Platform Build Status
          </h3>
          {[
            { phase: 'Phase 1 — Infrastructure', status: 'complete', detail: 'React · Vite · Supabase · Vercel · GitHub CI' },
            { phase: 'Phase 2 — Job Rankings', status: 'building', detail: 'User profiles · Pay calculator · Ranking algorithm' },
            { phase: 'Phase 3 — Campgrounds', status: 'planned', detail: 'Google Maps · Campendium API · Affiliate links' },
            { phase: 'Phase 4 — Live Job Feed', status: 'planned', detail: 'UANet scraper · Job parser · Auto-population' },
            { phase: 'Phase 5 — Subscriptions', status: 'planned', detail: 'Stripe billing · Free / Pro / BA License tiers' },
          ].map((item) => (
            <div key={item.phase} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '8px 0',
              borderBottom: '1px solid #1a1a1a'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                flexShrink: 0,
                background: item.status === 'complete' ? '#4caf50' : item.status === 'building' ? '#f0b429' : '#333'
              }} />
              <div>
                <div style={{ color: '#ddd', fontSize: '13px', fontWeight: '500' }}>{item.phase}</div>
                <div style={{ color: '#555', fontSize: '12px' }}>{item.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
