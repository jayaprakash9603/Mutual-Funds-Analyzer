package in.goldentriangle.mfa.domain.port.in;

import in.goldentriangle.mfa.domain.model.AnalysisQuery;
import in.goldentriangle.mfa.domain.model.FundAnalysis;

public interface AnalyseFundUseCase {
    FundAnalysis analyse(AnalysisQuery query);
}
