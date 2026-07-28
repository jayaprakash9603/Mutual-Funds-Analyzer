package in.goldentriangle.mfa.domain.analytics.report.sip;

import in.goldentriangle.mfa.domain.analytics.report.core.NavHistoryAssembler;
import in.goldentriangle.mfa.domain.analytics.report.tax.TaxCalculator;
import in.goldentriangle.mfa.domain.model.RollingReturnRow;
import in.goldentriangle.mfa.domain.model.RollingReturnsData;
import in.goldentriangle.mfa.domain.model.report.investment.SipReport;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SipCalculatorTest {

    private final SipCalculator calculator = new SipCalculator(new TaxCalculator());

    @Test
    void computeIncludesTimelineForDefaultChartAmount() {
        SipReport report = calculator.compute(sampleHistory());
        assertFalse(report.scenarios().isEmpty());
        assertFalse(report.timeline().isEmpty());
        assertEquals(SipCalculator.DEFAULT_SCHEDULE_DAY, report.scheduleDay());
        assertEquals(SipCalculator.DEFAULT_CHART_AMOUNT, report.chartAmount());
    }

    @Test
    void timelineUsesEveryNavDateAfterFirstInstalment() {
        SipReport report = calculator.compute(sampleHistory());
        assertTrue(report.timeline().size() >= 2, "timeline should include a point per NAV date after SIP starts");
    }

    @Test
    void simulateReturnsScenarioAndTimeline() {
        var simulation = calculator.simulate(sampleHistory(), 10_000, 15);
        assertNotNull(simulation.scenario());
        assertEquals(10_000, simulation.scenario().monthlyAmount());
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
