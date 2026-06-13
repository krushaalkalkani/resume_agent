import { Link } from 'react-router-dom'
import {
  ArrowRight, Check, Play, AlignLeft, Plus, Eye, Sparkles,
  LayoutGrid, ShieldCheck, RefreshCw, BarChart3,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useReveal } from '../lib/useReveal'
import GenerativeBg from '../components/GenerativeBg'
import { MarketingNav, MarketingFooter, SectionHead } from '../components/Marketing'

const STEPS = [
  { n: '01', icon: AlignLeft, title: 'Fetch', desc: 'Reads your 7 Notion databases — the single source of truth for your career.' },
  { n: '02', icon: Plus, title: 'Render', desc: 'Validates against a strict schema, then renders LaTeX and compiles a real PDF.' },
  { n: '03 · the moat', icon: Eye, title: 'Reflect', desc: 'Reads its own PDF back — counts pages, confirms every entry made it onto the page.', key: true, tag: 'self-critique loop' },
  { n: '04', icon: Sparkles, title: 'Tailor', desc: 'Paste any job description — it reorders and rewrites to match the role.' },
]

const FEATURES = [
  { w: 2, icon: LayoutGrid, title: 'One source of truth, infinite resumes', desc: 'Your data lives in Notion. Edit once — every tailored version stays in sync. No more nine slightly-different Word files.', doc: true },
  { w: 1, icon: ShieldCheck, title: 'ATS-safe by design', desc: 'Clean LaTeX output that parses perfectly through every applicant tracking system.' },
  { w: 1, icon: RefreshCw, title: 'Self-healing compiles', desc: 'LaTeX error? The agent reads the log, fixes it, and recompiles — untouched by you.' },
  { w: 2, icon: BarChart3, title: 'Tailoring with a memory', desc: 'Every tailored run is saved and re-runnable. Compare versions, regenerate, and download the exact PDF you sent to each company.' },
]

function DocLine({ w = '100%', accent }) {
  return (
    <div
      className="my-1.5 h-[7px] rounded"
      style={{ width: w, background: accent ? 'var(--grad)' : '#e9ebf0', opacity: accent ? 0.85 : 1 }}
    />
  )
}

function ShowcaseShot({ lines }) {
  return (
    <div className="reveal aspect-[0.72] overflow-hidden rounded-xl bg-white p-3.5 transition duration-300 hover:-translate-y-2 hover:scale-[1.02]"
      style={{ boxShadow: '0 24px 50px -22px rgba(0,0,0,.6)' }}>
      <div className="mb-2 h-[9px] w-3/5 rounded bg-[#11151c]" />
      {lines.map((l, i) => (
        <div key={i} className="my-[5px] h-[5px] rounded" style={{ width: l.w, background: l.a ? 'linear-gradient(90deg,#2ee6c5,#7c6cff)' : '#e9ebf0' }} />
      ))}
    </div>
  )
}

export default function HomePage() {
  useReveal()
  const { supabaseEnabled, session } = useAuth()
  const primaryTo = !supabaseEnabled || session ? '/app' : '/login'

  return (
    <div className="app-bg flex min-h-screen flex-col">
      <MarketingNav />

      {/* ---------- hero ---------- */}
      <header className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-6 pb-16 pt-20 md:grid-cols-[1.05fr_0.95fr] md:pt-24">
        <GenerativeBg
          className="pointer-events-none absolute z-0 opacity-60"
          style={{ inset: '-80px -220px auto -220px', height: 620, width: 'calc(100% + 440px)' }}
        />
        <div className="relative z-10">
          <span className="pill"><span className="pill-dot" /> Notion → AI → PDF · it checks its own work</span>
          <h1 className="mt-5 text-[clamp(40px,5.4vw,68px)] font-semibold leading-[1.02] text-[var(--color-ink)]">
            The resume that<br />
            <span className="grad-text">builds and proofreads</span><br />
            itself.
          </h1>
          <p className="mt-5 max-w-[30em] text-[18px] leading-relaxed text-[var(--color-muted)]">
            Pull your career data straight from Notion. The agent renders a flawless one-page PDF, then{' '}
            <span className="text-[var(--color-ink)]">reads it back to verify every line landed</span> — and re-tailors it to any job in seconds.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to={primaryTo} className="btn btn-grad">
              Build my resume <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/how-it-works" className="btn btn-line">
              <Play className="h-4 w-4" /> Watch the agent work
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap gap-8 text-[13px] text-[var(--color-faint)]">
            <div><b className="block font-display text-[20px] font-semibold text-[var(--color-ink)]">1-page</b>ATS-safe, always</div>
            <div><b className="block font-display text-[20px] font-semibold text-[var(--color-ink)]">~12s</b>Notion to PDF</div>
            <div><b className="block font-display text-[20px] font-semibold text-[var(--color-ink)]">Self-healing</b>compile loop</div>
          </div>
        </div>

        {/* floating doc */}
        <div className="relative z-10 hidden md:block" style={{ perspective: 1400 }}>
          <div
            className="rounded-2xl bg-[#fdfdfb] p-7 text-[#11151c]"
            style={{
              boxShadow: '0 40px 90px -20px rgba(0,0,0,.7), 0 0 0 1px rgba(255,255,255,.06)',
              transformStyle: 'preserve-3d',
              animation: 'floaty 7s ease-in-out infinite',
            }}
          >
            <h3 className="font-display text-[19px] font-semibold tracking-tight">Krushal Kalkani</h3>
            <div className="mt-0.5 text-[12px] text-[#5b6472]">Software Engineer · Agentic AI</div>
            <hr className="my-3.5 border-[#e7e9ee]" />
            <p className="mb-1.5 text-[9.5px] uppercase tracking-[0.13em] text-[#8a93a3]">Experience</p>
            <DocLine w="92%" /><DocLine w="78%" accent /><DocLine w="85%" />
            <hr className="my-3.5 border-[#e7e9ee]" />
            <p className="mb-1.5 text-[9.5px] uppercase tracking-[0.13em] text-[#8a93a3]">Projects</p>
            <DocLine w="88%" /><DocLine w="64%" accent />
            <hr className="my-3.5 border-[#e7e9ee]" />
            <p className="mb-1.5 text-[9.5px] uppercase tracking-[0.13em] text-[#8a93a3]">Education</p>
            <DocLine w="70%" />
          </div>
          <div
            className="absolute -right-3.5 top-8 flex items-center gap-2.5 rounded-xl border border-[var(--color-border-2)] bg-[#0a0e15] px-3.5 py-2.5 text-[12.5px]"
            style={{ boxShadow: '0 16px 40px rgba(0,0,0,.55)', animation: 'floaty 7s ease-in-out infinite 0.4s' }}
          >
            <span className="grid h-[18px] w-[18px] place-items-center rounded-full" style={{ background: 'var(--grad)' }}>
              <Check className="h-2.5 w-2.5 text-[#06080c]" strokeWidth={3.5} />
            </span>
            1 page · 7/7 entries present
          </div>
        </div>
      </header>

      {/* ---------- logos ---------- */}
      <div className="reveal mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-x-12 gap-y-4 px-6 py-6 font-display text-[17px] font-medium text-[var(--color-muted)] opacity-60">
        {['Y Combinator', 'Sequoia', 'a16z', 'Notion', 'Vercel'].map((n) => <span key={n}>{n}</span>)}
      </div>

      {/* ---------- agent loop ---------- */}
      <section id="how" className="mx-auto w-full max-w-6xl px-6 py-20">
        <SectionHead
          eyebrow="The agent loop"
          title={<>Most builders generate.<br /><span className="text-[var(--color-violet)]">Ours verifies.</span></>}
          lede="A four-step agentic pipeline with a reflection stage — it compiles, reads the PDF back, critiques itself, and fixes errors before you ever see them."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => {
            const Icon = s.icon
            return (
              <div
                key={s.title}
                className={`reveal rounded-2xl border p-6 transition duration-300 hover:-translate-y-1 ${
                  s.key
                    ? 'border-[rgba(124,108,255,.5)]'
                    : 'border-[var(--color-border)] hover:border-[var(--color-border-2)]'
                }`}
                style={s.key ? { background: 'linear-gradient(180deg,rgba(124,108,255,.10),transparent)' } : { background: 'var(--color-card)' }}
              >
                <div className="font-display text-[13px] text-[var(--color-faint)]">{s.n}</div>
                <div
                  className="my-3 grid h-10 w-10 place-items-center rounded-xl border border-[var(--color-border)]"
                  style={s.key ? { background: 'var(--grad)', border: 'none' } : { background: 'rgba(255,255,255,.06)' }}
                >
                  <Icon className={`h-5 w-5 ${s.key ? 'text-[#06080c]' : 'text-[var(--color-ink)]'}`} strokeWidth={1.9} />
                </div>
                <h4 className="font-display text-[17px] font-medium text-[var(--color-ink)]">{s.title}</h4>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--color-muted)]">{s.desc}</p>
                {s.tag && (
                  <span className="mt-3 inline-block rounded-md border border-[rgba(124,108,255,.4)] px-2 py-1 text-[11px] text-[var(--color-violet)]">
                    {s.tag}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* ---------- bento ---------- */}
      <section id="features" className="mx-auto w-full max-w-6xl px-6 py-20">
        <SectionHead eyebrow="Built for the job hunt" title={<>Everything an applicant<br />actually needs.</>} />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => {
            const Icon = f.icon
            return (
              <div
                key={f.title}
                className={`reveal rounded-[18px] border border-[var(--color-border)] p-6 transition duration-300 hover:-translate-y-1 hover:border-[var(--color-border-2)] ${
                  f.w === 2 ? 'sm:col-span-2' : ''
                }`}
                style={{ background: 'var(--color-card)' }}
              >
                <div className="mb-4 grid h-[42px] w-[42px] place-items-center rounded-xl border border-[rgba(46,230,197,.3)]" style={{ background: 'rgba(46,230,197,.12)' }}>
                  <Icon className="h-5 w-5 text-[var(--color-brand)]" strokeWidth={1.8} />
                </div>
                <h4 className="font-display text-[19px] font-medium tracking-tight text-[var(--color-ink)]">{f.title}</h4>
                <p className="mt-2 text-[14px] leading-relaxed text-[var(--color-muted)]">{f.desc}</p>
                {f.doc && (
                  <div className="mt-4 flex gap-2.5">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="relative h-24 flex-1 overflow-hidden rounded-xl border border-[var(--color-border)]" style={{ background: 'rgba(255,255,255,.04)' }}>
                        <div className="absolute left-2.5 right-2.5 top-3 h-1.5 rounded" style={{ background: 'rgba(255,255,255,.12)' }} />
                        {i === 1 && <div className="absolute left-2.5 top-[26px] h-[5px] w-3/5 rounded" style={{ background: 'var(--grad)' }} />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* ---------- showcase ---------- */}
      <section id="showcase" className="mx-auto w-full max-w-6xl px-6 py-20">
        <SectionHead
          eyebrow="Showcase"
          title={<>Real output. <span className="grad-text">Recruiter-ready.</span></>}
          lede="Every resume is a compiled PDF — not an HTML mock. Hover to lift."
        />
        <div className="mt-11 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <ShowcaseShot lines={[{ w: '80%', a: true }, { w: '100%' }, { w: '70%' }, { w: '100%' }, { w: '55%', a: true }, { w: '100%' }]} />
          <ShowcaseShot lines={[{ w: '100%' }, { w: '65%', a: true }, { w: '100%' }, { w: '85%' }, { w: '100%' }, { w: '60%', a: true }]} />
          <ShowcaseShot lines={[{ w: '75%', a: true }, { w: '100%' }, { w: '60%' }, { w: '100%', a: true }, { w: '100%' }, { w: '70%' }]} />
          <ShowcaseShot lines={[{ w: '100%' }, { w: '80%' }, { w: '50%', a: true }, { w: '100%' }, { w: '65%' }, { w: '100%', a: true }]} />
        </div>
        <div className="reveal mt-9 text-center">
          <Link to="/showcase" className="btn btn-line">See the full gallery <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>

      {/* ---------- pricing teaser ---------- */}
      <section id="pricing" className="mx-auto w-full max-w-6xl px-6 py-20">
        <SectionHead eyebrow="Pricing" title={<>Start free.<br />Upgrade when you're hunting hard.</>} />
        <div className="mt-11 grid max-w-3xl gap-4 sm:grid-cols-2">
          <div className="reveal rounded-[20px] border border-[var(--color-border)] p-8" style={{ background: 'var(--color-card)' }}>
            <div className="font-display text-[15px] text-[var(--color-muted)]">Free</div>
            <div className="mt-2.5 font-display text-[42px] font-semibold tracking-tight text-[var(--color-ink)]">$0<small className="text-[15px] font-normal text-[var(--color-faint)]"> / forever</small></div>
            <ul className="my-6 grid gap-3">
              {['Notion → PDF generation', 'Self-checking reflection loop', '3 tailored versions / month'].map((t) => (
                <li key={t} className="flex items-center gap-2.5 text-[14px] text-[var(--color-muted)]">
                  <Check className="h-4 w-4 flex-none text-[var(--color-brand)]" strokeWidth={2.6} />{t}
                </li>
              ))}
            </ul>
            <Link to="/login" className="btn btn-line w-full">Get started</Link>
          </div>
          <div className="reveal rounded-[20px] border border-[rgba(124,108,255,.5)] p-8" style={{ background: 'linear-gradient(180deg,rgba(124,108,255,.10),transparent)' }}>
            <div className="font-display text-[15px] text-[var(--color-violet)]">Pro</div>
            <div className="mt-2.5 font-display text-[42px] font-semibold tracking-tight text-[var(--color-ink)]">$12<small className="text-[15px] font-normal text-[var(--color-faint)]"> / month</small></div>
            <ul className="my-6 grid gap-3">
              {['Unlimited tailored resumes', 'Version history + compare', 'Premium template gallery', 'Priority compile queue'].map((t) => (
                <li key={t} className="flex items-center gap-2.5 text-[14px] text-[var(--color-muted)]">
                  <Check className="h-4 w-4 flex-none text-[var(--color-brand)]" strokeWidth={2.6} />{t}
                </li>
              ))}
            </ul>
            <Link to="/login" className="btn btn-grad w-full">Go Pro</Link>
          </div>
        </div>
      </section>

      {/* ---------- final CTA ---------- */}
      <div className="mx-auto w-full max-w-6xl px-6 pb-10">
        <div
          className="reveal rounded-[28px] border border-[var(--color-border-2)] px-7 py-16 text-center"
          style={{ background: 'radial-gradient(600px 300px at 50% 0,rgba(124,108,255,.18),transparent 70%), var(--color-card)' }}
        >
          <span className="eyebrow">Ready in minutes</span>
          <h2 className="mx-auto mt-3 max-w-[16em] text-[clamp(26px,3.4vw,38px)] font-semibold leading-tight text-[var(--color-ink)]">
            Your next role deserves a resume that proofreads itself.
          </h2>
          <div className="mt-8 flex justify-center">
            <Link to={primaryTo} className="btn btn-grad">
              Build my resume free <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      <MarketingFooter />
    </div>
  )
}
