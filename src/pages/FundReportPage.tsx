import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { isDemoBuild } from '@/demo/config/demoMode'
import { PageContainer } from '@/components/layout/PageContainer'
import { Skeleton } from '@/components/ui/skeleton'
import { ReportScrollProvider, REPORT_PAGE_TOP_PX } from '@/features/fund-report/context/ReportScrollContext'
import { FundReportSections } from '@/features/fund-report/components/layout/FundReportSections'
import { ReportStickyHeader, ReportStickyHeaderSpacer } from '@/features/fund-report/components/layout/ReportStickyHeader'
import { ReportPageShell } from '@/features/fund-report/components/layout/ReportPageShell'
import { ReportSectionMobileNav } from '@/features/fund-report/components/layout/ReportSectionMobileNav'
import { ReportSectionSidebar } from '@/features/fund-report/components/layout/ReportSectionSidebar'
import { DEFAULT_REPORT_SECTION } from '@/features/fund-report/lib/nav/reportSectionCatalog'
import {
  ALL_REPORT_GROUP_KEYS,
  groupsRequiredForSections,
} from '@/features/fund-report/lib/nav/reportSectionRequirements'
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
import type { PeerComparison } from '@/features/fund-report/schemas'

const EXPORT_ROOT_ID = 'fund-report-export-root'

export function FundReportPage() {
  const { scheme: routeScheme } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const [scheme, setScheme] = useState(routeScheme ?? searchParams.get('scheme') ?? '')

  const [activeSection, setActiveSection] = useState(DEFAULT_REPORT_SECTION)
  const [visitedSections, setVisitedSections] = useState<Set<string>>(
    () => new Set([DEFAULT_REPORT_SECTION]),
  )
  const [renderAllSections, setRenderAllSections] = useState(false)

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
    let cancelled = false

    const loadSnapshot = () => {
      if (!hasSnapshotHash()) {
        if (!cancelled) {
          setSnapshotLoading(false)
          setSharedSnapshot(null)
          setSnapshotError(null)
        }
        return
      }
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
    }

    loadSnapshot()
    window.addEventListener('hashchange', loadSnapshot)
    return () => {
      cancelled = true
      window.removeEventListener('hashchange', loadSnapshot)
    }
  }, [])

  useEffect(() => {
    setActiveSection(DEFAULT_REPORT_SECTION)
    setVisitedSections(new Set([DEFAULT_REPORT_SECTION]))
  }, [scheme])

  const isSharedView = sharedSnapshot != null
  const startDate = sharedSnapshot?.startDate ?? searchParams.get('start_date') ?? undefined

  const enabledGroups = useMemo(() => {
    if (isSharedView || renderAllSections) {
      return new Set(ALL_REPORT_GROUP_KEYS)
    }
    return groupsRequiredForSections(visitedSections)
  }, [isSharedView, renderAllSections, visitedSections])

  const liveReport = useProgressiveFundReport(isSharedView ? null : scheme || null, startDate, {
    enabledGroups,
  })
  const reportGroups = isSharedView ? snapshotToGroups(sharedSnapshot) : liveReport

  const selectSection = useCallback((sectionId: string) => {
    setActiveSection(sectionId)
    setVisitedSections((prev) => {
      if (prev.has(sectionId)) return prev
      const next = new Set(prev)
      next.add(sectionId)
      return next
    })
  }, [])

  const selectScheme = (next: string) => {
    if (isSharedView) return
    setScheme(next)
    setSearchParams({ scheme: next })
  }

  const liveReportRef = useRef(liveReport)
  liveReportRef.current = liveReport

  const fundLabel =
    sharedSnapshot?.overview.profile.fundName
    ?? liveReport.overview.data?.profile.fundName
    ?? scheme
    ?? 'Fund report'

  const exportActionsEnabled = isSharedView || Boolean(scheme)
  const exportReady = isSharedView || isReportReadyForExport(liveReport)

  const waitForExportReady = useCallback(async (): Promise<boolean> => {
    if (isSharedView) return true
    if (isReportReadyForExport(liveReportRef.current)) return true

    setRenderAllSections(true)
    const deadline = Date.now() + 90_000

    while (Date.now() < deadline) {
      await new Promise((resolve) => window.setTimeout(resolve, 250))
      const current = liveReportRef.current
      if (isReportReadyForExport(current)) return true

      const groups = [current.overview, current.performance, current.risk, current.investment, current.assessment]
      const stillLoading = groups.some((group) => group.loading)
      const failed = groups.some((group) => group.error)
      if (!stillLoading && failed) return false
      if (!stillLoading && !isReportReadyForExport(current)) return false
    }

    return isReportReadyForExport(liveReportRef.current)
  }, [isSharedView])

  const handleDownloadPdf = async () => {
    if (!exportActionsEnabled) {
      toast.error('Select a fund first.')
      return
    }

    setExporting(true)
    try {
      const loadingToast = toast.loading('Preparing full report for PDF export…')
      const ready = await waitForExportReady()
      toast.dismiss(loadingToast)

      if (!ready) {
        toast.error('Could not load the full report for export. Try again shortly.')
        return
      }

      await new Promise((resolve) => window.setTimeout(resolve, 400))

      const root = document.getElementById(EXPORT_ROOT_ID)
      if (!root) {
        toast.error('Report content is not ready for export yet.')
        return
      }

      await exportReportElementToPdf(root, fundLabel)
      toast.success('PDF downloaded')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'PDF export failed')
    } finally {
      setRenderAllSections(false)
      setExporting(false)
    }
  }

  const buildCurrentSnapshot = useCallback((): SharedReportSnapshot | null => {
    if (isSharedView) return sharedSnapshot
    return buildSnapshotFromGroups(scheme, startDate, liveReportRef.current, peersRef.current ?? peersData)
  }, [isSharedView, sharedSnapshot, scheme, startDate, peersData])

  const handleCopyShareLink = async () => {
    if (!exportActionsEnabled) {
      toast.error('Select a fund first.')
      return
    }

    setSharing(true)
    try {
      const loadingToast = toast.loading('Preparing full report for sharing…')
      const ready = await waitForExportReady()
      toast.dismiss(loadingToast)

      if (!ready) {
        toast.error('Could not load the full report for sharing. Try again shortly.')
        return
      }

      const snapshot = buildCurrentSnapshot()
      if (!snapshot) throw new Error('Wait for the full report to finish loading before sharing.')
      const url = await buildShareUrl(snapshot)
      await navigator.clipboard.writeText(url)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not create share link')
      throw err
    } finally {
      setRenderAllSections(false)
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
  const showReportShell = showReport && !snapshotLoading

  return (
    <ReportPageShell
      sidebarVisible={showReportShell}
      sidebar={
        <ReportSectionSidebar
          activeSection={activeSection}
          onSectionSelect={selectSection}
          fundLabel={fundLabel}
        />
      }
    >
      {!snapshotLoading && (
        <ReportStickyHeader
          scheme={scheme}
          fundLabel={fundLabel}
          isSharedView={isSharedView}
          sidebarVisible={showReportShell}
          exportActionsEnabled={exportActionsEnabled}
          exportReady={exportReady}
          exporting={exporting}
          sharing={sharing}
          isDemoBuild={isDemoBuild()}
          onSelectScheme={selectScheme}
          onDownloadPdf={() => void handleDownloadPdf()}
          onShareLink={handleCopyShareLink}
          onCopyLink={handleCopyShareLink}
        />
      )}

      <PageContainer width="wide" className="space-y-4 pb-6 pt-2">
        <ReportScrollProvider offset={REPORT_PAGE_TOP_PX + 40}>
        {!snapshotLoading && <ReportStickyHeaderSpacer />}
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

        {showReportShell && (
          <div className="space-y-4">
            <ReportSectionMobileNav
              activeSection={activeSection}
              onSectionSelect={selectSection}
            />
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
              exportTitle={renderAllSections ? fundLabel : undefined}
              activeSection={activeSection}
              renderAll={renderAllSections || isSharedView}
              startDate={startDate}
            />
          </div>
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
      </ReportScrollProvider>
    </PageContainer>
    </ReportPageShell>
  )
}

export default FundReportPage
