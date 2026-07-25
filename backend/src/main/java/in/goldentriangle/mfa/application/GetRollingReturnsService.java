package in.goldentriangle.mfa.application;

import in.goldentriangle.mfa.domain.model.AnalysisQuery;
import in.goldentriangle.mfa.domain.model.RollingReturnsData;
import in.goldentriangle.mfa.domain.port.in.GetRollingReturnsUseCase;
import in.goldentriangle.mfa.domain.port.out.RollingReturnsPort;
import org.springframework.stereotype.Service;

@Service
public class GetRollingReturnsService implements GetRollingReturnsUseCase {

    private final RollingReturnsPort rollingReturnsPort;

    public GetRollingReturnsService(RollingReturnsPort rollingReturnsPort) {
        this.rollingReturnsPort = rollingReturnsPort;
    }

    @Override
    public RollingReturnsData get(AnalysisQuery query) {
        return rollingReturnsPort.fetch(query);
    }
}
