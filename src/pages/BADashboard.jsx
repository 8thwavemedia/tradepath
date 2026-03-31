import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Spinner from '../components/Spinner'
import CertSelect from '../components/CertSelect'
import useIsMobile from '../hooks/useIsMobile'

const STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY'
]
const TRADES = [
  'Pipefitter', 'Plumber', 'Steamfitter', 'Electrician', 'Ironworker',
  'Boilermaker', 'Carpenter', 'Operating Engineer', 'Laborer',
  'Sheet Metal Worker', 'Welder', 'Millwright', 'Insulator', 'Other'
]
const SCHEDULES = ['4/10s', '5/8s', '5/10s', '6/10s', '7/12s']
const SCHED_HOURS = {
  '4/10s': [40, 0, 4], '5/8s': [40, 0, 5], '5/10s': [40, 10, 5],
  '6/10s': [40, 20, 6], '7/12s': [40, 44, 7]
}

const s = {
  page: { minHeight: '100vh', background: '#0a0a0a',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  nav: { background: '#141414', borderBottom: '1px solid #222', padding: '0 24px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '56px' },
  navLeft: { display: 'flex', alignItems: 'center', gap: '24px' },
  logo: { color: '#fff', fontSize: '17px', fontWeight: '600', margin: 0 },
  badge: { background: '#1a2040', color: '#7eb8f7', fontSize: '10px', padding: '2px 8px', borderRadius: '4px' },
  tabs: { display: 'flex', gap: '4px' },
  tab: (active) => ({
    padding: '6px 14px', border: 'none', borderRadius: '6px', cursor: 'pointer',
    fontSize: '13px', fontWeight: '500', background: active ? '#222' : 'transparent',
    color: active ? '#fff' : '#666', transition: 'all 0.15s', minHeight: '36px'
  }),
  signOut: { padding: '5px 12px', background: 'transparent', border: '1px solid #2a2a2a',
    borderRadius: '6px', color: '#666', fontSize: '12px', cursor: 'pointer' },
  wrap: { padding: '32px 20px', maxWidth: '960px', margin: '0 auto' },
  title: { color: '#fff', fontSize: '20px', fontWeight: '600', margin: '0 0 4px' },
  sub: { color: '#666', fontSize: '13px', margin: '0 0 24px' },
  // Metrics
  metricGrid: { display: 'grid', gap: '12px', marginBottom: '28px' },
  metricCard: { background: '#141414', border: '1px solid #222', borderRadius: '10px', padding: '18px' },
  metricVal: { color: '#4caf50', fontSize: '28px', fontWeight: '700', marginBottom: '4px' },
  metricLabel: { color: '#666', fontSize: '12px' },
  // Form
  card: { background: '#141414', border: '1px solid #222', borderRadius: '10px', padding: '20px' },
  secLabel: { fontSize: '10px', fontWeight: '700', color: '#555', letterSpacing: '.1em',
    textTransform: 'uppercase', marginBottom: '14px', paddingBottom: '6px', borderBottom: '1px solid #1a1a1a' },
  row: { display: 'grid', gap: '12px', marginBottom: '12px' },
  field: { marginBottom: '12px' },
  label: { display: 'block', color: '#aaa', fontSize: '12px', marginBottom: '5px' },
  input: { width: '100%', padding: '11px 12px', background: '#0a0a0a', border: '1px solid #2a2a2a',
    borderRadius: '8px', color: '#fff', fontSize: '13px', outline: 'none',
    boxSizing: 'border-box', minHeight: '44px' },
  select: { width: '100%', padding: '11px 12px', background: '#0a0a0a', border: '1px solid #2a2a2a',
    borderRadius: '8px', color: '#fff', fontSize: '13px', outline: 'none',
    boxSizing: 'border-box', cursor: 'pointer', minHeight: '44px' },
  textarea: { width: '100%', padding: '11px 12px', background: '#0a0a0a', border: '1px solid #2a2a2a',
    borderRadius: '8px', color: '#fff', fontSize: '13px', outline: 'none',
    boxSizing: 'border-box', minHeight: '80px', resize: 'vertical' },
  schedBtns: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  schedBtn: (active) => ({
    padding: '6px 12px', border: '1px solid', borderColor: active ? '#4caf50' : '#2a2a2a',
    borderRadius: '6px', cursor: 'pointer', fontSize: '12px',
    background: active ? '#1a2e1a' : '#0a0a0a', color: active ? '#4caf50' : '#888', minHeight: '36px'
  }),
  checkRow: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px',
    color: '#aaa', fontSize: '12px', cursor: 'pointer' },
  btn: { width: '100%', padding: '13px', background: '#4caf50', border: 'none', borderRadius: '8px',
    color: '#fff', fontSize: '14px', fontWeight: '500', cursor: 'pointer', marginTop: '16px',
    minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  error: { background: '#2e1a1a', border: '1px solid #5a1a1a', borderRadius: '8px',
    padding: '10px 12px', color: '#e05252', fontSize: '13px', marginBottom: '16px' },
  success: { background: '#1a2e1a', border: '1px solid #1a5a1a', borderRadius: '8px',
    padding: '10px 12px', color: '#4caf50', fontSize: '13px', marginBottom: '16px' },
  // Postings list
  postingCard: { background: '#141414', border: '1px solid #222', borderRadius: '10px',
    padding: '16px 20px', marginBottom: '10px' },
  postingTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' },
  postingName: { color: '#fff', fontSize: '14px', fontWeight: '600' },
  postingLocation: { color: '#666', fontSize: '12px', marginTop: '2px' },
  postingMeta: { display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '6px' },
  postingTag: { color: '#555', fontSize: '11px' },
  statusBadge: (status) => ({
    fontSize: '10px', fontWeight: '600', padding: '2px 8px', borderRadius: '4px',
    background: status === 'active' ? '#1a2e1a' : '#2e2a1a',
    color: status === 'active' ? '#4caf50' : '#f0b429'
  }),
  postingActions: { display: 'flex', gap: '8px', marginTop: '10px' },
  actionBtn: { padding: '6px 14px', background: 'transparent', border: '1px solid #2a2a2a',
    borderRadius: '6px', color: '#888', fontSize: '11px', cursor: 'pointer', minHeight: '32px' },
  empty: { textAlign: 'center', padding: '40px 20px', color: '#555', fontSize: '13px' }
}

const BLANK_JOB = {
  project_name: '', contractor: '', city: '', state: '', trade: '',
  wage: '', ot_rate: '', per_diem: '', schedule: '5/10s',
  start_date: '', end_date: '', crew_size: '',
  certifications_required: [], drug_test: false, background_check: false,
  twic_required: false, union_portal_only: true, notes: ''
}

export default function BADashboard({ user, baUser, local }) {
  const mobile = useIsMobile()
  const [tab, setTab] = useState('overview')
  const [postings, setPostings] = useState([])
  const [dispatches, setDispatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ ...BLANK_JOB, trade: local?.trade || '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const [{ data: posts }, { data: disps }] = await Promise.all([
      supabase.from('ba_job_postings').select('*').eq('local_id', local.id).order('created_at', { ascending: false }),
      supabase.from('dispatch_records').select('*').eq('local_id', local.id)
    ])
    setPostings(posts || [])
    setDispatches(disps || [])
    setLoading(false)
  }

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setSuccess('') }

  const handleSchedule = (sched) => {
    const [reg, ot, days] = SCHED_HOURS[sched] || [40, 10, 5]
    setForm(f => ({ ...f, schedule: sched, hours_regular: reg, hours_ot: ot, days_per_week: days }))
  }

  const handlePost = async () => {
    if (!form.project_name || !form.contractor || !form.city || !form.state || !form.trade || !form.wage || !form.schedule) {
      setError('Fill all required fields: project, contractor, location, trade, wage, schedule.')
      return
    }
    setSaving(true); setError(''); setSuccess('')

    const [reg, ot, days] = SCHED_HOURS[form.schedule] || [40, 10, 5]

    const { error: err } = await supabase.from('ba_job_postings').insert({
      posted_by: user.id,
      local_id: local.id,
      project_name: form.project_name.trim(),
      contractor: form.contractor.trim(),
      city: form.city.trim(),
      state: form.state,
      trade: form.trade,
      wage: parseFloat(form.wage),
      ot_rate: parseFloat(form.ot_rate) || parseFloat(form.wage) * 1.5,
      per_diem: parseFloat(form.per_diem) || 0,
      schedule: form.schedule,
      hours_regular: reg,
      hours_ot: ot,
      days_per_week: days,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      crew_size: parseInt(form.crew_size) || null,
      certifications_required: form.certifications_required,
      drug_test: form.drug_test,
      background_check: form.background_check,
      twic_required: form.twic_required,
      union_portal_only: form.union_portal_only,
      notes: form.notes.trim()
    })

    setSaving(false)
    if (err) { setError(err.message); return }
    setSuccess('Job posted successfully!')
    setForm({ ...BLANK_JOB, trade: local?.trade || '' })
    loadData()
  }

  const handleExpire = async (id) => {
    await supabase.from('ba_job_postings').update({ posting_status: 'expired' }).eq('id', id)
    loadData()
  }

  const handleSignOut = async () => { await supabase.auth.signOut() }

  const activePosts = postings.filter(p => p.posting_status === 'active')
  const thisMonth = dispatches.filter(d => {
    const dt = new Date(d.created_at)
    const now = new Date()
    return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear()
  })
  const responded = thisMonth.filter(d => d.response)
  const fillRate = thisMonth.length > 0 ? Math.round((responded.filter(d => d.response === 'accepted').length / thisMonth.length) * 100) : 0

  const BA_TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'post', label: 'Post a Job' },
    { id: 'postings', label: 'Active Postings' }
  ]

  return (
    <div style={s.page}>
      {/* Nav */}
      <div style={{ ...s.nav, padding: mobile ? '0 16px' : '0 24px' }}>
        <div style={s.navLeft}>
          <h1 style={s.logo}>TradePath <span style={s.badge}>BA</span></h1>
          {!mobile && (
            <div style={s.tabs}>
              {BA_TABS.map(t => (
                <button key={t.id} style={s.tab(tab === t.id)} onClick={() => setTab(t.id)}>{t.label}</button>
              ))}
            </div>
          )}
        </div>
        <button style={s.signOut} onClick={handleSignOut}>Sign out</button>
      </div>

      {/* Mobile tabs */}
      {mobile && (
        <div style={{ display: 'flex', padding: '8px 16px', gap: '4px', background: '#0d0d0d', borderBottom: '1px solid #1a1a1a' }}>
          {BA_TABS.map(t => (
            <button key={t.id} style={{ ...s.tab(tab === t.id), flex: 1, textAlign: 'center', fontSize: '12px' }}
              onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </div>
      )}

      <div style={s.wrap}>
        {/* Overview */}
        {tab === 'overview' && (
          <>
            <h2 style={s.title}>{local?.union_name}</h2>
            <p style={s.sub}>{baUser?.full_name} &middot; {baUser?.title} &middot; {local?.trade}</p>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}><Spinner size="lg" /></div>
            ) : (
              <div style={{ ...s.metricGrid, gridTemplateColumns: mobile ? '1fr 1fr' : '1fr 1fr 1fr 1fr' }}>
                {[
                  { val: activePosts.length, label: 'Active postings' },
                  { val: local?.member_count || 0, label: 'Members on OOW list' },
                  { val: thisMonth.length, label: 'Dispatches this month' },
                  { val: `${fillRate}%`, label: 'Fill rate' },
                ].map(m => (
                  <div key={m.label} style={s.metricCard}>
                    <div style={s.metricVal}>{m.val}</div>
                    <div style={s.metricLabel}>{m.label}</div>
                  </div>
                ))}
              </div>
            )}

            {activePosts.length > 0 && (
              <>
                <div style={s.secLabel}>Recent active postings</div>
                {activePosts.slice(0, 3).map(p => (
                  <div key={p.id} style={s.postingCard}>
                    <div style={s.postingName}>{p.project_name}</div>
                    <div style={s.postingLocation}>{p.city}, {p.state} &middot; {p.contractor}</div>
                  </div>
                ))}
              </>
            )}
          </>
        )}

        {/* Post a Job */}
        {tab === 'post' && (
          <>
            <h2 style={s.title}>Post a Job</h2>
            <p style={s.sub}>Postings are visible to all TradePath users or union members only.</p>

            {error && <div style={s.error}>{error}</div>}
            {success && <div style={s.success}>{success}</div>}

            <div style={s.card}>
              <div style={s.secLabel}>Job details</div>

              <div style={{ ...s.row, gridTemplateColumns: mobile ? '1fr' : '1fr 1fr' }}>
                <div style={s.field}>
                  <label style={s.label}>Project name *</label>
                  <input style={s.input} value={form.project_name} onChange={e => set('project_name', e.target.value)}
                    placeholder="Palisades Data Center" />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Contractor *</label>
                  <input style={s.input} value={form.contractor} onChange={e => set('contractor', e.target.value)}
                    placeholder="Rosendin Electric" />
                </div>
              </div>

              <div style={{ ...s.row, gridTemplateColumns: mobile ? '1fr' : '1fr 1fr 1fr' }}>
                <div style={s.field}>
                  <label style={s.label}>City *</label>
                  <input style={s.input} value={form.city} onChange={e => set('city', e.target.value)} />
                </div>
                <div style={s.field}>
                  <label style={s.label}>State *</label>
                  <select style={s.select} value={form.state} onChange={e => set('state', e.target.value)}>
                    <option value="">Select</option>
                    {STATES.map(st => <option key={st} value={st}>{st}</option>)}
                  </select>
                </div>
                <div style={s.field}>
                  <label style={s.label}>Trade *</label>
                  <select style={s.select} value={form.trade} onChange={e => set('trade', e.target.value)}>
                    <option value="">Select</option>
                    {TRADES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div style={s.secLabel}>Compensation</div>

              <div style={{ ...s.row, gridTemplateColumns: mobile ? '1fr' : '1fr 1fr 1fr' }}>
                <div style={s.field}>
                  <label style={s.label}>Base wage ($/hr) *</label>
                  <input style={s.input} type="number" value={form.wage} onChange={e => set('wage', e.target.value)}
                    placeholder="42.55" min="0" step="0.01" />
                </div>
                <div style={s.field}>
                  <label style={s.label}>OT rate (auto 1.5x)</label>
                  <input style={s.input} type="number" value={form.ot_rate} onChange={e => set('ot_rate', e.target.value)}
                    placeholder={form.wage ? (parseFloat(form.wage) * 1.5).toFixed(2) : '63.83'} min="0" step="0.01" />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Per diem ($/day)</label>
                  <input style={s.input} type="number" value={form.per_diem} onChange={e => set('per_diem', e.target.value)}
                    placeholder="0" min="0" />
                </div>
              </div>

              <div style={s.field}>
                <label style={s.label}>Schedule *</label>
                <div style={s.schedBtns}>
                  {SCHEDULES.map(sc => (
                    <button key={sc} style={s.schedBtn(form.schedule === sc)}
                      onClick={() => handleSchedule(sc)}>{sc}</button>
                  ))}
                </div>
              </div>

              <div style={s.secLabel}>Duration &amp; crew</div>

              <div style={{ ...s.row, gridTemplateColumns: mobile ? '1fr' : '1fr 1fr 1fr' }}>
                <div style={s.field}>
                  <label style={s.label}>Start date</label>
                  <input style={s.input} type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} />
                </div>
                <div style={s.field}>
                  <label style={s.label}>End date</label>
                  <input style={s.input} type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)} />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Crew size needed</label>
                  <input style={s.input} type="number" value={form.crew_size} onChange={e => set('crew_size', e.target.value)}
                    placeholder="10" min="1" />
                </div>
              </div>

              <div style={s.secLabel}>Requirements</div>

              <div style={s.field}>
                <label style={s.label}>Certifications required</label>
                <CertSelect value={form.certifications_required} onChange={v => set('certifications_required', v)} />
              </div>

              <label style={s.checkRow} onClick={() => set('drug_test', !form.drug_test)}>
                <input type="checkbox" checked={form.drug_test} readOnly /> Drug test required
              </label>
              <label style={s.checkRow} onClick={() => set('background_check', !form.background_check)}>
                <input type="checkbox" checked={form.background_check} readOnly /> Background check required
              </label>
              <label style={s.checkRow} onClick={() => set('twic_required', !form.twic_required)}>
                <input type="checkbox" checked={form.twic_required} readOnly /> TWIC card required
              </label>
              <label style={s.checkRow} onClick={() => set('union_portal_only', !form.union_portal_only)}>
                <input type="checkbox" checked={form.union_portal_only} readOnly /> Union members only (not public)
              </label>

              <div style={s.field}>
                <label style={s.label}>Notes</label>
                <textarea style={s.textarea} value={form.notes} onChange={e => set('notes', e.target.value)}
                  placeholder="Additional details, directions, PPE requirements..." />
              </div>
            </div>

            <button style={s.btn} onClick={handlePost} disabled={saving}>
              {saving ? <><Spinner /> Posting...</> : 'Post Job'}
            </button>
          </>
        )}

        {/* Active Postings */}
        {tab === 'postings' && (
          <>
            <h2 style={s.title}>Active Postings</h2>
            <p style={s.sub}>{activePosts.length} active &middot; {postings.length - activePosts.length} expired</p>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}><Spinner size="lg" /></div>
            ) : postings.length === 0 ? (
              <div style={s.empty}>
                No postings yet. <button style={{ background: 'none', border: 'none', color: '#4caf50', cursor: 'pointer', fontSize: '13px' }}
                  onClick={() => setTab('post')}>Post your first job</button>
              </div>
            ) : (
              postings.map(p => (
                <div key={p.id} style={s.postingCard}>
                  <div style={s.postingTop}>
                    <div>
                      <div style={s.postingName}>{p.project_name}</div>
                      <div style={s.postingLocation}>
                        {p.city}, {p.state} &middot; {p.contractor} &middot; {p.trade}
                      </div>
                    </div>
                    <span style={s.statusBadge(p.posting_status)}>{p.posting_status}</span>
                  </div>
                  <div style={s.postingMeta}>
                    <span style={s.postingTag}>${p.wage}/hr</span>
                    <span style={s.postingTag}>{p.schedule}</span>
                    {p.per_diem > 0 && <span style={s.postingTag}>${p.per_diem}/day per diem</span>}
                    {p.crew_size && <span style={s.postingTag}>{p.crew_size} crew</span>}
                    {p.drug_test && <span style={s.postingTag}>Drug test</span>}
                    {p.twic_required && <span style={s.postingTag}>TWIC</span>}
                  </div>
                  {p.posting_status === 'active' && (
                    <div style={s.postingActions}>
                      <button style={s.actionBtn} onClick={() => handleExpire(p.id)}>Mark expired</button>
                    </div>
                  )}
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  )
}
