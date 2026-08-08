import { useEffect, useState } from 'react'
import {
  CheckCircle2,
  CircleAlert,
  Loader2,
  Server,
  Settings2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { checkBackendAvailable, isDemoBuild } from '@/demo/config/demoMode'
import {
  BACKEND_URL_CHANGED_EVENT,
  getBackendBaseUrl,
  normalizeBackendBaseUrl,
  setBackendBaseUrl,
} from '@/lib/backendUrl'
import { cn } from '@/lib/utils'

type ProbeStatus = 'idle' | 'checking' | 'up' | 'down'

/**
 * Live builds only: lets the user point the UI at any API origin
 * (for example a local Docker backend on :8080).
 */
export function BackendSettingsDialog() {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [probe, setProbe] = useState<ProbeStatus>('idle')
  const [saved, setSaved] = useState('')

  useEffect(() => {
    if (!open) return
    const current = getBackendBaseUrl()
    setDraft(current)
    setSaved(current)
    setError(null)
    setProbe('idle')
  }, [open])

  useEffect(() => {
    const sync = () => setSaved(getBackendBaseUrl())
    window.addEventListener(BACKEND_URL_CHANGED_EVENT, sync)
    return () => window.removeEventListener(BACKEND_URL_CHANGED_EVENT, sync)
  }, [])

  if (isDemoBuild()) {
    return null
  }

  const save = () => {
    try {
      const next = setBackendBaseUrl(draft)
      setSaved(next)
      setDraft(next)
      setError(null)
      toast.success(next ? `Backend set to ${next}` : 'Using same-origin /api')
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid backend URL')
    }
  }

  const testConnection = async () => {
    try {
      const normalized = normalizeBackendBaseUrl(draft)
      setBackendBaseUrl(normalized)
      setSaved(normalized)
      setDraft(normalized)
      setError(null)
      setProbe('checking')
      const available = await checkBackendAvailable()
      setProbe(available ? 'up' : 'down')
      if (available) {
        toast.success('Backend responded successfully')
      } else {
        toast.error('Backend did not respond')
      }
    } catch (err) {
      setProbe('down')
      setError(err instanceof Error ? err.message : 'Invalid backend URL')
    }
  }

  const resetSameOrigin = () => {
    setDraft('')
    setError(null)
    setProbe('idle')
  }

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="size-10 shrink-0 rounded-xl border-border/70 bg-background/60 shadow-sm"
        onClick={() => setOpen(true)}
        aria-label="Backend settings"
        title={saved ? `Backend: ${saved}` : 'Backend settings'}
      >
        <Settings2 className="size-4" aria-hidden="true" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md gap-0 overflow-hidden p-0 sm:max-w-lg">
          <div className="border-b border-border/60 bg-muted/30 px-5 py-4">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Server className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 space-y-1">
                <h2 className="text-base font-semibold tracking-tight">Backend connection</h2>
                <p className="text-sm text-muted-foreground">
                  Choose which API host this live app should call. Leave blank to use same-origin
                  <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-xs">/api</code>
                  (Docker / Vite proxy).
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 px-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="backend-base-url">Backend URL</Label>
              <Input
                id="backend-base-url"
                value={draft}
                onChange={(event) => {
                  setDraft(event.target.value)
                  setError(null)
                  setProbe('idle')
                }}
                placeholder="http://localhost:8080"
                autoComplete="off"
                spellCheck={false}
              />
              {error ? (
                <p className="text-xs text-destructive">{error}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Example: <span className="font-medium">http://localhost:8080</span>
                  {' '}for a local Spring Boot / Docker API. An HTTPS page cannot call an HTTP
                  backend (browser mixed-content block).
                </p>
              )}
            </div>

            <div
              className={cn(
                'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs',
                probe === 'up' && 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
                probe === 'down' && 'border-destructive/40 bg-destructive/10 text-destructive',
                (probe === 'idle' || probe === 'checking') && 'border-border/70 bg-muted/40 text-muted-foreground',
              )}
            >
              {probe === 'checking' ? (
                <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden="true" />
              ) : probe === 'up' ? (
                <CheckCircle2 className="size-3.5 shrink-0" aria-hidden="true" />
              ) : probe === 'down' ? (
                <CircleAlert className="size-3.5 shrink-0" aria-hidden="true" />
              ) : (
                <Server className="size-3.5 shrink-0" aria-hidden="true" />
              )}
              <span>
                {probe === 'checking' && 'Checking /api/features…'}
                {probe === 'up' && 'API is reachable'}
                {probe === 'down' && 'API is not reachable from this browser'}
                {probe === 'idle' && (saved ? `Saved: ${saved}` : 'Currently using same-origin /api')}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 bg-muted/20 px-5 py-3">
            <Button type="button" variant="ghost" size="sm" onClick={resetSameOrigin}>
              Use same-origin
            </Button>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void testConnection()}
                disabled={probe === 'checking'}
              >
                Test
              </Button>
              <Button type="button" size="sm" onClick={save}>
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
