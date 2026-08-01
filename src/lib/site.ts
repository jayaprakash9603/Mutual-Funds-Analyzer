/** Site-wide metadata used for SEO, legal pages, and structured data. */

export const SITE = {
  name: 'Analyzer',
  tagline: 'Presentation-grade mutual fund research for India',
  description:
    'Analyzer scores Indian mutual funds with rolling returns, Chance of Beating (COB), and Sharpe Ratio versus the benchmark — plus drawdowns, SIP matrices, peers, and meeting-ready insights.',
  origin: 'https://analyzer.quickcalci.com',
  locale: 'en_IN',
  keywords: [
    'mutual fund analyzer',
    'Indian mutual funds',
    'rolling returns',
    'Golden Triangle',
    'SIP calculator',
    'fund comparison',
    'Sharpe ratio',
    'Chance of Beating benchmark',
    'mutual fund report',
  ],
} as const

export const LEGAL_ROUTES = {
  disclaimer: '/disclaimer',
  privacy: '/privacy',
  terms: '/terms',
  sources: '/sources',
  guidelines: '/guidelines',
} as const
