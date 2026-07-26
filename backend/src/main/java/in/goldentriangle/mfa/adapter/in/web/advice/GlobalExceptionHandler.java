package in.goldentriangle.mfa.adapter.in.web.advice;

import in.goldentriangle.mfa.domain.exception.DomainException;
import in.goldentriangle.mfa.domain.exception.FeatureDisabledException;
import in.goldentriangle.mfa.domain.exception.NoDataFoundException;
import in.goldentriangle.mfa.domain.exception.UpstreamUnavailableException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.task.TaskRejectedException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    private static final String ERROR_KEY = "error";
    private static final String UNEXPECTED_ERROR = "Unexpected server error";

    @ExceptionHandler(NoDataFoundException.class)
    ResponseEntity<Map<String, String>> handleNotFound(NoDataFoundException ex) {
        return problem(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(FeatureDisabledException.class)
    ResponseEntity<Map<String, String>> handleFeatureDisabled(FeatureDisabledException ex) {
        return problem(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(UpstreamUnavailableException.class)
    ResponseEntity<Map<String, String>> handleUpstream(UpstreamUnavailableException ex) {
        log.warn("Upstream call failed", ex);
        return problem(HttpStatus.BAD_GATEWAY, ex.getMessage());
    }

    @ExceptionHandler(DomainException.class)
    ResponseEntity<Map<String, String>> handleDomain(DomainException ex) {
        return problem(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    ResponseEntity<Map<String, String>> handleBadRequest(IllegalArgumentException ex) {
        return problem(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler({TaskRejectedException.class, java.util.concurrent.RejectedExecutionException.class})
    ResponseEntity<Map<String, String>> handleExecutorSaturation(RuntimeException ex) {
        log.warn("Executor saturated while serving request", ex);
        return problem(HttpStatus.SERVICE_UNAVAILABLE, "Server is busy processing other requests; retry shortly");
    }

    /** Catch-all so an unhandled failure returns a consistent body instead of the servlet default. */
    @ExceptionHandler(Exception.class)
    ResponseEntity<Map<String, String>> handleUnexpected(Exception ex) {
        log.error("Unhandled exception while serving request", ex);
        return problem(HttpStatus.INTERNAL_SERVER_ERROR, UNEXPECTED_ERROR);
    }

    private ResponseEntity<Map<String, String>> problem(HttpStatus status, String message) {
        return ResponseEntity.status(status)
                .body(Map.of(ERROR_KEY, message == null ? status.getReasonPhrase() : message));
    }
}
