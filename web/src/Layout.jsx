import { Link, useLocation } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from './context/AuthContext'
import { Brand } from './components/Marketing'

const NAV = [
  { to: '/app', label: 'Editor' },
  { to: '/tailor', label: 'Tailor to job' },
]

export default function Layout({ children, actions, title, subtitle }) {
  const { pathname } = useLocation()
  const { supabaseEnabled, user, signOut } = useAuth()

  return (
    <div className="app-bg flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-[var(--color-border)] backdrop-blur-xl" style={{ background: 'rgba(6,8,12,.6)' }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-8">
            <Brand size={30} />
            <nav className="hidden gap-1 sm:flex">
              {NAV.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={`rounded-lg px-3.5 py-2 text-sm font-medium transition ${
                    pathname === to
                      ? 'bg-[var(--color-brand-light)] text-[var(--color-brand)]'
                      : 'text-[var(--color-muted)] hover:bg-white/5 hover:text-[var(--color-ink)]'
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
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-[var(--color-muted)] transition hover:bg-white/5 hover:text-[var(--color-ink)]"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-7 sm:px-6">
        {(title || subtitle) && (
          <div className="mb-6">
            {title && <h1 className="font-display text-[26px] font-semibold tracking-tight text-[var(--color-ink)]">{title}</h1>}
            {subtitle && <p className="mt-1.5 text-sm text-[var(--color-muted)]">{subtitle}</p>}
          </div>
        )}
        {children}
      </main>
    </div>
  )
}

export function Btn({ children, onClick, disabled, variant = 'default', type = 'button', href, download }) {
  const cls = {
    default: 'btn btn-line',
    primary: 'btn btn-grad',
    ghost: 'btn btn-ghost',
  }[variant]

  if (href) {
    return (
      <a href={href} download={download} className={`${cls} ${disabled ? 'pointer-events-none opacity-50' : ''}`}>
        {children}
      </a>
    )
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  )
}

export function Spinner() {
  return (
    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-[var(--color-brand)]" />
  )
}

export function Alert({ children, type = 'error' }) {
  const cls = {
    error: 'border-[rgba(226,75,74,.4)] bg-[rgba(226,75,74,.12)] text-[#f0a0a0]',
    success: 'border-[rgba(46,230,197,.4)] bg-[rgba(46,230,197,.1)] text-[var(--color-brand)]',
    info: 'border-[rgba(124,108,255,.4)] bg-[rgba(124,108,255,.12)] text-[#bcb4ff]',
  }[type]
  return <div className={`rounded-xl border px-4 py-3 text-sm ${cls}`}>{children}</div>
}

export function Badge({ children, variant = 'default' }) {
  const cls = variant === 'success'
    ? 'border border-[rgba(46,230,197,.4)] bg-[rgba(46,230,197,.1)] text-[var(--color-brand)]'
    : 'border border-[var(--color-border)] bg-white/5 text-[var(--color-muted)]'
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {children}
    </span>
  )
}

export function Panel({ title, children, className = '' }) {
  return (
    <div className={`card flex flex-col p-5 ${className}`}>
      {title && <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">{title}</h2>}
      {children}
    </div>
  )
}
