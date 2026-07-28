import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { REPORT_SECTION_SCROLL_OFFSET, scrollToReportSection } from '../lib/nav/reportScroll'

function parseSectionIds(idsKey: string): string[] {
  return idsKey.split('|').filter(Boolean)
}

/**
 * Scroll-spy for the mobile continuous report layout.
 * Uses scroll position (with rAF) so long pages stay in sync with the tab bar.
 */
export function useSectionNav(sectionIds: string[], offsetPx = REPORT_SECTION_SCROLL_OFFSET) {
  const [active, setActive] = useState(sectionIds[0] ?? '')
  const idsKey = useMemo(() => sectionIds.join('|'), [sectionIds])
  const lockRef = useRef(false)

  const scrollToSection = useCallback(
    (id: string) => {
      if (!scrollToReportSection(id, offsetPx)) return
      lockRef.current = true
      setActive(id)
      window.setTimeout(() => {
        lockRef.current = false
      }, 900)
    },
    [offsetPx],
  )

  useEffect(() => {
    const ids = parseSectionIds(idsKey)
    if (ids.length === 0) return

    setActive((prev) => (ids.includes(prev) ? prev : ids[0]!))

    let raf = 0

    const resolveActive = () => {
      if (lockRef.current) return

      const anchor = window.scrollY + offsetPx + 8
      let current = ids[0]!

      for (const id of ids) {
        const el = document.getElementById(id)
        if (!el) continue
        if (el.offsetTop <= anchor) {
          current = id
        }
      }

      setActive((prev) => (prev === current ? prev : current))
    }

    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(resolveActive)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    resolveActive()

    const retryTimer = window.setInterval(resolveActive, 400)
    const stopRetry = window.setTimeout(() => window.clearInterval(retryTimer), 12_000)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(raf)
      window.clearInterval(retryTimer)
      window.clearTimeout(stopRetry)
    }
  }, [idsKey, offsetPx])

  return { activeSection: active, scrollToSection }
}
