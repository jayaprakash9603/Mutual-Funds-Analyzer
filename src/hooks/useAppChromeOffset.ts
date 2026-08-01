import { useEffect, useState } from 'react'
import { REPORT_NAVBAR_HEIGHT_PX } from '@/features/fund-report/lib/nav/reportLayoutConstants'

/** Live height of sticky AppChrome (navbar ± demo banner), in px. */
export function useAppChromeOffset(): number {
  const [offset, setOffset] = useState(REPORT_NAVBAR_HEIGHT_PX)

  useEffect(() => {
    const read = () => {
      const raw = getComputedStyle(document.documentElement)
        .getPropertyValue('--app-chrome-offset')
        .trim()
      const px = Number.parseFloat(raw)
      setOffset(Number.isFinite(px) && px > 0 ? px : REPORT_NAVBAR_HEIGHT_PX)
    }

    read()
    window.addEventListener('app-chrome-offset', read)
    window.addEventListener('resize', read)
    return () => {
      window.removeEventListener('app-chrome-offset', read)
      window.removeEventListener('resize', read)
    }
  }, [])

  return offset
}
