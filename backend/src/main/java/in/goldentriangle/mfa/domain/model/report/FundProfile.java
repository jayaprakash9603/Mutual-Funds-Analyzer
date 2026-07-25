package in.goldentriangle.mfa.domain.model.report;

import java.time.Instant;
import java.util.Optional;

public record FundProfile(
        String fundName,
        String amc,
        String category,
        String benchmarkName,
        Optional<String> planType,
        Optional<String> optionType,
        Optional<String> launchDate,
        double fundAgeYears,
        Optional<String> fundManager,
        Optional<Double> expenseRatio,
        Optional<String> exitLoad,
        Optional<String> minimumInvestment,
        Optional<String> aum,
        double latestNav,
        Optional<String> riskometer,
        Optional<String> sebiRiskCategory,
        String overallRatingLabel,
        int overallRatingStars,
        Instant dataFrom,
        Instant dataTo) {
}
