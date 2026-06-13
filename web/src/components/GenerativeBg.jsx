import { useEffect, useRef } from 'react'

/**
 * Animated node-network canvas — the "data assembling itself" signature.
 * Lightweight: caps node count by width, pauses when tab is hidden,
 * respects prefers-reduced-motion.
 */
export default function GenerativeBg({ className = '', style }) {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let pts = []
    let raf = 0
    let W = 0
    let H = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    function size() {
      W = canvas.width = canvas.offsetWidth * dpr
      H = canvas.height = canvas.offsetHeight * dpr
      const n = Math.min(64, Math.max(20, Math.floor(W / 30)))
      pts = Array.from({ length: n }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
      }))
    }

    function draw() {
      ctx.clearRect(0, 0, W, H)
      const link = 150 * dpr
      for (const p of pts) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > W) p.vx *= -1
        if (p.y < 0 || p.y > H) p.vy *= -1
      }
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const a = pts[i]
          const b = pts[j]
          const d = Math.hypot(a.x - b.x, a.y - b.y)
          if (d < link) {
            const o = (1 - d / link) * 0.5
            const g = ctx.createLinearGradient(a.x, a.y, b.x, b.y)
            g.addColorStop(0, `rgba(46,230,197,${o})`)
            g.addColorStop(1, `rgba(124,108,255,${o})`)
            ctx.strokeStyle = g
            ctx.lineWidth = dpr * 0.6
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }
      ctx.fillStyle = 'rgba(180,200,255,.5)'
      for (const p of pts) {
        ctx.beginPath()
        ctx.arc(p.x, p.y, dpr * 1.4, 0, 7)
        ctx.fill()
      }
      raf = requestAnimationFrame(draw)
    }

    function start() {
      cancelAnimationFrame(raf)
      if (reduce) {
        draw()
        cancelAnimationFrame(raf)
        return
      }
      draw()
    }

    function onVisibility() {
      if (document.hidden) cancelAnimationFrame(raf)
      else if (!reduce) start()
    }

    size()
    start()
    window.addEventListener('resize', size)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', size)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return <canvas ref={ref} aria-hidden="true" className={className} style={style} />
}
