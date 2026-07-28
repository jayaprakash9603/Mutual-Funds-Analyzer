package in.goldentriangle.mfa.domain.analytics.report.sip;

import in.goldentriangle.mfa.domain.analytics.report.core.NavHistoryAssembler;
import in.goldentriangle.mfa.domain.model.RollingReturnRow;
import in.goldentriangle.mfa.domain.model.RollingReturnsData;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class StpCalculatorTest {

    private final StpCalculator calculator = new StpCalculator();

    @Test
    void simulateBuildsDualFundTimeline() {
        var simulation = calculator.simulate(
                liquidHistory(),
                equityHistory(),
                6_00_000,
                1_00_000,
                6,
                1);

        assertNotNull(simulation.scenario());
        assertFalse(simulation.timeline().isEmpty());
        assertTrue(simulation.scenario().totalValue() > 0);
        assertTrue(simulation.timeline().stream().allMatch(point -> point.totalValue() > 0));
    }

    @Test
    void simulateTracksSourceAndTargetCorpus() {
        var simulation = calculator.simulate(
                liquidHistory(),
                equityHistory(),
                6_00_000,
                1_00_000,
                6,
                1);

        var last = simulation.timeline().get(simulation.timeline().size() - 1);
        assertTrue(last.sourceCorpus() >= 0);
        assertTrue(last.targetCorpus() >= 0);
        assertTrue(Math.abs(last.totalValue() - (last.sourceCorpus() + last.targetCorpus())) < 0.01);
    }

    private static in.goldentriangle.mfa.domain.model.report.NavHistory liquidHistory() {
        List<RollingReturnRow> fund = List.of(
                new RollingReturnRow(1, "AMC", "Liquid", "Liquid Fund", "5 Year",
                        "2010-01-01", 1000, "2015-01-01", 1100, 2),
                new RollingReturnRow(2, "AMC", "Liquid", "Liquid Fund", "5 Year",
                        "2011-01-01", 1005, "2016-01-01", 1105, 2),
                new RollingReturnRow(3, "AMC", "Liquid", "Liquid Fund", "5 Year",
                        "2012-01-01", 1010, "2017-01-01", 1110, 2));
        List<RollingReturnRow> bench = List.of(
                new RollingReturnRow(4, "Idx", "Index", "Nifty TRI", "5 Year",
                        "2010-01-01", 100, "2015-01-01", 180, 12));
        return NavHistoryAssembler.assemble("Liquid Fund", new RollingReturnsData(fund, bench), "01-01-2010");
    }

    private static in.goldentriangle.mfa.domain.model.report.NavHistory equityHistory() {
        List<RollingReturnRow> fund = List.of(
                new RollingReturnRow(5, "AMC", "Flexi Cap", "Equity Fund", "5 Year",
                        "2010-01-01", 100, "2015-01-01", 200, 15),
                new RollingReturnRow(6, "AMC", "Flexi Cap", "Equity Fund", "5 Year",
                        "2011-01-01", 110, "2016-01-01", 220, 16),
                new RollingReturnRow(7, "AMC", "Flexi Cap", "Equity Fund", "5 Year",
                        "2012-01-01", 120, "2017-01-01", 240, 17));
        List<RollingReturnRow> bench = List.of(
                new RollingReturnRow(8, "Idx", "Index", "Nifty TRI", "5 Year",
                        "2010-01-01", 100, "2015-01-01", 180, 12));
        return NavHistoryAssembler.assemble("Equity Fund", new RollingReturnsData(fund, bench), "01-01-2010");
    }
}
