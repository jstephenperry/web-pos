package dev.jstephenperry.webpos.payment.service;

import dev.jstephenperry.webpos.payment.dto.CardDetails;
import dev.jstephenperry.webpos.payment.dto.TokenizeRequest;
import dev.jstephenperry.webpos.payment.dto.TokenizeResponse;
import dev.jstephenperry.webpos.payment.repository.PaymentTokenRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
class TokenizationServiceTest {

    @Autowired
    private TokenizationService tokenizationService;

    @Autowired
    private PaymentTokenRepository tokenRepository;

    @Test
    void testTokenization() {
        // Arrange
        CardDetails cardDetails = CardDetails.builder()
            .cardNumber("4532015112830366")
            .cardholderName("John Doe")
            .expiryMonth("12")
            .expiryYear("2027")
            .cvv("123")
            .billingZip("12345")
            .build();

        TokenizeRequest request = TokenizeRequest.builder()
            .customerId("customer123")
            .cardDetails(cardDetails)
            .build();

        // Act
        TokenizeResponse response = tokenizationService.tokenize(request);

        // Assert
        assertNotNull(response);
        assertNotNull(response.getToken());
        assertTrue(response.getToken().startsWith("tok_"));
        assertEquals("0366", response.getLastFourDigits());
        assertEquals("VISA", response.getCardBrand());
        assertNotNull(response.getCreatedAt());
        assertNotNull(response.getExpiresAt());
    }

    @Test
    void testDetokenization() {
        // Arrange
        CardDetails cardDetails = CardDetails.builder()
            .cardNumber("4532015112830366")
            .cardholderName("John Doe")
            .expiryMonth("12")
            .expiryYear("2027")
            .cvv("123")
            .build();

        TokenizeRequest tokenizeRequest = TokenizeRequest.builder()
            .customerId("customer123")
            .cardDetails(cardDetails)
            .build();

        TokenizeResponse tokenizeResponse = tokenizationService.tokenize(tokenizeRequest);

        // Act
        CardDetails retrievedCardDetails = tokenizationService.detokenize(
            tokenizeResponse.getToken(),
            "customer123"
        );

        // Assert
        assertNotNull(retrievedCardDetails);
        assertEquals(cardDetails.getCardNumber(), retrievedCardDetails.getCardNumber());
        assertEquals(cardDetails.getCardholderName(), retrievedCardDetails.getCardholderName());
        assertEquals(cardDetails.getCvv(), retrievedCardDetails.getCvv());
    }
}
