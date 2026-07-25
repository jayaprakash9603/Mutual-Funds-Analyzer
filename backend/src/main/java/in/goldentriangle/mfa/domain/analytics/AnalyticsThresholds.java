package in.goldentriangle.mfa.domain.analytics;

/**
 * Thresholds that decide Golden Triangle pass/fail and the wording band of each insight. Kept in one
 * place so a rule and the insight describing it can never drift apart.
 */
public final class AnalyticsThresholds {

    /** A fund must beat its benchmark in more than this percentage of rolling windows. */
    public static final double COB_PASS_PERCENT = 70;

    /** Below the pass mark but at or above this is described as moderate rather than weak. */
    public static final double COB_MODERATE_PERCENT = 50;

    public static final double SHARPE_SUPERIOR_DIFF = 0.15;
    public static final double SHARPE_PARITY_DIFF = -0.15;

    /** Drawdown gaps smaller than this are treated as benchmark-like. */
    public static final double DRAWDOWN_MATERIAL_DIFF_PERCENT = 3;

    public static final double DEFENSIVE_BETA = 0.85;
    public static final double DEFENSIVE_VOL_RATIO = 0.95;
    public static final double AGGRESSIVE_BETA = 1.15;
    public static final double AGGRESSIVE_VOL_RATIO = 1.1;

    /** Funds younger than this get a limited-history caveat. */
    public static final double YOUNG_FUND_YEARS = 5;

    public static final double MARGINAL_RETURN_DIFF_PERCENT = 1;
    public static final double CONSISTENT_RETURN_DIFF_PERCENT = 3;

    /** Consistency score = weighted chance of beating, plus a bonus per metric won outright. */
    public static final double COB_CONSISTENCY_WEIGHT = 0.6;
    public static final double CONSISTENCY_WIN_BONUS = 20;
    public static final double MAX_CONSISTENCY_SCORE = 100;

    private AnalyticsThresholds() {
    }
}
