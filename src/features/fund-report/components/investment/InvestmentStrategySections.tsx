import type { ReportSectionState } from '../../hooks/useReportSection'
import type { FundReportInvestment } from '../../schemas'
import { ReportGroupBoundary, TableSkeleton } from '../layout/ReportGroupBoundary'
import { SectionHeadline } from '../layout/StatHeadline'
import { SectionShell } from '../layout/SectionShell'
import { buildSipHeadline } from '../../lib/headlines/sectionHeadlines'
import { InvestmentMatrixPanel } from './InvestmentMatrixPanel'
import { SipCalculatorPanel } from './sip/SipCalculatorPanel'
import { StepUpSipCalculatorPanel } from './step-up-sip/StepUpSipCalculatorPanel'
import { SwpCalculatorPanel } from './swp/SwpCalculatorPanel'
import { StpCalculatorPanel } from './stp/StpCalculatorPanel'

type InvestmentSectionProps = {
  scheme: string
  investment: ReportSectionState<FundReportInvestment>
  startDate?: string
  isSharedView?: boolean
}

export function SipSection({ scheme, investment, startDate, isSharedView = false }: InvestmentSectionProps) {
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

      <InvestmentMatrixPanel
        scheme={scheme}
        startDate={startDate}
        isSharedView={isSharedView}
        title="SIP return matrix"
        tabs={[
          { value: 'SIP', label: 'XIRR Matrix' },
          { value: 'SIP_MULTIPLE', label: 'Multiplier Matrix' },
        ]}
      />
    </SectionShell>
  )
}

export function StepUpSipSection({
  scheme,
  investment,
  startDate,
  isSharedView = false,
}: InvestmentSectionProps) {
  return (
    <SectionShell
      id="step-up-sip"
      title="Step Up SIP Analysis"
      description="Increase your monthly SIP every year on each SIP anniversary — percentage or fixed amount."
    >
      <ReportGroupBoundary state={investment} skeleton={<TableSkeleton rows={4} />}>
        {(data) => (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              Step Up SIP starts at your chosen monthly amount and increases every 12 instalments.
              Outcomes use daily NAV history with the same tax rules as regular SIP redemptions.
            </p>
            <StepUpSipCalculatorPanel
              scheme={scheme}
              stepUpSip={data.stepUpSip}
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
        title="Step Up SIP return matrix"
        tabs={[
          { value: 'STEP_UP_SIP', label: 'XIRR Matrix' },
          { value: 'STEP_UP_SIP_MULTIPLE', label: 'Multiplier Matrix' },
        ]}
      />
    </SectionShell>
  )
}

export function StpSection({
  scheme,
  startDate,
  isSharedView = false,
}: Pick<InvestmentSectionProps, 'scheme' | 'startDate' | 'isSharedView'>) {
  return (
    <SectionShell
      id="stp"
      title="STP Analysis"
      description="Systematic Transfer Plan — park a lump sum in one fund, then transfer fixed tranches into this fund over time."
    >
      <p className="mb-4 text-sm text-muted-foreground">
        STP models a two-fund journey: your lump sum stays in a source fund (liquid/debt) while equal
        monthly transfers move into the target fund analysed in this report. Chart lines show parked
        balance, deployed balance, cumulative transfers, and total portfolio value.
      </p>

      <StpCalculatorPanel targetScheme={scheme} startDate={startDate} isSharedView={isSharedView} />

      <InvestmentMatrixPanel
        scheme={scheme}
        startDate={startDate}
        isSharedView={isSharedView}
        title="6-month STP return matrix"
        tabs={[
          { value: 'STP_6M', label: 'XIRR Matrix' },
          { value: 'STP_6M_MULTIPLE', label: 'Multiplier Matrix' },
        ]}
      />
    </SectionShell>
  )
}

export function SwpSection({
  scheme,
  startDate,
  isSharedView = false,
}: Pick<InvestmentSectionProps, 'scheme' | 'startDate' | 'isSharedView'>) {
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

      <InvestmentMatrixPanel
        scheme={scheme}
        startDate={startDate}
        isSharedView={isSharedView}
        title="SWP return matrix"
        tabs={[
          { value: 'SWP', label: 'XIRR Matrix' },
          { value: 'SWP_MULTIPLE', label: 'Multiplier Matrix' },
        ]}
      />
    </SectionShell>
  )
}
