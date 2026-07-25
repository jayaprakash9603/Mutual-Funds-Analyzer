package in.goldentriangle.mfa.application;

import in.goldentriangle.mfa.config.FeatureKeys;
import in.goldentriangle.mfa.config.ReportProperties;
import in.goldentriangle.mfa.domain.analytics.GoldenTriangleEvaluator;
import in.goldentriangle.mfa.domain.analytics.RollingReturnFilters;
import in.goldentriangle.mfa.domain.model.AnalysisInput;
import in.goldentriangle.mfa.domain.model.GoldenTriangleResult;
import in.goldentriangle.mfa.domain.model.Period;
import in.goldentriangle.mfa.domain.model.RollingReturnRow;
import in.goldentriangle.mfa.domain.model.RollingReturnsData;
import in.goldentriangle.mfa.domain.port.in.CompareFundsUseCase;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class CompareFundsService implements CompareFundsUseCase {

    private final FundRollingReturnsAssembler rollingReturnsAssembler;
    private final GoldenTriangleEvaluator evaluator;
    private final FeatureGuard featureGuard;
    private final ReportProperties reportProperties;

    public CompareFundsService(
            FundRollingReturnsAssembler rollingReturnsAssembler,
            GoldenTriangleEvaluator evaluator,
            FeatureGuard featureGuard,
            ReportProperties reportProperties) {
        this.rollingReturnsAssembler = rollingReturnsAssembler;
        this.evaluator = evaluator;
        this.featureGuard = featureGuard;
        this.reportProperties = reportProperties;
    }

    @Override
    public List<GoldenTriangleResult> compare(List<String> schemes, Period period, String startDate) {
        featureGuard.require(FeatureKeys.ANALYSIS_COMPARE);
        String resolvedStart = startDate == null || startDate.isBlank()
                ? reportProperties.earliestStartDate()
                : startDate;
        List<GoldenTriangleResult> results = new ArrayList<>();
        for (String scheme : schemes) {
            RollingReturnsData data = rollingReturnsAssembler.assemble(scheme, resolvedStart, List.of(period));
            List<RollingReturnRow> fund = RollingReturnFilters.byPeriod(data.fund(), period.label());
            List<RollingReturnRow> benchmark = RollingReturnFilters.byPeriod(data.benchmark(), period.label());
            if (fund.isEmpty()) {
                fund = data.fund();
            }
            if (benchmark.isEmpty()) {
                benchmark = data.benchmark();
            }
            results.add(evaluator.evaluate(new AnalysisInput(fund, benchmark, period.label())));
        }
        return results;
    }
}
