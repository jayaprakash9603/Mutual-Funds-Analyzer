package in.goldentriangle.mfa.domain.analytics.report.core;

import in.goldentriangle.mfa.domain.model.FundMetrics;
import in.goldentriangle.mfa.domain.model.GoldenTriangleResult;
import in.goldentriangle.mfa.domain.model.OverallRating;
import in.goldentriangle.mfa.domain.model.report.assessment.InvestorFitReport;
import in.goldentriangle.mfa.domain.model.report.assessment.ProsConsReport;
import in.goldentriangle.mfa.domain.model.report.assessment.RecommendationReport;

import java.util.ArrayList;
import java.util.List;

public class VerdictEngine {

    public ProsConsReport prosCons(GoldenTriangleResult result, FundMetrics metrics) {
        List<String> pros = new ArrayList<>();
        List<String> cons = new ArrayList<>();

        if (metrics.cob() > 70) {
            pros.add("Consistently beats benchmark across rolling windows.");
        }
        if (metrics.fundSharpe() > metrics.benchmarkSharpe()) {
            pros.add("Strong risk-adjusted returns versus benchmark.");
        }
        if (metrics.alpha() > 0) {
            pros.add("Positive alpha indicates manager skill.");
        }
        if (metrics.fundVolatility() < metrics.benchmarkVolatility()) {
            pros.add("Lower volatility than benchmark.");
        }
        if (result.passed()) {
            pros.add("Passes all Golden Triangle criteria.");
        }

        if (metrics.cob() < 50) {
            cons.add("Often underperforms benchmark.");
        }
        if (metrics.maxDrawdown() < -30) {
            cons.add("Experienced significant historical drawdowns.");
        }
        if (metrics.fundAgeYears() < 5) {
            cons.add("Limited track record for long-term assessment.");
        }
        if (metrics.fundVolatility() > 20) {
            cons.add("High volatility — not suitable for short horizons.");
        }
        if (!result.passed()) {
            cons.add("Failed one or more Golden Triangle rules.");
        }

        if (pros.isEmpty()) {
            pros.add("Fund has adequate long-term return history.");
        }
        if (cons.isEmpty()) {
            cons.add("No major red flags identified from available data.");
        }

        return new ProsConsReport(pros, cons);
    }

    public InvestorFitReport investorFit(GoldenTriangleResult result, FundMetrics metrics) {
        List<String> suitable = new ArrayList<>();
        List<String> notSuitable = new ArrayList<>();

        if (metrics.fundAgeYears() >= 5 && result.passCount() >= 2) {
            suitable.add("Long Term");
            suitable.add("Wealth Creation");
            suitable.add("SIP");
        }
        if (metrics.fundVolatility() < 18) {
            suitable.add("Moderate");
            suitable.add("Retirement");
        } else {
            suitable.add("Aggressive");
        }
        if (result.passCount() >= 2) {
            suitable.add("Lump Sum");
        }
        if (metrics.fundAgeYears() >= 10) {
            suitable.add("Beginner");
        }

        if (metrics.fundVolatility() > 22) {
            notSuitable.add("Short investment horizon (< 3 years)");
        }
        if (metrics.fundAgeYears() < 3) {
            notSuitable.add("Conservative investors");
        }

        return new InvestorFitReport(suitable, notSuitable);
    }

    public RecommendationReport recommend(GoldenTriangleResult result, FundMetrics metrics, int qualityScore) {
        String verdict;
        int confidence;

        if (result.overallRating() == OverallRating.PASSED && qualityScore >= 75) {
            verdict = "Strong Buy";
            confidence = 85;
        } else if (result.passCount() >= 2 && qualityScore >= 60) {
            verdict = "Buy";
            confidence = 70;
        } else if (result.passCount() >= 1) {
            verdict = "Hold";
            confidence = 55;
        } else if (qualityScore >= 45) {
            verdict = "Watchlist";
            confidence = 45;
        } else {
            verdict = "Avoid";
            confidence = 65;
        }

        String summary = String.format(
                "%s with %d%% confidence based on Golden Triangle score (%d/3) and quality score (%d/100).",
                verdict,
                confidence,
                result.passCount(),
                qualityScore);

        return new RecommendationReport(verdict, confidence, summary);
    }
}
