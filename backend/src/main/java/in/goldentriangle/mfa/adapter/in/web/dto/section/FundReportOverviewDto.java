package in.goldentriangle.mfa.adapter.in.web.dto.section;

import in.goldentriangle.mfa.adapter.in.web.dto.report.FundProfileDto;
import java.time.Instant;

public record FundReportOverviewDto(String scheme, FundProfileDto profile) {
}
