import { fetchFundReportMatrix, type MatrixReport } from '../../api'

export type MatrixMode = 'LUMPSUM' | 'MULTIPLE' | 'SIP' | 'STP_6M'

type MatrixCacheEntry = {
  data: MatrixReport | null
  error: string | null
  promise: Promise<MatrixReport> | null
  generation: number
}

const cache = new Map<string, MatrixCacheEntry>()

function cacheKey(scheme: string, mode: MatrixMode): string {
  return `${scheme}::${mode}`
}

function getEntry(key: string): MatrixCacheEntry {
  const existing = cache.get(key)
  if (existing) return existing
  const created: MatrixCacheEntry = {
    data: null,
    error: null,
    promise: null,
    generation: 0,
  }
  cache.set(key, created)
  return created
}

export function peekMatrixCache(scheme: string, mode: MatrixMode): MatrixReport | null {
  return cache.get(cacheKey(scheme, mode))?.data ?? null
}

export function invalidateMatrixCache(scheme?: string): void {
  if (!scheme) {
    cache.clear()
    return
  }
  for (const key of cache.keys()) {
    if (key.startsWith(`${scheme}::`)) {
      cache.delete(key)
    }
  }
}

export async function fetchMatrixCached(
  scheme: string,
  mode: MatrixMode,
  signal?: AbortSignal,
): Promise<MatrixReport> {
  const key = cacheKey(scheme, mode)
  const entry = getEntry(key)

  if (entry.data) {
    return entry.data
  }

  if (entry.promise) {
    return entry.promise
  }

  entry.generation += 1
  const generation = entry.generation
  entry.error = null

  const promise = fetchFundReportMatrix(scheme, mode, undefined, signal)
    .then((matrix) => {
      if (entry.generation !== generation) return matrix
      entry.data = matrix
      entry.error = null
      return matrix
    })
    .catch((err) => {
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw err
      }
      if (entry.generation === generation) {
        entry.error = err instanceof Error ? err.message : 'Failed to load matrix'
        entry.data = null
      }
      throw err
    })
    .finally(() => {
      if (entry.generation === generation) {
        entry.promise = null
      }
    })

  entry.promise = promise
  return promise
}
