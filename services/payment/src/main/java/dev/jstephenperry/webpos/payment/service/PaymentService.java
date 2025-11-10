package dev.jstephenperry.webpos.payment.service;

import dev.jstephenperry.webpos.payment.dto.*;
import dev.jstephenperry.webpos.payment.exception.PaymentException;
import dev.jstephenperry.webpos.payment.model.Payment;
import dev.jstephenperry.webpos.payment.model.PaymentMethodType;
import dev.jstephenperry.webpos.payment.model.PaymentStatus;
import dev.jstephenperry.webpos.payment.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Service for processing payments
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final TokenizationService tokenizationService;
    private final PaymentGatewayService gatewayService;

    @Value("${payment.processor.mock-mode:true}")
    private boolean mockMode;

    /**
     * Processes a payment
     */
    @Transactional
    public PaymentResponse processPayment(PaymentRequest request) {
        log.info("Processing payment for customer: {}, amount: {} {}",
            request.getCustomerId(), request.getAmount(), request.getCurrency());

        // Validate payment request
        validatePaymentRequest(request);

        CardDetails cardDetails;
        String savedTokenId = null;

        // Get card details either from token or direct card input
        if (request.getPaymentToken() != null && !request.getPaymentToken().isEmpty()) {
            // Use existing token
            cardDetails = tokenizationService.detokenize(
                request.getPaymentToken(),
                request.getCustomerId()
            );
        } else if (request.getCardDetails() != null) {
            // Use provided card details
            cardDetails = request.getCardDetails();

            // Tokenize if requested
            if (request.isSavePaymentMethod()) {
                TokenizeRequest tokenizeRequest = TokenizeRequest.builder()
                    .customerId(request.getCustomerId())
                    .cardDetails(cardDetails)
                    .build();

                TokenizeResponse tokenizeResponse = tokenizationService.tokenize(tokenizeRequest);
                savedTokenId = tokenizeResponse.getToken();
            }
        } else {
            throw new PaymentException("Either payment token or card details must be provided");
        }

        // Create payment record
        Payment payment = Payment.builder()
            .customerId(request.getCustomerId())
            .amount(request.getAmount())
            .currency(request.getCurrency())
            .status(PaymentStatus.PENDING)
            .paymentMethodType(PaymentMethodType.CREDIT_CARD)
            .paymentTokenId(request.getPaymentToken())
            .lastFourDigits(cardDetails.getLastFourDigits())
            .cardBrand(cardDetails.getCardBrand())
            .orderId(request.getOrderId())
            .description(request.getDescription())
            .metadata(request.getMetadata())
            .ipAddress(request.getIpAddress())
            .build();

        payment = paymentRepository.save(payment);

        try {
            // Process payment through gateway
            PaymentGatewayResponse gatewayResponse = gatewayService.authorize(
                payment,
                cardDetails
            );

            // Update payment with gateway response
            if (gatewayResponse.isSuccess()) {
                payment.setStatus(PaymentStatus.AUTHORIZED);
                payment.setAuthorizationCode(gatewayResponse.getAuthorizationCode());
                payment.setGatewayTransactionId(gatewayResponse.getGatewayTransactionId());
                payment.setAuthorizedAt(LocalDateTime.now());
                log.info("Payment authorized successfully: {}", payment.getTransactionId());
            } else {
                payment.setStatus(PaymentStatus.DECLINED);
                payment.setFailureReason(gatewayResponse.getFailureReason());
                payment.setFailedAt(LocalDateTime.now());
                log.warn("Payment declined: {}, reason: {}",
                    payment.getTransactionId(), gatewayResponse.getFailureReason());
            }

            payment.setGatewayResponse(gatewayResponse.getRawResponse());

        } catch (Exception e) {
            payment.setStatus(PaymentStatus.FAILED);
            payment.setFailureReason("Gateway error: " + e.getMessage());
            payment.setFailedAt(LocalDateTime.now());
            log.error("Payment processing failed: {}", payment.getTransactionId(), e);
        }

        payment = paymentRepository.save(payment);

        // Build response
        return PaymentResponse.builder()
            .paymentId(payment.getId())
            .transactionId(payment.getTransactionId())
            .amount(payment.getAmount())
            .currency(payment.getCurrency())
            .status(payment.getStatus())
            .lastFourDigits(payment.getLastFourDigits())
            .cardBrand(payment.getCardBrand())
            .authorizationCode(payment.getAuthorizationCode())
            .gatewayTransactionId(payment.getGatewayTransactionId())
            .failureReason(payment.getFailureReason())
            .createdAt(payment.getCreatedAt())
            .savedPaymentToken(savedTokenId)
            .message(getStatusMessage(payment.getStatus()))
            .build();
    }

    /**
     * Captures an authorized payment
     */
    @Transactional
    public PaymentResponse capturePayment(String paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
            .orElseThrow(() -> new PaymentException("Payment not found"));

        if (payment.getStatus() != PaymentStatus.AUTHORIZED) {
            throw new PaymentException("Payment cannot be captured in current status: " + payment.getStatus());
        }

        try {
            PaymentGatewayResponse gatewayResponse = gatewayService.capture(payment);

            if (gatewayResponse.isSuccess()) {
                payment.setStatus(PaymentStatus.CAPTURED);
                payment.setCapturedAt(LocalDateTime.now());
                log.info("Payment captured successfully: {}", payment.getTransactionId());
            } else {
                payment.setStatus(PaymentStatus.FAILED);
                payment.setFailureReason(gatewayResponse.getFailureReason());
                log.warn("Payment capture failed: {}", payment.getTransactionId());
            }

        } catch (Exception e) {
            payment.setStatus(PaymentStatus.FAILED);
            payment.setFailureReason("Capture error: " + e.getMessage());
            log.error("Payment capture failed: {}", payment.getTransactionId(), e);
        }

        payment = paymentRepository.save(payment);

        return buildPaymentResponse(payment);
    }

    /**
     * Refunds a payment
     */
    @Transactional
    public PaymentResponse refundPayment(String paymentId, BigDecimal amount) {
        Payment payment = paymentRepository.findById(paymentId)
            .orElseThrow(() -> new PaymentException("Payment not found"));

        if (!payment.canBeRefunded()) {
            throw new PaymentException("Payment cannot be refunded");
        }

        if (amount.compareTo(payment.getRefundableAmount()) > 0) {
            throw new PaymentException("Refund amount exceeds refundable amount");
        }

        try {
            PaymentGatewayResponse gatewayResponse = gatewayService.refund(payment, amount);

            if (gatewayResponse.isSuccess()) {
                BigDecimal newRefundedAmount = payment.getRefundedAmount().add(amount);
                payment.setRefundedAmount(newRefundedAmount);

                if (newRefundedAmount.compareTo(payment.getAmount()) == 0) {
                    payment.setStatus(PaymentStatus.REFUNDED);
                } else {
                    payment.setStatus(PaymentStatus.PARTIALLY_REFUNDED);
                }

                payment.setRefundedAt(LocalDateTime.now());
                log.info("Payment refunded: {}, amount: {}", payment.getTransactionId(), amount);
            } else {
                throw new PaymentException("Refund failed: " + gatewayResponse.getFailureReason());
            }

        } catch (Exception e) {
            log.error("Refund failed: {}", payment.getTransactionId(), e);
            throw new PaymentException("Refund failed: " + e.getMessage());
        }

        payment = paymentRepository.save(payment);

        return buildPaymentResponse(payment);
    }

    /**
     * Gets payment by transaction ID
     */
    @Transactional(readOnly = true)
    public Payment getPaymentByTransactionId(String transactionId) {
        return paymentRepository.findByTransactionId(transactionId)
            .orElseThrow(() -> new PaymentException("Payment not found"));
    }

    /**
     * Gets all payments for a customer
     */
    @Transactional(readOnly = true)
    public List<Payment> getCustomerPayments(String customerId) {
        return paymentRepository.findByCustomerId(customerId);
    }

    private void validatePaymentRequest(PaymentRequest request) {
        if (request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new PaymentException("Payment amount must be greater than zero");
        }

        if (request.getPaymentToken() == null && request.getCardDetails() == null) {
            throw new PaymentException("Either payment token or card details must be provided");
        }
    }

    private PaymentResponse buildPaymentResponse(Payment payment) {
        return PaymentResponse.builder()
            .paymentId(payment.getId())
            .transactionId(payment.getTransactionId())
            .amount(payment.getAmount())
            .currency(payment.getCurrency())
            .status(payment.getStatus())
            .lastFourDigits(payment.getLastFourDigits())
            .cardBrand(payment.getCardBrand())
            .authorizationCode(payment.getAuthorizationCode())
            .gatewayTransactionId(payment.getGatewayTransactionId())
            .failureReason(payment.getFailureReason())
            .createdAt(payment.getCreatedAt())
            .message(getStatusMessage(payment.getStatus()))
            .build();
    }

    private String getStatusMessage(PaymentStatus status) {
        return switch (status) {
            case AUTHORIZED -> "Payment authorized successfully";
            case CAPTURED -> "Payment captured successfully";
            case DECLINED -> "Payment was declined";
            case FAILED -> "Payment processing failed";
            case REFUNDED -> "Payment refunded successfully";
            case PARTIALLY_REFUNDED -> "Payment partially refunded";
            default -> "Payment is " + status.name().toLowerCase();
        };
    }
}
