import { Link, useLocation } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { isDemoBuild } from '@/demo/config/demoMode'

/** Demo-only notice on the home page: sample data + not advice. */
export function DemoComplianceBanner() {
  const { pathname } = useLocation()
  if (!isDemoBuild() || pathname !== '/') return null

  return (
    <aside
      className="border-b border-amber-500/25 bg-amber-500/10 text-amber-950 dark:bg-amber-500/15 dark:text-amber-50"
      role="note"
      aria-label="Demo compliance notice"
    >
      <div className="mx-auto flex max-w-7xl items-start gap-3 px-3 py-2.5 text-sm sm:items-center sm:px-6 lg:px-8">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-300 sm:mt-0" aria-hidden="true" />
        <p className="min-w-0 leading-snug">
          <span className="font-medium">Demo mode — sample data.</span>{' '}
          Figures may not match live NAVs. Educational research only; not investment advice.{' '}
          <Link to="/disclaimer" className="font-medium underline underline-offset-2 hover:opacity-90">
            Disclaimer
          </Link>
          {' · '}
          <Link to="/guidelines" className="font-medium underline underline-offset-2 hover:opacity-90">
            Guidelines
          </Link>
        </p>
      </div>
    </aside>
  )
}
