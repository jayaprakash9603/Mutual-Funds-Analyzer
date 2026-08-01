import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  checkBackendAvailable,
  isDemoBuild,
  isDemoModeEnabled,
  LIVE_APP_SETUP,
  LIVE_APP_URL,
} from '@/demo/config/demoMode'

describe('demoMode', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_DEMO_MODE', '')
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('is off in live builds', () => {
    expect(isDemoModeEnabled()).toBe(false)
    expect(isDemoBuild()).toBe(false)
  })

  it('always uses fixtures in demo builds', () => {
    vi.stubEnv('VITE_DEMO_MODE', 'true')
    expect(isDemoModeEnabled()).toBe(true)
    expect(isDemoBuild()).toBe(true)
  })

  it('reports when the back end responds to the probe', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true } as Response)
    await expect(checkBackendAvailable()).resolves.toBe(true)
    expect(fetch).toHaveBeenCalledWith('/api/features', expect.any(Object))
  })

  it('reports when the back end probe fails', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('connection refused'))
    await expect(checkBackendAvailable()).resolves.toBe(false)
  })

  it('documents how to start both servers for live mode', () => {
    const joined = LIVE_APP_SETUP.flatMap((step) => [step.title, step.description, ...step.commands]).join(' ')
    expect(joined).toMatch(/docker compose|dev:api/)
    expect(joined).toMatch(/dev:client|npm run dev/)
    expect(LIVE_APP_URL).toMatch(/analyzer\.quickcalci\.com/)
  })
})
