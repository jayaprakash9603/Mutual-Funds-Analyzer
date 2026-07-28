package in.goldentriangle.mfa.domain.port.in;

import in.goldentriangle.mfa.domain.model.report.FundReport;
import in.goldentriangle.mfa.domain.model.report.investment.SipSimulation;
import in.goldentriangle.mfa.domain.model.report.investment.SwpSimulation;
import in.goldentriangle.mfa.domain.model.report.matrix.MatrixMode;
import in.goldentriangle.mfa.domain.model.report.matrix.MatrixReportBundle;

public interface GetFundReportUseCase {

    FundReport get(String scheme, String startDate);

    MatrixReportBundle getMatrix(String scheme, String startDate, MatrixMode mode);

    SipSimulation simulateSip(String scheme, String startDate, int amount, int scheduleDay);

    SwpSimulation simulateSwp(
            String scheme,
            String startDate,
            int initialCorpus,
            int monthlyWithdrawal,
            int scheduleDay);
}
