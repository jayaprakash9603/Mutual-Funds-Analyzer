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

export interface LiveSetupStep {
  title: string
  description: string
  /** Extra guidance shown under the description. */
  detail?: string
  commands: string[]
  /** When set, the step shows this link instead of (or in addition to) commands. */
  href?: string
  hrefLabel?: string
}

/** Hosted live Analyzer URL opened from the demo “Use live data” dialog. */
export const LIVE_APP_URL = 'https://analyzer.quickcalci.com/'

/** Local live front end for developers running the stack on their machine. */
export const LOCAL_LIVE_APP_URL = 'http://localhost:5173'

/** Shown when the user asks how to run live data from a demo build. */
export const LIVE_APP_SETUP: LiveSetupStep[] = [
  {
    title: 'Know what this demo page is',
    description:
      'You are on the demo build. Charts and scores come from sample / captured fixtures — not a live market API.',
    detail:
      'Switching to live data means opening a different app (or running the API + live front end on your machine). This tab will keep using demo fixtures.',
    commands: [],
  },
  {
    title: 'Open the hosted live app',
    description: 'Use the production Analyzer URL when it is running with live APIs.',
    detail:
      'This is the fastest path for most visitors. If the live site is unavailable, continue with the local steps below.',
    commands: [],
    href: LIVE_APP_URL,
    hrefLabel: LIVE_APP_URL,
  },
  {
    title: 'Download compose + pull live images (easiest)',
    description:
      'Download docker-compose.live.yml and .env.example from the repo, then pull backend + frontend from Docker Hub.',
    detail:
      'After containers are healthy, open http://localhost:8088 — that is the LIVE UI. This demo tab stays on fixtures. Full guide: DOCKER.md',
    commands: [
      'copy .env.example .env',
      'docker compose -f docker-compose.live.yml pull',
      'docker compose -f docker-compose.live.yml up -d',
      'start http://localhost:8088',
    ],
  },
  {
    title: 'Or build images from source, then run',
    description: 'When you have the full git clone with JDK 17, Maven, and Node 20+.',
    detail: 'Both images share MFA_VERSION (e.g. 1.0.3). See DOCKER.md Option 1.',
    commands: ['npm run docker:images', 'docker compose up -d', 'start http://localhost:8088'],
  },
  {
    title: 'Confirm you are on live data',
    description: 'Live builds do not show the amber “Demo data” badge or demo fund chips.',
    detail:
      'Docker live UI: http://localhost:8088. Hosted: analyzer.quickcalci.com. If API calls fail, check mfa-backend is healthy.',
    commands: [],
    href: LIVE_APP_URL,
    hrefLabel: 'Open hosted live Analyzer',
  },
]

export const LIVE_APP_NOTE =
  'This page always uses demo fixtures. Live market data needs Docker (http://localhost:8088), the hosted live app, or npm run dev with the API.'
