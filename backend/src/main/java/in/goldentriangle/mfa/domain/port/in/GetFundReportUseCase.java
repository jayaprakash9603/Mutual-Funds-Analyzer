package in.goldentriangle.mfa.domain.port.in;

import in.goldentriangle.mfa.domain.model.report.FundReport;
import in.goldentriangle.mfa.domain.model.report.MatrixMode;
import in.goldentriangle.mfa.domain.model.report.MatrixReportBundle;

public interface GetFundReportUseCase {

    FundReport get(String scheme, String startDate);

    MatrixReportBundle getMatrix(String scheme, String startDate, MatrixMode mode);
}
