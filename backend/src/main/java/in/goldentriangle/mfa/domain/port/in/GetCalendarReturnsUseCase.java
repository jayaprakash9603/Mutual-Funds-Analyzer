package in.goldentriangle.mfa.domain.port.in;

import in.goldentriangle.mfa.domain.model.report.returns.CalendarReturnsReport;

public interface GetCalendarReturnsUseCase {

    CalendarReturnsReport get(String scheme, String startDate);
}
