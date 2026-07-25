package in.goldentriangle.mfa.domain.model;

import java.util.Arrays;
import java.util.List;

public enum Period {
    ONE_YEAR(Labels.ONE_YEAR, 1),
    THREE_YEAR(Labels.THREE_YEAR, 3),
    FIVE_YEAR(Labels.FIVE_YEAR, 5),
    SEVEN_YEAR(Labels.SEVEN_YEAR, 7),
    TEN_YEAR(Labels.TEN_YEAR, 10),
    FIFTEEN_YEAR(Labels.FIFTEEN_YEAR, 15);

    public static final Period DEFAULT = FIVE_YEAR;

    private final String label;
    private final int years;

    Period(String label, int years) {
        this.label = label;
        this.years = years;
    }

    public String label() {
        return label;
    }

    public int years() {
        return years;
    }

    public static List<String> allLabels() {
        return Arrays.stream(values()).map(Period::label).toList();
    }

    /**
     * Strict lookup for configured values, where a typo should surface instead of silently
     * collapsing several periods onto the default.
     */
    public static Period fromLabel(String label) {
        return Arrays.stream(values())
                .filter(period -> period.label.equals(label))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown period label: " + label));
    }

    /** Lenient lookup for request parameters, where an absent or unknown value falls back. */
    public static Period fromLabelOrDefault(String label) {
        if (label == null || label.isBlank()) {
            return DEFAULT;
        }
        return Arrays.stream(values())
                .filter(period -> period.label.equals(label))
                .findFirst()
                .orElse(DEFAULT);
    }

    /** Referenced from annotation attributes, which require compile-time constants. */
    public static final class Labels {
        public static final String ONE_YEAR = "1 Year";
        public static final String THREE_YEAR = "3 Year";
        public static final String FIVE_YEAR = "5 Year";
        public static final String SEVEN_YEAR = "7 Year";
        public static final String TEN_YEAR = "10 Year";
        public static final String FIFTEEN_YEAR = "15 Year";

        private Labels() {
        }
    }
}
