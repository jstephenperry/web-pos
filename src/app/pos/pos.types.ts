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
