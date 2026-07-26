package in.goldentriangle.mfa.adapter.in.web;

import in.goldentriangle.mfa.adapter.in.web.dto.compare.PeerComparisonDto;
import in.goldentriangle.mfa.adapter.in.web.mapper.FundReportMapper;
import in.goldentriangle.mfa.config.feature.ConditionalOnFeature;
import in.goldentriangle.mfa.config.feature.FeatureKeys;
import in.goldentriangle.mfa.domain.port.in.GetPeerComparisonUseCase;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@ConditionalOnFeature(FeatureKeys.ANALYSIS_PEER_COMPARISON)
public class PeerComparisonController {

    private final GetPeerComparisonUseCase getPeerComparisonUseCase;
    private final FundReportMapper fundReportMapper;

    public PeerComparisonController(
            GetPeerComparisonUseCase getPeerComparisonUseCase,
            FundReportMapper fundReportMapper) {
        this.getPeerComparisonUseCase = getPeerComparisonUseCase;
        this.fundReportMapper = fundReportMapper;
    }

    @GetMapping("/fund-report/peers")
    PeerComparisonDto getPeers(
            @RequestParam String scheme,
            @RequestParam(defaultValue = "All") String category) {
        return fundReportMapper.toDto(getPeerComparisonUseCase.compare(scheme, category));
    }
}
