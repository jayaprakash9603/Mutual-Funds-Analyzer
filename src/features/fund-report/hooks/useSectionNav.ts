import { useEffect, useMemo, useState } from 'react'

export function useSectionNav(sectionIds: string[]) {
  const [active, setActive] = useState(sectionIds[0] ?? '')
  const idsKey = useMemo(() => sectionIds.join('|'), [sectionIds])

  useEffect(() => {
    const ids = idsKey.split('|').filter(Boolean)
    if (ids.length === 0) return

    setActive((prev) => (ids.includes(prev) ? prev : ids[0]))

    const observers: IntersectionObserver[] = []
    ids.forEach((id) => {
      const el = document.getElementById(id)
      if (!el) return
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActive(id)
        },
        { rootMargin: '-20% 0px -60% 0px', threshold: 0 },
      )
      observer.observe(el)
      observers.push(observer)
    })
    return () => observers.forEach((o) => o.disconnect())
  }, [idsKey])

  return active
}
