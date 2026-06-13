import { Link } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import { useReveal } from '../lib/useReveal'
import { MarketingNav, MarketingFooter, SectionHead } from '../components/Marketing'

const PLANS = [
  {
    name: 'Free', price: '$0', unit: '/ forever',
    blurb: 'Everything you need to build one great resume.',
    features: ['JSON → PDF generation', 'Self-checking reflection loop', 'Self-healing LaTeX compiles', '3 tailored versions / month', 'JSON import & export'],
    cta: 'Get started', variant: 'line',
  },
  {
    name: 'Pro', price: '$12', unit: '/ month', featured: true,
    blurb: 'For an active job hunt across many roles.',
    features: ['Everything in Free', 'Unlimited tailored resumes', 'Version history + compare', 'Premium template gallery', 'Priority compile queue', 'Email support'],
    cta: 'Go Pro', variant: 'grad',
  },
]

const FAQ = [
  { q: 'Do I need to know LaTeX?', a: 'No. You edit structured fields in the app — the agent writes and compiles the LaTeX for you.' },
  { q: 'Is the output really ATS-safe?', a: 'Yes. The template renders clean, single-column text that applicant tracking systems parse reliably.' },
  { q: 'Can I cancel anytime?', a: 'Pro is month-to-month with no contract. Cancel whenever and you keep Free forever.' },
  { q: 'Where does my data live?', a: 'Your career data stays in your private account or local JSON file — it is never shared.' },
]

export default function PricingPage() {
  useReveal()
  return (
    <div className="app-bg flex min-h-screen flex-col">
      <MarketingNav />

      <header className="mx-auto w-full max-w-6xl px-6 pb-8 pt-20 text-center md:pt-24">
        <span className="pill mx-auto"><span className="pill-dot" /> Simple, honest pricing</span>
        <h1 className="mx-auto mt-5 max-w-[14em] text-[clamp(36px,5vw,58px)] font-semibold leading-[1.04] text-[var(--color-ink)]">
          Free to build.<br /><span className="grad-text">Pro to win the hunt.</span>
        </h1>
      </header>

      <section className="mx-auto w-full max-w-4xl px-6 py-10">
        <div className="grid gap-5 sm:grid-cols-2">
          {PLANS.map((p) => (
            <div
              key={p.name}
              className={`reveal flex flex-col rounded-[22px] border p-8 ${p.featured ? 'border-[rgba(124,108,255,.5)]' : 'border-[var(--color-border)]'}`}
              style={p.featured ? { background: 'linear-gradient(180deg,rgba(124,108,255,.12),transparent)' } : { background: 'var(--color-card)' }}
            >
              <div className="flex items-center justify-between">
                <span className={`font-display text-[15px] ${p.featured ? 'text-[var(--color-violet)]' : 'text-[var(--color-muted)]'}`}>{p.name}</span>
                {p.featured && <span className="rounded-full px-3 py-1 text-[11px] font-medium text-[#06080c]" style={{ background: 'var(--grad)' }}>Most popular</span>}
              </div>
              <div className="mt-3 font-display text-[46px] font-semibold tracking-tight text-[var(--color-ink)]">
                {p.price}<small className="text-[15px] font-normal text-[var(--color-faint)]"> {p.unit}</small>
              </div>
              <p className="mt-1 text-[14px] text-[var(--color-muted)]">{p.blurb}</p>
              <ul className="my-7 grid gap-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-[14px] text-[var(--color-muted)]">
                    <Check className="h-4 w-4 flex-none text-[var(--color-brand)]" strokeWidth={2.6} />{f}
                  </li>
                ))}
              </ul>
              <Link to="/login" className={`btn mt-auto w-full ${p.variant === 'grad' ? 'btn-grad' : 'btn-line'}`}>
                {p.cta} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-3xl px-6 py-16">
        <SectionHead center eyebrow="FAQ" title="Questions, answered" />
        <div className="mt-10 space-y-3">
          {FAQ.map((f) => (
            <div key={f.q} className="reveal rounded-2xl border border-[var(--color-border)] p-6" style={{ background: 'var(--color-card)' }}>
              <h3 className="font-display text-[16px] font-medium text-[var(--color-ink)]">{f.q}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-[var(--color-muted)]">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <MarketingFooter />
    </div>
  )
}
