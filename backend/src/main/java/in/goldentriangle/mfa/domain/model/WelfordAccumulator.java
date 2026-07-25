package in.goldentriangle.mfa.domain.model;

public final class WelfordAccumulator {

    private long count;
    private double mean;
    private double m2;
    private double min = Double.POSITIVE_INFINITY;
    private double max = Double.NEGATIVE_INFINITY;

    public WelfordAccumulator() {
    }

    private WelfordAccumulator(long count, double mean, double m2, double min, double max) {
        this.count = count;
        this.mean = mean;
        this.m2 = m2;
        this.min = min;
        this.max = max;
    }

    public static WelfordAccumulator empty() {
        return new WelfordAccumulator();
    }

    public void add(double value) {
        count++;
        double delta = value - mean;
        mean += delta / count;
        double delta2 = value - mean;
        m2 += delta * delta2;
        min = Math.min(min, value);
        max = Math.max(max, value);
    }

    public void merge(WelfordAccumulator other) {
        if (other.count == 0) {
            return;
        }
        if (count == 0) {
            count = other.count;
            mean = other.mean;
            m2 = other.m2;
            min = other.min;
            max = other.max;
            return;
        }
        long combinedCount = count + other.count;
        double delta = other.mean - mean;
        double combinedMean = mean + delta * other.count / combinedCount;
        double combinedM2 = m2 + other.m2 + delta * delta * count * other.count / combinedCount;
        count = combinedCount;
        mean = combinedMean;
        m2 = combinedM2;
        min = Math.min(min, other.min);
        max = Math.max(max, other.max);
    }

    public long count() {
        return count;
    }

    public double mean() {
        return count == 0 ? 0 : mean;
    }

    public double stdDev() {
        return count == 0 ? 0 : Math.sqrt(m2 / count);
    }

    public double min() {
        return count == 0 ? 0 : min;
    }

    public double max() {
        return count == 0 ? 0 : max;
    }

    public double m2() {
        return m2;
    }

    public SeriesStats toStats() {
        return new SeriesStats(mean(), max(), min(), stdDev(), count);
    }

    public WelfordAccumulator copy() {
        return fromMoments(count, mean, m2, min, max);
    }

    public static WelfordAccumulator fromMoments(long count, double mean, double m2, double min, double max) {
        return new WelfordAccumulator(
                count,
                mean,
                m2,
                count == 0 ? Double.POSITIVE_INFINITY : min,
                count == 0 ? Double.NEGATIVE_INFINITY : max);
    }
}
