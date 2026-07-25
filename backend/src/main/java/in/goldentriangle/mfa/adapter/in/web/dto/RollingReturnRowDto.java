package in.goldentriangle.mfa.adapter.in.web.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record RollingReturnRowDto(
        long id,
        @JsonProperty("scheme_company") String schemeCompany,
        @JsonProperty("scheme_category") String schemeCategory,
        @JsonProperty("scheme_name") String schemeName,
        String period,
        @JsonProperty("nav_date") String navDate,
        @JsonProperty("scheme_nav") double schemeNav,
        @JsonProperty("scheme_forward_date") String schemeForwardDate,
        @JsonProperty("scheme_forward_nav") double schemeForwardNav,
        @JsonProperty("scheme_rolling_returns") double schemeRollingReturns
) {
}
