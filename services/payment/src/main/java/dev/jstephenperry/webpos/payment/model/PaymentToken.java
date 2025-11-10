package dev.jstephenperry.webpos.payment.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entity representing a tokenized payment method
 * Stores encrypted payment information for secure reuse
 */
@Entity
@Table(name = "payment_tokens", indexes = {
    @Index(name = "idx_token", columnList = "token", unique = true),
    @Index(name = "idx_customer_id", columnList = "customerId"),
    @Index(name = "idx_status", columnList = "status")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentToken {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, unique = true, length = 64)
    private String token;

    @Column(nullable = false)
    private String customerId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentMethodType paymentMethodType;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String encryptedData;

    @Column(nullable = false, length = 64)
    private String encryptionKeyVersion;

    // Masked card details for display purposes
    @Column(length = 4)
    private String lastFourDigits;

    @Column(length = 50)
    private String cardBrand;

    @Column(length = 7)
    private String expiryDate; // Format: MM/YYYY

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private TokenStatus status = TokenStatus.ACTIVE;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    @Column
    private LocalDateTime lastUsedAt;

    @Column
    private LocalDateTime revokedAt;

    @Column(length = 500)
    private String metadata;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (expiresAt == null) {
            expiresAt = createdAt.plusHours(24);
        }
    }

    @PreUpdate
    protected void onUpdate() {
        // Check if token has expired
        if (LocalDateTime.now().isAfter(expiresAt) && status == TokenStatus.ACTIVE) {
            status = TokenStatus.EXPIRED;
        }
    }

    public boolean isValid() {
        return status == TokenStatus.ACTIVE && LocalDateTime.now().isBefore(expiresAt);
    }
}
