import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { APP_TABLE_SCROLL_INNER } from '@/lib/ui/appTableStyles'
import { cn } from '@/lib/utils'
import { useIsSmallScreen } from '@/hooks/useMediaQuery'

type ScrollTableProps = {
  children: ReactNode
  /**
   * Optional frozen leading pane (e.g. first column table). When set, only the
   * remaining `children` scroll horizontally — the scrollbar sits under the moving columns.
   */
  pinnedLeading?: ReactNode
  /** CSS length. Numbers are treated as px. Forces horizontal scroll below this width. */
  minWidth?: number | string
  className?: string
  hint?: string
}

function syncPinnedRowHeights(leadingRoot: HTMLElement, scrollRoot: HTMLElement) {
  const leadingTable = leadingRoot.querySelector('table')
  const scrollTable = scrollRoot.querySelector('table')
  if (!leadingTable || !scrollTable) return

  const leadingRows = Array.from(leadingTable.querySelectorAll('tr'))
  const scrollRows = Array.from(scrollTable.querySelectorAll('tr'))
  const count = Math.min(leadingRows.length, scrollRows.length)

  for (let i = 0; i < count; i++) {
    leadingRows[i]!.style.height = ''
    scrollRows[i]!.style.height = ''
  }

  for (let i = 0; i < count; i++) {
    const height = Math.max(
      leadingRows[i]!.getBoundingClientRect().height,
      scrollRows[i]!.getBoundingClientRect().height,
    )
    const px = `${Math.ceil(height)}px`
    leadingRows[i]!.style.height = px
    scrollRows[i]!.style.height = px
  }
}

export function ScrollTable({
  children,
  pinnedLeading,
  minWidth,
  className,
  hint = 'Swipe sideways to see all columns',
}: ScrollTableProps) {
  const leadingRef = useRef<HTMLDivElement>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [overflows, setOverflows] = useState(false)
  const [atEnd, setAtEnd] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const isSmall = useIsSmallScreen()

  const updateScrollState = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    const hasOverflow = el.scrollWidth > el.clientWidth + 1
    setOverflows(hasOverflow)
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1)
    setScrolled(el.scrollLeft > 1)
  }, [])

  const syncHeights = useCallback(() => {
    if (!pinnedLeading || !leadingRef.current || !scrollerRef.current) return
    syncPinnedRowHeights(leadingRef.current, scrollerRef.current)
  }, [pinnedLeading])

  useLayoutEffect(() => {
    syncHeights()
  }, [syncHeights, children, pinnedLeading])

  useEffect(() => {
    updateScrollState()
    const scroller = scrollerRef.current
    const leading = leadingRef.current
    if (!scroller) return

    const observer =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            updateScrollState()
            syncHeights()
          })
        : null

    observer?.observe(scroller)
    if (leading) observer?.observe(leading)
    window.addEventListener('resize', syncHeights)

    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', syncHeights)
    }
  }, [updateScrollState, syncHeights, children, pinnedLeading])

  const scrollPane = (
    <div className="relative min-w-0 flex-1">
      <div
        ref={scrollerRef}
        onScroll={updateScrollState}
        className="scrollbar-thin w-full overflow-x-auto overscroll-x-contain"
      >
        <div
          className={cn(
            'w-full',
            APP_TABLE_SCROLL_INNER,
            pinnedLeading && '[&_table_th]:border-l-0 [&_table_td]:border-l-0',
          )}
          style={minWidth == null ? undefined : { minWidth }}
        >
          {children}
        </div>
      </div>

      {overflows && !atEnd ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background via-background/80 to-transparent sm:w-10"
        />
      ) : null}
    </div>
  )

  if (pinnedLeading) {
    return (
      <div className={cn('relative w-full min-w-0', className)}>
        <div className="flex w-full min-w-0 items-stretch overflow-hidden rounded-[inherit]">
          <div
            ref={leadingRef}
            className={cn(
              'relative shrink-0 overflow-hidden bg-card',
              // Flat grid seam at rest; raise + shadow only while metrics scroll underneath.
              scrolled
                ? 'z-30 shadow-[4px_0_14px_-4px_rgba(15,23,42,0.2)] dark:shadow-[4px_0_14px_-4px_rgba(0,0,0,0.55)]'
                : 'z-10',
            )}
          >
            {pinnedLeading}
          </div>
          {scrollPane}
        </div>
        {isSmall && overflows ? (
          <p className="mt-1 px-1 text-center text-[10px] text-muted-foreground sm:hidden">{hint}</p>
        ) : null}
      </div>
    )
  }

  return (
    <div className={cn('relative', className)}>
      {scrollPane}
      {isSmall && overflows ? (
        <p className="mt-1 px-1 text-center text-[10px] text-muted-foreground sm:hidden">{hint}</p>
      ) : null}
    </div>
  )
}
