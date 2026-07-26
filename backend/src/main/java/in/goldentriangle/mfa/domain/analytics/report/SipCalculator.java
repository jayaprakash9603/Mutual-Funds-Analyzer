package in.goldentriangle.mfa.domain.analytics.report;

import in.goldentriangle.mfa.domain.model.NavPoint;
import in.goldentriangle.mfa.domain.model.report.NavHistory;
import in.goldentriangle.mfa.domain.model.report.SipReport;
import in.goldentriangle.mfa.domain.model.report.TaxReport;

import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class SipCalculator {

    private static final List<Integer> AMOUNTS = List.of(500, 1_000, 5_000, 10_000, 25_000);
    private static final int PROJECTION_YEARS = 10;

    private final TaxCalculator taxCalculator;

    public SipCalculator(TaxCalculator taxCalculator) {
        this.taxCalculator = taxCalculator;
    }

    public SipReport compute(NavHistory history) {
        List<NavPoint> nav = history.fundNav();
        if (nav.size() < 2) {
            return new SipReport(List.of());
        }

        List<SipReport.SipScenario> scenarios = new ArrayList<>();
        NavPoint end = nav.get(nav.size() - 1);
        Instant start = nav.get(0).date();
        double years = CalendarMath.yearsBetweenMillis(start.toEpochMilli(), end.date().toEpochMilli());

        for (int amount : AMOUNTS) {
            List<Xirr.CashFlow> flows = new ArrayList<>();
            long baseDay = start.toEpochMilli() / (24 * 60 * 60 * 1000);
            double units = 0;
            double invested = 0;
            Instant cursor = start;
            while (!cursor.isAfter(end.date())) {
                Optional<NavPoint> point = NavLookup.nearest(nav, cursor);
                if (point.isPresent() && point.get().nav() > 0) {
                    units += amount / point.get().nav();
                    invested += amount;
                    long day = point.get().date().toEpochMilli() / (24 * 60 * 60 * 1000);
                    flows.add(new Xirr.CashFlow(day - baseDay, -amount));
                }
                cursor = cursor.atZone(ZoneOffset.UTC).plusMonths(1).toInstant();
            }
            double currentValue = units * end.nav();
            long endDay = end.date().toEpochMilli() / (24 * 60 * 60 * 1000);
            flows.add(new Xirr.CashFlow(endDay - baseDay, currentValue));
            double xirr = Xirr.compute(flows);

            double projected = currentValue * Math.pow(1 + xirr / 100, PROJECTION_YEARS - years);
            double gain = currentValue - invested;
            TaxReport tax = taxCalculator.computeFromGain(gain, invested, years);

            scenarios.add(new SipReport.SipScenario(
                    amount,
                    currentValue,
                    gain,
                    xirr,
                    invested,
                    projected,
                    tax.stcg(),
                    tax.ltcg(),
                    tax.postTaxReturn()));
        }
        return new SipReport(scenarios);
    }
}
