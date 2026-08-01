import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { isDemoBuild } from '@/demo/config/demoMode'
import { DemoFundPicker } from '@/components/demo/DemoFundPicker'
import { FundSelector } from '@/components/dashboard/search/FundSelector'
import { PageContainer } from '@/components/layout/PageContainer'
import { useAppChromeOffset } from '@/hooks/useAppChromeOffset'
import { useIsReportMobileLayout } from '@/hooks/useMediaQuery'
import { ReportScrollProvider } from '@/features/fund-report/context/ReportScrollContext'
import {
  REPORT_MOBILE_NAV_HEIGHT_PX,
  REPORT_STICKY_BAR_HEIGHT_PX,
} from '@/features/fund-report/lib/nav/reportLayoutConstants'
import { FundReportSections } from '@/features/fund-report/components/layout/FundReportSections'
import { ReportStickyHeader, ReportStickyHeaderSpacer } from '@/features/fund-report/components/layout/ReportStickyHeader'
import { ReportPageShell } from '@/features/fund-report/components/layout/ReportPageShell'
import { ReportSectionMobileNav } from '@/features/fund-report/components/layout/ReportSectionMobileNav'
import { ReportSectionSidebar } from '@/features/fund-report/components/layout/ReportSectionSidebar'
import { DEFAULT_REPORT_SECTION, REPORT_SECTIONS } from '@/features/fund-report/lib/nav/reportSectionCatalog'
import { useSectionNav } from '@/features/fund-report/hooks/useSectionNav'
import {
  ALL_REPORT_GROUP_KEYS,
  groupsRequiredForSections,
} from '@/features/fund-report/lib/nav/reportSectionRequirements'
import { exportReportElementToPdf } from '@/features/fund-report/lib/export/exportReportPdf'
import {
  buildShareUrl,
  buildSnapshotFromGroups,
  hasSnapshotInLocation,
  isReportReadyForExport,
  normalizeSnapshotUrl,
  readSnapshotFromLocationAsync,
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

  const isMobileReportLayout = useIsReportMobileLayout()
  const chromeOffset = useAppChromeOffset()
  const sectionScrollOffset =
    chromeOffset + REPORT_STICKY_BAR_HEIGHT_PX + REPORT_MOBILE_NAV_HEIGHT_PX
  const sectionIds = useMemo(() => REPORT_SECTIONS.map((section) => section.id), [])
  const { activeSection: scrollActiveSection, scrollToSection } = useSectionNav(
    isMobileReportLayout ? sectionIds : [],
    sectionScrollOffset,
  )

  const [desktopActiveSection, setDesktopActiveSection] = useState(DEFAULT_REPORT_SECTION)
  const activeSection = isMobileReportLayout ? scrollActiveSection : desktopActiveSection
  const [visitedSections, setVisitedSections] = useState<Set<string>>(
    () => new Set([DEFAULT_REPORT_SECTION]),
  )
  const [renderAllSections, setRenderAllSections] = useState(false)

  const [sharedSnapshot, setSharedSnapshot] = useState<SharedReportSnapshot | null>(null)
  const [snapshotLoading, setSnapshotLoading] = useState(hasSnapshotInLocation())
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
      normalizeSnapshotUrl()

      if (!hasSnapshotInLocation()) {
        if (!cancelled) {
          setSnapshotLoading(false)
          setSharedSnapshot(null)
          setSnapshotError(null)
        }
        return
      }
      setSnapshotLoading(true)
      readSnapshotFromLocationAsync()
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
    window.addEventListener('popstate', loadSnapshot)
    return () => {
      cancelled = true
      window.removeEventListener('hashchange', loadSnapshot)
      window.removeEventListener('popstate', loadSnapshot)
    }
  }, [])

  useEffect(() => {
    setDesktopActiveSection(DEFAULT_REPORT_SECTION)
    setVisitedSections(new Set([DEFAULT_REPORT_SECTION]))
    if (isMobileReportLayout) {
      window.scrollTo({ top: 0, behavior: 'auto' })
    }
  }, [scheme, isMobileReportLayout])

  const isSharedView = sharedSnapshot != null
  const startDate = sharedSnapshot?.startDate ?? searchParams.get('start_date') ?? undefined

  const enabledGroups = useMemo(() => {
    if (isSharedView || renderAllSections || isMobileReportLayout) {
      return new Set(ALL_REPORT_GROUP_KEYS)
    }
    return groupsRequiredForSections(visitedSections)
  }, [isSharedView, renderAllSections, isMobileReportLayout, visitedSections])

  const liveReport = useProgressiveFundReport(isSharedView ? null : scheme || null, startDate, {
    enabledGroups,
  })
  const reportGroups = isSharedView ? snapshotToGroups(sharedSnapshot) : liveReport

  const selectSection = useCallback((sectionId: string) => {
    if (isMobileReportLayout) {
      scrollToSection(sectionId)
      return
    }
    setDesktopActiveSection(sectionId)
    setVisitedSections((prev) => {
      if (prev.has(sectionId)) return prev
      const next = new Set(prev)
      next.add(sectionId)
      return next
    })
  }, [isMobileReportLayout, scrollToSection])

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
    // Allow React to enable all report groups before polling.
    await new Promise((resolve) => window.setTimeout(resolve, 50))

    const deadline = Date.now() + 90_000
    const allGroups = () => {
      const current = liveReportRef.current
      return [
        current.overview,
        current.performance,
        current.risk,
        current.investment,
        current.assessment,
      ]
    }

    while (Date.now() < deadline) {
      await new Promise((resolve) => window.setTimeout(resolve, 250))
      if (isReportReadyForExport(liveReportRef.current)) return true

      const groups = allGroups()
      const pending = groups.filter((group) => !group.data)
      if (pending.length === 0) return true

      if (groups.some((group) => group.loading)) continue

      const pendingErrors = pending.filter((group) => group.error)
      if (pendingErrors.length === pending.length) return false

      // Some groups have not started fetching yet (disabled → enabled); keep waiting.
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
  /** Avoid two fund search fields: sticky bar only after a fund is open. */
  const showStickyFundBar = showReport && !snapshotLoading

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
      {showStickyFundBar && (
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
        <ReportScrollProvider offset={sectionScrollOffset}>
        {showStickyFundBar && <ReportStickyHeaderSpacer />}
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
              renderAll={renderAllSections || isSharedView || isMobileReportLayout}
              startDate={startDate}
            />
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

        {!showReport && !snapshotLoading && (
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 py-4">
            <div className="space-y-2 text-center sm:text-left">
              <h1 className="text-2xl font-semibold tracking-tight">Open a fund report</h1>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {isDemoBuild()
                  ? 'Choose a sample fund below, or search by name. Demo mode uses captured fixtures — no live backend.'
                  : 'Search and select a scheme to generate the full research report.'}
              </p>
            </div>

            {isDemoBuild() && (
              <DemoFundPicker selectedScheme={scheme || null} onSelect={selectScheme} />
            )}

            <FundSelector
              mode="fund-only"
              variant="default"
              selectedScheme={scheme || null}
              onSelectScheme={selectScheme}
            />
          </div>
        )}
      </ReportScrollProvider>
    </PageContainer>
    </ReportPageShell>
  )
}

export default FundReportPage
