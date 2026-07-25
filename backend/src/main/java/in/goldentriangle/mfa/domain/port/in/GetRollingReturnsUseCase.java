package in.goldentriangle.mfa.domain.port.in;

import in.goldentriangle.mfa.domain.model.AnalysisQuery;
import in.goldentriangle.mfa.domain.model.RollingReturnsData;

public interface GetRollingReturnsUseCase {
    RollingReturnsData get(AnalysisQuery query);
}
