package in.goldentriangle.mfa.adapter.out.persistence.jpa.sync;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.Version;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(
        name = "nav_upstream_sync_attempt",
        uniqueConstraints = @UniqueConstraint(columnNames = {"scheme_code", "source", "sync_date"}))
public class NavUpstreamSyncAttemptEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "scheme_code", nullable = false)
    private int schemeCode;

    @Column(nullable = false, length = 32)
    private String source;

    @Column(name = "sync_date", nullable = false)
    private LocalDate syncDate;

    @Column(name = "attempt_count", nullable = false)
    private int attemptCount;

    @Column(name = "last_attempt_at")
    private Instant lastAttemptAt;

    @Column(nullable = false, length = 16)
    private String status;

    @Column(name = "last_error", length = 512)
    private String lastError;

    @Version
    private long version;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public int getSchemeCode() {
        return schemeCode;
    }

    public void setSchemeCode(int schemeCode) {
        this.schemeCode = schemeCode;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public LocalDate getSyncDate() {
        return syncDate;
    }

    public void setSyncDate(LocalDate syncDate) {
        this.syncDate = syncDate;
    }

    public int getAttemptCount() {
        return attemptCount;
    }

    public void setAttemptCount(int attemptCount) {
        this.attemptCount = attemptCount;
    }

    public Instant getLastAttemptAt() {
        return lastAttemptAt;
    }

    public void setLastAttemptAt(Instant lastAttemptAt) {
        this.lastAttemptAt = lastAttemptAt;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getLastError() {
        return lastError;
    }

    public void setLastError(String lastError) {
        this.lastError = lastError;
    }

    public long getVersion() {
        return version;
    }

    public void setVersion(long version) {
        this.version = version;
    }
}
