import { Link, useLocation } from 'react-router-dom'
import { FileText, LogOut } from 'lucide-react'
import { useAuth } from './context/AuthContext'

const NAV = [
  { to: '/app', label: 'Editor' },
  { to: '/tailor', label: 'Tailor to job' },
]

export default function Layout({ children, actions, title, subtitle }) {
  const { pathname } = useLocation()
  const { supabaseEnabled, user, signOut } = useAuth()

  return (
    <div className="app-bg flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-brand)] text-white shadow-sm">
                <FileText className="h-4 w-4" />
              </span>
              <span className="font-semibold text-[var(--color-ink)]">Resume Agent</span>
            </Link>
            <nav className="hidden gap-1 sm:flex">
              {NAV.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={`rounded-lg px-3.5 py-2 text-sm font-medium transition ${
                    pathname === to
                      ? 'bg-[var(--color-brand-light)] text-[var(--color-brand-dark)]'
                      : 'text-[var(--color-muted)] hover:bg-slate-100 hover:text-[var(--color-ink)]'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {actions}
            {supabaseEnabled && user && (
              <>
                <span className="hidden text-sm text-[var(--color-muted)] sm:inline">{user.email}</span>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-[var(--color-muted)] hover:bg-slate-100"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6">
        {(title || subtitle) && (
          <div className="mb-6">
            {title && <h1 className="text-2xl font-bold tracking-tight text-[var(--color-ink)]">{title}</h1>}
            {subtitle && <p className="mt-1 text-sm text-[var(--color-muted)]">{subtitle}</p>}
          </div>
        )}
        {children}
      </main>
    </div>
  )
}

export function Btn({ children, onClick, disabled, variant = 'default', type = 'button', href, download }) {
  const styles = {
    default: 'border border-[var(--color-border)] bg-white text-[var(--color-ink)] hover:bg-slate-50 shadow-sm',
    primary: 'border border-[var(--color-brand)] bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-dark)] shadow-sm',
    ghost: 'text-[var(--color-muted)] hover:bg-slate-100 hover:text-[var(--color-ink)]',
  }

  const base = `inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${styles[variant]}`

  if (href) {
    return (
      <a href={href} download={download} className={`${base} ${disabled ? 'pointer-events-none opacity-50' : ''}`}>
        {children}
      </a>
    )
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={base}>
      {children}
    </button>
  )
}

export function Spinner() {
  return (
    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-teal-200 border-t-[var(--color-brand)]" />
  )
}

export function Alert({ children, type = 'error' }) {
  const cls = {
    error: 'bg-red-50 text-red-800 border-red-200',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    info: 'bg-sky-50 text-sky-800 border-sky-200',
  }[type]
  return <div className={`rounded-lg border px-4 py-3 text-sm ${cls}`}>{children}</div>
}

export function Badge({ children, variant = 'default' }) {
  const cls = variant === 'success'
    ? 'bg-emerald-100 text-emerald-800'
    : 'bg-slate-100 text-slate-700'
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {children}
    </span>
  )
}

export function Panel({ title, children, className = '' }) {
  return (
    <div className={`card flex flex-col p-5 ${className}`}>
      {title && <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">{title}</h2>}
      {children}
    </div>
  )
}
