package dev.jstephenperry.webpos.payment.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for tokenizing payment information
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TokenizeRequest {

    @NotBlank(message = "Customer ID is required")
    private String customerId;

    @NotNull(message = "Card details are required")
    @Valid
    private CardDetails cardDetails;

    private String metadata;

    private Integer expiryHours;
}
