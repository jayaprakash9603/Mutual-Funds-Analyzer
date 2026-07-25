package in.goldentriangle.mfa.domain.port.out;

import in.goldentriangle.mfa.domain.model.report.NavHistory;

public interface NavHistoryPort {

    NavHistory fetch(String scheme, String startDate);
}
