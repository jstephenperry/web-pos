package dev.jstephenperry.webpos.payment.controller;

import dev.jstephenperry.webpos.payment.dto.PaymentRequest;
import dev.jstephenperry.webpos.payment.dto.PaymentResponse;
import dev.jstephenperry.webpos.payment.model.Payment;
import dev.jstephenperry.webpos.payment.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * REST controller for payment operations
 */
@RestController
@RequestMapping("/v1/payments")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

    private final PaymentService paymentService;

    /**
     * Processes a new payment
     */
    @PostMapping
    public ResponseEntity<PaymentResponse> processPayment(@Valid @RequestBody PaymentRequest request) {
        log.info("Payment request received for customer: {}, amount: {} {}",
            request.getCustomerId(), request.getAmount(), request.getCurrency());

        PaymentResponse response = paymentService.processPayment(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Captures an authorized payment
     */
    @PostMapping("/{paymentId}/capture")
    public ResponseEntity<PaymentResponse> capturePayment(@PathVariable String paymentId) {
        log.info("Capture request for payment: {}", paymentId);
        PaymentResponse response = paymentService.capturePayment(paymentId);
        return ResponseEntity.ok(response);
    }

    /**
     * Refunds a payment
     */
    @PostMapping("/{paymentId}/refund")
    public ResponseEntity<PaymentResponse> refundPayment(
            @PathVariable String paymentId,
            @RequestBody Map<String, BigDecimal> refundRequest) {

        BigDecimal amount = refundRequest.get("amount");
        log.info("Refund request for payment: {}, amount: {}", paymentId, amount);

        PaymentResponse response = paymentService.refundPayment(paymentId, amount);
        return ResponseEntity.ok(response);
    }

    /**
     * Gets payment by transaction ID
     */
    @GetMapping("/transaction/{transactionId}")
    public ResponseEntity<Payment> getPaymentByTransactionId(@PathVariable String transactionId) {
        log.info("Fetching payment by transaction ID: {}", transactionId);
        Payment payment = paymentService.getPaymentByTransactionId(transactionId);
        return ResponseEntity.ok(payment);
    }

    /**
     * Gets all payments for a customer
     */
    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<Payment>> getCustomerPayments(@PathVariable String customerId) {
        log.info("Fetching payments for customer: {}", customerId);
        List<Payment> payments = paymentService.getCustomerPayments(customerId);
        return ResponseEntity.ok(payments);
    }

    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "service", "payment"
        ));
    }
}
