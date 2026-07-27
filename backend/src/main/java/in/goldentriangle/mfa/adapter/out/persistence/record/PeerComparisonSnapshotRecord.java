package in.goldentriangle.mfa.adapter.out.persistence.record;

import java.time.Instant;

public interface PeerComparisonSnapshotRecord {

    String getScheme();

    void setScheme(String scheme);

    String getCategory();

    void setCategory(String category);

    String getStartDate();

    void setStartDate(String startDate);

    String getPeerSchemesJson();

    void setPeerSchemesJson(String peerSchemesJson);

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
