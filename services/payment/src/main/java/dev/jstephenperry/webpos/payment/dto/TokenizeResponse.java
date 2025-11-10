package dev.jstephenperry.webpos.payment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO after successful tokenization
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TokenizeResponse {

    private String tokenId;
    private String token;
    private String lastFourDigits;
    private String cardBrand;
    private String expiryDate;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private String message;
}
