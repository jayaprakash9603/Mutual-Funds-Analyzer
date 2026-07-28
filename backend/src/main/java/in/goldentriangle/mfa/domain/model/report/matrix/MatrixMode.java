package in.goldentriangle.mfa.domain.model.report.matrix;

public enum MatrixMode {
    LUMPSUM,
    MULTIPLE,
    SIP,
    SIP_MULTIPLE,
    STP_6M,
    STP_6M_MULTIPLE,
    STEP_UP_SIP,
    STEP_UP_SIP_MULTIPLE,
    SWP,
    SWP_MULTIPLE;

    public boolean isMultiple() {
        return this == MULTIPLE
                || this == SIP_MULTIPLE
                || this == STP_6M_MULTIPLE
                || this == STEP_UP_SIP_MULTIPLE
                || this == SWP_MULTIPLE;
    }
}
