package in.goldentriangle.mfa.domain.analytics.report.returns;

import in.goldentriangle.mfa.domain.analytics.NavDateParser;
import in.goldentriangle.mfa.domain.model.NavPoint;
import in.goldentriangle.mfa.domain.model.report.returns.AllTimeHighsReport;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public class AllTimeHighsCalculator {

    private static final double ATH_EPSILON = 1e-9;

    public AllTimeHighsReport compute(List<NavPoint> fundNav) {
        if (fundNav == null || fundNav.isEmpty()) {
            return emptyReport();
        }

        List<NavPoint> sorted = fundNav.stream()
                .sorted(Comparator.comparing(NavPoint::date))
                .toList();

        Instant first = sorted.get(0).date();
        Instant last = sorted.get(sorted.size() - 1).date();
        String periodLabel = formatPeriodLabel(first, last);

        double runningMax = 0;
        int athDayCount = 0;
        List<AllTimeHighsReport.NavPoint> series = new ArrayList<>(sorted.size());
        Map<Integer, Double> yearMax = new LinkedHashMap<>();

        for (NavPoint point : sorted) {
            int year = point.date().atZone(ZoneOffset.UTC).getYear();
            yearMax.merge(year, point.nav(), Math::max);

            boolean isAth = point.nav() > runningMax + ATH_EPSILON;
            if (isAth) {
                runningMax = point.nav();
                athDayCount++;
            }
            series.add(new AllTimeHighsReport.NavPoint(
                    NavDateParser.dateKey(point.date()),
                    point.nav(),
                    isAth));
        }

        List<AllTimeHighsReport.YearlyMaxNav> yearly = buildYearlyMaxLevels(yearMax, last);
        int yearsWithHigh = (int) yearly.stream().filter(AllTimeHighsReport.YearlyMaxNav::allTimeHighYear).count();
        double yearsPercent = yearly.isEmpty() ? 0 : (yearsWithHigh * 100.0) / yearly.size();
        String headline = buildHeadline(yearsWithHigh, yearly.size(), yearsPercent);

        return new AllTimeHighsReport(
                periodLabel,
                series,
                yearly,
                new AllTimeHighsReport.AllTimeHighsSummary(
                        athDayCount,
                        yearly.size(),
                        yearsWithHigh,
                        yearsPercent,
                        headline));
    }

    private static List<AllTimeHighsReport.YearlyMaxNav> buildYearlyMaxLevels(
            Map<Integer, Double> yearMax,
            Instant lastDate) {
        int currentYear = lastDate.atZone(ZoneOffset.UTC).getYear();
        List<AllTimeHighsReport.YearlyMaxNav> rows = new ArrayList<>();
        double priorPeak = 0;

        for (Map.Entry<Integer, Double> entry : yearMax.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .toList()) {
            int year = entry.getKey();
            double maxNav = entry.getValue();
            boolean isAthYear = maxNav > priorPeak + ATH_EPSILON;
            if (isAthYear) {
                priorPeak = maxNav;
            }
            String label = year == currentYear ? year + " YTD" : String.valueOf(year);
            rows.add(new AllTimeHighsReport.YearlyMaxNav(year, label, maxNav, isAthYear));
        }
        return rows;
    }

    private static String buildHeadline(int yearsWithHigh, int totalYears, double yearsPercent) {
        if (totalYears == 0) {
            return "";
        }
        return yearsWithHigh + " of " + totalYears + " calendar years ("
                + String.format(Locale.ENGLISH, "%.0f", yearsPercent)
                + "%) printed a new all-time high NAV — growth naturally spends much of its time at fresh peaks.";
    }

    private static AllTimeHighsReport emptyReport() {
        return new AllTimeHighsReport(
                "Insufficient history",
                List.of(),
                List.of(),
                new AllTimeHighsReport.AllTimeHighsSummary(0, 0, 0, 0, ""));
    }

    private static String formatPeriodLabel(Instant first, Instant last) {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM-yy", Locale.ENGLISH).withZone(ZoneOffset.UTC);
        return fmt.format(first) + " to " + fmt.format(last);
    }
}
