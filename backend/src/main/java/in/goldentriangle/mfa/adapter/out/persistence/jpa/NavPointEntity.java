package in.goldentriangle.mfa.adapter.out.persistence.jpa;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.LocalDate;

@Entity
@Table(
        name = "nav_point",
        uniqueConstraints = @UniqueConstraint(columnNames = {"scheme_code", "series", "nav_date"}))
public class NavPointEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "scheme_code", nullable = false)
    private int schemeCode;

    @Column(nullable = false, length = 16)
    private String series;

    @Column(name = "nav_date", nullable = false)
    private LocalDate navDate;

    @Column(nullable = false)
    private double nav;

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

    public double getNav() {
        return nav;
    }

    public void setNav(double nav) {
        this.nav = nav;
    }
}
