import { Link, useLocation } from 'react-router-dom'
import { BarChart3, GitCompare, Home, Moon, Sun, BookOpen, FileText } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { DemoModeToggle } from '@/components/layout/DemoModeToggle'
import { useFeature } from '@/context/FeatureFlagProvider'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/dashboard', label: 'Analyze', icon: BarChart3 },
  { to: '/fund', label: 'Report', icon: FileText },
  { to: '/compare', label: 'Compare', icon: GitCompare },
  { to: '/method', label: 'Method', icon: BookOpen },
] as const

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
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <BarChart3 className="h-5 w-5" aria-hidden="true" />
          </div>
          <span className="hidden sm:inline">Golden Triangle Analyzer</span>
        </Link>

        <nav className="flex items-center gap-1" aria-label="Main navigation">
          {visibleItems.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to}>
              <Button
                variant={location.pathname === to || (to === '/fund' && location.pathname.startsWith('/fund')) ? 'default' : 'ghost'}
                size="sm"
                className={cn('gap-2', (location.pathname === to || (to === '/fund' && location.pathname.startsWith('/fund'))) && 'shadow')}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span className="hidden md:inline">{label}</span>
              </Button>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <DemoModeToggle />
          {showThemeToggle && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle theme"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
