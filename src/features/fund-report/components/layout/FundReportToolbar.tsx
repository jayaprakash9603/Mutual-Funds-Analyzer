import { Download, Link2, Loader2, MoreVertical, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type FundReportToolbarProps = {
  exportActionsEnabled: boolean
  exportReady?: boolean
  exporting: boolean
  sharing: boolean
  fundLabel: string
  isSharedView: boolean
  isDemoBuild?: boolean
  variant?: 'default' | 'compact'
  onDownloadPdf: () => void
  onShareLink: () => void | Promise<void>
  onCopyLink: () => void | Promise<void>
}

function CompactToolbarButton({
  label,
  disabled,
  busy,
  onClick,
  children,
}: {
  label: string
  disabled?: boolean
  busy?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  const button = (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-10 rounded-lg text-muted-foreground hover:bg-background hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
    >
      {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : children}
    </Button>
  )

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {disabled ? <span className="inline-flex">{button}</span> : button}
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  )
}

export function FundReportToolbar({
  exportActionsEnabled,
  exportReady = false,
  exporting,
  sharing,
  fundLabel,
  isSharedView,
  isDemoBuild = false,
  variant = 'default',
  onDownloadPdf,
  onShareLink,
  onCopyLink,
}: FundReportToolbarProps) {
  if (variant === 'compact') {
    const busy = exporting || sharing
    const downloadLabel = exporting
      ? 'Preparing PDF…'
      : exportReady
        ? 'Download PDF'
        : 'Download PDF (loads full report)'
    const shareLabel = sharing
      ? 'Encoding share link…'
      : exportReady
        ? 'Share link'
        : 'Share link (loads full report)'
    const copyLabel = sharing
      ? 'Encoding link…'
      : exportReady
        ? 'Copy link'
        : 'Copy link (loads full report)'

    const handleShare = () => {
      void (async () => {
        try {
          await onShareLink()
          toast.success('Share link copied to clipboard')
        } catch {
          /* toast shown by handler */
        }
      })()
    }

    const handleCopy = () => {
      void (async () => {
        try {
          await onCopyLink()
          toast.success('Link copied to clipboard')
        } catch {
          /* toast shown by handler */
        }
      })()
    }

    const desktopToolbar = (
      <div
        className={cn(
          'hidden shrink-0 items-center gap-0.5 rounded-xl border border-border/60 bg-muted/25 p-0.5 sm:flex',
          exportActionsEnabled && !exportReady && !busy && 'border-dashed',
        )}
        role="toolbar"
        aria-label="Report export actions"
      >
        <CompactToolbarButton
          label={downloadLabel}
          disabled={!exportActionsEnabled || busy}
          busy={exporting}
          onClick={onDownloadPdf}
        >
          <Download className="size-4" aria-hidden="true" />
        </CompactToolbarButton>
        {!isSharedView && (
          <>
            <CompactToolbarButton
              label={shareLabel}
              disabled={!exportActionsEnabled || busy}
              busy={sharing}
              onClick={handleShare}
            >
              <Share2 className="size-4" aria-hidden="true" />
            </CompactToolbarButton>
            <CompactToolbarButton
              label={copyLabel}
              disabled={!exportActionsEnabled || busy}
              busy={sharing}
              onClick={handleCopy}
            >
              <Link2 className="size-4" aria-hidden="true" />
            </CompactToolbarButton>
          </>
        )}
      </div>
    )

    const mobileMenu = (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="-mr-1 size-10 shrink-0 rounded-lg text-muted-foreground hover:bg-muted/40 hover:text-foreground sm:hidden"
            disabled={!exportActionsEnabled || busy}
            aria-label="Report actions"
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <MoreVertical className="size-4" aria-hidden="true" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            disabled={!exportActionsEnabled || busy}
            onSelect={() => onDownloadPdf()}
          >
            <Download className="size-4" aria-hidden="true" />
            {exporting ? 'Preparing PDF…' : 'Download PDF'}
          </DropdownMenuItem>
          {!isSharedView && (
            <>
              <DropdownMenuItem
                disabled={!exportActionsEnabled || busy}
                onSelect={handleShare}
              >
                <Share2 className="size-4" aria-hidden="true" />
                {sharing ? 'Encoding…' : 'Share link'}
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!exportActionsEnabled || busy}
                onSelect={handleCopy}
              >
                <Link2 className="size-4" aria-hidden="true" />
                {sharing ? 'Encoding…' : 'Copy link'}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    )

    return (
      <div className="flex shrink-0 items-center">
        {mobileMenu}
        {desktopToolbar}
      </div>
    )
  }

  if (isSharedView) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-foreground">Shared snapshot — offline view</p>
          <p className="text-xs text-muted-foreground">
            {fundLabel}
            {isDemoBuild ? ' · opens from URL in demo mode without backend' : ' · no backend calls'}
          </p>
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
        {exportReady ? `Export ${fundLabel}` : 'Export loads the full report first'}
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2"
        disabled={!exportActionsEnabled || exporting}
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
        disabled={!exportActionsEnabled || sharing}
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
        disabled={!exportActionsEnabled || sharing}
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
