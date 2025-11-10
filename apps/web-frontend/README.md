# Web POS - Frontend Application

Next.js 15 web application for the Web POS system.

## Features

- **Next.js 15** with App Router
- **React 19** with latest features
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Keycloak Integration** for authentication
- **Docker Support** for containerized deployment

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn

### Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open browser
# http://localhost:3000
```

### Environment Variables

Create `.env.local` for local development:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:8180
NEXT_PUBLIC_KEYCLOAK_REALM=payment-realm
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=payment-web-app
```

## Docker

### Build

```bash
docker build -t webpos-frontend .
```

### Run

```bash
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=http://localhost:8080/api \
  -e NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:8180 \
  webpos-frontend
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Project Structure

```
apps/web-frontend/
├── src/
│   ├── app/           # Next.js app router pages
│   ├── components/    # React components
│   └── lib/          # Utility functions
├── public/           # Static assets
└── Dockerfile        # Production Docker image
```

## API Integration

The frontend communicates with the payment service API:

- Base URL: `NEXT_PUBLIC_API_URL`
- Authentication: Keycloak OAuth2/OIDC
- Endpoints: See payment service documentation

## Authentication

Uses Keycloak for authentication:

1. User clicks login
2. Redirects to Keycloak
3. User authenticates
4. Returns with JWT token
5. Token used for API requests

## Development Tips

- Hot reload is enabled by default
- API proxy configured in `next.config.js`
- CORS handled by backend service
- Use React DevTools for debugging

## Build Optimization

The Dockerfile uses multi-stage builds:

1. **deps**: Install production dependencies
2. **builder**: Build the application
3. **runner**: Minimal runtime image

This results in a ~200MB production image.
