package dev.jstephenperry.webpos.payment.dto;

import dev.jstephenperry.webpos.payment.model.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Response DTO after payment processing
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponse {

    private String paymentId;
    private String transactionId;
    private BigDecimal amount;
    private String currency;
    private PaymentStatus status;
    private String lastFourDigits;
    private String cardBrand;
    private String authorizationCode;
    private String gatewayTransactionId;
    private String failureReason;
    private LocalDateTime createdAt;
    private String savedPaymentToken;
    private String message;
}
