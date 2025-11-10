package dev.jstephenperry.webpos.payment.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.jstephenperry.webpos.payment.dto.CardDetails;
import dev.jstephenperry.webpos.payment.dto.TokenizeRequest;
import dev.jstephenperry.webpos.payment.dto.TokenizeResponse;
import dev.jstephenperry.webpos.payment.exception.TokenizationException;
import dev.jstephenperry.webpos.payment.model.PaymentMethodType;
import dev.jstephenperry.webpos.payment.model.PaymentToken;
import dev.jstephenperry.webpos.payment.model.TokenStatus;
import dev.jstephenperry.webpos.payment.repository.PaymentTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.Optional;

/**
 * Service for tokenizing payment information
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class TokenizationService {

    private final PaymentTokenRepository tokenRepository;
    private final EncryptionService encryptionService;
    private final ObjectMapper objectMapper;

    @Value("${payment.tokenization.token.prefix:tok_}")
    private String tokenPrefix;

    @Value("${payment.tokenization.token.length:32}")
    private int tokenLength;

    @Value("${payment.tokenization.token.expiry-hours:24}")
    private int defaultExpiryHours;

    private static final SecureRandom secureRandom = new SecureRandom();

    /**
     * Tokenizes card details
     */
    @Transactional
    public TokenizeResponse tokenize(TokenizeRequest request) {
        try {
            CardDetails cardDetails = request.getCardDetails();

            // Validate card (basic validation)
            validateCardDetails(cardDetails);

            // Generate unique token
            String token = generateToken();

            // Serialize card details to JSON
            String cardDataJson = objectMapper.writeValueAsString(cardDetails);

            // Encrypt card data
            String encryptedData = encryptionService.encrypt(
                cardDataJson,
                request.getCustomerId()
            );

            // Calculate expiry
            int expiryHours = request.getExpiryHours() != null
                ? request.getExpiryHours()
                : defaultExpiryHours;

            LocalDateTime expiresAt = LocalDateTime.now().plusHours(expiryHours);

            // Create and save token entity
            PaymentToken paymentToken = PaymentToken.builder()
                .token(token)
                .customerId(request.getCustomerId())
                .paymentMethodType(PaymentMethodType.CREDIT_CARD)
                .encryptedData(encryptedData)
                .encryptionKeyVersion(encryptionService.getKeyVersion())
                .lastFourDigits(cardDetails.getLastFourDigits())
                .cardBrand(cardDetails.getCardBrand())
                .expiryDate(cardDetails.getExpiryDate())
                .status(TokenStatus.ACTIVE)
                .expiresAt(expiresAt)
                .metadata(request.getMetadata())
                .build();

            paymentToken = tokenRepository.save(paymentToken);

            log.info("Successfully tokenized payment method for customer: {}", request.getCustomerId());

            return TokenizeResponse.builder()
                .tokenId(paymentToken.getId())
                .token(paymentToken.getToken())
                .lastFourDigits(paymentToken.getLastFourDigits())
                .cardBrand(paymentToken.getCardBrand())
                .expiryDate(paymentToken.getExpiryDate())
                .createdAt(paymentToken.getCreatedAt())
                .expiresAt(paymentToken.getExpiresAt())
                .message("Payment method successfully tokenized")
                .build();

        } catch (JsonProcessingException e) {
            log.error("Failed to serialize card details", e);
            throw new TokenizationException("Failed to process card details");
        }
    }

    /**
     * Retrieves and decrypts card details from a token
     */
    @Transactional(readOnly = true)
    public CardDetails detokenize(String token, String customerId) {
        PaymentToken paymentToken = tokenRepository.findByToken(token)
            .orElseThrow(() -> new TokenizationException("Invalid token"));

        // Verify customer owns this token
        if (!paymentToken.getCustomerId().equals(customerId)) {
            throw new TokenizationException("Token does not belong to customer");
        }

        // Verify token is valid
        if (!paymentToken.isValid()) {
            throw new TokenizationException("Token is expired or invalid");
        }

        try {
            // Decrypt card data
            String cardDataJson = encryptionService.decrypt(
                paymentToken.getEncryptedData(),
                customerId
            );

            // Deserialize to CardDetails
            CardDetails cardDetails = objectMapper.readValue(cardDataJson, CardDetails.class);

            // Update last used timestamp
            paymentToken.setLastUsedAt(LocalDateTime.now());
            tokenRepository.save(paymentToken);

            return cardDetails;

        } catch (JsonProcessingException e) {
            log.error("Failed to deserialize card details", e);
            throw new TokenizationException("Failed to process token");
        }
    }

    /**
     * Revokes a token
     */
    @Transactional
    public void revokeToken(String token, String customerId) {
        PaymentToken paymentToken = tokenRepository.findByToken(token)
            .orElseThrow(() -> new TokenizationException("Invalid token"));

        if (!paymentToken.getCustomerId().equals(customerId)) {
            throw new TokenizationException("Token does not belong to customer");
        }

        paymentToken.setStatus(TokenStatus.REVOKED);
        paymentToken.setRevokedAt(LocalDateTime.now());
        tokenRepository.save(paymentToken);

        log.info("Token revoked for customer: {}", customerId);
    }

    /**
     * Gets all active tokens for a customer
     */
    @Transactional(readOnly = true)
    public List<PaymentToken> getCustomerTokens(String customerId) {
        return tokenRepository.findByCustomerIdAndStatus(customerId, TokenStatus.ACTIVE);
    }

    /**
     * Generates a secure random token
     */
    private String generateToken() {
        byte[] randomBytes = new byte[tokenLength];
        secureRandom.nextBytes(randomBytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
        return tokenPrefix + token.substring(0, Math.min(token.length(), tokenLength));
    }

    /**
     * Basic card validation
     */
    private void validateCardDetails(CardDetails cardDetails) {
        if (!isValidLuhn(cardDetails.getCardNumber())) {
            throw new TokenizationException("Invalid card number");
        }

        // Check expiry date
        int month = Integer.parseInt(cardDetails.getExpiryMonth());
        int year = Integer.parseInt(cardDetails.getExpiryYear());
        LocalDateTime now = LocalDateTime.now();

        if (year < now.getYear() || (year == now.getYear() && month < now.getMonthValue())) {
            throw new TokenizationException("Card has expired");
        }
    }

    /**
     * Luhn algorithm for card number validation
     */
    private boolean isValidLuhn(String cardNumber) {
        int sum = 0;
        boolean alternate = false;

        for (int i = cardNumber.length() - 1; i >= 0; i--) {
            int digit = Character.getNumericValue(cardNumber.charAt(i));

            if (alternate) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9;
                }
            }

            sum += digit;
            alternate = !alternate;
        }

        return sum % 10 == 0;
    }
}
