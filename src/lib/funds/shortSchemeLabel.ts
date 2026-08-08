const AMC_SHORTCUTS: ReadonlyArray<readonly [RegExp, string]> = [
  [/^Aditya Birla Sun Life\b/i, 'ABSL'],
  [/^ICICI Prudential\b/i, 'ICICI Pru'],
  [/^Kotak Mahindra\b/i, 'Kotak'],
  [/^Motilal Oswal\b/i, 'MO'],
  [/^Mirae Asset\b/i, 'Mirae'],
  [/^Nippon India\b/i, 'Nippon'],
  [/^Franklin India\b/i, 'Franklin'],
  [/^Franklin Templeton\b/i, 'Franklin'],
  [/^Canara Robeco\b/i, 'Canara'],
  [/^PGIM India\b/i, 'PGIM'],
  [/^Parag Parikh\b/i, 'Parag Parikh'],
  [/^PPFAS\b/i, 'Parag Parikh'],
  [/^HDFC\b/i, 'HDFC'],
  [/^SBI\b/i, 'SBI'],
  [/^Axis\b/i, 'Axis'],
  [/^UTI\b/i, 'UTI'],
  [/^Tata\b/i, 'Tata'],
  [/^DSP\b/i, 'DSP'],
  [/^Quant\b/i, 'Quant'],
  [/^Invesco\b/i, 'Invesco'],
  [/^Edelweiss\b/i, 'Edelweiss'],
  [/^Bandhan\b/i, 'Bandhan'],
  [/^HSBC\b/i, 'HSBC'],
  [/^Baroda BNP Paribas\b/i, 'Baroda BNP'],
  [/^Mahindra Manulife\b/i, 'Mahindra'],
]

const MAX_COMPACT_LEN = 32

/**
 * Compact mutual-fund labels for narrow sticky table columns.
 * Full name stays available via `title` / aria-label on the cell.
 */
export function shortSchemeLabel(name: string, compact = false): string {
  const trimmed = name.trim()
  if (!compact || !trimmed) return trimmed

  let plan: 'Dir' | 'Reg' | '' = ''
  if (/\bDirect\b/i.test(trimmed)) plan = 'Dir'
  else if (/\bRegular\b/i.test(trimmed)) plan = 'Reg'

  let label = trimmed
    .replace(/\s*[-–]\s*(Direct|Regular)\s*Plan\b/gi, '')
    .replace(/\s*\((Direct|Regular)\s*Plan\)\b/gi, '')
    .replace(/\s*[-–]\s*Growth(\s*Option)?\b/gi, '')
    .replace(/\s+Growth(\s*Option)?\b/gi, '')
    .replace(/\s*[-–]\s*IDCW\b.*/gi, '')
    .replace(/\s*Fund\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()

  for (const [pattern, abbr] of AMC_SHORTCUTS) {
    if (pattern.test(label)) {
      label = label.replace(pattern, abbr)
      break
    }
  }

  label = label.replace(/\s+/g, ' ').trim()
  if (plan) label = `${label} (${plan})`

  if (label.length > MAX_COMPACT_LEN) {
    return `${label.slice(0, MAX_COMPACT_LEN - 1).trimEnd()}…`
  }
  return label
}
