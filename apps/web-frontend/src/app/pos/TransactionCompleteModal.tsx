"use client";

import React, { memo } from 'react';
import { TransactionCompleteModalProps } from './pos.types';
import { printReceipt, downloadReceipt, type ReceiptData } from '@/lib/receipt';

// Transaction Complete Modal Component
const TransactionCompleteModal = memo(function TransactionCompleteModal({
  isOpen,
  onClose,
  transactionId,
  amount,
  last4,
  cardBrand,
  authorizationCode,
  cartItems = [],
  subtotal = 0,
  tax = 0,
}: TransactionCompleteModalProps) {
  if (!isOpen) return null;

  const handlePrintReceipt = () => {
    if (!transactionId) return;

    const receiptData: ReceiptData = {
      transactionId,
      timestamp: new Date(),
      items: cartItems.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity,
      })),
      subtotal,
      tax,
      total: amount || subtotal + tax,
      last4,
      cardBrand,
      authorizationCode,
    };

    printReceipt(receiptData);
  };

  const handleDownloadReceipt = () => {
    if (!transactionId) return;

    const receiptData: ReceiptData = {
      transactionId,
      timestamp: new Date(),
      items: cartItems.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity,
      })),
      subtotal,
      tax,
      total: amount || subtotal + tax,
      last4,
      cardBrand,
      authorizationCode,
    };

    downloadReceipt(receiptData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-xl p-6 w-full max-w-md flex flex-col items-center">
        <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h2 className="text-2xl font-semibold mb-2">Transaction Complete</h2>

        {transactionId && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Transaction ID: {transactionId}
          </p>
        )}

        {amount && (
          <p className="text-xl font-bold mb-6 text-green-600 dark:text-green-400">
            ${amount.toFixed(2)}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          {transactionId && (
            <>
              <button
                onClick={handlePrintReceipt}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
                aria-label="Print receipt"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  />
                </svg>
                Print
              </button>

              <button
                onClick={handleDownloadReceipt}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 active:bg-gray-800 text-white rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
                aria-label="Download receipt"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Download
              </button>
            </>
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full px-5 py-3 bg-button-primary-background hover:bg-button-primary-background/90 active:bg-button-primary-background/70 text-button-primary-foreground rounded-md text-base font-medium transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
});

export default TransactionCompleteModal;
