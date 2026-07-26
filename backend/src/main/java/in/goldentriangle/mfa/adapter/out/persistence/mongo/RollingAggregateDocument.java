package in.goldentriangle.mfa.adapter.out.persistence.mongo;

import in.goldentriangle.mfa.domain.model.Period;
import in.goldentriangle.mfa.adapter.out.persistence.record.RollingAggregateRecord;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "rolling_aggregate")
public class RollingAggregateDocument implements RollingAggregateRecord {

    @Id
    private String id;
    private String scheme;
    private String period;
    private String fundName = "";
    private String benchmarkName = "";
    private String category = "";
    private long fundCount;
    private double fundMean;
    private double fundM2;
    private double fundMin;
    private double fundMax;
    private long indexCount;
    private double indexMean;
    private double indexM2;
    private double indexMin;
    private double indexMax;
    private long alignedCount;
    private long fundWinCount;
    private Instant watermarkNavDate;
    private Instant computedAt;
    private long version;

    public String getId() {
        return id;
    }

    public void setId(String id) {
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
