package in.goldentriangle.mfa.domain.analytics;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class StatisticsTest {

    @Test
    void meanAndStdDevUsePopulationFormula() {
        List<Double> values = List.of(2.0, 4.0, 4.0, 4.0, 5.0, 5.0, 7.0, 9.0);
        assertEquals(5.0, Statistics.mean(values), 0.0001);
        assertEquals(Math.sqrt(0.75), Statistics.stdDev(List.of(2.0, 4.0, 4.0, 4.0)), 0.0001);
    }

    @Test
    void stdDevReturnsZeroForSingleValue() {
        assertEquals(0, Statistics.stdDev(List.of(3.0)));
    }
}
