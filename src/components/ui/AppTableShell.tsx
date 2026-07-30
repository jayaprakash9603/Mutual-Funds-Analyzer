import type { ReactNode } from 'react'
import {
  APP_TABLE_SHELL,
  APP_TABLE_SHELL_FOOTER,
  APP_TABLE_SHELL_HEADER,
  APP_TABLE_SHELL_META,
  APP_TABLE_SHELL_SUBTITLE,
  APP_TABLE_SHELL_TITLE,
} from '@/lib/ui/appTableStyles'
import { cn } from '@/lib/utils'

type AppTableShellProps = {
  title: ReactNode
  subtitle?: ReactNode
  meta?: ReactNode
  footer?: ReactNode
  children: ReactNode
  className?: string
}

export function AppTableShell({
  title,
  subtitle,
  meta,
  footer,
  children,
  className,
}: AppTableShellProps) {
  return (
    <div className={cn(APP_TABLE_SHELL, className)}>
      <div className={APP_TABLE_SHELL_HEADER}>
        <h2 className={APP_TABLE_SHELL_TITLE}>{title}</h2>
        {subtitle ? (
          <p className={cn(APP_TABLE_SHELL_SUBTITLE, 'truncate')} title={typeof subtitle === 'string' ? subtitle : undefined}>
            {subtitle}
          </p>
        ) : null}
      </div>
      {meta ? <div className={APP_TABLE_SHELL_META}>{meta}</div> : null}
      {children}
      {footer ? <div className={APP_TABLE_SHELL_FOOTER}>{footer}</div> : null}
    </div>
  )
}
