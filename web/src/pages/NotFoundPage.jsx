import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import GenerativeBg from '../components/GenerativeBg'
import { Brand } from '../components/Marketing'

export default function NotFoundPage() {
  return (
    <div className="app-bg flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <GenerativeBg className="pointer-events-none absolute inset-0 z-0 opacity-40" style={{ height: '100%', width: '100%' }} />
      <div className="relative z-10 flex flex-col items-center gap-6">
        <Brand />
        <div className="grad-text font-display text-[clamp(64px,14vw,140px)] font-semibold leading-none">404</div>
        <p className="max-w-sm text-[var(--color-muted)]">This page wandered off. Let's get you back to building resumes.</p>
        <Link to="/" className="btn btn-grad">Go home <ArrowRight className="h-4 w-4" /></Link>
      </div>
    </div>
  )
}
