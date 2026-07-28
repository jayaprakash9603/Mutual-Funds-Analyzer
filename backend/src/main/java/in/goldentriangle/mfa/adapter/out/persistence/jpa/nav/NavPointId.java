package in.goldentriangle.mfa.adapter.out.persistence.jpa.nav;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;
import java.time.LocalDate;
import java.util.Objects;

@Embeddable
public class NavPointId implements Serializable {

    @Column(name = "scheme_code", nullable = false)
    private int schemeCode;

    @Column(nullable = false, length = 16)
    private String series;

    @Column(name = "nav_date", nullable = false)
    private LocalDate navDate;

    public NavPointId() {
    }

    public NavPointId(int schemeCode, String series, LocalDate navDate) {
        this.schemeCode = schemeCode;
        this.series = series;
        this.navDate = navDate;
    }

    public int getSchemeCode() {
        return schemeCode;
    }

    public void setSchemeCode(int schemeCode) {
        this.schemeCode = schemeCode;
    }

    public String getSeries() {
        return series;
    }

    public void setSeries(String series) {
        this.series = series;
    }

    public LocalDate getNavDate() {
        return navDate;
    }

    public void setNavDate(LocalDate navDate) {
        this.navDate = navDate;
    }

    @Override
    public boolean equals(Object object) {
        if (this == object) {
            return true;
        }
        if (!(object instanceof NavPointId that)) {
            return false;
        }
        return schemeCode == that.schemeCode
                && Objects.equals(series, that.series)
                && Objects.equals(navDate, that.navDate);
    }

    @Override
    public int hashCode() {
        return Objects.hash(schemeCode, series, navDate);
    }
}
