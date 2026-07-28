package in.goldentriangle.mfa.domain.analytics.report.sip;

import in.goldentriangle.mfa.domain.model.report.investment.SipTimelinePoint;
import in.goldentriangle.mfa.domain.model.report.investment.SwpTimelinePoint;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public final class InvestmentTimelineAverage {

    private static final int MIN_DAY = 1;
    private static final int MAX_DAY = 30;

    private InvestmentTimelineAverage() {
    }

    public static List<SipTimelinePoint> enrichSip(List<SipTimelinePoint> timeline) {
        if (timeline == null || timeline.isEmpty()) {
            return List.of();
        }
        Map<YearMonth, RunningAverage> monthAverages = new HashMap<>();
        List<SipTimelinePoint> enriched = new ArrayList<>(timeline.size());
        for (SipTimelinePoint point : timeline) {
            enriched.add(enrichSipPoint(point, monthAverages));
        }
        return enriched;
    }

    public static List<SwpTimelinePoint> enrichSwp(List<SwpTimelinePoint> timeline) {
        if (timeline == null || timeline.isEmpty()) {
            return List.of();
        }
        Map<YearMonth, RunningAverage> monthAverages = new HashMap<>();
        List<SwpTimelinePoint> enriched = new ArrayList<>(timeline.size());
        for (SwpTimelinePoint point : timeline) {
            enriched.add(enrichSwpPoint(point, monthAverages));
        }
        return enriched;
    }

    private static SipTimelinePoint enrichSipPoint(
            SipTimelinePoint point,
            Map<YearMonth, RunningAverage> monthAverages) {
        double averageCorpus = resolveAverage(point.date(), point.corpus(), monthAverages);
        return new SipTimelinePoint(point.date(), point.invested(), point.corpus(), point.nav(), averageCorpus);
    }

    private static SwpTimelinePoint enrichSwpPoint(
            SwpTimelinePoint point,
            Map<YearMonth, RunningAverage> monthAverages) {
        double averageCorpus = resolveAverage(point.date(), point.corpus(), monthAverages);
        return new SwpTimelinePoint(point.date(), point.corpus(), point.withdrawn(), point.nav(), averageCorpus);
    }

    private static double resolveAverage(
            String isoDate,
            double corpus,
            Map<YearMonth, RunningAverage> monthAverages) {
        LocalDate date = LocalDate.parse(isoDate);
        int dayOfMonth = date.getDayOfMonth();
        YearMonth month = YearMonth.from(date);
        RunningAverage tracker = monthAverages.computeIfAbsent(month, ignored -> new RunningAverage());
        if (dayOfMonth >= MIN_DAY && dayOfMonth <= MAX_DAY) {
            return tracker.add(corpus);
        }
        return tracker.currentAverage(corpus);
    }

    private static final class RunningAverage {
        private double sum;
        private int count;

        double add(double corpus) {
            sum += corpus;
            count++;
            return sum / count;
        }

        double currentAverage(double fallback) {
            return count == 0 ? fallback : sum / count;
        }
    }
}
