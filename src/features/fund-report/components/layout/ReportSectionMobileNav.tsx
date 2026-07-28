import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { centerElementInScroller } from '../../lib/nav/reportScroll'
import { REPORT_SECTIONS } from '../../lib/nav/reportSectionCatalog'

type ReportSectionMobileNavProps = {
  activeSection: string
  onSectionSelect: (id: string) => void
  className?: string
}

export function ReportSectionMobileNav({
  activeSection,
  onSectionSelect,
  className,
}: ReportSectionMobileNavProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) return
    const activeButton = scroller.querySelector<HTMLElement>(`[data-section-id="${activeSection}"]`)
    if (activeButton) {
      centerElementInScroller(scroller, activeButton)
    }
  }, [activeSection])

  return (
    <nav
      aria-label="Report sections"
      style={{ top: 'var(--report-page-top)' }}
      className={cn(
        'sticky z-20 -mx-4 border-b border-border/50 bg-background/95 px-4 py-2 backdrop-blur-sm lg:hidden',
        className,
      )}
    >
      <div
        ref={scrollerRef}
        className="flex gap-1 overflow-x-auto scrollbar-thin pb-0.5"
      >
        {REPORT_SECTIONS.map((section) => {
          const isActive = activeSection === section.id
          return (
            <button
              key={section.id}
              type="button"
              data-section-id={section.id}
              onClick={() => onSectionSelect(section.id)}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
              )}
            >
              {section.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
