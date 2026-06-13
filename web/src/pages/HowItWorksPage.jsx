import { Link } from 'react-router-dom'
import { ArrowRight, Database, FileCode2, Eye, Wand2, Check, X } from 'lucide-react'
import { useReveal } from '../lib/useReveal'
import GenerativeBg from '../components/GenerativeBg'
import { MarketingNav, MarketingFooter, SectionHead } from '../components/Marketing'

const STAGES = [
  {
    icon: Database, n: '01', title: 'Fetch from Notion',
    desc: 'Your career lives in seven linked Notion databases — profile, education, experience, projects, skills, certifications, leadership. The agent reads them through the Notion API and assembles one structured record.',
    code: `fetch_notion.py → data/resume.json`,
  },
  {
    icon: FileCode2, n: '02', title: 'Validate & render',
    desc: 'Every field is checked against a strict Pydantic schema, so malformed data never reaches the page. A Jinja2 template renders LaTeX with LaTeX-safe delimiters, and Tectonic compiles a real PDF.',
    code: `schema.py → render.py → output/resume.tex → resume.pdf`,
  },
  {
    icon: Eye, n: '03', title: 'Reflect on its own output', key: true,
    desc: 'This is the part other builders skip. The agent reads the compiled PDF back — counts the pages, extracts the text, and confirms every single entry actually landed on the page. If anything is missing or it spilled to two pages, it fixes and recompiles.',
    code: `reflect.check_layout → 1 page? all sections present? → fix → recompile`,
  },
  {
    icon: Wand2, n: '04', title: 'Tailor to any job',
    desc: 'Paste a job description and the agent reorders and rewrites your experience, projects, and skills to match the role — then runs the whole verification loop again on the tailored version.',
    code: `tailor(job_description) → reorder + rewrite → verified PDF`,
  },
]

export default function HowItWorksPage() {
  useReveal()
  return (
    <div className="app-bg flex min-h-screen flex-col">
      <MarketingNav />

      <header className="relative mx-auto w-full max-w-6xl px-6 pb-12 pt-20 text-center md:pt-24">
        <GenerativeBg className="pointer-events-none absolute left-1/2 top-0 z-0 -translate-x-1/2 opacity-50" style={{ height: 460, width: '120%' }} />
        <div className="relative z-10">
          <span className="pill mx-auto"><span className="pill-dot" /> The agentic pipeline</span>
          <h1 className="mx-auto mt-5 max-w-[18em] text-[clamp(36px,5vw,60px)] font-semibold leading-[1.04] text-[var(--color-ink)]">
            It doesn't just write your resume.<br /><span className="grad-text">It double-checks it.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-[34em] text-[18px] leading-relaxed text-[var(--color-muted)]">
            Four stages, one closed loop. The agent fetches, renders, then reads its own work back before
            handing you anything — the same way a careful human would.
          </p>
        </div>
      </header>

      {/* vertical pipeline */}
      <section className="mx-auto w-full max-w-3xl px-6 py-12">
        <div className="relative">
          <div className="absolute bottom-6 left-[27px] top-6 w-px bg-[var(--color-border)] md:left-[31px]" />
          <div className="space-y-5">
            {STAGES.map((s) => {
              const Icon = s.icon
              return (
                <div key={s.title} className="reveal relative flex gap-5">
                  <div
                    className="relative z-10 grid h-14 w-14 flex-none place-items-center rounded-2xl border"
                    style={s.key
                      ? { background: 'var(--grad)', borderColor: 'transparent' }
                      : { background: 'var(--color-bg-2)', borderColor: 'var(--color-border-2)' }}
                  >
                    <Icon className={`h-6 w-6 ${s.key ? 'text-[#06080c]' : 'text-[var(--color-brand)]'}`} strokeWidth={1.8} />
                  </div>
                  <div
                    className={`flex-1 rounded-2xl border p-6 ${s.key ? 'border-[rgba(124,108,255,.5)]' : 'border-[var(--color-border)]'}`}
                    style={s.key ? { background: 'linear-gradient(180deg,rgba(124,108,255,.10),transparent)' } : { background: 'var(--color-card)' }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-display text-[13px] text-[var(--color-faint)]">{s.n}</span>
                      {s.key && <span className="rounded-md border border-[rgba(124,108,255,.4)] px-2 py-0.5 text-[11px] text-[var(--color-violet)]">the moat</span>}
                    </div>
                    <h3 className="mt-1 font-display text-[21px] font-medium text-[var(--color-ink)]">{s.title}</h3>
                    <p className="mt-2 text-[15px] leading-relaxed text-[var(--color-muted)]">{s.desc}</p>
                    <code className="mt-4 block overflow-x-auto rounded-lg border border-[var(--color-border)] bg-[rgba(0,0,0,.35)] px-3.5 py-2.5 font-mono text-[12px] text-[var(--color-brand)]">
                      {s.code}
                    </code>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* with vs without */}
      <section className="mx-auto w-full max-w-6xl px-6 py-16">
        <SectionHead center eyebrow="Why the loop matters" title="The difference reflection makes" />
        <div className="mx-auto mt-11 grid max-w-3xl gap-4 sm:grid-cols-2">
          <div className="reveal rounded-2xl border border-[var(--color-border)] p-7" style={{ background: 'var(--color-card)' }}>
            <div className="mb-4 font-display text-[15px] text-[var(--color-muted)]">Typical resume builders</div>
            {['Generate and hope it fits', 'Silently spills to a 2nd page', 'A bullet quietly gets dropped', 'You find out after applying'].map((t) => (
              <div key={t} className="flex items-center gap-2.5 py-2 text-[14px] text-[var(--color-muted)]">
                <X className="h-4 w-4 flex-none text-[#e24b4a]" strokeWidth={2.4} />{t}
              </div>
            ))}
          </div>
          <div className="reveal rounded-2xl border border-[rgba(46,230,197,.4)] p-7" style={{ background: 'linear-gradient(180deg,rgba(46,230,197,.08),transparent)' }}>
            <div className="mb-4 font-display text-[15px] text-[var(--color-brand)]">Resume Agent</div>
            {['Reads the PDF back to verify', 'Guarantees a clean single page', 'Confirms every entry is present', 'Fixes problems before you see them'].map((t) => (
              <div key={t} className="flex items-center gap-2.5 py-2 text-[14px] text-[var(--color-ink)]">
                <Check className="h-4 w-4 flex-none text-[var(--color-brand)]" strokeWidth={2.6} />{t}
              </div>
            ))}
          </div>
        </div>
        <div className="reveal mt-10 text-center">
          <Link to="/login" className="btn btn-grad">Try the agent free <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  )
}
