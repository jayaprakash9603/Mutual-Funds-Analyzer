# Reorganizes crowded frontend/backend folders into subfolders and updates imports.
$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
Set-Location $Root

function Ensure-Dir($path) {
    if (-not (Test-Path $path)) { New-Item -ItemType Directory -Path $path -Force | Out-Null }
}

function Move-File($from, $toDir) {
    if (-not (Test-Path $from)) { return }
    Ensure-Dir $toDir
    $dest = Join-Path $toDir (Split-Path $from -Leaf)
    if ($from -eq $dest) { return }
    $moved = $false
    try {
        git mv $from $dest 2>&1 | Out-Null
        if (Test-Path $dest) { $moved = $true }
    } catch { }
    if (-not $moved) {
        Move-Item -Force $from $dest
    }
}

# --- Frontend: fund-report/components ---
$frComp = "src/features/fund-report/components"
@("charts", "tables", "layout") | ForEach-Object { Ensure-Dir "$frComp/$_" }

@(
    "BearMarketDecadeChart.tsx", "DeclineRecoveryChart.tsx", "HeatMatrix.tsx",
    "AnnualStressInfographicCard.tsx", "ReportVisuals.tsx"
) | ForEach-Object { Move-File "$frComp/$_" "$frComp/charts" }

@(
    "DrawdownEpisodesTable.tsx", "DrawdownThresholdTable.tsx", "FundsIndiaMatrixTable.tsx",
    "MultiplyProbabilityTable.tsx", "PeerComparisonTable.tsx", "RareInstancesMatrixTable.tsx",
    "TrailingReturnsTable.tsx"
) | ForEach-Object { Move-File "$frComp/$_" "$frComp/tables" }

@(
    "SectionShell.tsx", "ReportGroupBoundary.tsx", "ReportSectionNav.tsx",
    "FundReportSections.tsx", "AnnualStressAnalysis.tsx"
) | ForEach-Object { Move-File "$frComp/$_" "$frComp/layout" }

# --- Frontend: fund-report/lib ---
$frLib = "src/features/fund-report/lib"
@("drawdown", "stress", "matrix", "nav") | ForEach-Object { Ensure-Dir "$frLib/$_" }

Move-File "$frLib/declineRecoveryCycles.ts" "$frLib/drawdown"
Move-File "$frLib/declineRecoveryCycles.test.ts" "$frLib/drawdown"
Move-File "$frLib/annualStressAnalysis.ts" "$frLib/stress"
Move-File "$frLib/annualStressAnalysis.test.ts" "$frLib/stress"
Move-File "$frLib/matrixTableUtils.ts" "$frLib/matrix"
Move-File "$frLib/matrixTableUtils.test.ts" "$frLib/matrix"
Move-File "$frLib/multiplyProbability.ts" "$frLib/matrix"
Move-File "$frLib/multiplyProbability.test.ts" "$frLib/matrix"
Move-File "$frLib/reportScroll.ts" "$frLib/nav"
Move-File "$frLib/reportSectionState.ts" "$frLib/nav"
Move-File "$frLib/metricDictionary.ts" "$frLib/nav"

# --- Frontend: dashboard ---
$dash = "src/components/dashboard"
@("cards", "charts", "search", "widgets", "tables") | ForEach-Object { Ensure-Dir "$dash/$_" }

Move-File "$dash/StatCard.tsx" "$dash/cards"
Move-File "$dash/GoldenTriangleResultCard.tsx" "$dash/cards"
Move-File "$dash/PerformanceTimeline.tsx" "$dash/charts"
Move-File "$dash/RiskMeter.tsx" "$dash/charts"
Move-File "$dash/FundSearchDropdown.tsx" "$dash/search"
Move-File "$dash/FundSelector.tsx" "$dash/search"
Move-File "$dash/AnimatedNumber.tsx" "$dash/widgets"
Move-File "$dash/InsightsPanel.tsx" "$dash/widgets"
Move-File "$dash/FundIndexMatrixTable.tsx" "$dash/tables"

# --- Frontend: lib ---
Ensure-Dir "src/lib/charts"
Move-File "src/lib/chartAxes.ts" "src/lib/charts"
Move-File "src/lib/chartColors.ts" "src/lib/charts"
Move-File "src/lib/chartColors.test.ts" "src/lib/charts"

# --- Frontend: demo ---
@("transport", "config") | ForEach-Object { Ensure-Dir "src/demo/$_" }
Move-File "src/demo/demoTransport.ts" "src/demo/transport"
Move-File "src/demo/demoTransport.test.ts" "src/demo/transport"
Move-File "src/demo/demoFilters.ts" "src/demo/transport"
Move-File "src/demo/demoFilters.test.ts" "src/demo/transport"
Move-File "src/demo/demoManifest.ts" "src/demo/config"
Move-File "src/demo/demoMode.ts" "src/demo/config"
Move-File "src/demo/demoMode.test.ts" "src/demo/config"

Write-Host "Frontend file moves complete."
