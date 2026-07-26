package in.goldentriangle.mfa.domain.model.report.assessment;

import java.util.List;

public record QualityScoreReport(int score, List<ComponentScore> components) {

    public record ComponentScore(String name, int score, double weight) {
    }
}
