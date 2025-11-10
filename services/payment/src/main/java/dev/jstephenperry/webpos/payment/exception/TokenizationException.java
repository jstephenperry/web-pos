package dev.jstephenperry.webpos.payment.exception;

/**
 * Exception thrown when tokenization operations fail
 */
public class TokenizationException extends RuntimeException {

    public TokenizationException(String message) {
        super(message);
    }

    public TokenizationException(String message, Throwable cause) {
        super(message, cause);
    }
}
