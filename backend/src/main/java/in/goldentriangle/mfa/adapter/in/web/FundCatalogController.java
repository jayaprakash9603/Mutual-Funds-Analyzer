package in.goldentriangle.mfa.adapter.in.web;

import in.goldentriangle.mfa.adapter.in.web.dto.FundSchemeDto;
import in.goldentriangle.mfa.domain.port.in.SearchFundsUseCase;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api")
public class FundCatalogController {

    private final SearchFundsUseCase searchFundsUseCase;

    public FundCatalogController(SearchFundsUseCase searchFundsUseCase) {
        this.searchFundsUseCase = searchFundsUseCase;
    }

    @GetMapping("/funds/search")
    ResponseEntity<List<FundSchemeDto>> search(@RequestParam(defaultValue = "") String query) {
        List<FundSchemeDto> results = searchFundsUseCase.search(query).stream()
                .map(scheme -> new FundSchemeDto(scheme.schemeCode(), scheme.schemeName()))
                .toList();
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(10, TimeUnit.MINUTES).cachePrivate())
                .body(results);
    }
}
