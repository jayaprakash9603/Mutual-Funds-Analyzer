import { useEffect, useLayoutEffect, useState, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { Loader2, Search, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HighlightedText } from '@/components/ui/highlighted-text'
import { cn } from '@/lib/utils'

interface FundSearchDropdownProps {
  open: boolean
  anchorRef: RefObject<HTMLElement | null>
  query: string
  schemes: string[]
  loading: boolean
  selectedScheme: string | null
  activeIndex: number
  onActiveIndexChange: (index: number) => void
  onSelect: (scheme: string) => void
  isFavorite?: (scheme: string) => boolean
  onToggleFavorite?: (scheme: string) => void
  listRef?: RefObject<HTMLDivElement | null>
}

export function FundSearchDropdown({
  open,
  anchorRef,
  query,
  schemes,
  loading,
  selectedScheme,
  activeIndex,
  onActiveIndexChange,
  onSelect,
  isFavorite,
  onToggleFavorite,
  listRef,
}: FundSearchDropdownProps) {
  const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null)
  const trimmed = query.trim()
  const showPanel = open && trimmed.length > 0

  useLayoutEffect(() => {
    if (!showPanel) {
      setCoords(null)
      return
    }

    const update = () => {
      const el = anchorRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      setCoords({
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width,
      })
    }

    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [showPanel, anchorRef, schemes.length, loading])

  useEffect(() => {
    if (!showPanel || !listRef?.current) return
    const active = listRef.current.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
    active?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, showPanel, listRef])

  if (!showPanel || !coords || typeof document === 'undefined') return null

  const empty = !loading && schemes.length === 0

  return createPortal(
    <div
      ref={listRef}
      id="fund-search-results"
      role="presentation"
      className="pointer-events-auto fixed z-[100]"
      style={{ top: coords.top, left: coords.left, width: coords.width }}
    >
      <div className="overflow-hidden rounded-xl border border-border bg-background text-foreground shadow-2xl ring-1 ring-black/10 dark:ring-white/15">
        <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/60 px-3 py-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Search className="size-3.5" aria-hidden="true" />
            {loading ? 'Searching…' : empty ? 'No matches' : `${schemes.length} result${schemes.length === 1 ? '' : 's'}`}
          </span>
          {trimmed ? (
            <span className="max-w-[55%] truncate rounded-md bg-primary/15 px-1.5 py-0.5 font-mono text-[11px] font-medium text-primary">
              “{trimmed}”
            </span>
          ) : null}
        </div>

        {loading && schemes.length === 0 ? (
          <div className="flex items-center gap-2 px-4 py-6 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Looking up funds…
          </div>
        ) : empty ? (
          <div className="px-4 py-6 text-sm text-muted-foreground">
            No funds match <span className="font-medium text-foreground">“{trimmed}”</span>. Try another name or AMC.
          </div>
        ) : (
          <ul
            role="listbox"
            aria-label="Fund search results"
            className="max-h-72 overflow-y-auto overscroll-contain p-1.5 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/40 [&::-webkit-scrollbar-track]:bg-transparent"
          >
            {schemes.map((scheme, index) => {
              const active = index === activeIndex
              const selected = selectedScheme === scheme
              const favorited = isFavorite?.(scheme) ?? false

              return (
                <li
                  key={scheme}
                  data-index={index}
                  className={cn(
                    'group flex items-stretch gap-0.5 rounded-lg transition-colors duration-150',
                    active && 'bg-accent',
                    selected && !active && 'bg-primary/10',
                  )}
                  onMouseEnter={() => onActiveIndexChange(index)}
                >
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className="min-w-0 flex-1 cursor-pointer rounded-lg px-3 py-2.5 text-left text-sm focus-visible:outline-none"
                    onClick={() => onSelect(scheme)}
                  >
                    <HighlightedText text={scheme} query={trimmed} className="leading-snug text-foreground" />
                  </button>
                  {onToggleFavorite && isFavorite ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="my-1 mr-1 size-8 shrink-0 opacity-70 transition-opacity group-hover:opacity-100"
                      aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
                      onClick={(e) => {
                        e.stopPropagation()
                        onToggleFavorite(scheme)
                      }}
                    >
                      <Star
                        className={cn(
                          'size-4',
                          favorited ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground',
                        )}
                      />
                    </Button>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>,
    document.body,
  )
}
