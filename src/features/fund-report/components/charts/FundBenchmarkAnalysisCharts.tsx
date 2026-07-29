import { useMemo, useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { BenchmarkComparisonCharts } from '@/components/charts/BenchmarkComparisonCharts'
import { useFundAnalysis } from '@/hooks/useFundAnalysis'
import { DEFAULT_PERIOD, PERIODS, type Period } from '@/lib/constants'

type FundBenchmarkAnalysisChartsProps = {
  scheme: string
  startDate?: string
  offlineView?: boolean
}

export function FundBenchmarkAnalysisCharts({
  scheme,
  startDate,
  offlineView = false,
}: FundBenchmarkAnalysisChartsProps) {
  const [period, setPeriod] = useState<Period>(DEFAULT_PERIOD)

  const { data, loading, error } = useFundAnalysis(
    offlineView ? null : scheme,
    period,
    startDate,
  )

  const chartInput = useMemo(
    () => (data ? { fund: data.fund, benchmark: data.benchmark, period } : null),
    [data, period],
  )

  if (offlineView) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
        Fund vs benchmark charts are not included in shared snapshots.
      </p>
    )
  }

  if (error) {
    return (
      <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-6 text-sm text-destructive">
        {error}
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Same rolling-window charts as the fund analysis dashboard — switch the holding period below.
        </p>
        <Select value={period} onValueChange={(value) => setPeriod(value as Period)}>
          <SelectTrigger className="w-[140px]" aria-label="Rolling window">
            <SelectValue placeholder="Period" />
          </SelectTrigger>
          <SelectContent>
            {PERIODS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <BenchmarkComparisonCharts input={chartInput} loading={loading} />
    </div>
  )
}
