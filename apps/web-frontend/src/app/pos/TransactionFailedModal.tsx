"use client";

import React, { memo } from 'react';
import { TransactionFailedModalProps, FailureReason } from './pos.types';

// Function to get failure message based on reason
const getFailureMessage = (reason: FailureReason): { title: string; description: string } => {
  switch (reason) {
    case 'invalid_cvv':
      return {
        title: 'Invalid CVV',
        description: 'The security code you entered is incorrect. Please check your card and try again.'
      };
    case 'processor_failure':
      return {
        title: 'Payment Processor Error',
        description: 'Our payment processor is experiencing issues. Please try again later.'
      };
    case 'network_error':
      return {
        title: 'Network Error',
        description: 'A network error occurred while processing your payment. Please check your connection and try again.'
      };
    default:
      return {
        title: 'Transaction Failed',
        description: 'An unknown error occurred while processing your payment. Please try again.'
      };
  }
};

// Transaction Failed Modal Component
const TransactionFailedModal = memo(function TransactionFailedModal({ 
  isOpen, 
  onClose, 
  failureReason 
}: TransactionFailedModalProps) {
  if (!isOpen) return null;

  const { title, description } = getFailureMessage(failureReason);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-xl p-6 w-full max-w-md flex flex-col items-center">
        <div className="w-24 h-24 rounded-full bg-red-500 flex items-center justify-center mb-4">
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
              d="M6 18L18 6M6 6l12 12" 
            />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold mb-2">{title}</h2>
        <p className="text-gray-600 dark:text-gray-400 text-center mb-6">{description}</p>
        <button 
          onClick={onClose}
          className="px-5 py-3 bg-button-primary-background hover:bg-button-primary-background/90 active:bg-button-primary-background/70 text-button-primary-foreground rounded-md text-base font-medium transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
});

export default TransactionFailedModal;