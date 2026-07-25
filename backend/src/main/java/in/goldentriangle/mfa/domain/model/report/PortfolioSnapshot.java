package in.goldentriangle.mfa.domain.model.report;

import java.util.List;
import java.util.Map;

public record PortfolioSnapshot(
        List<Holding> topHoldings,
        Map<String, Double> sectorAllocation,
        Map<String, Double> marketCapAllocation,
        Map<String, Double> countryAllocation,
        Map<String, Double> assetAllocation,
        Double peRatio,
        Double pbRatio,
        Double dividendYield,
        Double portfolioTurnover,
        Double averageMarketCap) {

    public record Holding(String name, double weight) {
    }
}
