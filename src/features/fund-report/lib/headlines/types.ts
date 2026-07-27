export type HeadlineTone = 'ink' | 'accent' | 'alert'

export type HeadlineSegment = {
  text: string
  tone?: HeadlineTone
  /** Draws a highlighter-pen background behind the phrase. */
  mark?: boolean
}

export type HeadlinePart = string | HeadlineSegment

export type Headline = {
  parts: HeadlinePart[]
  note?: string
  noteTone?: HeadlineTone
}

export function accent(text: string): HeadlineSegment {
  return { text, tone: 'accent' }
}

export function accentMark(text: string): HeadlineSegment {
  return { text, tone: 'accent', mark: true }
}

export function alert(text: string): HeadlineSegment {
  return { text, tone: 'alert' }
}

export function alertMark(text: string): HeadlineSegment {
  return { text, tone: 'alert', mark: true }
}
