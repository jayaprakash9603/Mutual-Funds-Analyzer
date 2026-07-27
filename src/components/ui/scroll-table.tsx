import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useIsSmallScreen } from '@/hooks/useMediaQuery'

type ScrollTableProps = {
  children: ReactNode
  minWidth?: number | string
  className?: string
  hint?: string
}

function toMinWidthClass(minWidth: number | string | undefined): string | undefined {
  if (minWidth == null) return undefined
  if (typeof minWidth === 'number') return `min-w-[${minWidth}px]`
  return minWidth.startsWith('min-w-') ? minWidth : `min-w-[${minWidth}]`
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

  const minWidthClass = toMinWidthClass(minWidth)

  return (
    <div className={cn('relative', className)}>
      <div
        ref={scrollerRef}
        onScroll={updateScrollState}
        className="scrollbar-thin w-full overflow-x-auto"
      >
        <div className={cn('inline-block min-w-full align-top', minWidthClass)}>{children}</div>
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
