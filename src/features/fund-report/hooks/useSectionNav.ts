import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { REPORT_SECTION_SCROLL_OFFSET, scrollToReportSection } from '../lib/nav/reportScroll'

/**
 * Scroll-spy: active section is the last section whose top has crossed the sticky nav offset.
 */
export function useSectionNav(sectionIds: string[], offsetPx = REPORT_SECTION_SCROLL_OFFSET) {
  const [active, setActive] = useState(sectionIds[0] ?? '')
  const idsKey = useMemo(() => sectionIds.join('|'), [sectionIds])
  const lockRef = useRef(false)
  const rafRef = useRef<number | null>(null)

  const scrollToSection = useCallback((id: string) => {
    if (!scrollToReportSection(id)) return
    lockRef.current = true
    setActive(id)
    window.setTimeout(() => {
      lockRef.current = false
    }, 900)
  }, [])

  useEffect(() => {
    const ids = idsKey.split('|').filter(Boolean)
    if (ids.length === 0) return

    setActive((prev) => (ids.includes(prev) ? prev : ids[0]!))

    const resolveActive = () => {
      if (lockRef.current) return

      let current = ids[0]!
      for (const id of ids) {
        const el = document.getElementById(id)
        if (!el) continue
        const top = el.getBoundingClientRect().top
        if (top - offsetPx <= 0) current = id
      }
      setActive((prev) => (prev === current ? prev : current))
    }

    const onScroll = () => {
      if (rafRef.current != null) return
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null
        resolveActive()
      })
    }

    resolveActive()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', resolveActive)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', resolveActive)
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current)
      }
    }
  }, [idsKey, offsetPx])

  return { activeSection: active, scrollToSection }
}
