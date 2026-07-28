import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { REPORT_SECTION_SCROLL_OFFSET, scrollToReportSection } from '../lib/nav/reportScroll'

/**
 * Scroll-spy via IntersectionObserver — avoids per-frame layout reads during fast scroll.
 */
export function useSectionNav(sectionIds: string[], offsetPx = REPORT_SECTION_SCROLL_OFFSET) {
  const [active, setActive] = useState(sectionIds[0] ?? '')
  const idsKey = useMemo(() => sectionIds.join('|'), [sectionIds])
  const lockRef = useRef(false)
  const intersectingRef = useRef(new Map<string, boolean>())

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
    const ids = idsKey.split('|').filter(Boolean)
    if (ids.length === 0) return

    setActive((prev) => (ids.includes(prev) ? prev : ids[0]!))

    const intersecting = intersectingRef.current
    intersecting.clear()

    const pickActive = () => {
      if (lockRef.current) return
      let current = ids[0]!
      for (const id of ids) {
        if (intersecting.get(id)) {
          current = id
        }
      }
      setActive((prev) => (prev === current ? prev : current))
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          intersecting.set(entry.target.id, entry.isIntersecting)
        }
        pickActive()
      },
      {
        root: null,
        rootMargin: `-${offsetPx}px 0px -45% 0px`,
        threshold: 0,
      },
    )

    for (const id of ids) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }

    pickActive()

    return () => observer.disconnect()
  }, [idsKey, offsetPx])

  return { activeSection: active, scrollToSection }
}
