import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import CertSelect from '../components/CertSelect'

// ── Pay calculation (mirrors PayCalculator logic) ──────────────────────────
const STATE_TAX_RATES = {
  AL: 0.05, AK: 0.00, AZ: 0.025, AR: 0.047, CA: 0.093, CO: 0.044,
  CT: 0.065, DE: 0.066, FL: 0.00, GA: 0.055, HI: 0.079, ID: 0.058,
  IL: 0.0495, IN: 0.0305, IA: 0.06, KS: 0.057, KY: 0.045, LA: 0.0425,
  ME: 0.075, MD: 0.0575, MA: 0.05, MI: 0.0425, MN: 0.0985, MS: 0.047,
  MO: 0.048, MT: 0.065, NE: 0.0664, NV: 0.00, NH: 0.00, NJ: 0.0637,
  NM: 0.059, NY: 0.0685, NC: 0.0475, ND: 0.025, OH: 0.04, OK: 0.0475,
  OR: 0.099, PA: 0.0307, RI: 0.0599, SC: 0.07, SD: 0.00, TN: 0.00,
  TX: 0.00, UT: 0.0485, VT: 0.0875, VA: 0.0575, WA: 0.00, WV: 0.065,
  WI: 0.0765, WY: 0.00
}
const STATES = Object.keys(STATE_TAX_RATES).sort()
const FEDERAL_RATE = 0.12
const FICA_SS = 0.062
const FICA_MED = 0.0145
const UNION_DUES_WEEKLY = 97

function calcNet({ wage, ot_rate, per_diem, days_worked, schedule, homeState }) {
  const w = parseFloat(wage) || 0
  const ot = parseFloat(ot_rate) || w * 1.5
  const pd = parseFloat(per_diem) || 0
  const days = parseInt(days_worked) || 5

  const schedHours = {
    '4/10s': [40, 0], '5/8s': [40, 0], '5/10s': [40, 10],
    '6/10s': [40, 20], '7/12s': [40, 44]
  }
  const [reg, overtime] = schedHours[schedule] || [40, 10]

  const gross = (w * reg) + (ot * overtime)
  const stateTax = STATE_TAX_RATES[homeState] || 0
  const deductions = gross * (FEDERAL_RATE + stateTax + FICA_SS + FICA_MED) + UNION_DUES_WEEKLY
  return (gross - deductions) + (pd * days)
}

const fmt = (n) => '$' + Math.round(n).toLocaleString()
const fmtDelta = (n) => (n >= 0 ? '+' : '-') + '$' + Math.abs(Math.round(n)).toLocaleString()

// ── Job scoring algorithm ────────────────────────────────────────────────
const OT_SCHEDULES = new Set(['5/10s', '6/10s', '7/12s'])

function parseCerts(raw) {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  try { return JSON.parse(raw) } catch { return raw.split(',').map(s => s.trim()).filter(Boolean) }
}

function scoreJob(job, profile, netWeekly, maxNet) {
  const breakdown = {}

  // 1. Weekly net take-home (35 pts) — normalized against highest payer
  const payPts = maxNet > 0 ? (netWeekly / maxNet) * 35 : 35
  breakdown.pay = { pts: Math.round(payPts * 10) / 10, max: 35, label: 'Weekly net pay' }

  // 2. Per diem match (20 pts)
  const minPd = parseFloat(profile?.min_per_diem) || 0
  const jobPd = parseFloat(job.per_diem) || 0
  let pdPts
  if (minPd > 0) {
    pdPts = Math.min((jobPd / minPd) * 20, 20)
  } else {
    pdPts = jobPd > 0 ? 20 : 10
  }
  breakdown.perDiem = { pts: Math.round(pdPts * 10) / 10, max: 20, label: 'Per diem' }

  // 3. Schedule match (15 pts)
  const prefSched = profile?.preferred_schedule
  let schedPts
  if (!prefSched) {
    schedPts = 15
  } else if (job.schedule === prefSched) {
    schedPts = 15
  } else if (OT_SCHEDULES.has(job.schedule) && OT_SCHEDULES.has(prefSched)) {
    schedPts = 8
  } else {
    schedPts = 0
  }
  breakdown.schedule = { pts: schedPts, max: 15, label: 'Schedule match' }

  // 4. Certification match (15 pts)
  const jobCerts = parseCerts(job.certifications_required)
  const userCerts = new Set(profile?.certifications || [])
  let certPts, missingCerts = []
  if (jobCerts.length === 0) {
    certPts = 15
  } else {
    const held = jobCerts.filter(c => userCerts.has(c))
    missingCerts = jobCerts.filter(c => !userCerts.has(c))
    certPts = (held.length / jobCerts.length) * 15
  }
  breakdown.certs = { pts: Math.round(certPts * 10) / 10, max: 15, label: 'Certifications', missing: missingCerts }

  // 5. Duration (10 pts)
  let durPts
  if (job.start_date && job.end_date) {
    const weeks = Math.round((new Date(job.end_date) - new Date(job.start_date)) / (7 * 86400000))
    if (weeks >= 26) durPts = 10
    else if (weeks >= 12) durPts = 7
    else if (weeks >= 4) durPts = 4
    else durPts = 2
    breakdown.duration = { pts: durPts, max: 10, label: `Duration (${weeks} wks)` }
  } else {
    durPts = 10
    breakdown.duration = { pts: 10, max: 10, label: 'Duration (open-ended)' }
  }

  // 6. Clean requirements (5 pts)
  let cleanPts = 5
  const flags = []
  if (job.drug_test && profile?.drug_test_concern) { cleanPts -= 2; flags.push('Drug test') }
  if (job.background_check && profile?.bg_check_concern) { cleanPts -= 2; flags.push('BG check') }
  breakdown.clean = { pts: Math.max(cleanPts, 0), max: 5, label: 'Requirements', flags }

  const total = Math.round(
    breakdown.pay.pts + breakdown.perDiem.pts + breakdown.schedule.pts +
    breakdown.certs.pts + breakdown.duration.pts + breakdown.clean.pts
  )

  return { total, breakdown }
}

// ── Schedule presets ───────────────────────────────────────────────────────
const SCHED_DAYS = {
  '4/10s': '4', '5/8s': '5', '5/10s': '5', '6/10s': '6', '7/12s': '7'
}

const OT_MULTIPLIERS = [1.5, 1.75, 2.0]

// ── Styles ─────────────────────────────────────────────────────────────────
const s = {
  page: {
    minHeight: '100vh', background: '#0a0a0a',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    padding: '32px 20px'
  },
  wrap: { maxWidth: '900px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
  title: { color: '#fff', fontSize: '20px', fontWeight: '600', margin: '0 0 4px' },
  sub: { color: '#666', fontSize: '13px', margin: 0 },
  addBtn: {
    padding: '8px 18px', background: '#1a2e1a', border: '1px solid #2a4a2a',
    borderRadius: '8px', color: '#4caf50', fontSize: '13px', fontWeight: '500',
    cursor: 'pointer', whiteSpace: 'nowrap'
  },
  empty: { color: '#555', fontSize: '13px', textAlign: 'center', padding: '60px 0' },
  // Job cards
  cardList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  card: {
    background: '#141414', border: '1px solid #222', borderRadius: '10px',
    padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px'
  },
  rank: {
    color: '#555', fontSize: '22px', fontWeight: '700', minWidth: '28px',
    textAlign: 'center', flexShrink: 0
  },
  cardBody: { flex: 1, minWidth: 0 },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' },
  cardProject: { color: '#fff', fontSize: '14px', fontWeight: '600' },
  cardLocation: { color: '#666', fontSize: '12px', marginTop: '2px' },
  cardPay: { textAlign: 'right', flexShrink: 0 },
  cardNet: { color: '#4caf50', fontSize: '18px', fontWeight: '600' },
  cardMonthly: { color: '#666', fontSize: '11px', marginTop: '2px' },
  cardDelta: (positive) => ({
    fontSize: '12px', fontWeight: '600', marginTop: '4px',
    color: positive ? '#4caf50' : '#e05252'
  }),
  cardMeta: { display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '4px' },
  tag: { color: '#555', fontSize: '11px' },
  arrows: { display: 'flex', flexDirection: 'column', gap: '2px', flexShrink: 0 },
  arrowBtn: {
    background: 'transparent', border: '1px solid #2a2a2a', borderRadius: '4px',
    color: '#666', fontSize: '11px', cursor: 'pointer', padding: '2px 6px', lineHeight: 1
  },
  deleteBtn: {
    background: 'transparent', border: 'none', color: '#444', fontSize: '14px',
    cursor: 'pointer', padding: '4px', flexShrink: 0
  },
  // Modal / form
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
  },
  modal: {
    background: '#141414', border: '1px solid #222', borderRadius: '12px',
    padding: '24px', width: '480px', maxHeight: '85vh', overflowY: 'auto'
  },
  modalTitle: { color: '#fff', fontSize: '16px', fontWeight: '600', marginBottom: '20px' },
  field: { marginBottom: '12px' },
  label: { display: 'block', color: '#aaa', fontSize: '12px', marginBottom: '5px' },
  input: {
    width: '100%', padding: '9px 12px', background: '#0a0a0a',
    border: '1px solid #2a2a2a', borderRadius: '8px', color: '#fff',
    fontSize: '13px', outline: 'none', boxSizing: 'border-box'
  },
  select: {
    width: '100%', padding: '9px 12px', background: '#0a0a0a',
    border: '1px solid #2a2a2a', borderRadius: '8px', color: '#fff',
    fontSize: '13px', outline: 'none', boxSizing: 'border-box', cursor: 'pointer'
  },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  row3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' },
  schedBtns: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  schedBtn: (active) => ({
    padding: '6px 12px', border: '1px solid',
    borderColor: active ? '#4caf50' : '#2a2a2a',
    borderRadius: '6px', cursor: 'pointer', fontSize: '12px',
    background: active ? '#1a2e1a' : '#0a0a0a',
    color: active ? '#4caf50' : '#888'
  }),
  checkRow: {
    display: 'flex', alignItems: 'center', gap: '8px',
    marginBottom: '8px', color: '#aaa', fontSize: '12px', cursor: 'pointer'
  },
  modalActions: { display: 'flex', gap: '10px', marginTop: '20px' },
  saveBtn: {
    flex: 1, padding: '10px', background: '#1a2e1a', border: '1px solid #2a4a2a',
    borderRadius: '8px', color: '#4caf50', fontSize: '13px', fontWeight: '500', cursor: 'pointer'
  },
  cancelBtn: {
    flex: 1, padding: '10px', background: 'transparent', border: '1px solid #333',
    borderRadius: '8px', color: '#888', fontSize: '13px', cursor: 'pointer'
  },
  error: { color: '#e05252', fontSize: '12px', marginTop: '8px' },
  // Score
  scoreBadge: (score) => ({
    display: 'inline-flex', alignItems: 'center', gap: '3px',
    padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600',
    marginLeft: '8px', flexShrink: 0,
    background: score >= 80 ? '#1a2e1a' : score >= 60 ? '#2e2a1a' : '#2e1a1a',
    color: score >= 80 ? '#4caf50' : score >= 60 ? '#f0b429' : '#e05252'
  }),
  sortBar: {
    display: 'flex', gap: '6px', marginBottom: '14px', alignItems: 'center'
  },
  sortBtn: (active) => ({
    padding: '5px 12px', border: '1px solid',
    borderColor: active ? '#4caf50' : '#2a2a2a',
    borderRadius: '6px', cursor: 'pointer', fontSize: '11px',
    background: active ? '#1a2e1a' : 'transparent',
    color: active ? '#4caf50' : '#666'
  }),
  sortLabel: { color: '#555', fontSize: '11px' },
  breakdownToggle: {
    background: 'none', border: 'none', color: '#555', fontSize: '11px',
    cursor: 'pointer', padding: '4px 0', marginTop: '4px'
  },
  breakdownWrap: {
    marginTop: '8px', padding: '10px 12px', background: '#0d0d0d',
    borderRadius: '8px', border: '1px solid #1a1a1a'
  },
  breakdownRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '3px 0', fontSize: '11px'
  },
  breakdownLabel: { color: '#777' },
  breakdownPts: (pct) => ({
    fontWeight: '600',
    color: pct >= 0.8 ? '#4caf50' : pct >= 0.5 ? '#f0b429' : '#e05252'
  }),
  breakdownBar: { width: '60px', height: '4px', background: '#222', borderRadius: '2px', margin: '0 8px', flexShrink: 0 },
  breakdownFill: (pct, color) => ({
    width: `${pct * 100}%`, height: '100%', borderRadius: '2px',
    background: color >= 0.8 ? '#4caf50' : color >= 0.5 ? '#f0b429' : '#e05252'
  }),
  missingCert: {
    display: 'inline-block', padding: '2px 6px', background: '#2e1a1a',
    border: '1px solid #4a2020', borderRadius: '4px', color: '#e05252',
    fontSize: '10px', margin: '2px 3px 2px 0'
  }
}

const BLANK_FORM = {
  project_name: '', contractor: '', city: '', state: 'UT',
  wage: '', ot_rate: '', ot_multiplier: 1.5, per_diem: '', schedule: '5/10s', days_worked: '5',
  start_date: '', end_date: '',
  certs_required: [], drug_test: false, background_check: false
}

export default function JobRankings({ user, profile }) {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ ...BLANK_FORM })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [sortMode, setSortMode] = useState('score')

  const currentNet = profile?.current_job_net_weekly
  const homeState = profile?.home_state || 'UT'

  // ── Load jobs (saved_jobs joined with jobs) ────────────────────────────
  useEffect(() => { loadJobs() }, [])

  const loadJobs = async () => {
    const { data } = await supabase
      .from('saved_jobs')
      .select('id, rank_position, job_id, jobs(*)')
      .eq('user_id', user.id)
      .order('rank_position', { ascending: true })
    setJobs((data || []).map(row => ({ ...row.jobs, saved_id: row.id, job_id: row.job_id, rank_position: row.rank_position })))
    setLoading(false)
  }

  // ── Open form ──────────────────────────────────────────────────────────
  const openAdd = () => {
    setForm({ ...BLANK_FORM, state: homeState })
    setEditingId(null)
    setError('')
    setShowForm(true)
  }

  const openEdit = (job) => {
    const w = parseFloat(job.wage), ot = parseFloat(job.ot_rate)
    let mult = 1.5
    if (w && ot) {
      const ratio = ot / w
      const match = OT_MULTIPLIERS.find(m => Math.abs(ratio - m) < 0.01)
      if (match) mult = match
    }
    // Parse certifications — may be stored as array, comma string, or JSON string
    let certs = job.certifications_required || []
    if (typeof certs === 'string') {
      try { certs = JSON.parse(certs) } catch { certs = certs.split(',').map(s => s.trim()).filter(Boolean) }
    }
    setForm({
      project_name: job.project_name || '',
      contractor: job.contractor || '',
      city: job.city || '',
      state: job.state || 'UT',
      wage: String(job.wage || ''),
      ot_rate: String(job.ot_rate || ''),
      ot_multiplier: mult,
      per_diem: String(job.per_diem || ''),
      schedule: job.schedule || '5/10s',
      days_worked: String(job.days_per_week || '5'),
      start_date: job.start_date || '',
      end_date: job.end_date || '',
      certs_required: certs,
      drug_test: !!job.drug_test,
      background_check: !!job.background_check
    })
    setEditingId(job.job_id)
    setError('')
    setShowForm(true)
  }

  // ── Save job ───────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.project_name.trim()) { setError('Project name is required'); return }
    if (!parseFloat(form.wage)) { setError('Wage is required'); return }

    setSaving(true)
    setError('')

    const schedHoursMap = {
      '4/10s': [40, 0], '5/8s': [40, 0], '5/10s': [40, 10],
      '6/10s': [40, 20], '7/12s': [40, 44]
    }
    const [hoursReg, hoursOt] = schedHoursMap[form.schedule] || [40, 10]

    const jobRow = {
      project_name: form.project_name.trim(),
      contractor: form.contractor.trim(),
      city: form.city.trim(),
      state: form.state,
      wage: parseFloat(form.wage),
      ot_rate: parseFloat(form.ot_rate) || parseFloat(form.wage) * 1.5,
      per_diem: parseFloat(form.per_diem) || 0,
      schedule: form.schedule,
      hours_regular: hoursReg,
      hours_ot: hoursOt,
      days_per_week: parseInt(form.days_worked) || 5,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      certifications_required: form.certs_required,
      drug_test: form.drug_test,
      background_check: form.background_check,
      created_by: user.id
    }

    let err

    if (editingId) {
      // Update existing job row
      ;({ error: err } = await supabase.from('jobs').update(jobRow).eq('id', editingId))
    } else {
      // Step 1: Insert into jobs table
      const { data: newJob, error: jobErr } = await supabase
        .from('jobs')
        .insert(jobRow)
        .select('id')
        .single()

      if (jobErr) { setSaving(false); setError(jobErr.message); return }

      // Step 2: Insert into saved_jobs with just user_id, job_id, rank_position
      ;({ error: err } = await supabase.from('saved_jobs').insert({
        user_id: user.id,
        job_id: newJob.id,
        rank_position: jobs.length + 1
      }))
    }

    setSaving(false)
    if (err) { setError(err.message); return }
    setShowForm(false)
    loadJobs()
  }

  // ── Delete ─────────────────────────────────────────────────────────────
  const handleDelete = async (job) => {
    await supabase.from('saved_jobs').delete().eq('id', job.saved_id)
    await supabase.from('jobs').delete().eq('id', job.job_id)
    loadJobs()
  }

  // ── Reorder ────────────────────────────────────────────────────────────
  const move = async (idx, dir) => {
    const swapIdx = idx + dir
    if (swapIdx < 0 || swapIdx >= jobs.length) return
    const a = jobs[idx], b = jobs[swapIdx]
    await Promise.all([
      supabase.from('saved_jobs').update({ rank_position: b.rank_position }).eq('id', a.saved_id),
      supabase.from('saved_jobs').update({ rank_position: a.rank_position }).eq('id', b.saved_id)
    ])
    loadJobs()
  }

  // ── Form helpers ───────────────────────────────────────────────────────
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const handleSchedule = (sched) => {
    setForm(f => ({ ...f, schedule: sched, days_worked: SCHED_DAYS[sched] || f.days_worked }))
  }
  const handleWageChange = (wage) => {
    setForm(f => {
      const w = parseFloat(wage)
      const autoOt = w ? (w * f.ot_multiplier).toFixed(2) : ''
      return { ...f, wage, ot_rate: autoOt }
    })
  }
  const handleOtMultiplier = (mult) => {
    setForm(f => {
      const w = parseFloat(f.wage)
      const autoOt = w ? (w * mult).toFixed(2) : ''
      return { ...f, ot_multiplier: mult, ot_rate: autoOt }
    })
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div style={s.page}>
      <div style={s.wrap}>
        <div style={s.header}>
          <div>
            <h2 style={s.title}>Job Rankings</h2>
            <p style={s.sub}>
              {currentNet
                ? `Comparing against your current job baseline: ${fmt(currentNet)}/wk`
                : 'Save a current job in Pay Calculator to see comparison deltas'}
            </p>
          </div>
          <button style={s.addBtn} onClick={openAdd}>+ Add Job</button>
        </div>

        {loading ? (
          <div style={s.empty}>Loading...</div>
        ) : jobs.length === 0 ? (
          <div style={s.empty}>
            No jobs yet. Click <strong style={{ color: '#4caf50' }}>+ Add Job</strong> to enter your first opportunity.
          </div>
        ) : (() => {
          // Pre-compute net for all jobs to find max for normalization
          const jobNets = jobs.map(job => calcNet({
            wage: job.wage, ot_rate: job.ot_rate, per_diem: job.per_diem,
            days_worked: job.days_per_week, schedule: job.schedule, homeState
          }))
          const maxNet = Math.max(...jobNets, 1)

          // Build scored list
          const scored = jobs.map((job, i) => ({
            job, netWeekly: jobNets[i],
            ...scoreJob(job, profile, jobNets[i], maxNet)
          }))

          // Sort
          const sorted = sortMode === 'score'
            ? [...scored].sort((a, b) => b.total - a.total)
            : scored // 'manual' keeps DB rank_position order

          return (
            <>
              <div style={s.sortBar}>
                <span style={s.sortLabel}>Sort by:</span>
                <button style={s.sortBtn(sortMode === 'score')} onClick={() => setSortMode('score')}>Score</button>
                <button style={s.sortBtn(sortMode === 'manual')} onClick={() => setSortMode('manual')}>Manual rank</button>
              </div>
              <div style={s.cardList}>
                {sorted.map(({ job, netWeekly, total, breakdown }, idx) => {
                  const netMonthly = netWeekly * 4.33
                  const delta = currentNet != null ? netWeekly - currentNet : null
                  const expanded = expandedId === job.saved_id
                  return (
                    <div key={job.saved_id} style={s.card}>
                      <div style={s.rank}>{idx + 1}</div>

                      <div style={s.cardBody}>
                        <div style={s.cardTop}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <span style={s.cardProject} onClick={() => openEdit(job)} role="button" tabIndex={0}>
                                {job.project_name}
                              </span>
                              <span style={s.scoreBadge(total)}>{total}/100</span>
                            </div>
                            <div style={s.cardLocation}>
                              {[job.city, job.state].filter(Boolean).join(', ')}
                              {job.contractor && <span> &middot; {job.contractor}</span>}
                            </div>
                          </div>
                          <div style={s.cardPay}>
                            <div style={s.cardNet}>{fmt(netWeekly)}/wk</div>
                            <div style={s.cardMonthly}>{fmt(netMonthly)}/mo</div>
                            {delta != null && (
                              <div style={s.cardDelta(delta >= 0)}>
                                {fmtDelta(delta)}/wk vs current
                              </div>
                            )}
                          </div>
                        </div>

                        <div style={s.cardMeta}>
                          <span style={s.tag}>{fmt(job.wage)}/hr</span>
                          <span style={s.tag}>{job.schedule}</span>
                          {job.per_diem > 0 && <span style={s.tag}>${job.per_diem}/day per diem</span>}
                          {job.drug_test && <span style={s.tag}>Drug test</span>}
                          {job.background_check && <span style={s.tag}>BG check</span>}
                          {parseCerts(job.certifications_required).length > 0 && (
                            <span style={s.tag}>{parseCerts(job.certifications_required).join(', ')}</span>
                          )}
                        </div>

                        <button style={s.breakdownToggle}
                          onClick={() => setExpandedId(expanded ? null : job.saved_id)}>
                          {expanded ? 'Hide score breakdown' : 'Show score breakdown'}
                        </button>

                        {expanded && (
                          <div style={s.breakdownWrap}>
                            {Object.values(breakdown).map(({ pts, max, label, missing, flags }) => {
                              const pct = max > 0 ? pts / max : 1
                              return (
                                <div key={label}>
                                  <div style={s.breakdownRow}>
                                    <span style={s.breakdownLabel}>{label}</span>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                      <div style={s.breakdownBar}>
                                        <div style={s.breakdownFill(pct, pct)} />
                                      </div>
                                      <span style={s.breakdownPts(pct)}>{pts}/{max}</span>
                                    </div>
                                  </div>
                                  {missing?.length > 0 && (
                                    <div style={{ padding: '2px 0 4px' }}>
                                      <span style={{ color: '#666', fontSize: '10px' }}>Missing: </span>
                                      {missing.map(c => <span key={c} style={s.missingCert}>{c}</span>)}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>

                      <div style={s.arrows}>
                        <button style={s.arrowBtn} onClick={() => move(jobs.indexOf(job), -1)}
                          disabled={jobs.indexOf(job) === 0} title="Move up">&#9650;</button>
                        <button style={s.arrowBtn} onClick={() => move(jobs.indexOf(job), 1)}
                          disabled={jobs.indexOf(job) === jobs.length - 1} title="Move down">&#9660;</button>
                      </div>

                      <button style={s.deleteBtn} onClick={() => handleDelete(job)} title="Remove">&times;</button>
                    </div>
                  )
                })}
              </div>
            </>
          )
        })()}
      </div>

      {/* ── Add / Edit modal ──────────────────────────────────────────── */}
      {showForm && (
        <div style={s.overlay} onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false) }}>
          <div style={s.modal}>
            <div style={s.modalTitle}>{editingId ? 'Edit Job' : 'Add Job'}</div>

            <div style={s.row2}>
              <div style={s.field}>
                <label style={s.label}>Project name *</label>
                <input style={s.input} value={form.project_name}
                  onChange={e => set('project_name', e.target.value)} placeholder="Palisades Data Center" />
              </div>
              <div style={s.field}>
                <label style={s.label}>Contractor</label>
                <input style={s.input} value={form.contractor}
                  onChange={e => set('contractor', e.target.value)} placeholder="Rosendin Electric" />
              </div>
            </div>

            <div style={s.row3}>
              <div style={s.field}>
                <label style={s.label}>City</label>
                <input style={s.input} value={form.city}
                  onChange={e => set('city', e.target.value)} placeholder="Mesa" />
              </div>
              <div style={s.field}>
                <label style={s.label}>State</label>
                <select style={s.select} value={form.state}
                  onChange={e => set('state', e.target.value)}>
                  {STATES.map(st => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>
              <div style={s.field}>
                <label style={s.label}>Base wage ($/hr) *</label>
                <input style={s.input} type="number" value={form.wage}
                  onChange={e => handleWageChange(e.target.value)} placeholder="42.55" min="0" step="0.01" />
              </div>
            </div>

            <div style={s.row3}>
              <div style={s.field}>
                <label style={s.label}>OT rate ($/hr)</label>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
                  {OT_MULTIPLIERS.map(m => (
                    <button key={m} onClick={() => handleOtMultiplier(m)} style={{
                      padding: '4px 10px', border: '1px solid',
                      borderColor: form.ot_multiplier === m ? '#4caf50' : '#2a2a2a',
                      borderRadius: '5px', cursor: 'pointer', fontSize: '11px',
                      background: form.ot_multiplier === m ? '#1a2e1a' : '#0a0a0a',
                      color: form.ot_multiplier === m ? '#4caf50' : '#888'
                    }}>{m}x</button>
                  ))}
                </div>
                <input style={s.input} type="number" value={form.ot_rate}
                  onChange={e => set('ot_rate', e.target.value)}
                  placeholder={form.wage ? (parseFloat(form.wage) * 1.5).toFixed(2) : '63.83'}
                  min="0" step="0.01" />
              </div>
              <div style={s.field}>
                <label style={s.label}>Per diem ($/day)</label>
                <input style={s.input} type="number" value={form.per_diem}
                  onChange={e => set('per_diem', e.target.value)} placeholder="0" min="0" />
              </div>
              <div style={s.field}>
                <label style={s.label}>Days worked/wk</label>
                <input style={s.input} type="number" value={form.days_worked}
                  onChange={e => set('days_worked', e.target.value)} min="1" max="7" />
              </div>
            </div>

            <div style={s.field}>
              <label style={s.label}>Schedule</label>
              <div style={s.schedBtns}>
                {['4/10s', '5/8s', '5/10s', '6/10s', '7/12s'].map(sc => (
                  <button key={sc} style={s.schedBtn(form.schedule === sc)}
                    onClick={() => handleSchedule(sc)}>{sc}</button>
                ))}
              </div>
            </div>

            <div style={s.row2}>
              <div style={s.field}>
                <label style={s.label}>Start date</label>
                <input style={s.input} type="date" value={form.start_date}
                  onChange={e => set('start_date', e.target.value)} />
              </div>
              <div style={s.field}>
                <label style={s.label}>End date</label>
                <input style={s.input} type="date" value={form.end_date}
                  onChange={e => set('end_date', e.target.value)} />
              </div>
            </div>

            <div style={s.field}>
              <label style={s.label}>Certifications required</label>
              <CertSelect value={form.certs_required} onChange={v => set('certs_required', v)} />
            </div>

            <label style={s.checkRow} onClick={() => set('drug_test', !form.drug_test)}>
              <input type="checkbox" checked={form.drug_test} readOnly /> Drug test required
            </label>
            <label style={s.checkRow} onClick={() => set('background_check', !form.background_check)}>
              <input type="checkbox" checked={form.background_check} readOnly /> Background check required
            </label>

            {/* Preview net */}
            {parseFloat(form.wage) > 0 && (
              <div style={{
                background: '#0a0a0a', border: '1px solid #222', borderRadius: '8px',
                padding: '12px', textAlign: 'center', marginTop: '4px'
              }}>
                <div style={{ color: '#555', fontSize: '11px', marginBottom: '4px' }}>Estimated weekly net</div>
                <div style={{ color: '#4caf50', fontSize: '22px', fontWeight: '600' }}>
                  {fmt(calcNet({
                    wage: form.wage, ot_rate: form.ot_rate, per_diem: form.per_diem,
                    days_worked: form.days_worked, schedule: form.schedule, homeState
                  }))}
                </div>
              </div>
            )}

            {error && <div style={s.error}>{error}</div>}

            <div style={s.modalActions}>
              <button style={s.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
              <button style={s.saveBtn} onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Update Job' : 'Save Job'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
