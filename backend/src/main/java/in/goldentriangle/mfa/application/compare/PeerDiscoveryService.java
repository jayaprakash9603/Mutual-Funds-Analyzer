package in.goldentriangle.mfa.application.compare;

import in.goldentriangle.mfa.domain.port.out.SchemeCatalogPort;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

@Service
public class PeerDiscoveryService {

    private static final int MAX_PEERS = 10;
    private static final String ALL_CATEGORIES = "All";
    private static final Pattern CATEGORY_NOISE = Pattern.compile("(?i)\\b(fund|funds|scheme|schemes|other)\\b");
    private static final Pattern PAYOUT_PLAN = Pattern.compile("(?i)\\b(idcw|dividend|payout|bonus)\\b");

    private final SchemeCatalogPort schemeCatalogPort;

    public PeerDiscoveryService(SchemeCatalogPort schemeCatalogPort) {
        this.schemeCatalogPort = schemeCatalogPort;
    }

    public List<String> findPeers(String scheme, String category) {
        String keywords = categoryKeywords(category);
        List<String> candidates = searchQuietly(keywords);
        if (candidates.isEmpty()) {
            candidates = searchQuietly(lastTwoWords(keywords));
        }

        List<String> direct = new ArrayList<>();
        List<String> regular = new ArrayList<>();
        for (String name : candidates) {
            if (name.equalsIgnoreCase(scheme) || PAYOUT_PLAN.matcher(name).find()) {
                continue;
            }
            if (name.toLowerCase(Locale.ROOT).contains("direct")) {
                direct.add(name);
            } else {
                regular.add(name);
            }
        }

        List<String> peers = new ArrayList<>(direct);
        peers.addAll(regular);
        return peers.stream().limit(MAX_PEERS - 1L).toList();
    }

    private List<String> searchQuietly(String query) {
        if (query.isBlank()) {
            return List.of();
        }
        try {
            return schemeCatalogPort.search(query, ALL_CATEGORIES);
        } catch (RuntimeException ignored) {
            return List.of();
        }
    }

    static String categoryKeywords(String category) {
        if (category == null || category.isBlank() || ALL_CATEGORIES.equalsIgnoreCase(category)) {
            return "";
        }
        String tail = category.substring(category.lastIndexOf('-') + 1);
        String cleaned = CATEGORY_NOISE.matcher(tail).replaceAll(" ").replaceAll("\\s+", " ").trim();
        return cleaned.isEmpty() ? category.trim() : cleaned;
    }

    private static String lastTwoWords(String value) {
        String[] words = value.split("\\s+");
        if (words.length <= 2) {
            return value;
        }
        return words[words.length - 2] + " " + words[words.length - 1];
    }
}
