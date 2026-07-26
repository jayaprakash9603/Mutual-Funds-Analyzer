package in.goldentriangle.mfa.domain.analytics.report.core;

import in.goldentriangle.mfa.domain.analytics.NavSeriesBuilder;
import in.goldentriangle.mfa.domain.model.NavPoint;
import in.goldentriangle.mfa.domain.model.RollingReturnRow;
import in.goldentriangle.mfa.domain.model.RollingReturnsData;
import in.goldentriangle.mfa.domain.model.report.NavHistory;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;

public final class NavHistoryAssembler {

    private NavHistoryAssembler() {
    }

    public static NavHistory assemble(String scheme, RollingReturnsData data, String startDateUsed) {
        List<NavPoint> fundNav = NavSeriesBuilder.buildNavSeries(data.fund());
        List<NavPoint> benchmarkNav = NavSeriesBuilder.buildNavSeries(data.benchmark());

        String fundName = data.fund().stream()
                .map(RollingReturnRow::schemeName)
                .filter(name -> name != null && !name.isBlank())
                .findFirst()
                .orElse(scheme);
        String benchmarkName = data.benchmark().stream()
                .map(RollingReturnRow::schemeName)
                .filter(name -> name != null && !name.isBlank())
                .findFirst()
                .orElse("Benchmark");
        String category = data.fund().stream()
                .map(RollingReturnRow::schemeCategory)
                .filter(cat -> cat != null && !cat.isBlank())
                .findFirst()
                .orElse("");
        String amc = data.fund().stream()
                .map(RollingReturnRow::schemeCompany)
                .filter(company -> company != null && !company.isBlank())
                .findFirst()
                .orElse("");

        Instant first = fundNav.stream().map(NavPoint::date).min(Comparator.naturalOrder()).orElse(Instant.EPOCH);
        Instant last = fundNav.stream().map(NavPoint::date).max(Comparator.naturalOrder()).orElse(Instant.EPOCH);

        return new NavHistory(
                scheme,
                fundName,
                benchmarkName,
                category,
                amc,
                fundNav,
                benchmarkNav,
                first,
                last,
                startDateUsed);
    }
}
