package in.goldentriangle.mfa.domain.port.in;

import in.goldentriangle.mfa.domain.model.report.FundReport;
import in.goldentriangle.mfa.domain.model.report.investment.LumpsumSimulation;
import in.goldentriangle.mfa.domain.model.report.investment.SipSimulation;
import in.goldentriangle.mfa.domain.model.report.investment.StepUpSipConfig;
import in.goldentriangle.mfa.domain.model.report.investment.StepUpSipSimulation;
import in.goldentriangle.mfa.domain.model.report.investment.StpSimulation;
import in.goldentriangle.mfa.domain.model.report.investment.SwpSimulation;
import in.goldentriangle.mfa.domain.model.report.matrix.MatrixMode;
import in.goldentriangle.mfa.domain.model.report.matrix.MatrixReportBundle;

public interface GetFundReportUseCase {

    FundReport get(String scheme, String startDate);

    MatrixReportBundle getMatrix(String scheme, String startDate, MatrixMode mode);

    SipSimulation simulateSip(String scheme, String startDate, int amount, int scheduleDay);

    LumpsumSimulation simulateLumpsum(String scheme, String startDate, int principal);

    SwpSimulation simulateSwp(
            String scheme,
            String startDate,
            int initialCorpus,
            int monthlyWithdrawal,
            int scheduleDay);

    StepUpSipSimulation simulateStepUpSip(String scheme, String startDate, StepUpSipConfig config);

    StpSimulation simulateStp(
            String targetScheme,
            String sourceScheme,
            String startDate,
            int lumpSum,
            int monthlyTransfer,
            int transferMonths,
            int scheduleDay);
}
