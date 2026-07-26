import { describe, expect, it } from 'vitest'
import {
  buildSubsetSummaryRows,
  computeColumnMinimums,
  findContiguousLabelRanges,
  isColumnMinimum,
  trimMatrixToCalculatedValues,
} from './matrixTableUtils'

describe('matrixTableUtils', () => {
  const rows = [
    {
      startLabel: 'Oct-07',
      cells: [
        { holdingYears: 7, value: 8, band: 'WEAK' },
        { holdingYears: 8, value: 4, band: 'NEGATIVE' },
      ],
    },
    {
      startLabel: 'Nov-07',
      cells: [
        { holdingYears: 7, value: 9, band: 'WEAK' },
        { holdingYears: 8, value: 5, band: 'NEGATIVE' },
      ],
    },
    {
      startLabel: 'Jan-10',
      cells: [
        { holdingYears: 7, value: 12, band: 'STRONG' },
        { holdingYears: 8, value: 11, band: 'STRONG' },
      ],
    },
  ]

  it('finds column minimums for orange highlighting', () => {
    expect(computeColumnMinimums(rows, 2)).toEqual([8, 4])
    expect(isColumnMinimum(4, 4)).toBe(true)
    expect(isColumnMinimum(5, 4)).toBe(false)
  })

  it('builds subset summary rows', () => {
    const summary = buildSubsetSummaryRows(rows, [7, 8], 'LUMPSUM')
    expect(summary.map((row) => row.label)).toEqual(['Average', 'Max', 'Min'])
    expect(summary[2]?.values).toEqual([8, 4])
  })

  it('groups contiguous dashed highlight ranges', () => {
    const ranges = findContiguousLabelRanges(['Oct-07', 'Nov-07'], ['Sep-07', 'Oct-07', 'Nov-07', 'Dec-07'])
    expect(ranges).toEqual([{ start: 1, end: 2 }])
  })

  it('trims empty matrix rows and columns', () => {
    const trimmed = trimMatrixToCalculatedValues({
      mode: 'LUMPSUM',
      startLabels: ['Jan-20', 'Jan-21', 'Jan-26'],
      holdingYears: [1, 2, 3],
      summaryRows: [
        { label: 'Average', values: [null, 20, null] },
        { label: 'Max', values: [null, 25, null] },
        { label: 'Min', values: [null, 15, null] },
      ],
      dataRows: [
        {
          startLabel: 'Jan-20',
          cells: [
            { holdingYears: 1, value: null, band: null },
            { holdingYears: 2, value: null, band: null },
            { holdingYears: 3, value: null, band: null },
          ],
        },
        {
          startLabel: 'Jan-21',
          cells: [
            { holdingYears: 1, value: 25, band: 'STRONG' },
            { holdingYears: 2, value: 20, band: 'GOOD' },
            { holdingYears: 3, value: null, band: null },
          ],
        },
        {
          startLabel: 'Jan-26',
          cells: [
            { holdingYears: 1, value: null, band: null },
            { holdingYears: 2, value: null, band: null },
            { holdingYears: 3, value: null, band: null },
          ],
        },
      ],
    })

    expect(trimmed.holdingYears).toEqual([1, 2])
    expect(trimmed.dataRows.map((row) => row.startLabel)).toEqual(['Jan-21'])
    expect(trimmed.summaryRows[0]?.values).toEqual([25, 20])
  })
})
