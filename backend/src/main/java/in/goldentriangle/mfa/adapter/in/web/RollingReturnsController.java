package in.goldentriangle.mfa.adapter.in.web;

import in.goldentriangle.mfa.adapter.in.web.dto.rolling.RollingReturnsResponseDto;
import in.goldentriangle.mfa.adapter.in.web.mapper.ApiMapper;
import in.goldentriangle.mfa.config.properties.UpstreamProperties;
import in.goldentriangle.mfa.domain.model.AnalysisQuery;
import in.goldentriangle.mfa.domain.model.Period;
import in.goldentriangle.mfa.domain.port.in.GetRollingReturnsUseCase;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api")
public class RollingReturnsController {

    private static final long CLIENT_CACHE_MINUTES = 60;

    private final GetRollingReturnsUseCase getRollingReturnsUseCase;
    private final ApiMapper apiMapper;
    private final UpstreamProperties upstreamProperties;

    public RollingReturnsController(
            GetRollingReturnsUseCase getRollingReturnsUseCase,
            ApiMapper apiMapper,
            UpstreamProperties upstreamProperties) {
        this.getRollingReturnsUseCase = getRollingReturnsUseCase;
        this.apiMapper = apiMapper;
        this.upstreamProperties = upstreamProperties;
    }

    @GetMapping("/rolling-returns")
    ResponseEntity<RollingReturnsResponseDto> getRollingReturns(
            @RequestParam String scheme,
            @RequestParam(defaultValue = Period.Labels.FIVE_YEAR) String period,
            @RequestParam(name = "start_date", required = false) String startDate) {
        if (scheme == null || scheme.isBlank()) {
            throw new IllegalArgumentException("scheme is required");
        }
        String resolvedStartDate = startDate == null || startDate.isBlank()
                ? upstreamProperties.defaultStartDate()
                : startDate;
        var data = getRollingReturnsUseCase.get(
                new AnalysisQuery(scheme, Period.fromLabelOrDefault(period), resolvedStartDate));
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(CLIENT_CACHE_MINUTES, TimeUnit.MINUTES).cachePrivate())
                .body(apiMapper.toDto(data));
    }
}
