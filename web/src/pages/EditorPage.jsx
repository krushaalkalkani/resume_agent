import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Download, Sparkles, ChevronUp, ChevronDown } from 'lucide-react'
import Layout, { Alert, Badge, Btn, Panel, Spinner } from '../Layout'
import OnboardingPanel from '../components/OnboardingPanel'
import { useAuth } from '../context/AuthContext'
import { getResume, generate, saveResume, warmApi } from '../api'
import { resumePdfFilename } from '../pdfFilename'
import { isResumeEmpty } from '../lib/resumeUtils'
import { useResumeArtifacts } from '../lib/useResumeArtifacts'

const SECTIONS = [
  { key: 'profile', label: 'Profile' },
  { key: 'education', label: 'Education' },
  { key: 'experience', label: 'Experience' },
  { key: 'projects', label: 'Projects' },
  { key: 'skills', label: 'Skills' },
  { key: 'certifications', label: 'Certs' },
  { key: 'leadership', label: 'Leadership' },
]

const FIELDS = {
  education: [['school', 'School'], ['degree', 'Degree'], ['major', 'Major'], ['location', 'Location'], ['date', 'Date'], ['gpa', 'GPA', 'number']],
  experience: [['company', 'Company'], ['role', 'Role'], ['date', 'Date'], ['location', 'Location']],
  projects: [['name', 'Project'], ['tech_stack', 'Tech stack'], ['date', 'Date'], ['github', 'GitHub'], ['demo', 'Demo URL']],
  skills: [['category', 'Category']],
  certifications: [['name', 'Certification'], ['provider', 'Provider']],
  leadership: [['title', 'Title'], ['organization', 'Organization'], ['location', 'Location'], ['date', 'Date']],
}

const ARRAY_FIELD = {
  education: ['coursework', 'Coursework (one per line)'],
  experience: ['bullets', 'Bullets (one per line)'],
  projects: ['bullets', 'Bullets (one per line)'],
  skills: ['skills', 'Skills (one per line)'],
}

const TEMPLATES = {
  education: { school: '', degree: '', major: '', location: '', date: '', gpa: null, coursework: [] },
  experience: { company: '', role: '', date: '', location: '', bullets: [] },
  projects: { name: '', tech_stack: '', date: '', github: '', demo: '', bullets: [] },
  skills: { category: '', skills: [] },
  certifications: { name: '', provider: '' },
  leadership: { title: '', organization: '', location: '', date: '' },
}

function cleanResume(r) {
  const c = structuredClone(r)
  for (const k of ['experience', 'projects']) c[k]?.forEach((it) => { it.bullets = (it.bullets || []).map((s) => s.trim()).filter(Boolean) })
  c.skills?.forEach((it) => { it.skills = (it.skills || []).map((s) => s.trim()).filter(Boolean) })
  c.education?.forEach((it) => { it.coursework = (it.coursework || []).map((s) => s.trim()).filter(Boolean) })
  return c
}

function Field({ label, value, onChange, type = 'text', rows }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-[var(--color-muted)]">{label}</span>
      {rows ? (
        <textarea rows={rows} value={value ?? ''} onChange={(e) => onChange(e.target.value)} className="input resize-y" />
      ) : (
        <input type={type} value={value ?? ''} onChange={(e) => onChange(e.target.value)} className="input" />
      )}
    </label>
  )
}

export default function EditorPage() {
  const { session, supabaseEnabled } = useAuth()
  const [resume, setResume] = useState(null)
  const [active, setActive] = useState('profile')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [report, setReport] = useState(null)
  const { previewSrc, pdfHref, load: loadArtifacts } = useResumeArtifacts()
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (supabaseEnabled && !session) return

    let cancelled = false
    setLoading(true)
    setError(null)

    warmApi()
      .then(() => getResume())
      .then((data) => { if (!cancelled) setResume(data) })
      .catch((e) => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [session, supabaseEnabled])

  const updateProfile = (f, v) => setResume((r) => ({ ...r, profile: { ...r.profile, [f]: v } }))
  const setList = (k, items) => setResume((r) => ({ ...r, [k]: items }))
  const updateItem = (k, i, f, v) => setList(k, resume[k].map((it, idx) => (idx === i ? { ...it, [f]: v } : it)))
  const addItem = (k) => setList(k, [...(resume[k] || []), structuredClone(TEMPLATES[k])])
  const removeItem = (k, i) => setList(k, resume[k].filter((_, idx) => idx !== i))
  const moveItem = (k, i, dir) => {
    const j = i + dir
    if (j < 0 || j >= resume[k].length) return
    const next = resume[k].slice()
    ;[next[i], next[j]] = [next[j], next[i]]
    setList(k, next)
  }

  async function onGenerate() {
    setGenerating(true); setError(null)
    try {
      const data = await generate(cleanResume(resume))
      setReport(data)
      if (data.ok) await loadArtifacts('master')
      else setError(data.log ? `PDF compilation failed: ${data.log}` : 'PDF compilation failed.')
    } catch (e) { setError(e.message) } finally { setGenerating(false) }
  }

  async function onImportJson(data) {
    setError(null)
    try {
      await saveResume(cleanResume(data))
      setResume(data)
    } catch (e) {
      setError(e.message || 'Invalid JSON file. Use a resume.json export from this app.')
    }
  }

  async function onSave() {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      await saveResume(cleanResume(resume))
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="app-bg flex min-h-screen flex-col items-center justify-center gap-2">
        <Spinner />
        <p className="text-sm text-[var(--color-muted)]">Connecting to API…</p>
      </div>
    )
  }

  if (!resume) {
    return (
      <div className="app-bg flex min-h-screen flex-col items-center justify-center gap-3 p-4 text-center">
        <Alert>
          {error || 'Could not load resume. Make sure the API is running on port 8000.'}
        </Alert>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="text-sm text-[var(--color-brand)] hover:underline"
          >
            Retry
          </button>
          <Link to="/login" className="text-sm text-[var(--color-brand)] hover:underline">Sign in again</Link>
          <Link to="/" className="text-sm text-[var(--color-muted)] hover:underline">Home</Link>
        </div>
      </div>
    )
  }

  const hasPDF = report?.ok && previewSrc && pdfHref
  const pdfFilename = report?.pdf_filename || resumePdfFilename(resume.profile)
  const meta = SECTIONS.find((s) => s.key === active)
  const items = resume[active] || []
  const fields = FIELDS[active]
  const arr = ARRAY_FIELD[active]
  const count = (k) => (resume[k] || []).length

  return (
    <Layout
      title="Resume editor"
      subtitle="Edit your data, then generate a one-page PDF."
      actions={
        <>
          <Btn href={hasPDF ? pdfHref : undefined} download={hasPDF ? pdfFilename : undefined} disabled={!hasPDF}>
            <Download className="h-4 w-4" /> PDF
          </Btn>
          <Btn onClick={onSave} disabled={saving}>
            {saving ? <Spinner /> : null}
            {saved ? 'Saved' : 'Save'}
          </Btn>
          <Btn variant="primary" onClick={onGenerate} disabled={generating}>
            {generating ? <Spinner /> : <Sparkles className="h-4 w-4" />}
            Generate
          </Btn>
        </>
      }
    >
      {error && <div className="mb-4"><Alert>{error}</Alert></div>}

      {isResumeEmpty(resume) && (
        <OnboardingPanel
          onImportJson={onImportJson}
          onError={setError}
        />
      )}

      <div className="grid flex-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="mb-4 flex flex-wrap gap-2">
            {SECTIONS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setActive(s.key)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                  active === s.key
                    ? 'bg-[var(--color-brand)] text-[#06080c]'
                    : 'border border-[var(--color-border)] bg-white/5 text-[var(--color-muted)] hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]'
                }`}
              >
                {s.label}
                {s.key !== 'profile' && (
                  <span className={`ml-1.5 text-xs ${active === s.key ? 'text-[#06080c]/70' : 'text-[var(--color-faint)]'}`}>
                    {count(s.key)}
                  </span>
                )}
              </button>
            ))}
          </div>

          <Panel>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[var(--color-ink)]">{meta.label}</h3>
              {meta.key !== 'profile' && (
                <Btn onClick={() => addItem(active)}>
                  <Plus className="h-4 w-4" /> Add
                </Btn>
              )}
            </div>

            {active === 'profile' ? (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="First name" value={resume.profile.first_name} onChange={(v) => updateProfile('first_name', v)} />
                  <Field label="Last name" value={resume.profile.last_name} onChange={(v) => updateProfile('last_name', v)} />
                  <Field label="Email" value={resume.profile.email} onChange={(v) => updateProfile('email', v)} />
                  <Field label="Phone" value={resume.profile.phone} onChange={(v) => updateProfile('phone', v)} />
                  <Field label="Location" value={resume.profile.location} onChange={(v) => updateProfile('location', v)} />
                  <Field label="LinkedIn" value={resume.profile.linkedin} onChange={(v) => updateProfile('linkedin', v)} />
                  <Field label="GitHub" value={resume.profile.github} onChange={(v) => updateProfile('github', v)} />
                  <Field label="Portfolio" value={resume.profile.portfolio} onChange={(v) => updateProfile('portfolio', v)} />
                </div>
                <Field label="Summary" value={resume.profile.summary} onChange={(v) => updateProfile('summary', v)} rows={3} />
              </div>
            ) : items.length === 0 ? (
              <p className="py-8 text-center text-sm text-[var(--color-muted)]">
                No entries yet — click <strong>Add</strong> to create one.
              </p>
            ) : (
              <div className="space-y-4">
                {items.map((it, i) => (
                  <div key={i} className="rounded-xl border border-[var(--color-border)] bg-white/[0.03] p-4">
                    <div className="mb-3 flex items-center justify-between border-b border-[var(--color-border)] pb-2">
                      <span className="font-medium text-[var(--color-ink)]">{it[fields[0][0]] || `Entry ${i + 1}`}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveItem(active, i, -1)}
                          disabled={i === 0}
                          title="Move up"
                          aria-label="Move up"
                          className="rounded p-1 text-[var(--color-muted)] hover:bg-white/5 hover:text-[var(--color-brand)] disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveItem(active, i, 1)}
                          disabled={i === items.length - 1}
                          title="Move down"
                          aria-label="Move down"
                          className="rounded p-1 text-[var(--color-muted)] hover:bg-white/5 hover:text-[var(--color-brand)] disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={() => removeItem(active, i)} className="ml-2 text-xs font-medium text-[#e88] hover:underline">
                          Remove
                        </button>
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {fields.map(([k, label, type]) => (
                        <Field
                          key={k}
                          label={label}
                          type={type}
                          value={it[k]}
                          onChange={(v) => updateItem(active, i, k, type === 'number' ? (v === '' ? null : Number(v)) : v)}
                        />
                      ))}
                      {arr && (
                        <div className="sm:col-span-2">
                          <Field
                            label={arr[1]}
                            rows={4}
                            value={(it[arr[0]] || []).join('\n')}
                            onChange={(v) => updateItem(active, i, arr[0], v.split('\n'))}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>

        <div className="lg:col-span-2">
          <Panel title="Live preview" className="sticky top-20">
            {report?.ok && (
              <div className="mb-3 flex flex-wrap gap-2">
                <Badge>{report.pages} page{report.pages !== 1 ? 's' : ''}</Badge>
                {report.passed && <Badge variant="success">All sections present</Badge>}
              </div>
            )}
            {hasPDF ? (
              <a href={pdfHref} target="_blank" rel="noreferrer" className="block">
                <img src={previewSrc} alt="Resume preview" className="preview-img w-full" />
              </a>
            ) : (
              <div className="flex aspect-[8.5/11] flex-col items-center justify-center rounded-lg border border-dashed border-[var(--color-border)] bg-white/[0.02] text-center">
                <Sparkles className="mb-2 h-8 w-8 text-[var(--color-faint)]" />
                <p className="text-sm text-[var(--color-muted)]">Hit <strong>Generate</strong> to preview your PDF</p>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </Layout>
  )
}
