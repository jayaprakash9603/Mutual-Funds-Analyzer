import type { ReactNode } from 'react'
import {
  appMetricGrid,
  appMetricGridCompact,
  appMetricGridWide,
} from '@/lib/ui/appCardStyles'
import { cn } from '@/lib/utils'

type AppMetricGridProps = {
  children: ReactNode
  className?: string
  variant?: 'default' | 'compact' | 'wide'
}

export function AppMetricGrid({ children, className, variant = 'default' }: AppMetricGridProps) {
  const gridClass =
    variant === 'compact'
      ? appMetricGridCompact
      : variant === 'wide'
        ? appMetricGridWide
        : appMetricGrid

  return <div className={cn(gridClass, className)}>{children}</div>
}
