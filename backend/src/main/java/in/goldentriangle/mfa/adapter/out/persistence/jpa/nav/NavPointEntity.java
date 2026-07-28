package in.goldentriangle.mfa.adapter.out.persistence.jpa.nav;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "nav_point")
public class NavPointEntity {

    @EmbeddedId
    private NavPointId id;

    @Column(nullable = false)
    private double nav;

    public NavPointId getId() {
        return id;
    }

    public void setId(NavPointId id) {
        this.id = id;
    }

    public double getNav() {
        return nav;
    }

    public void setNav(double nav) {
        this.nav = nav;
    }
}
