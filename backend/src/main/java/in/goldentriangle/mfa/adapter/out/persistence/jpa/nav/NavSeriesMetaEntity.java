package in.goldentriangle.mfa.adapter.out.persistence.jpa.nav;

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
        name = "nav_series_meta",
        uniqueConstraints = @UniqueConstraint(columnNames = {"scheme_code"}))
public class NavSeriesMetaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "scheme_code", nullable = false)
    private int schemeCode;

    @Column(nullable = false, length = 512)
    private String scheme;

    @Column(name = "fund_name", nullable = false, length = 512)
    private String fundName = "";

    @Column(name = "benchmark_name", nullable = false, length = 512)
    private String benchmarkName = "";

    @Column(nullable = false, length = 256)
    private String category = "";

    @Column(nullable = false, length = 256)
    private String amc = "";

    @Column(name = "first_nav_date")
    private Instant firstNavDate;

    @Column(name = "watermark_nav_date")
    private Instant watermarkNavDate;

    @Column(name = "benchmark_watermark_nav_date")
    private Instant benchmarkWatermarkNavDate;

    @Column(name = "refreshed_at", nullable = false)
    private Instant refreshedAt;

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

    public String getScheme() {
        return scheme;
    }

    public void setScheme(String scheme) {
        this.scheme = scheme;
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

    public String getAmc() {
        return amc;
    }

    public void setAmc(String amc) {
        this.amc = amc;
    }

    public Instant getFirstNavDate() {
        return firstNavDate;
    }

    public void setFirstNavDate(Instant firstNavDate) {
        this.firstNavDate = firstNavDate;
    }

    public Instant getWatermarkNavDate() {
        return watermarkNavDate;
    }

    public void setWatermarkNavDate(Instant watermarkNavDate) {
        this.watermarkNavDate = watermarkNavDate;
    }

    public Instant getBenchmarkWatermarkNavDate() {
        return benchmarkWatermarkNavDate;
    }

    public void setBenchmarkWatermarkNavDate(Instant benchmarkWatermarkNavDate) {
        this.benchmarkWatermarkNavDate = benchmarkWatermarkNavDate;
    }

    public Instant getRefreshedAt() {
        return refreshedAt;
    }

    public void setRefreshedAt(Instant refreshedAt) {
        this.refreshedAt = refreshedAt;
    }

    public long getVersion() {
        return version;
    }

    public void setVersion(long version) {
        this.version = version;
    }
}
