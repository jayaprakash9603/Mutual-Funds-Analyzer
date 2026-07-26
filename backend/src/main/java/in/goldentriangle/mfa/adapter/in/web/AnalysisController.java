package in.goldentriangle.mfa.adapter.in.web;

import in.goldentriangle.mfa.adapter.in.web.dto.compare.AnalysisResponseDto;
import in.goldentriangle.mfa.adapter.in.web.mapper.ApiMapper;
import in.goldentriangle.mfa.config.properties.UpstreamProperties;
import in.goldentriangle.mfa.domain.model.AnalysisQuery;
import in.goldentriangle.mfa.domain.model.Period;
import in.goldentriangle.mfa.domain.port.in.AnalyseFundUseCase;
import in.goldentriangle.mfa.domain.port.in.GetRollingReturnsUseCase;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class AnalysisController {

    private final AnalyseFundUseCase analyseFundUseCase;
    private final GetRollingReturnsUseCase getRollingReturnsUseCase;
    private final ApiMapper apiMapper;
    private final UpstreamProperties upstreamProperties;

    public AnalysisController(
            AnalyseFundUseCase analyseFundUseCase,
            GetRollingReturnsUseCase getRollingReturnsUseCase,
            ApiMapper apiMapper,
            UpstreamProperties upstreamProperties) {
        this.analyseFundUseCase = analyseFundUseCase;
        this.getRollingReturnsUseCase = getRollingReturnsUseCase;
        this.apiMapper = apiMapper;
        this.upstreamProperties = upstreamProperties;
    }

    @GetMapping("/analysis")
    AnalysisResponseDto analyse(
            @RequestParam String scheme,
            @RequestParam(defaultValue = Period.Labels.FIVE_YEAR) String period,
            @RequestParam(name = "start_date", required = false) String startDate) {
        if (scheme == null || scheme.isBlank()) {
            throw new IllegalArgumentException("scheme is required");
        }
        String resolvedStartDate = startDate == null || startDate.isBlank()
                ? upstreamProperties.defaultStartDate()
                : startDate;
        var query = new AnalysisQuery(scheme, Period.fromLabelOrDefault(period), resolvedStartDate);
        var analysis = analyseFundUseCase.analyse(query);
        var data = getRollingReturnsUseCase.get(query);
        return new AnalysisResponseDto(
                apiMapper.toDto(analysis.result()),
                analysis.insights(),
                apiMapper.toTimelineDtos(analysis.timeline()),
                apiMapper.toDto(data));
    }
}
