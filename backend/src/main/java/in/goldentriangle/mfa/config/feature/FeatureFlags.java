package in.goldentriangle.mfa.config.feature;

import in.goldentriangle.mfa.domain.model.report.FundReport;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

@ConfigurationProperties(prefix = "features")
public class FeatureFlags {

    private AnalysisFeatures analysis = new AnalysisFeatures();
    private UiFeatures ui = new UiFeatures();
    private PlatformFeatures platform = new PlatformFeatures();

    public AnalysisFeatures getAnalysis() {
        return analysis;
    }

    public void setAnalysis(AnalysisFeatures analysis) {
        this.analysis = analysis;
    }

    public UiFeatures getUi() {
        return ui;
    }

    public void setUi(UiFeatures ui) {
        this.ui = ui;
    }

    public PlatformFeatures getPlatform() {
        return platform;
    }

    public void setPlatform(PlatformFeatures platform) {
        this.platform = platform;
    }

    public static class AnalysisFeatures {
        private boolean enabled = true;
        private boolean compare = true;
        private boolean insights = true;
        private boolean timeline = true;
        private boolean persistResults = false;
        private boolean fundIndexMatrix = true;
        private boolean incrementalAggregates = true;
        private boolean incrementalMatrixSnapshots = true;
        private boolean persistFundReport = true;
        private boolean fundReport = true;
        private boolean fundReportProgressive = true;
        private boolean peerComparison = true;

        public boolean isEnabled() { return enabled; }
        public void setEnabled(boolean enabled) { this.enabled = enabled; }
        public boolean isCompare() { return compare; }
        public void setCompare(boolean compare) { this.compare = compare; }
        public boolean isInsights() { return insights; }
        public void setInsights(boolean insights) { this.insights = insights; }
        public boolean isTimeline() { return timeline; }
        public void setTimeline(boolean timeline) { this.timeline = timeline; }
        public boolean isPersistResults() { return persistResults; }
        public void setPersistResults(boolean persistResults) { this.persistResults = persistResults; }
        public boolean isFundIndexMatrix() { return fundIndexMatrix; }
        public void setFundIndexMatrix(boolean fundIndexMatrix) { this.fundIndexMatrix = fundIndexMatrix; }
        public boolean isIncrementalAggregates() { return incrementalAggregates; }
        public void setIncrementalAggregates(boolean incrementalAggregates) { this.incrementalAggregates = incrementalAggregates; }
        public boolean isIncrementalMatrixSnapshots() { return incrementalMatrixSnapshots; }
        public void setIncrementalMatrixSnapshots(boolean incrementalMatrixSnapshots) {
            this.incrementalMatrixSnapshots = incrementalMatrixSnapshots;
        }
        public boolean isPersistFundReport() { return persistFundReport; }
        public void setPersistFundReport(boolean persistFundReport) { this.persistFundReport = persistFundReport; }
        public boolean isFundReport() { return fundReport; }
        public void setFundReport(boolean fundReport) { this.fundReport = fundReport; }
        public boolean isFundReportProgressive() { return fundReportProgressive; }
        public void setFundReportProgressive(boolean fundReportProgressive) {
            this.fundReportProgressive = fundReportProgressive;
        }
        public boolean isPeerComparison() { return peerComparison; }
        public void setPeerComparison(boolean peerComparison) { this.peerComparison = peerComparison; }
    }

    public static class UiFeatures {
        private boolean landingPage = true;
        private boolean methodPage = true;
        /** Analyze and Compare are dormant; the fund report is the only analysis surface. */
        private boolean dashboardPage = false;
        private boolean comparePage = false;
        private boolean commandPalette = true;
        private boolean favorites = true;
        private boolean recentAnalyses = true;
        private boolean themeToggle = true;
        private boolean statCards = true;
        private boolean rollingReturnsPanel = true;
        private boolean fundIndexMatrixTable = true;
        private boolean riskMeter = true;
        private boolean insightsPanel = true;
        private boolean performanceTimeline = true;
        private boolean additionalCharts = true;
        private boolean exportPdf = true;
        private boolean share = true;
        private boolean fundReportPage = true;

        public boolean isLandingPage() { return landingPage; }
        public void setLandingPage(boolean landingPage) { this.landingPage = landingPage; }
        public boolean isMethodPage() { return methodPage; }
        public void setMethodPage(boolean methodPage) { this.methodPage = methodPage; }
        public boolean isDashboardPage() { return dashboardPage; }
        public void setDashboardPage(boolean dashboardPage) { this.dashboardPage = dashboardPage; }
        public boolean isComparePage() { return comparePage; }
        public void setComparePage(boolean comparePage) { this.comparePage = comparePage; }
        public boolean isCommandPalette() { return commandPalette; }
        public void setCommandPalette(boolean commandPalette) { this.commandPalette = commandPalette; }
        public boolean isFavorites() { return favorites; }
        public void setFavorites(boolean favorites) { this.favorites = favorites; }
        public boolean isRecentAnalyses() { return recentAnalyses; }
        public void setRecentAnalyses(boolean recentAnalyses) { this.recentAnalyses = recentAnalyses; }
        public boolean isThemeToggle() { return themeToggle; }
        public void setThemeToggle(boolean themeToggle) { this.themeToggle = themeToggle; }
        public boolean isStatCards() { return statCards; }
        public void setStatCards(boolean statCards) { this.statCards = statCards; }
        public boolean isRollingReturnsPanel() { return rollingReturnsPanel; }
        public void setRollingReturnsPanel(boolean rollingReturnsPanel) { this.rollingReturnsPanel = rollingReturnsPanel; }
        public boolean isFundIndexMatrixTable() { return fundIndexMatrixTable; }
        public void setFundIndexMatrixTable(boolean fundIndexMatrixTable) { this.fundIndexMatrixTable = fundIndexMatrixTable; }
        public boolean isRiskMeter() { return riskMeter; }
        public void setRiskMeter(boolean riskMeter) { this.riskMeter = riskMeter; }
        public boolean isInsightsPanel() { return insightsPanel; }
        public void setInsightsPanel(boolean insightsPanel) { this.insightsPanel = insightsPanel; }
        public boolean isPerformanceTimeline() { return performanceTimeline; }
        public void setPerformanceTimeline(boolean performanceTimeline) { this.performanceTimeline = performanceTimeline; }
        public boolean isAdditionalCharts() { return additionalCharts; }
        public void setAdditionalCharts(boolean additionalCharts) { this.additionalCharts = additionalCharts; }
        public boolean isExportPdf() { return exportPdf; }
        public void setExportPdf(boolean exportPdf) { this.exportPdf = exportPdf; }
        public boolean isShare() { return share; }
        public void setShare(boolean share) { this.share = share; }
        public boolean isFundReportPage() { return fundReportPage; }
        public void setFundReportPage(boolean fundReportPage) { this.fundReportPage = fundReportPage; }
    }

    public static class PlatformFeatures {
        private CacheFeatures cache = new CacheFeatures();
        private RateLimitFeatures rateLimit = new RateLimitFeatures();
        private PersistenceFeatures persistence = new PersistenceFeatures();
        private OpenApiFeatures openapi = new OpenApiFeatures();

        public CacheFeatures getCache() { return cache; }
        public void setCache(CacheFeatures cache) { this.cache = cache; }
        public RateLimitFeatures getRateLimit() { return rateLimit; }
        public void setRateLimit(RateLimitFeatures rateLimit) { this.rateLimit = rateLimit; }
        public PersistenceFeatures getPersistence() { return persistence; }
        public void setPersistence(PersistenceFeatures persistence) { this.persistence = persistence; }
        public OpenApiFeatures getOpenapi() { return openapi; }
        public void setOpenapi(OpenApiFeatures openapi) { this.openapi = openapi; }
    }

    public static class CacheFeatures {
        private static final int DEFAULT_MAX_SIZE = 10_000;
        private static final long DEFAULT_MAX_WEIGHT_MB = 512;

        private boolean enabled = true;
        private Duration ttl = Duration.ofHours(1);
        private long maxSize = DEFAULT_MAX_SIZE;
        private long maxWeightMb = DEFAULT_MAX_WEIGHT_MB;
        public boolean isEnabled() { return enabled; }
        public void setEnabled(boolean enabled) { this.enabled = enabled; }
        public Duration getTtl() { return ttl; }
        public void setTtl(Duration ttl) { this.ttl = ttl; }
        public long getMaxSize() { return maxSize; }
        public void setMaxSize(long maxSize) { this.maxSize = maxSize; }
        public long getMaxWeightMb() { return maxWeightMb; }
        public void setMaxWeightMb(long maxWeightMb) { this.maxWeightMb = maxWeightMb; }
    }

    public static class RateLimitFeatures {
        private static final int DEFAULT_PER_MINUTE = 60;

        private boolean enabled = false;
        private int perMinute = DEFAULT_PER_MINUTE;
        public boolean isEnabled() { return enabled; }
        public void setEnabled(boolean enabled) { this.enabled = enabled; }
        public int getPerMinute() { return perMinute; }
        public void setPerMinute(int perMinute) { this.perMinute = perMinute; }
    }

    public static class PersistenceFeatures {
        private boolean enabled = false;
        private String type = "none";
        public boolean isEnabled() { return enabled; }
        public void setEnabled(boolean enabled) { this.enabled = enabled; }
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
    }

    public static class OpenApiFeatures {
        private boolean enabled = true;
        public boolean isEnabled() { return enabled; }
        public void setEnabled(boolean enabled) { this.enabled = enabled; }
    }
}
