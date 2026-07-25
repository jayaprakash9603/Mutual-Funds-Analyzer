package in.goldentriangle.mfa.adapter.in.web;

import in.goldentriangle.mfa.domain.port.in.GetFeatureFlagsUseCase;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api")
public class FeatureFlagsController {

    private final GetFeatureFlagsUseCase getFeatureFlagsUseCase;

    public FeatureFlagsController(GetFeatureFlagsUseCase getFeatureFlagsUseCase) {
        this.getFeatureFlagsUseCase = getFeatureFlagsUseCase;
    }

    @GetMapping("/features")
    ResponseEntity<Map<String, Boolean>> features() {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(1, TimeUnit.MINUTES).cachePrivate())
                .body(getFeatureFlagsUseCase.getFlags());
    }
}
