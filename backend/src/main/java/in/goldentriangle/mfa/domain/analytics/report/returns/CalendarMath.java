package in.goldentriangle.mfa.domain.analytics.report.returns;

public final class CalendarMath {

    private static final double DAYS_PER_YEAR = 365.25;
    private static final double PERCENT = 100;

    private CalendarMath() {
    }

    public static double cagr(double startNav, double endNav, double years) {
        if (startNav <= 0 || endNav <= 0 || years <= 0) {
            return 0;
        }
        return (Math.pow(endNav / startNav, 1.0 / years) - 1) * PERCENT;
    }

    public static double absoluteReturn(double startNav, double endNav) {
        if (startNav <= 0) {
            return 0;
        }
        return ((endNav / startNav) - 1) * PERCENT;
    }

    public static double moneyMultiplied(double startNav, double endNav) {
        if (startNav <= 0) {
            return 0;
        }
        return endNav / startNav;
    }

    public static double yearsBetweenMillis(long startMillis, long endMillis) {
        return (endMillis - startMillis) / (DAYS_PER_YEAR * 24 * 60 * 60 * 1000);
    }

    public static double annualiseDailyMean(double dailyMean, int tradingDays) {
        return dailyMean * tradingDays;
    }

    public static double annualiseDailyVolatility(double dailyStdDev, int tradingDays) {
        return dailyStdDev * Math.sqrt(tradingDays);
    }
}
