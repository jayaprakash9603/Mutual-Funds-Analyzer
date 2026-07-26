package in.goldentriangle.mfa.adapter.out.upstream;

import in.goldentriangle.mfa.domain.model.Period;
import com.fasterxml.jackson.core.type.TypeReference;
import in.goldentriangle.mfa.domain.exception.NoDataFoundException;
import in.goldentriangle.mfa.domain.model.AnalysisQuery;
import in.goldentriangle.mfa.domain.model.RollingReturnRow;
import in.goldentriangle.mfa.domain.model.RollingReturnsData;
import in.goldentriangle.mfa.domain.port.out.RollingReturnsPort;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component("upstreamRollingReturnsPort")
public class InvesttRollingReturnsAdapter implements RollingReturnsPort {

    private final InvesttMultipartGetClient client;
    private final RollingReturnRowMapper mapper;

    public InvesttRollingReturnsAdapter(InvesttMultipartGetClient client, RollingReturnRowMapper mapper) {
        this.client = client;
        this.mapper = mapper;
    }

    @Override
    public RollingReturnsData fetch(AnalysisQuery query) {
        List<List<Map<String, Object>>> data = client.get(
                "getRollingReturnVsBenchmark",
                Map.of(
                        "scheme", query.scheme(),
                        "start_date", query.startDate(),
                        "period", query.period().label()),
                new TypeReference<>() {});

        if (data == null || data.size() < 2) {
            throw new NoDataFoundException("No rolling return data found");
        }

        List<RollingReturnRow> fund = normalizeRows(data.get(0), query.period().label());
        List<RollingReturnRow> benchmark = normalizeRows(data.get(1), query.period().label());
        return new RollingReturnsData(fund, benchmark);
    }

    private List<RollingReturnRow> normalizeRows(List<Map<String, Object>> rows, String period) {
        List<RollingReturnRow> normalized = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            normalized.add(mapper.toDomain(row, period));
        }
        return normalized;
    }
}
