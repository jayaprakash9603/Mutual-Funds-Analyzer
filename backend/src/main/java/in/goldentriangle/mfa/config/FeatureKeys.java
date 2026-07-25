package in.goldentriangle.mfa.config;

/**
 * Canonical feature flag keys. Declared as constants because they are referenced from annotation
 * attributes, from the flag map exposed to the frontend, and from the guards inside services.
 */
public final class FeatureKeys {

    public static final String ANALYSIS_ENABLED = "analysis.enabled";
    public static final String ANALYSIS_COMPARE = "analysis.compare";
    public static final String ANALYSIS_INSIGHTS = "analysis.insights";
    public static final String ANALYSIS_TIMELINE = "analysis.timeline";
    public static final String ANALYSIS_PERSIST_RESULTS = "analysis.persistResults";
    public static final String ANALYSIS_FUND_INDEX_MATRIX = "analysis.fundIndexMatrix";
    public static final String ANALYSIS_INCREMENTAL_AGGREGATES = "analysis.incrementalAggregates";
    public static final String ANALYSIS_FUND_REPORT = "analysis.fundReport";
    public static final String ANALYSIS_PEER_COMPARISON = "analysis.peerComparison";

    public static final String UI_LANDING_PAGE = "ui.landingPage";
    public static final String UI_METHOD_PAGE = "ui.methodPage";
    public static final String UI_COMPARE_PAGE = "ui.comparePage";
    public static final String UI_COMMAND_PALETTE = "ui.commandPalette";
    public static final String UI_FAVORITES = "ui.favorites";
    public static final String UI_RECENT_ANALYSES = "ui.recentAnalyses";
    public static final String UI_THEME_TOGGLE = "ui.themeToggle";
    public static final String UI_STAT_CARDS = "ui.statCards";
    public static final String UI_ROLLING_RETURNS_PANEL = "ui.rollingReturnsPanel";
    public static final String UI_FUND_INDEX_MATRIX_TABLE = "ui.fundIndexMatrixTable";
    public static final String UI_RISK_METER = "ui.riskMeter";
    public static final String UI_INSIGHTS_PANEL = "ui.insightsPanel";
    public static final String UI_PERFORMANCE_TIMELINE = "ui.performanceTimeline";
    public static final String UI_ADDITIONAL_CHARTS = "ui.additionalCharts";
    public static final String UI_EXPORT_PDF = "ui.exportPdf";
    public static final String UI_SHARE = "ui.share";
    public static final String UI_FUND_REPORT_PAGE = "ui.fundReportPage";

    public static final String PLATFORM_CACHE = "platform.cache.enabled";
    public static final String PLATFORM_RATE_LIMIT = "platform.rateLimit.enabled";
    public static final String PLATFORM_PERSISTENCE = "platform.persistence.enabled";
    public static final String PLATFORM_OPENAPI = "platform.openapi.enabled";

    private FeatureKeys() {
    }
}
