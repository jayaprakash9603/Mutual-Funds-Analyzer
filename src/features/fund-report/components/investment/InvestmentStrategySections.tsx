import { useFundReportMatrix } from '../../hooks/useFundReportMatrix'
import type { ReportSectionState } from '../../hooks/useReportSection'
import type { FundReportInvestment } from '../../schemas'
import { HeatMatrix, HeatMatrixSkeleton } from '../charts/HeatMatrix'
import { RareInstancesMatrixTable } from '../tables/RareInstancesMatrixTable'
import { ReportGroupBoundary, TableSkeleton } from '../layout/ReportGroupBoundary'
import { SectionHeadline } from '../layout/StatHeadline'
import { SectionShell } from '../layout/SectionShell'
import { buildSipHeadline } from '../../lib/headlines/sectionHeadlines'
import { SipCalculatorPanel } from './sip/SipCalculatorPanel'
import { SwpCalculatorPanel } from './swp/SwpCalculatorPanel'

type InvestmentSectionProps = {
  scheme: string
  investment: ReportSectionState<FundReportInvestment>
  startDate?: string
  isSharedView?: boolean
}

export function SipSection({ scheme, investment, startDate, isSharedView = false }: InvestmentSectionProps) {
  const matrixEnabled = !!scheme && !isSharedView
  const { data: sipMatrix, loading: sipMatrixLoading, error: sipMatrixError, retry: retrySipMatrix } =
    useFundReportMatrix(scheme || null, 'SIP', matrixEnabled, startDate)

  return (
    <SectionShell
      id="sip"
      title="SIP Analysis"
      description="Systematic Investment Plan — schedule monthly instalments and track corpus growth over time."
    >
      <ReportGroupBoundary state={investment} skeleton={<TableSkeleton rows={4} />}>
        {(data) => (
          <>
            <SectionHeadline className="mb-2" headline={buildSipHeadline(data.sip)} />
            <p className="mb-4 text-sm text-muted-foreground">
              Monthly SIP outcomes from daily NAV history. Tax assumes a full redemption today:
              each instalment is taxed as its own lot — units held over 1 year at 12.5% above ₹1.25
              lakh, newer units at 20%.
            </p>
            <SipCalculatorPanel
              scheme={scheme}
              sip={data.sip}
              startDate={startDate}
              isSharedView={isSharedView}
            />
          </>
        )}
      </ReportGroupBoundary>

      <div className="mt-6">
        <h4 className="mb-3 text-sm font-semibold text-foreground">SIP return matrix</h4>
        {isSharedView ? (
          <p className="text-sm text-muted-foreground">SIP matrix is not included in shared snapshots.</p>
        ) : sipMatrixLoading ? (
          <HeatMatrixSkeleton />
        ) : sipMatrixError ? (
          <div className="space-y-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            <p>{sipMatrixError}</p>
            <button
              type="button"
              onClick={retrySipMatrix}
              className="rounded-lg border border-destructive/40 px-3 py-1.5 text-xs font-medium"
            >
              Retry
            </button>
          </div>
        ) : sipMatrix && sipMatrix.dataRows.length > 0 ? (
          <div>
            <HeatMatrix data={sipMatrix} />
            {sipMatrix.recovery ? (
              <RareInstancesMatrixTable matrix={sipMatrix} recovery={sipMatrix.recovery} />
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Matrix data is not available yet.</p>
        )}
      </div>
    </SectionShell>
  )
}

export function StpSection({ scheme, isSharedView = false }: Pick<InvestmentSectionProps, 'scheme' | 'isSharedView'>) {
  const matrixEnabled = !!scheme && !isSharedView
  const { data: stpMatrix, loading: stpMatrixLoading, error: stpMatrixError, retry: retryStpMatrix } =
    useFundReportMatrix(scheme || null, 'STP_6M', matrixEnabled)

  return (
    <SectionShell
      id="stp"
      title="STP Analysis"
      description="Systematic Transfer Plan — deploy a lump sum in tranches over time."
    >
      <p className="mb-4 text-sm text-muted-foreground">
        Systematic Transfer Plan (STP) deploys a lump sum in tranches over time. Full STP scenario
        analysis is coming in a future update.
      </p>
      <div>
        <h4 className="mb-3 text-sm font-semibold text-foreground">6-month STP matrix</h4>
        {isSharedView ? (
          <p className="text-sm text-muted-foreground">STP matrix is not included in shared snapshots.</p>
        ) : stpMatrix ? (
          <div className={stpMatrixLoading ? 'opacity-70 transition-opacity' : undefined}>
            <HeatMatrix data={stpMatrix} />
            {stpMatrix.recovery ? (
              <RareInstancesMatrixTable matrix={stpMatrix} recovery={stpMatrix.recovery} />
            ) : null}
          </div>
        ) : stpMatrixLoading ? (
          <HeatMatrixSkeleton />
        ) : stpMatrixError ? (
          <div className="space-y-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            <p>{stpMatrixError}</p>
            <button
              type="button"
              onClick={retryStpMatrix}
              className="rounded-lg border border-destructive/40 px-3 py-1.5 text-xs font-medium"
            >
              Retry
            </button>
          </div>
        ) : null}
      </div>
    </SectionShell>
  )
}

export function SwpSection({ scheme, startDate, isSharedView = false }: Pick<InvestmentSectionProps, 'scheme' | 'startDate' | 'isSharedView'>) {
  return (
    <SectionShell
      id="swp"
      title="SWP Analysis"
      description="Systematic Withdrawal Plan — invest a lump sum and withdraw fixed amounts each month."
    >
      <p className="mb-4 text-sm text-muted-foreground">
        Systematic Withdrawal Plan (SWP) invests a lump sum at inception, then withdraws a fixed
        amount each month. Tax on withdrawals uses the same equity STCG/LTCG rules as SIP redemptions.
      </p>
      <SwpCalculatorPanel scheme={scheme} startDate={startDate} isSharedView={isSharedView} />
    </SectionShell>
  )
}
