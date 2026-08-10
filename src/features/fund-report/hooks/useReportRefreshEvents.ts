import { useEffect, useRef } from 'react'
import { API_ROUTES } from '@/api/routes'
import { resolveApiUrl } from '@/lib/backendUrl'

export type ReportReadyEvent = {
  type: 'report-ready'
  scheme: string
  watermarkNavDate?: string
  computedAt?: string
}

type UseReportRefreshEventsOptions = {
  scheme: string | null
  enabled?: boolean
  onReportReady: (event: ReportReadyEvent) => void
}

/**
 * Subscribes to backend SSE report-ready events so the UI can refetch without a page reload.
 */
export function useReportRefreshEvents({
  scheme,
  enabled = true,
  onReportReady,
}: UseReportRefreshEventsOptions): void {
  const onReadyRef = useRef(onReportReady)
  onReadyRef.current = onReportReady

  useEffect(() => {
    if (!scheme || !enabled || typeof EventSource === 'undefined') {
      return
    }

    const params = new URLSearchParams({ scheme })
    const url = `${resolveApiUrl(API_ROUTES.fundReportEvents)}?${params.toString()}`
    console.info('[report-sse] connecting', { scheme, url })
    const source = new EventSource(url)

    const handleConnected = (message: MessageEvent<string>) => {
      console.info('[report-sse] connected', { scheme, data: message.data })
    }

    const handleReady = (message: MessageEvent<string>) => {
      try {
        const data = JSON.parse(message.data) as ReportReadyEvent
        if (data?.type !== 'report-ready') return
        if (data.scheme && data.scheme !== scheme) return
        console.info('[report-sse] report-ready received — refetching sections', data)
        onReadyRef.current(data)
      } catch (err) {
        console.warn('[report-sse] malformed report-ready payload', err)
      }
    }

    source.addEventListener('connected', handleConnected as EventListener)
    source.addEventListener('report-ready', handleReady as EventListener)
    source.onerror = () => {
      // Browser auto-reconnects; keep the channel as a best-effort notify path.
      console.warn('[report-sse] connection error (browser will retry)', {
        scheme,
        readyState: source.readyState,
      })
    }

    return () => {
      console.info('[report-sse] closing', { scheme })
      source.removeEventListener('connected', handleConnected as EventListener)
      source.removeEventListener('report-ready', handleReady as EventListener)
      source.close()
    }
  }, [scheme, enabled])
}
