package in.goldentriangle.mfa.domain.analytics.report.sip;

import in.goldentriangle.mfa.domain.analytics.report.returns.CalendarMath;
import in.goldentriangle.mfa.domain.model.NavPoint;
import in.goldentriangle.mfa.domain.model.report.investment.LumpsumReport;
import in.goldentriangle.mfa.domain.model.report.NavHistory;

import java.util.ArrayList;
import java.util.List;

public class LumpsumCalculator {

    public LumpsumReport compute(NavHistory history) {
        List<NavPoint> nav = history.fundNav();
        if (nav.size() < 2) {
            return new LumpsumReport(List.of());
        }
        NavPoint start = nav.get(0);
        NavPoint end = nav.get(nav.size() - 1);
        double years = CalendarMath.yearsBetweenMillis(start.date().toEpochMilli(), end.date().toEpochMilli());
        double cagr = CalendarMath.cagr(start.nav(), end.nav(), years);
        double multiplied = CalendarMath.moneyMultiplied(start.nav(), end.nav());

        List<Integer> principals = List.of(10_000, 50_000, 100_000, 500_000, 1_000_000);
        List<LumpsumReport.LumpsumScenario> scenarios = new ArrayList<>();
        for (int amount : principals) {
            if (scenarios.stream().anyMatch(s -> s.principal() == amount)) {
                continue;
            }
            double current = amount * multiplied;
            scenarios.add(new LumpsumReport.LumpsumScenario(
                    amount,
                    current,
                    current - amount,
                    cagr,
                    multiplied));
        }
        return new LumpsumReport(scenarios);
    }
}
