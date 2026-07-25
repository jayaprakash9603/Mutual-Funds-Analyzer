import { useEffect, useMemo, useState } from 'react'

/**
 * Scroll-spy: active section is the last section whose top has crossed
 * a sticky-nav offset. Updates as the user scrolls the page.
 */
export function useSectionNav(sectionIds: string[], offsetPx = 140) {
  const [active, setActive] = useState(sectionIds[0] ?? '')
  const idsKey = useMemo(() => sectionIds.join('|'), [sectionIds])

  useEffect(() => {
    const ids = idsKey.split('|').filter(Boolean)
    if (ids.length === 0) return

    setActive((prev) => (ids.includes(prev) ? prev : ids[0]))

    const resolveActive = () => {
      let current = ids[0]
      for (const id of ids) {
        const el = document.getElementById(id)
        if (!el) continue
        const top = el.getBoundingClientRect().top
        if (top - offsetPx <= 0) current = id
      }
      setActive(current)
    }

    resolveActive()
    window.addEventListener('scroll', resolveActive, { passive: true })
    window.addEventListener('resize', resolveActive)
    return () => {
      window.removeEventListener('scroll', resolveActive)
      window.removeEventListener('resize', resolveActive)
    }
  }, [idsKey, offsetPx])

  return active
}
