import { useEffect, useState } from 'react'
import {
  ArrowUpRight,
  CheckCircle2,
  CircleAlert,
  ExternalLink,
  FlaskConical,
  Loader2,
  Server,
  Terminal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import {
  checkBackendAvailable,
  isDemoBuild,
  LIVE_APP_NOTE,
  LIVE_APP_SETUP,
  LIVE_APP_URL,
} from '@/demo/demoMode'

type BackendStatus = 'unknown' | 'checking' | 'up' | 'down'

/**
 * Demo builds always use fixtures. "Use live data" opens setup steps — it never switches this
 * page to the API, because live mode is a separate front-end server.
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
      <div className="flex items-center gap-2">
        <Badge variant="warning" className="hidden gap-1.5 sm:inline-flex">
          <FlaskConical className="h-3 w-3" aria-hidden="true" />
          Demo data
        </Badge>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSetupOpen(true)}
          title="How to run the live application with a real back end"
        >
          <FlaskConical className="h-4 w-4 sm:hidden" aria-hidden="true" />
          <span className="hidden sm:inline">Use live data</span>
        </Button>
      </div>

      <Dialog open={setupOpen} onOpenChange={setSetupOpen}>
        <DialogContent
          className="flex w-[min(calc(100vw-2rem),44rem)] max-w-[44rem] max-h-[min(92dvh,44rem)] flex-col gap-0 overflow-hidden border-border/80 p-0 shadow-2xl sm:rounded-2xl"
          aria-describedby="live-setup-description"
        >
          <header className="shrink-0 border-b border-border/60 bg-muted/30 px-8 pb-5 pt-6 pr-14">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/20">
                <Server className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 space-y-1">
                <h2 id="live-setup-title" className="text-lg font-semibold tracking-tight">
                  Run the live application
                </h2>
                <p id="live-setup-description" className="text-sm leading-relaxed text-muted-foreground">
                  {LIVE_APP_NOTE}
                </p>
              </div>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
            <BackendStatusBanner status={backendStatus} />

            <ol className="mt-6 grid gap-4 sm:grid-cols-1" aria-label="Steps to run live data">
              {LIVE_APP_SETUP.map((step, index) => (
                <SetupStepCard key={step.title} step={step} index={index} />
              ))}
            </ol>
          </div>

          <footer className="flex shrink-0 flex-col gap-3 border-t border-border/60 bg-muted/20 px-8 py-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              Demo tab stays on fixtures. Live data needs both servers running.
            </p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
              <Button variant="ghost" size="sm" onClick={() => setSetupOpen(false)}>
                Close
              </Button>
              <Button size="sm" className="gap-2" asChild>
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
  const isLinkStep = step.commands.length === 0

  return (
    <li className="rounded-xl border border-border/70 bg-card/40 p-4 transition-colors hover:bg-card/70">
      <div className="flex gap-3">
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
          aria-hidden="true"
        >
          {index + 1}
        </span>
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <p className="font-medium leading-snug">{step.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
          </div>

          {isLinkStep ? (
            <a
              href={LIVE_APP_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex max-w-full items-center gap-2 rounded-lg border border-border/80 bg-muted/40 px-3 py-2 font-mono text-sm text-foreground transition-colors hover:bg-muted/70"
            >
              <ArrowUpRight className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span className="truncate">{LIVE_APP_URL}</span>
            </a>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2" aria-label={`Commands for ${step.title}`}>
              {step.commands.map((command) => (
                <li key={command}>
                  <CommandBlock command={command} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </li>
  )
}

function CommandBlock({ command }: { command: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/80 bg-muted/50 px-3 py-2">
      <Terminal className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
      <code className="min-w-0 flex-1 truncate font-mono text-[13px] leading-none text-foreground">
        {command}
      </code>
    </div>
  )
}

function BackendStatusBanner({ status }: { status: BackendStatus }) {
  if (status === 'checking') {
    return (
      <div
        role="status"
        className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground"
      >
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
        <span>Checking back end on port 8080…</span>
      </div>
    )
  }

  if (status === 'up') {
    return (
      <div
        role="status"
        className="flex items-start gap-3 rounded-xl border border-emerald-500/35 bg-emerald-500/8 px-4 py-3 text-sm text-emerald-900 dark:text-emerald-100"
      >
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
        <div className="space-y-1.5">
          <p className="font-medium">Back end is running</p>
          <p className="text-emerald-800/90 dark:text-emerald-200/90">
            Start the live front end next, then open the live app.
          </p>
        </div>
      </div>
    )
  }

  if (status === 'down') {
    return (
      <div
        role="status"
        className="flex items-start gap-3 rounded-xl border border-amber-500/35 bg-amber-500/8 px-4 py-3 text-sm text-amber-950 dark:text-amber-50"
      >
        <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
        <div className="space-y-1.5">
          <p className="font-medium">Back end not detected</p>
          <p className="text-amber-900/90 dark:text-amber-100/90">
            Run step 1 first — this demo page will keep using sample data until the API is up.
          </p>
        </div>
      </div>
    )
  }

  return null
}
