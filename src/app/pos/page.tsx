"use client";

import React, {FormEvent, useEffect, useState, useCallback, useMemo, memo} from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Product, type CartItem, ProductCardProps, CartItemProps } from "./pos.types";

// Dynamically import the CheckoutModal component to reduce initial bundle size
const CheckoutModal = dynamic(() => import("./CheckoutModal"), {
  loading: () => <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-background rounded-lg shadow-xl p-6 w-full max-w-md">
      <p className="text-center">Loading checkout...</p>
    </div>
  </div>,
  ssr: false, // Disable server-side rendering for this component
});

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
const ProductCard = memo(function ProductCard({ product, onAddToCart, viewMode = "card" }: ProductCardProps & { viewMode?: "card" | "list" }) {
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
                loading="lazy"
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
            loading="lazy"
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
});

// Cart Item Component
const CartItem = memo(function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
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
});


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

  // Add product to cart - memoized to prevent unnecessary re-renders
  const addToCart = useCallback((product: Product) => {
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
  }, []);

  // Update item quantity - memoized to prevent unnecessary re-renders
  const updateQuantity = useCallback((id: number, quantity: number) => {
    if (quantity <= 0) return;

    setCart(prevCart => 
      prevCart.map(item => 
        item.id === id ? { ...item, quantity } : item
      )
    );
  }, []);

  // Remove item from cart - memoized to prevent unnecessary re-renders
  const removeItem = useCallback((id: number) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id));
  }, []);

  // Tax rate constant
  const TAX_RATE = 8.25;

  // Calculate cart subtotal - memoized to prevent recalculation on every render
  const cartSubtotal = useMemo(() => 
    cart.reduce((total, item) => total + (item.price * item.quantity), 0),
    [cart]
  );

  // Calculate tax and grand total - memoized to prevent recalculation on every render
  const taxAmount = useMemo(() => cartSubtotal * (TAX_RATE / 100), [cartSubtotal, TAX_RATE]);
  const cartTotal = useMemo(() => cartSubtotal + taxAmount, [cartSubtotal, taxAmount]);

  // Memoize the sorted cart items to prevent recalculation on every render
  const memoizedCartItems = useMemo(() => {
    return [...cart]
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
      ));
  }, [cart, sortMethod, updateQuantity, removeItem]);

  // Handle checkout form submission - memoized to prevent unnecessary re-renders
  const handleCheckoutSubmit = useCallback((e: FormEvent) => {
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
  }, [setIsCheckoutModalOpen, setCart, setSortMethod, setViewMode]);

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
                {useMemo(() => {
                  // Memoize the filtered and sorted products list to prevent recalculation on every render
                  return sampleProducts
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
                    ));
                }, [searchQuery, addToCart, viewMode])}
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
                  {/* Use the memoized cart items from the component level */}
                  {memoizedCartItems}
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
