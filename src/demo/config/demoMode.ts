/**
 * Demo fixtures are only used in demo builds (`vite --mode demo` / `npm run build:demo`).
 * Live builds always call the back end and never expose demo controls.
 *
 * Demo and live are separate deployments — a demo build cannot switch to live data in place.
 * The navbar guides users to the hosted live app or a local live stack.
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
    title: 'Or start the back end locally',
    description: 'Spring Boot must listen on port 8080 so the live front end can load real fund data.',
    detail:
      'Prefer Docker if you want MySQL + API + nginx together. Use npm run dev:api when you already have a database configured.',
    commands: ['docker compose up', 'npm run dev:api'],
  },
  {
    title: 'Start the live front end locally',
    description: 'Run the non-demo Vite app — do not use npm run dev:demo or npm run build (demo).',
    detail: `When the server is ready, open ${LOCAL_LIVE_APP_URL} in a new tab. Keep this demo tab if you still want sample data.`,
    commands: ['npm run dev', 'npm run dev:client'],
  },
  {
    title: 'Confirm you are on live data',
    description: 'Live builds do not show the amber “Demo data” badge or demo fund chips.',
    detail:
      'Search any scheme name; reports load from your API. If calls fail, check that the back end is healthy on port 8080.',
    commands: [],
    href: LIVE_APP_URL,
    hrefLabel: 'Open live Analyzer',
  },
]

export const LIVE_APP_NOTE =
  'This page always uses demo fixtures. Live market data needs the hosted live app or a local API + live front end.'
