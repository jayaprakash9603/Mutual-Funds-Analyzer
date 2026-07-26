import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export type NavTabItem = {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' }>
  match: (path: string) => boolean
}

type NavTabsProps = {
  items: NavTabItem[]
  pathname: string
  compact?: boolean
  className?: string
}

export function NavTabs({ items, pathname, compact = false, className }: NavTabsProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [indicator, setIndicator] = useState({ left: 0, width: 0, ready: false })

  const activeItem = items.find((item) => item.match(pathname)) ?? items[0]

  const updateIndicator = () => {
    const track = trackRef.current
    if (!track || !activeItem) {
      setIndicator((prev) => ({ ...prev, ready: false }))
      return
    }

    const activeEl = track.querySelector<HTMLElement>(`[data-nav-id="${activeItem.to}"]`)
    if (!activeEl) {
      setIndicator((prev) => ({ ...prev, ready: false }))
      return
    }

    setIndicator({
      left: activeEl.offsetLeft,
      width: activeEl.offsetWidth,
      ready: activeEl.offsetWidth > 0,
    })
  }

  useLayoutEffect(() => {
    updateIndicator()
  }, [pathname, items.length, activeItem?.to, compact])

  useEffect(() => {
    const onResize = () => updateIndicator()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [pathname, items.length, activeItem?.to, compact])

  return (
    <div
      ref={trackRef}
      className={cn(
        'relative flex h-11 items-stretch rounded-2xl bg-muted/55 p-1 ring-1 ring-border/60',
        compact ? 'min-w-full' : '',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-y-1 rounded-xl bg-primary shadow-md shadow-primary/20 transition-[left,width,opacity] duration-300 ease-out motion-reduce:transition-none',
          indicator.ready ? 'opacity-100' : 'opacity-0',
        )}
        style={{ left: indicator.left, width: indicator.width }}
      />
      {items.map((item) => {
        const Icon = item.icon
        const active = item.match(pathname)
        return (
          <Link
            key={item.to}
            to={item.to}
            data-nav-id={item.to}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'relative z-10 inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl text-sm font-medium transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none',
              compact ? 'min-w-[4.25rem] shrink-0 px-3 sm:min-w-0 sm:flex-1 sm:px-4' : 'px-4',
              active ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            <span className={cn(compact ? 'hidden sm:inline' : 'inline')}>{item.label}</span>
          </Link>
        )
      })}
    </div>
  )
}
