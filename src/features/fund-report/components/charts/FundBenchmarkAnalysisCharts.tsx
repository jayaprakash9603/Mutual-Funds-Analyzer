import { useMemo, useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { BenchmarkComparisonCharts } from '@/components/charts/BenchmarkComparisonCharts'
import { RollingReturnsPanel } from '@/components/charts/RollingReturnsPanel'
import { FundIndexMatrixTable } from '@/components/fundsindia/FundIndexMatrixTable'
import { useFundAnalysis } from '@/hooks/useFundAnalysis'
import { useFundIndexMatrix } from '@/hooks/useFundIndexMatrix'
import { DEFAULT_PERIOD, PERIODS, type Period } from '@/lib/constants'

type FundBenchmarkAnalysisChartsProps = {
  scheme: string
  fundName: string
  benchmarkName: string
  startDate?: string
  offlineView?: boolean
}

export function FundBenchmarkAnalysisCharts({
  scheme,
  fundName,
  benchmarkName,
  startDate,
  offlineView = false,
}: FundBenchmarkAnalysisChartsProps) {
  const [period, setPeriod] = useState<Period>(DEFAULT_PERIOD)

  const {
    data,
    result,
    loading: analysisLoading,
    error: analysisError,
  } = useFundAnalysis(offlineView ? null : scheme, period, startDate)

  const {
    data: matrixData,
    loading: matrixLoading,
    error: matrixError,
  } = useFundIndexMatrix(offlineView ? null : scheme, startDate, !offlineView)

  const chartInput = useMemo(
    () => (data ? { fund: data.fund, benchmark: data.benchmark, period } : null),
    [data, period],
  )

  const resolvedFundName = result?.fundName ?? fundName
  const resolvedBenchmarkName = result?.benchmarkName ?? benchmarkName

  if (offlineView) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
        Fund vs benchmark charts and parameter tables are not included in shared snapshots.
      </p>
    )
  }

  return (
    <div className="space-y-6">
      <FundIndexMatrixTable
        data={matrixData}
        loading={matrixLoading}
        error={matrixError}
        consistencyScore={result?.metrics.consistencyScore}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Rolling return detail for the selected window — same views as the fund analysis dashboard.
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

      {analysisError ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-6 text-sm text-destructive">
          {analysisError}
        </p>
      ) : null}

      {chartInput ? (
        <RollingReturnsPanel
          input={chartInput}
          fundName={resolvedFundName}
          benchmarkName={resolvedBenchmarkName}
        />
      ) : analysisLoading ? (
        <div className="rounded-xl border border-border/60 bg-card/40 px-4 py-12 text-center text-sm text-muted-foreground">
          Loading rolling return comparison…
        </div>
      ) : null}

      <BenchmarkComparisonCharts input={chartInput} loading={analysisLoading} />
    </div>
  )
}
