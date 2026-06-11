import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="app-bg flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold">Page not found</h1>
      <Link to="/" className="rounded-lg bg-[var(--color-brand)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-brand-dark)]">
        Go home
      </Link>
    </div>
  )
}
