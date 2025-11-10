# Web POS - Point of Sale System

A modern, production-ready web-based Point of Sale (POS) system built with Next.js, React, TypeScript, and Tailwind CSS.

## 🚀 Features

- **Modern UI/UX**: Clean, responsive design with dark mode support
- **Shopping Cart**: Add, remove, and manage items with quantity controls
- **Product Catalog**: 12 sample products with search functionality
- **Payment Processing**: Mock payment API with card validation
- **Security**: Input validation, security headers, and secure card data handling
- **Testing**: Jest and React Testing Library setup
- **TypeScript**: Full type safety throughout the application
- **Structured Logging**: Comprehensive logging infrastructure
- **Error Handling**: Global error boundaries and proper error handling

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Environment Configuration](#environment-configuration)
- [Project Structure](#project-structure)
- [Features in Detail](#features-in-detail)
- [Testing](#testing)
- [API Documentation](#api-documentation)
- [Security](#security)
- [Development](#development)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

## 🏁 Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm 10.x or higher

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd web-pos
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env.local
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## ⚙️ Environment Configuration

Create a `.env.local` file in the root directory with the following variables:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
API_URL=http://localhost:3000

# Tax Configuration (percentage)
NEXT_PUBLIC_TAX_RATE=8.25

# Currency
NEXT_PUBLIC_CURRENCY=USD

# Node Environment
NODE_ENV=development

# Session Configuration
SESSION_SECRET=your_secret_key_here

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000

# Payment Mock Mode (for development)
MOCK_PAYMENT_API=true

# Logging Level (debug, info, warn, error)
LOG_LEVEL=debug
```

### Environment Variables Explained

- `NEXT_PUBLIC_API_URL`: Frontend API URL (must start with NEXT_PUBLIC_ to be accessible in browser)
- `NEXT_PUBLIC_TAX_RATE`: Tax percentage applied to purchases
- `NEXT_PUBLIC_CURRENCY`: Currency code (ISO 4217)
- `NODE_ENV`: Environment mode (development, production, test)
- `LOG_LEVEL`: Logging verbosity level
- `MOCK_PAYMENT_API`: Enable mock payment processing for development

## 📁 Project Structure

```
web-pos/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── health/          # Health check endpoint
│   │   │   └── v1/payments/     # Payment processing API
│   │   ├── pos/                 # Main POS page and components
│   │   │   ├── page.tsx         # POS page component
│   │   │   ├── CheckoutModal.tsx
│   │   │   ├── TransactionCompleteModal.tsx
│   │   │   ├── TransactionFailedModal.tsx
│   │   │   └── pos.types.ts     # TypeScript interfaces
│   │   ├── error.tsx            # Error boundary
│   │   ├── global-error.tsx     # Global error handler
│   │   ├── layout.tsx           # Root layout
│   │   ├── page.tsx             # Home page (redirects to /pos)
│   │   └── globals.css          # Global styles
│   ├── lib/
│   │   ├── logger.ts            # Structured logging utility
│   │   └── validation.ts        # Zod validation schemas
│   └── middleware.ts            # Security headers middleware
├── public/
│   └── assets/                  # Product images (SVG)
├── .env.example                 # Example environment file
├── .env.local                   # Local environment (not committed)
├── jest.config.js               # Jest configuration
├── jest.setup.js                # Jest setup
├── next.config.js               # Next.js configuration
├── tailwind.config.ts           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
└── package.json                 # Dependencies and scripts
```

## 🎯 Features in Detail

### Shopping Cart

- Add products with a single click
- Adjust quantities with +/- buttons
- Remove items with × button
- Persistent cart storage using localStorage
- View modes: Card grid or List view
- Sort options: Sequential (order added) or Alphabetical

### Payment Processing

The application includes a **mock payment API** for development and testing:

#### Test Card Numbers

Use these card numbers to test different scenarios:

- **Successful Payment**: Any valid card number (e.g., `4532015112830366`)
- **Declined - Insufficient Funds**: CVV = `000`
- **Invalid CVV**: CVV = `999`
- **Processor Error**: CVV = `666`
- **Random Failures**: 5% of transactions randomly fail (simulates real-world scenarios)

#### Card Validation

- Luhn algorithm validation
- Card brand detection (Visa, Mastercard, Amex, Discover, Diners, JCB)
- Expiration date validation (cannot be in the past)
- CVV format validation (3-4 digits based on card type)

### Dark Mode

- Automatic detection of system theme preference
- Manual toggle available (in theme-provider.tsx)
- Smooth transitions between themes
- CSS custom properties for consistent theming

### Security Features

1. **Security Headers**: Implemented via middleware
   - X-Frame-Options: DENY
   - X-Content-Type-Options: nosniff
   - Content Security Policy (CSP)
   - Referrer-Policy
   - Permissions-Policy

2. **Input Validation**: Zod schemas for all user inputs
   - Card number validation with Luhn check
   - Expiration date validation
   - CVV validation
   - Cardholder name validation

3. **Secure Card Handling**:
   - Card data never stored in state or localStorage
   - Form fields cleared on modal close
   - No sensitive data in logs (automatically redacted)

4. **Error Boundaries**: Catch and handle React errors gracefully

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Test Structure

Tests are located in `__tests__` directories next to the files they test:

```
src/
├── lib/
│   ├── validation.ts
│   └── __tests__/
│       └── validation.test.ts
```

### Writing Tests

Example test:

```typescript
import { cardNumberSchema } from '../validation';

describe('cardNumberSchema', () => {
  it('should accept valid card numbers', () => {
    const result = cardNumberSchema.safeParse('4532015112830366');
    expect(result.success).toBe(true);
  });
});
```

## 📡 API Documentation

### Health Check

**Endpoint**: `GET /api/health`

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-10T12:00:00.000Z",
  "uptime": 3600.5,
  "environment": "development",
  "version": "0.1.0",
  "memory": {
    "used": 45,
    "total": 128,
    "unit": "MB"
  }
}
```

### Process Payment

**Endpoint**: `POST /api/v1/payments`

**Request Body**:
```json
{
  "merchantReference": "POS-1699564800000",
  "amount": 25.50,
  "currencyCode": "USD",
  "card": {
    "number": "4532015112830366",
    "expiryMonth": 12,
    "expiryYear": 25,
    "cvv": "123",
    "cardholderName": "John Doe"
  },
  "description": "POS Purchase - 3 items"
}
```

**Success Response** (200):
```json
{
  "merchantReference": "POS-1699564800000",
  "transactionId": "TXN-1699564800000-ABC123",
  "status": "AUTHORIZED",
  "amount": 25.50,
  "currencyCode": "USD",
  "timestamp": "2025-11-10T12:00:00.000Z",
  "authorizationCode": "AUTH-XYZ789",
  "last4": "0366",
  "cardBrand": "Visa"
}
```

**Error Response** (402):
```json
{
  "merchantReference": "POS-1699564800000",
  "transactionId": "TXN-1699564800000-DEF456",
  "status": "DECLINED",
  "errorCode": "INVALID_CVV",
  "errorMessage": "The CVV code is invalid",
  "last4": "0366",
  "cardBrand": "Visa"
}
```

## 🔒 Security

### For Production

**IMPORTANT**: This is a prototype application with mock payment processing. For production use:

1. **Payment Processing**:
   - Integrate with a real payment gateway (Stripe, Square, etc.)
   - Implement PCI DSS compliance
   - Use tokenization for card data
   - Never store full card numbers

2. **Environment Variables**:
   - Use proper secrets management (AWS Secrets Manager, HashiCorp Vault, etc.)
   - Never commit `.env.local` or `.env.production`
   - Rotate secrets regularly

3. **Authentication**:
   - Implement user authentication (NextAuth.js, Auth0, Clerk, etc.)
   - Add role-based access control
   - Implement session management

4. **HTTPS**:
   - Always use HTTPS in production
   - Enable HSTS headers
   - Use valid SSL certificates

5. **Logging & Monitoring**:
   - Integrate with Sentry, Datadog, or similar
   - Set up alerting for errors and anomalies
   - Monitor payment success/failure rates

## 💻 Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Testing
npm test            # Run tests
npm run test:watch  # Run tests in watch mode
npm run test:coverage # Generate coverage report
```

### Code Style

- ESLint with Next.js configuration
- TypeScript strict mode
- Prettier for code formatting (recommended)

### Adding New Products

Products are currently hardcoded in `src/app/pos/page.tsx`. To add new products:

1. Add product image to `public/assets/`
2. Add product to `sampleProducts` array:

```typescript
{ id: 13, name: "New Product", price: 9.99, image: "/assets/newproduct.svg" }
```

## 🚀 Production Deployment

### Build the Application

```bash
npm run build
```

### Environment Setup

1. Create `.env.production` with production values
2. Set `NODE_ENV=production`
3. Update `NEXT_PUBLIC_API_URL` to your production API
4. Set secure `SESSION_SECRET`

### Deployment Platforms

#### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

#### Docker

```dockerfile
# Example Dockerfile (create if needed)
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

#### Other Platforms

- **Netlify**: Works with Next.js
- **AWS Amplify**: Full Next.js support
- **Railway**: One-click deployment
- **Render**: Automatic deployments from Git

## 🐛 Troubleshooting

### Common Issues

**Issue**: "Module not found" errors
```bash
# Solution: Clear Next.js cache and reinstall
rm -rf .next node_modules
npm install
npm run dev
```

**Issue**: Environment variables not working
```bash
# Solution: Ensure variables start with NEXT_PUBLIC_ for client-side access
# Restart dev server after changing .env files
```

**Issue**: Tests failing
```bash
# Solution: Ensure jest.setup.js is properly configured
# Check that environment variables are mocked in jest.setup.js
```

**Issue**: TypeScript errors
```bash
# Solution: Regenerate TypeScript cache
rm -rf .next
npx next build
```

### Getting Help

- Check the [Next.js documentation](https://nextjs.org/docs)
- Review [React documentation](https://react.dev)
- Search existing issues on GitHub
- Create a new issue with detailed information

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org)
- Styled with [Tailwind CSS](https://tailwindcss.com)
- Validated with [Zod](https://zod.dev)
- Tested with [Jest](https://jestjs.io) and [React Testing Library](https://testing-library.com/react)
