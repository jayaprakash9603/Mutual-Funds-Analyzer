export const BACKEND_URL_STORAGE_KEY = 'mfa.backendBaseUrl'
export const BACKEND_URL_CHANGED_EVENT = 'mfa:backend-url-changed'

function isDemoBuildEnv(): boolean {
  const value = import.meta.env.VITE_DEMO_MODE?.trim().toLowerCase()
  return value === 'true' || value === '1' || value === 'on' || value === 'yes'
}

/** Empty means same-origin `/api` (Docker nginx / Vite proxy). Live builds only. */
export function getBackendBaseUrl(): string {
  if (isDemoBuildEnv() || typeof localStorage === 'undefined') {
    return ''
  }
  try {
    return normalizeBackendBaseUrl(localStorage.getItem(BACKEND_URL_STORAGE_KEY) ?? '')
  } catch {
    return ''
  }
}

export function setBackendBaseUrl(value: string): string {
  if (isDemoBuildEnv()) {
    return ''
  }
  const normalized = normalizeBackendBaseUrl(value)
  if (normalized) {
    localStorage.setItem(BACKEND_URL_STORAGE_KEY, normalized)
  } else {
    localStorage.removeItem(BACKEND_URL_STORAGE_KEY)
  }
  window.dispatchEvent(new Event(BACKEND_URL_CHANGED_EVENT))
  return normalized
}

/**
 * Accepts blank (same-origin) or an absolute http(s) origin.
 * Strips paths so `http://host:8080/api` becomes `http://host:8080`.
 */
export function normalizeBackendBaseUrl(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) {
    return ''
  }
  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    throw new Error('Enter a full URL like http://localhost:8080')
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('URL must start with http:// or https://')
  }
  return `${parsed.protocol}//${parsed.host}`
}

/** Resolves `/api/...` against the configured backend origin (live only). */
export function resolveApiUrl(path: string): string {
  const base = getBackendBaseUrl()
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  if (!base) {
    return normalizedPath
  }
  return `${base}${normalizedPath}`
}
