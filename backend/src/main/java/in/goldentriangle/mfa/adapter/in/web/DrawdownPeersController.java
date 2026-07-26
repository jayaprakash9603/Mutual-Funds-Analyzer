package in.goldentriangle.mfa.adapter.in.web;

import in.goldentriangle.mfa.adapter.in.web.dto.report.DrawdownPeersDto;
import in.goldentriangle.mfa.adapter.in.web.mapper.FundReportMapper;
import in.goldentriangle.mfa.config.feature.ConditionalOnFeature;
import in.goldentriangle.mfa.config.feature.FeatureKeys;
import in.goldentriangle.mfa.domain.port.in.GetDrawdownPeersUseCase;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@ConditionalOnFeature(FeatureKeys.ANALYSIS_PEER_COMPARISON)
public class DrawdownPeersController {

    private final GetDrawdownPeersUseCase getDrawdownPeersUseCase;
    private final FundReportMapper fundReportMapper;

    public DrawdownPeersController(
            GetDrawdownPeersUseCase getDrawdownPeersUseCase,
            FundReportMapper fundReportMapper) {
        this.getDrawdownPeersUseCase = getDrawdownPeersUseCase;
        this.fundReportMapper = fundReportMapper;
    }

    @GetMapping("/fund-report/drawdown-peers")
    DrawdownPeersDto getDrawdownPeers(
            @RequestParam String scheme,
            @RequestParam(defaultValue = "All") String category) {
        return fundReportMapper.toDto(getDrawdownPeersUseCase.compare(scheme, category));
    }
}
