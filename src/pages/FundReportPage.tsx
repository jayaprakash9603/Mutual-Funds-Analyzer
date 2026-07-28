import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { FundSelector } from '@/components/dashboard/search/FundSelector'
import { DemoFundPicker } from '@/components/demo/DemoFundPicker'
import { PageContainer } from '@/components/layout/PageContainer'
import { Skeleton } from '@/components/ui/skeleton'
import { ReportScrollProvider } from '@/features/fund-report/context/ReportScrollContext'
import { FundReportSections } from '@/features/fund-report/components/layout/FundReportSections'
import { FundReportToolbar } from '@/features/fund-report/components/layout/FundReportToolbar'
import { ReportSectionNav, REPORT_SECTIONS } from '@/features/fund-report/components/layout/ReportSectionNav'
import { exportReportElementToPdf } from '@/features/fund-report/lib/export/exportReportPdf'
import {
  buildShareUrl,
  buildSnapshotFromGroups,
  hasSnapshotHash,
  isReportReadyForExport,
  readSnapshotFromLocationHashAsync,
  type SharedReportSnapshot,
} from '@/features/fund-report/lib/snapshot/reportSnapshot'
import { snapshotToGroups } from '@/features/fund-report/lib/snapshot/snapshotToGroups'
import { useProgressiveFundReport } from '@/features/fund-report/hooks/useProgressiveFundReport'
import { useSectionNav } from '@/features/fund-report/hooks/useSectionNav'
import { REPORT_SECTION_SCROLL_OFFSET } from '@/features/fund-report/lib/nav/reportScroll'
import type { PeerComparison } from '@/features/fund-report/schemas'

const SECTION_IDS = REPORT_SECTIONS.map((s) => s.id)
const EXPORT_ROOT_ID = 'fund-report-export-root'

export function FundReportPage() {
  const { scheme: routeScheme } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const [scheme, setScheme] = useState(routeScheme ?? searchParams.get('scheme') ?? '')

  const [scrollOffset, setScrollOffset] = useState(REPORT_SECTION_SCROLL_OFFSET)
  const [sharedSnapshot, setSharedSnapshot] = useState<SharedReportSnapshot | null>(null)
  const [snapshotLoading, setSnapshotLoading] = useState(hasSnapshotHash())
  const [snapshotError, setSnapshotError] = useState<string | null>(null)
  const [peersData, setPeersData] = useState<PeerComparison | null>(null)
  const [exporting, setExporting] = useState(false)
  const [sharing, setSharing] = useState(false)

  const peersRef = useRef<PeerComparison | null>(null)
  const onPeersLoaded = useCallback((peers: PeerComparison | null) => {
    peersRef.current = peers
    setPeersData(peers)
  }, [])

  useEffect(() => {
    if (!hasSnapshotHash()) {
      setSnapshotLoading(false)
      return
    }
    let cancelled = false
    setSnapshotLoading(true)
    readSnapshotFromLocationHashAsync()
      .then((snapshot) => {
        if (cancelled) return
        if (!snapshot) {
          setSnapshotError('Could not read shared report from this link.')
          setSharedSnapshot(null)
          return
        }
        setSharedSnapshot(snapshot)
        setScheme(snapshot.scheme)
        setSnapshotError(null)
      })
      .finally(() => {
        if (!cancelled) setSnapshotLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const isSharedView = sharedSnapshot != null
  const startDate = sharedSnapshot?.startDate ?? searchParams.get('start_date') ?? undefined

  const liveReport = useProgressiveFundReport(isSharedView ? null : scheme || null, startDate)
  const reportGroups = isSharedView ? snapshotToGroups(sharedSnapshot) : liveReport

  const { activeSection, scrollToSection } = useSectionNav(SECTION_IDS, scrollOffset)

  const selectScheme = (next: string) => {
    if (isSharedView) return
    setScheme(next)
    setSearchParams({ scheme: next })
  }

  const fundLabel =
    sharedSnapshot?.overview.profile.fundName
    ?? liveReport.overview.data?.profile.fundName
    ?? scheme
    ?? 'Fund report'

  const canExport = isSharedView || isReportReadyForExport(liveReport)

  const handleDownloadPdf = async () => {
    const root = document.getElementById(EXPORT_ROOT_ID)
    if (!root) {
      toast.error('Report content is not ready for export yet.')
      return
    }
    setExporting(true)
    try {
      await exportReportElementToPdf(root, fundLabel)
      toast.success('PDF downloaded')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'PDF export failed')
    } finally {
      setExporting(false)
    }
  }

  const buildCurrentSnapshot = useCallback((): SharedReportSnapshot | null => {
    if (isSharedView) return sharedSnapshot
    return buildSnapshotFromGroups(scheme, startDate, liveReport, peersRef.current ?? peersData)
  }, [isSharedView, sharedSnapshot, scheme, startDate, liveReport, peersData])

  const handleCopyShareLink = async () => {
    setSharing(true)
    try {
      const snapshot = buildCurrentSnapshot()
      if (!snapshot) throw new Error('Wait for the full report to finish loading before sharing.')
      const url = await buildShareUrl(snapshot)
      await navigator.clipboard.writeText(url)
    } finally {
      setSharing(false)
    }
  }

  const showInitialLoading =
    !isSharedView && !!scheme && liveReport.anyLoading && !liveReport.overview.data

  const showGlobalError =
    !isSharedView
    && !!scheme
    && !liveReport.anyLoading
    && !liveReport.overview.data
    && !liveReport.performance.data
    && !liveReport.risk.data
    && !liveReport.investment.data
    && !liveReport.assessment.data
    && [liveReport.overview, liveReport.performance, liveReport.risk, liveReport.investment, liveReport.assessment].some(
      (group) => group.error,
    )

  const showReport = isSharedView || !!scheme

  return (
    <PageContainer width="wide">
      <ReportScrollProvider offset={scrollOffset}>
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Fund Report</h1>
          <p className="text-muted-foreground">
            FundsIndia-style analysis — returns, consistency, drawdowns, and investment verdict.
          </p>
        </header>

        {!isSharedView && (
          <>
            <DemoFundPicker selectedScheme={scheme} onSelect={selectScheme} />
            <FundSelector mode="fund-only" selectedScheme={scheme} onSelectScheme={selectScheme} />
          </>
        )}

        {snapshotLoading && (
          <div className="rounded-lg border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            Loading shared report snapshot…
          </div>
        )}

        {snapshotError && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
            {snapshotError}
          </div>
        )}

        {showReport && !snapshotLoading && (
          <>
            <FundReportToolbar
              canExport={canExport}
              exporting={exporting}
              sharing={sharing}
              fundLabel={fundLabel}
              isSharedView={isSharedView}
              onDownloadPdf={() => void handleDownloadPdf()}
              onShareLink={handleCopyShareLink}
              onCopyLink={handleCopyShareLink}
            />

            <ReportSectionNav
              activeSection={activeSection}
              onSectionSelect={scrollToSection}
              onOffsetChange={setScrollOffset}
            />
          </>
        )}

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
            {liveReport.overview.error
              ?? liveReport.performance.error
              ?? liveReport.risk.error
              ?? liveReport.investment.error
              ?? liveReport.assessment.error}
          </div>
        )}

        {!showReport && !snapshotLoading && !liveReport.anyLoading && (
          <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
            Search and select a fund to generate the full report.
          </div>
        )}

        {showReport && !snapshotLoading && (
          <FundReportSections
            scheme={isSharedView ? sharedSnapshot.scheme : scheme}
            groups={reportGroups}
            overview={reportGroups.overview}
            performance={reportGroups.performance}
            risk={reportGroups.risk}
            investment={reportGroups.investment}
            assessment={reportGroups.assessment}
            peersSnapshot={sharedSnapshot?.peers ?? null}
            isSharedView={isSharedView}
            onPeersLoaded={onPeersLoaded}
            exportRootId={EXPORT_ROOT_ID}
            exportTitle={fundLabel}
          />
        )}
      </ReportScrollProvider>
    </PageContainer>
  )
}

export default FundReportPage
