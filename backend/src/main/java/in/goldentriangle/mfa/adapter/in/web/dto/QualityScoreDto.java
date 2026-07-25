package in.goldentriangle.mfa.adapter.in.web.dto;

import java.util.List;

public record QualityScoreDto(int score, List<ComponentScoreDto> components) {

    public record ComponentScoreDto(String name, int score, double weight) {
    }
}
