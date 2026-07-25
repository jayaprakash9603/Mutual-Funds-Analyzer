package in.goldentriangle.mfa.domain.port.in;

import in.goldentriangle.mfa.domain.model.GoldenTriangleResult;
import in.goldentriangle.mfa.domain.model.Period;

import java.util.List;

public interface CompareFundsUseCase {
    List<GoldenTriangleResult> compare(List<String> schemes, Period period, String startDate);
}
