package in.goldentriangle.mfa.domain.analytics.report.sip;

import in.goldentriangle.mfa.domain.analytics.report.returns.CalendarMath;
import in.goldentriangle.mfa.domain.analytics.report.tax.TaxCalculator;
import in.goldentriangle.mfa.domain.model.NavPoint;
import in.goldentriangle.mfa.domain.model.report.NavHistory;
import in.goldentriangle.mfa.domain.model.report.investment.SipReport;
import in.goldentriangle.mfa.domain.model.report.investment.SipSimulation;
import in.goldentriangle.mfa.domain.model.report.investment.SipTimelinePoint;

import java.util.List;

public class SipCalculator {

    public static final int DEFAULT_SCHEDULE_DAY = 1;
    public static final int DEFAULT_CHART_AMOUNT = 10_000;
    private static final List<Integer> AMOUNTS = List.of(500, 1_000, 5_000, 10_000, 25_000);

    private final TaxCalculator taxCalculator;

    public SipCalculator(TaxCalculator taxCalculator) {
        this.taxCalculator = taxCalculator;
    }

    public SipReport compute(NavHistory history) {
        return compute(history, DEFAULT_SCHEDULE_DAY);
    }

    public SipReport compute(NavHistory history, int scheduleDay) {
        List<NavPoint> nav = history.fundNav();
        if (nav.size() < 2) {
            return emptyReport(scheduleDay);
        }

        NavPoint end = nav.get(nav.size() - 1);
        List<SipInstalment> schedule = SipScheduleBuilder.build(nav, end.date(), scheduleDay);
        if (schedule.isEmpty()) {
            return emptyReport(scheduleDay);
        }

        double years = CalendarMath.yearsBetweenMillis(
                schedule.get(0).date().toEpochMilli(), end.date().toEpochMilli());

        List<SipReport.SipScenario> scenarios = AMOUNTS.parallelStream()
                .map(amount -> buildScenario(amount, schedule, nav, end, years).scenario())
                .toList();

        ScenarioResult chart = buildScenario(DEFAULT_CHART_AMOUNT, schedule, nav, end, years);
        return new SipReport(scheduleDay, DEFAULT_CHART_AMOUNT, chart.timeline(), scenarios);
    }

    public SipSimulation simulate(NavHistory history, int amount, int scheduleDay) {
        int day = clampScheduleDay(scheduleDay);
        int monthly = Math.max(1, amount);
        List<NavPoint> nav = history.fundNav();
        if (nav.size() < 2) {
            return new SipSimulation(emptyScenario(monthly), List.of());
        }

        NavPoint end = nav.get(nav.size() - 1);
        List<SipInstalment> schedule = SipScheduleBuilder.build(nav, end.date(), day);
        if (schedule.isEmpty()) {
            return new SipSimulation(emptyScenario(monthly), List.of());
        }

        double years = CalendarMath.yearsBetweenMillis(
                schedule.get(0).date().toEpochMilli(), end.date().toEpochMilli());
        ScenarioResult result = buildScenario(monthly, schedule, nav, end, years);
        return new SipSimulation(result.scenario(), result.timeline());
    }

    private static SipReport emptyReport(int scheduleDay) {
        return new SipReport(clampScheduleDay(scheduleDay), DEFAULT_CHART_AMOUNT, List.of(), List.of());
    }

    private static SipReport.SipScenario emptyScenario(int amount) {
        return new SipReport.SipScenario(amount, 0, 0, 0, 0, 0, 0, 0, 0);
    }

    private ScenarioResult buildScenario(
            int amount,
            List<SipInstalment> schedule,
            List<NavPoint> nav,
            NavPoint end,
            double years) {
        int monthly = Math.max(1, amount);
        SipScenarioBuilder.ScenarioMetrics metrics = SipScenarioBuilder.computeMetrics(
                schedule, end, years, ignored -> monthly, taxCalculator);

        SipReport.SipScenario scenario = new SipReport.SipScenario(
                monthly,
                metrics.currentValue(),
                metrics.totalGain(),
                metrics.xirr(),
                metrics.invested(),
                metrics.projectedValue10Y(),
                metrics.stcg(),
                metrics.ltcg(),
                metrics.postTaxXirr());

        List<SipTimelinePoint> timeline = SipScenarioBuilder.buildDailyTimeline(
                schedule, nav, end, ignored -> monthly);
        return new ScenarioResult(scenario, timeline);
    }

    public static int clampScheduleDay(int scheduleDay) {
        if (scheduleDay < 1) {
            return DEFAULT_SCHEDULE_DAY;
        }
        return Math.min(scheduleDay, 28);
    }

    private record ScenarioResult(SipReport.SipScenario scenario, List<SipTimelinePoint> timeline) {
    }
}
