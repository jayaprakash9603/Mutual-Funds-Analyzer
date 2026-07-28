package in.goldentriangle.mfa.domain.analytics.report.returns;

import in.goldentriangle.mfa.domain.analytics.NavSeriesOrder;
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
    private static final double DECLINE_THRESHOLD_PERCENT = 10.0;
    private static final int[] FORWARD_HORIZONS = {1, 3, 5};

    private static final List<ThresholdSpec> THRESHOLD_SPECS = List.of(
            new ThresholdSpec(">20% returns", 20, true),
            new ThresholdSpec(">15% returns", 15, true),
            new ThresholdSpec(">12% returns", 12, true),
            new ThresholdSpec(">10% returns", 10, true),
            new ThresholdSpec(">8% returns", 8, true),
            new ThresholdSpec(">0% returns", 0, true),
            new ThresholdSpec("<0% returns", 0, false));

    public AllTimeHighsReport compute(List<NavPoint> fundNav) {
        return compute(fundNav, "the fund");
    }

    public AllTimeHighsReport compute(List<NavPoint> fundNav, String fundName) {
        if (fundNav == null || fundNav.isEmpty()) {
            return emptyReport();
        }

        List<NavPoint> sorted = NavSeriesOrder.dedupeAndSort(fundNav);

        Instant first = sorted.get(0).date();
        Instant last = sorted.get(sorted.size() - 1).date();
        String periodLabel = formatPeriodLabel(first, last);
        String displayName = fundName == null || fundName.isBlank() ? "the fund" : fundName;

        double runningMax = 0;
        int athDayCount = 0;
        boolean[] isAth = new boolean[sorted.size()];
        Map<Integer, Double> yearMax = new LinkedHashMap<>();

        for (int i = 0; i < sorted.size(); i++) {
            NavPoint point = sorted.get(i);
            int year = point.date().atZone(ZoneOffset.UTC).getYear();
            yearMax.merge(year, point.nav(), Math::max);

            boolean ath = point.nav() > runningMax + ATH_EPSILON;
            if (ath) {
                runningMax = point.nav();
                athDayCount++;
            }
            isAth[i] = ath;
        }

        Boolean[] fellBelow = computeFellBelowThreshold(sorted, isAth);

        List<AllTimeHighsReport.NavPoint> series = new ArrayList<>(sorted.size());
        for (int i = 0; i < sorted.size(); i++) {
            NavPoint point = sorted.get(i);
            series.add(new AllTimeHighsReport.NavPoint(
                    NavDateParser.dateKey(point.date()),
                    point.nav(),
                    isAth[i],
                    isAth[i] ? fellBelow[i] : null));
        }

        List<AllTimeHighsReport.YearlyMaxNav> yearly = buildYearlyMaxLevels(yearMax, last);
        int yearsWithHigh = (int) yearly.stream().filter(AllTimeHighsReport.YearlyMaxNav::allTimeHighYear).count();
        double yearsPercent = yearly.isEmpty() ? 0 : (yearsWithHigh * 100.0) / yearly.size();
        String headline = buildSummaryHeadline(yearsWithHigh, yearly.size(), yearsPercent);

        AllTimeHighsReport.PostAthReturns postAthReturns = buildPostAthReturns(sorted, isAth, displayName);
        AllTimeHighsReport.AthDeclineOutlook athDeclineOutlook =
                buildAthDeclineOutlook(sorted, isAth, fellBelow, displayName);

        return new AllTimeHighsReport(
                periodLabel,
                series,
                yearly,
                new AllTimeHighsReport.AllTimeHighsSummary(
                        athDayCount,
                        yearly.size(),
                        yearsWithHigh,
                        yearsPercent,
                        headline),
                postAthReturns,
                athDeclineOutlook);
    }

    private static Boolean[] computeFellBelowThreshold(List<NavPoint> sorted, boolean[] isAth) {
        Boolean[] fellBelow = new Boolean[sorted.size()];
        double suffixMinAfter = Double.POSITIVE_INFINITY;

        for (int i = sorted.size() - 1; i >= 0; i--) {
            if (isAth[i]) {
                double threshold = sorted.get(i).nav() * (1 - DECLINE_THRESHOLD_PERCENT / 100.0);
                fellBelow[i] = suffixMinAfter <= threshold + ATH_EPSILON;
            }
            suffixMinAfter = Math.min(suffixMinAfter, sorted.get(i).nav());
        }
        return fellBelow;
    }

    private static AllTimeHighsReport.PostAthReturns buildPostAthReturns(
            List<NavPoint> sorted,
            boolean[] isAth,
            String fundName) {
        List<AllTimeHighsReport.PostAthHorizon> horizons = new ArrayList<>();

        for (int horizonYears : FORWARD_HORIZONS) {
            List<Double> cagrs = new ArrayList<>();
            int lookupIndex = 0;

            for (int i = 0; i < sorted.size(); i++) {
                if (!isAth[i]) {
                    continue;
                }
                Instant target = sorted.get(i).date()
                        .atZone(ZoneOffset.UTC)
                        .toLocalDate()
                        .plusYears(horizonYears)
                        .atStartOfDay(ZoneOffset.UTC)
                        .toInstant();
                while (lookupIndex < sorted.size() && sorted.get(lookupIndex).date().isBefore(target)) {
                    lookupIndex++;
                }
                if (lookupIndex >= sorted.size()) {
                    continue;
                }
                double startNav = sorted.get(i).nav();
                double endNav = sorted.get(lookupIndex).nav();
                if (startNav <= 0) {
                    continue;
                }
                double cagr = (Math.pow(endNav / startNav, 1.0 / horizonYears) - 1) * 100;
                cagrs.add(cagr);
            }

            double average = cagrs.isEmpty()
                    ? 0
                    : cagrs.stream().mapToDouble(Double::doubleValue).average().orElse(0);
            List<AllTimeHighsReport.PostAthThreshold> thresholds = buildThresholdRows(cagrs);

            horizons.add(new AllTimeHighsReport.PostAthHorizon(
                    horizonYears + "Y",
                    horizonYears,
                    cagrs.size(),
                    average,
                    thresholds));
        }

        double oneYearAverage = horizons.stream()
                .filter(h -> h.years() == 1)
                .map(AllTimeHighsReport.PostAthHorizon::averageCagrPercent)
                .findFirst()
                .orElse(0.0);
        String headline = horizons.stream().anyMatch(h -> h.sampleCount() > 0)
                ? "The average 1-year return from investing in " + fundName
                        + " on an all-time high day is ~"
                        + String.format(Locale.ENGLISH, "%.0f", oneYearAverage) + "%."
                : "";

        return new AllTimeHighsReport.PostAthReturns(horizons, headline);
    }

    private static List<AllTimeHighsReport.PostAthThreshold> buildThresholdRows(List<Double> cagrs) {
        List<AllTimeHighsReport.PostAthThreshold> rows = new ArrayList<>();
        for (ThresholdSpec spec : THRESHOLD_SPECS) {
            long matches = cagrs.stream()
                    .filter(cagr -> spec.above() ? cagr > spec.boundPercent() : cagr < spec.boundPercent())
                    .count();
            double share = cagrs.isEmpty() ? 0 : (matches * 100.0) / cagrs.size();
            rows.add(new AllTimeHighsReport.PostAthThreshold(
                    spec.label(), spec.boundPercent(), spec.above(), share));
        }
        return rows;
    }

    private static AllTimeHighsReport.AthDeclineOutlook buildAthDeclineOutlook(
            List<NavPoint> sorted,
            boolean[] isAth,
            Boolean[] fellBelow,
            String fundName) {
        int total = 0;
        int fellCount = 0;

        for (int i = 0; i < sorted.size(); i++) {
            if (!isAth[i] || fellBelow[i] == null) {
                continue;
            }
            total++;
            if (fellBelow[i]) {
                fellCount++;
            }
        }

        int neverFellCount = total - fellCount;
        double neverFellPercent = total == 0 ? 0 : (neverFellCount * 100.0) / total;
        double fellPercent = total == 0 ? 0 : (fellCount * 100.0) / total;

        String headline = total == 0
                ? ""
                : "In " + String.format(Locale.ENGLISH, "%.0f", neverFellPercent)
                        + "% of instances where " + fundName
                        + " reached an all-time high, it never fell "
                        + String.format(Locale.ENGLISH, "%.0f", DECLINE_THRESHOLD_PERCENT)
                        + "% below that level — further declines came from much higher levels.";

        return new AllTimeHighsReport.AthDeclineOutlook(
                DECLINE_THRESHOLD_PERCENT,
                total,
                neverFellCount,
                neverFellPercent,
                fellCount,
                fellPercent,
                headline);
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

    private static String buildSummaryHeadline(int yearsWithHigh, int totalYears, double yearsPercent) {
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
                new AllTimeHighsReport.AllTimeHighsSummary(0, 0, 0, 0, ""),
                new AllTimeHighsReport.PostAthReturns(List.of(), ""),
                new AllTimeHighsReport.AthDeclineOutlook(
                        DECLINE_THRESHOLD_PERCENT, 0, 0, 0, 0, 0, ""));
    }

    private static String formatPeriodLabel(Instant first, Instant last) {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM-yy", Locale.ENGLISH).withZone(ZoneOffset.UTC);
        return fmt.format(first) + " to " + fmt.format(last);
    }

    private record ThresholdSpec(String label, double boundPercent, boolean above) {
    }
}
