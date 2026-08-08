import { useEffect, useState, type ReactNode } from 'react'
import {
  ArrowUpRight,
  CheckCircle2,
  CircleAlert,
  Copy,
  Download,
  ExternalLink,
  FlaskConical,
  ListOrdered,
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
  LIVE_DOCKER_ZIP_URL,
  LOCAL_DOCKER_LIVE_URL,
  type LiveSetupStep,
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

  const hostedStep = LIVE_APP_SETUP[0]
  const dockerStep = LIVE_APP_SETUP[1]
  const confirmStep = LIVE_APP_SETUP[2]

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
          className="h-11 min-w-11 gap-1.5 rounded-xl border-border/70 bg-background/60 px-2.5 shadow-sm sm:px-3"
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
            'flex w-[min(calc(100vw-0.75rem),56rem)] max-w-[56rem] flex-col gap-0 overflow-hidden border-border/80 p-0 shadow-2xl',
            'max-h-[min(96dvh,54rem)] rounded-2xl sm:max-h-[min(92dvh,52rem)]',
            'left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]',
            'duration-200',
          )}
          aria-describedby="live-setup-description"
        >
          <header className="shrink-0 border-b border-border/60 bg-gradient-to-b from-primary/10 to-muted/15 px-4 pb-4 pt-5 pr-12 sm:px-8 sm:pb-5 sm:pt-7 sm:pr-14">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary ring-1 ring-primary/20 sm:size-12">
                <Server className="size-5 sm:size-6" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1 space-y-1.5">
                <h2
                  id="live-setup-title"
                  className="text-lg font-semibold tracking-tight sm:text-xl md:text-2xl"
                >
                  Switch to live Analyzer data
                </h2>
                <p
                  id="live-setup-description"
                  className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]"
                >
                  {LIVE_APP_NOTE}
                </p>
              </div>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-8 sm:py-6">
            <BackendStatusBanner status={backendStatus} />

            <div className="mt-4 grid gap-4 lg:mt-5 lg:grid-cols-2 lg:gap-5 lg:items-start">
              <section className="flex flex-col gap-4" aria-label="Quick paths">
                <PathCard
                  index={1}
                  title={hostedStep.title}
                  description={hostedStep.description}
                  accent="primary"
                >
                  <Button className="h-11 w-full gap-2 rounded-xl text-[15px] sm:w-auto" asChild>
                    <a href={LIVE_APP_URL} target="_blank" rel="noreferrer">
                      Open live app
                      <ExternalLink className="size-4" aria-hidden="true" />
                    </a>
                  </Button>
                  <a
                    href={LIVE_APP_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-xl border border-border/80 bg-muted/35 px-3.5 py-2.5 text-sm transition-colors duration-200 hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <ArrowUpRight className="size-4 shrink-0 text-primary" aria-hidden="true" />
                    <span className="truncate font-medium">{LIVE_APP_URL}</span>
                  </a>
                </PathCard>

                <PathCard
                  index={2}
                  title={dockerStep.title}
                  description={dockerStep.description}
                  detail={dockerStep.detail}
                  accent="muted"
                >
                  <DownloadRow downloads={dockerStep.downloads ?? []} />
                </PathCard>
              </section>

              <section className="flex flex-col gap-4" aria-label="Docker steps">
                <div className="rounded-2xl border border-border/70 bg-card/60 p-4 sm:p-5">
                  <div className="mb-3 flex items-center gap-2.5">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/12 text-sm font-semibold text-primary">
                      <ListOrdered className="size-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-base font-semibold tracking-tight sm:text-lg">Do this next</p>
                      <p className="text-sm text-muted-foreground">After you download the pack</p>
                    </div>
                  </div>

                  <ol className="grid gap-2.5" aria-label="Docker setup checklist">
                    {(dockerStep.checklist ?? []).map((item, i) => (
                      <li
                        key={item}
                        className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/70 px-3.5 py-3"
                      >
                        <span
                          className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground"
                          aria-hidden="true"
                        >
                          {i + 1}
                        </span>
                        <span className="pt-0.5 text-sm leading-relaxed sm:text-[15px]">{item}</span>
                      </li>
                    ))}
                  </ol>

                  <ul className="mt-3 grid gap-2.5" aria-label="Shell commands">
                    {dockerStep.commands.map((command, i) => (
                      <li key={command}>
                        <CommandBlock
                          label={`Step ${(dockerStep.checklist?.length ?? 0) + i + 1}`}
                          command={command}
                        />
                      </li>
                    ))}
                  </ul>

                  <div className="mt-3 rounded-xl border border-primary/25 bg-primary/5 px-3.5 py-3">
                    <p className="text-sm font-medium text-foreground">Then open</p>
                    <a
                      href={LOCAL_DOCKER_LIVE_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1.5 inline-flex min-h-11 items-center gap-2 text-[15px] font-semibold text-primary underline-offset-4 transition-colors duration-200 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {LOCAL_DOCKER_LIVE_URL}
                      <ExternalLink className="size-3.5" aria-hidden="true" />
                    </a>
                  </div>
                </div>

                <ConfirmCard step={confirmStep} />
              </section>
            </div>
          </div>

          <footer
            className={cn(
              'shrink-0 border-t border-border/60 bg-muted/30 px-4 py-3.5 sm:px-8 sm:py-4',
              'pb-[max(0.875rem,env(safe-area-inset-bottom))]',
            )}
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <p className="text-sm leading-relaxed text-muted-foreground lg:max-w-xs">
                Demo tab = fixtures. Live = hosted site or Docker on :8088.
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[auto_1fr_1fr] sm:items-center">
                <Button
                  variant="ghost"
                  className="h-11 rounded-xl order-3 sm:order-1"
                  onClick={() => setSetupOpen(false)}
                >
                  Close
                </Button>
                <Button variant="outline" className="h-11 gap-2 rounded-xl order-2" asChild>
                  <a href={LIVE_DOCKER_ZIP_URL} download="mfa-live-docker.zip">
                    <Download className="size-4" aria-hidden="true" />
                    Download pack
                  </a>
                </Button>
                <Button className="h-11 gap-2 rounded-xl order-1 sm:order-3" asChild>
                  <a href={LIVE_APP_URL} target="_blank" rel="noreferrer">
                    Open live app
                    <ExternalLink className="size-4" aria-hidden="true" />
                  </a>
                </Button>
              </div>
            </div>
          </footer>
        </DialogContent>
      </Dialog>
    </>
  )
}

function PathCard({
  index,
  title,
  description,
  detail,
  accent,
  children,
}: {
  index: number
  title: string
  description: string
  detail?: string
  accent: 'primary' | 'muted'
  children: ReactNode
}) {
  return (
    <article
      className={cn(
        'rounded-2xl border p-4 sm:p-5',
        accent === 'primary'
          ? 'border-primary/30 bg-primary/[0.06]'
          : 'border-border/70 bg-card/55',
      )}
    >
      <div className="flex gap-3 sm:gap-3.5">
        <span
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
            accent === 'primary' ? 'bg-primary text-primary-foreground' : 'bg-primary/12 text-primary',
          )}
          aria-hidden="true"
        >
          {index}
        </span>
        <div className="min-w-0 flex-1 space-y-3">
          <div className="space-y-1">
            <h3 className="text-base font-semibold tracking-tight sm:text-lg">{title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-[15px]">{description}</p>
            {detail ? (
              <p className="text-sm leading-relaxed text-muted-foreground/95">{detail}</p>
            ) : null}
          </div>
          <div className="flex flex-col gap-2.5">{children}</div>
        </div>
      </div>
    </article>
  )
}

function DownloadRow({ downloads }: { downloads: NonNullable<LiveSetupStep['downloads']> }) {
  const primary = downloads.find((d) => d.primary) ?? downloads[0]
  const rest = downloads.filter((d) => d !== primary)

  return (
    <div className="flex flex-col gap-2.5">
      {primary ? (
        <Button className="h-11 w-full gap-2 rounded-xl text-[15px]" asChild>
          <a href={primary.href} download={primary.filename}>
            <Download className="size-4" aria-hidden="true" />
            {primary.label}
          </a>
        </Button>
      ) : null}
      {rest.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {rest.map((file) => (
            <Button
              key={file.href}
              variant="outline"
              className="h-11 min-h-11 flex-1 gap-2 rounded-xl sm:flex-none"
              asChild
            >
              <a href={file.href} download={file.filename}>
                <Download className="size-3.5 shrink-0" aria-hidden="true" />
                {file.label}
              </a>
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function ConfirmCard({ step }: { step: LiveSetupStep }) {
  return (
    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.07] p-4 sm:p-5">
      <div className="flex gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
          3
        </span>
        <div className="min-w-0 flex-1 space-y-2.5">
          <div>
            <p className="text-base font-semibold tracking-tight sm:text-lg">{step.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
              {step.description}
            </p>
          </div>
          {step.href ? (
            <Button variant="outline" className="h-11 w-full gap-2 rounded-xl sm:w-auto" asChild>
              <a href={step.href} target="_blank" rel="noreferrer">
                {step.hrefLabel ?? step.href}
                <ExternalLink className="size-3.5" aria-hidden="true" />
              </a>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function CommandBlock({ label, command }: { label: string; command: string }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command)
      toast.success('Command copied')
    } catch {
      toast.error('Could not copy command')
    }
  }

  return (
    <div className="rounded-xl border border-border/80 bg-muted/45 px-3 py-2.5 sm:px-3.5">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <Terminal className="size-3.5" aria-hidden="true" />
          {label}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-9 min-w-9 gap-1.5 rounded-lg px-2.5"
          onClick={() => void copy()}
          aria-label={`Copy ${command}`}
        >
          <Copy className="size-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">Copy</span>
        </Button>
      </div>
      <code className="block break-all font-mono text-[12.5px] leading-relaxed text-foreground sm:text-[13.5px]">
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
        className="flex items-center gap-3 rounded-2xl border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground"
      >
        <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden="true" />
        <span>Checking local back end…</span>
      </div>
    )
  }

  if (status === 'up') {
    return (
      <div
        role="status"
        className="flex items-start gap-3 rounded-2xl border border-emerald-500/35 bg-emerald-500/8 px-4 py-3.5 text-sm text-emerald-900 dark:text-emerald-100"
      >
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
        <div className="space-y-0.5">
          <p className="font-semibold">Local back end detected</p>
          <p className="leading-relaxed text-emerald-800/90 dark:text-emerald-200/90">
            You can use Docker locally, or open the hosted live app.
          </p>
        </div>
      </div>
    )
  }

  if (status === 'down') {
    return (
      <div
        role="status"
        className="flex items-start gap-3 rounded-2xl border border-amber-500/35 bg-amber-500/8 px-4 py-3.5 text-sm text-amber-950 dark:text-amber-50"
      >
        <CircleAlert className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
        <div className="space-y-0.5">
          <p className="font-semibold">No local back end (normal on public demo)</p>
          <p className="leading-relaxed text-amber-900/90 dark:text-amber-100/90">
            Open the hosted live URL, or start Docker on your PC.
          </p>
        </div>
      </div>
    )
  }

  return null
}
