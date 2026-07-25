package in.goldentriangle.mfa.domain.exception;

public class UpstreamUnavailableException extends DomainException {

    public UpstreamUnavailableException(String message) {
        super(message);
    }

    public UpstreamUnavailableException(String message, Throwable cause) {
        super(message);
        initCause(cause);
    }
}
