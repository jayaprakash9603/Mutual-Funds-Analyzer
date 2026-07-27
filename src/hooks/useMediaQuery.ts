import { useEffect, useState } from 'react'
import { MOBILE_BREAKPOINT_PX, TABLET_BREAKPOINT_PX } from '@/lib/constants'

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    const media = window.matchMedia(query)
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches)
    setMatches(media.matches)
    media.addEventListener('change', handler)
    return () => media.removeEventListener('change', handler)
  }, [query])

  return matches
}

export function useIsSmallScreen() {
  return useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT_PX}px)`)
}

export function useIsTablet() {
  return useMediaQuery(
    `(min-width: ${MOBILE_BREAKPOINT_PX + 1}px) and (max-width: ${TABLET_BREAKPOINT_PX}px)`,
  )
}
