package dev.jstephenperry.webpos.payment.service;

import dev.jstephenperry.webpos.payment.dto.CardDetails;
import dev.jstephenperry.webpos.payment.dto.PaymentGatewayResponse;
import dev.jstephenperry.webpos.payment.model.Payment;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Random;
import java.util.UUID;

/**
 * Service for interacting with payment gateway
 * This is a mock implementation for demonstration purposes
 * In production, integrate with actual payment gateway (Stripe, Square, etc.)
 */
@Service
@Slf4j
public class PaymentGatewayService {

    @Value("${payment.processor.mock-mode:true}")
    private boolean mockMode;

    @Value("${payment.processor.timeout-seconds:30}")
    private int timeoutSeconds;

    private final Random random = new Random();

    /**
     * Authorizes a payment
     */
    public PaymentGatewayResponse authorize(Payment payment, CardDetails cardDetails) {
        log.info("Authorizing payment: {}, amount: {} {}",
            payment.getTransactionId(), payment.getAmount(), payment.getCurrency());

        if (mockMode) {
            return mockAuthorize(payment, cardDetails);
        }

        // TODO: Implement actual gateway integration
        // Example: Stripe, Square, Braintree, etc.
        throw new UnsupportedOperationException("Real gateway integration not implemented");
    }

    /**
     * Captures an authorized payment
     */
    public PaymentGatewayResponse capture(Payment payment) {
        log.info("Capturing payment: {}", payment.getTransactionId());

        if (mockMode) {
            return mockCapture(payment);
        }

        // TODO: Implement actual gateway integration
        throw new UnsupportedOperationException("Real gateway integration not implemented");
    }

    /**
     * Refunds a payment
     */
    public PaymentGatewayResponse refund(Payment payment, BigDecimal amount) {
        log.info("Refunding payment: {}, amount: {}", payment.getTransactionId(), amount);

        if (mockMode) {
            return mockRefund(payment, amount);
        }

        // TODO: Implement actual gateway integration
        throw new UnsupportedOperationException("Real gateway integration not implemented");
    }

    /**
     * Mock authorization - simulates payment gateway
     */
    private PaymentGatewayResponse mockAuthorize(Payment payment, CardDetails cardDetails) {
        // Simulate processing delay
        try {
            Thread.sleep(500 + random.nextInt(500));
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        // Simulate success rate (90% success)
        boolean success = random.nextInt(100) < 90;

        if (success) {
            return PaymentGatewayResponse.builder()
                .success(true)
                .authorizationCode("AUTH_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .gatewayTransactionId("GTW_" + System.currentTimeMillis())
                .message("Authorization successful")
                .rawResponse(createMockRawResponse(true))
                .build();
        } else {
            String[] failureReasons = {
                "Insufficient funds",
                "Card declined",
                "Invalid card number",
                "Expired card",
                "CVV verification failed"
            };

            return PaymentGatewayResponse.builder()
                .success(false)
                .failureReason(failureReasons[random.nextInt(failureReasons.length)])
                .message("Authorization failed")
                .rawResponse(createMockRawResponse(false))
                .build();
        }
    }

    /**
     * Mock capture
     */
    private PaymentGatewayResponse mockCapture(Payment payment) {
        try {
            Thread.sleep(300 + random.nextInt(300));
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        return PaymentGatewayResponse.builder()
            .success(true)
            .gatewayTransactionId("CAPTURE_" + System.currentTimeMillis())
            .message("Capture successful")
            .rawResponse(createMockRawResponse(true))
            .build();
    }

    /**
     * Mock refund
     */
    private PaymentGatewayResponse mockRefund(Payment payment, BigDecimal amount) {
        try {
            Thread.sleep(300 + random.nextInt(300));
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        return PaymentGatewayResponse.builder()
            .success(true)
            .gatewayTransactionId("REFUND_" + System.currentTimeMillis())
            .message("Refund successful")
            .rawResponse(createMockRawResponse(true))
            .build();
    }

    private String createMockRawResponse(boolean success) {
        return String.format(
            "{\"status\": \"%s\", \"timestamp\": \"%s\", \"gateway\": \"Mock Gateway\"}",
            success ? "success" : "failed",
            System.currentTimeMillis()
        );
    }
}
