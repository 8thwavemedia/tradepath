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

export default function ToS({ onBack }) {
  return (
    <div style={s.page}>
      <div style={s.wrap}>
        {onBack && <button style={s.back} onClick={onBack}>&larr; Back</button>}
        <h1 style={s.title}>Terms of Service</h1>
        <div style={s.date}>Last updated: March 2026</div>

        <h2 style={s.h2}>1. Acceptance of Terms</h2>
        <p style={s.p}>By accessing or using TradePath ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>

        <h2 style={s.h2}>2. Description of Service</h2>
        <p style={s.p}>TradePath provides decision intelligence tools for traveling tradespeople, including pay calculators, job ranking tools, and profile management. The Service is provided "as is" and calculations are estimates only.</p>

        <h2 style={s.h2}>3. User Accounts</h2>
        <p style={s.p}>You are responsible for maintaining the security of your account credentials. You must provide accurate information when creating your account.</p>

        <h2 style={s.h2}>4. Acceptable Use</h2>
        <p style={s.p}>You agree not to misuse the Service, attempt to gain unauthorized access to any part of the Service, or use the Service for any unlawful purpose.</p>

        <h2 style={s.h2}>5. Disclaimer</h2>
        <p style={s.p}>Pay calculations, tax estimates, and job scores are approximations for informational purposes only. They do not constitute financial, tax, or legal advice. Actual compensation and taxes will vary. Consult a qualified professional for specific guidance.</p>

        <h2 style={s.h2}>6. Limitation of Liability</h2>
        <p style={s.p}>TradePath and its operators shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service.</p>

        <h2 style={s.h2}>7. Changes to Terms</h2>
        <p style={s.p}>We may update these terms from time to time. Continued use of the Service after changes constitutes acceptance of the updated terms.</p>

        <h2 style={s.h2}>8. Contact</h2>
        <p style={s.p}>For questions about these terms, contact us at support@tradepath.app.</p>
      </div>
    </div>
  )
}
