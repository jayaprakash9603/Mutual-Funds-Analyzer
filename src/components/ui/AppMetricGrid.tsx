import type { ReactNode } from 'react'
import {
  appMetricGrid,
  appMetricGridCompact,
  appMetricGridNested,
  appMetricGridNestedWide,
  appMetricGridPair,
  appMetricGridWide,
} from '@/lib/ui/appCardStyles'
import { cn } from '@/lib/utils'

type AppMetricGridProps = {
  children: ReactNode
  className?: string
  variant?: 'default' | 'compact' | 'wide' | 'nested' | 'nestedWide' | 'pair'
}

export function AppMetricGrid({ children, className, variant = 'default' }: AppMetricGridProps) {
  const gridClass =
    variant === 'compact'
      ? appMetricGridCompact
      : variant === 'wide'
        ? appMetricGridWide
        : variant === 'nested'
          ? appMetricGridNested
          : variant === 'nestedWide'
            ? appMetricGridNestedWide
            : variant === 'pair'
              ? appMetricGridPair
              : appMetricGrid

  return <div className={cn(gridClass, className)}>{children}</div>
}
