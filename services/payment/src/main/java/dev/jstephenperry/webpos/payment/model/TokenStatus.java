package dev.jstephenperry.webpos.payment.model;

/**
 * Enumeration of token lifecycle statuses
 */
public enum TokenStatus {
    ACTIVE,
    EXPIRED,
    REVOKED,
    CONSUMED
}
