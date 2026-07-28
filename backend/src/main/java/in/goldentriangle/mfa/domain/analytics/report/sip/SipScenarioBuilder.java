package in.goldentriangle.mfa.domain.analytics.report.sip;

import in.goldentriangle.mfa.domain.analytics.report.tax.TaxCalculator;
import in.goldentriangle.mfa.domain.model.NavPoint;
import in.goldentriangle.mfa.domain.model.report.investment.SipTimelinePoint;
import in.goldentriangle.mfa.domain.model.report.investment.TaxReport;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.function.IntUnaryOperator;

public final class SipScenarioBuilder {

    private static final int PROJECTION_YEARS = 10;
    private static final double MILLIS_PER_DAY = 24 * 60 * 60 * 1000d;
    private static final double LTCG_HOLDING_YEARS = 1;
    private static final DateTimeFormatter ISO_DATE = DateTimeFormatter.ISO_LOCAL_DATE;

    private SipScenarioBuilder() {
    }

    public record ScenarioMetrics(
            double invested,
            double currentValue,
            double totalGain,
            double xirr,
            double projectedValue10Y,
            double stcg,
            double ltcg,
            double postTaxXirr,
            int instalmentCount,
            int currentMonthlyAmount) {
    }

    public static ScenarioMetrics computeMetrics(
            List<SipInstalment> schedule,
            NavPoint end,
            double years,
            IntUnaryOperator amountForInstalment,
            TaxCalculator taxCalculator) {
        if (schedule.isEmpty()) {
            return new ScenarioMetrics(0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
        }

        long baseDay = (long) (schedule.get(0).date().toEpochMilli() / MILLIS_PER_DAY);
        long endDay = (long) (end.date().toEpochMilli() / MILLIS_PER_DAY);

        List<Xirr.CashFlow> flows = new ArrayList<>(schedule.size() + 1);
        double shortTermGain = 0;
        double longTermGain = 0;
        double units = 0;
        double invested = 0;
        int currentMonthlyAmount = 0;

        for (int i = 0; i < schedule.size(); i++) {
            SipInstalment instalment = schedule.get(i);
            int amount = Math.max(1, amountForInstalment.applyAsInt(i));
            currentMonthlyAmount = amount;
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

        return new ScenarioMetrics(
                invested,
                currentValue,
                currentValue - invested,
                xirr,
                currentValue * Math.pow(1 + xirr / 100, PROJECTION_YEARS - years),
                tax.stcg(),
                tax.ltcg(),
                postTaxXirr,
                schedule.size(),
                currentMonthlyAmount);
    }

    public static List<SipTimelinePoint> buildDailyTimeline(
            List<SipInstalment> schedule,
            List<NavPoint> nav,
            NavPoint end,
            IntUnaryOperator amountForInstalment) {
        if (schedule.isEmpty()) {
            return List.of();
        }

        Instant start = schedule.get(0).date();
        List<SipTimelinePoint> timeline = new ArrayList<>();
        int scheduleIndex = 0;
        double units = 0;
        double invested = 0;

        for (NavPoint point : nav) {
            if (point.date().isBefore(start)) {
                continue;
            }
            if (point.date().isAfter(end.date())) {
                break;
            }

            while (scheduleIndex < schedule.size()
                    && !schedule.get(scheduleIndex).date().isAfter(point.date())) {
                SipInstalment instalment = schedule.get(scheduleIndex++);
                int amount = Math.max(1, amountForInstalment.applyAsInt(scheduleIndex - 1));
                units += amount / instalment.nav();
                invested += amount;
            }

            if (invested <= 0) {
                continue;
            }

            double corpus = units * point.nav();
            timeline.add(new SipTimelinePoint(
                    ISO_DATE.format(point.date().atZone(ZoneOffset.UTC)),
                    invested,
                    corpus,
                    point.nav(),
                    corpus));
        }

        String endDate = ISO_DATE.format(end.date().atZone(ZoneOffset.UTC));
        if (timeline.isEmpty() || !timeline.get(timeline.size() - 1).date().equals(endDate)) {
            double corpus = units * end.nav();
            timeline.add(new SipTimelinePoint(endDate, invested, corpus, end.nav(), corpus));
        }

        return InvestmentTimelineAverage.enrichSip(timeline);
    }

    private static double postTaxXirr(List<Xirr.CashFlow> flows, double postTaxValue) {
        List<Xirr.CashFlow> postTaxFlows = new ArrayList<>(flows);
        Xirr.CashFlow redemption = postTaxFlows.remove(postTaxFlows.size() - 1);
        postTaxFlows.add(new Xirr.CashFlow(redemption.dayOffset(), postTaxValue));
        return Xirr.compute(postTaxFlows);
    }
}
