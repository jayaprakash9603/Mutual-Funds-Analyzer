package in.goldentriangle.mfa.domain.analytics.report.sip;

import in.goldentriangle.mfa.domain.analytics.report.core.NavLookup;
import in.goldentriangle.mfa.domain.analytics.report.returns.CalendarMath;
import in.goldentriangle.mfa.domain.analytics.report.tax.TaxCalculator;
import in.goldentriangle.mfa.domain.model.NavPoint;
import in.goldentriangle.mfa.domain.model.report.NavHistory;
import in.goldentriangle.mfa.domain.model.report.investment.SipReport;
import in.goldentriangle.mfa.domain.model.report.investment.TaxReport;

import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class SipCalculator {

    private static final List<Integer> AMOUNTS = List.of(500, 1_000, 5_000, 10_000, 25_000);
    private static final int PROJECTION_YEARS = 10;
    private static final double MILLIS_PER_DAY = 24 * 60 * 60 * 1000d;
    private static final double LTCG_HOLDING_YEARS = 1;

    private final TaxCalculator taxCalculator;

    public SipCalculator(TaxCalculator taxCalculator) {
        this.taxCalculator = taxCalculator;
    }

    public SipReport compute(NavHistory history) {
        List<NavPoint> nav = history.fundNav();
        if (nav.size() < 2) {
            return new SipReport(List.of());
        }

        NavPoint end = nav.get(nav.size() - 1);
        Instant start = nav.get(0).date();
        double years = CalendarMath.yearsBetweenMillis(start.toEpochMilli(), end.date().toEpochMilli());
        List<Instalment> schedule = buildSchedule(nav, start, end.date());
        if (schedule.isEmpty()) {
            return new SipReport(List.of());
        }

        List<SipReport.SipScenario> scenarios = new ArrayList<>();
        for (int amount : AMOUNTS) {
            scenarios.add(buildScenario(amount, schedule, end, years));
        }
        return new SipReport(scenarios);
    }

    /** One purchase per month at the nearest available NAV, shared by every instalment size. */
    private List<Instalment> buildSchedule(List<NavPoint> nav, Instant start, Instant end) {
        List<Instalment> schedule = new ArrayList<>();
        Instant cursor = start;
        while (!cursor.isAfter(end)) {
            Optional<NavPoint> point = NavLookup.nearest(nav, cursor);
            if (point.isPresent() && point.get().nav() > 0) {
                schedule.add(new Instalment(point.get().date(), point.get().nav()));
            }
            cursor = cursor.atZone(ZoneOffset.UTC).plusMonths(1).toInstant();
        }
        return schedule;
    }

    private SipReport.SipScenario buildScenario(
            int amount, List<Instalment> schedule, NavPoint end, double years) {
        long baseDay = (long) (schedule.get(0).date().toEpochMilli() / MILLIS_PER_DAY);
        long endDay = (long) (end.date().toEpochMilli() / MILLIS_PER_DAY);

        List<Xirr.CashFlow> flows = new ArrayList<>(schedule.size() + 1);
        double units = 0;
        double invested = 0;
        double shortTermGain = 0;
        double longTermGain = 0;

        for (Instalment instalment : schedule) {
            double lotUnits = amount / instalment.nav();
            units += lotUnits;
            invested += amount;
            flows.add(new Xirr.CashFlow(
                    (long) (instalment.date().toEpochMilli() / MILLIS_PER_DAY) - baseDay, -amount));

            double lotGain = lotUnits * end.nav() - amount;
            if (instalment.heldYearsUntil(end.date()) >= LTCG_HOLDING_YEARS) {
                longTermGain += lotGain;
            } else {
                shortTermGain += lotGain;
            }
        }

        double currentValue = units * end.nav();
        flows.add(new Xirr.CashFlow(endDay - baseDay, currentValue));
        double xirr = Xirr.compute(flows);

        TaxReport tax = taxCalculator.computeFromSplitGains(shortTermGain, longTermGain, invested);
        double postTaxXirr = postTaxXirr(flows, currentValue - tax.stcg() - tax.ltcg());

        return new SipReport.SipScenario(
                amount,
                currentValue,
                currentValue - invested,
                xirr,
                invested,
                currentValue * Math.pow(1 + xirr / 100, PROJECTION_YEARS - years),
                tax.stcg(),
                tax.ltcg(),
                postTaxXirr);
    }

    /** Same instalment flows, but the redemption is reduced by the capital-gains tax due. */
    private double postTaxXirr(List<Xirr.CashFlow> flows, double postTaxValue) {
        List<Xirr.CashFlow> postTaxFlows = new ArrayList<>(flows);
        Xirr.CashFlow redemption = postTaxFlows.remove(postTaxFlows.size() - 1);
        postTaxFlows.add(new Xirr.CashFlow(redemption.dayOffset(), postTaxValue));
        return Xirr.compute(postTaxFlows);
    }

    private record Instalment(Instant date, double nav) {

        double heldYearsUntil(Instant end) {
            return CalendarMath.yearsBetweenMillis(date.toEpochMilli(), end.toEpochMilli());
        }
    }
}
