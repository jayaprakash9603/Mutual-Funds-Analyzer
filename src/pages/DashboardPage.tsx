import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronDown, Download, Share2, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { FundSelector } from '@/components/dashboard/FundSelector'
import { StatCard } from '@/components/dashboard/StatCard'
import { GoldenTriangleResultCard } from '@/components/dashboard/GoldenTriangleResultCard'
import { InsightsPanel } from '@/components/dashboard/InsightsPanel'
import { RiskMeter, PerformanceTimeline } from '@/components/dashboard/RiskMeter'
import { ManualInputsSection } from '@/components/dashboard/ManualInputsSection'
import { RollingReturnsPanel } from '@/components/charts/RollingReturnsPanel'
import { ErrorBoundary } from '@/components/layout/ErrorBoundary'
import { useFundAnalysis } from '@/hooks/useFundAnalysis'
import { useAppContext } from '@/context/AppContext'
import { getStatCards, getPerformanceTimeline } from '@/lib/analytics/chartData'
import type { ManualInputsForm } from '@/api/schemas'
import { DEFAULT_PERIOD, type Period } from '@/lib/constants'
import { exportAnalysisPdf, shareAnalysis } from '@/lib/export'

const ChartsGrid = lazy(() =>
  import('@/components/charts/ChartsGrid').then((m) => ({ default: m.ChartsGrid })),
)

function AnalysisSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Analyzing fund data</span>
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        Analyzing fund data...
      </div>
      <Skeleton className="h-[560px] w-full rounded-xl" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {Array.from({ length: 14 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    </div>
  )
}

export function DashboardPage() {
  const [searchParams] = useSearchParams()
  const initialScheme = searchParams.get('scheme')
  const [scheme, setScheme] = useState<string | null>(initialScheme)
  const [period, setPeriod] = useState<Period>(DEFAULT_PERIOD)
  const [category, setCategory] = useState('All')
  const [manual, setManual] = useState<ManualInputsForm>({})
  const [showAllCharts, setShowAllCharts] = useState(false)
  const { addRecentAnalysis } = useAppContext()

  const { data, result, insights, loading, error } = useFundAnalysis(scheme, period, undefined, manual)

  useEffect(() => {
    if (result) addRecentAnalysis(result)
  }, [result, addRecentAnalysis])

  const statCards = useMemo(() => {
    if (!result) return []
    return getStatCards(result, manual)
  }, [result, manual])

  const timeline = useMemo(() => {
    if (!result || !data) return []
    return getPerformanceTimeline(result, data.fund)
  }, [result, data])

  const chartInput = useMemo(
    () => (data ? { fund: data.fund, benchmark: data.benchmark, period } : null),
    [data, period],
  )

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fund Analysis Dashboard</h1>
          <p className="text-muted-foreground">Golden Triangle evaluation powered by live market data</p>
        </div>
        {result && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => exportAnalysisPdf(result, insights).then(() => toast.success('PDF exported'))}
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Export PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => shareAnalysis(result).then(() => toast.success('Link copied'))}
            >
              <Share2 className="h-4 w-4" aria-hidden="true" />
              Share
            </Button>
          </div>
        )}
      </div>

      <FundSelector
        selectedScheme={scheme}
        onSelectScheme={setScheme}
        period={period}
        onPeriodChange={setPeriod}
        category={category}
        onCategoryChange={setCategory}
        benchmarkName={result?.benchmarkName}
      />

      <ManualInputsSection
        values={manual}
        onChange={setManual}
        fundAgeYears={result?.metrics.fundAgeYears}
      />

      {loading && <AnalysisSkeleton />}

      {error && !loading && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
          <p>{error}</p>
        </div>
      )}

      {!scheme && !loading && (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
          Search and select a mutual fund to begin analysis
        </div>
      )}

      {!loading && result && data && chartInput && (
        <>
          <ErrorBoundary title="Unable to render the rolling returns chart">
            <RollingReturnsPanel
              input={chartInput}
              fundName={result.fundName}
              benchmarkName={result.benchmarkName}
            />
          </ErrorBoundary>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {statCards.map((card, i) => (
              <StatCard
                key={card.label}
                label={card.label}
                value={card.value}
                display={card.display}
                suffix={card.suffix}
                format={card.format as 'percent' | 'decimal' | 'text'}
                index={i}
              />
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <GoldenTriangleResultCard result={result} />
            <InsightsPanel result={result} insights={insights} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <RiskMeter result={result} />
            <PerformanceTimeline events={timeline} />
          </div>

          <section className="rounded-xl border border-border/60 bg-card/30">
            <button
              type="button"
              className="flex w-full items-center justify-between px-6 py-4 text-left font-semibold"
              aria-expanded={showAllCharts}
              onClick={() => setShowAllCharts((prev) => !prev)}
            >
              <span>
                Additional Analytics Charts
                <span className="ml-2 text-sm font-normal text-muted-foreground">(18 charts)</span>
              </span>
              <ChevronDown
                className={`h-5 w-5 shrink-0 transition-transform ${showAllCharts ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>
            {showAllCharts && (
              <div className="border-t border-border/60 p-4">
                <Suspense
                  fallback={
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-72 rounded-xl" />
                      ))}
                    </div>
                  }
                >
                  <ErrorBoundary title="Unable to render the analytics charts">
                    <ChartsGrid
                      input={chartInput}
                      result={result}
                      manual={manual}
                      loading={loading}
                    />
                  </ErrorBoundary>
                </Suspense>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
