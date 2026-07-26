package in.goldentriangle.mfa.domain.port.in;

import in.goldentriangle.mfa.domain.model.report.FundReport;
import in.goldentriangle.mfa.domain.model.report.matrix.MatrixMode;
import in.goldentriangle.mfa.domain.model.report.matrix.MatrixReportBundle;

public interface GetFundReportUseCase {

    FundReport get(String scheme, String startDate);

    MatrixReportBundle getMatrix(String scheme, String startDate, MatrixMode mode);
}
