package in.goldentriangle.mfa.domain.model.report.investment;

public record StepUpSipConfig(
        int initialAmount,
        int scheduleDay,
        StepUpMode mode,
        double stepUpPercent,
        int stepUpAmount) {

    public static final int DEFAULT_INITIAL_AMOUNT = 10_000;
    public static final int DEFAULT_SCHEDULE_DAY = 1;
    public static final double DEFAULT_STEP_UP_PERCENT = 10;

    public static StepUpSipConfig defaultConfig() {
        return new StepUpSipConfig(
                DEFAULT_INITIAL_AMOUNT,
                DEFAULT_SCHEDULE_DAY,
                StepUpMode.PERCENT,
                DEFAULT_STEP_UP_PERCENT,
                0);
    }
}
