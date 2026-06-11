import { Link } from 'react-router-dom'
import { FileText, Sparkles, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function HomePage() {
  const { supabaseEnabled, session } = useAuth()
  return (
    <div className="app-bg flex min-h-screen flex-col">
      <header className="px-6 py-5 sm:px-10">
        <div className="mx-auto flex max-w-5xl items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-brand)] text-white">
            <FileText className="h-4 w-4" />
          </span>
          <span className="font-semibold">Resume Agent</span>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 pb-16 text-center">
        <span className="rounded-full bg-[var(--color-brand-light)] px-3 py-1 text-xs font-medium text-[var(--color-brand-dark)]">
          Notion → PDF · AI tailoring
        </span>
        <h1 className="mt-6 max-w-2xl text-4xl font-bold tracking-tight text-[var(--color-ink)] sm:text-5xl">
          Your resume, built and tailored in minutes
        </h1>
        <p className="mt-4 max-w-lg text-base leading-relaxed text-[var(--color-muted)]">
          Pull your career data from Notion, generate a clean one-page PDF, or paste a job description
          and let the agent reorder your experience for that role.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {supabaseEnabled && !session ? (
            <>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-brand)] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[var(--color-brand-dark)]"
              >
                Sign in / Sign up <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/app"
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-brand)] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[var(--color-brand-dark)]"
              >
                Open editor <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/tailor"
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-white px-5 py-2.5 text-sm font-medium text-[var(--color-ink)] shadow-sm transition hover:bg-slate-50"
              >
                <Sparkles className="h-4 w-4 text-[var(--color-brand)]" />
                Tailor to a job
              </Link>
            </>
          )}
        </div>

        <div className="mt-16 grid w-full max-w-3xl gap-4 sm:grid-cols-3">
          {[
            { title: 'Edit', desc: 'Update sections from your saved data' },
            { title: 'Generate', desc: 'Compile a polished LaTeX PDF' },
            { title: 'Tailor', desc: 'Match your resume to any job posting' },
          ].map((f) => (
            <div key={f.title} className="card p-4 text-left">
              <div className="font-semibold text-[var(--color-ink)]">{f.title}</div>
              <p className="mt-1 text-sm text-[var(--color-muted)]">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
