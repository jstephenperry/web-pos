package dev.jstephenperry.webpos.payment.controller;

import dev.jstephenperry.webpos.payment.dto.TokenizeRequest;
import dev.jstephenperry.webpos.payment.dto.TokenizeResponse;
import dev.jstephenperry.webpos.payment.model.PaymentToken;
import dev.jstephenperry.webpos.payment.service.TokenizationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller for payment tokenization operations
 */
@RestController
@RequestMapping("/v1/tokens")
@RequiredArgsConstructor
@Slf4j
public class TokenizationController {

    private final TokenizationService tokenizationService;

    /**
     * Tokenizes payment information
     */
    @PostMapping
    public ResponseEntity<TokenizeResponse> tokenize(@Valid @RequestBody TokenizeRequest request) {
        log.info("Tokenization request received for customer: {}", request.getCustomerId());
        TokenizeResponse response = tokenizationService.tokenize(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Revokes a payment token
     */
    @DeleteMapping("/{token}")
    public ResponseEntity<Map<String, String>> revokeToken(
            @PathVariable String token,
            @RequestParam String customerId) {

        log.info("Token revocation request for customer: {}", customerId);
        tokenizationService.revokeToken(token, customerId);

        return ResponseEntity.ok(Map.of(
            "message", "Token revoked successfully",
            "token", token
        ));
    }

    /**
     * Gets all active tokens for a customer
     */
    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<PaymentToken>> getCustomerTokens(@PathVariable String customerId) {
        log.info("Fetching tokens for customer: {}", customerId);
        List<PaymentToken> tokens = tokenizationService.getCustomerTokens(customerId);
        return ResponseEntity.ok(tokens);
    }

    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "service", "tokenization"
        ));
    }
}
