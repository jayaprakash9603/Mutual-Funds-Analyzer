package in.goldentriangle.mfa.adapter.out.upstream;

import in.goldentriangle.mfa.domain.analytics.report.core.NavHistoryAssembler;
import in.goldentriangle.mfa.domain.model.AnalysisQuery;
import in.goldentriangle.mfa.domain.model.Period;
import in.goldentriangle.mfa.domain.model.RollingReturnsData;
import in.goldentriangle.mfa.domain.model.report.NavHistory;
import in.goldentriangle.mfa.domain.port.out.NavHistoryPort;
import in.goldentriangle.mfa.domain.port.out.RollingReturnsPort;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

@Component
public class InvesttNavHistoryAdapter implements NavHistoryPort {

    private final RollingReturnsPort rollingReturnsPort;

    public InvesttNavHistoryAdapter(@Qualifier("upstreamRollingReturnsPort") RollingReturnsPort rollingReturnsPort) {
        this.rollingReturnsPort = rollingReturnsPort;
    }

    @Override
    public NavHistory fetch(String scheme, String startDate) {
        AnalysisQuery query = new AnalysisQuery(scheme, Period.ONE_YEAR, startDate);
        RollingReturnsData data = rollingReturnsPort.fetch(query);
        return NavHistoryAssembler.assemble(scheme, data, startDate);
    }
}
