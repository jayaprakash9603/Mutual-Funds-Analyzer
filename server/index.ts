import express from 'express'
import cors from 'cors'
import https from 'https'
import zlib from 'zlib'
import { randomBytes } from 'crypto'

const app = express()
const PORT = 8787
const UPSTREAM_HOST = 'analysis.investt.in'
const UPSTREAM_BASE = '/mutual-funds-research'
const CACHE_TTL_MS = 60 * 60 * 1000
const REQUEST_TIMEOUT_MS = 60_000

const agent = new https.Agent({ keepAlive: true, maxSockets: 8, keepAliveMsecs: 30_000 })

type CacheEntry = { data: unknown; expiresAt: number }
const cache = new Map<string, CacheEntry>()
const inFlight = new Map<string, Promise<unknown>>()

function getCacheKey(path: string, params: Record<string, string>) {
  return `${path}:${JSON.stringify(params)}`
}

function getCached(key: string) {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    cache.delete(key)
    return null
  }
  return entry.data
}

function buildMultipartBody(fields: Record<string, string>) {
  const boundary = `----investt${randomBytes(12).toString('hex')}`
  const parts = Object.entries(fields).map(
    ([key, value]) =>
      `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`,
  )
  const body = Buffer.from(`${parts.join('')}--${boundary}--\r\n`, 'utf8')
  return { boundary, body }
}

function decompress(buffer: Buffer, encoding?: string): Buffer {
  if (encoding === 'gzip') return zlib.gunzipSync(buffer)
  if (encoding === 'deflate') return zlib.inflateSync(buffer)
  if (encoding === 'br') return zlib.brotliDecompressSync(buffer)
  return buffer
}

/**
 * The upstream expects GET requests carrying a multipart/form-data body, which
 * fetch() and axios both refuse to send. The raw http module allows it.
 */
function upstreamGet(path: string, fields: Record<string, string>) {
  const { boundary, body } = buildMultipartBody(fields)

  return new Promise<unknown>((resolve, reject) => {
    const req = https.request(
      {
        host: UPSTREAM_HOST,
        path: `${UPSTREAM_BASE}/${path}`,
        method: 'GET',
        agent,
        timeout: REQUEST_TIMEOUT_MS,
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': body.length,
          'Accept-Encoding': 'gzip, deflate',
          Accept: 'application/json, text/plain, */*',
        },
      },
      (res) => {
        const chunks: Buffer[] = []
        res.on('data', (chunk: Buffer) => chunks.push(chunk))
        res.on('end', () => {
          try {
            const raw = decompress(Buffer.concat(chunks), res.headers['content-encoding'])
            const text = raw.toString('utf8').trim()
            if (res.statusCode && res.statusCode >= 400) {
              reject(new Error(`Upstream responded ${res.statusCode}`))
              return
            }
            resolve(text === '' || text === 'null' ? null : (JSON.parse(text) as unknown))
          } catch (error) {
            reject(error instanceof Error ? error : new Error('Failed to parse upstream response'))
          }
        })
      },
    )

    req.on('timeout', () => req.destroy(new Error('Upstream request timed out')))
    req.on('error', reject)
    req.end(body)
  })
}

/** Collapses duplicate concurrent requests onto a single upstream call. */
async function cachedFetch<T>(cacheKey: string, loader: () => Promise<T>): Promise<T> {
  const cached = getCached(cacheKey)
  if (cached !== null) return cached as T

  const pending = inFlight.get(cacheKey)
  if (pending) return pending as Promise<T>

  const promise = loader()
    .then((data) => {
      cache.set(cacheKey, { data, expiresAt: Date.now() + CACHE_TTL_MS })
      return data
    })
    .finally(() => inFlight.delete(cacheKey))

  inFlight.set(cacheKey, promise)
  return promise
}

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.get('/api/schemes', async (req, res) => {
  const query = String(req.query.query ?? '')
  const category = String(req.query.category ?? 'All')

  try {
    const schemes = await cachedFetch(getCacheKey('schemes', { query, category }), async () => {
      const data = await upstreamGet('autoSuggestAllMfSchemes', { category, query })
      return Array.isArray(data) ? (data as string[]) : []
    })
    res.set('Cache-Control', 'private, max-age=600')
    res.json(schemes)
  } catch (error) {
    res.status(502).json({
      error: error instanceof Error ? error.message : 'Failed to fetch schemes',
    })
  }
})

app.get('/api/rolling-returns', async (req, res) => {
  const scheme = String(req.query.scheme ?? '')
  const period = String(req.query.period ?? '5 Year')
  const start_date = String(req.query.start_date ?? '01-01-2013')

  if (!scheme) {
    res.status(400).json({ error: 'scheme is required' })
    return
  }

  try {
    const payload = await cachedFetch(
      getCacheKey('rolling-returns', { scheme, period, start_date }),
      async () => {
        const data = await upstreamGet('getRollingReturnVsBenchmark', {
          scheme,
          start_date,
          period,
        })

        if (!Array.isArray(data) || data.length < 2) {
          throw new Error('No rolling return data found')
        }

        const normalize = (rows: unknown[]) =>
          (rows as Record<string, unknown>[]).map((row) => ({
            ...row,
            period: typeof row.period === 'string' ? row.period : period,
            scheme_category: typeof row.scheme_category === 'string' ? row.scheme_category : '',
          }))

        return { fund: normalize(data[0]), benchmark: normalize(data[1]) }
      },
    )

    res.set('Cache-Control', 'private, max-age=3600')
    res.json(payload)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch rolling returns'
    res.status(message === 'No rolling return data found' ? 404 : 502).json({ error: message })
  }
})

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`)
})
