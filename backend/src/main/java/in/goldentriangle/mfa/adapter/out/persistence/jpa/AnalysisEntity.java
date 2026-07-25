package in.goldentriangle.mfa.adapter.out.persistence.jpa;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "fund_analysis")
public class AnalysisEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 512)
    private String scheme;

    @Column(nullable = false, length = 32)
    private String period;

    @Column(name = "analysed_at", nullable = false)
    private Instant analysedAt;

    @Column(name = "result_json", nullable = false, columnDefinition = "CLOB")
    private String resultJson;

    @Column(name = "insights_json", nullable = false, columnDefinition = "CLOB")
    private String insightsJson;

    @Column(name = "timeline_json", nullable = false, columnDefinition = "CLOB")
    private String timelineJson;

    public Long getId() { return id; }
    public String getScheme() { return scheme; }
    public void setScheme(String scheme) { this.scheme = scheme; }
    public String getPeriod() { return period; }
    public void setPeriod(String period) { this.period = period; }
    public Instant getAnalysedAt() { return analysedAt; }
    public void setAnalysedAt(Instant analysedAt) { this.analysedAt = analysedAt; }
    public String getResultJson() { return resultJson; }
    public void setResultJson(String resultJson) { this.resultJson = resultJson; }
    public String getInsightsJson() { return insightsJson; }
    public void setInsightsJson(String insightsJson) { this.insightsJson = insightsJson; }
    public String getTimelineJson() { return timelineJson; }
    public void setTimelineJson(String timelineJson) { this.timelineJson = timelineJson; }
}
