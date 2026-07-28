import { describe, expect, it } from 'vitest'
import {
  decodeSnapshot,
  getSnapshotPayloadFromLocation,
  hasSnapshotInLocation,
  SNAPSHOT_VERSION,
  type SharedReportSnapshot,
} from './reportSnapshot'

function minimalSnapshot(): SharedReportSnapshot {
  return {
    v: SNAPSHOT_VERSION,
    scheme: 'demo-fund',
    exportedAt: '2026-01-01T00:00:00.000Z',
    overview: {
      scheme: 'demo-fund',
      profile: {
        fundName: 'Demo Fund',
        amc: 'Demo AMC',
        category: 'Flexi Cap',
        benchmarkName: 'Nifty 500',
        planType: null,
        optionType: null,
        launchDate: null,
        fundAgeYears: 10,
        fundManager: null,
        expenseRatio: null,
        exitLoad: null,
        minimumInvestment: null,
        aum: null,
        latestNav: 100,
        riskometer: null,
        sebiRiskCategory: null,
        overallRatingLabel: 'Good',
        overallRatingStars: 4,
        dataFrom: '2015-01-01',
        dataTo: '2026-01-01',
      },
    },
    performance: {} as SharedReportSnapshot['performance'],
    risk: {} as SharedReportSnapshot['risk'],
    investment: {} as SharedReportSnapshot['investment'],
    assessment: {} as SharedReportSnapshot['assessment'],
    peers: null,
  }
}

describe('reportSnapshot location parsing', () => {
  it('reads snapshot payload from hash fragment', () => {
    const location = {
      hash: '#r=abc123',
      search: '',
    }
    expect(getSnapshotPayloadFromLocation(location)).toBe('abc123')
    expect(hasSnapshotInLocation(location)).toBe(true)
  })

  it('reads snapshot payload from query string', () => {
    const location = {
      hash: '',
      search: '?r=abc123',
    }
    expect(getSnapshotPayloadFromLocation(location)).toBe('abc123')
    expect(hasSnapshotInLocation(location)).toBe(true)
  })

  it('prefers hash over query when both are present', () => {
    const location = {
      hash: '#r=from-hash',
      search: '?r=from-query',
    }
    expect(getSnapshotPayloadFromLocation(location)).toBe('from-hash')
  })
})

describe('decodeSnapshot', () => {
  it('decodes uncompressed base64 JSON snapshots', async () => {
    const snapshot = minimalSnapshot()
    const encoded = btoa(JSON.stringify(snapshot))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '')

    const decoded = await decodeSnapshot(encoded)
    expect(decoded?.scheme).toBe('demo-fund')
    expect(decoded?.overview.profile.fundName).toBe('Demo Fund')
  })

  it('decodes raw JSON snapshots', async () => {
    const snapshot = minimalSnapshot()
    const decoded = await decodeSnapshot(JSON.stringify(snapshot))
    expect(decoded?.scheme).toBe('demo-fund')
  })
})
