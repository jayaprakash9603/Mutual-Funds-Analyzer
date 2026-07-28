package in.goldentriangle.mfa.domain.analytics.report.sip;

import in.goldentriangle.mfa.domain.analytics.report.returns.CalendarMath;
import in.goldentriangle.mfa.domain.analytics.report.tax.TaxCalculator;
import in.goldentriangle.mfa.domain.model.NavPoint;
import in.goldentriangle.mfa.domain.model.report.NavHistory;
import in.goldentriangle.mfa.domain.model.report.investment.SipTimelinePoint;
import in.goldentriangle.mfa.domain.model.report.investment.StepUpMode;
import in.goldentriangle.mfa.domain.model.report.investment.StepUpSipConfig;
import in.goldentriangle.mfa.domain.model.report.investment.StepUpSipReport;
import in.goldentriangle.mfa.domain.model.report.investment.StepUpSipSimulation;

import java.util.List;

public class StepUpSipCalculator {

    private static final List<Integer> INITIAL_AMOUNTS = List.of(500, 1_000, 5_000, 10_000, 25_000);

    private final TaxCalculator taxCalculator;

    public StepUpSipCalculator(TaxCalculator taxCalculator) {
        this.taxCalculator = taxCalculator;
    }

    public StepUpSipReport compute(NavHistory history) {
        return compute(history, StepUpSipConfig.defaultConfig());
    }

    public StepUpSipReport compute(NavHistory history, StepUpSipConfig config) {
        StepUpSipConfig resolved = normalize(config);
        List<NavPoint> nav = history.fundNav();
        if (nav.size() < 2) {
            return emptyReport(resolved);
        }

        NavPoint end = nav.get(nav.size() - 1);
        List<SipInstalment> schedule = SipScheduleBuilder.build(nav, end.date(), resolved.scheduleDay());
        if (schedule.isEmpty()) {
            return emptyReport(resolved);
        }

        double years = CalendarMath.yearsBetweenMillis(
                schedule.get(0).date().toEpochMilli(), end.date().toEpochMilli());

        List<StepUpSipReport.StepUpSipScenario> scenarios = INITIAL_AMOUNTS.parallelStream()
                .map(amount -> buildScenario(withInitialAmount(resolved, amount), schedule, nav, end, years).scenario())
                .toList();

        ScenarioResult chart = buildScenario(resolved, schedule, nav, end, years);
        return new StepUpSipReport(
                resolved.scheduleDay(),
                resolved.initialAmount(),
                resolved.mode(),
                resolved.stepUpPercent(),
                resolved.stepUpAmount(),
                chart.timeline(),
                scenarios);
    }

    public StepUpSipSimulation simulate(NavHistory history, StepUpSipConfig config) {
        StepUpSipConfig resolved = normalize(config);
        List<NavPoint> nav = history.fundNav();
        if (nav.size() < 2) {
            return new StepUpSipSimulation(emptyScenario(resolved), List.of());
        }

        NavPoint end = nav.get(nav.size() - 1);
        List<SipInstalment> schedule = SipScheduleBuilder.build(nav, end.date(), resolved.scheduleDay());
        if (schedule.isEmpty()) {
            return new StepUpSipSimulation(emptyScenario(resolved), List.of());
        }

        double years = CalendarMath.yearsBetweenMillis(
                schedule.get(0).date().toEpochMilli(), end.date().toEpochMilli());
        ScenarioResult result = buildScenario(resolved, schedule, nav, end, years);
        return new StepUpSipSimulation(result.scenario(), result.timeline());
    }

    public static StepUpSipConfig normalize(StepUpSipConfig config) {
        int initialAmount = Math.max(1, config.initialAmount());
        int scheduleDay = SipCalculator.clampScheduleDay(config.scheduleDay());
        StepUpMode mode = config.mode() == null ? StepUpMode.PERCENT : config.mode();
        double stepUpPercent = clampPercent(config.stepUpPercent());
        int stepUpAmount = Math.max(0, config.stepUpAmount());
        return new StepUpSipConfig(initialAmount, scheduleDay, mode, stepUpPercent, stepUpAmount);
    }

    public static int resolveInstalmentAmount(int initialAmount, int instalmentIndex, StepUpSipConfig config) {
        int completedYears = instalmentIndex / 12;
        int amount = Math.max(1, initialAmount);
        for (int year = 0; year < completedYears; year++) {
            amount = applyStepUp(amount, config);
        }
        return Math.max(1, amount);
    }

    private static int applyStepUp(int amount, StepUpSipConfig config) {
        if (config.mode() == StepUpMode.FIXED) {
            return Math.max(1, amount + config.stepUpAmount());
        }
        return Math.max(1, (int) Math.round(amount * (1 + config.stepUpPercent() / 100.0)));
    }

    private static double clampPercent(double value) {
        if (Double.isNaN(value) || Double.isInfinite(value)) {
            return StepUpSipConfig.DEFAULT_STEP_UP_PERCENT;
        }
        return Math.max(0, Math.min(100, value));
    }

    private static StepUpSipConfig withInitialAmount(StepUpSipConfig config, int initialAmount) {
        return new StepUpSipConfig(
                initialAmount,
                config.scheduleDay(),
                config.mode(),
                config.stepUpPercent(),
                config.stepUpAmount());
    }

    private ScenarioResult buildScenario(
            StepUpSipConfig config,
            List<SipInstalment> schedule,
            List<NavPoint> nav,
            NavPoint end,
            double years) {
        SipScenarioBuilder.ScenarioMetrics metrics = SipScenarioBuilder.computeMetrics(
                schedule,
                end,
                years,
                index -> resolveInstalmentAmount(config.initialAmount(), index, config),
                taxCalculator);

        StepUpSipReport.StepUpSipScenario scenario = toScenario(config, metrics);
        List<SipTimelinePoint> timeline = SipScenarioBuilder.buildDailyTimeline(
                schedule,
                nav,
                end,
                index -> resolveInstalmentAmount(config.initialAmount(), index, config));
        return new ScenarioResult(scenario, timeline);
    }

    private static StepUpSipReport.StepUpSipScenario toScenario(
            StepUpSipConfig config,
            SipScenarioBuilder.ScenarioMetrics metrics) {
        return new StepUpSipReport.StepUpSipScenario(
                config.initialAmount(),
                metrics.currentMonthlyAmount(),
                config.mode(),
                stepUpValue(config),
                metrics.currentValue(),
                metrics.totalGain(),
                metrics.xirr(),
                metrics.invested(),
                metrics.projectedValue10Y(),
                metrics.stcg(),
                metrics.ltcg(),
                metrics.postTaxXirr(),
                metrics.instalmentCount());
    }

    private static double stepUpValue(StepUpSipConfig config) {
        return config.mode() == StepUpMode.FIXED ? config.stepUpAmount() : config.stepUpPercent();
    }

    private static StepUpSipReport emptyReport(StepUpSipConfig config) {
        return new StepUpSipReport(
                config.scheduleDay(),
                config.initialAmount(),
                config.mode(),
                config.stepUpPercent(),
                config.stepUpAmount(),
                List.of(),
                List.of());
    }

    private static StepUpSipReport.StepUpSipScenario emptyScenario(StepUpSipConfig config) {
        return new StepUpSipReport.StepUpSipScenario(
                config.initialAmount(),
                config.initialAmount(),
                config.mode(),
                stepUpValue(config),
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0);
    }

    private record ScenarioResult(StepUpSipReport.StepUpSipScenario scenario, List<SipTimelinePoint> timeline) {
    }
}
