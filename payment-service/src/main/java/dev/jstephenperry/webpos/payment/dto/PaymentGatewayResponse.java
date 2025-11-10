package dev.jstephenperry.webpos.payment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response from payment gateway
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentGatewayResponse {

    private boolean success;
    private String authorizationCode;
    private String gatewayTransactionId;
    private String failureReason;
    private String rawResponse;
    private String message;
}
