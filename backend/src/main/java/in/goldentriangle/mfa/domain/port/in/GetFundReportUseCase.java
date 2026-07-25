package in.goldentriangle.mfa.domain.port.in;

import in.goldentriangle.mfa.domain.model.report.FundReport;
import in.goldentriangle.mfa.domain.model.report.MatrixMode;
import in.goldentriangle.mfa.domain.model.report.MatrixReport;

public interface GetFundReportUseCase {

    FundReport get(String scheme, String startDate);

    MatrixReport getMatrix(String scheme, String startDate, MatrixMode mode);
}
