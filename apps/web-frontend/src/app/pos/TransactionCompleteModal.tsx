"use client";

import React, { memo } from 'react';
import { TransactionCompleteModalProps } from './pos.types';

// Transaction Complete Modal Component
const TransactionCompleteModal = memo(function TransactionCompleteModal({ isOpen, onClose }: TransactionCompleteModalProps) {
  if (!isOpen) return null;

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
        <h2 className="text-2xl font-semibold mb-4">Transaction Complete</h2>
        <button 
          onClick={onClose}
          className="px-5 py-3 bg-button-primary-background hover:bg-button-primary-background/90 active:bg-button-primary-background/70 text-button-primary-foreground rounded-md text-base font-medium transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
});

export default TransactionCompleteModal;