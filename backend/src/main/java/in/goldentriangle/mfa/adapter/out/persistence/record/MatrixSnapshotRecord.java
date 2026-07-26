package in.goldentriangle.mfa.adapter.out.persistence.record;

import java.time.Instant;

public interface MatrixSnapshotRecord {
    String getScheme();

    void setScheme(String scheme);

    String getMode();

    void setMode(String mode);

    String getStartDate();

    void setStartDate(String startDate);

    String getMatrixJson();

    void setMatrixJson(String matrixJson);

    Instant getWatermarkNavDate();

    void setWatermarkNavDate(Instant watermarkNavDate);

    Instant getComputedAt();

    void setComputedAt(Instant computedAt);

    long getVersion();

    void setVersion(long version);
}
