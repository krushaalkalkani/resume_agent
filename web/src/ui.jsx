import { Loader2 } from 'lucide-react'

const BTN_LIGHT = {
  default: 'bg-surface-raised border border-border text-ink hover:bg-surface shadow-sm',
  primary: 'bg-accent text-white hover:bg-accent-hover border border-accent shadow-sm shadow-accent/25',
  ghost: 'text-ink-muted hover:text-danger hover:bg-danger-soft border border-transparent',
  subtle: 'bg-surface text-ink-muted hover:bg-border-subtle border border-transparent',
}

const BTN_DARK = {
  default: 'bg-white/[0.04] border border-white/10 text-landing-muted hover:bg-white/[0.08] hover:text-landing-text',
  primary: 'btn-workspace btn-workspace-primary',
  ghost: 'text-landing-faint hover:text-red-400 hover:bg-red-500/10 border border-transparent',
  subtle: 'bg-white/[0.04] text-landing-muted hover:bg-white/[0.08] hover:text-landing-text border border-transparent',
}

export function PremiumBtn({ children, variant = 'primary', size = 'md', className = '' }) {
  const sizes = { sm: 'btn-premium-sm', md: 'btn-premium-md', xl: 'btn-premium-xl' }
  const variants = {
    primary: 'btn-premium btn-premium-primary',
    ghost: 'btn-premium btn-premium-ghost',
  }
  return (
    <span className={`${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  )
}

export function WorkspaceBtn({
  children, onClick, variant = 'ghost', disabled, size = 'sm', className = '', type = 'button',
}) {
  const sizes = { sm: 'btn-workspace-sm', md: 'btn-workspace-md' }
  const variants = {
    ghost: 'btn-workspace btn-workspace-ghost',
    primary: 'btn-workspace btn-workspace-primary',
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  )
}

export function Field({ label, value, onChange, placeholder, type = 'text', theme = 'light', icon: Icon }) {
  const dark = theme === 'dark'
  return (
    <label className="block">
      <span className={`mb-1.5 block text-[13px] font-semibold ${dark ? 'text-landing-muted' : 'text-ink-muted'}`}>
        {label}
      </span>
      <div className="relative">
        {Icon && (
          <Icon className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${dark ? 'text-landing-faint' : 'text-ink-faint'}`} />
        )}
        <input
          type={type}
          value={value ?? ''}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full rounded-none border py-2 text-sm transition outline-none ${Icon ? 'pl-9 pr-3.5' : 'px-3.5'}
            ${dark
              ? 'border-white/10 bg-white/[0.04] text-landing-text placeholder:text-landing-faint focus:border-accent-glow focus:ring-2 focus:ring-accent/20'
              : 'border-border bg-surface-raised text-ink placeholder:text-ink-faint focus:border-accent focus:ring-2 focus:ring-accent/15'}`}
        />
      </div>
    </label>
  )
}

export function Area({ label, value, onChange, rows = 4, placeholder, hint, theme = 'light' }) {
  const dark = theme === 'dark'
  return (
    <label className="block">
      <span className={`mb-1.5 block text-[13px] font-semibold ${dark ? 'text-landing-muted' : 'text-ink-muted'}`}>
        {label}
        {hint && (
          <span className={`ml-2 font-normal ${dark ? 'text-landing-faint' : 'text-ink-faint'}`}>{hint}</span>
        )}
      </span>
      <textarea
        rows={rows}
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full resize-y rounded-none border px-3.5 py-2.5 text-sm leading-relaxed transition outline-none
          ${dark
            ? 'border-white/10 bg-white/[0.04] text-landing-text placeholder:text-landing-faint focus:border-accent-glow focus:ring-2 focus:ring-accent/20'
            : 'border-border bg-surface-raised text-ink placeholder:text-ink-faint focus:border-accent focus:ring-2 focus:ring-accent/12'}`}
      />
    </label>
  )
}

export function Btn({
  children, onClick, variant = 'default', disabled, title, className = '',
  type = 'button', size = 'md', theme = 'light',
}) {
  const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded-none',
    md: 'px-4 py-2 text-sm rounded-none',
    lg: 'px-5 py-2.5 text-sm rounded-none',
  }
  const styles = theme === 'dark' ? BTN_DARK : BTN_LIGHT
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex items-center justify-center gap-2 font-semibold tracking-tight transition
                  disabled:opacity-50 disabled:cursor-not-allowed ${sizes[size]}
                  ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

export function Card({ children, onRemove, onUp, onDown, index, title, theme = 'light' }) {
  const dark = theme === 'dark'
  return (
    <div
      className={`relative border p-5 transition
        ${dark
          ? 'premium-card border-white/[0.08] bg-landing-card hover:border-white/14'
          : 'border-ink bg-surface-raised hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_var(--color-ink)]'}`}
    >
      {!dark && (
        <>
          <span className="pointer-events-none absolute -left-px -top-px h-2.5 w-2.5 border-l border-t border-ink" />
          <span className="pointer-events-none absolute -right-px -top-px h-2.5 w-2.5 border-r border-t border-ink" />
          <span className="pointer-events-none absolute -bottom-px -left-px h-2.5 w-2.5 border-b border-l border-ink" />
          <span className="pointer-events-none absolute -bottom-px -right-px h-2.5 w-2.5 border-b border-r border-ink" />
        </>
      )}
      <div className="mb-4 flex items-center justify-between">
        <span
          className={`font-mono text-[10px] font-medium uppercase tracking-wider
            ${dark ? 'text-landing-faint' : 'text-ink-faint'}`}
        >
          {title || `Entry ${index + 1}`}
        </span>
        <div className="flex gap-1">
          <Btn theme={theme} variant="subtle" size="sm" onClick={onUp} title="Move up">↑</Btn>
          <Btn theme={theme} variant="subtle" size="sm" onClick={onDown} title="Move down">↓</Btn>
          <Btn theme={theme} variant="ghost" size="sm" onClick={onRemove} title="Remove">Remove</Btn>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </div>
  )
}

export function Spinner({ className = 'h-4 w-4' }) {
  return <Loader2 className={`animate-spin ${className}`} />
}

export function StatusBadge({ variant = 'neutral', children, theme = 'light' }) {
  const dark = theme === 'dark'
  const styles = dark
    ? {
        success: 'bg-green-500/10 text-green-400 border-green-500/20',
        warn: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        danger: 'bg-red-500/10 text-red-400 border-red-500/20',
        neutral: 'bg-white/[0.04] text-landing-muted border-white/10',
      }
    : {
        success: 'bg-success-soft text-success border-green-200/60',
        warn: 'bg-warn-soft text-warn border-amber-200/60',
        danger: 'bg-danger-soft text-danger border-red-200/60',
        neutral: 'bg-surface text-ink-muted border-border',
      }
  return (
    <div className={`rounded-none border px-3.5 py-2.5 text-sm ${styles[variant]}`}>
      {children}
    </div>
  )
}

export function Toast({ type, message }) {
  const styles = {
    success: 'border-green-500/25 bg-green-500/10 text-green-400',
    error: 'border-red-500/25 bg-red-500/10 text-red-400',
  }
  return (
    <div
      className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border px-5 py-2.5
        text-sm font-medium shadow-2xl backdrop-blur-md ${styles[type]}`}
    >
      {message}
    </div>
  )
}

export function Logo({ dark = false }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-none
          ${dark
            ? 'bg-white text-ink shadow-[0_0_24px_rgba(255,255,255,0.15)]'
            : 'bg-accent text-white shadow-md shadow-accent/30'}`}
      >
        <span className="font-display text-sm font-extrabold tracking-tighter">R</span>
        {dark && (
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/30 to-transparent" />
        )}
      </div>
      <div className="flex flex-col">
        <span
          className={`font-display text-[15px] font-bold leading-none tracking-tight
            ${dark ? 'text-landing-text' : 'text-ink'}`}
        >
          Resume Agent
        </span>
        <span
          className={`mt-0.5 font-mono text-[9px] uppercase tracking-[0.14em]
            ${dark ? 'text-landing-faint' : 'text-ink-faint'}`}
        >
          Agentic PDF
        </span>
      </div>
    </div>
  )
}
