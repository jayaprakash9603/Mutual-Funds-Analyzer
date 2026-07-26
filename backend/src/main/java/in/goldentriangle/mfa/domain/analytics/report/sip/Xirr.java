package in.goldentriangle.mfa.domain.analytics.report.sip;

import java.util.List;

public final class Xirr {

    private static final double TOLERANCE = 1e-7;
    private static final int MAX_ITERATIONS = 100;
    private static final double DAYS_PER_YEAR = 365.25;

    private Xirr() {
    }

    public static double compute(List<CashFlow> flows) {
        if (flows.size() < 2) {
            return 0;
        }
        double low = -0.99;
        double high = 10;
        double npvLow = npv(flows, low);
        double npvHigh = npv(flows, high);
        if (npvLow * npvHigh > 0) {
            return 0;
        }
        for (int i = 0; i < MAX_ITERATIONS; i++) {
            double mid = (low + high) / 2;
            double npvMid = npv(flows, mid);
            if (Math.abs(npvMid) < TOLERANCE) {
                return mid * 100;
            }
            if (npvLow * npvMid < 0) {
                high = mid;
                npvHigh = npvMid;
            } else {
                low = mid;
                npvLow = npvMid;
            }
        }
        return ((low + high) / 2) * 100;
    }

    private static double npv(List<CashFlow> flows, double rate) {
        long baseDay = flows.get(0).dayOffset();
        double total = 0;
        for (CashFlow flow : flows) {
            double years = (flow.dayOffset() - baseDay) / DAYS_PER_YEAR;
            total += flow.amount() / Math.pow(1 + rate, years);
        }
        return total;
    }

    public record CashFlow(long dayOffset, double amount) {
    }
}
