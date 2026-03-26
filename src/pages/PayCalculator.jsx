import { useState } from 'react'
import { supabase } from '../lib/supabase'

// State income tax rates (2026 - flat or effective estimate for working income)
// Source: Tax Foundation 2026 state income tax data
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

const FEDERAL_RATE = 0.12   // Effective federal rate at journeyman wage levels after standard deduction
const FICA_SS = 0.062       // Social Security
const FICA_MED = 0.0145     // Medicare
const UNION_DUES_WEEKLY = 97  // Average weekly union dues — update per local

const fmt = (n) => '$' + Math.round(n).toLocaleString()

function calculate({ wage, otRate, regHours, otHours, perDiem, daysWorked, homeState }) {
  const w = parseFloat(wage) || 0
  const ot = parseFloat(otRate) || w * 1.5
  const reg = parseInt(regHours) || 40
  const overtime = parseInt(otHours) || 0
  const pd = parseFloat(perDiem) || 0
  const days = parseInt(daysWorked) || 5
  const stateTax = STATE_TAX_RATES[homeState] || 0

  const grossWages = (w * reg) + (ot * overtime)
  const weeklyPerDiem = pd * days

  const fedTax = grossWages * FEDERAL_RATE
  const stateTaxAmt = grossWages * stateTax
  const ss = grossWages * FICA_SS
  const med = grossWages * FICA_MED
  const totalDeductions = fedTax + stateTaxAmt + ss + med + UNION_DUES_WEEKLY

  const netWages = grossWages - totalDeductions
  const netTotal = netWages + weeklyPerDiem

  const monthly = netTotal * 4.33
  const annual = netTotal * 52

  const effectiveDeductRate = grossWages > 0 ? (totalDeductions / grossWages * 100) : 0

  return {
    grossWages,
    weeklyPerDiem,
    grossTotal: grossWages + weeklyPerDiem,
    fedTax,
    stateTaxAmt,
    ss,
    med,
    unionDues: UNION_DUES_WEEKLY,
    totalDeductions,
    netWages,
    netTotal,
    monthly,
    annual,
    effectiveDeductRate
  }
}

const s = {
  page: {
    minHeight: '100vh',
    background: '#0a0a0a',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    padding: '32px 20px'
  },
  wrap: { maxWidth: '800px', margin: '0 auto' },
  title: { color: '#fff', fontSize: '20px', fontWeight: '600', margin: '0 0 4px' },
  sub: { color: '#666', fontSize: '13px', margin: '0 0 28px' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' },
  card: { background: '#141414', border: '1px solid #222', borderRadius: '10px', padding: '20px' },
  secLabel: {
    fontSize: '10px', fontWeight: '700', color: '#555',
    letterSpacing: '.1em', textTransform: 'uppercase',
    marginBottom: '14px', paddingBottom: '6px', borderBottom: '1px solid #1a1a1a'
  },
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
  resultRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '7px 0', borderBottom: '1px solid #1a1a1a', fontSize: '13px'
  },
  resultLabel: { color: '#777' },
  resultVal: { color: '#ddd', fontWeight: '500' },
  bigNum: { color: '#4caf50', fontSize: '28px', fontWeight: '600', margin: '12px 0 4px' },
  bigLabel: { color: '#555', fontSize: '12px', marginBottom: '16px' },
  deductRow: {
    display: 'flex', justifyContent: 'space-between',
    padding: '5px 0', fontSize: '12px', borderBottom: '1px solid #161616'
  },
  note: {
    background: '#141414', border: '1px solid #222',
    borderLeft: '3px solid #f0b429', borderRadius: '0 8px 8px 0',
    padding: '10px 14px', color: '#d8c8a0', fontSize: '12px',
    marginTop: '16px', lineHeight: '1.6'
  },
  compareBtn: {
    width: '100%', padding: '11px', background: 'transparent',
    border: '1px solid #333', borderRadius: '8px', color: '#aaa',
    fontSize: '13px', cursor: 'pointer', marginTop: '12px'
  },
  saveBtn: {
    width: '100%', padding: '11px', background: '#1a2e1a',
    border: '1px solid #2a4a2a', borderRadius: '8px', color: '#4caf50',
    fontSize: '13px', fontWeight: '500', cursor: 'pointer', marginTop: '12px',
    transition: 'all 0.15s'
  },
  saveBtnDisabled: {
    width: '100%', padding: '11px', background: '#141414',
    border: '1px solid #222', borderRadius: '8px', color: '#555',
    fontSize: '13px', cursor: 'not-allowed', marginTop: '12px'
  },
  savedBadge: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
    width: '100%', padding: '11px', background: '#141414',
    border: '1px solid #2a4a2a', borderRadius: '8px', color: '#4caf50',
    fontSize: '13px', marginTop: '12px'
  }
}

const SCHED_TO_HOURS = {
  '4/10s': { regHours: '40', otHours: '0', daysWorked: '4' },
  '5/8s':  { regHours: '40', otHours: '0', daysWorked: '5' },
  '5/10s': { regHours: '40', otHours: '10', daysWorked: '5' },
  '6/10s': { regHours: '40', otHours: '20', daysWorked: '6' },
  '7/12s': { regHours: '40', otHours: '44', daysWorked: '7' },
}

const OT_MULTIPLIERS = [1.5, 1.75, 2.0]

function detectMultiplier(wage, otRate) {
  const w = parseFloat(wage), ot = parseFloat(otRate)
  if (!w || !ot) return 1.5
  const ratio = ot / w
  const match = OT_MULTIPLIERS.find(m => Math.abs(ratio - m) < 0.01)
  return match || 1.5
}

function buildInitialForm(profile) {
  const hasSaved = profile?.current_job_wage != null
  if (hasSaved) {
    const sched = profile.current_job_schedule || '5/10s'
    const hours = SCHED_TO_HOURS[sched] || SCHED_TO_HOURS['5/10s']
    const wage = String(profile.current_job_wage)
    const otRate = String(profile.current_job_ot_rate || '')
    return {
      wage,
      otRate,
      otMultiplier: detectMultiplier(wage, otRate),
      regHours: hours.regHours,
      otHours: hours.otHours,
      perDiem: String(profile.current_job_per_diem || '0'),
      daysWorked: hours.daysWorked,
      homeState: profile.current_job_state || profile.home_state || 'UT',
      schedule: sched
    }
  }
  return {
    wage: '',
    otRate: '',
    otMultiplier: 1.5,
    regHours: '40',
    otHours: '10',
    perDiem: '100',
    daysWorked: '5',
    homeState: profile?.home_state || 'UT',
    schedule: '5/10s'
  }
}

export default function PayCalculator({ profile, user, onProfileUpdate }) {
  const hasSavedJob = profile?.current_job_wage != null
  const [form, setForm] = useState(() => buildInitialForm(profile))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setSaved(false) }

  const handleWageChange = (wage) => {
    setForm(f => {
      const w = parseFloat(wage)
      const autoOt = w ? (w * f.otMultiplier).toFixed(2) : ''
      return { ...f, wage, otRate: autoOt }
    })
    setSaved(false)
  }

  const handleOtMultiplier = (mult) => {
    setForm(f => {
      const w = parseFloat(f.wage)
      const autoOt = w ? (w * mult).toFixed(2) : ''
      return { ...f, otMultiplier: mult, otRate: autoOt }
    })
    setSaved(false)
  }

  const handleSchedule = (schedule) => {
    const vals = SCHED_TO_HOURS[schedule] || {}
    setForm(f => ({ ...f, schedule, ...vals }))
    setSaved(false)
  }

  const handleSaveJob = async () => {
    if (!user) return
    setSaving(true)
    const r = calculate(form)
    const { error } = await supabase
      .from('profiles')
      .update({
        current_job_wage: parseFloat(form.wage),
        current_job_ot_rate: parseFloat(form.otRate) || parseFloat(form.wage) * 1.5,
        current_job_per_diem: parseFloat(form.perDiem) || 0,
        current_job_state: form.homeState,
        current_job_schedule: form.schedule,
        current_job_net_weekly: Math.round(r.netTotal),
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
    setSaving(false)
    if (!error) {
      setSaved(true)
      onProfileUpdate?.()
    }
  }

  const r = calculate(form)
  const hasInput = parseFloat(form.wage) > 0
  const canSave = hasInput && form.schedule && form.homeState

  return (
    <div style={s.page}>
      <div style={s.wrap}>
        <h2 style={s.title}>Pay Calculator</h2>
        <p style={s.sub}>Enter any job's wage details to see your real weekly net take-home after all deductions.</p>

        <div style={s.grid}>
          {/* LEFT — Inputs */}
          <div>
            <div style={s.card}>
              <div style={s.secLabel}>Job details</div>

              <div style={s.row2}>
                <div style={s.field}>
                  <label style={s.label}>Base wage ($/hr) *</label>
                  <input style={s.input} type="number" value={form.wage}
                    onChange={e => handleWageChange(e.target.value)}
                    placeholder="42.55" min="0" step="0.01" />
                </div>
                <div style={s.field}>
                  <label style={s.label}>OT rate ($/hr)</label>
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
                    {OT_MULTIPLIERS.map(m => (
                      <button key={m} onClick={() => handleOtMultiplier(m)} style={{
                        padding: '4px 10px', border: '1px solid',
                        borderColor: form.otMultiplier === m ? '#4caf50' : '#2a2a2a',
                        borderRadius: '5px', cursor: 'pointer', fontSize: '11px',
                        background: form.otMultiplier === m ? '#1a2e1a' : '#0a0a0a',
                        color: form.otMultiplier === m ? '#4caf50' : '#888'
                      }}>{m}x</button>
                    ))}
                  </div>
                  <input style={s.input} type="number" value={form.otRate}
                    onChange={e => set('otRate', e.target.value)}
                    placeholder={form.wage ? (parseFloat(form.wage) * 1.5).toFixed(2) : '63.83'}
                    min="0" step="0.01" />
                </div>
              </div>

              <div style={s.field}>
                <label style={s.label}>Schedule</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {['4/10s', '5/8s', '5/10s', '6/10s', '7/12s'].map(sc => (
                    <button key={sc}
                      onClick={() => handleSchedule(sc)}
                      style={{
                        padding: '6px 12px', border: '1px solid',
                        borderColor: form.schedule === sc ? '#4caf50' : '#2a2a2a',
                        borderRadius: '6px', cursor: 'pointer', fontSize: '12px',
                        background: form.schedule === sc ? '#1a2e1a' : '#0a0a0a',
                        color: form.schedule === sc ? '#4caf50' : '#888'
                      }}>
                      {sc}
                    </button>
                  ))}
                </div>
              </div>

              <div style={s.row2}>
                <div style={s.field}>
                  <label style={s.label}>Regular hours/week</label>
                  <input style={s.input} type="number" value={form.regHours}
                    onChange={e => set('regHours', e.target.value)} min="0" max="40" />
                </div>
                <div style={s.field}>
                  <label style={s.label}>OT hours/week</label>
                  <input style={s.input} type="number" value={form.otHours}
                    onChange={e => set('otHours', e.target.value)} min="0" />
                </div>
              </div>

              <div style={s.row2}>
                <div style={s.field}>
                  <label style={s.label}>Per diem ($/day)</label>
                  <input style={s.input} type="number" value={form.perDiem}
                    onChange={e => set('perDiem', e.target.value)}
                    placeholder="0 = none" min="0" />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Days worked/week</label>
                  <input style={s.input} type="number" value={form.daysWorked}
                    onChange={e => set('daysWorked', e.target.value)} min="1" max="7" />
                </div>
              </div>

              <div style={s.field}>
                <label style={s.label}>Home state (for tax calculation)</label>
                <select style={s.select} value={form.homeState}
                  onChange={e => set('homeState', e.target.value)}>
                  {STATES.map(st => (
                    <option key={st} value={st}>
                      {st} — {STATE_TAX_RATES[st] === 0 ? 'No state income tax' : `${(STATE_TAX_RATES[st] * 100).toFixed(1)}% state tax`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* RIGHT — Results */}
          <div>
            <div style={s.card}>
              <div style={s.secLabel}>Your take-home</div>

              {!hasInput ? (
                <div style={{ color: '#555', fontSize: '13px', padding: '20px 0', textAlign: 'center' }}>
                  Enter a wage to see your results
                </div>
              ) : (
                <>
                  <div style={s.bigNum}>{fmt(r.netTotal)}</div>
                  <div style={s.bigLabel}>weekly net take-home</div>

                  <div style={{ ...s.resultRow, borderBottom: '1px solid #333', marginBottom: '8px', paddingBottom: '10px' }}>
                    <span style={s.resultLabel}>Monthly net</span>
                    <span style={{ color: '#4caf50', fontWeight: '600', fontSize: '16px' }}>{fmt(r.monthly)}</span>
                  </div>
                  <div style={{ ...s.resultRow, marginBottom: '16px' }}>
                    <span style={s.resultLabel}>Annual net (52 wks)</span>
                    <span style={{ color: '#7eb8f7', fontWeight: '500' }}>{fmt(r.annual)}</span>
                  </div>

                  <div style={s.secLabel}>Weekly breakdown</div>
                  <div style={s.resultRow}>
                    <span style={s.resultLabel}>Gross wages ({parseInt(form.regHours)+parseInt(form.otHours||0)} hrs)</span>
                    <span style={s.resultVal}>{fmt(r.grossWages)}</span>
                  </div>
                  {r.weeklyPerDiem > 0 && (
                    <div style={s.resultRow}>
                      <span style={s.resultLabel}>Per diem ({form.daysWorked} days × ${form.perDiem})</span>
                      <span style={{ color: '#4caf50' }}>+{fmt(r.weeklyPerDiem)}</span>
                    </div>
                  )}
                  <div style={s.resultRow}>
                    <span style={s.resultLabel}>Total deductions</span>
                    <span style={{ color: '#e05252' }}>-{fmt(r.totalDeductions)}</span>
                  </div>
                  <div style={{ ...s.resultRow, borderBottom: 'none' }}>
                    <span style={{ ...s.resultLabel, color: '#aaa' }}>Effective deduction rate</span>
                    <span style={s.resultVal}>{r.effectiveDeductRate.toFixed(1)}%</span>
                  </div>

                  <div style={{ ...s.secLabel, marginTop: '16px' }}>Deduction detail</div>
                  {[
                    ['Federal income tax (est.)', r.fedTax],
                    [`${form.homeState} state income tax`, r.stateTaxAmt],
                    ['Social Security (6.2%)', r.ss],
                    ['Medicare (1.45%)', r.med],
                    ['Union dues (est.)', r.unionDues],
                  ].map(([label, val]) => (
                    <div key={label} style={s.deductRow}>
                      <span style={{ color: '#666' }}>{label}</span>
                      <span style={{ color: '#e05252' }}>-{fmt(val)}</span>
                    </div>
                  ))}

                  {canSave && (
                    saved ? (
                      <div style={s.savedBadge}>Saved. Used as your baseline in Job Rankings.</div>
                    ) : (
                      <button style={saving ? s.saveBtnDisabled : s.saveBtn}
                        onClick={handleSaveJob} disabled={saving}>
                        {saving ? 'Saving...' : hasSavedJob ? 'Update current job' : 'Save as my current job'}
                      </button>
                    )
                  )}
                </>
              )}
            </div>

            <div style={s.note}>
              Estimates use effective tax rates for typical journeyman wages. Actual taxes vary based on W-4 elections, deductions, and filing status. Union dues use a $97/week estimate — adjust for your local. Per diem is untaxed.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
