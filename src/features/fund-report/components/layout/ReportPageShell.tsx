import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type ReportPageShellProps = {
  sidebar: ReactNode
  sidebarVisible?: boolean
  children: ReactNode
  className?: string
}

export function ReportPageShell({
  sidebar,
  sidebarVisible = false,
  children,
  className,
}: ReportPageShellProps) {
  return (
    <div className={cn('relative w-full', className)}>
      {sidebarVisible ? sidebar : null}
      <div
        className={cn(
          'min-w-0',
          sidebarVisible && 'lg:pl-[var(--report-sidebar-width)]',
        )}
      >
        {children}
      </div>
    </div>
  )
}
