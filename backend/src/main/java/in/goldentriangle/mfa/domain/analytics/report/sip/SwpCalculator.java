package in.goldentriangle.mfa.domain.analytics.report.sip;

import in.goldentriangle.mfa.domain.analytics.report.core.NavLookup;
import in.goldentriangle.mfa.domain.analytics.report.returns.CalendarMath;
import in.goldentriangle.mfa.domain.analytics.report.tax.TaxCalculator;
import in.goldentriangle.mfa.domain.model.NavPoint;
import in.goldentriangle.mfa.domain.model.report.NavHistory;
import in.goldentriangle.mfa.domain.model.report.investment.SwpReport;
import in.goldentriangle.mfa.domain.model.report.investment.SwpSimulation;
import in.goldentriangle.mfa.domain.model.report.investment.SwpTimelinePoint;
import in.goldentriangle.mfa.domain.model.report.investment.TaxReport;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class SwpCalculator {

    public static final int DEFAULT_SCHEDULE_DAY = 1;
    public static final int DEFAULT_CHART_CORPUS = 10_00_000;
    public static final int DEFAULT_CHART_WITHDRAWAL = 10_000;
    private static final List<Integer> CORPUS_AMOUNTS = List.of(10_00_000, 25_00_000, 50_00_000, 1_00_00_000);
    private static final List<Integer> WITHDRAWAL_AMOUNTS = List.of(5_000, 10_000, 25_000, 50_000);
    private static final double LTCG_HOLDING_YEARS = 1;
    private static final DateTimeFormatter ISO_DATE = DateTimeFormatter.ISO_LOCAL_DATE;

    private final TaxCalculator taxCalculator;

    public SwpCalculator(TaxCalculator taxCalculator) {
        this.taxCalculator = taxCalculator;
    }

    public SwpReport compute(NavHistory history) {
        return compute(history, DEFAULT_SCHEDULE_DAY);
    }

    public SwpReport compute(NavHistory history, int scheduleDay) {
        List<NavPoint> nav = history.fundNav();
        if (nav.size() < 2) {
            return emptyReport(scheduleDay);
        }

        int day = SipCalculator.clampScheduleDay(scheduleDay);
        List<SwpReport.SwpScenario> scenarios = new ArrayList<>();
        for (int corpus : CORPUS_AMOUNTS) {
            for (int withdrawal : WITHDRAWAL_AMOUNTS) {
                scenarios.add(buildScenario(nav, corpus, withdrawal, day).scenario());
            }
        }

        ScenarioResult chart = buildScenario(nav, DEFAULT_CHART_CORPUS, DEFAULT_CHART_WITHDRAWAL, day);
        return new SwpReport(day, DEFAULT_CHART_CORPUS, DEFAULT_CHART_WITHDRAWAL, chart.timeline(), scenarios);
    }

    public SwpSimulation simulate(NavHistory history, int initialCorpus, int monthlyWithdrawal, int scheduleDay) {
        List<NavPoint> nav = history.fundNav();
        int corpus = Math.max(1, initialCorpus);
        int withdrawal = Math.max(1, monthlyWithdrawal);
        int day = SipCalculator.clampScheduleDay(scheduleDay);
        if (nav.size() < 2) {
            return new SwpSimulation(emptyScenario(corpus, withdrawal), List.of());
        }

        ScenarioResult result = buildScenario(nav, corpus, withdrawal, day);
        return new SwpSimulation(result.scenario(), result.timeline());
    }

    public static int clampScheduleDay(int scheduleDay) {
        return SipCalculator.clampScheduleDay(scheduleDay);
    }

    private ScenarioResult buildScenario(List<NavPoint> nav, int initialCorpus, int monthlyWithdrawal, int scheduleDay) {
        NavPoint start = nav.get(0);
        NavPoint end = nav.get(nav.size() - 1);
        double units = initialCorpus / start.nav();
        double costBasis = initialCorpus;
        double cumulativeWithdrawn = 0;
        double shortTermGain = 0;
        double longTermGain = 0;
        int withdrawalCount = 0;

        List<SwpTimelinePoint> timeline = new ArrayList<>();
        timeline.add(new SwpTimelinePoint(
                ISO_DATE.format(start.date().atZone(ZoneOffset.UTC)),
                initialCorpus,
                0,
                start.nav()));

        YearMonth cursor = YearMonth.from(start.date().atZone(ZoneOffset.UTC)).plusMonths(1);
        YearMonth endMonth = YearMonth.from(end.date().atZone(ZoneOffset.UTC));

        while (!cursor.isAfter(endMonth)) {
            int dom = Math.min(scheduleDay, cursor.lengthOfMonth());
            Instant target = cursor.atDay(dom).atStartOfDay(ZoneOffset.UTC).toInstant();
            if (target.isAfter(end.date())) {
                break;
            }

            Optional<NavPoint> point = NavLookup.nearest(nav, target);
            if (point.isEmpty() || point.get().nav() <= 0) {
                cursor = cursor.plusMonths(1);
                continue;
            }

            NavPoint withdrawalPoint = point.get();
            double navValue = withdrawalPoint.nav();
            double corpus = units * navValue;
            if (corpus <= 0) {
                break;
            }

            double amount = Math.min(monthlyWithdrawal, corpus);
            double costSold = costBasis * (amount / corpus);
            double gain = amount - costSold;
            double heldYears = CalendarMath.yearsBetweenMillis(
                    start.date().toEpochMilli(), withdrawalPoint.date().toEpochMilli());
            if (heldYears >= LTCG_HOLDING_YEARS) {
                longTermGain += gain;
            } else {
                shortTermGain += gain;
            }

            units -= amount / navValue;
            costBasis -= costSold;
            cumulativeWithdrawn += amount;
            withdrawalCount++;

            timeline.add(new SwpTimelinePoint(
                    ISO_DATE.format(withdrawalPoint.date().atZone(ZoneOffset.UTC)),
                    units * navValue,
                    cumulativeWithdrawn,
                    navValue));

            cursor = cursor.plusMonths(1);
        }

        double remainingCorpus = units * end.nav();
        if (timeline.isEmpty() || !timeline.get(timeline.size() - 1).date()
                .equals(ISO_DATE.format(end.date().atZone(ZoneOffset.UTC)))) {
            timeline.add(new SwpTimelinePoint(
                    ISO_DATE.format(end.date().atZone(ZoneOffset.UTC)),
                    remainingCorpus,
                    cumulativeWithdrawn,
                    end.nav()));
        }

        TaxReport withdrawalTax = taxCalculator.computeFromSplitGains(shortTermGain, longTermGain, initialCorpus);
        TaxReport remainingTax = taxCalculator.computeFromGain(
                remainingCorpus - costBasis, costBasis, LTCG_HOLDING_YEARS);
        double postTaxRemaining = remainingCorpus - remainingTax.stcg() - remainingTax.ltcg();

        SwpReport.SwpScenario scenario = new SwpReport.SwpScenario(
                initialCorpus,
                monthlyWithdrawal,
                cumulativeWithdrawn,
                remainingCorpus,
                withdrawalCount,
                remainingCorpus <= 0,
                withdrawalTax.stcg(),
                withdrawalTax.ltcg(),
                postTaxRemaining);

        return new ScenarioResult(scenario, timeline);
    }

    private static SwpReport emptyReport(int scheduleDay) {
        return new SwpReport(
                SipCalculator.clampScheduleDay(scheduleDay),
                DEFAULT_CHART_CORPUS,
                DEFAULT_CHART_WITHDRAWAL,
                List.of(),
                List.of());
    }

    private static SwpReport.SwpScenario emptyScenario(int corpus, int withdrawal) {
        return new SwpReport.SwpScenario(corpus, withdrawal, 0, 0, 0, false, 0, 0, 0);
    }

    private record ScenarioResult(SwpReport.SwpScenario scenario, List<SwpTimelinePoint> timeline) {
    }
}
