import type { ReactNode } from 'react'
import { AppMetricGrid } from '@/components/ui/AppMetricGrid'

type InvestmentSummaryMetricsProps = {
  children: ReactNode
  /** Use wide layout when showing 5–6 summary tiles (e.g. step-up SIP). */
  wide?: boolean
  className?: string
}

export function InvestmentSummaryMetrics({ children, wide = false, className }: InvestmentSummaryMetricsProps) {
  return (
    <AppMetricGrid variant={wide ? 'nestedWide' : 'nested'} className={className}>
      {children}
    </AppMetricGrid>
  )
}
