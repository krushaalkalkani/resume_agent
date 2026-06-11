import { useRef } from 'react'
import { FileUp, PenLine, RefreshCw } from 'lucide-react'
import { Spinner } from '../Layout'

export default function OnboardingPanel({ onImportNotion, onImportJson, onError, busyNotion }) {
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
    <div className="mb-6 rounded-xl border border-teal-200 bg-gradient-to-br from-teal-50 to-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-[var(--color-ink)]">Welcome — let&apos;s build your resume</h2>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Your account is ready. Choose how you want to get started.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="card flex flex-col items-start gap-2 p-4 text-left transition hover:border-[var(--color-brand)]"
        >
          <FileUp className="h-5 w-5 text-[var(--color-brand)]" />
          <span className="font-medium text-[var(--color-ink)]">Upload JSON</span>
          <span className="text-xs text-[var(--color-muted)]">Import a saved resume file</span>
        </button>

        <button
          type="button"
          onClick={onImportNotion}
          disabled={busyNotion}
          className="card flex flex-col items-start gap-2 p-4 text-left transition hover:border-[var(--color-brand)] disabled:opacity-50"
        >
          {busyNotion ? <Spinner /> : <RefreshCw className="h-5 w-5 text-[var(--color-brand)]" />}
          <span className="font-medium text-[var(--color-ink)]">Import from Notion</span>
          <span className="text-xs text-[var(--color-muted)]">Pull from your connected database</span>
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
