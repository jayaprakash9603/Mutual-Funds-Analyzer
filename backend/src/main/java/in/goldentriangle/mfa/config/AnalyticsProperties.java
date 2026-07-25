package in.goldentriangle.mfa.config;

import in.goldentriangle.mfa.domain.model.Period;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

@ConfigurationProperties(prefix = "analytics")
public class AnalyticsProperties {

    private static final double DEFAULT_RISK_FREE_RATE = 0.06;
    private static final int DEFAULT_TRADING_DAYS = 252;
    private static final int DEFAULT_REFRESH_AFTER_DAYS = 7;
    private static final int DEFAULT_MATRIX_POOL_SIZE = 6;
    private static final int DEFAULT_MATRIX_QUEUE_CAPACITY = 24;

    private double riskFreeRate = DEFAULT_RISK_FREE_RATE;
    private int tradingDays = DEFAULT_TRADING_DAYS;
    private Duration refreshAfter = Duration.ofDays(DEFAULT_REFRESH_AFTER_DAYS);
    private List<String> matrixPeriods = new ArrayList<>(Period.allLabels());
    private int matrixPoolSize = DEFAULT_MATRIX_POOL_SIZE;
    private int matrixQueueCapacity = DEFAULT_MATRIX_QUEUE_CAPACITY;

    public double riskFreeRate() {
        return riskFreeRate;
    }

    public void setRiskFreeRate(double riskFreeRate) {
        this.riskFreeRate = riskFreeRate;
    }

    public int tradingDays() {
        return tradingDays;
    }

    public void setTradingDays(int tradingDays) {
        this.tradingDays = tradingDays;
    }

    public Duration refreshAfter() {
        return refreshAfter;
    }

    public void setRefreshAfter(Duration refreshAfter) {
        this.refreshAfter = refreshAfter;
    }

    public List<String> matrixPeriods() {
        return matrixPeriods;
    }

    public void setMatrixPeriods(List<String> matrixPeriods) {
        this.matrixPeriods = matrixPeriods;
    }

    public int matrixPoolSize() {
        return matrixPoolSize;
    }

    public void setMatrixPoolSize(int matrixPoolSize) {
        this.matrixPoolSize = matrixPoolSize;
    }

    public int matrixQueueCapacity() {
        return matrixQueueCapacity;
    }

    public void setMatrixQueueCapacity(int matrixQueueCapacity) {
        this.matrixQueueCapacity = matrixQueueCapacity;
    }
}
