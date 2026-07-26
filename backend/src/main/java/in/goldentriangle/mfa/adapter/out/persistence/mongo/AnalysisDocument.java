package in.goldentriangle.mfa.adapter.out.persistence.mongo;

import in.goldentriangle.mfa.domain.model.Period;
import in.goldentriangle.mfa.domain.model.GoldenTriangleResult;
import in.goldentriangle.mfa.domain.model.TimelineEvent;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

@Document(collection = "fund_analysis")
public class AnalysisDocument {

    @Id
    private String id;
    private String scheme;
    private String period;
    private Instant analysedAt;
    private GoldenTriangleResult result;
    private List<String> insights;
    private List<TimelineEvent> timeline;

    public String getId() { return id; }
    public String getScheme() { return scheme; }
    public void setScheme(String scheme) { this.scheme = scheme; }
    public String getPeriod() { return period; }
    public void setPeriod(String period) { this.period = period; }
    public Instant getAnalysedAt() { return analysedAt; }
    public void setAnalysedAt(Instant analysedAt) { this.analysedAt = analysedAt; }
    public GoldenTriangleResult getResult() { return result; }
    public void setResult(GoldenTriangleResult result) { this.result = result; }
    public List<String> getInsights() { return insights; }
    public void setInsights(List<String> insights) { this.insights = insights; }
    public List<TimelineEvent> getTimeline() { return timeline; }
    public void setTimeline(List<TimelineEvent> timeline) { this.timeline = timeline; }
}
