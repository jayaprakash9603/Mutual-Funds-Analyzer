package in.goldentriangle.mfa.domain.analytics;

import in.goldentriangle.mfa.domain.model.Period;
import in.goldentriangle.mfa.domain.model.GoldenTriangleResult;
import in.goldentriangle.mfa.domain.model.RollingReturnRow;
import in.goldentriangle.mfa.domain.model.TimelineEvent;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

public class TimelineBuilder {

    private static final DateTimeFormatter MONTH_FORMAT =
            DateTimeFormatter.ofPattern("MMM yyyy", Locale.ENGLISH);
    private static final String UNKNOWN_DATE = "N/A";
    private static final String PERCENT_FORMAT = "%.2f%%";

    public List<TimelineEvent> build(GoldenTriangleResult result, List<RollingReturnRow> fund) {
        if (fund.isEmpty()) {
            return List.of();
        }

        RollingReturnRow first = fund.get(0);
        RollingReturnRow latest = fund.get(fund.size() - 1);
        RollingReturnRow mid = fund.get(fund.size() / 2);
        RollingReturnRow best = extremeBy(fund, true);
        RollingReturnRow worst = extremeBy(fund, false);

        List<TimelineEvent> events = new ArrayList<>();
        events.add(event(
                "Inception Window",
                first.navDate(),
                first.schemeRollingReturns(),
                String.format(
                        "Earliest %s rolling window in the dataset — start of trackable history for this fund.",
                        result.period())));
        events.add(event(
                "Best Rolling Window",
                best.navDate(),
                best.schemeRollingReturns(),
                String.format(
                        "Peak %s rolling return — the fund's strongest historical performance window.",
                        result.period())));
        events.add(event(
                "Worst Rolling Window",
                worst.navDate(),
                worst.schemeRollingReturns(),
                String.format(
                        "Trough %s rolling return — the weakest period, useful for assessing downside resilience.",
                        result.period())));
        events.add(event(
                "Mid-Period Checkpoint",
                mid.navDate(),
                mid.schemeRollingReturns(),
                "Halfway point in the rolling return series — shows how the fund performed through the"
                        + " middle of its history."));
        events.add(event(
                "Latest Window",
                latest.schemeForwardDate(),
                latest.schemeRollingReturns(),
                latestExplanation(result)));

        events.sort(Comparator.comparingLong(TimelineEvent::sortKey));
        return events;
    }

    private TimelineEvent event(String title, String rawDate, double rollingReturn, String explanation) {
        Optional<Instant> date = NavDateParser.parse(rawDate);
        return new TimelineEvent(
                title,
                date.map(this::formatMonth).orElse(UNKNOWN_DATE),
                String.format(PERCENT_FORMAT, rollingReturn),
                explanation,
                date.map(Instant::toEpochMilli).orElse(0L));
    }

    private String latestExplanation(GoldenTriangleResult result) {
        return String.format(
                "Most recent %s window. Sharpe %.2f vs benchmark %.2f. Golden Triangle: %d/%d rules passed.",
                result.period(),
                result.metrics().fundSharpe(),
                result.metrics().benchmarkSharpe(),
                result.passCount(),
                result.rules().size());
    }

    private static RollingReturnRow extremeBy(List<RollingReturnRow> rows, boolean highest) {
        RollingReturnRow chosen = rows.get(0);
        for (RollingReturnRow row : rows) {
            boolean better = highest
                    ? row.schemeRollingReturns() > chosen.schemeRollingReturns()
                    : row.schemeRollingReturns() < chosen.schemeRollingReturns();
            if (better) {
                chosen = row;
            }
        }
        return chosen;
    }

    private String formatMonth(Instant instant) {
        return instant.atZone(ZoneOffset.UTC).format(MONTH_FORMAT);
    }
}
