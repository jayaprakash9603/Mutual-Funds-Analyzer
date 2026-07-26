package in.goldentriangle.mfa.adapter.out.persistence.mapper;

import in.goldentriangle.mfa.adapter.out.persistence.record.RollingAggregateRecord;
import in.goldentriangle.mfa.domain.model.Period;
import in.goldentriangle.mfa.domain.model.RollingAggregate;
import in.goldentriangle.mfa.domain.model.WelfordAccumulator;

public final class RollingAggregateMapper {

    private RollingAggregateMapper() {
    }

    /**
     * Copies every field except the version, which each store owns: JPA must leave {@code @Version}
     * untouched on a new row, while Mongo carries it as a plain field.
     */
    public static void apply(RollingAggregateRecord record, RollingAggregate aggregate) {
        record.setScheme(aggregate.scheme());
        record.setPeriod(aggregate.period().label());
        record.setFundName(aggregate.fundName());
        record.setBenchmarkName(aggregate.benchmarkName());
        record.setCategory(aggregate.category());
        record.setFundCount(aggregate.fundStats().count());
        record.setFundMean(aggregate.fundStats().mean());
        record.setFundM2(aggregate.fundStats().m2());
        record.setFundMin(aggregate.fundStats().min());
        record.setFundMax(aggregate.fundStats().max());
        record.setIndexCount(aggregate.indexStats().count());
        record.setIndexMean(aggregate.indexStats().mean());
        record.setIndexM2(aggregate.indexStats().m2());
        record.setIndexMin(aggregate.indexStats().min());
        record.setIndexMax(aggregate.indexStats().max());
        record.setAlignedCount(aggregate.alignedCount());
        record.setFundWinCount(aggregate.fundWinCount());
        record.setWatermarkNavDate(aggregate.watermarkNavDate());
        record.setComputedAt(aggregate.computedAt());
    }

    public static RollingAggregate toDomain(RollingAggregateRecord record) {
        return new RollingAggregate(
                record.getScheme(),
                Period.fromLabel(record.getPeriod()),
                record.getFundName(),
                record.getBenchmarkName(),
                record.getCategory(),
                WelfordAccumulator.fromMoments(
                        record.getFundCount(),
                        record.getFundMean(),
                        record.getFundM2(),
                        record.getFundMin(),
                        record.getFundMax()),
                WelfordAccumulator.fromMoments(
                        record.getIndexCount(),
                        record.getIndexMean(),
                        record.getIndexM2(),
                        record.getIndexMin(),
                        record.getIndexMax()),
                record.getAlignedCount(),
                record.getFundWinCount(),
                record.getWatermarkNavDate(),
                record.getComputedAt(),
                record.getVersion());
    }
}
