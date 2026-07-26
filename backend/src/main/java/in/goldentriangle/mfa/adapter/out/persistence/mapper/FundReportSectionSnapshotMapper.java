package in.goldentriangle.mfa.adapter.out.persistence.mapper;

import in.goldentriangle.mfa.adapter.out.persistence.record.FundReportSectionSnapshotRecord;
import com.fasterxml.jackson.databind.ObjectMapper;
import in.goldentriangle.mfa.domain.model.FundReportSectionSnapshot;
import in.goldentriangle.mfa.domain.model.ReportSectionGroup;

public final class FundReportSectionSnapshotMapper {

    private FundReportSectionSnapshotMapper() {
    }

    public static void apply(
            FundReportSectionSnapshotRecord record,
            FundReportSectionSnapshot snapshot,
            ObjectMapper objectMapper) {
        record.setScheme(snapshot.scheme());
        record.setStartDate(snapshot.startDate());
        record.setSectionGroup(snapshot.sectionGroup().name());
        record.setPayloadJson(snapshot.payloadJson());
        record.setWatermarkNavDate(snapshot.watermarkNavDate());
        record.setComputedAt(snapshot.computedAt());
        record.setSchemaVersion(snapshot.schemaVersion());
    }

    public static FundReportSectionSnapshot toDomain(
            FundReportSectionSnapshotRecord record,
            ObjectMapper objectMapper) {
        return new FundReportSectionSnapshot(
                record.getScheme(),
                record.getStartDate(),
                ReportSectionGroup.valueOf(record.getSectionGroup()),
                record.getPayloadJson(),
                record.getWatermarkNavDate(),
                record.getComputedAt(),
                record.getSchemaVersion(),
                record.getVersion());
    }

    public static String writePayload(Object payload, ObjectMapper objectMapper) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to serialize fund report section snapshot", ex);
        }
    }

    public static <T> T readPayload(String json, Class<T> type, ObjectMapper objectMapper) {
        try {
            return objectMapper.readValue(json, type);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to deserialize fund report section snapshot", ex);
        }
    }
}
