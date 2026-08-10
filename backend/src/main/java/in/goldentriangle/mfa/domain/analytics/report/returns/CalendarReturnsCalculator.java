package in.goldentriangle.mfa.domain.analytics.report.returns;

import in.goldentriangle.mfa.domain.analytics.NavDateParser;
import in.goldentriangle.mfa.domain.analytics.NavSeriesOrder;
import in.goldentriangle.mfa.domain.model.NavPoint;
import in.goldentriangle.mfa.domain.model.report.returns.CalendarReturnsReport;

import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Calendar month/year returns chained on consecutive month-end NAVs so that the
 * product of a year's monthly factors equals that year's yearly return.
 */
public class CalendarReturnsCalculator {

    public CalendarReturnsReport compute(List<NavPoint> nav) {
        return compute(nav, List.of());
    }

    public CalendarReturnsReport compute(List<NavPoint> fundNav, List<NavPoint> benchmarkNav) {
        CalendarReturnsReport fund = computeSeries(fundNav);
        if (benchmarkNav == null || benchmarkNav.isEmpty()) {
            return fund;
        }
        CalendarReturnsReport benchmark = computeSeries(benchmarkNav);
        return new CalendarReturnsReport(
                fund.months(),
                fund.years(),
                fund.bestMonth(),
                fund.worstMonth(),
                fund.bestYear(),
                fund.worstYear(),
                fund.positiveMonths(),
                fund.totalMonths(),
                benchmark.months(),
                benchmark.years());
    }

    private CalendarReturnsReport computeSeries(List<NavPoint> nav) {
        List<NavPoint> series = NavSeriesOrder.dedupeAndSort(nav);
        if (series.isEmpty()) {
            return empty();
        }

        Map<YearMonthKey, MonthBucket> buckets = new LinkedHashMap<>();
        for (NavPoint point : series) {
            var zdt = point.date().atZone(ZoneOffset.UTC);
            YearMonthKey key = new YearMonthKey(zdt.getYear(), zdt.getMonthValue());
            MonthBucket bucket = buckets.computeIfAbsent(key, ignored -> new MonthBucket());
            if (bucket.first == null) {
                bucket.first = point;
            }
            bucket.last = point;
        }

        List<YearMonthKey> keys = new ArrayList<>(buckets.keySet());
        List<CalendarReturnsReport.MonthlyReturn> months = new ArrayList<>(keys.size());
        NavPoint previousMonthEnd = null;

        for (YearMonthKey key : keys) {
            MonthBucket bucket = buckets.get(key);
            NavPoint end = bucket.last;
            NavPoint start = previousMonthEnd != null ? previousMonthEnd : bucket.first;
            double returnPercent = CalendarMath.absoluteReturn(start.nav(), end.nav());
            months.add(new CalendarReturnsReport.MonthlyReturn(
                    key.year(),
                    key.month(),
                    returnPercent,
                    start.nav(),
                    end.nav(),
                    NavDateParser.dateKey(start.date()),
                    NavDateParser.dateKey(end.date())));
            previousMonthEnd = end;
        }

        List<CalendarReturnsReport.YearlyReturn> years = buildYears(months);

        double bestMonth = months.stream().mapToDouble(CalendarReturnsReport.MonthlyReturn::returnPercent).max().orElse(0);
        double worstMonth = months.stream().mapToDouble(CalendarReturnsReport.MonthlyReturn::returnPercent).min().orElse(0);
        double bestYear = years.stream().mapToDouble(CalendarReturnsReport.YearlyReturn::returnPercent).max().orElse(0);
        double worstYear = years.stream().mapToDouble(CalendarReturnsReport.YearlyReturn::returnPercent).min().orElse(0);
        int positiveMonths = (int) months.stream().filter(m -> m.returnPercent() > 0).count();

        return new CalendarReturnsReport(
                months,
                years,
                bestMonth,
                worstMonth,
                bestYear,
                worstYear,
                positiveMonths,
                months.size(),
                List.of(),
                List.of());
    }

    /**
     * Year return uses the first month's start NAV and the last month's end NAV in that year,
     * so the product of monthly factors equals the yearly return exactly.
     */
    private static List<CalendarReturnsReport.YearlyReturn> buildYears(
            List<CalendarReturnsReport.MonthlyReturn> months) {
        if (months.isEmpty()) {
            return List.of();
        }

        Map<Integer, List<CalendarReturnsReport.MonthlyReturn>> byYear = new LinkedHashMap<>();
        for (CalendarReturnsReport.MonthlyReturn month : months) {
            byYear.computeIfAbsent(month.year(), ignored -> new ArrayList<>()).add(month);
        }

        List<CalendarReturnsReport.YearlyReturn> years = new ArrayList<>();
        for (Map.Entry<Integer, List<CalendarReturnsReport.MonthlyReturn>> entry : byYear.entrySet()) {
            List<CalendarReturnsReport.MonthlyReturn> yearMonths = entry.getValue();
            CalendarReturnsReport.MonthlyReturn first = yearMonths.get(0);
            CalendarReturnsReport.MonthlyReturn last = yearMonths.get(yearMonths.size() - 1);
            double returnPercent = CalendarMath.absoluteReturn(first.startNav(), last.endNav());
            boolean partial = yearMonths.size() < 12 || first.month() != 1 || last.month() != 12;

            years.add(new CalendarReturnsReport.YearlyReturn(
                    entry.getKey(),
                    returnPercent,
                    first.startNav(),
                    last.endNav(),
                    yearMonths.size(),
                    partial));
        }
        return years;
    }

    private static CalendarReturnsReport empty() {
        return new CalendarReturnsReport(List.of(), List.of(), 0, 0, 0, 0, 0, 0, List.of(), List.of());
    }

    private record YearMonthKey(int year, int month) {
    }

    private static final class MonthBucket {
        private NavPoint first;
        private NavPoint last;
    }
}
