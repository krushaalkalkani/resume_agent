import { Link, NavLink } from 'react-router-dom'
import { ArrowRight, FileText } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export function Logo({ size = 32 }) {
  return (
    <span
      className="grid place-items-center rounded-[9px]"
      style={{
        width: size,
        height: size,
        background: 'var(--grad)',
        boxShadow: '0 0 24px rgba(124,108,255,.45)',
      }}
    >
      <FileText className="text-[#06080c]" style={{ width: size * 0.5, height: size * 0.5 }} strokeWidth={2.4} />
    </span>
  )
}

export function Brand({ size = 32 }) {
  return (
    <Link to="/" className="flex items-center gap-2.5 font-display text-[1.02rem] font-semibold tracking-tight text-[var(--color-ink)]">
      <Logo size={size} />
      Resume Agent
    </Link>
  )
}

const NAV = [
  { to: '/how-it-works', label: 'How it works' },
  { to: '/showcase', label: 'Showcase' },
  { to: '/pricing', label: 'Pricing' },
]

export function MarketingNav() {
  const { supabaseEnabled, session } = useAuth()
  const loggedIn = !supabaseEnabled || session

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--color-border)] backdrop-blur-xl" style={{ background: 'rgba(6,8,12,.55)' }}>
      <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-9">
          <Brand />
          <div className="hidden gap-7 text-[0.92rem] text-[var(--color-muted)] md:flex">
            {NAV.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `transition hover:text-[var(--color-ink)] ${isActive ? 'text-[var(--color-ink)]' : ''}`
                }
              >
                {label}
              </NavLink>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {loggedIn ? (
            <Link to="/app" className="btn btn-grad">
              Open app <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost hidden sm:inline-flex">Sign in</Link>
              <Link to="/login" className="btn btn-grad">
                Start free <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

export function MarketingFooter() {
  return (
    <footer className="relative z-10 border-t border-[var(--color-border)]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-9 text-[0.84rem] text-[var(--color-faint)]">
        <Brand size={26} />
        <div className="flex flex-wrap items-center gap-5">
          <Link to="/how-it-works" className="transition hover:text-[var(--color-muted)]">How it works</Link>
          <Link to="/showcase" className="transition hover:text-[var(--color-muted)]">Showcase</Link>
          <Link to="/pricing" className="transition hover:text-[var(--color-muted)]">Pricing</Link>
        </div>
        <div>© {new Date().getFullYear()} Resume Agent · Notion · Tectonic · Claude</div>
      </div>
    </footer>
  )
}

/** Section eyebrow + heading block used across marketing pages. */
export function SectionHead({ eyebrow, title, lede, center = false }) {
  return (
    <div className={`reveal ${center ? 'mx-auto max-w-2xl text-center' : ''}`}>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2 className="mt-3.5 text-[clamp(28px,3.4vw,42px)] font-semibold leading-[1.08] text-[var(--color-ink)]">{title}</h2>
      {lede && <p className={`mt-4 text-[17px] leading-relaxed text-[var(--color-muted)] ${center ? 'mx-auto' : ''} max-w-[34em]`}>{lede}</p>}
    </div>
  )
}
