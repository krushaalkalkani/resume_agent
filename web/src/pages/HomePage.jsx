import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

function BlueprintLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center border border-ink bg-ink text-paper">
        <span className="font-display text-base font-extrabold">R</span>
      </div>
      <div className="leading-none">
        <div className="font-display text-[15px] font-bold tracking-tight text-ink">Resume Agent</div>
        <div className="bp-label mt-1">Prototype</div>
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="bp-grid relative flex min-h-screen flex-col text-ink">
      {/* drawing frame */}
      <div className="pointer-events-none fixed inset-2.5 z-40 border border-ink/20" />

      {/* minimal header */}
      <header className="relative z-30 flex h-16 items-center justify-between px-6 sm:px-10">
        <BlueprintLogo />
        <span className="bp-tag"><span className="h-1.5 w-1.5 bg-orange" /> Work in progress</span>
      </header>

      {/* centered coming-soon */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center">
        <span className="bp-label">Fig. 01 — building</span>
        <h1 className="mt-5 font-display text-6xl font-extrabold leading-none tracking-tight sm:text-8xl">
          Coming&nbsp;soon<span className="text-orange">.</span>
        </h1>
        <p className="mt-6 max-w-md text-base leading-relaxed text-ink-muted">
          A small tool that turns my Notion into a clean résumé PDF. Still building it.
        </p>
        <Link to="/app" className="bp-btn bp-btn-ghost bp-btn-md mt-9">
          Peek at the builder <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </main>

      {/* tiny footer */}
      <footer className="relative z-10 px-6 pb-6 sm:px-10">
        <span className="bp-label">Resume Agent · by Krushal Kalkani</span>
      </footer>
    </div>
  )
}
