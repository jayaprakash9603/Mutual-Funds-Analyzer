import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { NavTabItem } from './NavTabs'

type NavMobileMenuProps = {
  items: NavTabItem[]
  pathname: string
}

/** Mobile nav: hamburger last in the toolbar; panel drops from the top. */
export function NavMobileMenu({ items, pathname }: NavMobileMenuProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-10 shrink-0 rounded-xl border-border/70 bg-background/60 shadow-sm md:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="size-5" aria-hidden="true" />
        </Button>
      </DialogTrigger>
      <DialogContent
        className={cn(
          'fixed inset-x-0 top-0 z-50 flex max-h-[min(88dvh,36rem)] w-full max-w-none flex-col gap-0 overflow-hidden p-0',
          'translate-x-0 translate-y-0 rounded-none rounded-b-3xl border-0 border-b border-border/60 bg-background/95 shadow-2xl backdrop-blur-xl',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'duration-200',
          // Hide the default centered dialog close; we render our own in the sheet header.
          '[&>button.absolute]:hidden',
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border/50 px-4 py-3.5 sm:px-5">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Navigate
            </p>
            <p className="truncate text-sm font-semibold tracking-tight">Analyzer</p>
          </div>
          <DialogClose asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9 shrink-0 rounded-full"
              aria-label="Close menu"
            >
              <X className="size-4" aria-hidden="true" />
            </Button>
          </DialogClose>
        </div>

        <nav
          className="flex flex-1 flex-col gap-1 overflow-y-auto overscroll-contain p-3 sm:p-4"
          aria-label="Main navigation"
        >
          {items.map((item) => {
            const Icon = item.icon
            const active = item.match(pathname)
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'group flex items-center gap-3 rounded-2xl px-3.5 py-3.5 text-sm font-medium transition-all',
                  active
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                    : 'bg-muted/35 text-foreground hover:bg-muted/70',
                )}
              >
                <span
                  className={cn(
                    'flex size-10 items-center justify-center rounded-xl transition-colors',
                    active ? 'bg-primary-foreground/15' : 'bg-background/80 ring-1 ring-border/60',
                  )}
                >
                  <Icon className="size-5 shrink-0" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1 truncate text-[15px]">{item.label}</span>
                <ChevronRight
                  className={cn(
                    'size-4 shrink-0 transition-transform group-hover:translate-x-0.5',
                    active ? 'opacity-80' : 'text-muted-foreground',
                  )}
                  aria-hidden="true"
                />
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-border/50 px-4 py-3 text-center text-xs text-muted-foreground sm:px-5">
          Tap a page to open it
        </div>
      </DialogContent>
    </Dialog>
  )
}
