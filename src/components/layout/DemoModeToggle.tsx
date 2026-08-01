import { useEffect, useState } from 'react'
import {
  ArrowUpRight,
  CheckCircle2,
  CircleAlert,
  Copy,
  ExternalLink,
  FlaskConical,
  Loader2,
  Server,
  Terminal,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import {
  checkBackendAvailable,
  isDemoBuild,
  LIVE_APP_NOTE,
  LIVE_APP_SETUP,
  LIVE_APP_URL,
} from '@/demo/config/demoMode'
import { cn } from '@/lib/utils'

type BackendStatus = 'unknown' | 'checking' | 'up' | 'down'

/**
 * Demo builds always use fixtures. "Use live data" opens setup steps — it never switches this
 * page to the API, because live mode is a separate front-end / deployment.
 */
export function DemoModeToggle() {
  const [setupOpen, setSetupOpen] = useState(false)
  const [backendStatus, setBackendStatus] = useState<BackendStatus>('unknown')

  useEffect(() => {
    if (!setupOpen) {
      setBackendStatus('unknown')
      return
    }
    let active = true
    setBackendStatus('checking')
    checkBackendAvailable()
      .then((available) => {
        if (active) setBackendStatus(available ? 'up' : 'down')
      })
      .catch(() => {
        if (active) setBackendStatus('down')
      })
    return () => {
      active = false
    }
  }, [setupOpen])

  if (!isDemoBuild()) {
    return null
  }

  return (
    <>
      <div className="flex items-center gap-1.5 sm:gap-2">
        <Badge variant="warning" className="hidden gap-1.5 sm:inline-flex">
          <FlaskConical className="h-3 w-3" aria-hidden="true" />
          Demo data
        </Badge>
        <Button
          variant="outline"
          size="sm"
          className="h-10 gap-1.5 rounded-xl border-border/70 bg-background/60 px-2.5 shadow-sm sm:px-3"
          onClick={() => setSetupOpen(true)}
          title="How to open live Analyzer data"
        >
          <FlaskConical className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Use live data</span>
          <span className="sr-only sm:hidden">Use live data</span>
        </Button>
      </div>

      <Dialog open={setupOpen} onOpenChange={setSetupOpen}>
        <DialogContent
          className={cn(
            'flex w-[min(calc(100vw-1.25rem),40rem)] max-w-[40rem] flex-col gap-0 overflow-hidden border-border/80 p-0 shadow-2xl',
            'max-h-[min(92dvh,40rem)] sm:max-h-[min(90dvh,44rem)] sm:rounded-2xl',
          )}
          aria-describedby="live-setup-description"
        >
          <header className="shrink-0 border-b border-border/60 bg-gradient-to-b from-primary/8 to-muted/20 px-5 pb-4 pt-5 pr-12 sm:px-7 sm:pb-5 sm:pt-6 sm:pr-14">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/20 sm:size-11">
                <Server className="size-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 space-y-1">
                <h2 id="live-setup-title" className="text-base font-semibold tracking-tight sm:text-lg">
                  Switch to live Analyzer data
                </h2>
                <p id="live-setup-description" className="text-sm leading-relaxed text-muted-foreground">
                  {LIVE_APP_NOTE}
                </p>
              </div>
            </div>

            <a
              href={LIVE_APP_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-4 flex items-center gap-2 rounded-xl border border-primary/25 bg-background/80 px-3 py-2.5 text-sm shadow-sm transition-colors hover:border-primary/40 hover:bg-background"
            >
              <ArrowUpRight className="size-4 shrink-0 text-primary" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate font-medium">{LIVE_APP_URL}</span>
              <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
            </a>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-7 sm:py-5">
            <BackendStatusBanner status={backendStatus} />

            <ol className="mt-4 grid gap-3" aria-label="Steps to use live data">
              {LIVE_APP_SETUP.map((step, index) => (
                <SetupStepCard key={step.title} step={step} index={index} />
              ))}
            </ol>
          </div>

          <footer className="flex shrink-0 flex-col gap-3 border-t border-border/60 bg-muted/25 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-5">
            <p className="text-xs leading-relaxed text-muted-foreground sm:max-w-[16rem] sm:text-sm">
              Demo tab stays on fixtures. Live data needs the live site or both local servers.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button variant="ghost" size="sm" className="order-2 sm:order-1" onClick={() => setSetupOpen(false)}>
                Close
              </Button>
              <Button size="sm" className="order-1 gap-2 sm:order-2" asChild>
                <a href={LIVE_APP_URL} target="_blank" rel="noreferrer">
                  Open live app
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </Button>
            </div>
          </footer>
        </DialogContent>
      </Dialog>
    </>
  )
}

function SetupStepCard({
  step,
  index,
}: {
  step: (typeof LIVE_APP_SETUP)[number]
  index: number
}) {
  return (
    <li className="rounded-xl border border-border/70 bg-card/50 p-3.5 sm:p-4">
      <div className="flex gap-3">
        <span
          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
          aria-hidden="true"
        >
          {index + 1}
        </span>
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <p className="text-sm font-medium leading-snug sm:text-[15px]">{step.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
            {step.detail ? (
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground/90 sm:text-[13px]">
                {step.detail}
              </p>
            ) : null}
          </div>

          {step.href ? (
            <a
              href={step.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex max-w-full items-center gap-2 rounded-lg border border-border/80 bg-muted/40 px-3 py-2 text-sm transition-colors hover:bg-muted/70"
            >
              <ArrowUpRight className="size-4 shrink-0 text-primary" aria-hidden="true" />
              <span className="truncate font-medium">{step.hrefLabel ?? step.href}</span>
            </a>
          ) : null}

          {step.commands.length > 0 ? (
            <ul className="grid gap-2" aria-label={`Commands for ${step.title}`}>
              {step.commands.map((command) => (
                <li key={command}>
                  <CommandBlock command={command} />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </li>
  )
}

function CommandBlock({ command }: { command: string }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command)
      toast.success('Command copied')
    } catch {
      toast.error('Could not copy command')
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/80 bg-muted/50 px-2.5 py-2 sm:px-3">
      <Terminal className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
      <code className="min-w-0 flex-1 truncate font-mono text-[12px] leading-none text-foreground sm:text-[13px]">
        {command}
      </code>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 shrink-0 rounded-md"
        onClick={() => void copy()}
        aria-label={`Copy ${command}`}
      >
        <Copy className="size-3.5" aria-hidden="true" />
      </Button>
    </div>
  )
}

function BackendStatusBanner({ status }: { status: BackendStatus }) {
  if (status === 'checking') {
    return (
      <div
        role="status"
        className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/30 px-3.5 py-3 text-sm text-muted-foreground"
      >
        <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden="true" />
        <span>Checking whether a local back end is reachable…</span>
      </div>
    )
  }

  if (status === 'up') {
    return (
      <div
        role="status"
        className="flex items-start gap-3 rounded-xl border border-emerald-500/35 bg-emerald-500/8 px-3.5 py-3 text-sm text-emerald-900 dark:text-emerald-100"
      >
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
        <div className="space-y-1">
          <p className="font-medium">Local back end detected</p>
          <p className="text-emerald-800/90 dark:text-emerald-200/90">
            You can run the live front end locally, or open the hosted live app below.
          </p>
        </div>
      </div>
    )
  }

  if (status === 'down') {
    return (
      <div
        role="status"
        className="flex items-start gap-3 rounded-xl border border-amber-500/35 bg-amber-500/8 px-3.5 py-3 text-sm text-amber-950 dark:text-amber-50"
      >
        <CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
        <div className="space-y-1">
          <p className="font-medium">No local back end on this network</p>
          <p className="text-amber-900/90 dark:text-amber-100/90">
            That is normal on the public demo. Open the hosted live URL, or start Docker / the API if you
            are developing locally.
          </p>
        </div>
      </div>
    )
  }

  return null
}
