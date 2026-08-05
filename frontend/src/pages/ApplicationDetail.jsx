import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/client'
import StatusBadge from '../components/StatusBadge.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const DOC_TYPE_LABELS = {
  hospital_record: 'Hospital Record',
  parent_id:       "Parent's ID",
  other:           'Other',
}

const FILE_ICONS = {
  pdf:  '📄',
  jpg:  '🖼️',
  jpeg: '🖼️',
  png:  '🖼️',
}

function fileIcon(name = '') {
  const ext = name.split('.').pop()?.toLowerCase()
  return FILE_ICONS[ext] || '📎'
}

function getDocUrl(filePath) {
  if (!filePath) return ''
  let cleanPath = filePath.replace(/\\/g, '/')
  if (cleanPath.startsWith('http')) return cleanPath
  if (cleanPath.includes('uploads/')) {
    cleanPath = cleanPath.slice(cleanPath.indexOf('uploads/'))
  }
  const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
  const rootServer = base.replace(/\/api\/?$/, '')
  return `${rootServer}/${cleanPath.replace(/^\//, '')}`
}

function isImageFile(fileName = '') {
  const ext = fileName.split('.').pop()?.toLowerCase()
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)
}

export default function ApplicationDetail() {
  const { id }   = useParams()
  const { user } = useAuth()
  const [application, setApplication] = useState(null)
  const [auditLogs, setAuditLogs]     = useState([])
  const [error, setError]             = useState('')
  const [uploadSuccess, setUploadSuccess] = useState('')
  const [previewDoc, setPreviewDoc]   = useState(null)

  // Upload form
  const [documentType, setDocumentType] = useState('hospital_record')
  const [file, setFile]                 = useState(null)
  const [uploading, setUploading]       = useState(false)
  const [dragOver, setDragOver]         = useState(false)

  // Decision form
  const [reason, setReason]   = useState('')
  const [deciding, setDeciding] = useState(false)

  const isStaffOrAdmin = user && ['ward_staff', 'district_staff', 'admin'].includes(user.role)

  function loadApplication() {
    api.get(`/applications/${id}`)
      .then((res) => setApplication(res.data))
      .catch(() => setError('Could not load application.'))
  }

  useEffect(() => {
    loadApplication()
    if (isStaffOrAdmin) {
      api.get(`/applications/${id}/audit-logs`)
        .then((res) => setAuditLogs(res.data))
        .catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') setPreviewDoc(null)
    }
    if (previewDoc) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [previewDoc])

  async function handleUpload(e) {
    e.preventDefault()
    if (!file) return
    setUploading(true)
    setError('')
    setUploadSuccess('')
    try {
      const formData = new FormData()
      formData.append('document_type', documentType)
      formData.append('file', file)
      const res = await api.post(`/applications/${id}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setApplication(res.data)
      setFile(null)
      setUploadSuccess('Document uploaded successfully!')
      setTimeout(() => setUploadSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  async function handleDecision(action) {
    setDeciding(true)
    setError('')
    try {
      let endpoint
      if (user.role === 'admin') {
        endpoint = `/applications/${id}/admin-decision`
      } else if (user.role === 'ward_staff') {
        endpoint = `/applications/${id}/ward-decision`
      } else {
        endpoint = `/applications/${id}/district-decision`
      }
      const res = await api.post(endpoint, { action, reason: reason || null })
      setApplication(res.data)
      setReason('')
      api.get(`/applications/${id}/audit-logs`).then((r) => setAuditLogs(r.data)).catch(() => {})
    } catch (err) {
      setError(err.response?.data?.detail || 'Action failed.')
    } finally {
      setDeciding(false)
    }
  }

  if (error && !application) return (
    <div className="page-section">
      <div className="alert-error">{error}</div>
      <Link to="/" className="btn-ghost mt-4">← Go Back</Link>
    </div>
  )
  if (!application) return <LoadingSpinner text="Loading application…" />

  const INFO_FIELDS = [
    { label: 'Date of Birth',      value: application.date_of_birth },
    { label: 'Place of Birth',     value: application.place_of_birth },
    { label: 'Gender',             value: application.gender },
    { label: "Father's Name",      value: application.father_name },
    { label: "Mother's Name",      value: application.mother_name },
    { label: 'Permanent Address',  value: application.permanent_address, full: true },
  ]

  return (
    <div className="page-section max-w-3xl">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 mb-8 animate-slide-up">
        <div>
          <Link to={user?.role === 'citizen' ? '/dashboard' : -1} className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-brand-600 mb-3 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
          <span className="block text-xs font-semibold text-brand-600 bg-brand-100 px-3 py-1 rounded-full w-fit mb-2">Application Details</span>
          <h1 className="text-2xl font-extrabold text-slate-800 font-display">{application.child_name}</h1>
          <p className="text-sm text-slate-400 mt-1">
            Submitted {new Date(application.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <StatusBadge status={application.status} size="lg" />
      </div>

      {error && <div className="alert-error mb-5">{error}</div>}

      {/* ── Application Info ── */}
      <div className="card p-6 mb-5 animate-slide-up delay-75">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Application Information</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-4">
          {INFO_FIELDS.map(({ label, value, full }) => (
            <div key={label} className={full ? 'col-span-2 sm:col-span-3' : ''}>
              <p className="text-xs text-slate-400 mb-0.5">{label}</p>
              <p className="text-sm font-semibold text-slate-700">{value || '—'}</p>
            </div>
          ))}
        </div>

        {application.rejection_reason && (
          <div className="mt-5 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-1">Rejection Reason</p>
            <p className="text-sm text-red-700">{application.rejection_reason}</p>
          </div>
        )}
      </div>

      {/* ── Documents ── */}
      <div className="card p-6 mb-5 animate-slide-up delay-100">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Uploaded Documents</h2>

        {application.documents.length === 0 ? (
          <p className="text-slate-400 text-sm py-2">No documents uploaded yet.</p>
        ) : (
          <ul className="space-y-2 mb-5">
            {application.documents.map((doc) => (
              <li
                key={doc.id}
                onClick={() => setPreviewDoc(doc)}
                className="flex items-center justify-between bg-slate-50 hover:bg-brand-50/60 border border-slate-100 hover:border-brand-200 rounded-xl px-4 py-3 cursor-pointer transition-all duration-200 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl group-hover:scale-110 transition-transform duration-200">{fileIcon(doc.file_name)}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-700 group-hover:text-brand-700 truncate max-w-[200px] sm:max-w-[300px] transition-colors">
                      {doc.file_name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {DOC_TYPE_LABELS[doc.document_type] || doc.document_type}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <span className="text-xs font-medium text-brand-600 bg-brand-50 border border-brand-100 px-2 py-1 rounded-lg">
                    {DOC_TYPE_LABELS[doc.document_type] || doc.document_type}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setPreviewDoc(doc)
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-brand-700 bg-white hover:bg-brand-100 border border-slate-200 px-2.5 py-1 rounded-lg transition-colors shadow-xs"
                    title="View Document"
                  >
                    <svg className="w-3.5 h-3.5 text-slate-500 group-hover:text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Upload area — citizens only */}
        {user.role === 'citizen' && (
          <form onSubmit={handleUpload} id="upload-form">
            {uploadSuccess && (
              <div className="alert-success mb-4">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {uploadSuccess}
              </div>
            )}

            <div
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 ${
                dragOver ? 'border-brand-400 bg-brand-50' : 'border-slate-200 hover:border-brand-300 hover:bg-brand-50/40'
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragOver(false)
                const droppedFile = e.dataTransfer.files[0]
                if (droppedFile) setFile(droppedFile)
              }}
            >
              <div className="text-3xl mb-2">{file ? '📎' : '☁️'}</div>
              <p className="text-sm font-semibold text-slate-600">
                {file ? file.name : 'Drag & drop a file here, or click to browse'}
              </p>
              {file && (
                <p className="text-xs text-slate-400 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
              )}
              <input
                id="file-upload-input"
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
                className="hidden"
              />
              <label
                htmlFor="file-upload-input"
                className="inline-block mt-3 text-xs font-semibold text-brand-600 cursor-pointer hover:underline"
              >
                Browse files
              </label>
            </div>

            <div className="flex items-center gap-3 mt-4">
              <select
                id="document-type-select"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="select flex-1"
              >
                <option value="hospital_record">Hospital Record</option>
                <option value="parent_id">Parent&apos;s ID</option>
                <option value="other">Other</option>
              </select>
              <button
                id="upload-btn"
                type="submit"
                disabled={uploading || !file}
                className="btn-primary flex-shrink-0"
              >
                {uploading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    Uploading…
                  </>
                ) : 'Upload'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ── Decision Panel — Ward Staff ── */}
      {user.role === 'ward_staff' && ['pending', 'under_review'].includes(application.status) && (
        <DecisionPanel
          id="ward-decision"
          title="Ward Review Decision"
          subtitle="Approve, reject, or forward this application to the district office."
          reason={reason}
          setReason={setReason}
          deciding={deciding}
          onApprove={() => handleDecision('approve')}
          onReject={() => handleDecision('reject')}
          onForward={() => handleDecision('forward')}
          showForward
        />
      )}

      {/* ── Decision Panel — District Staff ── */}
      {user.role === 'district_staff' && application.status === 'forwarded' && (
        <DecisionPanel
          id="district-decision"
          title="District Final Decision"
          subtitle="Make the final decision on this forwarded application."
          reason={reason}
          setReason={setReason}
          deciding={deciding}
          onApprove={() => handleDecision('approve')}
          onReject={() => handleDecision('reject')}
        />
      )}

      {/* ── Admin Override Panel ── */}
      {user.role === 'admin' && !['approved', 'rejected'].includes(application.status) && (
        <DecisionPanel
          id="admin-decision"
          title="Admin Override"
          subtitle="As admin, you can approve or reject this application at any stage."
          accent="orange"
          reason={reason}
          setReason={setReason}
          deciding={deciding}
          onApprove={() => handleDecision('approve')}
          onReject={() => handleDecision('reject')}
        />
      )}

      {/* ── Audit Log ── */}
      {isStaffOrAdmin && auditLogs.length > 0 && (
        <div className="card p-6 animate-slide-up delay-200">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-5">Audit Trail</h2>
          <div className="space-y-2">
            {auditLogs.map((log, i) => (
              <div key={log.id} className="relative flex gap-4 pl-2 timeline-item">
                <div className="w-8 h-8 rounded-full bg-brand-100 border-2 border-brand-200 flex items-center justify-center flex-shrink-0 text-sm">
                  {log.action === 'approve' ? '✅' : log.action === 'reject' ? '❌' : log.action === 'forward' ? '↗️' : '📝'}
                </div>
                <div className="pb-6 flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-700 capitalize">{log.action.replace('_', ' ')}</p>
                  {log.notes && <p className="text-xs text-slate-500 mt-0.5 italic">&ldquo;{log.notes}&rdquo;</p>}
                  <p className="text-xs text-slate-400 mt-1">{new Date(log.timestamp).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Document Preview Modal ── */}
      {previewDoc && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade-in"
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col animate-scale-in border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-2xl">{fileIcon(previewDoc.file_name)}</span>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-slate-800 truncate font-display">{previewDoc.file_name}</h3>
                  <p className="text-xs text-slate-500">
                    {DOC_TYPE_LABELS[previewDoc.document_type] || previewDoc.document_type}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <a
                  href={getDocUrl(previewDoc.file_path)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline text-xs py-1.5 px-3"
                  title="Open in new tab"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Open Original
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-colors text-sm font-bold"
                  aria-label="Close preview"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-auto flex-1 flex items-center justify-center bg-slate-950/5 min-h-[300px]">
              {isImageFile(previewDoc.file_name) ? (
                <div className="relative flex items-center justify-center w-full h-full max-h-[70vh]">
                  <img
                    src={getDocUrl(previewDoc.file_path)}
                    alt={previewDoc.file_name}
                    className="max-h-[70vh] max-w-full object-contain rounded-xl shadow-lg border border-slate-200/80 bg-white"
                  />
                </div>
              ) : previewDoc.file_name?.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={getDocUrl(previewDoc.file_path)}
                  title={previewDoc.file_name}
                  className="w-full h-[65vh] rounded-xl border border-slate-200 shadow-sm bg-white"
                />
              ) : (
                <div className="text-center py-12 px-6">
                  <div className="text-5xl mb-4">{fileIcon(previewDoc.file_name)}</div>
                  <p className="text-base font-semibold text-slate-700 mb-1">No inline preview available for this file format.</p>
                  <p className="text-xs text-slate-400 mb-6">You can open or download the original file directly in your browser.</p>
                  <a
                    href={getDocUrl(previewDoc.file_path)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary"
                  >
                    Open Document
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DecisionPanel({ id, title, subtitle, accent, reason, setReason, deciding, onApprove, onReject, onForward, showForward }) {
  const borderColor = accent === 'orange' ? 'border-orange-400' : 'border-brand-400'
  return (
    <div className={`card p-6 mb-5 border-l-4 ${borderColor} animate-slide-up delay-150`}>
      <h2 className="font-bold text-slate-800 font-display mb-0.5">{title}</h2>
      <p className="text-xs text-slate-400 mb-4">{subtitle}</p>

      <label className="label">Reason / Notes</label>
      <textarea
        id={`${id}-reason`}
        placeholder="Required when rejecting. Optional for approve/forward."
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="input mb-4 resize-none"
        rows={2}
      />

      <div className="flex flex-wrap gap-3">
        <button
          id={`${id}-approve`}
          disabled={deciding}
          onClick={onApprove}
          className="btn-success"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Approve
        </button>
        <button
          id={`${id}-reject`}
          disabled={deciding}
          onClick={onReject}
          className="btn-danger"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Reject
        </button>
        {showForward && (
          <button
            id={`${id}-forward`}
            disabled={deciding}
            onClick={onForward}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-violet-500 text-white font-semibold px-5 py-2.5 rounded-xl shadow-sm hover:from-violet-700 hover:to-violet-600 active:scale-95 transition-all duration-200 disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
            Forward to District
          </button>
        )}
      </div>
    </div>
  )
}
