package in.goldentriangle.mfa.domain.analytics.report.returns;

import in.goldentriangle.mfa.domain.analytics.NavDateParser;
import in.goldentriangle.mfa.domain.analytics.NavSeriesOrder;
import in.goldentriangle.mfa.domain.model.NavPoint;
import in.goldentriangle.mfa.domain.model.report.returns.MissingBestQuarterReport;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public class MissingBestQuarterCalculator {

    private static final int QUARTERS_IN_WINDOW = 12;
    private static final double WINDOW_YEARS = 3.0;
    private static final DateTimeFormatter PERIOD_FMT =
            DateTimeFormatter.ofPattern("MMM-yy", Locale.ENGLISH).withZone(ZoneOffset.UTC);
    private static final DateTimeFormatter QUARTER_FMT =
            DateTimeFormatter.ofPattern("Q", Locale.ENGLISH).withZone(ZoneOffset.UTC);

    private record QuarterNav(String key, int year, int quarter, String endDate, double startNav, double endNav) {
        double returnFraction() {
            return startNav <= 0 ? 0 : endNav / startNav - 1;
        }

        String label() {
            return "Q" + quarter + " " + String.format(Locale.ENGLISH, "%02d", year % 100);
        }
    }

    public MissingBestQuarterReport compute(List<NavPoint> fundNav) {
        List<NavPoint> series = NavSeriesOrder.dedupeAndSort(fundNav);
        if (series.size() < 2) {
            return empty(series);
        }

        List<QuarterNav> quarters = buildQuarters(series);
        if (quarters.size() < QUARTERS_IN_WINDOW + 1) {
            return empty(series);
        }

        List<MissingBestQuarterReport.QuarterPoint> points = new ArrayList<>();
        for (int endIndex = QUARTERS_IN_WINDOW - 1; endIndex < quarters.size(); endIndex++) {
            List<QuarterNav> window = quarters.subList(endIndex - QUARTERS_IN_WINDOW + 1, endIndex + 1);
            QuarterNav windowStart = window.get(0);
            QuarterNav windowEnd = window.get(window.size() - 1);
            if (windowStart.startNav() <= 0 || windowEnd.endNav() <= 0) {
                continue;
            }

            double fullCagr = CalendarMath.cagr(windowStart.startNav(), windowEnd.endNav(), WINDOW_YEARS);

            QuarterNav bestQuarter = window.stream()
                    .max(Comparator.comparingDouble(QuarterNav::returnFraction))
                    .orElse(window.get(0));

            double compound = 1;
            for (QuarterNav q : window) {
                if (q.key().equals(bestQuarter.key())) {
                    continue;
                }
                compound *= 1 + q.returnFraction();
            }
            double exBestValue = windowStart.startNav() * compound;
            double exBestCagr = CalendarMath.cagr(windowStart.startNav(), exBestValue, WINDOW_YEARS);
            double lost = exBestCagr - fullCagr;

            points.add(new MissingBestQuarterReport.QuarterPoint(
                    windowEnd.label(),
                    windowEnd.endDate(),
                    fullCagr,
                    exBestCagr,
                    lost,
                    bestQuarter.label()));
        }

        if (points.isEmpty()) {
            return empty(series);
        }

        double averageLost = points.stream().mapToDouble(MissingBestQuarterReport.QuarterPoint::lostCagrPercent).average().orElse(0);
        MissingBestQuarterReport.QuarterPoint latest = points.get(points.size() - 1);
        String periodLabel = PERIOD_FMT.format(series.get(0).date()) + " to " + PERIOD_FMT.format(series.get(series.size() - 1).date());
        String headline = buildHeadline(latest.lostCagrPercent());

        return new MissingBestQuarterReport(
                periodLabel,
                points,
                averageLost,
                latest.lostCagrPercent(),
                latest.quarterLabel(),
                headline);
    }

    private static List<QuarterNav> buildQuarters(List<NavPoint> series) {
        Map<String, NavPoint> quarterStart = new LinkedHashMap<>();
        Map<String, NavPoint> quarterEnd = new LinkedHashMap<>();

        for (NavPoint point : series) {
            var zdt = point.date().atZone(ZoneOffset.UTC);
            int year = zdt.getYear();
            int quarter = (zdt.getMonthValue() - 1) / 3 + 1;
            String key = year + "-Q" + quarter;
            quarterStart.putIfAbsent(key, point);
            quarterEnd.put(key, point);
        }

        List<QuarterNav> quarters = new ArrayList<>();
        for (String key : quarterStart.keySet()) {
            String[] parts = key.split("-Q");
            int year = Integer.parseInt(parts[0]);
            int quarter = Integer.parseInt(parts[1]);
            NavPoint start = quarterStart.get(key);
            NavPoint end = quarterEnd.get(key);
            quarters.add(new QuarterNav(
                    key,
                    year,
                    quarter,
                    NavDateParser.dateKey(end.date()),
                    start.nav(),
                    end.nav()));
        }
        quarters.sort(Comparator.comparing(QuarterNav::endDate));
        return quarters;
    }

    private static String buildHeadline(double latestLost) {
        if (latestLost >= 0) {
            return "Missing the best quarter in a three-year window reduces annualized returns";
        }
        return "Returns lost from missing the best quarter over the latest three-year window was ~"
                + Math.round(Math.abs(latestLost))
                + "% annualized";
    }

    private static MissingBestQuarterReport empty(List<NavPoint> series) {
        String periodLabel = series.isEmpty()
                ? "Insufficient history"
                : PERIOD_FMT.format(series.get(0).date()) + " to " + PERIOD_FMT.format(series.get(series.size() - 1).date());
        return new MissingBestQuarterReport(periodLabel, List.of(), 0, 0, "", "");
    }
}
