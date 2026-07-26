package in.goldentriangle.mfa.adapter.in.web;

import in.goldentriangle.mfa.adapter.in.web.dto.compare.CompareRequestDto;
import in.goldentriangle.mfa.adapter.in.web.dto.compare.CompareResponseDto;
import in.goldentriangle.mfa.adapter.in.web.mapper.ApiMapper;
import in.goldentriangle.mfa.config.feature.ConditionalOnFeature;
import in.goldentriangle.mfa.config.feature.FeatureKeys;
import in.goldentriangle.mfa.config.properties.UpstreamProperties;
import in.goldentriangle.mfa.domain.model.Period;
import in.goldentriangle.mfa.domain.port.in.CompareFundsUseCase;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@ConditionalOnFeature(FeatureKeys.ANALYSIS_COMPARE)
public class CompareController {

    private final CompareFundsUseCase compareFundsUseCase;
    private final ApiMapper apiMapper;
    private final UpstreamProperties upstreamProperties;

    public CompareController(
            CompareFundsUseCase compareFundsUseCase,
            ApiMapper apiMapper,
            UpstreamProperties upstreamProperties) {
        this.compareFundsUseCase = compareFundsUseCase;
        this.apiMapper = apiMapper;
        this.upstreamProperties = upstreamProperties;
    }

    @PostMapping("/analysis/compare")
    CompareResponseDto compare(@RequestBody CompareRequestDto request) {
        Period period = Period.fromLabelOrDefault(request.period());
        var results = compareFundsUseCase.compare(
                request.schemes(),
                period,
                upstreamProperties.defaultStartDate());
        return new CompareResponseDto(results.stream().map(apiMapper::toDto).toList());
    }
}
