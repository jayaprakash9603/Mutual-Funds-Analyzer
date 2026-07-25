package in.goldentriangle.mfa.domain.port.out;

import in.goldentriangle.mfa.domain.model.AnalysisQuery;
import in.goldentriangle.mfa.domain.model.RollingReturnsData;

public interface RollingReturnsPort {
    RollingReturnsData fetch(AnalysisQuery query);
}
