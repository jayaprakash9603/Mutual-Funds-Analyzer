package in.goldentriangle.mfa.adapter.out.persistence.record;

import java.time.Instant;

public interface FundReportSectionSnapshotRecord {

    String getScheme();

    void setScheme(String scheme);

    String getStartDate();

    void setStartDate(String startDate);

    String getSectionGroup();

    void setSectionGroup(String sectionGroup);

    String getPayloadJson();

    void setPayloadJson(String payloadJson);

    Instant getWatermarkNavDate();

    void setWatermarkNavDate(Instant watermarkNavDate);

    Instant getComputedAt();

    void setComputedAt(Instant computedAt);

    int getSchemaVersion();

    void setSchemaVersion(int schemaVersion);

    long getVersion();

    void setVersion(long version);
}
