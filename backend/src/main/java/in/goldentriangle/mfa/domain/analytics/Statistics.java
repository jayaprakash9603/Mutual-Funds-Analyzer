package in.goldentriangle.mfa.domain.analytics;

import java.util.List;

public final class Statistics {

    private Statistics() {
    }

    public static double mean(List<Double> values) {
        if (values.isEmpty()) {
            return 0;
        }
        return values.stream().mapToDouble(Double::doubleValue).sum() / values.size();
    }

    public static double variance(List<Double> values) {
        if (values.size() < 2) {
            return 0;
        }
        double avg = mean(values);
        return values.stream().mapToDouble(v -> (v - avg) * (v - avg)).sum() / values.size();
    }

    public static double stdDev(List<Double> values) {
        return Math.sqrt(variance(values));
    }

    public static double covariance(List<Double> a, List<Double> b) {
        if (a.size() != b.size() || a.isEmpty()) {
            return 0;
        }
        double meanA = mean(a);
        double meanB = mean(b);
        double sum = 0;
        for (int i = 0; i < a.size(); i++) {
            sum += (a.get(i) - meanA) * (b.get(i) - meanB);
        }
        return sum / a.size();
    }

    public static double median(List<Double> values) {
        if (values.isEmpty()) {
            return 0;
        }
        List<Double> sorted = values.stream().sorted().toList();
        int mid = sorted.size() / 2;
        if (sorted.size() % 2 != 0) {
            return sorted.get(mid);
        }
        return (sorted.get(mid - 1) + sorted.get(mid)) / 2;
    }
}
