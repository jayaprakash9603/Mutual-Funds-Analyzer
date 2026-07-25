package in.goldentriangle.mfa.application;

import in.goldentriangle.mfa.domain.analytics.RollingReturnsFromNav;
import in.goldentriangle.mfa.domain.exception.NoDataFoundException;
import in.goldentriangle.mfa.domain.model.AnalysisQuery;
import in.goldentriangle.mfa.domain.model.Period;
import in.goldentriangle.mfa.domain.model.RollingReturnRow;
import in.goldentriangle.mfa.domain.model.RollingReturnsData;
import in.goldentriangle.mfa.domain.model.report.NavHistory;
import in.goldentriangle.mfa.domain.port.out.CachePort;
import in.goldentriangle.mfa.domain.port.out.NavHistoryPort;
import in.goldentriangle.mfa.domain.port.out.RollingReturnsPort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

@Component
public class FundRollingReturnsAssembler {

    private static final Logger log = LoggerFactory.getLogger(FundRollingReturnsAssembler.class);

    static final List<Period> REPORT_BENCHMARK_PERIODS = List.of(Period.FIVE_YEAR);
    private static final String ROLLING_FROM_NAV_PREFIX = "rolling-from-nav:v1:";

    private final NavHistoryPort navHistoryPort;
    private final RollingReturnsPort rollingReturnsPort;
    private final RollingReturnsFromNav rollingReturnsFromNav;
    private final CachePort cachePort;
    private final Executor matrixExecutor;

    public FundRollingReturnsAssembler(
            NavHistoryPort navHistoryPort,
            RollingReturnsPort rollingReturnsPort,
            RollingReturnsFromNav rollingReturnsFromNav,
            CachePort cachePort,
            @Qualifier("matrixExecutor") Executor matrixExecutor) {
        this.navHistoryPort = navHistoryPort;
        this.rollingReturnsPort = rollingReturnsPort;
        this.rollingReturnsFromNav = rollingReturnsFromNav;
        this.cachePort = cachePort;
        this.matrixExecutor = matrixExecutor;
    }

    public RollingReturnsData assemble(String scheme, String startDate) {
        return assemble(scheme, startDate, REPORT_BENCHMARK_PERIODS);
    }

    public RollingReturnsData assemble(String scheme, String startDate, List<Period> benchmarkPeriods) {
        NavHistory history = navHistoryPort.fetch(scheme, startDate);
        return assembleFromHistory(history, scheme, startDate, benchmarkPeriods);
    }

    public RollingReturnsData assembleFromHistory(NavHistory history, String scheme, String startDate) {
        return assembleFromHistory(history, scheme, startDate, REPORT_BENCHMARK_PERIODS);
    }

    public RollingReturnsData assembleFromHistory(
            NavHistory history,
            String scheme,
            String startDate,
            List<Period> benchmarkPeriods) {
        CompletableFuture<List<RollingReturnRow>> benchmarkFuture = CompletableFuture.supplyAsync(
                () -> fetchBenchmarkRows(scheme, startDate, benchmarkPeriods),
                matrixExecutor);
        String rollingKey = ROLLING_FROM_NAV_PREFIX + scheme + ":" + startDate;
        RollingReturnsData fundData = cachePort.getOrLoad(
                rollingKey,
                RollingReturnsData.class,
                () -> rollingReturnsFromNav.compute(history));
        if (fundData.fund().isEmpty()) {
            throw new NoDataFoundException("No rolling returns computed from NAV for " + scheme);
        }
        List<RollingReturnRow> benchmark = benchmarkFuture.join();
        return new RollingReturnsData(fundData.fund(), benchmark);
    }

    private List<RollingReturnRow> fetchBenchmarkRows(String scheme, String startDate, List<Period> periods) {
        if (periods.size() == 1) {
            RollingReturnsData part = fetchPeriodQuietly(scheme, startDate, periods.get(0));
            return part == null ? List.of() : List.copyOf(part.benchmark());
        }

        List<CompletableFuture<RollingReturnsData>> futures = periods.stream()
                .map(period -> CompletableFuture.supplyAsync(
                        () -> fetchPeriodQuietly(scheme, startDate, period),
                        matrixExecutor))
                .toList();

        List<RollingReturnRow> benchmark = new ArrayList<>();
        for (CompletableFuture<RollingReturnsData> future : futures) {
            RollingReturnsData part = future.join();
            if (part != null) {
                benchmark.addAll(part.benchmark());
            }
        }
        return List.copyOf(benchmark);
    }

    private RollingReturnsData fetchPeriodQuietly(String scheme, String startDate, Period period) {
        try {
            return rollingReturnsPort.fetch(new AnalysisQuery(scheme, period, startDate));
        } catch (RuntimeException ex) {
            log.warn("Skipping investt benchmark period {} for {}: {}", period.label(), scheme, ex.getMessage());
            return null;
        }
    }
}
