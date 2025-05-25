"use client";

import React, { useState, memo, useEffect } from 'react';
import { CheckoutModalProps, PaymentDetails } from './pos.types';

// Checkout Modal Component
const CheckoutModal = memo(function CheckoutModal({ isOpen, onClose, cartSubtotal, taxRate, taxAmount, cartTotal, onSubmit, paymentDetails }: CheckoutModalProps) {
  // Card brand definitions with patterns, max lengths, and CVV lengths
  const cardBrands = [
    { name: 'visa', pattern: /^4/, maxLength: 16, cvvLength: 3, icon: '💳 V' },
    { name: 'mastercard', pattern: /^5[1-5]/, maxLength: 16, cvvLength: 3, icon: '💳 M' },
    { name: 'amex', pattern: /^3[47]/, maxLength: 15, cvvLength: 4, icon: '💳 A' },
    { name: 'discover', pattern: /^6(?:011|5)/, maxLength: 16, cvvLength: 3, icon: '💳 D' },
    { name: 'diners', pattern: /^3(?:0[0-5]|[68])/, maxLength: 14, cvvLength: 3, icon: '💳 DC' },
    { name: 'jcb', pattern: /^35/, maxLength: 16, cvvLength: 3, icon: '💳 J' }
  ];

  // State for payment details
  const [cardName, setCardName] = useState<string>(paymentDetails?.cardName || '');
  const [cardNumber, setCardNumber] = useState<string>(paymentDetails?.cardNumber || '');
  const [expDate, setExpDate] = useState<string>(paymentDetails?.expDate || '');
  const [cvv, setCvv] = useState<string>(paymentDetails?.cvv || '');

  // State for card brand
  const [cardBrand, setCardBrand] = useState<{ name: string; maxLength: number; cvvLength: number; icon: string } | null>(null);

  // State for expiration date error message
  const [expDateError, setExpDateError] = useState<string>('');

  // Function to identify card brand from number
  const identifyCardBrand = (cardNumber: string) => {
    const cleanNumber = cardNumber.replace(/\D/g, '');

    if (!cleanNumber) {
      setCardBrand(null);
      return null;
    }

    const brand = cardBrands.find(brand => brand.pattern.test(cleanNumber));
    setCardBrand(brand || null);
    return brand;
  };

  // Initialize card brand if cardNumber is provided
  useEffect(() => {
    if (paymentDetails?.cardNumber) {
      identifyCardBrand(paymentDetails.cardNumber);
    }
  }, [paymentDetails?.cardNumber]);

  // Reset form fields when paymentDetails changes
  useEffect(() => {
    setCardName(paymentDetails?.cardName || '');
    setCardNumber(paymentDetails?.cardNumber || '');
    setExpDate(paymentDetails?.expDate || '');
    setCvv(paymentDetails?.cvv || '');

    if (!paymentDetails?.cardNumber) {
      setCardBrand(null);
    }
  }, [paymentDetails]);

  if (!isOpen) return null;

  // Handle card number input change
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const value = input.value.replace(/\D/g, '');

    // Identify card brand
    const brand = identifyCardBrand(value);

    // Limit length based on card brand
    const maxLength = brand ? brand.maxLength : 16;

    // Truncate value to max length for the card type
    const limitedValue = value.slice(0, maxLength);

    // Format with spaces every 4 digits
    let formattedValue = '';
    for (let i = 0; i < limitedValue.length; i++) {
      if (i > 0 && i % 4 === 0) {
        formattedValue += ' ';
      }
      formattedValue += limitedValue[i];
    }

    input.value = formattedValue;
    setCardNumber(formattedValue);
  };

  // Function to format expiration date input (MM/YY)
  const formatExpirationDate = (value: string) => {
    // Remove any non-digit characters
    const cleanValue = value.replace(/\D/g, '');

    // Limit to 4 digits
    const limitedValue = cleanValue.slice(0, 4);

    // Format as MM/YY
    if (limitedValue.length <= 2) {
      return limitedValue;
    } else {
      return `${limitedValue.slice(0, 2)}/${limitedValue.slice(2, 4)}`;
    }
  };

  // Check if expiration date is valid and not expired
  const isExpirationDateValid = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');

    if (cleanValue.length !== 4) return false;

    const month = parseInt(cleanValue.slice(0, 2), 10);
    const year = parseInt(cleanValue.slice(2, 4), 10);

    // Check if month is valid (1-12)
    if (month < 1 || month > 12) return false;

    // Get current date
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100; // Get last 2 digits
    const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11

    // Check if card is expired
    return !(year < currentYear || (year === currentYear && month < currentMonth));
  };

  // Handle expiration date input change
  const handleExpDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    input.value = formatExpirationDate(input.value);
    setExpDate(input.value);

    // Get the clean value (digits only)
    const cleanValue = input.value.replace(/\D/g, '');

    // Validate expiration date as soon as possible
    if (cleanValue.length >= 2) {
      // Check month validity as soon as we have 2 digits for the month
      const month = parseInt(cleanValue.slice(0, 2), 10);

      if (month < 1 || month > 12) {
        const errorMsg = 'Invalid month (must be 01-12)';
        input.setCustomValidity(errorMsg);
        setExpDateError(errorMsg);
        return;
      }

      // If we have a complete date (MM/YY), do full validation
      if (cleanValue.length === 4) {
        const isValid = isExpirationDateValid(input.value);
        if (!isValid) {
          // Get current date for more specific error message
          const currentDate = new Date();
          const currentYear = currentDate.getFullYear() % 100; // Get last 2 digits
          const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11

          const year = parseInt(cleanValue.slice(2, 4), 10);

          let errorMsg: string;
          if (year < currentYear) {
            errorMsg = 'Card is expired';
          } else if (year === currentYear && month < currentMonth) {
            errorMsg = 'Card is expired';
          } else {
            errorMsg = 'Invalid expiration date';
          }
          input.setCustomValidity(errorMsg);
          setExpDateError(errorMsg);
        } else {
          input.setCustomValidity('');
          setExpDateError('');
        }
      } else {
        // We have a valid month but incomplete date
        input.setCustomValidity('');
        setExpDateError('');
      }
    } else {
      // Not enough digits to validate yet
      input.setCustomValidity('');
      setExpDateError('');
    }
  };

  // Handle CVV input change
  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    // Remove any non-digit characters
    // Set the value
    input.value = input.value.replace(/\D/g, '');
    setCvv(input.value);
  };

  // Handle card name input change
  const handleCardNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardName(e.target.value);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Checkout</h2>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-700 active:text-gray-900 dark:hover:text-gray-300 dark:active:text-gray-100 rounded-full text-2xl font-bold"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="mb-4">
          <div className="border-b border-gray-200 dark:border-gray-700 pb-2 mb-2">
            <div className="flex justify-between mb-1">
              <span>Subtotal:</span>
              <span>${cartSubtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span>Tax ({taxRate}%):</span>
              <span>${taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-medium">
              <span>Grand Total:</span>
              <span>${cartTotal.toFixed(2)}</span>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Please enter your payment details below</p>
        </div>

        <form onSubmit={(e) => {
          const paymentDetails = {
            cardName,
            cardNumber,
            expDate,
            cvv
          };
          onSubmit(e, paymentDetails);
        }} autoComplete="on">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" htmlFor="cardName">
              Name on Card
            </label>
            <input
              type="text"
              id="cardName"
              name="ccname"
              autoComplete="cc-name"
              className="w-full p-3 border border-input-border bg-input-background text-input-foreground rounded-md text-base"
              placeholder="John Doe"
              value={cardName}
              onChange={handleCardNameChange}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" htmlFor="cardNumber">
              Card Number
            </label>
            <div className="relative">
              <input
                type="text"
                id="cardNumber"
                name="cardnumber"
                autoComplete="cc-number"
                className="w-full p-3 border border-input-border bg-input-background text-input-foreground rounded-md text-base"
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChange={handleCardNumberChange}
                required
              />
              {cardBrand && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 capitalize">
                  {cardBrand.name}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="expDate">
                Expiration Date
              </label>
              <input
                type="text"
                id="expDate"
                name="expdate"
                autoComplete="cc-exp"
                className={`w-full p-3 border ${expDateError ? 'border-red-500' : 'border-input-border'} bg-input-background text-input-foreground rounded-md text-base`}
                placeholder="MM/YY"
                value={expDate}
                onChange={handleExpDateChange}
                maxLength={5}
                required
              />
              {expDateError && (
                <div className="text-red-500 text-sm mt-1">
                  {expDateError}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="cvv">
                CVV
              </label>
              <input
                type="text"
                id="cvv"
                name="cvc"
                autoComplete="cc-csc"
                className="w-full p-3 border border-input-border bg-input-background text-input-foreground rounded-md text-base"
                placeholder="123"
                value={cvv}
                onChange={handleCvvChange}
                maxLength={cardBrand ? cardBrand.cvvLength : 3}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 border border-input-border bg-button-secondary-background hover:bg-button-secondary-background/90 active:bg-button-secondary-background/70 text-button-secondary-foreground rounded-md text-base font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-3 bg-button-primary-background hover:bg-button-primary-background/90 active:bg-button-primary-background/70 text-button-primary-foreground rounded-md text-base font-medium transition-colors"
            >
              Pay Now
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

export default CheckoutModal;
