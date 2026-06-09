import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, Sparkles, RefreshCw, Download, Plus, FileText, ZoomIn,
  User, GraduationCap, Briefcase, FolderGit2, Wrench, Award, Users,
  Mail, Phone, MapPin, Globe, Link2,
} from 'lucide-react'
import { Field, Area, Btn, Card, Spinner, StatusBadge, Logo } from '../ui'
import { getResume, generate, fetchNotion } from '../api'
import { resumePdfFilename } from '../pdfFilename'

// ── Section config ──────────────────────────────────────────────
const SECTIONS = [
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'education', label: 'Education', icon: GraduationCap, list: true, single: 'education' },
  { key: 'experience', label: 'Experience', icon: Briefcase, list: true, single: 'role' },
  { key: 'projects', label: 'Projects', icon: FolderGit2, list: true, single: 'project' },
  { key: 'skills', label: 'Skills', icon: Wrench, list: true, single: 'category' },
  { key: 'certifications', label: 'Certifications', icon: Award, list: true, single: 'certification' },
  { key: 'leadership', label: 'Leadership', icon: Users, list: true, single: 'role' },
]

const FIELDS = {
  education: [['school', 'School / Institution'], ['degree', 'Degree'], ['major', 'Major'],
    ['location', 'Location'], ['date', 'Date'], ['gpa', 'GPA (/4)', 'number']],
  experience: [['company', 'Company'], ['role', 'Role'], ['date', 'Date'], ['location', 'Location']],
  projects: [['name', 'Project'], ['tech_stack', 'Tech stack'], ['date', 'Date'],
    ['github', 'GitHub URL'], ['demo', 'Live demo URL']],
  skills: [['category', 'Category']],
  certifications: [['name', 'Certification'], ['provider', 'Provider']],
  leadership: [['title', 'Title'], ['organization', 'Organization'], ['location', 'Location'], ['date', 'Date']],
}

// list sections whose items carry a string[] field, edited one-per-line
const ARRAY_FIELD = {
  education: ['coursework', 'Relevant coursework (one per line)'],
  experience: ['bullets', 'Bullet points (one per line)'],
  projects: ['bullets', 'Bullet points (one per line)'],
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

// strip empty array entries before sending to the backend
function cleanResume(r) {
  const c = structuredClone(r)
  for (const k of ['experience', 'projects']) c[k]?.forEach((it) => { it.bullets = (it.bullets || []).map((s) => s.trim()).filter(Boolean) })
  c.skills?.forEach((it) => { it.skills = (it.skills || []).map((s) => s.trim()).filter(Boolean) })
  c.education?.forEach((it) => { it.coursework = (it.coursework || []).map((s) => s.trim()).filter(Boolean) })
  return c
}

export default function EditorPage() {
  const [resume, setResume] = useState(null)
  const [active, setActive] = useState('profile')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [busyNotion, setBusyNotion] = useState(false)
  const [report, setReport] = useState(null)
  const [previewTs, setPreviewTs] = useState(0)
  const [error, setError] = useState(null)

  useEffect(() => {
    getResume().then(setResume).catch((e) => setError(e.message)).finally(() => setLoading(false))
  }, [])

  // ── mutations ──
  const updateProfile = (f, v) => setResume((r) => ({ ...r, profile: { ...r.profile, [f]: v } }))
  const setList = (k, items) => setResume((r) => ({ ...r, [k]: items }))
  const updateItem = (k, i, f, v) => setList(k, resume[k].map((it, idx) => (idx === i ? { ...it, [f]: v } : it)))
  const addItem = (k) => setList(k, [...(resume[k] || []), structuredClone(TEMPLATES[k])])
  const removeItem = (k, i) => setList(k, resume[k].filter((_, idx) => idx !== i))
  const moveItem = (k, i, dir) => {
    const a = [...resume[k]]; const j = i + dir
    if (j < 0 || j >= a.length) return
    ;[a[i], a[j]] = [a[j], a[i]]; setList(k, a)
  }

  async function onGenerate() {
    setGenerating(true); setError(null)
    try {
      const data = await generate(cleanResume(resume))
      setReport(data)
      if (data.ok) setPreviewTs(Date.now())
      else setError('Compilation failed — see details below.')
    } catch (e) { setError(e.message) } finally { setGenerating(false) }
  }

  async function onFetchNotion() {
    setBusyNotion(true); setError(null)
    try { setResume(await fetchNotion()) }
    catch (e) { setError(e.message) } finally { setBusyNotion(false) }
  }

  // ── loading / error gates ──
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface text-ink-muted">
        <Spinner className="h-6 w-6" />
      </div>
    )
  }
  if (!resume) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-surface">
        <StatusBadge variant="danger">Couldn’t load resume data. Is the API running on :8000?</StatusBadge>
        <Link to="/"><Btn variant="default"><ArrowLeft className="h-4 w-4" /> Home</Btn></Link>
      </div>
    )
  }

  const count = (k) => (resume[k] || []).length
  const hasPDF = previewTs > 0 && report?.ok
  const pdfFilename = report?.pdf_filename || resumePdfFilename(resume.profile)

  return (
    <div className="flex h-screen flex-col bg-surface">
      {/* ── dark toolbar ── */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-landing-border bg-landing px-4">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex h-8 w-8 items-center justify-center rounded-lg text-landing-muted transition hover:bg-white/5 hover:text-landing-text">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <Logo dark />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onFetchNotion} disabled={busyNotion}
            className="btn-workspace btn-workspace-ghost btn-workspace-md">
            {busyNotion ? <Spinner className="h-3.5 w-3.5" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Fetch from Notion
          </button>
          <a href={hasPDF ? '/api/pdf' : undefined} download={hasPDF ? pdfFilename : undefined}
            className={`btn-workspace btn-workspace-ghost btn-workspace-md ${hasPDF ? '' : 'pointer-events-none opacity-40'}`}>
            <Download className="h-3.5 w-3.5" /> PDF
          </a>
          <button onClick={onGenerate} disabled={generating}
            className="btn-workspace btn-workspace-primary btn-workspace-md">
            {generating ? <Spinner className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
            {generating ? 'Generating…' : 'Generate'}
          </button>
        </div>
      </header>

      {/* ── body ── */}
      <div className="flex min-h-0 flex-1">
        {/* sidebar */}
        <nav className="w-56 shrink-0 space-y-1 overflow-y-auto border-r border-border bg-surface-raised p-3">
          {SECTIONS.map(({ key, label, icon: Icon, list }) => (
            <button key={key} onClick={() => setActive(key)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition
                ${active === key ? 'bg-accent-soft text-accent' : 'text-ink-muted hover:bg-surface hover:text-ink'}`}>
              <Icon className="h-4 w-4" />
              {label}
              {list && (
                <span className={`ml-auto rounded-md px-1.5 py-0.5 font-mono text-[10px]
                  ${active === key ? 'bg-accent/15 text-accent' : 'bg-border-subtle text-ink-faint'}`}>
                  {count(key)}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* editor canvas */}
        <main className="editor-scroll bp-grid min-w-0 flex-[1_1_36%] overflow-y-auto px-6 py-8 lg:px-8">
          <div className="mx-auto w-full max-w-xl">
            <SectionEditor
              active={active} resume={resume}
              updateProfile={updateProfile} updateItem={updateItem}
              addItem={addItem} removeItem={removeItem} moveItem={moveItem}
            />
          </div>
        </main>

        {/* preview — wider panel so the rendered page is easy to read */}
        <aside className="editor-scroll flex flex-[1_1_44%] min-w-[min(100%,520px)] max-w-[760px] flex-col overflow-y-auto border-l border-border bg-surface-raised p-4 lg:p-5">
          <div className="mb-3 flex shrink-0 items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-sm font-bold text-ink">Live preview</h3>
              {report && report.ok && (
                <p className="mt-0.5 font-mono text-[11px] text-ink-faint">
                  {report.pages}/{report.max_pages} page · click preview to open PDF
                </p>
              )}
            </div>
            {hasPDF && (
              <a href="/api/pdf" download={pdfFilename}
                className="btn-workspace btn-workspace-ghost btn-workspace-sm shrink-0 !border-border !bg-surface !text-ink-muted hover:!text-ink">
                <Download className="h-3.5 w-3.5" /> Download PDF
              </a>
            )}
          </div>

          {error && <div className="mb-3 shrink-0"><StatusBadge variant="danger">{error}</StatusBadge></div>}
          {report?.ok === false && report.log && (
            <pre className="mb-3 max-h-40 shrink-0 overflow-auto rounded-xl bg-ink/95 p-3 font-mono text-[10px] leading-relaxed text-red-300">
              {report.log.slice(-900)}
            </pre>
          )}
          {report?.ok && (
            <div className="mb-3 shrink-0">
              {report.passed
                ? <StatusBadge variant="success">✓ One page · all sections present</StatusBadge>
                : <StatusBadge variant="warn">⚠ {report.pages > report.max_pages ? `${report.pages} pages — trim content` : `missing: ${report.missing.join(', ')}`}</StatusBadge>}
            </div>
          )}

          <div className="preview-stage min-h-0 flex-1">
            {hasPDF ? (
              <a href="/api/pdf" target="_blank" rel="noreferrer"
                className="preview-frame group block h-full"
                title={`Open ${pdfFilename}`}>
                <img src={`/api/preview.png?t=${previewTs}`} alt="Resume preview"
                  className="preview-image" />
                <span className="preview-zoom-hint">
                  <ZoomIn className="h-4 w-4" />
                  View full size
                </span>
              </a>
            ) : (
              <div className="flex h-full min-h-[min(72vh,820px)] w-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-surface text-center">
                <FileText className="h-10 w-10 text-ink-faint" />
                <p className="max-w-xs px-6 text-sm text-ink-faint">
                  Hit <span className="font-semibold text-ink-muted">Generate</span> to render your résumé PDF here.
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}

// ── titled group panel ──────────────────────────────────────────
function Group({ title, children }) {
  return (
    <div className="mb-5">
      <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
        <span className="h-px w-4 bg-ink-faint/50" />{title}
      </div>
      <div className="border border-ink bg-surface-raised p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
      </div>
    </div>
  )
}

// ── per-section editor ──────────────────────────────────────────
function SectionEditor({ active, resume, updateProfile, updateItem, addItem, removeItem, moveItem }) {
  const meta = SECTIONS.find((s) => s.key === active)

  if (active === 'profile') {
    const p = resume.profile
    const initials = `${(p.first_name || '')[0] || ''}${(p.last_name || '')[0] || ''}`.toUpperCase()
    const fullName = `${p.first_name || ''} ${p.last_name || ''}`.trim()
    return (
      <div>
        <h2 className="mb-1 font-display text-2xl font-bold text-ink">Profile</h2>
        <p className="mb-6 text-sm text-ink-muted">This becomes the header of your résumé — who you are and how to reach you.</p>

        {/* identity card with live preview */}
        <div className="mb-5 border border-ink bg-surface-raised">
          <div className="flex items-center gap-4 border-b border-border-subtle p-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center bg-ink font-display text-xl font-bold text-paper">
              {initials || '–'}
            </div>
            <div className="min-w-0">
              <div className="truncate font-display text-lg font-bold text-ink">{fullName || 'Your name'}</div>
              <div className="truncate text-sm text-ink-faint">{p.email || 'Add your contact details below'}</div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
            <Field icon={User} label="First name" value={p.first_name} onChange={(v) => updateProfile('first_name', v)} placeholder="Krushal" />
            <Field icon={User} label="Last name" value={p.last_name} onChange={(v) => updateProfile('last_name', v)} placeholder="Kalkani" />
          </div>
        </div>

        <Group title="Contact">
          <Field icon={Mail} label="Email" value={p.email} onChange={(v) => updateProfile('email', v)} placeholder="you@email.com" />
          <Field icon={Phone} label="Phone" value={p.phone} onChange={(v) => updateProfile('phone', v)} placeholder="(000) 000 0000" />
          <div className="sm:col-span-2">
            <Field icon={MapPin} label="Location" value={p.location} onChange={(v) => updateProfile('location', v)} placeholder="City, State" />
          </div>
        </Group>

        <Group title="Links">
          <Field icon={Link2} label="LinkedIn" value={p.linkedin} onChange={(v) => updateProfile('linkedin', v)} placeholder="linkedin.com/in/you" />
          <Field icon={Link2} label="GitHub" value={p.github} onChange={(v) => updateProfile('github', v)} placeholder="github.com/you" />
          <div className="sm:col-span-2">
            <Field icon={Globe} label="Portfolio" value={p.portfolio} onChange={(v) => updateProfile('portfolio', v)} placeholder="yoursite.com" />
          </div>
        </Group>

        <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
          <span className="h-px w-4 bg-ink-faint/50" />Summary
        </div>
        <div className="border border-ink bg-surface-raised p-5">
          <Area label="A short headline" hint="optional" rows={3} value={p.summary}
            onChange={(v) => updateProfile('summary', v)}
            placeholder="e.g. ML/GenAI engineer who ships end-to-end — from data to deployed app." />
        </div>
      </div>
    )
  }

  const items = resume[active] || []
  const fields = FIELDS[active]
  const arr = ARRAY_FIELD[active]

  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="mb-1 font-display text-2xl font-bold text-ink">{meta.label}</h2>
          <p className="text-sm text-ink-muted">{items.length} {items.length === 1 ? 'entry' : 'entries'}</p>
        </div>
        <Btn variant="primary" size="sm" onClick={() => addItem(active)}>
          <Plus className="h-4 w-4" /> Add {meta.single}
        </Btn>
      </div>

      {items.length === 0 ? (
        <div className="border border-dashed border-ink/40 bg-surface-raised p-10 text-center text-sm text-ink-faint">
          No entries yet — click <span className="font-semibold text-ink-muted">Add {meta.single}</span>.
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((it, i) => (
            <Card key={i} index={i} title={it[fields[0][0]] || `${meta.label} ${i + 1}`}
              onUp={() => moveItem(active, i, -1)} onDown={() => moveItem(active, i, 1)}
              onRemove={() => removeItem(active, i)}>
              {fields.map(([k, label, type]) => (
                <Field key={k} label={label} type={type} value={it[k]}
                  onChange={(v) => updateItem(active, i, k, type === 'number' ? (v === '' ? null : Number(v)) : v)} />
              ))}
              {arr && (
                <div className="sm:col-span-2">
                  <Area label={arr[1]} rows={4}
                    value={(it[arr[0]] || []).join('\n')}
                    onChange={(v) => updateItem(active, i, arr[0], v.split('\n'))} />
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
