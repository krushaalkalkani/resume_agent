import { Link } from 'react-router-dom'
import { ArrowLeft, Sparkles } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="bp-grid relative flex min-h-screen flex-col items-center justify-center px-6 text-ink">
      <div className="pointer-events-none fixed inset-2.5 border border-ink/20" />
      <div className="bp-panel relative px-10 py-12 text-center">
        <span className="absolute -left-px -top-px h-3 w-3 border-l border-t border-ink" />
        <span className="absolute -right-px -top-px h-3 w-3 border-r border-t border-ink" />
        <span className="absolute -bottom-px -left-px h-3 w-3 border-b border-l border-ink" />
        <span className="absolute -bottom-px -right-px h-3 w-3 border-b border-r border-ink" />
        <span className="bp-label">Error · 404 — sheet not found</span>
        <h1 className="mt-4 font-display text-7xl font-extrabold leading-none">404</h1>
        <p className="mt-4 text-ink-muted">This sheet isn’t in the drawing set.</p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link to="/" className="bp-btn bp-btn-primary bp-btn-md"><ArrowLeft className="h-3.5 w-3.5" /> Home</Link>
          <Link to="/app" className="bp-btn bp-btn-ghost bp-btn-md"><Sparkles className="h-3.5 w-3.5" /> Open builder</Link>
        </div>
      </div>
    </div>
  )
}
