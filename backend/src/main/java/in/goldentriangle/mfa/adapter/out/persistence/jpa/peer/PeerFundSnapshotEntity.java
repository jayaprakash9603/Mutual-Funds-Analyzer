package in.goldentriangle.mfa.adapter.out.persistence.jpa.peer;

import in.goldentriangle.mfa.adapter.out.persistence.record.PeerFundSnapshotRecord;
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
        name = "peer_fund_snapshot",
        uniqueConstraints = @UniqueConstraint(columnNames = {"scheme", "start_date"}))
public class PeerFundSnapshotEntity implements PeerFundSnapshotRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 512)
    private String scheme;

    @Column(name = "start_date", nullable = false, length = 32)
    private String startDate;

    @Column(name = "payload_json", nullable = false, columnDefinition = "CLOB")
    private String payloadJson;

    @Column(name = "watermark_nav_date")
    private Instant watermarkNavDate;

    @Column(name = "computed_at", nullable = false)
    private Instant computedAt;

    @Column(name = "schema_version", nullable = false)
    private int schemaVersion;

    @Version
    private long version;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
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
    public String getStartDate() {
        return startDate;
    }

    @Override
    public void setStartDate(String startDate) {
        this.startDate = startDate;
    }

    @Override
    public String getPayloadJson() {
        return payloadJson;
    }

    @Override
    public void setPayloadJson(String payloadJson) {
        this.payloadJson = payloadJson;
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
    public int getSchemaVersion() {
        return schemaVersion;
    }

    @Override
    public void setSchemaVersion(int schemaVersion) {
        this.schemaVersion = schemaVersion;
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
