import { highlightMatchParts } from '@/lib/highlightMatch'
import { cn } from '@/lib/utils'

interface HighlightedTextProps {
  text: string
  query: string
  className?: string
  /** Brighter match tone when the parent list row is keyboard-selected. */
  selected?: boolean
}

export function HighlightedText({ text, query, className, selected = false }: HighlightedTextProps) {
  const parts = highlightMatchParts(text, query)

  return (
    <span className={cn('break-words', className)}>
      {parts.map((part, index) =>
        part.match ? (
          <span
            key={`${part.text}-${index}`}
            className={cn('font-inherit text-primary', selected && 'font-semibold')}
          >
            {part.text}
          </span>
        ) : (
          <span key={`${part.text}-${index}`}>{part.text}</span>
        ),
      )}
    </span>
  )
}
