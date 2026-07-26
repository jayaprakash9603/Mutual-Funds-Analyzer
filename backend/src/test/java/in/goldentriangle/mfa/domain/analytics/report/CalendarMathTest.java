package in.goldentriangle.mfa.domain.analytics.report;

import in.goldentriangle.mfa.domain.analytics.report.returns.CalendarMath;
import in.goldentriangle.mfa.domain.model.NavPoint;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CalendarMathTest {

    @Test
    void cagrDoublesInTenYears() {
        double cagr = CalendarMath.cagr(100, 200, 10);
        assertEquals(7.18, cagr, 0.1);
    }

    @Test
    void moneyMultiplied() {
        assertEquals(2.5, CalendarMath.moneyMultiplied(100, 250), 0.001);
    }
}
