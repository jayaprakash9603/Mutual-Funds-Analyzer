package in.goldentriangle.mfa.domain.analytics.report.sip;

import in.goldentriangle.mfa.domain.analytics.report.core.NavLookup;
import in.goldentriangle.mfa.domain.analytics.report.returns.CalendarMath;
import in.goldentriangle.mfa.domain.analytics.report.tax.TaxCalculator;
import in.goldentriangle.mfa.domain.model.NavPoint;
import in.goldentriangle.mfa.domain.model.report.NavHistory;
import in.goldentriangle.mfa.domain.model.report.investment.SipReport;
import in.goldentriangle.mfa.domain.model.report.investment.SipSimulation;
import in.goldentriangle.mfa.domain.model.report.investment.SipTimelinePoint;
import in.goldentriangle.mfa.domain.model.report.investment.TaxReport;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class SipCalculator {

    public static final int DEFAULT_SCHEDULE_DAY = 1;
    public static final int DEFAULT_CHART_AMOUNT = 10_000;
    private static final List<Integer> AMOUNTS = List.of(500, 1_000, 5_000, 10_000, 25_000);
    private static final int PROJECTION_YEARS = 10;
    private static final double MILLIS_PER_DAY = 24 * 60 * 60 * 1000d;
    private static final double LTCG_HOLDING_YEARS = 1;
    private static final DateTimeFormatter ISO_DATE = DateTimeFormatter.ISO_LOCAL_DATE;

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
        List<Instalment> schedule = buildSchedule(nav, end.date(), scheduleDay);
        if (schedule.isEmpty()) {
            return emptyReport(scheduleDay);
        }

        double years = CalendarMath.yearsBetweenMillis(
                schedule.get(0).date().toEpochMilli(), end.date().toEpochMilli());

        List<SipReport.SipScenario> scenarios = new ArrayList<>();
        for (int amount : AMOUNTS) {
            scenarios.add(buildScenario(amount, schedule, end, years).scenario());
        }

        ScenarioResult chart = buildScenario(DEFAULT_CHART_AMOUNT, schedule, end, years);
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
        List<Instalment> schedule = buildSchedule(nav, end.date(), day);
        if (schedule.isEmpty()) {
            return new SipSimulation(emptyScenario(monthly), List.of());
        }

        double years = CalendarMath.yearsBetweenMillis(
                schedule.get(0).date().toEpochMilli(), end.date().toEpochMilli());
        ScenarioResult result = buildScenario(monthly, schedule, end, years);
        return new SipSimulation(result.scenario(), result.timeline());
    }

    private static SipReport emptyReport(int scheduleDay) {
        return new SipReport(clampScheduleDay(scheduleDay), DEFAULT_CHART_AMOUNT, List.of(), List.of());
    }

    private static SipReport.SipScenario emptyScenario(int amount) {
        return new SipReport.SipScenario(amount, 0, 0, 0, 0, 0, 0, 0, 0);
    }

    /** Calendar-day SIP: same day each month (1–28), using nearest NAV within 7 days. */
    List<Instalment> buildSchedule(List<NavPoint> nav, Instant end, int scheduleDay) {
        int day = clampScheduleDay(scheduleDay);
        YearMonth cursor = YearMonth.from(nav.get(0).date().atZone(ZoneOffset.UTC));
        YearMonth endMonth = YearMonth.from(end.atZone(ZoneOffset.UTC));
        List<Instalment> schedule = new ArrayList<>();

        while (!cursor.isAfter(endMonth)) {
            int dom = Math.min(day, cursor.lengthOfMonth());
            Instant target = cursor.atDay(dom).atStartOfDay(ZoneOffset.UTC).toInstant();
            if (target.isAfter(end)) {
                break;
            }
            Optional<NavPoint> point = NavLookup.nearest(nav, target);
            if (point.isPresent() && point.get().nav() > 0) {
                schedule.add(new Instalment(point.get().date(), point.get().nav()));
            }
            cursor = cursor.plusMonths(1);
        }
        return schedule;
    }

    private ScenarioResult buildScenario(int amount, List<Instalment> schedule, NavPoint end, double years) {
        long baseDay = (long) (schedule.get(0).date().toEpochMilli() / MILLIS_PER_DAY);
        long endDay = (long) (end.date().toEpochMilli() / MILLIS_PER_DAY);

        List<Xirr.CashFlow> flows = new ArrayList<>(schedule.size() + 1);
        List<SipTimelinePoint> timeline = new ArrayList<>(schedule.size());
        double units = 0;
        double invested = 0;
        double shortTermGain = 0;
        double longTermGain = 0;

        for (Instalment instalment : schedule) {
            double lotUnits = amount / instalment.nav();
            units += lotUnits;
            invested += amount;
            flows.add(new Xirr.CashFlow(
                    (long) (instalment.date().toEpochMilli() / MILLIS_PER_DAY) - baseDay, -amount));

            double lotGain = lotUnits * end.nav() - amount;
            if (instalment.heldYearsUntil(end.date()) >= LTCG_HOLDING_YEARS) {
                longTermGain += lotGain;
            } else {
                shortTermGain += lotGain;
            }

            timeline.add(new SipTimelinePoint(
                    ISO_DATE.format(instalment.date().atZone(ZoneOffset.UTC)),
                    invested,
                    units * instalment.nav(),
                    instalment.nav()));
        }

        double currentValue = units * end.nav();
        timeline.add(new SipTimelinePoint(
                ISO_DATE.format(end.date().atZone(ZoneOffset.UTC)),
                invested,
                currentValue,
                end.nav()));

        flows.add(new Xirr.CashFlow(endDay - baseDay, currentValue));
        double xirr = Xirr.compute(flows);

        TaxReport tax = taxCalculator.computeFromSplitGains(shortTermGain, longTermGain, invested);
        double postTaxXirr = postTaxXirr(flows, currentValue - tax.stcg() - tax.ltcg());

        SipReport.SipScenario scenario = new SipReport.SipScenario(
                amount,
                currentValue,
                currentValue - invested,
                xirr,
                invested,
                currentValue * Math.pow(1 + xirr / 100, PROJECTION_YEARS - years),
                tax.stcg(),
                tax.ltcg(),
                postTaxXirr);

        return new ScenarioResult(scenario, timeline);
    }

    private double postTaxXirr(List<Xirr.CashFlow> flows, double postTaxValue) {
        List<Xirr.CashFlow> postTaxFlows = new ArrayList<>(flows);
        Xirr.CashFlow redemption = postTaxFlows.remove(postTaxFlows.size() - 1);
        postTaxFlows.add(new Xirr.CashFlow(redemption.dayOffset(), postTaxValue));
        return Xirr.compute(postTaxFlows);
    }

    public static int clampScheduleDay(int scheduleDay) {
        if (scheduleDay < 1) {
            return DEFAULT_SCHEDULE_DAY;
        }
        return Math.min(scheduleDay, 28);
    }

    private record Instalment(Instant date, double nav) {

        double heldYearsUntil(Instant end) {
            return CalendarMath.yearsBetweenMillis(date.toEpochMilli(), end.toEpochMilli());
        }
    }

    private record ScenarioResult(SipReport.SipScenario scenario, List<SipTimelinePoint> timeline) {
    }
}
