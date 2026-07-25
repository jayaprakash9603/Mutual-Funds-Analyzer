package in.goldentriangle.mfa.domain.analytics.report;

import in.goldentriangle.mfa.domain.model.report.ReturnBand;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ReturnBandClassifierTest {

    @Test
    void classifiesBands() {
        assertEquals(ReturnBand.STRONG, ReturnBandClassifier.classify(12));
        assertEquals(ReturnBand.MODERATE, ReturnBandClassifier.classify(8));
        assertEquals(ReturnBand.WEAK, ReturnBandClassifier.classify(3));
        assertEquals(ReturnBand.NEGATIVE, ReturnBandClassifier.classify(-5));
    }
}
