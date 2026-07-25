import { highlightMatchParts } from '@/lib/highlightMatch'
import { cn } from '@/lib/utils'

interface HighlightedTextProps {
  text: string
  query: string
  className?: string
}

export function HighlightedText({ text, query, className }: HighlightedTextProps) {
  const parts = highlightMatchParts(text, query)

  return (
    <span className={cn('break-words', className)}>
      {parts.map((part, index) =>
        part.match ? (
          <mark
            key={`${part.text}-${index}`}
            className="rounded-sm bg-primary/30 px-0.5 font-semibold text-foreground underline decoration-primary/50 decoration-2 underline-offset-2 dark:bg-primary/40"
          >
            {part.text}
          </mark>
        ) : (
          <span key={`${part.text}-${index}`}>{part.text}</span>
        ),
      )}
    </span>
  )
}
