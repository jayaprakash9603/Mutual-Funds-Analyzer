import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { REPORT_SECTION_SCROLL_OFFSET, scrollToReportSection } from '../lib/nav/reportScroll'

function parseSectionIds(idsKey: string): string[] {
  return idsKey.split('|').filter(Boolean)
}

const LOCK_MAX_MS = 1200
const HYSTERESIS_PX = 12

function unlockAfterScrollSettles(targetTop: number, onUnlock: () => void): () => void {
  let settled = false
  let pollId = 0
  let timeoutId = 0

  const finish = () => {
    if (settled) return
    settled = true
    window.clearInterval(pollId)
    window.clearTimeout(timeoutId)
    window.removeEventListener('scrollend', onScrollEnd)
    onUnlock()
  }

  const onScrollEnd = () => finish()

  if ('onscrollend' in window) {
    window.addEventListener('scrollend', onScrollEnd, { once: true })
  }

  pollId = window.setInterval(() => {
    if (Math.abs(window.scrollY - targetTop) < 2) finish()
  }, 50)

  timeoutId = window.setTimeout(finish, LOCK_MAX_MS)

  return finish
}

/**
 * Scroll-spy for the mobile continuous report layout.
 * IntersectionObserver keeps the tab bar in sync without per-frame offsetTop scans.
 */
export function useSectionNav(sectionIds: string[], offsetPx = REPORT_SECTION_SCROLL_OFFSET) {
  const [active, setActive] = useState(sectionIds[0] ?? '')
  const idsKey = useMemo(() => sectionIds.join('|'), [sectionIds])
  const lockRef = useRef(false)
  const clearLockRef = useRef<(() => void) | null>(null)
  const activeRef = useRef(active)
  activeRef.current = active

  const scrollToSection = useCallback(
    (id: string) => {
      const targetTop = scrollToReportSection(id, offsetPx)
      if (targetTop === false) return

      clearLockRef.current?.()
      lockRef.current = true
      setActive(id)

      clearLockRef.current = unlockAfterScrollSettles(targetTop, () => {
        lockRef.current = false
        clearLockRef.current = null
      })
    },
    [offsetPx],
  )

  useEffect(() => {
    const ids = parseSectionIds(idsKey)
    if (ids.length === 0) return

    setActive((prev) => (ids.includes(prev) ? prev : ids[0]!))

    const ratios = new Map<string, number>()

    const pickActiveFromRatios = () => {
      if (lockRef.current) return

      let bestId = ids[0]!
      let bestRatio = -1
      for (const id of ids) {
        const ratio = ratios.get(id) ?? 0
        if (ratio > bestRatio) {
          bestRatio = ratio
          bestId = id
        }
      }

      // Near page bottom, prefer the last section when it intersects at all.
      const lastId = ids[ids.length - 1]!
      const lastEl = document.getElementById(lastId)
      if (lastEl) {
        const rect = lastEl.getBoundingClientRect()
        const nearBottom =
          window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 8
        if (nearBottom && rect.top < window.innerHeight) {
          bestId = lastId
        }
      }

      const current = activeRef.current
      if (bestId === current) return

      // Hysteresis: stay on the current section while it still has a meaningful intersection.
      const prevRatio = ratios.get(current) ?? 0
      const nextRatio = ratios.get(bestId) ?? 0
      if (prevRatio >= 0.2 && nextRatio < prevRatio + 0.05) {
        return
      }

      setActive(bestId)
    }

    const resolveByAnchor = () => {
      if (lockRef.current) return

      const anchor = window.scrollY + offsetPx + 8
      let current = ids[0]!
      for (const id of ids) {
        const el = document.getElementById(id)
        if (!el) continue
        if (el.getBoundingClientRect().top + window.scrollY <= anchor + HYSTERESIS_PX) {
          current = id
        }
      }
      setActive((prev) => (prev === current ? prev : current))
    }

    const observer =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
            (entries) => {
              for (const entry of entries) {
                const id = entry.target.id
                if (!ids.includes(id)) continue
                ratios.set(id, entry.isIntersecting ? entry.intersectionRatio : 0)
              }
              pickActiveFromRatios()
            },
            {
              root: null,
              rootMargin: `-${Math.max(0, offsetPx)}px 0px -45% 0px`,
              threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
            },
          )
        : null

    for (const id of ids) {
      const el = document.getElementById(id)
      if (el) observer?.observe(el)
    }

    // Initial resolve (also covers late-mounted sections via ResizeObserver below).
    resolveByAnchor()

    const reportRoot =
      document.getElementById('fund-report-export-root') ??
      document.getElementById('fund-report-content')

    const resizeObserver =
      typeof ResizeObserver !== 'undefined' && reportRoot
        ? new ResizeObserver(() => {
            if (lockRef.current) return
            // Re-observe in case sections remounted; ratios refresh on next IO callback.
            for (const id of ids) {
              const el = document.getElementById(id)
              if (el) observer?.observe(el)
            }
            resolveByAnchor()
          })
        : null

    if (reportRoot) resizeObserver?.observe(reportRoot)

    let raf = 0
    const onScrollFallback = () => {
      if (observer) return
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(resolveByAnchor)
    }

    window.addEventListener('scroll', onScrollFallback, { passive: true })
    window.addEventListener('resize', resolveByAnchor)

    return () => {
      observer?.disconnect()
      resizeObserver?.disconnect()
      window.removeEventListener('scroll', onScrollFallback)
      window.removeEventListener('resize', resolveByAnchor)
      cancelAnimationFrame(raf)
      clearLockRef.current?.()
    }
  }, [idsKey, offsetPx])

  return { activeSection: active, scrollToSection }
}
