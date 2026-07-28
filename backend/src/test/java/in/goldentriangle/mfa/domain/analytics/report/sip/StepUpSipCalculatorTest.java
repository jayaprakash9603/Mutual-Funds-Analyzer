package in.goldentriangle.mfa.domain.analytics.report.sip;

import in.goldentriangle.mfa.domain.analytics.report.core.NavHistoryAssembler;
import in.goldentriangle.mfa.domain.analytics.report.tax.TaxCalculator;
import in.goldentriangle.mfa.domain.model.RollingReturnRow;
import in.goldentriangle.mfa.domain.model.RollingReturnsData;
import in.goldentriangle.mfa.domain.model.report.investment.StepUpMode;
import in.goldentriangle.mfa.domain.model.report.investment.StepUpSipConfig;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class StepUpSipCalculatorTest {

    private final StepUpSipCalculator calculator = new StepUpSipCalculator(new TaxCalculator());

    @Test
    void resolveInstalmentAmountIncreasesByPercentAnnually() {
        StepUpSipConfig config = new StepUpSipConfig(10_000, 1, StepUpMode.PERCENT, 10, 0);
        assertEquals(10_000, StepUpSipCalculator.resolveInstalmentAmount(10_000, 0, config));
        assertEquals(10_000, StepUpSipCalculator.resolveInstalmentAmount(10_000, 11, config));
        assertEquals(11_000, StepUpSipCalculator.resolveInstalmentAmount(10_000, 12, config));
        assertEquals(12_100, StepUpSipCalculator.resolveInstalmentAmount(10_000, 24, config));
    }

    @Test
    void resolveInstalmentAmountIncreasesByFixedAmountAnnually() {
        StepUpSipConfig config = new StepUpSipConfig(10_000, 1, StepUpMode.FIXED, 0, 2_000);
        assertEquals(10_000, StepUpSipCalculator.resolveInstalmentAmount(10_000, 11, config));
        assertEquals(12_000, StepUpSipCalculator.resolveInstalmentAmount(10_000, 12, config));
        assertEquals(14_000, StepUpSipCalculator.resolveInstalmentAmount(10_000, 24, config));
    }

    @Test
    void simulateReturnsScenarioAndTimeline() {
        StepUpSipConfig config = new StepUpSipConfig(10_000, 1, StepUpMode.PERCENT, 10, 0);
        var simulation = calculator.simulate(sampleHistory(), config);
        assertTrue(simulation.scenario().moneyInvested() > 0);
        assertTrue(simulation.scenario().currentMonthlyAmount() >= 10_000);
        assertFalse(simulation.timeline().isEmpty());
        assertTrue(simulation.timeline().stream().allMatch(point -> point.averageCorpus() > 0));
    }

    @Test
    void computeBuildsPresetScenarios() {
        var report = calculator.compute(sampleHistory());
        assertEquals(5, report.scenarios().size());
        assertFalse(report.timeline().isEmpty());
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
