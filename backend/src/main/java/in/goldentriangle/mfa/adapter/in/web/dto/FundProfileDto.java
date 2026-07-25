package in.goldentriangle.mfa.adapter.in.web.dto;

import java.time.Instant;

public record FundProfileDto(
        String fundName,
        String amc,
        String category,
        String benchmarkName,
        String planType,
        String optionType,
        String launchDate,
        double fundAgeYears,
        String fundManager,
        Double expenseRatio,
        String exitLoad,
        String minimumInvestment,
        String aum,
        double latestNav,
        String riskometer,
        String sebiRiskCategory,
        String overallRatingLabel,
        int overallRatingStars,
        Instant dataFrom,
        Instant dataTo) {
}
