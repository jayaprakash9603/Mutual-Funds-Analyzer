import type { GoldenTriangleResult } from '@/lib/analytics/types'

export async function exportAnalysisPdf(result: GoldenTriangleResult, insights: string[]) {
  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF()
  doc.setFontSize(18)
  doc.text('Analyzer — Fund Analysis Report', 20, 20)
  doc.setFontSize(12)
  doc.text(`Fund: ${result.fundName}`, 20, 35)
  doc.text(`Benchmark: ${result.benchmarkName}`, 20, 45)
  doc.text(`Score: ${result.passCount}/3 — ${result.overallRating}`, 20, 55)
  doc.text(`COB: ${result.metrics.cob.toFixed(1)}%`, 20, 65)
  doc.text(`Sharpe: ${result.metrics.fundSharpe.toFixed(2)} vs ${result.metrics.benchmarkSharpe.toFixed(2)}`, 20, 75)

  let y = 90
  doc.text('Insights:', 20, y)
  y += 10
  for (const insight of insights) {
    const lines = doc.splitTextToSize(insight, 170)
    doc.text(lines, 20, y)
    y += lines.length * 7 + 4
  }

  doc.save(`${result.fundName.slice(0, 30).replace(/[^a-z0-9]/gi, '_')}_analysis.pdf`)
}

export async function shareAnalysis(result: GoldenTriangleResult) {
  const url = `${window.location.origin}/dashboard?scheme=${encodeURIComponent(result.fundName)}`
  const text = `Analyzer: ${result.fundName} — ${result.passCount}/3 ${result.overallRating}`

  if (navigator.share) {
    await navigator.share({ title: 'Analyzer', text, url })
    return
  }

  await navigator.clipboard.writeText(`${text}\n${url}`)
}
