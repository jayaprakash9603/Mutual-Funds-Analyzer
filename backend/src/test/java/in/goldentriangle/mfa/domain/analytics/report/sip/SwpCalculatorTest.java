package in.goldentriangle.mfa.domain.analytics.report.sip;

import in.goldentriangle.mfa.domain.analytics.report.core.NavHistoryAssembler;
import in.goldentriangle.mfa.domain.analytics.report.tax.TaxCalculator;
import in.goldentriangle.mfa.domain.model.RollingReturnRow;
import in.goldentriangle.mfa.domain.model.RollingReturnsData;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SwpCalculatorTest {

    private final SwpCalculator calculator = new SwpCalculator(new TaxCalculator());

    @Test
    void simulateReturnsScenarioAndTimeline() {
        var simulation = calculator.simulate(sampleHistory(), 10_00_000, 10_000, 1);
        assertNotNull(simulation.scenario());
        assertFalse(simulation.timeline().isEmpty());
        assertTrue(simulation.scenario().totalWithdrawn() > 0);
        assertTrue(simulation.timeline().stream().allMatch(point -> point.averageCorpus() > 0));
    }

    @Test
    void simulateBuildsDailyTimeline() {
        var simulation = calculator.simulate(sampleHistory(), 10_00_000, 10_000, 1);
        assertTrue(simulation.timeline().size() >= 2);
    }

    private static in.goldentriangle.mfa.domain.model.report.NavHistory sampleHistory() {
        List<RollingReturnRow> fund = List.of(
                new RollingReturnRow(1, "AMC", "Flexi Cap", "Test Fund", "5 Year",
                        "2010-01-01", 100, "2015-01-01", 200, 15),
                new RollingReturnRow(2, "AMC", "Flexi Cap", "Test Fund", "5 Year",
                        "2011-01-01", 110, "2016-01-01", 220, 16),
                new RollingReturnRow(3, "AMC", "Flexi Cap", "Test Fund", "5 Year",
                        "2012-01-01", 120, "2017-01-01", 240, 17));
        List<RollingReturnRow> bench = List.of(
                new RollingReturnRow(4, "Idx", "Index", "Nifty TRI", "5 Year",
                        "2010-01-01", 100, "2015-01-01", 180, 12));
        return NavHistoryAssembler.assemble("Test Fund", new RollingReturnsData(fund, bench), "01-01-2010");
    }
}
