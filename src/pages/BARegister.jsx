import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Spinner from '../components/Spinner'
import { FullPageSpinner } from '../components/Spinner'
import useIsMobile from '../hooks/useIsMobile'

const TRADES = [
  'Pipefitter', 'Plumber', 'Steamfitter', 'Electrician', 'Ironworker',
  'Boilermaker', 'Carpenter', 'Operating Engineer', 'Laborer',
  'Sheet Metal Worker', 'Welder', 'Millwright', 'Insulator', 'Other'
]

const STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY'
]

const TIERS = [
  {
    id: 'starter', name: 'Starter', price: '$149/mo',
    features: ['Up to 5 active postings', 'Basic dispatch tracking', 'Email support'],
  },
  {
    id: 'professional', name: 'Professional', price: '$299/mo', recommended: true,
    features: ['Unlimited postings', 'Advanced dispatch & analytics', 'Worker matching', 'Priority support'],
  },
  {
    id: 'enterprise', name: 'Enterprise', price: '$599/mo',
    features: ['Everything in Professional', 'Multi-local management', 'API access', 'Dedicated account manager'],
  },
]

const s = {
  page: { minHeight: '100vh', background: '#0a0a0a', padding: '40px 20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  wrap: { maxWidth: '640px', margin: '0 auto' },
  title: { color: '#fff', fontSize: '22px', fontWeight: '600', margin: '0 0 6px' },
  sub: { color: '#666', fontSize: '14px', margin: '0 0 28px' },
  step: { color: '#555', fontSize: '11px', fontWeight: '600', letterSpacing: '.1em',
    textTransform: 'uppercase', marginBottom: '16px' },
  card: { background: '#141414', border: '1px solid #222', borderRadius: '10px', padding: '20px' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' },
  field: { marginBottom: '12px' },
  label: { display: 'block', color: '#aaa', fontSize: '12px', marginBottom: '5px' },
  input: { width: '100%', padding: '11px 12px', background: '#0a0a0a', border: '1px solid #2a2a2a',
    borderRadius: '8px', color: '#fff', fontSize: '13px', outline: 'none',
    boxSizing: 'border-box', minHeight: '44px' },
  inputReadonly: { width: '100%', padding: '11px 12px', background: '#111', border: '1px solid #1a1a1a',
    borderRadius: '8px', color: '#888', fontSize: '13px', outline: 'none',
    boxSizing: 'border-box', minHeight: '44px', cursor: 'not-allowed' },
  select: { width: '100%', padding: '11px 12px', background: '#0a0a0a', border: '1px solid #2a2a2a',
    borderRadius: '8px', color: '#fff', fontSize: '13px', outline: 'none',
    boxSizing: 'border-box', cursor: 'pointer', minHeight: '44px' },
  btn: { width: '100%', padding: '13px', background: '#4caf50', border: 'none', borderRadius: '8px',
    color: '#fff', fontSize: '14px', fontWeight: '500', cursor: 'pointer', marginTop: '16px',
    minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  btnSecondary: { width: '100%', padding: '13px', background: 'transparent', border: '1px solid #333',
    borderRadius: '8px', color: '#888', fontSize: '14px', cursor: 'pointer', marginTop: '10px', minHeight: '44px' },
  error: { background: '#2e1a1a', border: '1px solid #5a1a1a', borderRadius: '8px',
    padding: '10px 12px', color: '#e05252', fontSize: '13px', marginBottom: '16px' },
  tierGrid: { display: 'grid', gap: '12px', marginBottom: '16px' },
  tierCard: (selected, rec) => ({
    background: selected ? '#1a2e1a' : '#141414',
    border: `1px solid ${selected ? '#4caf50' : rec ? '#2a4a2a' : '#222'}`,
    borderRadius: '10px', padding: '20px', cursor: 'pointer', position: 'relative'
  }),
  tierName: { color: '#fff', fontSize: '16px', fontWeight: '600', marginBottom: '4px' },
  tierPrice: { color: '#4caf50', fontSize: '20px', fontWeight: '700', marginBottom: '12px' },
  tierFeature: { color: '#888', fontSize: '12px', padding: '3px 0' },
  tierBadge: {
    position: 'absolute', top: '-8px', right: '12px', background: '#4caf50',
    color: '#fff', fontSize: '10px', fontWeight: '600', padding: '2px 10px',
    borderRadius: '4px'
  },
  confirmCard: { background: '#141414', border: '1px solid #222', borderRadius: '10px',
    padding: '24px', textAlign: 'center' },
  confirmIcon: { fontSize: '40px', marginBottom: '16px' },
  confirmTitle: { color: '#fff', fontSize: '18px', fontWeight: '600', marginBottom: '8px' },
  confirmSub: { color: '#666', fontSize: '13px', marginBottom: '24px' },
  detailRow: { display: 'flex', justifyContent: 'space-between', padding: '6px 0',
    borderBottom: '1px solid #1a1a1a', fontSize: '13px' },
  detailLabel: { color: '#777' },
  detailVal: { color: '#ddd' },
  back: { color: '#4caf50', fontSize: '13px', background: 'none', border: 'none',
    cursor: 'pointer', padding: 0, marginBottom: '20px', display: 'block' },
  note: { color: '#888', fontSize: '12px', marginTop: '12px', textAlign: 'center' }
}

// Steps: 0=validating, 1=create account, 2=local details, 3=select tier, 4=confirmation
export default function BARegister({ token, onComplete, onBack }) {
  const mobile = useIsMobile()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [invite, setInvite] = useState(null)
  const [password, setPassword] = useState('')
  const [authUser, setAuthUser] = useState(null)
  const [form, setForm] = useState({
    union_name: '', trade: '', local_number: '', city: '', state: '',
    ba_email: '', ba_phone: '', full_name: '', title: 'Business Agent',
    tier: 'professional'
  })

  useEffect(() => {
    if (!token) { onBack(); return }
    validateToken()
  }, [token])

  const validateToken = async () => {
    const { data, error } = await supabase
      .from('ba_invites')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()

    if (error || !data) {
      onBack()
      return
    }

    setInvite(data)
    setForm(f => ({
      ...f,
      ba_email: data.email,
      union_name: data.local_name || ''
    }))
    setStep(1)
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleCreateAccount = async (e) => {
    e.preventDefault()
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setSaving(true)
    setError('')

    const { data, error: signUpErr } = await supabase.auth.signUp({
      email: invite.email,
      password
    })

    if (signUpErr) {
      setSaving(false)
      setError(signUpErr.message)
      return
    }

    // signUp with auto-confirm returns a session immediately
    // If email confirmation is required, the session will be null
    if (data.session) {
      setAuthUser(data.session.user)
      setSaving(false)
      setStep(2)
    } else {
      // Email confirmation required — need to wait for user to confirm
      setSaving(false)
      setError('Please check your email to confirm your account, then come back to this page and sign in below.')
      setStep('confirm-email')
    }
  }

  const handleSignIn = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    const { data, error: signInErr } = await supabase.auth.signInWithPassword({
      email: invite.email,
      password
    })

    if (signInErr) {
      setSaving(false)
      setError(signInErr.message)
      return
    }

    setAuthUser(data.session.user)
    setSaving(false)
    setStep(2)
  }

  const validateStep2 = () => {
    if (!form.union_name || !form.trade || !form.state || !form.full_name) {
      setError('Union name, trade, state, and your name are required.')
      return false
    }
    setError('')
    return true
  }

  const handleSubmit = async () => {
    setSaving(true)
    setError('')

    // Ensure the Supabase client has a fully propagated session
    let session = null
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data } = await supabase.auth.getSession()
      if (data?.session) {
        session = data.session
        break
      }
      await new Promise(r => setTimeout(r, 500))
    }

    console.log('Session check:', session)
    console.log('Session user ID:', session?.user?.id)
    console.log('Auth role:', session?.user?.role)
    console.log('Access token (first 20):', session?.access_token?.substring(0, 20))

    if (!session) {
      setSaving(false)
      setError('Session not established after signup. Please try signing in.')
      setStep('confirm-email')
      return
    }

    // Create local (retry up to 3 times if auth not yet propagated)
    let local = null
    let localErr = null
    for (let attempt = 0; attempt < 3; attempt++) {
      console.log(`Locals INSERT attempt ${attempt + 1}/3`)
      const result = await supabase
        .from('locals')
        .insert({
          union_name: form.union_name,
          trade: form.trade,
          local_number: form.local_number,
          city: form.city,
          state: form.state,
          ba_email: form.ba_email,
          ba_phone: form.ba_phone,
          subscription_tier: form.tier
        })
        .select('id')
        .single()

      console.log('Locals INSERT error:', JSON.stringify(result.error))
      console.log('Locals INSERT data:', result.data)
      console.log('Locals INSERT status:', result.status)

      if (!result.error) {
        local = result.data
        localErr = null
        break
      }

      localErr = result.error
      // Only retry on auth/RLS errors
      if (result.error.code !== '42501' && result.error.message?.indexOf('policy') === -1) break
      await new Promise(r => setTimeout(r, 500))
    }

    if (localErr) { setSaving(false); setError(localErr.message); return }

    // Create ba_user
    const { error: baErr } = await supabase
      .from('ba_users')
      .insert({
        id: session.user.id,
        local_id: local.id,
        full_name: form.full_name,
        title: form.title,
        phone: form.ba_phone
      })

    if (baErr) { setSaving(false); setError(baErr.message); return }

    // Mark invite as used
    await supabase
      .from('ba_invites')
      .update({ used: true, used_at: new Date().toISOString() })
      .eq('id', invite.id)

    setSaving(false)
    setStep(4)
  }

  if (step === 0) return <FullPageSpinner />

  return (
    <div style={s.page}>
      <div style={s.wrap}>
        <button style={s.back} onClick={onBack}>&larr; Back</button>
        <h1 style={s.title}>Set up your BA Portal</h1>
        <p style={s.sub}>Manage job postings, dispatch workers, and grow your local.</p>

        {error && <div style={s.error}>{error}</div>}

        {/* Step 1 — Create account */}
        {step === 1 && (
          <>
            <div style={s.step}>Step 1 of 4 — Create Your Account</div>
            <div style={s.card}>
              <form onSubmit={handleCreateAccount}>
                <div style={s.field}>
                  <label style={s.label}>Email</label>
                  <input style={s.inputReadonly} type="email" value={invite.email} readOnly />
                </div>
                {invite.local_name && (
                  <div style={s.field}>
                    <label style={s.label}>Invited for</label>
                    <input style={s.inputReadonly} value={invite.local_name} readOnly />
                  </div>
                )}
                <div style={s.field}>
                  <label style={s.label}>Create a password *</label>
                  <input style={s.input} type="password" value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="At least 6 characters" minLength={6} required />
                </div>
                <button type="submit" disabled={saving} style={s.btn}>
                  {saving ? <><Spinner /> Creating account...</> : 'Create Account & Continue'}
                </button>
              </form>
              <p style={s.note}>Your account will be created and you'll continue to set up your portal.</p>
            </div>
          </>
        )}

        {/* Email confirmation fallback */}
        {step === 'confirm-email' && (
          <>
            <div style={s.step}>Confirm Your Email</div>
            <div style={s.card}>
              <p style={{ color: '#ccc', fontSize: '14px', margin: '0 0 16px' }}>
                We sent a confirmation email to <strong>{invite.email}</strong>.
                Please confirm your email, then sign in below.
              </p>
              <form onSubmit={handleSignIn}>
                <div style={s.field}>
                  <label style={s.label}>Email</label>
                  <input style={s.inputReadonly} type="email" value={invite.email} readOnly />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Password</label>
                  <input style={s.input} type="password" value={password}
                    onChange={e => setPassword(e.target.value)} required />
                </div>
                <button type="submit" disabled={saving} style={s.btn}>
                  {saving ? <><Spinner /> Signing in...</> : 'Sign In & Continue'}
                </button>
              </form>
            </div>
          </>
        )}

        {/* Step 2 — Local details */}
        {step === 2 && (
          <>
            <div style={s.step}>Step 2 of 4 — Local &amp; Contact Info</div>
            <div style={s.card}>
              <div style={{ ...s.row, gridTemplateColumns: mobile ? '1fr' : '1fr 1fr' }}>
                <div style={s.field}>
                  <label style={s.label}>Your full name *</label>
                  <input style={s.input} value={form.full_name} onChange={e => set('full_name', e.target.value)} />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Title</label>
                  <input style={s.input} value={form.title} onChange={e => set('title', e.target.value)} />
                </div>
              </div>
              <div style={s.field}>
                <label style={s.label}>Union name *</label>
                <input style={s.input} value={form.union_name} onChange={e => set('union_name', e.target.value)}
                  placeholder="United Association Local 57" />
              </div>
              <div style={{ ...s.row, gridTemplateColumns: mobile ? '1fr' : '1fr 1fr' }}>
                <div style={s.field}>
                  <label style={s.label}>Trade *</label>
                  <select style={s.select} value={form.trade} onChange={e => set('trade', e.target.value)}>
                    <option value="">Select trade</option>
                    {TRADES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div style={s.field}>
                  <label style={s.label}>Local number</label>
                  <input style={s.input} value={form.local_number} onChange={e => set('local_number', e.target.value)}
                    placeholder="57" />
                </div>
              </div>
              <div style={{ ...s.row, gridTemplateColumns: mobile ? '1fr' : '1fr 1fr' }}>
                <div style={s.field}>
                  <label style={s.label}>City</label>
                  <input style={s.input} value={form.city} onChange={e => set('city', e.target.value)} />
                </div>
                <div style={s.field}>
                  <label style={s.label}>State *</label>
                  <select style={s.select} value={form.state} onChange={e => set('state', e.target.value)}>
                    <option value="">Select state</option>
                    {STATES.map(st => <option key={st} value={st}>{st}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ ...s.row, gridTemplateColumns: mobile ? '1fr' : '1fr 1fr' }}>
                <div style={s.field}>
                  <label style={s.label}>BA email</label>
                  <input style={s.input} type="email" value={form.ba_email} onChange={e => set('ba_email', e.target.value)} />
                </div>
                <div style={s.field}>
                  <label style={s.label}>BA phone</label>
                  <input style={s.input} type="tel" value={form.ba_phone} onChange={e => set('ba_phone', e.target.value)}
                    placeholder="(801) 555-1234" />
                </div>
              </div>
            </div>
            <button style={s.btn} onClick={() => validateStep2() && setStep(3)}>Continue to pricing</button>
          </>
        )}

        {/* Step 3 — Select tier */}
        {step === 3 && (
          <>
            <div style={s.step}>Step 3 of 4 — Select Your Plan</div>
            <div style={{ ...s.tierGrid, gridTemplateColumns: mobile ? '1fr' : '1fr 1fr 1fr' }}>
              {TIERS.map(tier => (
                <div key={tier.id} style={s.tierCard(form.tier === tier.id, tier.recommended)}
                  onClick={() => set('tier', tier.id)}>
                  {tier.recommended && <div style={s.tierBadge}>Recommended</div>}
                  <div style={s.tierName}>{tier.name}</div>
                  <div style={s.tierPrice}>{tier.price}</div>
                  {tier.features.map(f => (
                    <div key={f} style={s.tierFeature}>{'\u2713'} {f}</div>
                  ))}
                </div>
              ))}
            </div>
            <button style={s.btn} onClick={handleSubmit} disabled={saving}>
              {saving ? <><Spinner /> Creating your portal...</> : 'Create BA Portal'}
            </button>
            <button style={s.btnSecondary} onClick={() => setStep(2)}>Back</button>
          </>
        )}

        {/* Step 4 — Confirmation */}
        {step === 4 && (
          <div style={s.confirmCard}>
            <div style={s.confirmIcon}>{'\u2705'}</div>
            <div style={s.confirmTitle}>Your BA Portal is ready!</div>
            <div style={s.confirmSub}>
              {form.union_name} {form.local_number && `Local ${form.local_number}`} &middot; {TIERS.find(t => t.id === form.tier)?.name} plan
            </div>
            <div style={{ textAlign: 'left', marginBottom: '20px' }}>
              {[
                ['Union', form.union_name],
                ['Trade', form.trade],
                ['Location', [form.city, form.state].filter(Boolean).join(', ')],
                ['Plan', TIERS.find(t => t.id === form.tier)?.name],
              ].map(([label, val]) => (
                <div key={label} style={s.detailRow}>
                  <span style={s.detailLabel}>{label}</span>
                  <span style={s.detailVal}>{val}</span>
                </div>
              ))}
            </div>
            <button style={s.btn} onClick={onComplete}>Go to BA Dashboard</button>
          </div>
        )}
      </div>
    </div>
  )
}
