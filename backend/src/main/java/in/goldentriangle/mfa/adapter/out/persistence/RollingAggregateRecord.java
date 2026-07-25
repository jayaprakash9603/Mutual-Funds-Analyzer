package in.goldentriangle.mfa.adapter.out.persistence;

import java.time.Instant;

/**
 * The persisted shape of a rolling aggregate, implemented by both the JPA entity and the Mongo
 * document so the field mapping lives in {@link RollingAggregateMapper} only once. The identifier is
 * deliberately excluded because its type differs per store.
 */
public interface RollingAggregateRecord {

    String getScheme();

    void setScheme(String scheme);

    String getPeriod();

    void setPeriod(String period);

    String getFundName();

    void setFundName(String fundName);

    String getBenchmarkName();

    void setBenchmarkName(String benchmarkName);

    String getCategory();

    void setCategory(String category);

    long getFundCount();

    void setFundCount(long fundCount);

    double getFundMean();

    void setFundMean(double fundMean);

    double getFundM2();

    void setFundM2(double fundM2);

    double getFundMin();

    void setFundMin(double fundMin);

    double getFundMax();

    void setFundMax(double fundMax);

    long getIndexCount();

    void setIndexCount(long indexCount);

    double getIndexMean();

    void setIndexMean(double indexMean);

    double getIndexM2();

    void setIndexM2(double indexM2);

    double getIndexMin();

    void setIndexMin(double indexMin);

    double getIndexMax();

    void setIndexMax(double indexMax);

    long getAlignedCount();

    void setAlignedCount(long alignedCount);

    long getFundWinCount();

    void setFundWinCount(long fundWinCount);

    Instant getWatermarkNavDate();

    void setWatermarkNavDate(Instant watermarkNavDate);

    Instant getComputedAt();

    void setComputedAt(Instant computedAt);

    long getVersion();

    void setVersion(long version);
}
