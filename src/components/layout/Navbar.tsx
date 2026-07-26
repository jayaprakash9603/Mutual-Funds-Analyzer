import { Link, useLocation } from 'react-router-dom'
import { BarChart3, GitCompare, Home, Moon, Sun, BookOpen, FileText } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { DemoModeToggle } from '@/components/layout/DemoModeToggle'
import { NavTabs, type NavTabItem } from '@/components/layout/NavTabs'
import { useFeature } from '@/context/FeatureFlagProvider'

const navItems: NavTabItem[] = [
  { to: '/', label: 'Home', icon: Home, match: (path) => path === '/' },
  { to: '/dashboard', label: 'Analyze', icon: BarChart3, match: (path) => path === '/dashboard' },
  {
    to: '/fund',
    label: 'Report',
    icon: FileText,
    match: (path) => path === '/fund' || path.startsWith('/fund/'),
  },
  { to: '/compare', label: 'Compare', icon: GitCompare, match: (path) => path === '/compare' },
  { to: '/method', label: 'Method', icon: BookOpen, match: (path) => path === '/method' },
]

export function Navbar() {
  const location = useLocation()
  const { theme, setTheme } = useTheme()
  const showThemeToggle = useFeature('ui.themeToggle')
  const showLanding = useFeature('ui.landingPage')
  const showCompare = useFeature('ui.comparePage')
  const showMethod = useFeature('ui.methodPage')
  const showFundReport = useFeature('ui.fundReportPage')

  const visibleItems = navItems.filter((item) => {
    if (item.to === '/dashboard') return true
    if (item.to === '/fund') return showFundReport
    if (item.to === '/') return showLanding
    if (item.to === '/compare') return showCompare
    if (item.to === '/method') return showMethod
    return true
  })

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:outline-none"
      >
        Skip to main content
      </a>

      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
        aria-hidden="true"
      />

      <div className="mx-auto flex h-16 w-full items-center gap-3 px-3 sm:gap-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="group flex shrink-0 items-center gap-2.5 rounded-xl py-1 pr-2 transition-opacity duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 text-primary shadow-inner ring-1 ring-primary/15 transition-transform duration-200 group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100">
            <BarChart3 className="size-5" aria-hidden="true" />
          </div>
          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-sm font-semibold leading-tight tracking-tight">Golden Triangle</p>
            <p className="truncate text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Analyzer
            </p>
          </div>
        </Link>

        <nav
          className="relative hidden min-w-0 flex-1 items-center justify-center md:flex"
          aria-label="Main navigation"
        >
          <NavTabs items={visibleItems} pathname={location.pathname} />
        </nav>

        <nav
          className="relative flex min-w-0 flex-1 overflow-x-auto scroll-smooth [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden"
          aria-label="Main navigation"
        >
          <NavTabs items={visibleItems} pathname={location.pathname} compact />
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <DemoModeToggle />
          {showThemeToggle && (
            <Button
              variant="outline"
              size="icon"
              className="size-10 shrink-0 rounded-xl border-border/70 bg-background/60 shadow-sm"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle theme"
            >
              <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
