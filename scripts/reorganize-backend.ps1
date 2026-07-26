# Reorganizes crowded backend Java packages into subpackages.
$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
Set-Location $Root

$JavaRoot = "backend/src/main/java/in/goldentriangle/mfa"
$TestRoot = "backend/src/test/java/in/goldentriangle/mfa"

function Ensure-Dir($path) {
    if (-not (Test-Path $path)) { New-Item -ItemType Directory -Path $path -Force | Out-Null }
}

function Move-JavaClass($relativeDir, $className, $subPackage) {
    $from = Join-Path (Join-Path $JavaRoot $relativeDir) "$className.java"
    if (-not (Test-Path $from)) { return $null }

    $baseDir = Join-Path $JavaRoot $relativeDir
    $toDir = if ($subPackage) { Join-Path $baseDir ($subPackage -replace '\.', '/') } else { $baseDir }
    Ensure-Dir $toDir
    $to = Join-Path $toDir "$className.java"
    if ($from -eq $to) { return $null }

    Move-Item -Force $from $to

    $dirPath = ($relativeDir -replace '/', '.')
    $oldPackage = "in.goldentriangle.mfa.$dirPath"
    $newPackage = if ($subPackage) { "$oldPackage.$subPackage" } else { $oldPackage }

    $content = Get-Content $to -Raw
    $content = $content -replace "package $([regex]::Escape($oldPackage));", "package $newPackage;"
    Set-Content -Path $to -Value $content -NoNewline

    return @{ OldPackage = $oldPackage; NewPackage = $newPackage; Class = $className }
}

function Apply-ImportUpdates($mappings) {
    $searchRoots = @($JavaRoot, $TestRoot)
    foreach ($root in $searchRoots) {
        if (-not (Test-Path $root)) { continue }
        $files = Get-ChildItem -Path $root -Recurse -Filter *.java -File
        foreach ($file in $files) {
            $content = Get-Content $file.FullName -Raw
            $original = $content
            foreach ($map in $mappings) {
                $oldImport = "import $($map.OldPackage).$($map.Class);"
                $newImport = "import $($map.NewPackage).$($map.Class);"
                $content = $content.Replace($oldImport, $newImport)
            }
            if ($content -ne $original) {
                Set-Content -Path $file.FullName -Value $content -NoNewline
            }
        }
    }
}

$moves = @()

# --- adapter.in.web.dto ---
$dtoDir = "adapter/in/web/dto"
$dtoReport = @(
    "FundReportDto", "DrawdownReportDto", "DrawdownPeersDto", "SipReportDto", "LumpsumReportDto",
    "RollingReturnsReportDto", "MatrixReportDto", "RiskReportDto", "TaxReportDto", "ExpenseReportDto",
    "TrailingReturnsDto", "ConsistencyDto", "BenchmarkComparisonDto", "ProbabilityDto",
    "QualityScoreDto", "ProsConsDto", "RecommendationDto", "InvestorFitDto", "FundProfileDto", "FundMetricsDto"
)
$dtoSection = @(
    "ReportSectionEnvelopeDto", "FundReportOverviewDto", "FundReportPerformanceDto",
    "FundReportRiskDto", "FundReportInvestmentDto", "FundReportAssessmentDto"
)
$dtoCompare = @("CompareRequestDto", "CompareResponseDto", "PeerComparisonDto", "FundIndexComparisonDto", "PeriodComparisonRowDto", "AnalysisResponseDto")
$dtoRolling = @("RollingReturnsResponseDto", "RollingReturnRowDto", "SeriesStatsDto")
$dtoCommon = @("HealthResponseDto", "FeatureFlagsResponseDto", "FundSchemeDto", "TimelineEventDto", "GoldenTriangleResultDto", "RuleResultDto")

foreach ($c in $dtoReport) { $moves += Move-JavaClass $dtoDir $c "report" }
foreach ($c in $dtoSection) { $moves += Move-JavaClass $dtoDir $c "section" }
foreach ($c in $dtoCompare) { $moves += Move-JavaClass $dtoDir $c "compare" }
foreach ($c in $dtoRolling) { $moves += Move-JavaClass $dtoDir $c "rolling" }
foreach ($c in $dtoCommon) { $moves += Move-JavaClass $dtoDir $c "common" }

# --- application ---
$appDir = "application"
$appReport = @(
    "FundReportService", "FundReportSectionService", "FundReportSectionExtractor", "ReportDataCoordinator",
    "DrawdownPeersService", "FundIndexComparisonService", "FundRollingReturnsAssembler"
)
$appCompare = @("CompareFundsService", "PeerComparisonService", "PeerDiscoveryService")
$appCatalog = @("SearchFundsService", "SearchSchemesService", "AnalyseFundService", "GetRollingReturnsService")
$appPlatform = @("FeatureFlagService", "FeatureGuard")

foreach ($c in $appReport) { $moves += Move-JavaClass $appDir $c "report" }
foreach ($c in $appCompare) { $moves += Move-JavaClass $appDir $c "compare" }
foreach ($c in $appCatalog) { $moves += Move-JavaClass $appDir $c "catalog" }
foreach ($c in $appPlatform) { $moves += Move-JavaClass $appDir $c "platform" }

# --- domain.model.report ---
$reportDir = "domain/model/report"
$reportSection = @(
    "FundReportOverviewSection", "FundReportPerformanceSection", "FundReportRiskSection",
    "FundReportInvestmentSection", "FundReportAssessmentSection"
)
$reportMatrix = @("MatrixReport", "MatrixReportBundle", "MatrixRecoveryAnalysis", "MatrixMode", "ReturnBand")
$reportDrawdown = @("DrawdownReport", "DrawdownPeersReport")
$reportReturns = @("RollingReturnsReport", "TrailingReturnsReport", "BenchmarkComparisonReport", "ConsistencyReport")
$reportInvestment = @("SipReport", "LumpsumReport", "TaxReport", "ExpenseReport")
$reportAssessment = @("QualityScoreReport", "ProsConsReport", "RecommendationReport", "InvestorFitReport", "RiskReport", "ProbabilityReport")

foreach ($c in $reportSection) { $moves += Move-JavaClass $reportDir $c "section" }
foreach ($c in $reportMatrix) { $moves += Move-JavaClass $reportDir $c "matrix" }
foreach ($c in $reportDrawdown) { $moves += Move-JavaClass $reportDir $c "drawdown" }
foreach ($c in $reportReturns) { $moves += Move-JavaClass $reportDir $c "returns" }
foreach ($c in $reportInvestment) { $moves += Move-JavaClass $reportDir $c "investment" }
foreach ($c in $reportAssessment) { $moves += Move-JavaClass $reportDir $c "assessment" }

# --- adapter.out.persistence root ---
$persDir = "adapter/out/persistence"
$persMappers = @("FundReportSnapshotMapper", "FundReportSectionSnapshotMapper", "MatrixSnapshotMapper", "NavStoreMapper", "RollingAggregateMapper")
$persRecords = @("FundReportSnapshotRecord", "FundReportSectionSnapshotRecord", "MatrixSnapshotRecord", "RollingAggregateRecord")
$persFailsoft = @("FailSoftFundReportSnapshotStore", "FailSoftFundReportSectionSnapshotStore", "FailSoftMatrixSnapshotStore", "FailSoftNavStore", "FailSoftRollingAggregateStore")

foreach ($c in $persMappers) { $moves += Move-JavaClass $persDir $c "mapper" }
foreach ($c in $persRecords) { $moves += Move-JavaClass $persDir $c "record" }
foreach ($c in $persFailsoft) { $moves += Move-JavaClass $persDir $c "failsoft" }

# --- adapter.out.persistence.jpa ---
$jpaDir = "adapter/out/persistence/jpa"
$jpaNav = @("NavPointEntity", "NavSeriesMetaEntity", "NavPointJpaRepository", "NavSeriesMetaJpaRepository", "JpaNavStore")
$jpaFundReport = @("FundReportSnapshotEntity", "FundReportSnapshotJpaRepository", "JpaFundReportSnapshotStore", "FundReportSectionSnapshotEntity", "FundReportSectionSnapshotJpaRepository", "JpaFundReportSectionSnapshotStore")
$jpaMatrix = @("MatrixSnapshotEntity", "MatrixSnapshotJpaRepository", "JpaMatrixSnapshotStore")
$jpaRolling = @("RollingAggregateEntity", "RollingAggregateJpaRepository", "JpaRollingAggregateStore")
$jpaAnalysis = @("AnalysisEntity", "AnalysisJpaRepository", "JpaAnalysisRepository")

foreach ($c in $jpaNav) { $moves += Move-JavaClass $jpaDir $c "nav" }
foreach ($c in $jpaFundReport) { $moves += Move-JavaClass $jpaDir $c "fundreport" }
foreach ($c in $jpaMatrix) { $moves += Move-JavaClass $jpaDir $c "matrix" }
foreach ($c in $jpaRolling) { $moves += Move-JavaClass $jpaDir $c "rolling" }
foreach ($c in $jpaAnalysis) { $moves += Move-JavaClass $jpaDir $c "analysis" }

# --- domain.analytics.report ---
$analyticsDir = "domain/analytics/report"
$calcDrawdown = @("DrawdownCalculator")
$calcSip = @("SipCalculator", "LumpsumCalculator", "Xirr")
$calcMatrix = @("MatrixCalculator", "MatrixRecoveryAnalyzer", "ReturnBandClassifier", "RollingBandCalculator", "ProbabilityCalculator")
$calcTax = @("TaxCalculator", "ExpenseCalculator")
$calcReturns = @("TrailingReturnsCalculator", "CalendarMath")
$calcCore = @("FundReportEngine", "NavHistoryAssembler", "NavLookup", "QualityScoreCalculator", "RiskReportBuilder", "VerdictEngine")

foreach ($c in $calcDrawdown) { $moves += Move-JavaClass $analyticsDir $c "drawdown" }
foreach ($c in $calcSip) { $moves += Move-JavaClass $analyticsDir $c "sip" }
foreach ($c in $calcMatrix) { $moves += Move-JavaClass $analyticsDir $c "matrix" }
foreach ($c in $calcTax) { $moves += Move-JavaClass $analyticsDir $c "tax" }
foreach ($c in $calcReturns) { $moves += Move-JavaClass $analyticsDir $c "returns" }
foreach ($c in $calcCore) { $moves += Move-JavaClass $analyticsDir $c "core" }

# --- config ---
$configDir = "config"
$configFeature = @("FeatureFlags", "FeatureKeys", "FeatureFlagResolver", "ConditionalOnFeature", "OnFeatureCondition")
$configProperties = @("AnalyticsProperties", "MfApiProperties", "ReportProperties", "UpstreamProperties")
$configPersistence = @("JpaPersistenceConfig", "MongoPersistenceConfig")
$configConcurrency = @("MatrixExecutorConfig")

foreach ($c in $configFeature) { $moves += Move-JavaClass $configDir $c "feature" }
foreach ($c in $configProperties) { $moves += Move-JavaClass $configDir $c "properties" }
foreach ($c in $configPersistence) { $moves += Move-JavaClass $configDir $c "persistence" }
foreach ($c in $configConcurrency) { $moves += Move-JavaClass $configDir $c "concurrency" }

$validMoves = $moves | Where-Object { $_ -ne $null }
Apply-ImportUpdates $validMoves

Write-Host "Backend reorganization complete. Moved $($validMoves.Count) classes."
