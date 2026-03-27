import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Spinner from '../components/Spinner'

const ADMIN_EMAIL = 'cameron@8thwavemedia.com'

const s = {
  page: { minHeight: '100vh', background: '#0a0a0a', padding: '40px 20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  wrap: { maxWidth: '640px', margin: '0 auto' },
  title: { color: '#fff', fontSize: '22px', fontWeight: '600', margin: '0 0 6px' },
  sub: { color: '#666', fontSize: '14px', margin: '0 0 28px' },
  card: { background: '#141414', border: '1px solid #222', borderRadius: '10px', padding: '20px', marginBottom: '24px' },
  field: { marginBottom: '12px' },
  label: { display: 'block', color: '#aaa', fontSize: '12px', marginBottom: '5px' },
  input: { width: '100%', padding: '11px 12px', background: '#0a0a0a', border: '1px solid #2a2a2a',
    borderRadius: '8px', color: '#fff', fontSize: '13px', outline: 'none',
    boxSizing: 'border-box', minHeight: '44px' },
  btn: { width: '100%', padding: '13px', background: '#4caf50', border: 'none', borderRadius: '8px',
    color: '#fff', fontSize: '14px', fontWeight: '500', cursor: 'pointer', marginTop: '16px',
    minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  success: { background: '#1a2e1a', border: '1px solid #1a5a1a', borderRadius: '8px',
    padding: '12px', color: '#4caf50', fontSize: '13px', marginBottom: '16px', wordBreak: 'break-all' },
  error: { background: '#2e1a1a', border: '1px solid #5a1a1a', borderRadius: '8px',
    padding: '10px 12px', color: '#e05252', fontSize: '13px', marginBottom: '16px' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
  th: { color: '#888', textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #222', fontSize: '11px',
    textTransform: 'uppercase', letterSpacing: '.05em' },
  td: { color: '#ccc', padding: '8px 10px', borderBottom: '1px solid #1a1a1a' },
  badge: (status) => ({
    display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600',
    background: status === 'used' ? '#1a2e1a' : status === 'expired' ? '#2e1a1a' : '#1a1a2e',
    color: status === 'used' ? '#4caf50' : status === 'expired' ? '#e05252' : '#7eb8f7'
  }),
  back: { color: '#4caf50', fontSize: '13px', background: 'none', border: 'none',
    cursor: 'pointer', padding: 0, marginBottom: '20px', display: 'block' },
  copyBtn: { background: '#222', border: '1px solid #333', borderRadius: '6px', color: '#fff',
    fontSize: '12px', cursor: 'pointer', padding: '6px 12px', marginTop: '8px' }
}

export default function AdminInvite({ user, onBack }) {
  const [email, setEmail] = useState('')
  const [localName, setLocalName] = useState('')
  const [expiryDays, setExpiryDays] = useState(7)
  const [saving, setSaving] = useState(false)
  const [inviteLink, setInviteLink] = useState('')
  const [error, setError] = useState('')
  const [invites, setInvites] = useState([])
  const [copied, setCopied] = useState(false)

  useEffect(() => { fetchInvites() }, [])

  if (user?.email !== ADMIN_EMAIL) {
    onBack()
    return null
  }

  const fetchInvites = async () => {
    const { data } = await supabase
      .from('ba_invites')
      .select('*')
      .order('created_at', { ascending: false })
    setInvites(data || [])
  }

  const getStatus = (invite) => {
    if (invite.used) return 'used'
    if (new Date(invite.expires_at) < new Date()) return 'expired'
    return 'pending'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) { setError('Email is required.'); return }
    setSaving(true)
    setError('')
    setInviteLink('')

    const token = crypto.randomUUID()
    const expires_at = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString()

    const { error: insertErr } = await supabase
      .from('ba_invites')
      .insert({ token, email, local_name: localName || null, expires_at })

    setSaving(false)
    if (insertErr) { setError(insertErr.message); return }

    const link = `${window.location.origin}?token=${token}`
    setInviteLink(link)
    setEmail('')
    setLocalName('')
    setCopied(false)
    fetchInvites()
  }

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink)
    setCopied(true)
  }

  return (
    <div style={s.page}>
      <div style={s.wrap}>
        <button style={s.back} onClick={onBack}>&larr; Back to dashboard</button>
        <h1 style={s.title}>BA Invite Management</h1>
        <p style={s.sub}>Generate invite links for Business Agents.</p>

        <div style={s.card}>
          <form onSubmit={handleSubmit}>
            <div style={s.field}>
              <label style={s.label}>BA email address *</label>
              <input style={s.input} type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="ba@union.org" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '12px' }}>
              <div style={s.field}>
                <label style={s.label}>Local name (optional)</label>
                <input style={s.input} value={localName} onChange={e => setLocalName(e.target.value)}
                  placeholder="UA Local 57" />
              </div>
              <div style={s.field}>
                <label style={s.label}>Expires in (days)</label>
                <input style={s.input} type="number" min="1" max="90" value={expiryDays}
                  onChange={e => setExpiryDays(Number(e.target.value))} />
              </div>
            </div>

            {error && <div style={s.error}>{error}</div>}

            {inviteLink && (
              <div style={s.success}>
                <div style={{ marginBottom: '6px', fontWeight: '600' }}>Invite link created:</div>
                <div>{inviteLink}</div>
                <button type="button" style={s.copyBtn} onClick={copyLink}>
                  {copied ? 'Copied!' : 'Copy to clipboard'}
                </button>
              </div>
            )}

            <button type="submit" disabled={saving} style={s.btn}>
              {saving ? <><Spinner /> Creating...</> : 'Generate Invite Link'}
            </button>
          </form>
        </div>

        <h2 style={{ color: '#fff', fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
          All Invites
        </h2>
        <div style={s.card}>
          {invites.length === 0 ? (
            <div style={{ color: '#555', fontSize: '13px', textAlign: 'center', padding: '20px' }}>
              No invites yet.
            </div>
          ) : (
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Email</th>
                  <th style={s.th}>Local</th>
                  <th style={s.th}>Status</th>
                  <th style={s.th}>Created</th>
                </tr>
              </thead>
              <tbody>
                {invites.map(inv => {
                  const status = getStatus(inv)
                  return (
                    <tr key={inv.id}>
                      <td style={s.td}>{inv.email}</td>
                      <td style={s.td}>{inv.local_name || '\u2014'}</td>
                      <td style={s.td}><span style={s.badge(status)}>{status}</span></td>
                      <td style={s.td}>{new Date(inv.created_at).toLocaleDateString()}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
