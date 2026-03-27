import { useState } from 'react'
import { supabase } from '../lib/supabase'
import CertSelect from '../components/CertSelect'
import Spinner from '../components/Spinner'

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

const RIG_TYPES = [
  'Fifth wheel / 5th wheel', 'Travel trailer', 'Class A motorhome',
  'Class C motorhome', 'Toy hauler', 'Cargo trailer conversion',
  'No rig — hotel/apartment', 'Other'
]

const s = {
  page: { minHeight: '100vh', background: '#0a0a0a',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    padding: '32px 20px' },
  wrap: { maxWidth: '620px', margin: '0 auto' },
  title: { color: '#fff', fontSize: '20px', fontWeight: '600', margin: '0 0 4px' },
  sub: { color: '#666', fontSize: '13px', margin: '0 0 28px' },
  section: { marginBottom: '28px' },
  sectionLabel: {
    fontSize: '10px', fontWeight: '700', color: '#555',
    letterSpacing: '.1em', textTransform: 'uppercase',
    marginBottom: '12px', paddingBottom: '6px', borderBottom: '1px solid #1a1a1a'
  },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' },
  field: { marginBottom: '12px' },
  label: { display: 'block', color: '#aaa', fontSize: '12px', marginBottom: '5px' },
  input: {
    width: '100%', padding: '11px 12px', background: '#141414',
    border: '1px solid #2a2a2a', borderRadius: '8px', color: '#fff',
    fontSize: '13px', outline: 'none', boxSizing: 'border-box', minHeight: '44px'
  },
  select: {
    width: '100%', padding: '11px 12px', background: '#141414',
    border: '1px solid #2a2a2a', borderRadius: '8px', color: '#fff',
    fontSize: '13px', outline: 'none', boxSizing: 'border-box', cursor: 'pointer', minHeight: '44px'
  },
  btn: {
    width: '100%', padding: '13px', background: '#4caf50', border: 'none',
    borderRadius: '8px', color: '#fff', fontSize: '14px', fontWeight: '500',
    cursor: 'pointer', marginTop: '8px', minHeight: '44px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
  },
  error: {
    background: '#2e1a1a', border: '1px solid #5a1a1a', borderRadius: '8px',
    padding: '10px 12px', color: '#e05252', fontSize: '13px', marginBottom: '16px'
  },
  success: {
    background: '#1a2e1a', border: '1px solid #1a5a1a', borderRadius: '8px',
    padding: '10px 12px', color: '#4caf50', fontSize: '13px', marginBottom: '16px'
  }
}

export default function ProfileEdit({ user, profile, onProfileUpdate }) {
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    trade: profile?.trade || '',
    home_state: profile?.home_state || '',
    home_city: profile?.home_city || '',
    years_experience: String(profile?.years_experience || ''),
    certifications: profile?.certifications || [],
    preferred_schedule: profile?.preferred_schedule || '',
    min_per_diem: String(profile?.min_per_diem || ''),
    travel_radius_miles: String(profile?.travel_radius_miles || '500'),
    rig_type: profile?.rig_type || ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const set = (key, val) => { setForm(f => ({ ...f, [key]: val })); setSuccess('') }

  const handleSubmit = async () => {
    if (!form.full_name || !form.trade || !form.home_state) {
      setError('Name, trade, and home state are required.')
      return
    }
    setSaving(true)
    setError('')
    setSuccess('')

    const { error: err } = await supabase.from('profiles').update({
      full_name: form.full_name,
      trade: form.trade,
      home_state: form.home_state,
      home_city: form.home_city,
      years_experience: parseInt(form.years_experience) || 0,
      certifications: form.certifications,
      preferred_schedule: form.preferred_schedule,
      min_per_diem: parseFloat(form.min_per_diem) || 0,
      travel_radius_miles: parseInt(form.travel_radius_miles) || 500,
      rig_type: form.rig_type,
      updated_at: new Date().toISOString()
    }).eq('id', user.id)

    setSaving(false)
    if (err) { setError(err.message) }
    else { setSuccess('Profile updated.'); onProfileUpdate?.() }
  }

  return (
    <div style={s.page}>
      <div style={s.wrap}>
        <h2 style={s.title}>Settings</h2>
        <p style={s.sub}>Update your profile to improve job score accuracy.</p>

        {error && <div style={s.error}>{error}</div>}
        {success && <div style={s.success}>{success}</div>}

        <div style={s.section}>
          <div style={s.sectionLabel}>About you</div>
          <div style={s.row}>
            <div style={s.field}>
              <label style={s.label}>Full name *</label>
              <input style={s.input} value={form.full_name}
                onChange={e => set('full_name', e.target.value)} />
            </div>
            <div style={s.field}>
              <label style={s.label}>Years experience</label>
              <input style={s.input} type="number" value={form.years_experience}
                onChange={e => set('years_experience', e.target.value)} min="0" max="50" />
            </div>
          </div>
          <div style={s.row}>
            <div style={s.field}>
              <label style={s.label}>Trade *</label>
              <select style={s.select} value={form.trade}
                onChange={e => set('trade', e.target.value)}>
                <option value="">Select trade</option>
                {TRADES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={s.field}>
              <label style={s.label}>Preferred schedule</label>
              <select style={s.select} value={form.preferred_schedule}
                onChange={e => set('preferred_schedule', e.target.value)}>
                <option value="">Any schedule</option>
                <option value="5/8s">5/8s — 40hrs/wk</option>
                <option value="4/10s">4/10s — 40hrs/wk</option>
                <option value="5/10s">5/10s — 50hrs/wk</option>
                <option value="6/10s">6/10s — 60hrs/wk</option>
                <option value="7/12s">7/12s — 84hrs/wk (outage)</option>
              </select>
            </div>
          </div>
        </div>

        <div style={s.section}>
          <div style={s.sectionLabel}>Home base</div>
          <div style={s.row}>
            <div style={s.field}>
              <label style={s.label}>Home state *</label>
              <select style={s.select} value={form.home_state}
                onChange={e => set('home_state', e.target.value)}>
                <option value="">Select state</option>
                {STATES.map(st => <option key={st} value={st}>{st}</option>)}
              </select>
            </div>
            <div style={s.field}>
              <label style={s.label}>Home city</label>
              <input style={s.input} value={form.home_city}
                onChange={e => set('home_city', e.target.value)} />
            </div>
          </div>
          <div style={s.row}>
            <div style={s.field}>
              <label style={s.label}>Travel radius (miles)</label>
              <select style={s.select} value={form.travel_radius_miles}
                onChange={e => set('travel_radius_miles', e.target.value)}>
                <option value="250">250 miles</option>
                <option value="500">500 miles</option>
                <option value="1000">1,000 miles</option>
                <option value="2000">2,000 miles</option>
                <option value="99999">Anywhere in the US</option>
              </select>
            </div>
            <div style={s.field}>
              <label style={s.label}>Minimum per diem ($/day)</label>
              <input style={s.input} type="number" value={form.min_per_diem}
                onChange={e => set('min_per_diem', e.target.value)}
                placeholder="0 = no requirement" min="0" />
            </div>
          </div>
        </div>

        <div style={s.section}>
          <div style={s.sectionLabel}>Living situation on the road</div>
          <div style={s.field}>
            <label style={s.label}>Rig type</label>
            <select style={s.select} value={form.rig_type}
              onChange={e => set('rig_type', e.target.value)}>
              <option value="">Select rig type</option>
              {RIG_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>

        <div style={s.section}>
          <div style={s.sectionLabel}>Certifications held</div>
          <CertSelect value={form.certifications} onChange={v => set('certifications', v)} />
        </div>

        <button style={{ ...s.btn, background: saving ? '#333' : '#4caf50' }}
          onClick={handleSubmit} disabled={saving}>
          {saving ? <><Spinner /> Saving...</> : 'Save changes'}
        </button>
      </div>
    </div>
  )
}
