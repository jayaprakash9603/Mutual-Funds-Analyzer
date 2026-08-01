import { useLayoutEffect, useRef, type ReactNode } from 'react'

const CHROME_OFFSET_VAR = '--app-chrome-offset'

/**
 * Sticky site chrome (demo banner + navbar). Measures its height into
 * `--app-chrome-offset` so fixed report bars sit below it, not under it.
 */
export function AppChrome({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const sync = () => {
      document.documentElement.style.setProperty(CHROME_OFFSET_VAR, `${el.offsetHeight}px`)
      window.dispatchEvent(new Event('app-chrome-offset'))
    }

    sync()
    const observer = new ResizeObserver(sync)
    observer.observe(el)
    return () => {
      observer.disconnect()
      document.documentElement.style.removeProperty(CHROME_OFFSET_VAR)
      window.dispatchEvent(new Event('app-chrome-offset'))
    }
  }, [])

  return (
    <div ref={ref} className="sticky top-0 z-40 w-full bg-background">
      {children}
    </div>
  )
}
