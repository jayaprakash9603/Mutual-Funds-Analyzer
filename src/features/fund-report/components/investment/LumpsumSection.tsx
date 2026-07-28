import { ReportGroupBoundary, TableSkeleton } from '../layout/ReportGroupBoundary'
import { SectionHeadline } from '../layout/StatHeadline'
import { SectionShell } from '../layout/SectionShell'
import { buildLumpsumHeadline } from '../../lib/headlines/sectionHeadlines'
import type { ReportSectionState } from '../../hooks/useReportSection'
import type { FundReportInvestment } from '../../schemas'
import { InvestmentMatrixPanel } from './InvestmentMatrixPanel'
import { LumpsumCalculatorPanel } from './lumpsum/LumpsumCalculatorPanel'

type LumpsumSectionProps = {
  scheme: string
  investment: ReportSectionState<FundReportInvestment>
  startDate?: string
  isSharedView?: boolean
}

export function LumpsumSection({
  scheme,
  investment,
  startDate,
  isSharedView = false,
}: LumpsumSectionProps) {
  return (
    <SectionShell id="lumpsum" title="Lump Sum Analysis">
      <ReportGroupBoundary state={investment} skeleton={<TableSkeleton rows={4} />}>
        {(data) => (
          <>
            <SectionHeadline className="mb-2" headline={buildLumpsumHeadline(data.lumpsum)} />
            <p className="mb-4 text-sm text-muted-foreground">
              One-time investment at fund inception. Corpus growth follows NAV from the first available
              trading day through the latest NAV.
            </p>
            <LumpsumCalculatorPanel
              scheme={scheme}
              lumpsum={data.lumpsum}
              startDate={startDate}
              isSharedView={isSharedView}
            />
          </>
        )}
      </ReportGroupBoundary>

      <InvestmentMatrixPanel
        scheme={scheme}
        startDate={startDate}
        isSharedView={isSharedView}
        title="Lump sum return matrix"
        tabs={[
          { value: 'LUMPSUM', label: 'CAGR Matrix' },
          { value: 'MULTIPLE', label: 'Multiplier Matrix' },
        ]}
      />
    </SectionShell>
  )
}
