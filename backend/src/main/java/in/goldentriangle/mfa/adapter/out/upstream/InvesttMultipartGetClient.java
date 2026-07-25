package in.goldentriangle.mfa.adapter.out.upstream;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import in.goldentriangle.mfa.config.UpstreamProperties;
import in.goldentriangle.mfa.domain.exception.UpstreamUnavailableException;
import org.springframework.stereotype.Component;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.HexFormat;
import java.util.Map;
import java.util.zip.DataFormatException;
import java.util.zip.GZIPInputStream;
import java.util.zip.Inflater;

@Component
public class InvesttMultipartGetClient {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int BOUNDARY_RANDOM_BYTES = 12;
    private static final int INFLATE_BUFFER_BYTES = 4096;
    private static final String ACCEPTED_ENCODINGS = "gzip, deflate";
    private static final String GZIP = "gzip";
    private static final String DEFLATE = "deflate";
    private static final String IDENTITY = "identity";
    private static final int HTTP_ERROR_THRESHOLD = 400;
    private static final String NULL_BODY = "null";

    private final UpstreamProperties properties;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public InvesttMultipartGetClient(UpstreamProperties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(properties.timeout())
                .build();
    }

    public <T> T get(String path, Map<String, String> fields, TypeReference<T> type) {
        try {
            MultipartBody multipart = buildMultipartBody(fields);
            URI uri = URI.create("https://" + properties.host() + properties.basePath() + "/" + path);
            HttpRequest request = HttpRequest.newBuilder(uri)
                    .timeout(properties.timeout())
                    .header("Content-Type", "multipart/form-data; boundary=" + multipart.boundary())
                    .header("Accept-Encoding", ACCEPTED_ENCODINGS)
                    .header("Accept", "application/json, text/plain, */*")
                    .method("GET", HttpRequest.BodyPublishers.ofByteArray(multipart.body()))
                    .build();

            HttpResponse<byte[]> response = httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());
            if (response.statusCode() >= HTTP_ERROR_THRESHOLD) {
                throw new UpstreamUnavailableException("Upstream responded " + response.statusCode());
            }

            byte[] raw = decompress(response.body(), response.headers().firstValue("content-encoding").orElse(""));
            String text = new String(raw, StandardCharsets.UTF_8).trim();
            if (text.isEmpty() || NULL_BODY.equals(text)) {
                return null;
            }
            return objectMapper.readValue(text, type);
        } catch (UpstreamUnavailableException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new UpstreamUnavailableException("Upstream request failed", ex);
        }
    }

    private MultipartBody buildMultipartBody(Map<String, String> fields) {
        String boundary = "----investt" + HexFormat.of().formatHex(randomBytes(BOUNDARY_RANDOM_BYTES));
        StringBuilder builder = new StringBuilder();
        for (Map.Entry<String, String> entry : fields.entrySet()) {
            builder.append("--").append(boundary).append("\r\n");
            builder.append("Content-Disposition: form-data; name=\"").append(entry.getKey()).append("\"\r\n\r\n");
            builder.append(entry.getValue()).append("\r\n");
        }
        builder.append("--").append(boundary).append("--\r\n");
        return new MultipartBody(boundary, builder.toString().getBytes(StandardCharsets.UTF_8));
    }

    private byte[] randomBytes(int length) {
        byte[] bytes = new byte[length];
        RANDOM.nextBytes(bytes);
        return bytes;
    }

    /**
     * Only the encodings advertised in {@link #ACCEPTED_ENCODINGS} can be handled. Anything else is
     * rejected rather than passed through, because returning still-compressed bytes would surface as
     * an unrelated JSON parse failure.
     */
    private byte[] decompress(byte[] input, String encoding) throws IOException, DataFormatException {
        if (encoding.isBlank() || IDENTITY.equalsIgnoreCase(encoding)) {
            return input;
        }
        if (GZIP.equalsIgnoreCase(encoding)) {
            try (var gzip = new GZIPInputStream(new ByteArrayInputStream(input))) {
                return gzip.readAllBytes();
            }
        }
        if (DEFLATE.equalsIgnoreCase(encoding)) {
            return inflate(input);
        }
        throw new UpstreamUnavailableException("Unsupported upstream content-encoding: " + encoding);
    }

    private byte[] inflate(byte[] input) throws DataFormatException {
        Inflater inflater = new Inflater(true);
        try {
            inflater.setInput(input);
            ByteArrayOutputStream output = new ByteArrayOutputStream();
            byte[] buffer = new byte[INFLATE_BUFFER_BYTES];
            while (!inflater.finished()) {
                int count = inflater.inflate(buffer);
                output.write(buffer, 0, count);
            }
            return output.toByteArray();
        } finally {
            inflater.end();
        }
    }

    private record MultipartBody(String boundary, byte[] body) {
    }
}
