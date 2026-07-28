package in.goldentriangle.mfa.config.metrics;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.stereotype.Component;

import java.util.function.Supplier;

@Component
public class ReportComputeMetrics {

    private final MeterRegistry meterRegistry;

    public ReportComputeMetrics(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
    }

    public <T> T time(String stage, Supplier<T> supplier) {
        Timer timer = Timer.builder("fund.report.stage")
                .tag("stage", stage)
                .register(meterRegistry);
        return timer.record(supplier);
    }

    public void time(String stage, Runnable runnable) {
        time(stage, () -> {
            runnable.run();
            return null;
        });
    }
}
