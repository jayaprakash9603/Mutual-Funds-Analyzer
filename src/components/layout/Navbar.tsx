import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BarChart3, GitCompare, Home, Moon, Sun, BookOpen, FileText } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { DemoModeToggle } from '@/components/layout/DemoModeToggle'
import { useFeature } from '@/context/FeatureFlagProvider'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', label: 'Home', icon: Home, match: (path: string) => path === '/' },
  { to: '/dashboard', label: 'Analyze', icon: BarChart3, match: (path: string) => path === '/dashboard' },
  {
    to: '/fund',
    label: 'Report',
    icon: FileText,
    match: (path: string) => path === '/fund' || path.startsWith('/fund/'),
  },
  { to: '/compare', label: 'Compare', icon: GitCompare, match: (path: string) => path === '/compare' },
  { to: '/method', label: 'Method', icon: BookOpen, match: (path: string) => path === '/method' },
] as const

function isNavActive(pathname: string, item: (typeof navItems)[number]) {
  return item.match(pathname)
}

export function Navbar() {
  const location = useLocation()
  const { theme, setTheme } = useTheme()
  const showThemeToggle = useFeature('ui.themeToggle')
  const showLanding = useFeature('ui.landingPage')
  const showCompare = useFeature('ui.comparePage')
  const showMethod = useFeature('ui.methodPage')
  const showFundReport = useFeature('ui.fundReportPage')

  const navRef = useRef<HTMLElement>(null)
  const mobileNavRef = useRef<HTMLElement>(null)
  const [indicator, setIndicator] = useState({ left: 0, width: 0, ready: false })

  const visibleItems = navItems.filter((item) => {
    if (item.to === '/dashboard') return true
    if (item.to === '/fund') return showFundReport
    if (item.to === '/') return showLanding
    if (item.to === '/compare') return showCompare
    if (item.to === '/method') return showMethod
    return true
  })

  const activeItem = visibleItems.find((item) => isNavActive(location.pathname, item)) ?? visibleItems[0]

  const updateIndicator = () => {
    const desktop = navRef.current
    const mobile = mobileNavRef.current
    const container =
      desktop && desktop.offsetParent !== null
        ? desktop
        : mobile && mobile.offsetParent !== null
          ? mobile
          : null

    if (!container || !activeItem) {
      setIndicator((prev) => ({ ...prev, ready: false }))
      return
    }

    const activeEl = container.querySelector<HTMLElement>(`[data-nav-id="${activeItem.to}"]`)
    if (!activeEl) {
      setIndicator((prev) => ({ ...prev, ready: false }))
      return
    }

    const containerRect = container.getBoundingClientRect()
    const tabRect = activeEl.getBoundingClientRect()
    setIndicator({
      left: tabRect.left - containerRect.left + container.scrollLeft,
      width: tabRect.width,
      ready: tabRect.width > 0,
    })
  }

  useLayoutEffect(() => {
    updateIndicator()
  }, [location.pathname, visibleItems.length, activeItem?.to])

  useEffect(() => {
    const onResize = () => updateIndicator()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [location.pathname, visibleItems.length, activeItem?.to])

  const renderNavLink = (item: (typeof navItems)[number], compact = false) => {
    const Icon = item.icon
    const active = isNavActive(location.pathname, item)

    return (
      <Link
        key={item.to}
        to={item.to}
        data-nav-id={item.to}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'relative z-10 inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl px-3 text-sm font-medium transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none',
          compact ? 'min-w-[4.5rem] shrink-0 sm:min-w-0 sm:flex-1 sm:px-4' : 'flex-1 px-4',
          active ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
        )}
      >
        <Icon className="size-4 shrink-0" aria-hidden="true" />
        <span className={cn(compact ? 'hidden sm:inline' : 'inline')}>{item.label}</span>
      </Link>
    )
  }

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
          ref={navRef}
          className="relative hidden min-w-0 flex-1 items-center md:flex"
          aria-label="Main navigation"
        >
          <div className="relative flex h-11 w-full items-stretch rounded-2xl bg-muted/55 p-1 ring-1 ring-border/60">
            <span
              aria-hidden="true"
              className={cn(
                'pointer-events-none absolute inset-y-1 rounded-xl bg-primary shadow-md shadow-primary/20 transition-[left,width,opacity] duration-300 ease-out motion-reduce:transition-none',
                indicator.ready ? 'opacity-100' : 'opacity-0',
              )}
              style={{ left: indicator.left, width: indicator.width }}
            />
            {visibleItems.map((item) => renderNavLink(item))}
          </div>
        </nav>

        <nav
          ref={mobileNavRef}
          className="relative flex min-w-0 flex-1 overflow-x-auto scroll-smooth [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden"
          aria-label="Main navigation"
        >
          <div className="relative flex h-11 min-w-full items-stretch rounded-2xl bg-muted/55 p-1 ring-1 ring-border/60">
            <span
              aria-hidden="true"
              className={cn(
                'pointer-events-none absolute inset-y-1 rounded-xl bg-primary shadow-md shadow-primary/20 transition-[left,width,opacity] duration-300 ease-out motion-reduce:transition-none',
                indicator.ready ? 'opacity-100' : 'opacity-0',
              )}
              style={{ left: indicator.left, width: indicator.width }}
            />
            {visibleItems.map((item) => renderNavLink(item, true))}
          </div>
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
