package in.goldentriangle.mfa.adapter.out.persistence.mapper;

import in.goldentriangle.mfa.adapter.out.persistence.record.FundReportSnapshotRecord;
import com.fasterxml.jackson.databind.ObjectMapper;
import in.goldentriangle.mfa.domain.model.FundReportSnapshot;
import in.goldentriangle.mfa.domain.model.report.FundReport;

public final class FundReportSnapshotMapper {

    private FundReportSnapshotMapper() {
    }

    public static void apply(FundReportSnapshotRecord record, FundReportSnapshot snapshot, ObjectMapper objectMapper) {
        record.setScheme(snapshot.scheme());
        record.setStartDate(snapshot.startDate());
        record.setReportJson(writeReport(snapshot.report(), objectMapper));
        record.setWatermarkNavDate(snapshot.watermarkNavDate());
        record.setComputedAt(snapshot.computedAt());
        record.setSchemaVersion(snapshot.schemaVersion());
    }

    public static FundReportSnapshot toDomain(FundReportSnapshotRecord record, ObjectMapper objectMapper) {
        return new FundReportSnapshot(
                record.getScheme(),
                record.getStartDate(),
                readReport(record.getReportJson(), objectMapper),
                record.getWatermarkNavDate(),
                record.getComputedAt(),
                record.getSchemaVersion(),
                record.getVersion());
    }

    private static String writeReport(FundReport report, ObjectMapper objectMapper) {
        try {
            return objectMapper.writeValueAsString(report);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to serialize fund report snapshot", ex);
        }
    }

    private static FundReport readReport(String json, ObjectMapper objectMapper) {
        try {
            return objectMapper.readValue(json, FundReport.class);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to deserialize fund report snapshot", ex);
        }
    }
}
