package in.goldentriangle.mfa.config.feature;

import java.util.LinkedHashMap;
import java.util.Map;

public final class FeatureFlagResolver {

    private FeatureFlagResolver() {
    }

    /**
     * Unknown keys resolve to enabled so that a flag added to the code before it is added to
     * configuration keeps working. Callers must use {@link FeatureKeys} rather than raw strings.
     */
    public static boolean isEnabled(FeatureFlags featureFlags, String key) {
        return allFlags(featureFlags).getOrDefault(key, true);
    }

    public static Map<String, Boolean> allFlags(FeatureFlags featureFlags) {
        FeatureFlags.AnalysisFeatures analysis = featureFlags.getAnalysis();
        FeatureFlags.UiFeatures ui = featureFlags.getUi();
        FeatureFlags.PlatformFeatures platform = featureFlags.getPlatform();

        Map<String, Boolean> flags = new LinkedHashMap<>();
        flags.put(FeatureKeys.ANALYSIS_ENABLED, analysis.isEnabled());
        flags.put(FeatureKeys.ANALYSIS_COMPARE, analysis.isCompare());
        flags.put(FeatureKeys.ANALYSIS_INSIGHTS, analysis.isInsights());
        flags.put(FeatureKeys.ANALYSIS_TIMELINE, analysis.isTimeline());
        flags.put(FeatureKeys.ANALYSIS_PERSIST_RESULTS, analysis.isPersistResults());
        flags.put(FeatureKeys.ANALYSIS_FUND_INDEX_MATRIX, analysis.isFundIndexMatrix());
        flags.put(FeatureKeys.ANALYSIS_INCREMENTAL_AGGREGATES, analysis.isIncrementalAggregates());
        flags.put(FeatureKeys.ANALYSIS_FUND_REPORT, analysis.isFundReport());
        flags.put(FeatureKeys.ANALYSIS_FUND_REPORT_PROGRESSIVE, analysis.isFundReportProgressive());
        flags.put(FeatureKeys.ANALYSIS_PEER_COMPARISON, analysis.isPeerComparison());
        flags.put(FeatureKeys.UI_LANDING_PAGE, ui.isLandingPage());
        flags.put(FeatureKeys.UI_METHOD_PAGE, ui.isMethodPage());
        flags.put(FeatureKeys.UI_DASHBOARD_PAGE, ui.isDashboardPage());
        flags.put(FeatureKeys.UI_COMPARE_PAGE, ui.isComparePage());
        flags.put(FeatureKeys.UI_COMMAND_PALETTE, ui.isCommandPalette());
        flags.put(FeatureKeys.UI_FAVORITES, ui.isFavorites());
        flags.put(FeatureKeys.UI_RECENT_ANALYSES, ui.isRecentAnalyses());
        flags.put(FeatureKeys.UI_THEME_TOGGLE, ui.isThemeToggle());
        flags.put(FeatureKeys.UI_STAT_CARDS, ui.isStatCards());
        flags.put(FeatureKeys.UI_ROLLING_RETURNS_PANEL, ui.isRollingReturnsPanel());
        flags.put(FeatureKeys.UI_FUND_INDEX_MATRIX_TABLE, ui.isFundIndexMatrixTable());
        flags.put(FeatureKeys.UI_RISK_METER, ui.isRiskMeter());
        flags.put(FeatureKeys.UI_INSIGHTS_PANEL, ui.isInsightsPanel());
        flags.put(FeatureKeys.UI_PERFORMANCE_TIMELINE, ui.isPerformanceTimeline());
        flags.put(FeatureKeys.UI_ADDITIONAL_CHARTS, ui.isAdditionalCharts());
        flags.put(FeatureKeys.UI_EXPORT_PDF, ui.isExportPdf());
        flags.put(FeatureKeys.UI_SHARE, ui.isShare());
        flags.put(FeatureKeys.UI_FUND_REPORT_PAGE, ui.isFundReportPage());
        flags.put(FeatureKeys.PLATFORM_CACHE, platform.getCache().isEnabled());
        flags.put(FeatureKeys.PLATFORM_RATE_LIMIT, platform.getRateLimit().isEnabled());
        flags.put(FeatureKeys.PLATFORM_PERSISTENCE, platform.getPersistence().isEnabled());
        flags.put(FeatureKeys.PLATFORM_OPENAPI, platform.getOpenapi().isEnabled());
        return flags;
    }
}
