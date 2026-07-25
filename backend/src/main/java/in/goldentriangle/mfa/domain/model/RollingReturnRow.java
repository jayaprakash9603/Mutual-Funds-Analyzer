package in.goldentriangle.mfa.domain.model;

public record RollingReturnRow(
        long id,
        String schemeCompany,
        String schemeCategory,
        String schemeName,
        String period,
        String navDate,
        double schemeNav,
        String schemeForwardDate,
        double schemeForwardNav,
        double schemeRollingReturns
) {
}
