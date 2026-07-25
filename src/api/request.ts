import { ApiError } from './apiError'
import { isDemoModeEnabled } from '@/demo/demoMode'
import { fetchDemoJson } from '@/demo/demoTransport'

export { ApiError }

export interface RequestOptions {
  params?: Record<string, string>
  /** Present means POST with a JSON body. */
  body?: unknown
  signal?: AbortSignal
  /** Used in the thrown message when the backend sends no error text. */
  label?: string
}

async function readServerError(response: Response): Promise<string | null> {
  try {
    const body: unknown = await response.json()
    if (body && typeof body === 'object' && 'error' in body) {
      const value = (body as { error?: unknown }).error
      return typeof value === 'string' && value.length > 0 ? value : null
    }
    return null
  } catch {
    return null
  }
}

function buildInit(body: unknown, signal?: AbortSignal): RequestInit {
  if (body === undefined) {
    return { signal }
  }
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  }
}

/**
 * The single place the frontend talks to the API. When demo mode is on the call is served
 * from captured fixtures instead, which is why no hook or page needs to know about it.
 */
export async function requestJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { params, body, signal, label } = options
  const search = new URLSearchParams(params)

  if (isDemoModeEnabled()) {
    return fetchDemoJson<T>({ path, params: search, body, signal })
  }

  const query = search.toString()
  const response = await fetch(query ? `${path}?${query}` : path, buildInit(body, signal))
  if (!response.ok) {
    const serverError = await readServerError(response)
    const fallback = label
      ? `${label} failed (${response.status})`
      : `Request failed: ${response.status}`
    throw new ApiError(serverError ?? fallback, response.status)
  }
  return (await response.json()) as T
}
