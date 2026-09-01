import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import PageHeader from '../components/PageHeader.jsx'

const STEPS = [
  { id: 1, label: 'Child Details', icon: '👶' },
  { id: 2, label: 'Parent Details', icon: '👨‍👩‍👦' },
  { id: 3, label: 'Upload Documents', icon: '📷' },
  { id: 4, label: 'Review & Submit', icon: '✅' },
]

const DOC_TYPES = [
  { value: 'hospital_record', label: 'Hospital Birth Record / Certificate' },
  { value: 'parent_citizenship', label: 'Parent Citizenship Certificate / ID' },
  { value: 'marriage_certificate', label: 'Parents Marriage Certificate' },
  { value: 'other', label: 'Other Supporting Document' },
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
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(initialForm)
  const [docType, setDocType] = useState('hospital_record')
  const [pendingDocs, setPendingDocs] = useState([])
  const [createdAppId, setCreatedAppId] = useState(null)
  const [uploadedDocMap, setUploadedDocMap] = useState({})
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function handleFileSelect(e) {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setError('')
      const isImage = file.type.startsWith('image/')
      const newDoc = {
        id: Date.now(),
        type: docType,
        typeLabel: DOC_TYPES.find((t) => t.value === docType)?.label || docType,
        file: file,
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        preview: isImage ? URL.createObjectURL(file) : null,
      }
      setPendingDocs((prev) => [...prev, newDoc])
      e.target.value = ''
    }
  }

  function removeDocument(id) {
    setPendingDocs((prev) => prev.filter((d) => d.id !== id))
    setUploadedDocMap((prev) => {
      const copy = { ...prev }
      delete copy[id]
      return copy
    })
  }

  function goNext() {
    setError('')
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
    if (step === 3) {
      if (pendingDocs.length === 0) {
        setError('Please upload at least one supporting document (e.g. Hospital Record or Parent ID) before continuing.')
        return
      }
    }
    setStep((s) => s + 1)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (pendingDocs.length === 0) {
      setError('Please upload at least one supporting document before submitting.')
      return
    }

    setSubmitting(true)
    let appId = createdAppId

    try {
      // 1. Submit core application if not already created in a previous attempt
      if (!appId) {
        const res = await api.post('/applications', form)
        appId = res.data.id
        setCreatedAppId(appId)
      }

      // 2. Upload attached documents to Cloudinary via backend API
      const newUploadedMap = { ...uploadedDocMap }
      for (const doc of pendingDocs) {
        if (newUploadedMap[doc.id]) {
          // Already uploaded in previous attempt
          continue
        }
        const formData = new FormData()
        formData.append('document_type', doc.type)
        formData.append('file', doc.file)
        await api.post(`/applications/${appId}/documents`, formData)
        newUploadedMap[doc.id] = true
        setUploadedDocMap({ ...newUploadedMap })
      }

      setCreatedAppId(null)
      setUploadedDocMap({})
      navigate(`/applications/${appId}`)
    } catch (err) {
      let detailMsg = 'Could not submit application.'
      if (err.response?.status === 401) {
        detailMsg = 'Session expired or not logged in. Please log in first to submit an application.'
      } else if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === 'string') {
          detailMsg = err.response.data.detail
        } else if (Array.isArray(err.response.data.detail)) {
          detailMsg = err.response.data.detail.map((d) => d.msg || JSON.stringify(d)).join(', ')
        }
      } else if (err.message) {
        detailMsg = `Document upload failed: ${err.message}`
      }

      if (appId) {
        detailMsg += ` (Application #${appId} draft created. Click "Submit Application" to retry uploading documents).`
      }
      setError(detailMsg)
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
        subtitle="Fill out the form below and upload your documents to submit your application."
      />

      {/* Step progress bar */}
      <div className="card p-6 mb-8">
        <div className="flex justify-between items-center relative">
          <div className="absolute left-0 right-0 top-5 h-0.5 bg-slate-200 -z-0">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-brand-400 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {STEPS.map((s) => (
            <div key={s.id} className="flex flex-col items-center gap-2 relative z-10">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-bold border-2 transition-all duration-300 ${
                  step > s.id
                    ? 'bg-brand-600 border-brand-600 text-white shadow-glow scale-90'
                    : step === s.id
                    ? 'bg-white border-brand-500 text-brand-600 shadow-md'
                    : 'bg-white border-slate-200 text-slate-300'
                }`}
              >
                {step > s.id ? '✓' : s.icon}
              </div>
              <span
                className={`text-xs font-semibold hidden sm:block transition-colors duration-200 ${
                  step === s.id ? 'text-brand-700' : step > s.id ? 'text-brand-500' : 'text-slate-400'
                }`}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="alert-error mb-5">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* ── Step 1: Child Details ── */}
        {step === 1 && (
          <div className="card p-7 animate-scale-in space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-xl shadow">
                👶
              </div>
              <div>
                <h2 className="font-bold text-slate-800 font-display">Child Details</h2>
                <p className="text-xs text-slate-400">Information about the child being registered</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field
                label="Child's Full Name"
                name="child_name"
                value={form.child_name}
                onChange={handleChange}
                placeholder="e.g. Ram Kumar Sharma"
              />
              <Field
                label="Date of Birth"
                name="date_of_birth"
                type="date"
                value={form.date_of_birth}
                onChange={handleChange}
              />
              <Field
                label="Place of Birth"
                name="place_of_birth"
                value={form.place_of_birth}
                onChange={handleChange}
                placeholder="e.g. Kathmandu"
              />
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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center text-xl shadow">
                👨‍👩‍👦
              </div>
              <div>
                <h2 className="font-bold text-slate-800 font-display">Parent Details</h2>
                <p className="text-xs text-slate-400">Parent and address information</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field
                label="Father's Full Name"
                name="father_name"
                value={form.father_name}
                onChange={handleChange}
                placeholder="e.g. Hari Kumar Sharma"
              />
              <Field
                label="Mother's Full Name"
                name="mother_name"
                value={form.mother_name}
                onChange={handleChange}
                placeholder="e.g. Sita Kumari Sharma"
              />
            </div>
            <Field
              label="Permanent Address"
              name="permanent_address"
              value={form.permanent_address}
              onChange={handleChange}
              placeholder="e.g. Ward No. 5, Kathmandu Metropolitan City"
            />
            <div className="flex justify-between pt-2">
              <button type="button" onClick={() => setStep(1)} className="btn-ghost">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <button type="button" onClick={goNext} id="step2-next" className="btn-primary">
                Next — Upload Documents
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Upload Documents ── */}
        {step === 3 && (
          <div className="card p-7 animate-scale-in space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-xl shadow">
                📷
              </div>
              <div>
                <h2 className="font-bold text-slate-800 font-display flex items-center gap-2">
                  Upload Supporting Documents
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold">Required</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Upload images or PDFs of hospital records, parent IDs, or certificates (at least 1 document required)
                </p>
              </div>
            </div>

            {pendingDocs.length === 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2">
                <span className="text-base">⚠️</span>
                <span>At least one supporting document (Hospital Birth Record or Parent ID) is required to submit your application.</span>
              </div>
            )}

            {/* Document upload picker */}
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200/80 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Document Type</label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="select w-full"
                  >
                    {DOC_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Choose Image / PDF File</label>
                  <input
                    id="file-input"
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileSelect}
                    className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Attached documents preview list */}
            {pendingDocs.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Attached Documents ({pendingDocs.length})
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {pendingDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 shadow-sm"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        {doc.preview ? (
                          <img
                            src={doc.preview}
                            alt="preview"
                            className="w-10 h-10 object-cover rounded-lg border border-slate-200 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                            📄
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate">{doc.name}</p>
                          <p className="text-[10px] text-slate-400">
                            {doc.typeLabel} • {doc.size}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeDocument(doc.id)}
                        className="text-slate-400 hover:text-red-500 p-1 transition-colors text-sm font-bold ml-2"
                        title="Remove file"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between pt-2">
              <button type="button" onClick={() => setStep(2)} className="btn-ghost">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <button type="button" onClick={goNext} id="step3-next" className="btn-primary">
                Next — Review & Submit
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* ── Step 4: Review & Submit ── */}
        {step === 4 && (
          <div className="card p-7 animate-scale-in space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-xl shadow">
                📋
              </div>
              <div>
                <h2 className="font-bold text-slate-800 font-display">Review Your Application</h2>
                <p className="text-xs text-slate-400">Please review your information before submitting</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-5 space-y-4">
              <ReviewSection
                title="Child Details"
                items={[
                  { label: 'Full Name', value: form.child_name },
                  { label: 'Date of Birth', value: form.date_of_birth },
                  { label: 'Place of Birth', value: form.place_of_birth },
                  { label: 'Gender', value: form.gender },
                ]}
              />
              <div className="border-t border-slate-200" />
              <ReviewSection
                title="Parent & Address"
                items={[
                  { label: "Father's Name", value: form.father_name },
                  { label: "Mother's Name", value: form.mother_name },
                  { label: 'Permanent Address', value: form.permanent_address },
                ]}
              />
              {pendingDocs.length > 0 ? (
                <>
                  <div className="border-t border-slate-200" />
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Attached Documents ({pendingDocs.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {pendingDocs.map((d) => (
                        <span
                          key={d.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-medium"
                        >
                          📷 {d.typeLabel}: {d.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="border-t border-slate-200" />
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center justify-between">
                    <span className="font-semibold">⚠️ No document attached! Please go back to Step 3 to upload your document.</span>
                    <button type="button" onClick={() => setStep(3)} className="underline text-red-800 font-bold ml-2">
                      Upload Document
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-between items-center pt-2">
              <button type="button" onClick={() => setStep(3)} className="btn-ghost">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>

              <div className="flex items-center gap-3">
              <button
                id="submit-application"
                type="submit"
                disabled={submitting || pendingDocs.length === 0}
                className="btn-primary"
              >
                {submitting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                    Uploading & Submitting…
                  </>
                ) : (
                  <>
                    Submit Application
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </>
                )}
              </button>
              </div>
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
        <option value="" disabled>
          Select…
        </option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
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
