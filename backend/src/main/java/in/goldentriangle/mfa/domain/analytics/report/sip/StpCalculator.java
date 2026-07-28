package in.goldentriangle.mfa.domain.analytics.report.sip;

import in.goldentriangle.mfa.domain.analytics.report.core.NavLookup;
import in.goldentriangle.mfa.domain.analytics.report.returns.CalendarMath;
import in.goldentriangle.mfa.domain.model.NavPoint;
import in.goldentriangle.mfa.domain.model.report.NavHistory;
import in.goldentriangle.mfa.domain.model.report.investment.StpSimulation;
import in.goldentriangle.mfa.domain.model.report.investment.StpTimelinePoint;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class StpCalculator {

    public static final int DEFAULT_LUMP_SUM = 10_00_000;
    public static final int DEFAULT_TRANSFER_MONTHS = 6;
    public static final int DEFAULT_SCHEDULE_DAY = 1;
    private static final DateTimeFormatter ISO_DATE = DateTimeFormatter.ISO_LOCAL_DATE;

    public StpSimulation simulate(
            NavHistory sourceHistory,
            NavHistory targetHistory,
            int lumpSum,
            int monthlyTransfer,
            int transferMonths,
            int scheduleDay) {
        List<NavPoint> sourceNav = sourceHistory.fundNav();
        List<NavPoint> targetNav = targetHistory.fundNav();
        int principal = Math.max(1, lumpSum);
        int months = Math.max(1, Math.min(transferMonths, 120));
        int transfer = monthlyTransfer > 0 ? monthlyTransfer : Math.max(1, principal / months);
        int day = SipCalculator.clampScheduleDay(scheduleDay);

        if (sourceNav.size() < 2 || targetNav.size() < 2) {
            return emptySimulation(principal, transfer, months);
        }

        NavPoint targetStart = targetNav.get(0);
        Optional<NavPoint> sourceStartNav = NavLookup.nearest(sourceNav, targetStart.date());
        if (sourceStartNav.isEmpty() || sourceStartNav.get().nav() <= 0) {
            return emptySimulation(principal, transfer, months);
        }

        double sourceUnits = principal / sourceStartNav.get().nav();
        double targetUnits = 0;
        double cumulativeTransferred = 0;
        int transferCount = 0;

        List<TransferTarget> transferTargets = buildTransferTargets(targetStart, targetNav.get(targetNav.size() - 1), day, months);
        int targetIndex = 0;

        List<StpTimelinePoint> timeline = new ArrayList<>();

        for (NavPoint point : targetNav) {
            while (targetIndex < transferTargets.size()
                    && !transferTargets.get(targetIndex).date().isAfter(point.date())) {
                TransferTarget target = transferTargets.get(targetIndex++);
                Optional<NavPoint> sourcePoint = NavLookup.nearest(sourceNav, target.date());
                Optional<NavPoint> targetPoint = NavLookup.nearest(targetNav, target.date());
                if (sourcePoint.isEmpty() || targetPoint.isEmpty()
                        || sourcePoint.get().nav() <= 0 || targetPoint.get().nav() <= 0) {
                    continue;
                }

                double sourceCorpus = sourceUnits * sourcePoint.get().nav();
                if (sourceCorpus <= 0) {
                    targetIndex = transferTargets.size();
                    break;
                }

                double amount = Math.min(transfer, sourceCorpus);
                sourceUnits -= amount / sourcePoint.get().nav();
                targetUnits += amount / targetPoint.get().nav();
                cumulativeTransferred += amount;
                transferCount++;
            }

            Optional<NavPoint> sourcePoint = NavLookup.navOnOrBefore(sourceNav, point.date());
            double sourceCorpus = sourcePoint.isPresent() ? sourceUnits * sourcePoint.get().nav() : 0.0;
            double targetCorpus = targetUnits * point.nav();
            double totalValue = sourceCorpus + targetCorpus;

            timeline.add(new StpTimelinePoint(
                    ISO_DATE.format(point.date().atZone(ZoneOffset.UTC)),
                    sourceCorpus,
                    targetCorpus,
                    cumulativeTransferred,
                    totalValue,
                    point.nav(),
                    totalValue));
        }

        NavPoint end = targetNav.get(targetNav.size() - 1);
        Optional<NavPoint> endSource = NavLookup.navOnOrBefore(sourceNav, end.date());
        double sourceRemaining = endSource.isPresent() ? sourceUnits * endSource.get().nav() : 0.0;
        double targetValue = targetUnits * end.nav();
        double totalValue = sourceRemaining + targetValue;
        double totalGain = totalValue - principal;
        double years = CalendarMath.yearsBetweenMillis(targetStart.date().toEpochMilli(), end.date().toEpochMilli());
        double xirr = years > 0
                ? CalendarMath.cagr(principal, totalValue, years)
                : 0;

        StpSimulation.StpScenario scenario = new StpSimulation.StpScenario(
                principal,
                transfer,
                months,
                cumulativeTransferred,
                transferCount,
                sourceRemaining,
                targetValue,
                totalValue,
                totalGain,
                xirr);

        return new StpSimulation(scenario, InvestmentTimelineAverage.enrichStp(timeline));
    }

    private static List<TransferTarget> buildTransferTargets(
            NavPoint start,
            NavPoint end,
            int scheduleDay,
            int transferMonths) {
        YearMonth cursor = YearMonth.from(start.date().atZone(ZoneOffset.UTC)).plusMonths(1);
        YearMonth endMonth = YearMonth.from(end.date().atZone(ZoneOffset.UTC));
        List<TransferTarget> targets = new ArrayList<>();

        for (int i = 0; i < transferMonths && !cursor.isAfter(endMonth); i++) {
            int dom = Math.min(scheduleDay, cursor.lengthOfMonth());
            Instant target = cursor.atDay(dom).atStartOfDay(ZoneOffset.UTC).toInstant();
            if (target.isAfter(end.date())) {
                break;
            }
            targets.add(new TransferTarget(target));
            cursor = cursor.plusMonths(1);
        }
        return targets;
    }

    private static StpSimulation emptySimulation(int lumpSum, int monthlyTransfer, int transferMonths) {
        StpSimulation.StpScenario scenario = new StpSimulation.StpScenario(
                lumpSum, monthlyTransfer, transferMonths, 0, 0, 0, 0, 0, 0, 0);
        return new StpSimulation(scenario, List.of());
    }

    private record TransferTarget(Instant date) {
    }
}
