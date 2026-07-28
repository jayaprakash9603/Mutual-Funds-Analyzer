import { FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FundSelector } from '@/components/dashboard/search/FundSelector'
import { FundReportToolbar } from '@/features/fund-report/components/layout/FundReportToolbar'
import { TooltipProvider } from '@/components/ui/tooltip'

type ReportStickyHeaderProps = {
  scheme: string
  fundLabel: string
  isSharedView: boolean
  sidebarVisible?: boolean
  exportActionsEnabled: boolean
  exportReady?: boolean
  exporting: boolean
  sharing: boolean
  isDemoBuild?: boolean
  onSelectScheme: (scheme: string) => void
  onDownloadPdf: () => void
  onShareLink: () => void | Promise<void>
  onCopyLink: () => void | Promise<void>
}

export function ReportStickyHeader({
  scheme,
  fundLabel,
  isSharedView,
  sidebarVisible = false,
  exportActionsEnabled,
  exportReady,
  exporting,
  sharing,
  isDemoBuild,
  onSelectScheme,
  onDownloadPdf,
  onShareLink,
  onCopyLink,
}: ReportStickyHeaderProps) {
  return (
    <TooltipProvider>
      <div
        className={cn(
          'fixed top-16 z-30 border-b border-border/60 bg-background/90 shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-background/75',
          sidebarVisible ? 'right-0 lg:left-[var(--report-sidebar-width)]' : 'inset-x-0',
        )}
        style={{ height: 'var(--report-sticky-bar-height)' }}
      >
        <div className="mx-auto flex h-full max-w-[1600px] items-center gap-2 px-3 sm:gap-3 sm:px-6 lg:px-8">
          {isSharedView ? (
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
                aria-hidden="true"
              >
                <FileText className="size-4" />
              </span>
              <span className="min-w-0 truncate text-sm font-medium" title={fundLabel}>
                {fundLabel}
              </span>
              <span className="hidden shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:inline">
                Shared snapshot
              </span>
            </div>
          ) : (
            <FundSelector
              mode="fund-only"
              variant="compact"
              selectedScheme={scheme || null}
              onSelectScheme={onSelectScheme}
            />
          )}

          <div className="hidden h-7 w-px shrink-0 bg-border/70 sm:block" aria-hidden="true" />

          <FundReportToolbar
            variant="compact"
            exportActionsEnabled={exportActionsEnabled}
            exportReady={exportReady}
            exporting={exporting}
            sharing={sharing}
            fundLabel={fundLabel}
            isSharedView={isSharedView}
            isDemoBuild={isDemoBuild}
            onDownloadPdf={onDownloadPdf}
            onShareLink={onShareLink}
            onCopyLink={onCopyLink}
          />
        </div>
      </div>
    </TooltipProvider>
  )
}

/** Reserves vertical space so content is not hidden under the fixed bar. */
export function ReportStickyHeaderSpacer() {
  return <div aria-hidden className="h-[var(--report-sticky-bar-height)] shrink-0" />
}
