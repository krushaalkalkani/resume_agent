import { Link } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import { useReveal } from '../lib/useReveal'
import { MarketingNav, MarketingFooter, SectionHead } from '../components/Marketing'

const ROLES = [
  { role: 'Frontend Engineer', accent: ['80%', '55%'] },
  { role: 'Data Scientist', accent: ['65%', '60%'] },
  { role: 'Product Manager', accent: ['75%', '50%'] },
  { role: 'ML Engineer', accent: ['70%', '58%'] },
  { role: 'Backend Engineer', accent: ['60%', '52%'] },
  { role: 'Designer', accent: ['82%', '48%'] },
]

function Paper({ role, accent }) {
  const lines = ['100%', accent[0], '100%', '85%', '100%', accent[1], '100%', '72%']
  return (
    <div className="reveal group">
      <div
        className="aspect-[0.74] overflow-hidden rounded-xl bg-white p-4 transition duration-300 group-hover:-translate-y-2 group-hover:scale-[1.02]"
        style={{ boxShadow: '0 28px 56px -24px rgba(0,0,0,.65)' }}
      >
        <div className="mb-1 h-[10px] w-3/5 rounded bg-[#11151c]" />
        <div className="mb-3 h-[4px] w-2/5 rounded bg-[#c4cad6]" />
        {lines.map((w, i) => (
          <div key={i} className="my-[6px] h-[5px] rounded"
            style={{ width: w, background: w === accent[0] || w === accent[1] ? 'linear-gradient(90deg,#2ee6c5,#7c6cff)' : '#e9ebf0' }} />
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between px-1">
        <span className="text-[14px] text-[var(--color-ink)]">{role}</span>
        <span className="inline-flex items-center gap-1 text-[12px] text-[var(--color-brand)]">
          <Check className="h-3 w-3" strokeWidth={3} /> 1 page
        </span>
      </div>
    </div>
  )
}

export default function ShowcasePage() {
  useReveal()
  return (
    <div className="app-bg flex min-h-screen flex-col">
      <MarketingNav />

      <header className="mx-auto w-full max-w-6xl px-6 pb-10 pt-20 text-center md:pt-24">
        <span className="pill mx-auto"><span className="pill-dot" /> Real compiled PDFs</span>
        <h1 className="mx-auto mt-5 max-w-[16em] text-[clamp(36px,5vw,58px)] font-semibold leading-[1.04] text-[var(--color-ink)]">
          One dataset.<br /><span className="grad-text">Every role, perfectly fit.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-[34em] text-[18px] leading-relaxed text-[var(--color-muted)]">
          The same Notion data, tailored and recompiled for six very different jobs — each one verified to a single page.
        </p>
      </header>

      <section className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3">
          {ROLES.map((r) => <Paper key={r.role} {...r} />)}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="reveal rounded-[28px] border border-[var(--color-border-2)] px-7 py-14 text-center"
          style={{ background: 'radial-gradient(600px 300px at 50% 0,rgba(46,230,197,.14),transparent 70%), var(--color-card)' }}>
          <SectionHead center eyebrow="Your turn" title="See your own data become every version of you." />
          <div className="mt-8 flex justify-center">
            <Link to="/login" className="btn btn-grad">Generate my resume <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  )
}
