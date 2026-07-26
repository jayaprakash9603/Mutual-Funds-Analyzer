package in.goldentriangle.mfa.adapter.out.persistence;

import com.fasterxml.jackson.databind.ObjectMapper;
import in.goldentriangle.mfa.domain.model.MatrixSnapshot;
import in.goldentriangle.mfa.domain.model.report.MatrixMode;
import in.goldentriangle.mfa.domain.model.report.MatrixReport;

public final class MatrixSnapshotMapper {

    private MatrixSnapshotMapper() {
    }

    public static void apply(MatrixSnapshotRecord record, MatrixSnapshot snapshot, ObjectMapper objectMapper) {
        record.setScheme(snapshot.scheme());
        record.setMode(snapshot.mode().name());
        record.setStartDate(snapshot.startDate());
        record.setMatrixJson(writeMatrix(snapshot.report(), objectMapper));
        record.setWatermarkNavDate(snapshot.watermarkNavDate());
        record.setComputedAt(snapshot.computedAt());
    }

    public static MatrixSnapshot toDomain(MatrixSnapshotRecord record, ObjectMapper objectMapper) {
        return new MatrixSnapshot(
                record.getScheme(),
                MatrixMode.valueOf(record.getMode()),
                record.getStartDate(),
                readMatrix(record.getMatrixJson(), objectMapper),
                record.getWatermarkNavDate(),
                record.getComputedAt(),
                record.getVersion());
    }

    private static String writeMatrix(MatrixReport report, ObjectMapper objectMapper) {
        try {
            return objectMapper.writeValueAsString(report);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to serialize matrix snapshot", ex);
        }
    }

    private static MatrixReport readMatrix(String json, ObjectMapper objectMapper) {
        try {
            return objectMapper.readValue(json, MatrixReport.class);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to deserialize matrix snapshot", ex);
        }
    }
}
