/**
 * Demo fixtures are only used in demo builds (`vite --mode demo` / `npm run build:demo`).
 * Live builds always call the back end and never expose demo controls.
 *
 * Demo and live are separate deployments — a demo build cannot switch to live data in place.
 * The navbar guides users to start the live back end and front end separately.
 */
const BACKEND_PROBE_PATH = '/api/features'
const BACKEND_PROBE_TIMEOUT_MS = 5_000

function readBuildPreference(): boolean {
  const value = import.meta.env.VITE_DEMO_MODE?.trim().toLowerCase()
  return value === 'true' || value === '1' || value === 'on' || value === 'yes'
}

export function isDemoBuild(): boolean {
  return readBuildPreference()
}

/** True only in demo builds; live builds always call `/api/*`. */
export function isDemoModeEnabled(): boolean {
  return isDemoBuild()
}

/** Probes the Spring Boot API so the setup dialog can show whether the back end is up. */
export async function checkBackendAvailable(signal?: AbortSignal): Promise<boolean> {
  try {
    const response = await fetch(BACKEND_PROBE_PATH, {
      signal: signal ?? AbortSignal.timeout(BACKEND_PROBE_TIMEOUT_MS),
    })
    return response.ok
  } catch {
    return false
  }
}

export interface LiveSetupStep {
  title: string
  description: string
  commands: string[]
}

/** Shown when the user asks how to run live data from a demo build. */
export const LIVE_APP_SETUP: LiveSetupStep[] = [
  {
    title: 'Start the back end',
    description: 'Spring Boot must listen on port 8080 before the live front end can load data.',
    commands: ['docker compose up', 'npm run dev:api'],
  },
  {
    title: 'Start the live front end',
    description: 'Use the standard dev server — not the demo build.',
    commands: ['npm run dev', 'npm run dev:client'],
  },
  {
    title: 'Open the live app',
    description: 'Keep this demo tab for sample data, or open the live URL in a new window.',
    commands: [],
  },
]

export const LIVE_APP_URL = 'http://localhost:5173'

export const LIVE_APP_NOTE =
  'Demo and live are separate builds. This page always uses captured fixtures — follow the steps below to run live data.'
