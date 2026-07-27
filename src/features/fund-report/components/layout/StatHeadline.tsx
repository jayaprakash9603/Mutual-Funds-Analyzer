import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { Headline, HeadlinePart, HeadlineSegment, HeadlineTone } from '../../lib/headlines/types'

type StatHeadlineProps = {
  /** Plain strings render in deck ink; segments carry the colour highlights. */
  parts: HeadlinePart[]
  /** Secondary banner under the headline, matching the deck's sub-title strip. */
  note?: ReactNode
  noteTone?: HeadlineTone
  size?: 'md' | 'lg'
  align?: 'left' | 'center'
  className?: string
}

const TONE_TEXT: Record<HeadlineTone, string> = {
  ink: 'text-headline-ink',
  accent: 'text-headline-accent',
  alert: 'text-headline-alert',
}

const TONE_MARK: Record<HeadlineTone, string> = {
  ink: 'bg-[var(--headline-surface)]',
  accent: 'bg-[var(--headline-accent-soft)]',
  alert: 'bg-[var(--headline-alert-soft)]',
}

const TONE_RULE: Record<HeadlineTone, string> = {
  ink: 'border-l-headline-ink',
  accent: 'border-l-headline-accent',
  alert: 'border-l-headline-alert',
}

const SIZE_TEXT: Record<'md' | 'lg', string> = {
  md: 'text-[1.0625rem] sm:text-xl lg:text-[1.375rem]',
  lg: 'text-lg sm:text-2xl lg:text-[1.75rem]',
}

function normalize(part: HeadlinePart): HeadlineSegment {
  return typeof part === 'string' ? { text: part } : part
}

/**
 * Presentation-grade one-liner: a single bold sentence with the key numbers
 * colour-highlighted, sized to be read out in a meeting.
 */
export function StatHeadline({
  parts,
  note,
  noteTone = 'ink',
  size = 'lg',
  align = 'left',
  className,
}: StatHeadlineProps) {
  const segments = parts.map(normalize)
  const leadTone = segments.find((segment) => segment.tone && segment.tone !== 'ink')?.tone ?? 'ink'

  return (
    <div
      className={cn(
        'rounded-xl border border-border/50 border-l-4 bg-[var(--headline-surface)] px-4 py-3.5 sm:px-6 sm:py-5',
        TONE_RULE[leadTone],
        className,
      )}
    >
      <p
        className={cn(
          'font-bold leading-snug tracking-tight text-balance text-headline-ink',
          SIZE_TEXT[size],
          align === 'center' && 'text-center',
        )}
      >
        {segments.map((segment, index) => {
          const tone = segment.tone ?? 'ink'
          if (tone === 'ink' && !segment.mark) {
            return <span key={index}>{segment.text}</span>
          }
          return (
            <span
              key={index}
              className={cn(
                'box-decoration-clone',
                TONE_TEXT[tone],
                segment.mark && cn('rounded px-1', TONE_MARK[tone]),
              )}
            >
              {segment.text}
            </span>
          )
        })}
      </p>

      {note ? (
        <p
          className={cn(
            'mt-3 border-t border-dashed border-[var(--headline-rule)] pt-2.5 text-sm font-semibold leading-relaxed sm:text-base',
            TONE_TEXT[noteTone],
            align === 'center' && 'text-center',
          )}
        >
          {note}
        </p>
      ) : null}
    </div>
  )
}

/** Renders a built headline, or nothing when the data was too thin to phrase one. */
export function SectionHeadline({
  headline,
  size,
  align,
  className,
}: {
  headline: Headline | null
} & Pick<StatHeadlineProps, 'size' | 'align' | 'className'>) {
  if (!headline) return null
  return (
    <StatHeadline
      parts={headline.parts}
      note={headline.note}
      noteTone={headline.noteTone}
      size={size}
      align={align}
      className={className}
    />
  )
}
