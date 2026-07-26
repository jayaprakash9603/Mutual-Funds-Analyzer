package in.goldentriangle.mfa.adapter.out.persistence.record;

import java.time.Instant;

public interface FundReportSnapshotRecord {
    String getScheme();

    void setScheme(String scheme);

    String getStartDate();

    void setStartDate(String startDate);

    String getReportJson();

    void setReportJson(String reportJson);

    Instant getWatermarkNavDate();

    void setWatermarkNavDate(Instant watermarkNavDate);

    Instant getComputedAt();

    void setComputedAt(Instant computedAt);

    int getSchemaVersion();

    void setSchemaVersion(int schemaVersion);

    long getVersion();

    void setVersion(long version);
}
