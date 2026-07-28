package in.goldentriangle.mfa.domain.analytics.report.sip;

import in.goldentriangle.mfa.domain.analytics.report.returns.CalendarMath;
import in.goldentriangle.mfa.domain.model.NavPoint;
import in.goldentriangle.mfa.domain.model.report.investment.LumpsumReport;
import in.goldentriangle.mfa.domain.model.report.investment.LumpsumSimulation;
import in.goldentriangle.mfa.domain.model.report.investment.SipTimelinePoint;
import in.goldentriangle.mfa.domain.model.report.NavHistory;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

public class LumpsumCalculator {

    public static final int DEFAULT_CHART_AMOUNT = 100_000;
    private static final List<Integer> PRINCIPALS = List.of(10_000, 50_000, 100_000, 500_000, 1_000_000);
    private static final DateTimeFormatter ISO_DATE = DateTimeFormatter.ISO_LOCAL_DATE;

    public LumpsumReport compute(NavHistory history) {
        List<NavPoint> nav = history.fundNav();
        if (nav.size() < 2) {
            return new LumpsumReport(DEFAULT_CHART_AMOUNT, List.of(), List.of());
        }
        NavPoint start = nav.get(0);
        NavPoint end = nav.get(nav.size() - 1);
        double years = CalendarMath.yearsBetweenMillis(start.date().toEpochMilli(), end.date().toEpochMilli());
        double cagr = CalendarMath.cagr(start.nav(), end.nav(), years);
        double multiplied = CalendarMath.moneyMultiplied(start.nav(), end.nav());

        List<LumpsumReport.LumpsumScenario> scenarios = new ArrayList<>();
        for (int amount : PRINCIPALS) {
            double current = amount * multiplied;
            scenarios.add(new LumpsumReport.LumpsumScenario(
                    amount,
                    current,
                    current - amount,
                    cagr,
                    multiplied));
        }

        List<SipTimelinePoint> timeline = buildTimeline(nav, DEFAULT_CHART_AMOUNT);
        return new LumpsumReport(DEFAULT_CHART_AMOUNT, timeline, scenarios);
    }

    public LumpsumSimulation simulate(NavHistory history, int principal) {
        List<NavPoint> nav = history.fundNav();
        int amount = Math.max(1, principal);
        if (nav.size() < 2) {
            return new LumpsumSimulation(emptyScenario(amount), List.of());
        }
        NavPoint start = nav.get(0);
        NavPoint end = nav.get(nav.size() - 1);
        double years = CalendarMath.yearsBetweenMillis(start.date().toEpochMilli(), end.date().toEpochMilli());
        double cagr = CalendarMath.cagr(start.nav(), end.nav(), years);
        double multiplied = CalendarMath.moneyMultiplied(start.nav(), end.nav());
        double current = amount * multiplied;
        LumpsumReport.LumpsumScenario scenario = new LumpsumReport.LumpsumScenario(
                amount,
                current,
                current - amount,
                cagr,
                multiplied);
        return new LumpsumSimulation(scenario, buildTimeline(nav, amount));
    }

    private static LumpsumReport.LumpsumScenario emptyScenario(int amount) {
        return new LumpsumReport.LumpsumScenario(amount, 0, 0, 0, 0);
    }

    private List<SipTimelinePoint> buildTimeline(List<NavPoint> nav, int principal) {
        NavPoint start = nav.get(0);
        double startNav = start.nav();
        List<SipTimelinePoint> timeline = new ArrayList<>(nav.size());
        for (NavPoint point : nav) {
            double corpus = principal * (point.nav() / startNav);
            timeline.add(new SipTimelinePoint(
                    formatDate(point.date()),
                    principal,
                    corpus,
                    point.nav(),
                    0));
        }
        return InvestmentTimelineAverage.enrichSip(timeline);
    }

    private static String formatDate(Instant instant) {
        return instant.atZone(ZoneOffset.UTC).toLocalDate().format(ISO_DATE);
    }
}
