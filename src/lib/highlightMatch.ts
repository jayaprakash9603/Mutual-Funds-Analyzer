export type HighlightPart = { text: string; match: boolean }

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Split `text` into parts so query tokens can be highlighted (case-insensitive). */
export function highlightMatchParts(text: string, query: string): HighlightPart[] {
  const tokens = [
    ...new Set(
      query
        .trim()
        .split(/\s+/)
        .filter((token) => token.length > 0)
        .map((token) => token.toLowerCase()),
    ),
  ]
  if (tokens.length === 0 || !text) {
    return [{ text, match: false }]
  }

  const pattern = tokens.map(escapeRegExp).join('|')
  const re = new RegExp(`(${pattern})`, 'gi')
  const chunks = text.split(re).filter((chunk) => chunk.length > 0)

  return chunks.map((chunk) => ({
    text: chunk,
    match: tokens.includes(chunk.toLowerCase()),
  }))
}
