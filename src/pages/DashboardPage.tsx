import { lazy, Suspense, useEffect, useMemo, useState, type ComponentType, type LazyExoticComponent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronDown, Download, Share2, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { FundSelector } from '@/components/dashboard/search/FundSelector'
import { DemoFundPicker } from '@/components/demo/DemoFundPicker'
import { AppMetricGrid } from '@/components/ui/AppMetricGrid'
import { StatCard } from '@/components/dashboard/cards/StatCard'
import { GoldenTriangleResultCard } from '@/components/dashboard/cards/GoldenTriangleResultCard'
import { InsightsPanel } from '@/components/dashboard/widgets/InsightsPanel'
import { RiskMeter } from '@/components/dashboard/charts/RiskMeter'
import { PerformanceTimeline } from '@/components/dashboard/charts/PerformanceTimeline'
import { FundIndexMatrixTable } from '@/components/fundsindia/FundIndexMatrixTable'
import { RollingReturnsPanel } from '@/components/charts/RollingReturnsPanel'
import { PageContainer } from '@/components/layout/PageContainer'
import { ErrorBoundary } from '@/components/layout/ErrorBoundary'
import { useFundAnalysis } from '@/hooks/useFundAnalysis'
import { useFundIndexMatrix } from '@/hooks/useFundIndexMatrix'
import { useAppContext } from '@/context/AppContext'
import { getStatCards } from '@/lib/analytics/chartData'
import { FeatureGate } from '@/components/common/FeatureGate'
import { DEFAULT_PERIOD, type Period } from '@/lib/constants'
import type { AnalysisInput, GoldenTriangleResult } from '@/lib/analytics/types'
import { exportAnalysisPdf, shareAnalysis } from '@/lib/export'

type ChartsGridProps = {
  input: AnalysisInput
  result: GoldenTriangleResult
  loading?: boolean
}

function lazyChartsGrid() {
  return import('@/components/charts/ChartsGrid')
    .then((m) => ({ default: m.ChartsGrid as ComponentType<ChartsGridProps> }))
    .catch(() =>
      import(/* @vite-ignore */ `@/components/charts/ChartsGrid?retry=${Date.now()}`).then((m) => ({
        default: m.ChartsGrid as ComponentType<ChartsGridProps>,
      })),
    )
}

const ChartsGrid = lazy(lazyChartsGrid) as LazyExoticComponent<ComponentType<ChartsGridProps>>

const STAT_SKELETON_KEYS = placeholderKeys('stat', 12)
const CHART_SKELETON_KEYS = placeholderKeys('chart', 8)

function placeholderKeys(prefix: string, count: number) {
  return Array.from({ length: count }, (_, i) => `${prefix}-${i}`)
}

function AnalysisSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Analyzing fund data</span>
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        Analyzing fund data...
      </div>
      <Skeleton className="h-[560px] w-full rounded-xl" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        {STAT_SKELETON_KEYS.map((key) => (
          <Skeleton key={key} className="h-[4.5rem] rounded-lg sm:h-24 sm:rounded-xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-72 rounded-xl lg:col-span-2" />
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
  const [showAllCharts, setShowAllCharts] = useState(false)
  const { addRecentAnalysis } = useAppContext()

  const { data, result, insights, timeline, loading, error } = useFundAnalysis(scheme, period)
  const {
    data: matrixData,
    loading: matrixLoading,
    error: matrixError,
  } = useFundIndexMatrix(scheme)

  useEffect(() => {
    if (result) addRecentAnalysis(result)
  }, [result, addRecentAnalysis])

  const statCards = useMemo(() => {
    if (!result) return []
    return getStatCards(result)
  }, [result])

  const chartInput = useMemo(
    () => (data ? { fund: data.fund, benchmark: data.benchmark, period } : null),
    [data, period],
  )

  return (
    <PageContainer width="wide">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fund Analysis Dashboard</h1>
          <p className="text-muted-foreground">Golden Triangle evaluation powered by live market data</p>
        </div>
        {result && (
          <div className="flex gap-2">
            <FeatureGate name="ui.exportPdf">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => exportAnalysisPdf(result, insights).then(() => toast.success('PDF exported'))}
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Export PDF
              </Button>
            </FeatureGate>
            <FeatureGate name="ui.share">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => shareAnalysis(result).then(() => toast.success('Link copied'))}
              >
                <Share2 className="h-4 w-4" aria-hidden="true" />
                Share
              </Button>
            </FeatureGate>
          </div>
        )}
      </div>

      <DemoFundPicker selectedScheme={scheme} onSelect={setScheme} />

      <FundSelector
        selectedScheme={scheme}
        onSelectScheme={setScheme}
        period={period}
        onPeriodChange={setPeriod}
        category={category}
        onCategoryChange={setCategory}
        benchmarkName={result?.benchmarkName}
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

      {scheme && (
        <FeatureGate name="ui.fundIndexMatrixTable">
          <ErrorBoundary title="Unable to render the fund index comparison table">
            <FundIndexMatrixTable data={matrixData} loading={matrixLoading} error={matrixError} />
          </ErrorBoundary>
        </FeatureGate>
      )}

      {!loading && result && data && chartInput && (
        <div className="space-y-6 sm:space-y-8">
          <FeatureGate name="ui.rollingReturnsPanel">
            <ErrorBoundary title="Unable to render the rolling returns chart">
              <RollingReturnsPanel
                input={chartInput}
                fundName={result.fundName}
                benchmarkName={result.benchmarkName}
              />
            </ErrorBoundary>
          </FeatureGate>

          <FeatureGate name="ui.statCards">
            <AppMetricGrid variant="wide">
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
            </AppMetricGrid>
          </FeatureGate>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <GoldenTriangleResultCard result={result} />
            </div>
            <FeatureGate name="ui.riskMeter">
              <RiskMeter result={result} />
            </FeatureGate>
          </div>

          <FeatureGate name="ui.insightsPanel">
            <InsightsPanel result={result} insights={insights} />
          </FeatureGate>

          <FeatureGate name="ui.performanceTimeline">
            <PerformanceTimeline events={timeline} />
          </FeatureGate>

          <FeatureGate name="ui.additionalCharts">
          <section className="rounded-xl border border-border/60 bg-card/30">
            <button
              type="button"
              className="flex w-full items-center justify-between px-6 py-4 text-left font-semibold"
              aria-expanded={showAllCharts}
              onClick={() => setShowAllCharts((prev) => !prev)}
            >
              <span>
                Additional Analytics Charts
                <span className="ml-2 text-sm font-normal text-muted-foreground">(17 charts)</span>
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
                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                      {CHART_SKELETON_KEYS.map((key, index) => (
                        <Skeleton
                          key={key}
                          className={`w-full rounded-xl ${index % 3 === 0 ? 'h-[520px] lg:col-span-2' : 'h-[480px]'}`}
                        />
                      ))}
                    </div>
                  }
                >
                  <ErrorBoundary title="Unable to render the analytics charts">
                    <ChartsGrid input={chartInput} result={result} loading={loading} />
                  </ErrorBoundary>
                </Suspense>
              </div>
            )}
          </section>
          </FeatureGate>
        </div>
      )}
    </PageContainer>
  )
}
