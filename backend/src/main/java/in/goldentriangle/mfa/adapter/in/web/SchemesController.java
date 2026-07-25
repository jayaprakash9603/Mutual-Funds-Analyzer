package in.goldentriangle.mfa.adapter.in.web;

import in.goldentriangle.mfa.domain.port.in.SearchSchemesUseCase;
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
public class SchemesController {

    private final SearchSchemesUseCase searchSchemesUseCase;

    public SchemesController(SearchSchemesUseCase searchSchemesUseCase) {
        this.searchSchemesUseCase = searchSchemesUseCase;
    }

    @GetMapping("/schemes")
    ResponseEntity<List<String>> search(
            @RequestParam(defaultValue = "") String query,
            @RequestParam(defaultValue = "All") String category) {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(10, TimeUnit.MINUTES).cachePrivate())
                .body(searchSchemesUseCase.search(query, category));
    }
}
