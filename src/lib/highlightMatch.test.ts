import { describe, expect, it } from 'vitest'
import { highlightMatchParts } from '@/lib/highlightMatch'

describe('highlightMatchParts', () => {
  it('returns plain text when query is empty', () => {
    expect(highlightMatchParts('Parag Parikh Flexi Cap', '')).toEqual([
      { text: 'Parag Parikh Flexi Cap', match: false },
    ])
  })

  it('highlights a case-insensitive substring', () => {
    expect(highlightMatchParts('Parag Parikh Flexi Cap Fund', 'parag')).toEqual([
      { text: 'Parag', match: true },
      { text: ' Parikh Flexi Cap Fund', match: false },
    ])
  })

  it('highlights multiple tokens', () => {
    const parts = highlightMatchParts('Parag Parikh Flexi Cap', 'parag flexi')
    expect(parts.filter((p) => p.match).map((p) => p.text.toLowerCase())).toEqual([
      'parag',
      'flexi',
    ])
  })
})
