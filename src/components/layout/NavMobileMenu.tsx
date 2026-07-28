import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { NavTabItem } from './NavTabs'

type NavMobileMenuProps = {
  items: NavTabItem[]
  pathname: string
}

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
          'fixed left-0 top-0 z-50 flex h-full w-[min(300px,88vw)] max-w-none flex-col gap-0 p-0',
          'translate-x-0 translate-y-0 rounded-none border-0 border-r shadow-xl',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left',
          'duration-200',
        )}
      >
        <div className="border-b border-border/60 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Menu
          </p>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2" aria-label="Main navigation">
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
                  'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-foreground hover:bg-muted/70',
                )}
              >
                <Icon className="size-5 shrink-0" aria-hidden="true" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </DialogContent>
    </Dialog>
  )
}
