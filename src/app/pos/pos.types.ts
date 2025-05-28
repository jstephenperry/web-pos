// TypeScript interfaces for the POS (Point of Sale) system
import { FormEvent } from "react";

export interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  viewMode?: "card" | "list";
}

export interface CartItemProps {
  item: CartItem;
  onUpdateQuantity: (id: number, quantity: number) => void;
  onRemove: (id: number) => void;
}

// Payment API interfaces based on Swagger spec
export interface Address {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  countryCode?: string;
}

export interface Card {
  number: string;
  expiryMonth: number;
  expiryYear: number;
  cvv: string;
  cardholderName: string;
  brand?: string;
}

export interface PaymentRequest {
  merchantReference?: string;
  amount: number;
  currencyCode: string;
  card: Card;
  billingAddress?: Address;
  shippingAddress?: Address;
  customerEmail?: string;
  description?: string;
  recurring?: boolean;
  storeCard?: boolean;
}

export type PaymentStatus = 'AUTHORIZED' | 'CAPTURED' | 'DECLINED' | 'ERROR' | 'PENDING';

export interface PaymentResponse {
  merchantReference?: string;
  transactionId?: string;
  status?: PaymentStatus;
  amount?: number;
  currencyCode?: string;
  timestamp?: string;
  errorCode?: string;
  errorMessage?: string;
  authorizationCode?: string;
  last4?: string;
  cardBrand?: string;
  cardToken?: string;
  rawResponse?: string;
}

// Legacy payment details interface (kept for backward compatibility)
export interface PaymentDetails {
  cardName?: string;
  cardNumber?: string;
  expDate?: string;
  cvv?: string;
}

export interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartSubtotal: number;
  taxRate: number;
  taxAmount: number;
  cartTotal: number;
  onSubmit: (e: FormEvent, paymentDetails: PaymentDetails) => void;
  paymentDetails?: PaymentDetails;
}

export interface TransactionCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export type FailureReason = 'invalid_cvv' | 'processor_failure' | 'network_error';

export interface TransactionFailedModalProps {
  isOpen: boolean;
  onClose: () => void;
  failureReason: FailureReason;
}
