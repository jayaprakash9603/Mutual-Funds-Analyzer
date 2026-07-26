package in.goldentriangle.mfa.adapter.out.persistence.jpa.rolling;

import in.goldentriangle.mfa.domain.model.Period;
import in.goldentriangle.mfa.adapter.out.persistence.record.RollingAggregateRecord;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.Version;

import java.time.Instant;

@Entity
@Table(
        name = "rolling_aggregate",
        uniqueConstraints = @UniqueConstraint(columnNames = {"scheme", "period"}))
public class RollingAggregateEntity implements RollingAggregateRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 512)
    private String scheme;

    @Column(nullable = false, length = 32)
    private String period;

    @Column(name = "fund_name", nullable = false, length = 512)
    private String fundName = "";

    @Column(name = "benchmark_name", nullable = false, length = 512)
    private String benchmarkName = "";

    @Column(nullable = false, length = 256)
    private String category = "";

    @Column(name = "fund_count", nullable = false)
    private long fundCount;

    @Column(name = "fund_mean", nullable = false)
    private double fundMean;

    @Column(name = "fund_m2", nullable = false)
    private double fundM2;

    @Column(name = "fund_min", nullable = false)
    private double fundMin;

    @Column(name = "fund_max", nullable = false)
    private double fundMax;

    @Column(name = "index_count", nullable = false)
    private long indexCount;

    @Column(name = "index_mean", nullable = false)
    private double indexMean;

    @Column(name = "index_m2", nullable = false)
    private double indexM2;

    @Column(name = "index_min", nullable = false)
    private double indexMin;

    @Column(name = "index_max", nullable = false)
    private double indexMax;

    @Column(name = "aligned_count", nullable = false)
    private long alignedCount;

    @Column(name = "fund_win_count", nullable = false)
    private long fundWinCount;

    @Column(name = "watermark_nav_date")
    private Instant watermarkNavDate;

    @Column(name = "computed_at", nullable = false)
    private Instant computedAt;

    @Version
    private long version;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getScheme() {
        return scheme;
    }

    public void setScheme(String scheme) {
        this.scheme = scheme;
    }

    public String getPeriod() {
        return period;
    }

    public void setPeriod(String period) {
        this.period = period;
    }

    public String getFundName() {
        return fundName;
    }

    public void setFundName(String fundName) {
        this.fundName = fundName;
    }

    public String getBenchmarkName() {
        return benchmarkName;
    }

    public void setBenchmarkName(String benchmarkName) {
        this.benchmarkName = benchmarkName;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public long getFundCount() {
        return fundCount;
    }

    public void setFundCount(long fundCount) {
        this.fundCount = fundCount;
    }

    public double getFundMean() {
        return fundMean;
    }

    public void setFundMean(double fundMean) {
        this.fundMean = fundMean;
    }

    public double getFundM2() {
        return fundM2;
    }

    public void setFundM2(double fundM2) {
        this.fundM2 = fundM2;
    }

    public double getFundMin() {
        return fundMin;
    }

    public void setFundMin(double fundMin) {
        this.fundMin = fundMin;
    }

    public double getFundMax() {
        return fundMax;
    }

    public void setFundMax(double fundMax) {
        this.fundMax = fundMax;
    }

    public long getIndexCount() {
        return indexCount;
    }

    public void setIndexCount(long indexCount) {
        this.indexCount = indexCount;
    }

    public double getIndexMean() {
        return indexMean;
    }

    public void setIndexMean(double indexMean) {
        this.indexMean = indexMean;
    }

    public double getIndexM2() {
        return indexM2;
    }

    public void setIndexM2(double indexM2) {
        this.indexM2 = indexM2;
    }

    public double getIndexMin() {
        return indexMin;
    }

    public void setIndexMin(double indexMin) {
        this.indexMin = indexMin;
    }

    public double getIndexMax() {
        return indexMax;
    }

    public void setIndexMax(double indexMax) {
        this.indexMax = indexMax;
    }

    public long getAlignedCount() {
        return alignedCount;
    }

    public void setAlignedCount(long alignedCount) {
        this.alignedCount = alignedCount;
    }

    public long getFundWinCount() {
        return fundWinCount;
    }

    public void setFundWinCount(long fundWinCount) {
        this.fundWinCount = fundWinCount;
    }

    public Instant getWatermarkNavDate() {
        return watermarkNavDate;
    }

    public void setWatermarkNavDate(Instant watermarkNavDate) {
        this.watermarkNavDate = watermarkNavDate;
    }

    public Instant getComputedAt() {
        return computedAt;
    }

    public void setComputedAt(Instant computedAt) {
        this.computedAt = computedAt;
    }

    public long getVersion() {
        return version;
    }

    public void setVersion(long version) {
        this.version = version;
    }
}
