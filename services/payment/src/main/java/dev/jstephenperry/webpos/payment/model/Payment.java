package dev.jstephenperry.webpos.payment.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entity representing a payment transaction
 */
@Entity
@Table(name = "payments", indexes = {
    @Index(name = "idx_transaction_id", columnList = "transactionId", unique = true),
    @Index(name = "idx_customer_id", columnList = "customerId"),
    @Index(name = "idx_status", columnList = "status"),
    @Index(name = "idx_created_at", columnList = "createdAt")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, unique = true, length = 64)
    private String transactionId;

    @Column(nullable = false)
    private String customerId;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal amount;

    @Column(nullable = false, length = 3)
    private String currency;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private PaymentStatus status = PaymentStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentMethodType paymentMethodType;

    // Reference to the payment token used (if any)
    @Column(length = 64)
    private String paymentTokenId;

    // Masked payment details for display
    @Column(length = 4)
    private String lastFourDigits;

    @Column(length = 50)
    private String cardBrand;

    // Gateway response details
    @Column(length = 100)
    private String authorizationCode;

    @Column(length = 100)
    private String gatewayTransactionId;

    @Column(length = 1000)
    private String gatewayResponse;

    @Column(length = 500)
    private String failureReason;

    // Timestamps
    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime authorizedAt;

    @Column
    private LocalDateTime capturedAt;

    @Column
    private LocalDateTime failedAt;

    @Column
    private LocalDateTime refundedAt;

    // Refund tracking
    @Column(precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal refundedAmount = BigDecimal.ZERO;

    // Additional metadata
    @Column(length = 100)
    private String orderId;

    @Column(length = 1000)
    private String description;

    @Column(length = 500)
    private String metadata;

    // IP address for fraud detection
    @Column(length = 45)
    private String ipAddress;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (transactionId == null) {
            transactionId = generateTransactionId();
        }
    }

    private String generateTransactionId() {
        return "txn_" + System.currentTimeMillis() + "_" + java.util.UUID.randomUUID().toString().substring(0, 8);
    }

    public boolean canBeRefunded() {
        return (status == PaymentStatus.CAPTURED || status == PaymentStatus.PARTIALLY_REFUNDED)
            && refundedAmount.compareTo(amount) < 0;
    }

    public BigDecimal getRefundableAmount() {
        return amount.subtract(refundedAmount);
    }
}
