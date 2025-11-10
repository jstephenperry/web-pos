package dev.jstephenperry.webpos.payment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for credit/debit card details
 * This data should be handled securely and never logged
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CardDetails {

    @NotBlank(message = "Card number is required")
    @Pattern(regexp = "^[0-9]{13,19}$", message = "Invalid card number format")
    private String cardNumber;

    @NotBlank(message = "Cardholder name is required")
    @Size(min = 2, max = 100, message = "Cardholder name must be between 2 and 100 characters")
    private String cardholderName;

    @NotBlank(message = "Expiry month is required")
    @Pattern(regexp = "^(0[1-9]|1[0-2])$", message = "Expiry month must be between 01 and 12")
    private String expiryMonth;

    @NotBlank(message = "Expiry year is required")
    @Pattern(regexp = "^20[2-9][0-9]$", message = "Invalid expiry year format")
    private String expiryYear;

    @NotBlank(message = "CVV is required")
    @Pattern(regexp = "^[0-9]{3,4}$", message = "CVV must be 3 or 4 digits")
    private String cvv;

    @Size(max = 100, message = "Billing ZIP code must be less than 100 characters")
    private String billingZip;

    public String getExpiryDate() {
        return expiryMonth + "/" + expiryYear;
    }

    public String getLastFourDigits() {
        if (cardNumber != null && cardNumber.length() >= 4) {
            return cardNumber.substring(cardNumber.length() - 4);
        }
        return "";
    }

    public String getCardBrand() {
        if (cardNumber == null || cardNumber.isEmpty()) {
            return "UNKNOWN";
        }

        String firstDigit = cardNumber.substring(0, 1);
        String firstTwoDigits = cardNumber.length() >= 2 ? cardNumber.substring(0, 2) : "";

        if (firstDigit.equals("4")) {
            return "VISA";
        } else if (firstTwoDigits.compareTo("51") >= 0 && firstTwoDigits.compareTo("55") <= 0) {
            return "MASTERCARD";
        } else if (firstTwoDigits.equals("34") || firstTwoDigits.equals("37")) {
            return "AMEX";
        } else if (firstTwoDigits.equals("60") || firstTwoDigits.equals("65")) {
            return "DISCOVER";
        }

        return "UNKNOWN";
    }

    // Override toString to prevent accidental logging of sensitive data
    @Override
    public String toString() {
        return "CardDetails{" +
                "lastFourDigits='" + getLastFourDigits() + '\'' +
                ", cardBrand='" + getCardBrand() + '\'' +
                ", expiryDate='" + getExpiryDate() + '\'' +
                '}';
    }
}
