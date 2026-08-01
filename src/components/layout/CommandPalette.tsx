import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Command } from 'cmdk'
import { Search, BarChart3, GitCompare, BookOpen, FileText, Star, Clock } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useAppContext } from '@/context/AppContext'
import { useFeature } from '@/context/FeatureFlagProvider'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate()
  const { favorites, recentAnalyses } = useAppContext()
  const showDashboard = useFeature('ui.dashboardPage')
  const showCompare = useFeature('ui.comparePage')
  const showMethod = useFeature('ui.methodPage')
  const showFundReport = useFeature('ui.fundReportPage')

  const run = (path: string) => {
    navigate(path)
    onOpenChange(false)
  }

  // Saved schemes open wherever fund analysis actually lives.
  const schemePath = (scheme: string) =>
    `${showFundReport ? '/fund' : '/dashboard'}?scheme=${encodeURIComponent(scheme)}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(640px,calc(100vh-2rem))] w-[min(32rem,calc(100vw-2rem))] overflow-hidden p-0 shadow-2xl">
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Command.Input placeholder="Search pages, favorites, recent..." className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none" />
          </div>
          <Command.List className="max-h-[min(420px,calc(100vh-10rem))] overflow-y-auto p-2">
            <Command.Empty>No results found.</Command.Empty>
            <Command.Group heading="Navigation">
              {showFundReport && (
                <Command.Item onSelect={() => run('/fund')} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 aria-selected:bg-accent">
                  <FileText className="h-4 w-4" /> Fund Report
                </Command.Item>
              )}
              {showDashboard && (
                <Command.Item onSelect={() => run('/dashboard')} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 aria-selected:bg-accent">
                  <BarChart3 className="h-4 w-4" /> Analyze Fund
                </Command.Item>
              )}
              {showCompare && (
                <Command.Item onSelect={() => run('/compare')} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 aria-selected:bg-accent">
                  <GitCompare className="h-4 w-4" /> Compare Funds
                </Command.Item>
              )}
              {showMethod && (
                <Command.Item onSelect={() => run('/method')} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 aria-selected:bg-accent">
                  <BookOpen className="h-4 w-4" /> Learn Method
                </Command.Item>
              )}
            </Command.Group>
            {favorites.length > 0 && (
              <Command.Group heading="Favorites">
                {favorites.map((f) => (
                  <Command.Item
                    key={f}
                    onSelect={() => run(schemePath(f))}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 aria-selected:bg-accent"
                  >
                    <Star className="h-4 w-4" /> {f}
                  </Command.Item>
                ))}
              </Command.Group>
            )}
            {recentAnalyses.length > 0 && (
              <Command.Group heading="Recent">
                {recentAnalyses.map((r) => (
                  <Command.Item
                    key={r.scheme}
                    onSelect={() => run(schemePath(r.scheme))}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 aria-selected:bg-accent"
                  >
                    <Clock className="h-4 w-4" /> {r.scheme}
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  )
}

export function useCommandPalette() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  return { open, setOpen }
}
