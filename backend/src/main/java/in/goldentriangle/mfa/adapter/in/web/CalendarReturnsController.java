package in.goldentriangle.mfa.adapter.in.web;

import in.goldentriangle.mfa.adapter.in.web.dto.report.CalendarReturnsDto;
import in.goldentriangle.mfa.adapter.in.web.mapper.FundReportMapper;
import in.goldentriangle.mfa.config.feature.ConditionalOnFeature;
import in.goldentriangle.mfa.config.feature.FeatureKeys;
import in.goldentriangle.mfa.domain.port.in.GetCalendarReturnsUseCase;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api")
@ConditionalOnFeature(FeatureKeys.ANALYSIS_FUND_REPORT)
public class CalendarReturnsController {

    private static final long CLIENT_CACHE_MINUTES = 60;

    private final GetCalendarReturnsUseCase getCalendarReturnsUseCase;
    private final FundReportMapper fundReportMapper;

    public CalendarReturnsController(
            GetCalendarReturnsUseCase getCalendarReturnsUseCase,
            FundReportMapper fundReportMapper) {
        this.getCalendarReturnsUseCase = getCalendarReturnsUseCase;
        this.fundReportMapper = fundReportMapper;
    }

    @GetMapping("/fund-report/calendar-returns")
    ResponseEntity<CalendarReturnsDto> getCalendarReturns(
            @RequestParam String scheme,
            @RequestParam(name = "start_date", required = false) String startDate) {
        if (scheme == null || scheme.isBlank()) {
            throw new IllegalArgumentException("scheme is required");
        }
        CalendarReturnsDto body = fundReportMapper.toDto(getCalendarReturnsUseCase.get(scheme, startDate));
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(CLIENT_CACHE_MINUTES, TimeUnit.MINUTES).cachePrivate())
                .body(body);
    }
}
