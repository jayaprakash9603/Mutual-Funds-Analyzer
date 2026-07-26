package in.goldentriangle.mfa.adapter.out.mfapi;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import in.goldentriangle.mfa.config.properties.MfApiProperties;
import in.goldentriangle.mfa.domain.exception.UpstreamUnavailableException;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@Component
public class MfApiClient {

    private final MfApiProperties properties;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public MfApiClient(MfApiProperties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(properties.timeout())
                .build();
    }

    public <T> T get(String path, Map<String, String> queryParams, TypeReference<T> type) {
        String url = properties.baseUrl() + path + buildQuery(queryParams);
        HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                .timeout(properties.timeout())
                .header("Accept", "application/json")
                .GET()
                .build();
        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 400) {
                throw new UpstreamUnavailableException("mfapi.in returned HTTP " + response.statusCode());
            }
            return objectMapper.readValue(response.body(), type);
        } catch (IOException ex) {
            throw new UpstreamUnavailableException("mfapi.in request failed: " + ex.getMessage(), ex);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new UpstreamUnavailableException("mfapi.in request interrupted", ex);
        }
    }

    private static String buildQuery(Map<String, String> params) {
        if (params == null || params.isEmpty()) {
            return "";
        }
        StringBuilder sb = new StringBuilder("?");
        params.forEach((key, value) -> {
            if (value != null && !value.isBlank()) {
                sb.append(URLEncoder.encode(key, StandardCharsets.UTF_8))
                        .append('=')
                        .append(URLEncoder.encode(value, StandardCharsets.UTF_8))
                        .append('&');
            }
        });
        sb.setLength(sb.length() - 1);
        return sb.toString();
    }
}
