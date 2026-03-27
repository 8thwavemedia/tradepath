const s = {
  page: { minHeight: '100vh', background: '#0a0a0a', padding: '40px 20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  wrap: { maxWidth: '640px', margin: '0 auto' },
  title: { color: '#fff', fontSize: '22px', fontWeight: '600', margin: '0 0 8px' },
  date: { color: '#555', fontSize: '12px', marginBottom: '28px' },
  h2: { color: '#ccc', fontSize: '15px', fontWeight: '600', margin: '24px 0 8px' },
  p: { color: '#888', fontSize: '13px', lineHeight: '1.7', margin: '0 0 12px' },
  back: { color: '#4caf50', fontSize: '13px', textDecoration: 'none', cursor: 'pointer',
    background: 'none', border: 'none', padding: 0, marginBottom: '24px', display: 'block' }
}

export default function Privacy({ onBack }) {
  return (
    <div style={s.page}>
      <div style={s.wrap}>
        {onBack && <button style={s.back} onClick={onBack}>&larr; Back</button>}
        <h1 style={s.title}>Privacy Policy</h1>
        <div style={s.date}>Last updated: March 2026</div>

        <h2 style={s.h2}>1. Information We Collect</h2>
        <p style={s.p}>We collect information you provide when creating an account (email, password) and your profile data (name, trade, home state, certifications, schedule preferences, rig type). We also collect job data you enter into the pay calculator and job rankings.</p>

        <h2 style={s.h2}>2. How We Use Your Information</h2>
        <p style={s.p}>Your information is used to personalize your experience — calculating accurate net pay based on your home state, matching jobs to your certifications, and ranking opportunities against your preferences. We do not sell your personal data.</p>

        <h2 style={s.h2}>3. Data Storage</h2>
        <p style={s.p}>Your data is stored securely in Supabase (PostgreSQL) with row-level security policies ensuring you can only access your own data. Passwords are hashed and never stored in plain text.</p>

        <h2 style={s.h2}>4. Data Sharing</h2>
        <p style={s.p}>We do not share your personal information with third parties except as required by law or to provide core service functionality (e.g., authentication via Supabase Auth).</p>

        <h2 style={s.h2}>5. Your Rights</h2>
        <p style={s.p}>You may request deletion of your account and all associated data at any time by contacting us. You may update your profile information at any time through the Settings page.</p>

        <h2 style={s.h2}>6. Cookies</h2>
        <p style={s.p}>We use essential cookies for authentication session management only. We do not use tracking or advertising cookies.</p>

        <h2 style={s.h2}>7. Changes to Policy</h2>
        <p style={s.p}>We may update this policy from time to time. We will notify users of significant changes via email or in-app notification.</p>

        <h2 style={s.h2}>8. Contact</h2>
        <p style={s.p}>For privacy inquiries, contact us at privacy@tradepath.app.</p>
      </div>
    </div>
  )
}
