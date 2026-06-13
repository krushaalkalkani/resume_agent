import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Brand } from '../components/Marketing'
import GenerativeBg from '../components/GenerativeBg'

export default function LoginPage() {
  const { session, signIn, signUp, resetPassword, supabaseEnabled } = useAuth()
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)

  if (!supabaseEnabled) {
    return <Navigate to="/app" replace />
  }

  if (session) {
    return <Navigate to="/app" replace />
  }

  async function onSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      if (mode === 'signin') {
        await signIn(email, password)
      } else if (mode === 'signup') {
        await signUp(email, password)
        setMessage('Account created. Check your email to confirm, then sign in.')
        setMode('signin')
      } else {
        await resetPassword(email)
        setMessage('Password reset link sent. Check your email.')
        setMode('signin')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const titles = {
    signin: 'Welcome back',
    signup: 'Create your account',
    reset: 'Reset password',
  }

  return (
    <div className="app-bg flex min-h-screen items-center justify-center px-4 py-12">
      <GenerativeBg className="pointer-events-none absolute inset-0 z-0 opacity-40" style={{ height: '100%', width: '100%' }} />
      <div className="card-elevated relative z-10 w-full max-w-md p-8">
        <div className="mb-7"><Brand /></div>

        <h1 className="font-display text-[24px] font-semibold tracking-tight text-[var(--color-ink)]">{titles[mode]}</h1>
        <p className="mt-1.5 text-sm text-[var(--color-muted)]">
          {mode === 'reset'
            ? 'Enter your email and we will send a reset link.'
            : 'Your resume data is saved to your private account.'}
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-[var(--color-muted)]">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              autoComplete="email"
            />
          </label>
          {mode !== 'reset' && (
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-[var(--color-muted)]">Password</span>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              />
            </label>
          )}

          {error && <div className="rounded-xl border border-[rgba(226,75,74,.4)] bg-[rgba(226,75,74,.12)] px-3.5 py-2.5 text-sm text-[#f0a0a0]">{error}</div>}
          {message && <div className="rounded-xl border border-[rgba(46,230,197,.4)] bg-[rgba(46,230,197,.1)] px-3.5 py-2.5 text-sm text-[var(--color-brand)]">{message}</div>}

          <button type="submit" disabled={busy} className="btn btn-grad w-full">
            {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Sign up' : 'Send reset link'}
          </button>
        </form>

        {mode === 'signin' && (
          <p className="mt-3 text-center text-sm">
            <button type="button" onClick={() => { setMode('reset'); setError(null); setMessage(null) }} className="text-[var(--color-brand)] hover:underline">
              Forgot password?
            </button>
          </p>
        )}

        <p className="mt-4 text-center text-sm text-[var(--color-muted)]">
          {mode === 'signin' && (
            <>
              No account?{' '}
              <button type="button" onClick={() => { setMode('signup'); setError(null); setMessage(null) }} className="text-[var(--color-brand)] hover:underline">
                Sign up
              </button>
            </>
          )}
          {mode === 'signup' && (
            <>
              Already have one?{' '}
              <button type="button" onClick={() => { setMode('signin'); setError(null); setMessage(null) }} className="text-[var(--color-brand)] hover:underline">
                Sign in
              </button>
            </>
          )}
          {mode === 'reset' && (
            <>
              Back to{' '}
              <button type="button" onClick={() => { setMode('signin'); setError(null); setMessage(null) }} className="text-[var(--color-brand)] hover:underline">
                sign in
              </button>
            </>
          )}
        </p>

        <Link to="/" className="mt-6 block text-center text-sm text-[var(--color-faint)] transition hover:text-[var(--color-muted)]">
          ← Back to home
        </Link>
      </div>
    </div>
  )
}
