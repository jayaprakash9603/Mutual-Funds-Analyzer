import { useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { FundSelector } from '@/components/dashboard/search/FundSelector'
import { DemoFundPicker } from '@/components/demo/DemoFundPicker'
import { PageContainer } from '@/components/layout/PageContainer'
import { Skeleton } from '@/components/ui/skeleton'
import { ReportScrollProvider } from '@/features/fund-report/context/ReportScrollContext'
import { FundReportSections } from '@/features/fund-report/components/layout/FundReportSections'
import { ReportSectionNav, REPORT_SECTIONS } from '@/features/fund-report/components/layout/ReportSectionNav'
import { useProgressiveFundReport } from '@/features/fund-report/hooks/useProgressiveFundReport'
import { useSectionNav } from '@/features/fund-report/hooks/useSectionNav'
import { REPORT_SECTION_SCROLL_OFFSET } from '@/features/fund-report/lib/nav/reportScroll'

const SECTION_IDS = REPORT_SECTIONS.map((s) => s.id)

export function FundReportPage() {
  const { scheme: routeScheme } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const [scheme, setScheme] = useState(routeScheme ?? searchParams.get('scheme') ?? '')

  const [scrollOffset, setScrollOffset] = useState(REPORT_SECTION_SCROLL_OFFSET)

  const report = useProgressiveFundReport(scheme || null)
  const { activeSection, scrollToSection } = useSectionNav(SECTION_IDS, scrollOffset)

  const selectScheme = (next: string) => {
    setScheme(next)
    setSearchParams({ scheme: next })
  }

  const showInitialLoading = !!scheme && report.anyLoading && !report.overview.data
  const showGlobalError =
    !!scheme
    && !report.anyLoading
    && !report.overview.data
    && !report.performance.data
    && !report.risk.data
    && !report.investment.data
    && !report.assessment.data
    && [report.overview, report.performance, report.risk, report.investment, report.assessment].some(
      (group) => group.error,
    )

  return (
    <PageContainer width="wide">
      <ReportScrollProvider offset={scrollOffset}>
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Fund Report</h1>
        <p className="text-muted-foreground">
          FundsIndia-style analysis — returns, consistency, drawdowns, and investment verdict.
        </p>
      </header>

      <DemoFundPicker selectedScheme={scheme} onSelect={selectScheme} />

      <FundSelector mode="fund-only" selectedScheme={scheme} onSelectScheme={selectScheme} />

      <ReportSectionNav
        activeSection={activeSection}
        onSectionSelect={scrollToSection}
        onOffsetChange={setScrollOffset}
      />

      {showInitialLoading && (
        <div className="space-y-4" aria-busy="true" aria-live="polite">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Skeleton className="h-4 w-4 rounded-full" />
            Loading report for selected fund…
          </div>
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      )}

      {showGlobalError && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
          {report.overview.error
            ?? report.performance.error
            ?? report.risk.error
            ?? report.investment.error
            ?? report.assessment.error}
        </div>
      )}

      {!scheme && !report.anyLoading && (
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
          Search and select a fund to generate the full report.
        </div>
      )}

      {scheme && (
        <FundReportSections
          scheme={scheme}
          groups={report}
          overview={report.overview}
          performance={report.performance}
          risk={report.risk}
          investment={report.investment}
          assessment={report.assessment}
        />
      )}
      </ReportScrollProvider>
    </PageContainer>
  )
}

export default FundReportPage
