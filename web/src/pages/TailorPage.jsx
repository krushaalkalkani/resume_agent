import { useEffect, useState } from 'react'
import { Sparkles, Download, Target, History } from 'lucide-react'
import Layout, { Alert, Badge, Btn, Panel, Spinner } from '../Layout'
import { tailorToJob, listTailored, regenerateTailored } from '../api'
import { resumePdfFilename } from '../pdfFilename'
import { useResumeArtifacts } from '../lib/useResumeArtifacts'

const EXAMPLE = `Frontend Engineer — React, TypeScript, CSS

Build responsive web apps with React, JavaScript/TypeScript, HTML/CSS, REST APIs,
and accessible component-driven UI.`

function formatDate(value) {
  if (!value) return ''
  try {
    return new Date(value).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return value
  }
}

export default function TailorPage() {
  const [jd, setJd] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const { previewSrc, pdfHref, load: loadArtifacts } = useResumeArtifacts()
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [activeEntryId, setActiveEntryId] = useState(null)

  const summary = result?.summary
  const hasPDF = result?.pdf?.ok && previewSrc && pdfHref
  const pdfFilename = result?.pdf_filename || resumePdfFilename(result?.resume?.profile)

  useEffect(() => {
    listTailored()
      .then((data) => setHistory(data.items || []))
      .catch(() => setHistory([]))
      .finally(() => setLoadingHistory(false))
  }, [])

  async function onTailor() {
    if (!jd.trim()) {
      setError('Paste a job description first.')
      return
    }
    setBusy(true)
    setError(null)
    setResult(null)
    setActiveEntryId(null)
    try {
      const data = await tailorToJob({ job_description: jd, generate_pdf: true })
      setResult(data)
      setActiveEntryId(data.entry_id || null)
      if (data.pdf?.ok) await loadArtifacts('tailored')
      else setError('Tailoring worked but PDF failed to compile.')
      const refreshed = await listTailored()
      setHistory(refreshed.items || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function onOpenHistory(entryId) {
    setBusy(true)
    setError(null)
    try {
      const pdf = await regenerateTailored(entryId)
      setActiveEntryId(entryId)
      setResult({ pdf, pdf_filename: pdf.pdf_filename })
      if (pdf.ok) await loadArtifacts('tailored')
      else setError('Could not rebuild PDF for this version.')
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Layout
      title="Tailor to job"
      subtitle="Paste a job description — Claude reorders your experience, projects, and skills for that role."
      actions={
        <>
          <Btn
            href={hasPDF ? pdfHref : undefined}
            download={hasPDF ? pdfFilename : undefined}
            disabled={!hasPDF}
          >
            <Download className="h-4 w-4" /> PDF
          </Btn>
          <Btn variant="primary" onClick={onTailor} disabled={busy}>
            {busy ? <Spinner /> : <Sparkles className="h-4 w-4" />}
            {busy ? 'Working…' : 'Tailor & generate'}
          </Btn>
        </>
      }
    >
      <div className="grid flex-1 gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Panel>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[var(--color-muted)]">Job description</span>
              <textarea
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                rows={16}
                placeholder="Paste the full job posting here…"
                className="input min-h-[320px] resize-y leading-relaxed"
              />
            </label>
            <button type="button" onClick={() => setJd(EXAMPLE)} className="mt-2 text-sm text-[var(--color-brand)] hover:underline">
              Load example
            </button>
            {error && <div className="mt-4"><Alert>{error}</Alert></div>}
          </Panel>

          <Panel title="Past tailored versions">
            {loadingHistory ? (
              <div className="flex items-center gap-2 py-4 text-sm text-[var(--color-muted)]">
                <Spinner /> Loading history…
              </div>
            ) : history.length === 0 ? (
              <p className="py-4 text-sm text-[var(--color-muted)]">
                Tailored versions you generate will appear here.
              </p>
            ) : (
              <ul className="divide-y divide-[var(--color-border)]">
                {history.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-[var(--color-ink)]">
                        {item.job_focus || 'Tailored resume'}
                      </div>
                      <div className="text-xs text-[var(--color-muted)]">{formatDate(item.created_at)}</div>
                    </div>
                    <Btn
                      variant={activeEntryId === item.id ? 'primary' : 'default'}
                      onClick={() => onOpenHistory(item.id)}
                      disabled={busy}
                    >
                      <History className="h-4 w-4" />
                      View
                    </Btn>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <Panel title="Result">
          {busy && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-[var(--color-muted)]">
              <Spinner />
              <p className="text-sm">Matching your resume to the job…</p>
            </div>
          )}

          {!busy && !result && (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <Target className="h-10 w-10 text-[var(--color-faint)]" />
              <p className="text-sm text-[var(--color-muted)]">Your tailored PDF appears here</p>
            </div>
          )}

          {result && !busy && (
            <div className="space-y-4">
              {summary && (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-[var(--color-ink)]">{summary.job_focus || 'Tailored resume'}</span>
                    {summary.tailored
                      ? <Badge variant="success">Tailored</Badge>
                      : <Badge>No changes needed</Badge>}
                  </div>

                  {summary.notes && (
                    <p className="rounded-lg border border-[var(--color-border)] bg-white/5 p-3 text-sm leading-relaxed text-[var(--color-muted)]">
                      {summary.notes}
                    </p>
                  )}

                  {(summary.experience_order?.length > 0 || summary.project_order?.length > 0) && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {summary.experience_order?.length > 0 && (
                        <div className="rounded-lg border border-[var(--color-border)] p-3">
                          <div className="mb-2 text-xs font-semibold uppercase text-[var(--color-muted)]">Experience order</div>
                          <ol className="list-decimal space-y-0.5 pl-4 text-sm">
                            {summary.experience_order.map((n) => <li key={n}>{n}</li>)}
                          </ol>
                        </div>
                      )}
                      {summary.project_order?.length > 0 && (
                        <div className="rounded-lg border border-[var(--color-border)] p-3">
                          <div className="mb-2 text-xs font-semibold uppercase text-[var(--color-muted)]">Project order</div>
                          <ol className="list-decimal space-y-0.5 pl-4 text-sm">
                            {summary.project_order.map((n) => <li key={n}>{n}</li>)}
                          </ol>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {hasPDF ? (
                <a href={pdfHref} target="_blank" rel="noreferrer" className="block">
                  <img src={previewSrc} alt="Tailored resume" className="preview-img w-full" />
                </a>
              ) : (
                <p className="text-sm text-[var(--color-muted)]">PDF preview not available.</p>
              )}
            </div>
          )}
        </Panel>
      </div>
    </Layout>
  )
}
