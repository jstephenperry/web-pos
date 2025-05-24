"use client";

import React, {FormEvent, useEffect, useState} from "react";
import Image from "next/image";
import { Product, type CartItem, ProductCardProps, CartItemProps, CheckoutModalProps } from "./pos.types";

// Sample product data
const sampleProducts: Product[] = [
  { id: 1, name: "Coffee", price: 3.50, image: "/assets/coffee.svg" },
  { id: 2, name: "Tea", price: 2.50, image: "/assets/tea.svg" },
  { id: 3, name: "Sandwich", price: 5.99, image: "/assets/sandwich.svg" },
  { id: 4, name: "Salad", price: 6.99, image: "/assets/salad.svg" },
  { id: 5, name: "Cake", price: 4.50, image: "/assets/cake.svg" },
  { id: 6, name: "Cookie", price: 1.99, image: "/assets/cookie.svg" },
  { id: 7, name: "Popcorn", price: 4.99, image: "/assets/popcorn.svg" },
  { id: 8, name: "Soda", price: 2.99, image: "/assets/soda.svg" },
  { id: 9, name: "Hot Dog", price: 5.50, image: "/assets/hotdog.svg" },
  { id: 10, name: "Nachos", price: 6.50, image: "/assets/nachos.svg" },
  { id: 11, name: "Pretzel", price: 3.99, image: "/assets/pretzel.svg" },
  { id: 12, name: "Ice Cream", price: 4.25, image: "/assets/icecream.svg" },
];

// Product Card Component
function ProductCard({ product, onAddToCart, viewMode = "card" }: ProductCardProps & { viewMode?: "card" | "list" }) {
  if (viewMode === "list") {
    return (
      <div className="bg-background rounded-lg shadow-md p-4 flex items-center justify-between">
        <div className="flex items-center">
          <div className="relative h-16 w-16 mr-4 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center">
            <div className="flex items-center justify-center w-full h-full text-gray-400">
              <Image 
                src={product.image} 
                alt={product.name}
                width={48}
                height={48}
                className="h-12 w-12 object-contain" 
              />
            </div>
          </div>
          <div>
            <h3 className="font-semibold">{product.name}</h3>
            <p className="text-gray-600 dark:text-gray-300">${product.price.toFixed(2)}</p>
          </div>
        </div>
        <button 
          onClick={() => onAddToCart(product)}
          className="bg-button-primary-background hover:bg-button-primary-background/90 active:bg-button-primary-background/70 text-button-primary-foreground py-3 px-5 rounded-md transition-colors text-base font-medium"
        >
          Add to Cart
        </button>
      </div>
    );
  }

  // Card view (default)
  return (
    <div className="bg-background rounded-lg shadow-md p-4 flex flex-col">
      <div className="relative h-32 w-full mb-2 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center">
        {/* Display product image or fallback */}
        <div className="flex items-center justify-center w-full h-full text-gray-400">
          <Image 
            src={product.image} 
            alt={product.name}
            width={96}
            height={96}
            className="h-24 w-24 object-contain" 
          />
        </div>
      </div>
      <h3 className="font-semibold text-lg">{product.name}</h3>
      <p className="text-gray-600 dark:text-gray-300 mb-2">${product.price.toFixed(2)}</p>
      <button 
        onClick={() => onAddToCart(product)}
        className="mt-auto bg-button-primary-background hover:bg-button-primary-background/90 active:bg-button-primary-background/70 text-button-primary-foreground py-3 px-5 rounded-md transition-colors text-base font-medium"
      >
        Add to Cart
      </button>
    </div>
  );
}

// Cart Item Component
function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
      <div className="flex-1">
        <h4 className="font-medium">{item.name}</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">${item.price.toFixed(2)} each</p>
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
          className="w-10 h-10 flex items-center justify-center bg-button-secondary-background hover:bg-button-secondary-background/90 active:bg-button-secondary-background/70 text-button-secondary-foreground rounded-md text-xl font-bold"
          disabled={item.quantity <= 1}
        >
          -
        </button>
        <span className="w-10 text-center text-lg">{item.quantity}</span>
        <button 
          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
          className="w-10 h-10 flex items-center justify-center bg-button-secondary-background hover:bg-button-secondary-background/90 active:bg-button-secondary-background/70 text-button-secondary-foreground rounded-md text-xl font-bold"
        >
          +
        </button>
        <button 
          onClick={() => onRemove(item.id)}
          className="ml-3 w-10 h-10 flex items-center justify-center text-red-500 hover:text-red-700 active:text-red-300 dark:text-red-400 dark:hover:text-red-300 text-xl font-bold"
        >
          ×
        </button>
      </div>
    </div>
  );
}

// Checkout Modal Component
function CheckoutModal({ isOpen, onClose, cartSubtotal, taxRate, taxAmount, cartTotal, onSubmit }: CheckoutModalProps) {
  // Card brand definitions with patterns, max lengths, and CVV lengths
  const cardBrands = [
    { name: 'visa', pattern: /^4/, maxLength: 16, cvvLength: 3, icon: '💳 V' },
    { name: 'mastercard', pattern: /^5[1-5]/, maxLength: 16, cvvLength: 3, icon: '💳 M' },
    { name: 'amex', pattern: /^3[47]/, maxLength: 15, cvvLength: 4, icon: '💳 A' },
    { name: 'discover', pattern: /^6(?:011|5)/, maxLength: 16, cvvLength: 3, icon: '💳 D' },
    { name: 'diners', pattern: /^3(?:0[0-5]|[68])/, maxLength: 14, cvvLength: 3, icon: '💳 DC' },
    { name: 'jcb', pattern: /^35/, maxLength: 16, cvvLength: 3, icon: '💳 J' }
  ];

  // State for card brand
  const [cardBrand, setCardBrand] = useState<{ name: string; maxLength: number; cvvLength: number; icon: string } | null>(null);

  // State for expiration date error message
  const [expDateError, setExpDateError] = useState<string>('');

  if (!isOpen) return null;

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

        <form onSubmit={onSubmit} autoComplete="on">
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
}

export default function POSPage() {
  // Initialize cart with empty array to avoid hydration mismatch
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMethod, setSortMethod] = useState<"sequential" | "alphabetical">("sequential");
  const [viewMode, setViewMode] = useState<"card" | "list">("card");

  // Load cart and settings from localStorage only on the client side after initial render
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('posCart');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }

      const savedSortMethod = localStorage.getItem('posSortMethod');
      if (savedSortMethod && (savedSortMethod === 'sequential' || savedSortMethod === 'alphabetical')) {
        setSortMethod(savedSortMethod as "sequential" | "alphabetical");
      }

      const savedViewMode = localStorage.getItem('posViewMode');
      if (savedViewMode && (savedViewMode === 'card' || savedViewMode === 'list')) {
        setViewMode(savedViewMode as "card" | "list");
      }
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('posCart', JSON.stringify(cart));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [cart]);

  // Save sort method to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('posSortMethod', sortMethod);
    } catch (error) {
      console.error('Error saving sort method to localStorage:', error);
    }
  }, [sortMethod]);

  // Save view mode to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('posViewMode', viewMode);
    } catch (error) {
      console.error('Error saving view mode to localStorage:', error);
    }
  }, [viewMode]);

  // Add product to cart
  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);

      if (existingItem) {
        // Update quantity if product already in cart
        return prevCart.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      } else {
        // Add new product to cart
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
  };

  // Update item quantity
  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) return;

    setCart(prevCart => 
      prevCart.map(item => 
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  // Remove item from cart
  const removeItem = (id: number) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id));
  };

  // Tax rate constant
  const TAX_RATE = 8.25;

  // Calculate cart subtotal
  const cartSubtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  // Calculate tax and grand total
  const taxAmount = cartSubtotal * (TAX_RATE / 100);
  const cartTotal = cartSubtotal + taxAmount;

  // Handle checkout form submission
  const handleCheckoutSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Here you would typically process the payment
    // For this example, we'll just close the modal and clear the cart
    alert('Payment successful!');
    setIsCheckoutModalOpen(false);
    setCart([]);

    // Reset to default settings after successful checkout
    try {
      localStorage.removeItem('posCart');
      // Reset sort method to sequential (default)
      setSortMethod("sequential");
      localStorage.setItem('posSortMethod', 'sequential');
      // Reset view mode to card (default)
      setViewMode("card");
      localStorage.setItem('posViewMode', 'card');
    } catch (error) {
      console.error('Error clearing data from localStorage:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-foreground">
      {/* Header */}
      <header className="bg-background shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">Point of Sale</h1>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Cashier: Demo User
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-[calc(100vh-8rem)]">
          {/* Product Grid */}
          <div className="lg:col-span-2 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <h2 className="text-xl font-semibold mr-4">Products</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setViewMode("card")}
                    className={`px-4 py-2 text-sm rounded-md flex items-center ${
                      viewMode === "card"
                        ? "bg-button-primary-background text-button-primary-foreground"
                        : "bg-button-secondary-background text-button-secondary-foreground"
                    } hover:opacity-90 active:opacity-70 transition-opacity`}
                    aria-label="Card view"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    Cards
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`px-4 py-2 text-sm rounded-md flex items-center ${
                      viewMode === "list"
                        ? "bg-button-primary-background text-button-primary-foreground"
                        : "bg-button-secondary-background text-button-secondary-foreground"
                    } hover:opacity-90 active:opacity-70 transition-opacity`}
                    aria-label="List view"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    List
                  </button>
                </div>
              </div>
              <div className="relative w-72">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full p-3 pl-10 pr-10 border border-input-border bg-input-background text-input-foreground rounded-md text-base"
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 active:text-gray-800 dark:hover:text-gray-300 dark:active:text-gray-100 focus:outline-none rounded-full"
                    aria-label="Clear search"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            <div className="overflow-y-auto max-h-[calc(100vh-12rem)] scrollable-container">
              <div className={`${
                viewMode === "list" 
                  ? "flex flex-col space-y-2" 
                  : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
              }`}>
                {sampleProducts
                  .filter(product => 
                    product.name.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map(product => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      onAddToCart={addToCart}
                      viewMode={viewMode}
                    />
                  ))
                }
              </div>
            </div>
          </div>

          {/* Cart */}
          <div className="bg-background rounded-lg shadow-md p-4 flex flex-col h-full">
            <h2 className="text-xl font-semibold mb-4">Cart</h2>

            {cart.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                Your cart is empty
              </p>
            ) : (
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Sort by:</span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSortMethod("sequential")}
                      className={`px-4 py-2 text-sm rounded-md ${
                        sortMethod === "sequential"
                          ? "bg-button-primary-background text-button-primary-foreground"
                          : "bg-button-secondary-background text-button-secondary-foreground"
                      } hover:opacity-90 active:opacity-70 transition-opacity`}
                    >
                      Sequential
                    </button>
                    <button
                      onClick={() => setSortMethod("alphabetical")}
                      className={`px-4 py-2 text-sm rounded-md ${
                        sortMethod === "alphabetical"
                          ? "bg-button-primary-background text-button-primary-foreground"
                          : "bg-button-secondary-background text-button-secondary-foreground"
                      } hover:opacity-90 active:opacity-70 transition-opacity`}
                    >
                      Alphabetical
                    </button>
                  </div>
                </div>
                <div className="mb-4 overflow-y-auto max-h-[calc(100vh-20rem)] scrollable-container">
                  {[...cart]
                    .sort((a, b) => {
                      if (sortMethod === "alphabetical") {
                        return a.name.localeCompare(b.name);
                      }
                      // For sequential, we maintain the order they were added
                      return 0;
                    })
                    .map(item => (
                      <CartItem 
                        key={item.id} 
                        item={item} 
                        onUpdateQuantity={updateQuantity}
                        onRemove={removeItem}
                      />
                    ))}
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-auto">
                  <div className="flex justify-between mb-1">
                    <span>Subtotal:</span>
                    <span>${cartSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span>Tax ({TAX_RATE}%):</span>
                    <span>${taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold mb-4">
                    <span>Grand Total:</span>
                    <span>${cartTotal.toFixed(2)}</span>
                  </div>

                  <button 
                    onClick={() => setIsCheckoutModalOpen(true)}
                    className="w-full bg-button-primary-background hover:bg-button-primary-background/90 active:bg-button-primary-background/70 text-button-primary-foreground py-4 px-6 rounded-md transition-colors text-lg font-medium"
                  >
                    Checkout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Checkout Modal */}
      <CheckoutModal 
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        cartSubtotal={cartSubtotal}
        taxRate={TAX_RATE}
        taxAmount={taxAmount}
        cartTotal={cartTotal}
        onSubmit={handleCheckoutSubmit}
      />
    </div>
  );
}
