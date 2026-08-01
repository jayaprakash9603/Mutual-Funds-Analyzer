import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/context/ThemeProvider'
import { AppProvider } from '@/context/AppContext'
import { FeatureFlagProvider, useFeature } from '@/context/FeatureFlagProvider'
import { Navbar } from '@/components/layout/Navbar'
import { CommandPalette, useCommandPalette } from '@/components/layout/CommandPalette'
import { ErrorBoundary } from '@/components/layout/ErrorBoundary'
import { Skeleton } from '@/components/ui/skeleton'
import { LandingPage } from '@/pages/LandingPage'

const DashboardPage = lazy(() => import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const ComparePage = lazy(() => import('@/pages/ComparePage').then((m) => ({ default: m.ComparePage })))
const MethodPage = lazy(() => import('@/pages/MethodPage').then((m) => ({ default: m.MethodPage })))
const FundReportPage = lazy(() => import('@/pages/FundReportPage'))

function PageLoader() {
  return (
    <div className="mx-auto max-w-7xl space-y-4 px-4 py-8">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-48 w-full rounded-xl" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  )
}

function AppShell() {
  const { open, setOpen } = useCommandPalette()
  const showCommandPalette = useFeature('ui.commandPalette')
  const showLanding = useFeature('ui.landingPage')
  const showDashboard = useFeature('ui.dashboardPage')
  const showCompare = useFeature('ui.comparePage')
  const showMethod = useFeature('ui.methodPage')
  const showFundReport = useFeature('ui.fundReportPage')

  /**
   * Redirect target for disabled routes. It resolves to a page that is still on, so
   * turning a page off can never point a redirect at another disabled page or at itself.
   */
  const fallbackPath = showFundReport
    ? '/fund'
    : showDashboard
      ? '/dashboard'
      : showCompare
        ? '/compare'
        : showMethod
          ? '/method'
          : '/'

  return (
    <>
      <Navbar />
      <main id="main-content">
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route
                path="/"
                element={
                  showLanding || fallbackPath === '/' ? <LandingPage /> : <Navigate to={fallbackPath} replace />
                }
              />
              <Route path="/dashboard" element={showDashboard ? <DashboardPage /> : <Navigate to={fallbackPath} replace />} />
              <Route path="/fund" element={showFundReport ? <FundReportPage /> : <Navigate to={fallbackPath} replace />} />
              <Route path="/fund/:scheme" element={showFundReport ? <FundReportPage /> : <Navigate to={fallbackPath} replace />} />
              <Route path="/compare" element={showCompare ? <ComparePage /> : <Navigate to={fallbackPath} replace />} />
              <Route path="/method" element={showMethod ? <MethodPage /> : <Navigate to={fallbackPath} replace />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
      {showCommandPalette && <CommandPalette open={open} onOpenChange={setOpen} />}
      <Toaster richColors position="bottom-right" />
    </>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <FeatureFlagProvider>
        <AppProvider>
          <BrowserRouter>
            <AppShell />
          </BrowserRouter>
        </AppProvider>
      </FeatureFlagProvider>
    </ThemeProvider>
  )
}
