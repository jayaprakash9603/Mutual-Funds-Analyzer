package in.goldentriangle.mfa.domain.analytics.report.returns;

import in.goldentriangle.mfa.domain.analytics.report.core.NavLookup;
import in.goldentriangle.mfa.domain.model.NavPoint;
import in.goldentriangle.mfa.domain.model.report.NavHistory;
import in.goldentriangle.mfa.domain.model.report.returns.TrailingReturnsReport;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class TrailingReturnsCalculator {

    private static final double BASE_AMOUNT = 10_000;
    private static final List<PeriodWindow> WINDOWS = List.of(
            new PeriodWindow("1 Month", 30),
            new PeriodWindow("3 Month", 91),
            new PeriodWindow("6 Month", 182),
            new PeriodWindow("1 Year", 365),
            new PeriodWindow("3 Year", 365 * 3),
            new PeriodWindow("5 Year", 365 * 5),
            new PeriodWindow("7 Year", 365 * 7),
            new PeriodWindow("10 Year", 365 * 10),
            new PeriodWindow("15 Year", 365 * 15),
            new PeriodWindow("20 Year", 365 * 20));

    public TrailingReturnsReport compute(NavHistory history) {
        List<NavPoint> nav = history.fundNav();
        if (nav.isEmpty()) {
            return new TrailingReturnsReport(List.of());
        }
        Instant end = history.lastNavDate();
        NavPoint endPoint = nav.get(nav.size() - 1);
        List<TrailingReturnsReport.PeriodReturn> periods = new ArrayList<>();

        for (PeriodWindow window : WINDOWS) {
            Instant start = end.minus(window.days, ChronoUnit.DAYS);
            Optional<NavPoint> startPoint = NavLookup.navOnOrBefore(nav, start);
            if (startPoint.isEmpty()) {
                continue;
            }
            double years = CalendarMath.yearsBetweenMillis(
                    startPoint.get().date().toEpochMilli(),
                    endPoint.date().toEpochMilli());
            double abs = CalendarMath.absoluteReturn(startPoint.get().nav(), endPoint.nav());
            double cagr = CalendarMath.cagr(startPoint.get().nav(), endPoint.nav(), years);
            double multiplied = CalendarMath.moneyMultiplied(startPoint.get().nav(), endPoint.nav());
            periods.add(new TrailingReturnsReport.PeriodReturn(
                    window.label,
                    abs,
                    cagr,
                    BASE_AMOUNT * multiplied,
                    multiplied));
        }

        Optional<NavPoint> inception = nav.stream().findFirst();
        if (inception.isPresent()) {
            double years = CalendarMath.yearsBetweenMillis(
                    inception.get().date().toEpochMilli(),
                    endPoint.date().toEpochMilli());
            double abs = CalendarMath.absoluteReturn(inception.get().nav(), endPoint.nav());
            double cagr = CalendarMath.cagr(inception.get().nav(), endPoint.nav(), years);
            double multiplied = CalendarMath.moneyMultiplied(inception.get().nav(), endPoint.nav());
            periods.add(new TrailingReturnsReport.PeriodReturn(
                    "Since Launch",
                    abs,
                    cagr,
                    BASE_AMOUNT * multiplied,
                    multiplied));
        }

        return new TrailingReturnsReport(periods);
    }

    private record PeriodWindow(String label, int days) {
    }
}
