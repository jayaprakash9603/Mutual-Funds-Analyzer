import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { TimelineEvent } from '@/lib/analytics/types'

interface PerformanceTimelineProps {
  events: TimelineEvent[]
  variant?: 'card' | 'embedded'
}

const STAGGER_SECONDS = 0.08

function eventKey(event: TimelineEvent, index: number) {
  return `${index}-${event.title}`
}

function TimelineContent({ events }: { events: TimelineEvent[] }) {
  return (
    <>
      <ol className="relative hidden gap-0 lg:grid lg:grid-cols-5">
        <div
          className="absolute left-[10%] right-[10%] top-5 h-0.5 bg-border"
          aria-hidden="true"
        />
        {events.map((event, i) => (
          <motion.li
            key={eventKey(event, i)}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * STAGGER_SECONDS }}
            className="relative flex flex-col items-center px-2 text-center"
          >
            <span className="relative z-10 mb-3 flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary bg-background text-xs font-bold text-primary">
              {i + 1}
            </span>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              {event.date}
            </p>
            <p className="mt-1 text-sm font-medium leading-snug">{event.title}</p>
            <p className="mt-1 text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              {event.value}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {event.explanation}
            </p>
          </motion.li>
        ))}
      </ol>

      <ol className="relative space-y-6 border-l border-border pl-6 lg:hidden">
        {events.map((event, i) => (
          <motion.li
            key={eventKey(event, i)}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * STAGGER_SECONDS }}
            className="relative"
          >
            <span className="absolute -left-[1.65rem] top-1 h-3 w-3 rounded-full border-2 border-primary bg-background" />
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              {event.date}
            </p>
            <p className="mt-1 font-medium">{event.title}</p>
            <p className="mt-0.5 text-base font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              {event.value}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{event.explanation}</p>
          </motion.li>
        ))}
      </ol>
    </>
  )
}

export function PerformanceTimeline({ events, variant = 'card' }: PerformanceTimelineProps) {
  if (!events.length) return null

  if (variant === 'embedded') {
    return <TimelineContent events={events} />
  }

  return (
    <Card className="glass overflow-hidden">
      <CardHeader>
        <CardTitle>Performance Timeline</CardTitle>
        <p className="text-sm text-muted-foreground">
          Key milestones across the fund&apos;s rolling return history
        </p>
      </CardHeader>
      <CardContent>
        <TimelineContent events={events} />
      </CardContent>
    </Card>
  )
}
