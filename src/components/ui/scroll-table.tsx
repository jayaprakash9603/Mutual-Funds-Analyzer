import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useIsSmallScreen } from '@/hooks/useMediaQuery'

type ScrollTableProps = {
  children: ReactNode
  /** CSS length. Numbers are treated as px. Forces horizontal scroll below this width. */
  minWidth?: number | string
  className?: string
  hint?: string
}

export function ScrollTable({
  children,
  minWidth,
  className,
  hint = 'Swipe to see more',
}: ScrollTableProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [overflows, setOverflows] = useState(false)
  const [atEnd, setAtEnd] = useState(false)
  const isSmall = useIsSmallScreen()

  const updateScrollState = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    const hasOverflow = el.scrollWidth > el.clientWidth + 1
    setOverflows(hasOverflow)
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1)
  }, [])

  useEffect(() => {
    updateScrollState()
    const el = scrollerRef.current
    if (!el) return

    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateScrollState) : null
    observer?.observe(el)
    window.addEventListener('resize', updateScrollState)

    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', updateScrollState)
    }
  }, [updateScrollState, children])

  return (
    <div className={cn('relative', className)}>
      <div
        ref={scrollerRef}
        onScroll={updateScrollState}
        className="scrollbar-thin w-full overflow-x-auto"
      >
        <div className="w-full" style={minWidth == null ? undefined : { minWidth }}>
          {children}
        </div>
      </div>

      {overflows && !atEnd ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-background via-background/80 to-transparent"
        />
      ) : null}

      {isSmall && overflows ? (
        <p className="mt-1.5 text-center text-[11px] text-muted-foreground sm:hidden">{hint}</p>
      ) : null}
    </div>
  )
}
