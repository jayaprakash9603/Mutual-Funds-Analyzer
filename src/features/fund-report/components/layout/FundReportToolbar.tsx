import { Download, Link2, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

type FundReportToolbarProps = {
  canExport: boolean
  exporting: boolean
  sharing: boolean
  fundLabel: string
  isSharedView: boolean
  onDownloadPdf: () => void
  onShareLink: () => void
  onCopyLink: () => void
}

export function FundReportToolbar({
  canExport,
  exporting,
  sharing,
  fundLabel,
  isSharedView,
  onDownloadPdf,
  onShareLink,
  onCopyLink,
}: FundReportToolbarProps) {
  if (isSharedView) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-foreground">Shared snapshot — offline view</p>
          <p className="text-xs text-muted-foreground">{fundLabel} (no backend calls)</p>
        </div>
        <Button type="button" variant="outline" size="sm" className="gap-2" onClick={onDownloadPdf} disabled={exporting}>
          <Download className="size-4" aria-hidden="true" />
          {exporting ? 'Preparing PDF…' : 'Download PDF'}
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/70 bg-card/60 px-3 py-2">
      <span className="mr-auto text-xs text-muted-foreground">
        {canExport ? `Export ${fundLabel}` : 'Load the full report to export or share'}
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2"
        disabled={!canExport || exporting}
        onClick={onDownloadPdf}
      >
        <Download className="size-4" aria-hidden="true" />
        {exporting ? 'Preparing PDF…' : 'Download PDF'}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2"
        disabled={!canExport || sharing}
        onClick={async () => {
          try {
            await onShareLink()
            toast.success('Share link copied to clipboard')
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Could not create share link')
          }
        }}
      >
        <Share2 className="size-4" aria-hidden="true" />
        {sharing ? 'Encoding…' : 'Share link'}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="gap-2"
        disabled={!canExport || sharing}
        onClick={async () => {
          try {
            await onCopyLink()
            toast.success('Link copied to clipboard')
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Could not copy link')
          }
        }}
      >
        <Link2 className="size-4" aria-hidden="true" />
        Copy link
      </Button>
    </div>
  )
}
