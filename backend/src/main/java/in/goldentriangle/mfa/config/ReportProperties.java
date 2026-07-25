package in.goldentriangle.mfa.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@ConfigurationProperties(prefix = "report")
public class ReportProperties {

    private static final String DEFAULT_EARLIEST_START = "01-01-1995";
    private static final double DEFAULT_INFLATION_RATE = 7.0;

    private String earliestStartDate = DEFAULT_EARLIEST_START;
    private double inflationRate = DEFAULT_INFLATION_RATE;
    private List<Integer> sipAmounts = List.of(500, 1000, 5000, 10000, 25000);
    private List<Integer> lumpsumAmounts = List.of(10000, 50000, 100000, 500000, 1000000);

    public String earliestStartDate() {
        return earliestStartDate;
    }

    public void setEarliestStartDate(String earliestStartDate) {
        this.earliestStartDate = earliestStartDate;
    }

    public double inflationRate() {
        return inflationRate;
    }

    public void setInflationRate(double inflationRate) {
        this.inflationRate = inflationRate;
    }

    public List<Integer> sipAmounts() {
        return sipAmounts;
    }

    public void setSipAmounts(List<Integer> sipAmounts) {
        this.sipAmounts = sipAmounts;
    }

    public List<Integer> lumpsumAmounts() {
        return lumpsumAmounts;
    }

    public void setLumpsumAmounts(List<Integer> lumpsumAmounts) {
        this.lumpsumAmounts = lumpsumAmounts;
    }
}
