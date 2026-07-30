import type { ReactNode } from 'react'
import { Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { explainMetric } from '@/features/fund-report/lib/nav/metricDictionary'
import {
  appMetricCardClasses,
  appMetricHintClasses,
  appMetricLabelClasses,
  appMetricValueClasses,
} from '@/lib/ui/appCardStyles'
import { cn } from '@/lib/utils'

type AppMetricCardProps = {
  label: string
  value: ReactNode
  hint?: string
  metricKey?: string
  size?: 'sm' | 'md' | 'lg'
  valueVariant?: 'text' | 'numeric'
  className?: string
}

export function AppMetricCard({
  label,
  value,
  hint,
  metricKey,
  size = 'md',
  valueVariant = 'numeric',
  className,
}: AppMetricCardProps) {
  return (
    <div className={cn(appMetricCardClasses(size), className)}>
      <div className={appMetricLabelClasses(size)}>
        {label}
        {metricKey ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="size-3 shrink-0 cursor-help sm:size-3.5" />
              </TooltipTrigger>
              <TooltipContent>{explainMetric(metricKey)}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : null}
      </div>
      <div className={appMetricValueClasses(valueVariant, size)}>{value}</div>
      {hint ? <div className={appMetricHintClasses(size)}>{hint}</div> : null}
    </div>
  )
}
