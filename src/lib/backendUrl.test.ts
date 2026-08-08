import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getBackendBaseUrl,
  normalizeBackendBaseUrl,
  resolveApiUrl,
  setBackendBaseUrl,
  BACKEND_URL_STORAGE_KEY,
} from './backendUrl'

describe('normalizeBackendBaseUrl', () => {
  it('treats blank as same-origin', () => {
    expect(normalizeBackendBaseUrl('')).toBe('')
    expect(normalizeBackendBaseUrl('   ')).toBe('')
  })

  it('keeps origin and drops path', () => {
    expect(normalizeBackendBaseUrl('http://localhost:8080/api')).toBe('http://localhost:8080')
    expect(normalizeBackendBaseUrl('https://api.example.com/')).toBe('https://api.example.com')
  })

  it('rejects invalid values', () => {
    expect(() => normalizeBackendBaseUrl('not a url')).toThrow(/full URL/i)
    expect(() => normalizeBackendBaseUrl('localhost:8080')).toThrow(/http/i)
    expect(() => normalizeBackendBaseUrl('ftp://localhost')).toThrow(/http/i)
  })
})

describe('resolveApiUrl', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_DEMO_MODE', 'false')
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
    vi.unstubAllEnvs()
  })

  it('uses relative paths when no override is set', () => {
    expect(resolveApiUrl('/api/schemes')).toBe('/api/schemes')
  })

  it('prefixes the configured backend origin', () => {
    localStorage.setItem(BACKEND_URL_STORAGE_KEY, 'http://127.0.0.1:8080')
    expect(resolveApiUrl('/api/schemes')).toBe('http://127.0.0.1:8080/api/schemes')
  })

  it('ignores overrides in demo builds', () => {
    vi.stubEnv('VITE_DEMO_MODE', 'true')
    localStorage.setItem(BACKEND_URL_STORAGE_KEY, 'http://127.0.0.1:8080')
    expect(getBackendBaseUrl()).toBe('')
    expect(resolveApiUrl('/api/schemes')).toBe('/api/schemes')
  })

  it('persists through setBackendBaseUrl', () => {
    expect(setBackendBaseUrl('http://localhost:8080/')).toBe('http://localhost:8080')
    expect(getBackendBaseUrl()).toBe('http://localhost:8080')
    expect(setBackendBaseUrl('')).toBe('')
    expect(localStorage.getItem(BACKEND_URL_STORAGE_KEY)).toBeNull()
  })
})
