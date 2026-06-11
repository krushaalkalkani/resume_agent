import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { FileText } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

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
    signin: 'Sign in',
    signup: 'Create account',
    reset: 'Reset password',
  }

  return (
    <div className="app-bg flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-md p-8">
        <div className="mb-6 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-brand)] text-white">
            <FileText className="h-4 w-4" />
          </span>
          <span className="text-lg font-semibold">Resume Agent</span>
        </div>

        <h1 className="text-xl font-bold">{titles[mode]}</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {mode === 'reset'
            ? 'Enter your email and we will send a reset link.'
            : 'Your resume data is saved to your private account.'}
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-[var(--color-muted)]">Email</span>
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
              <span className="mb-1 block font-medium text-[var(--color-muted)]">Password</span>
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

          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          {message && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</div>}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-[var(--color-brand)] py-2.5 text-sm font-medium text-white hover:bg-[var(--color-brand-dark)] disabled:opacity-50"
          >
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

        <Link to="/" className="mt-6 block text-center text-sm text-[var(--color-muted)] hover:underline">
          Back to home
        </Link>
      </div>
    </div>
  )
}
