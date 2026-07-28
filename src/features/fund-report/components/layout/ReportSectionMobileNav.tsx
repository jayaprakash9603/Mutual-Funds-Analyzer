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
        'sticky z-20 -mx-4 border-b border-border/60 bg-background/98 backdrop-blur-md lg:hidden',
        className,
      )}
    >
      <div
        ref={scrollerRef}
        className="flex gap-0 overflow-x-auto px-1 scrollbar-none"
        role="tablist"
      >
        {REPORT_SECTIONS.map((section) => {
          const isActive = activeSection === section.id
          return (
            <button
              key={section.id}
              type="button"
              role="tab"
              data-section-id={section.id}
              onClick={() => onSectionSelect(section.id)}
              aria-selected={isActive}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'relative shrink-0 px-3.5 pb-2.5 pt-3 text-xs font-medium transition-colors sm:px-4 sm:text-sm',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {section.label}
              <span
                aria-hidden="true"
                className={cn(
                  'absolute inset-x-2 bottom-0 h-0.5 rounded-full transition-opacity',
                  isActive ? 'bg-primary opacity-100' : 'bg-transparent opacity-0',
                )}
              />
            </button>
          )
        })}
      </div>
    </nav>
  )
}
