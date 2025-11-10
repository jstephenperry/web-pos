package dev.jstephenperry.webpos.payment.model;

/**
 * Enumeration of possible payment statuses
 */
public enum PaymentStatus {
    PENDING,
    AUTHORIZED,
    CAPTURED,
    DECLINED,
    FAILED,
    REFUNDED,
    PARTIALLY_REFUNDED,
    CANCELLED,
    EXPIRED
}
