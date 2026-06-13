import { useEffect } from 'react'

/**
 * Adds the `in` class to every `.reveal` element as it scrolls into view.
 * Re-runs when `deps` change so freshly-mounted pages animate too.
 *
 * Includes a safety fallback: any element still hidden after `fallbackMs`
 * is revealed unconditionally, so content can never get stuck invisible
 * if IntersectionObserver misbehaves.
 */
export function useReveal(deps = [], { fallbackMs = 2500 } = {}) {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('.reveal:not(.in)'))
    if (els.length === 0) return

    const reveal = (el) => el.classList.add('in')

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            reveal(e.target)
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0, rootMargin: '0px 0px -10% 0px' }
    )
    els.forEach((el) => io.observe(el))

    // Fallback: reveal anything already in the viewport immediately, and
    // everything else after a grace period, regardless of observer behaviour.
    const revealVisible = () => {
      els.forEach((el) => {
        const r = el.getBoundingClientRect()
        if (r.top < window.innerHeight && r.bottom > 0) reveal(el)
      })
    }
    const raf = requestAnimationFrame(revealVisible)
    const onScroll = () => revealVisible()
    window.addEventListener('scroll', onScroll, { passive: true })
    const timer = setTimeout(() => els.forEach(reveal), fallbackMs)

    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
