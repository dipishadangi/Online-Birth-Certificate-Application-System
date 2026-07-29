import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import PageHeader from '../components/PageHeader.jsx'

const STEPS = [
  { id: 1, label: 'Child Details',  icon: '👶' },
  { id: 2, label: 'Parent Details', icon: '👨‍👩‍👦' },
  { id: 3, label: 'Review & Submit', icon: '✅' },
]

const initialForm = {
  child_name: '',
  date_of_birth: '',
  place_of_birth: '',
  gender: '',
  father_name: '',
  mother_name: '',
  permanent_address: '',
}

export default function NewApplication() {
  const navigate = useNavigate()
  const [step, setStep]         = useState(1)
  const [form, setForm]         = useState(initialForm)
  const [error, setError]       = useState('')
  const [submitting, setSubmitting] = useState(false)

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function goNext() {
    setError('')
    // Basic validation before advancing
    if (step === 1) {
      if (!form.child_name || !form.date_of_birth || !form.place_of_birth || !form.gender) {
        setError('Please fill in all child details before continuing.')
        return
      }
    }
    if (step === 2) {
      if (!form.father_name || !form.mother_name || !form.permanent_address) {
        setError('Please fill in all parent details before continuing.')
        return
      }
    }
    setStep((s) => s + 1)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await api.post('/applications', form)
      navigate(`/applications/${res.data.id}`)
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not submit application.')
    } finally {
      setSubmitting(false)
    }
  }

  const progress = ((step - 1) / (STEPS.length - 1)) * 100

  return (
    <div className="page-section max-w-2xl">
      <PageHeader
        badge="New Application"
        title="Birth Certificate Application"
        subtitle="Fill out the form below to submit your application."
      />

      {/* Step progress bar */}
      <div className="card p-6 mb-8">
        <div className="flex justify-between items-center relative">
          {/* Connector line */}
          <div className="absolute left-0 right-0 top-5 h-0.5 bg-slate-200 -z-0">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-brand-400 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {STEPS.map((s) => (
            <div key={s.id} className="flex flex-col items-center gap-2 relative z-10">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-bold border-2 transition-all duration-300 ${
                step > s.id ? 'bg-brand-600 border-brand-600 text-white shadow-glow scale-90'
                : step === s.id ? 'bg-white border-brand-500 text-brand-600 shadow-md'
                : 'bg-white border-slate-200 text-slate-300'
              }`}>
                {step > s.id ? '✓' : s.icon}
              </div>
              <span className={`text-xs font-semibold hidden sm:block transition-colors duration-200 ${
                step === s.id ? 'text-brand-700' : step > s.id ? 'text-brand-500' : 'text-slate-400'
              }`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="alert-error mb-5">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* ── Step 1: Child Details ── */}
        {step === 1 && (
          <div className="card p-7 animate-scale-in space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-xl shadow">👶</div>
              <div>
                <h2 className="font-bold text-slate-800 font-display">Child Details</h2>
                <p className="text-xs text-slate-400">Information about the child being registered</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Child's Full Name" name="child_name" value={form.child_name} onChange={handleChange} placeholder="e.g. Ram Kumar Sharma" />
              <Field label="Date of Birth" name="date_of_birth" type="date" value={form.date_of_birth} onChange={handleChange} />
              <Field label="Place of Birth" name="place_of_birth" value={form.place_of_birth} onChange={handleChange} placeholder="e.g. Kathmandu" />
              <SelectField
                label="Gender"
                name="gender"
                value={form.gender}
                onChange={handleChange}
                options={['Male', 'Female', 'Other']}
              />
            </div>
            <div className="flex justify-end pt-2">
              <button type="button" onClick={goNext} id="step1-next" className="btn-primary">
                Next — Parent Details
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Parent Details ── */}
        {step === 2 && (
          <div className="card p-7 animate-scale-in space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center text-xl shadow">👨‍👩‍👦</div>
              <div>
                <h2 className="font-bold text-slate-800 font-display">Parent Details</h2>
                <p className="text-xs text-slate-400">Parent and address information</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Father's Full Name" name="father_name" value={form.father_name} onChange={handleChange} placeholder="e.g. Hari Kumar Sharma" />
              <Field label="Mother's Full Name" name="mother_name" value={form.mother_name} onChange={handleChange} placeholder="e.g. Sita Kumari Sharma" />
            </div>
            <Field label="Permanent Address" name="permanent_address" value={form.permanent_address} onChange={handleChange} placeholder="e.g. Ward No. 5, Kathmandu Metropolitan City" />
            <div className="flex justify-between pt-2">
              <button type="button" onClick={() => setStep(1)} className="btn-ghost">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <button type="button" onClick={goNext} id="step2-next" className="btn-primary">
                Next — Review
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Review & Submit ── */}
        {step === 3 && (
          <div className="card p-7 animate-scale-in space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-xl shadow">📋</div>
              <div>
                <h2 className="font-bold text-slate-800 font-display">Review Your Application</h2>
                <p className="text-xs text-slate-400">Please review before submitting</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-5 space-y-4">
              <ReviewSection title="Child Details" items={[
                { label: "Full Name",     value: form.child_name },
                { label: "Date of Birth", value: form.date_of_birth },
                { label: "Place of Birth",value: form.place_of_birth },
                { label: "Gender",        value: form.gender },
              ]} />
              <div className="border-t border-slate-200" />
              <ReviewSection title="Parent & Address" items={[
                { label: "Father's Name",      value: form.father_name },
                { label: "Mother's Name",      value: form.mother_name },
                { label: "Permanent Address",  value: form.permanent_address },
              ]} />
            </div>

            <div className="flex justify-between pt-2">
              <button type="button" onClick={() => setStep(2)} className="btn-ghost">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <button id="submit-application" type="submit" disabled={submitting} className="btn-primary">
                {submitting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    Submitting…
                  </>
                ) : (
                  <>
                    Submit Application
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}

function Field({ label, name, value, onChange, type = 'text', placeholder = '' }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        type={type}
        name={name}
        required
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="input"
      />
    </div>
  )
}

function SelectField({ label, name, value, onChange, options }) {
  return (
    <div>
      <label className="label">{label}</label>
      <select name={name} required value={value} onChange={onChange} className="select">
        <option value="" disabled>Select…</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  )
}

function ReviewSection({ title, items }) {
  return (
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{title}</p>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2">
        {items.map(({ label, value }) => (
          <div key={label}>
            <p className="text-xs text-slate-400">{label}</p>
            <p className="text-sm font-semibold text-slate-700 mt-0.5">{value || '—'}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
