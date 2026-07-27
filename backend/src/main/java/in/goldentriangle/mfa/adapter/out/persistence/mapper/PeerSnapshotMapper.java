package in.goldentriangle.mfa.adapter.out.persistence.mapper;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import in.goldentriangle.mfa.adapter.out.persistence.record.PeerComparisonSnapshotRecord;
import in.goldentriangle.mfa.adapter.out.persistence.record.PeerFundSnapshotRecord;
import in.goldentriangle.mfa.domain.model.PeerComparisonSnapshot;
import in.goldentriangle.mfa.domain.model.PeerFundSnapshot;
import in.goldentriangle.mfa.domain.model.report.PeerComparisonReport;

import java.util.List;

public final class PeerSnapshotMapper {

    private static final TypeReference<List<String>> STRING_LIST = new TypeReference<>() {
    };

    private PeerSnapshotMapper() {
    }

    public static void applyFund(
            PeerFundSnapshotRecord record,
            PeerFundSnapshot snapshot) {
        record.setScheme(snapshot.scheme());
        record.setStartDate(snapshot.startDate());
        record.setPayloadJson(snapshot.payloadJson());
        record.setWatermarkNavDate(snapshot.watermarkNavDate());
        record.setComputedAt(snapshot.computedAt());
        record.setSchemaVersion(snapshot.schemaVersion());
    }

    public static PeerFundSnapshot toFundDomain(PeerFundSnapshotRecord record) {
        return new PeerFundSnapshot(
                record.getScheme(),
                record.getStartDate(),
                record.getPayloadJson(),
                record.getWatermarkNavDate(),
                record.getComputedAt(),
                record.getSchemaVersion(),
                record.getVersion());
    }

    public static void applyComparison(
            PeerComparisonSnapshotRecord record,
            PeerComparisonSnapshot snapshot) {
        record.setScheme(snapshot.scheme());
        record.setCategory(snapshot.category());
        record.setStartDate(snapshot.startDate());
        record.setPeerSchemesJson(snapshot.peerSchemesJson());
        record.setPayloadJson(snapshot.payloadJson());
        record.setWatermarkNavDate(snapshot.watermarkNavDate());
        record.setComputedAt(snapshot.computedAt());
        record.setSchemaVersion(snapshot.schemaVersion());
    }

    public static PeerComparisonSnapshot toComparisonDomain(PeerComparisonSnapshotRecord record) {
        return new PeerComparisonSnapshot(
                record.getScheme(),
                record.getCategory(),
                record.getStartDate(),
                record.getPeerSchemesJson(),
                record.getPayloadJson(),
                record.getWatermarkNavDate(),
                record.getComputedAt(),
                record.getSchemaVersion(),
                record.getVersion());
    }

    public static String writeJson(Object payload, ObjectMapper objectMapper) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to serialize peer snapshot payload", ex);
        }
    }

    public static <T> T readJson(String json, Class<T> type, ObjectMapper objectMapper) {
        try {
            return objectMapper.readValue(json, type);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to deserialize peer snapshot payload", ex);
        }
    }

    public static List<String> readPeerSchemes(String json, ObjectMapper objectMapper) {
        try {
            return objectMapper.readValue(json, STRING_LIST);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to deserialize peer scheme list", ex);
        }
    }

    public static PeerComparisonReport readComparisonReport(
            PeerComparisonSnapshot snapshot,
            ObjectMapper objectMapper) {
        return readJson(snapshot.payloadJson(), PeerComparisonReport.class, objectMapper);
    }

    public static PeerComparisonReport.PeerRow readFundRow(
            PeerFundSnapshot snapshot,
            ObjectMapper objectMapper) {
        return readJson(snapshot.payloadJson(), PeerComparisonReport.PeerRow.class, objectMapper);
    }
}
