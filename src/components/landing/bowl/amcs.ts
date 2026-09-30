/** Fund houses shown as balls. Monograms and colours are stylised, not official logos. */
export type Amc = { id: string; label: string; name: string; color: string; ink: string }

export const AMCS: Amc[] = [
  { id: 'PPFAS', label: 'PPFAS', name: 'PPFAS Mutual Fund', color: '#1f3c88', ink: '#ffffff' },
  { id: 'AXIS', label: 'AXIS', name: 'Axis Mutual Fund', color: '#97144d', ink: '#ffffff' },
  { id: 'ICICI', label: 'ICICI', name: 'ICICI Prudential MF', color: '#b3262d', ink: '#ffd9a8' },
  { id: 'HDFC', label: 'HDFC', name: 'HDFC Mutual Fund', color: '#0b4a8f', ink: '#ffffff' },
  { id: 'MIRAE', label: 'MIRAE', name: 'Mirae Asset MF', color: '#f47b20', ink: '#1a1a1a' },
  { id: 'SBI', label: 'SBI', name: 'SBI Mutual Fund', color: '#2a3f9d', ink: '#ffffff' },
  { id: 'NIPPON', label: 'NIPPON', name: 'Nippon India MF', color: '#e3262f', ink: '#ffffff' },
  { id: 'KOTAK', label: 'KOTAK', name: 'Kotak Mahindra MF', color: '#d71f26', ink: '#ffffff' },
  { id: 'UTI', label: 'UTI', name: 'UTI Mutual Fund', color: '#123a73', ink: '#f8c537' },
  { id: 'ABSL', label: 'ABSL', name: 'Aditya Birla Sun Life MF', color: '#8c1d2f', ink: '#ffd166' },
  { id: 'DSP', label: 'DSP', name: 'DSP Mutual Fund', color: '#1d1d1f', ink: '#ffffff' },
  { id: 'TATA', label: 'TATA', name: 'Tata Mutual Fund', color: '#1f5aa6', ink: '#ffffff' },
  { id: 'QUANT', label: 'QUANT', name: 'quant Mutual Fund', color: '#5b2bb5', ink: '#ffffff' },
  { id: 'MOTILAL', label: 'MOSL', name: 'Motilal Oswal MF', color: '#f5a800', ink: '#1a1a1a' },
  { id: 'CANARA', label: 'CANARA', name: 'Canara Robeco MF', color: '#0096d6', ink: '#ffffff' },
  { id: 'HSBC', label: 'HSBC', name: 'HSBC Mutual Fund', color: '#d6001c', ink: '#ffffff' },
  { id: 'BANDHAN', label: 'BANDHAN', name: 'Bandhan Mutual Fund', color: '#c8102e', ink: '#ffffff' },
  { id: 'EDEL', label: 'EDEL', name: 'Edelweiss MF', color: '#12508a', ink: '#8fd3ff' },
  { id: 'BOI', label: 'BOI', name: 'Bank of India MF', color: '#e8731a', ink: '#1a1a1a' },
  { id: 'FRANKLIN', label: 'FT', name: 'Franklin Templeton MF', color: '#1b4f72', ink: '#ffffff' },
  { id: 'PGIM', label: 'PGIM', name: 'PGIM India MF', color: '#3a3f98', ink: '#ffffff' },
]

export function amcById(id: string) {
  return AMCS.find((amc) => amc.id === id)
}

/** Short on-screen name for a fund: the house monogram plus a tag like "L&M" when a house has two funds. */
export function fundBadge(fund: { amc: string; tag: string }) {
  const label = amcById(fund.amc)?.label ?? fund.amc
  return fund.tag ? `${label} ${fund.tag}` : label
}
