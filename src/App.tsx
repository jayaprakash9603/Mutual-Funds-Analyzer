import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/context/ThemeProvider'
import { AppProvider } from '@/context/AppContext'
import { FeatureFlagProvider, useFeature } from '@/context/FeatureFlagProvider'
import { Navbar } from '@/components/layout/Navbar'
import { AppChrome } from '@/components/layout/AppChrome'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { DemoComplianceBanner } from '@/components/layout/DemoComplianceBanner'
import { CommandPalette, useCommandPalette } from '@/components/layout/CommandPalette'
import { ErrorBoundary } from '@/components/layout/ErrorBoundary'
import { Skeleton } from '@/components/ui/skeleton'
import { LandingPage } from '@/pages/LandingPage'

const DashboardPage = lazy(() => import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const ComparePage = lazy(() => import('@/pages/ComparePage').then((m) => ({ default: m.ComparePage })))
const MethodPage = lazy(() => import('@/pages/MethodPage').then((m) => ({ default: m.MethodPage })))
const FundReportPage = lazy(() => import('@/pages/FundReportPage'))
const DisclaimerPage = lazy(() => import('@/pages/DisclaimerPage').then((m) => ({ default: m.DisclaimerPage })))
const PrivacyPage = lazy(() => import('@/pages/PrivacyPage').then((m) => ({ default: m.PrivacyPage })))
const TermsPage = lazy(() => import('@/pages/TermsPage').then((m) => ({ default: m.TermsPage })))
const SourcesPage = lazy(() => import('@/pages/SourcesPage').then((m) => ({ default: m.SourcesPage })))
const GuidelinesPage = lazy(() => import('@/pages/GuidelinesPage').then((m) => ({ default: m.GuidelinesPage })))

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
    <div className="flex min-h-dvh flex-col">
      <AppChrome>
        <DemoComplianceBanner />
        <Navbar />
      </AppChrome>
      <main id="main-content" className="flex-1">
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
              <Route path="/disclaimer" element={<DisclaimerPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/sources" element={<SourcesPage />} />
              <Route path="/guidelines" element={<GuidelinesPage />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
      <SiteFooter />
      {showCommandPalette && <CommandPalette open={open} onOpenChange={setOpen} />}
      <Toaster richColors position="bottom-right" />
    </div>
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
