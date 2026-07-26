package in.goldentriangle.mfa.adapter.out.persistence.mongo;

import in.goldentriangle.mfa.adapter.out.persistence.MatrixSnapshotRecord;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "matrix_snapshot")
@CompoundIndex(name = "matrix_snapshot_key", def = "{'scheme': 1, 'mode': 1, 'startDate': 1}", unique = true)
public class MatrixSnapshotDocument implements MatrixSnapshotRecord {

    @Id
    private String id;
    private String scheme;
    private String mode;
    private String startDate;
    private String matrixJson;
    private Instant watermarkNavDate;
    private Instant computedAt;
    private long version;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    @Override
    public String getScheme() {
        return scheme;
    }

    @Override
    public void setScheme(String scheme) {
        this.scheme = scheme;
    }

    @Override
    public String getMode() {
        return mode;
    }

    @Override
    public void setMode(String mode) {
        this.mode = mode;
    }

    @Override
    public String getStartDate() {
        return startDate;
    }

    @Override
    public void setStartDate(String startDate) {
        this.startDate = startDate;
    }

    @Override
    public String getMatrixJson() {
        return matrixJson;
    }

    @Override
    public void setMatrixJson(String matrixJson) {
        this.matrixJson = matrixJson;
    }

    @Override
    public Instant getWatermarkNavDate() {
        return watermarkNavDate;
    }

    @Override
    public void setWatermarkNavDate(Instant watermarkNavDate) {
        this.watermarkNavDate = watermarkNavDate;
    }

    @Override
    public Instant getComputedAt() {
        return computedAt;
    }

    @Override
    public void setComputedAt(Instant computedAt) {
        this.computedAt = computedAt;
    }

    @Override
    public long getVersion() {
        return version;
    }

    @Override
    public void setVersion(long version) {
        this.version = version;
    }
}
