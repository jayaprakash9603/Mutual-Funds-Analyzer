package in.goldentriangle.mfa.adapter.in.web;

import in.goldentriangle.mfa.adapter.in.web.dto.compare.FundIndexComparisonDto;
import in.goldentriangle.mfa.adapter.in.web.mapper.ApiMapper;
import in.goldentriangle.mfa.config.feature.ConditionalOnFeature;
import in.goldentriangle.mfa.config.feature.FeatureKeys;
import in.goldentriangle.mfa.config.properties.UpstreamProperties;
import in.goldentriangle.mfa.domain.port.in.GetFundIndexComparisonUseCase;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@ConditionalOnFeature(FeatureKeys.ANALYSIS_FUND_INDEX_MATRIX)
public class FundIndexMatrixController {

    private final GetFundIndexComparisonUseCase getFundIndexComparisonUseCase;
    private final ApiMapper apiMapper;
    private final UpstreamProperties upstreamProperties;

    public FundIndexMatrixController(
            GetFundIndexComparisonUseCase getFundIndexComparisonUseCase,
            ApiMapper apiMapper,
            UpstreamProperties upstreamProperties) {
        this.getFundIndexComparisonUseCase = getFundIndexComparisonUseCase;
        this.apiMapper = apiMapper;
        this.upstreamProperties = upstreamProperties;
    }

    @GetMapping("/analysis/fund-index-matrix")
    FundIndexComparisonDto getMatrix(
            @RequestParam String scheme,
            @RequestParam(name = "start_date", required = false) String startDate) {
        if (scheme == null || scheme.isBlank()) {
            throw new IllegalArgumentException("scheme is required");
        }
        String resolvedStartDate = startDate == null || startDate.isBlank()
                ? upstreamProperties.defaultStartDate()
                : startDate;
        return apiMapper.toDto(getFundIndexComparisonUseCase.get(scheme, resolvedStartDate));
    }
}
