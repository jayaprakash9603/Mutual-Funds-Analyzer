package in.goldentriangle.mfa.config.properties;

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
    private static final int DEFAULT_UPSTREAM_POOL_SIZE = 6;
    private static final int DEFAULT_UPSTREAM_QUEUE_CAPACITY = 24;
    private static final int DEFAULT_COMPUTE_QUEUE_CAPACITY = 32;

    private double riskFreeRate = DEFAULT_RISK_FREE_RATE;
    private int tradingDays = DEFAULT_TRADING_DAYS;
    private Duration refreshAfter = Duration.ofDays(DEFAULT_REFRESH_AFTER_DAYS);
    private List<String> matrixPeriods = new ArrayList<>(Period.allLabels());
    private Integer computePoolSize;
    private int computeQueueCapacity = DEFAULT_COMPUTE_QUEUE_CAPACITY;
    private int upstreamPoolSize = DEFAULT_UPSTREAM_POOL_SIZE;
    private int upstreamQueueCapacity = DEFAULT_UPSTREAM_QUEUE_CAPACITY;
    private int matrixPoolSize = DEFAULT_UPSTREAM_POOL_SIZE;
    private int matrixQueueCapacity = DEFAULT_UPSTREAM_QUEUE_CAPACITY;

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

    public int computePoolSize() {
        if (computePoolSize != null && computePoolSize > 0) {
            return computePoolSize;
        }
        return Math.max(2, Runtime.getRuntime().availableProcessors());
    }

    public void setComputePoolSize(Integer computePoolSize) {
        this.computePoolSize = computePoolSize;
    }

    public int computeQueueCapacity() {
        return computeQueueCapacity;
    }

    public void setComputeQueueCapacity(int computeQueueCapacity) {
        this.computeQueueCapacity = computeQueueCapacity;
    }

    public int upstreamPoolSize() {
        return upstreamPoolSize > 0 ? upstreamPoolSize : matrixPoolSize;
    }

    public void setUpstreamPoolSize(int upstreamPoolSize) {
        this.upstreamPoolSize = upstreamPoolSize;
    }

    public int upstreamQueueCapacity() {
        return upstreamQueueCapacity > 0 ? upstreamQueueCapacity : matrixQueueCapacity;
    }

    public void setUpstreamQueueCapacity(int upstreamQueueCapacity) {
        this.upstreamQueueCapacity = upstreamQueueCapacity;
    }

    /** @deprecated use {@link #upstreamPoolSize()} */
    public int matrixPoolSize() {
        return matrixPoolSize;
    }

    /** @deprecated use {@link #setUpstreamPoolSize(int)} */
    public void setMatrixPoolSize(int matrixPoolSize) {
        this.matrixPoolSize = matrixPoolSize;
    }

    /** @deprecated use {@link #upstreamQueueCapacity()} */
    public int matrixQueueCapacity() {
        return matrixQueueCapacity;
    }

    /** @deprecated use {@link #setUpstreamQueueCapacity(int)} */
    public void setMatrixQueueCapacity(int matrixQueueCapacity) {
        this.matrixQueueCapacity = matrixQueueCapacity;
    }
}
