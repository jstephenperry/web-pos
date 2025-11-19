/**
 * Receipt Generation Utility
 *
 * Generates printable and downloadable receipts for completed transactions.
 * Supports both print and PDF download formats.
 */

export interface ReceiptData {
  transactionId: string;
  timestamp: Date;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  last4?: string;
  cardBrand?: string;
  authorizationCode?: string;
  merchantName?: string;
  merchantAddress?: string;
}

/**
 * Generate HTML receipt content
 */
function generateReceiptHTML(data: ReceiptData): string {
  const merchantName = data.merchantName || 'Web POS System';
  const merchantAddress = data.merchantAddress || '';
  const formattedDate = data.timestamp.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const itemsHTML = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 4px 8px; border-bottom: 1px solid #eee;">
          ${item.name} x${item.quantity}
        </td>
        <td style="padding: 4px 8px; text-align: right; border-bottom: 1px solid #eee;">
          $${item.total.toFixed(2)}
        </td>
      </tr>
    `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Receipt - ${data.transactionId}</title>
      <style>
        @media print {
          body {
            margin: 0;
            padding: 20px;
          }
          .no-print {
            display: none;
          }
        }
        body {
          font-family: 'Courier New', Courier, monospace;
          max-width: 400px;
          margin: 0 auto;
          padding: 20px;
          background: white;
        }
        .receipt {
          border: 1px solid #ddd;
          padding: 20px;
          background: white;
        }
        .receipt-header {
          text-align: center;
          border-bottom: 2px dashed #333;
          padding-bottom: 10px;
          margin-bottom: 10px;
        }
        .merchant-name {
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .merchant-address {
          font-size: 12px;
          color: #666;
        }
        .receipt-info {
          margin: 15px 0;
          font-size: 12px;
        }
        .receipt-info div {
          margin: 3px 0;
        }
        .items-table {
          width: 100%;
          margin: 15px 0;
          border-collapse: collapse;
        }
        .items-table th {
          text-align: left;
          padding: 8px;
          border-bottom: 2px solid #333;
          font-size: 13px;
        }
        .items-table td {
          font-size: 12px;
        }
        .totals {
          margin-top: 15px;
          border-top: 2px dashed #333;
          padding-top: 10px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          margin: 5px 0;
          font-size: 13px;
        }
        .total-row.grand-total {
          font-weight: bold;
          font-size: 16px;
          margin-top: 10px;
          border-top: 2px solid #333;
          padding-top: 10px;
        }
        .payment-info {
          margin-top: 15px;
          padding-top: 10px;
          border-top: 1px dashed #333;
          font-size: 12px;
        }
        .receipt-footer {
          margin-top: 20px;
          padding-top: 10px;
          border-top: 2px dashed #333;
          text-align: center;
          font-size: 11px;
          color: #666;
        }
        .print-button {
          margin: 20px auto;
          display: block;
          padding: 10px 20px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }
        .print-button:hover {
          background: #45a049;
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="receipt-header">
          <div class="merchant-name">${merchantName}</div>
          ${merchantAddress ? `<div class="merchant-address">${merchantAddress}</div>` : ''}
        </div>

        <div class="receipt-info">
          <div><strong>Date:</strong> ${formattedDate}</div>
          <div><strong>Transaction ID:</strong> ${data.transactionId}</div>
          ${data.authorizationCode ? `<div><strong>Auth Code:</strong> ${data.authorizationCode}</div>` : ''}
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>Item</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>

        <div class="totals">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>$${data.subtotal.toFixed(2)}</span>
          </div>
          <div class="total-row">
            <span>Tax:</span>
            <span>$${data.tax.toFixed(2)}</span>
          </div>
          <div class="total-row grand-total">
            <span>TOTAL:</span>
            <span>$${data.total.toFixed(2)}</span>
          </div>
        </div>

        ${
          data.cardBrand || data.last4
            ? `
        <div class="payment-info">
          <div><strong>Payment Method:</strong></div>
          ${data.cardBrand ? `<div>${data.cardBrand}` : '<div>Card'} ${data.last4 ? `****${data.last4}` : ''}</div>
          <div><strong>Status:</strong> APPROVED</div>
        </div>
        `
            : ''
        }

        <div class="receipt-footer">
          <div>Thank you for your business!</div>
          <div style="margin-top: 5px;">Please keep this receipt for your records.</div>
        </div>
      </div>

      <button class="print-button no-print" onclick="window.print()">Print Receipt</button>

      <script>
        // Auto-print on load if requested
        if (window.location.hash === '#print') {
          window.print();
        }
      </script>
    </body>
    </html>
  `;
}

/**
 * Print receipt
 * Opens receipt in new window and triggers print dialog
 */
export function printReceipt(data: ReceiptData): void {
  const html = generateReceiptHTML(data);
  const printWindow = window.open('', '_blank', 'width=400,height=600');

  if (!printWindow) {
    console.error('Failed to open print window. Pop-up blocker may be enabled.');
    alert('Please allow pop-ups to print receipt');
    return;
  }

  printWindow.document.write(html);
  printWindow.document.close();

  // Wait for content to load before printing
  printWindow.onload = () => {
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };
}

/**
 * Download receipt as HTML file
 */
export function downloadReceipt(data: ReceiptData): void {
  const html = generateReceiptHTML(data);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `receipt-${data.transactionId}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Generate receipt text (for email or SMS)
 */
export function generateReceiptText(data: ReceiptData): string {
  const merchantName = data.merchantName || 'Web POS System';
  const formattedDate = data.timestamp.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const itemsText = data.items
    .map((item) => `${item.name} x${item.quantity} - $${item.total.toFixed(2)}`)
    .join('\n');

  return `
${merchantName}
${'='.repeat(40)}

Date: ${formattedDate}
Transaction ID: ${data.transactionId}
${data.authorizationCode ? `Auth Code: ${data.authorizationCode}` : ''}

ITEMS:
${itemsText}

${'-'.repeat(40)}
Subtotal: $${data.subtotal.toFixed(2)}
Tax: $${data.tax.toFixed(2)}
${'-'.repeat(40)}
TOTAL: $${data.total.toFixed(2)}

${data.cardBrand || data.last4 ? `Payment: ${data.cardBrand || 'Card'} ${data.last4 ? `****${data.last4}` : ''}` : ''}
Status: APPROVED

Thank you for your business!
Please keep this receipt for your records.
`.trim();
}
