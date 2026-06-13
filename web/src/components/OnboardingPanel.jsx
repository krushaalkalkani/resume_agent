import { useRef } from 'react'
import { FileUp, PenLine } from 'lucide-react'

export default function OnboardingPanel({ onImportJson, onError }) {
  const fileRef = useRef(null)

  async function onFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    try {
      const data = JSON.parse(await file.text())
      await onImportJson(data)
    } catch (err) {
      onError?.(err.message || 'Invalid JSON file. Use a resume.json export from this app.')
    }
  }

  return (
    <div className="mb-6 rounded-2xl border border-[rgba(46,230,197,.35)] p-6" style={{ background: 'linear-gradient(160deg, rgba(46,230,197,.10), transparent)' }}>
      <h2 className="text-lg font-semibold text-[var(--color-ink)]">Welcome — let&apos;s build your resume</h2>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Your account is ready. Choose how you want to get started.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="card flex flex-col items-start gap-2 p-4 text-left transition hover:border-[var(--color-brand)]"
        >
          <FileUp className="h-5 w-5 text-[var(--color-brand)]" />
          <span className="font-medium text-[var(--color-ink)]">Upload JSON</span>
          <span className="text-xs text-[var(--color-muted)]">Import a saved resume file</span>
        </button>

        <div className="card flex flex-col items-start gap-2 p-4">
          <PenLine className="h-5 w-5 text-[var(--color-brand)]" />
          <span className="font-medium text-[var(--color-ink)]">Start from scratch</span>
          <span className="text-xs text-[var(--color-muted)]">Fill in Profile below, then add sections</span>
        </div>
      </div>

      <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={onFileChange} />
    </div>
  )
}
