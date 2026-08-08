/**
 * Demo fixtures are only used in demo builds (`vite --mode demo` / `npm run build:demo`).
 * Live builds always call the back end and never expose demo controls.
 *
 * Demo and live are separate deployments — a demo build cannot switch to live data in place.
 * The navbar guides users to the hosted live app or a local live stack.
 */
import { resolveApiUrl } from '@/lib/backendUrl'

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

/** Probes the Spring Boot API so setup dialogs can show whether the back end is up. */
export async function checkBackendAvailable(signal?: AbortSignal): Promise<boolean> {
  try {
    const response = await fetch(resolveApiUrl(BACKEND_PROBE_PATH), {
      signal: signal ?? AbortSignal.timeout(BACKEND_PROBE_TIMEOUT_MS),
    })
    return response.ok
  } catch {
    return false
  }
}

export interface LiveSetupDownload {
  label: string
  href: string
  /** Suggested filename for the download attribute. */
  filename: string
  /** Emphasize as the main download CTA. */
  primary?: boolean
}

export interface LiveSetupStep {
  title: string
  description: string
  detail?: string
  /** Plain checklist lines (not shell). */
  checklist?: string[]
  /** Copyable shell commands. */
  commands: string[]
  downloads?: LiveSetupDownload[]
  href?: string
  hrefLabel?: string
}

/** Hosted live Analyzer URL opened from the demo “Use live data” dialog. */
export const LIVE_APP_URL = 'https://analyzer.quickcalci.com/'

/** Local live front end for developers running the stack on their machine. */
export const LOCAL_LIVE_APP_URL = 'http://localhost:5173'

/** Local Docker live UI after compose is up. */
export const LOCAL_DOCKER_LIVE_URL = 'http://localhost:8088'

/** One-click pack served from `public/downloads/` (compose + env + short README). */
export const LIVE_DOCKER_ZIP_URL = '/downloads/mfa-live-docker.zip'

/** Shown when the user asks how to run live data from a demo build. */
export const LIVE_APP_SETUP: LiveSetupStep[] = [
  {
    title: 'Hosted live app',
    description: 'No install. Opens live market data in a new tab.',
    commands: [],
    href: LIVE_APP_URL,
    hrefLabel: 'Open analyzer.quickcalci.com',
  },
  {
    title: 'Run live on your PC',
    description: 'Needs Docker Desktop. Download the pack, then run the commands.',
    detail: 'Live UI: http://localhost:8088 — this demo tab stays on fixtures.',
    downloads: [
      {
        label: 'Download Docker pack',
        href: LIVE_DOCKER_ZIP_URL,
        filename: 'mfa-live-docker.zip',
        primary: true,
      },
      {
        label: 'compose.yml',
        href: '/downloads/docker-compose.live.yml',
        filename: 'docker-compose.live.yml',
      },
      {
        label: 'env file',
        href: '/downloads/env.example',
        filename: 'env.example',
      },
    ],
    checklist: ['Unzip into an empty folder', 'Rename env.example → .env'],
    commands: [
      'docker compose -f docker-compose.live.yml pull',
      'docker compose -f docker-compose.live.yml up -d',
    ],
  },
  {
    title: 'Confirm live data',
    description: 'No amber “Demo data” badge. Use localhost:8088 or the hosted URL.',
    commands: [],
    href: LOCAL_DOCKER_LIVE_URL,
    hrefLabel: 'Open http://localhost:8088',
  },
]

export const LIVE_APP_NOTE =
  'Demo fixtures only on this page. Live data = hosted app, or Docker pack → http://localhost:8088.'
