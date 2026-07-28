import type { ComponentType } from 'react'
import { cn } from '@/lib/utils'
import { REPORT_PAGE_TOP_PX } from '../../lib/nav/reportLayoutConstants'
import { SECTION_GROUPS } from '../../lib/nav/reportSectionCatalog'

export const REPORT_SIDEBAR_WIDTH_PX = 240

type ReportSectionSidebarProps = {
  activeSection: string
  onSectionSelect: (id: string) => void
  fundLabel?: string
  className?: string
}

export function ReportSectionSidebar({
  activeSection,
  onSectionSelect,
  fundLabel,
  className,
}: ReportSectionSidebarProps) {
  return (
    <aside
      aria-label="Report sections"
      style={{ top: `${REPORT_PAGE_TOP_PX}px` }}
      className={cn(
        'fixed bottom-0 left-0 z-30 hidden w-[var(--report-sidebar-width)] flex-col border-r border-border/50 bg-muted/25 dark:bg-muted/10 lg:flex',
        className,
      )}
    >
      {fundLabel ? (
        <div className="shrink-0 border-b border-border/40 px-3 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Report
          </p>
          <p className="mt-0.5 truncate text-xs font-medium leading-snug text-foreground" title={fundLabel}>
            {fundLabel}
          </p>
        </div>
      ) : null}

      <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2 scrollbar-thin">
        {SECTION_GROUPS.map((group) => (
          <div key={group.id} className="pb-1">
            <p className="px-2 pb-1 pt-2 text-[11px] font-medium text-muted-foreground/90 first:pt-1">
              {group.label}
            </p>
            <ul className="space-y-0.5" role="list">
              {group.sections.map((section) => {
                const Icon = section.icon as ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' }>
                const isActive = activeSection === section.id
                return (
                  <li key={section.id}>
                    <button
                      type="button"
                      onClick={() => onSectionSelect(section.id)}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] leading-tight transition-colors duration-150',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
                        isActive
                          ? 'bg-accent font-medium text-accent-foreground'
                          : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                      )}
                    >
                      <Icon className="size-4 shrink-0 opacity-80" aria-hidden="true" />
                      <span className="truncate">{section.label}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  )
}
