# Security Guide

This document outlines the security features, best practices, and recommendations for the Web POS system.

## Table of Contents

1. [Security Features](#security-features)
2. [Environment Configuration](#environment-configuration)
3. [Deployment Security](#deployment-security)
4. [Known Limitations](#known-limitations)
5. [Security Checklist](#security-checklist)
6. [Incident Response](#incident-response)

## Security Features

### 1. Authentication & Authorization

**Backend (Spring Boot):**
- OAuth2/OIDC integration with Keycloak
- Role-based access control (RBAC)
- Stateless JWT authentication
- Token validation on every request

**Frontend:**
- Protected routes (when `REQUIRE_AUTHENTICATION=true`)
- Session management
- Automatic token refresh
- Secure logout

**Configuration:**
```bash
# Enable authentication requirement
REQUIRE_AUTHENTICATION=true

# Keycloak settings
NEXT_PUBLIC_KEYCLOAK_URL=https://your-keycloak.com
NEXT_PUBLIC_KEYCLOAK_REALM=your-realm
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=your-client-id
```

### 2. Data Encryption

**Cart Data:**
- AES-256-GCM encryption for localStorage
- Unique initialization vector (IV) for each encryption
- Authenticated encryption with integrity verification

**Generate encryption key:**
```bash
openssl rand -hex 32
```

**Backend:**
- AES-256-GCM for card tokenization
- Google Tink encryption library
- Encrypted database fields (where applicable)

⚠️ **CRITICAL**: Set `CART_ENCRYPTION_KEY` in production!

### 3. Input Validation

**Frontend (Zod):**
- Luhn algorithm for card numbers
- Expiration date validation
- CVV format validation
- Cardholder name sanitization
- Amount limits and precision checks
- String length limits on all inputs

**Backend (Jakarta Validation):**
- JSR-303 Bean Validation
- Custom Luhn validator
- Amount range validation
- Currency code validation

### 4. Rate Limiting

**Features:**
- Per-IP and per-endpoint tracking
- Configurable limits and time windows
- IP validation and spoofing protection
- DDoS attack detection
- Suspicious activity flagging

**Configuration:**
```bash
ENABLE_RATE_LIMITING=true
RATE_LIMIT_MAX_REQUESTS=10      # Requests per window
RATE_LIMIT_WINDOW_MS=60000      # Window in milliseconds
TRUST_PROXY=false               # Enable when behind proxy
```

**Production Recommendation:**
Use Redis for distributed rate limiting:
```bash
REDIS_URL=redis://your-redis-instance:6379
```

### 5. CORS Configuration

**Secure CORS:**
- No wildcard (*) origins in production
- Origin validation against whitelist
- Configurable allowed origins
- Proper preflight handling

**Configuration:**
```bash
CORS_ALLOWED_ORIGINS=https://pos.example.com,https://www.example.com
```

### 6. Security Headers

**Implemented Headers:**
- `Content-Security-Policy` (CSP)
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy`
- `Strict-Transport-Security` (HSTS)

### 7. Logging & Monitoring

**Sensitive Data Protection:**
- Automatic sanitization of card numbers (shows last 4 only)
- CVV never logged
- PII redaction
- Error sanitization

**Audit Logging:**
- Payment attempts (success/failure)
- Authentication events
- Rate limit violations
- Suspicious activity

**Log Levels:**
```bash
LOG_LEVEL=info  # Options: debug, info, warn, error
```

## Environment Configuration

### Required Variables

**Production Checklist:**

```bash
# ❌ NEVER use default values in production
# ✅ Generate strong, unique values for each environment

# Database (REQUIRED)
PAYMENT_DB_PASSWORD=<strong-random-password-16+chars>
KEYCLOAK_DB_PASSWORD=<strong-random-password-16+chars>

# Keycloak Admin (REQUIRED)
KEYCLOAK_ADMIN_USER=<non-default-username>
KEYCLOAK_ADMIN_PASSWORD=<strong-random-password-16+chars>

# Encryption (REQUIRED)
CART_ENCRYPTION_KEY=<64-char-hex-string>

# CORS (REQUIRED)
CORS_ALLOWED_ORIGINS=https://your-production-domain.com

# Security Features
ENABLE_MOCK_PAYMENTS=false  # ⚠️ MUST be false in production!
REQUIRE_AUTHENTICATION=true
ENABLE_RATE_LIMITING=true
TRUST_PROXY=true  # If behind load balancer/CDN
```

### Environment File Setup

1. **Copy template:**
   ```bash
   cp .env.example .env
   ```

2. **Generate secrets:**
   ```bash
   # Encryption key
   openssl rand -hex 32

   # Strong passwords
   openssl rand -base64 32
   ```

3. **Validate configuration:**
   - Environment validation runs automatically on startup
   - Check logs for warnings
   - Fix any configuration errors before deployment

## Deployment Security

### Pre-Deployment Checklist

- [ ] All environment variables set (no defaults)
- [ ] `ENABLE_MOCK_PAYMENTS=false`
- [ ] `CART_ENCRYPTION_KEY` generated and set
- [ ] Strong passwords for all services
- [ ] CORS configured for production domains only
- [ ] HTTPS enabled (certificates valid)
- [ ] Database access restricted (firewall rules)
- [ ] Keycloak properly configured with production realm
- [ ] Logging configured and monitored
- [ ] Backup strategy in place

### HTTPS/TLS

**Required for production:**
- Use valid TLS certificates (Let's Encrypt recommended)
- TLS 1.2 minimum, TLS 1.3 recommended
- Strong cipher suites only
- HSTS enabled with long max-age

**Nginx example:**
```nginx
server {
    listen 443 ssl http2;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
}
```

### Database Security

1. **Network Isolation:**
   - Database should NOT be publicly accessible
   - Use private network or VPN
   - Firewall rules: allow only application servers

2. **Credentials:**
   - Use strong, unique passwords
   - Rotate passwords regularly
   - Use secrets management (Vault, AWS Secrets Manager, etc.)

3. **Backups:**
   - Automated daily backups
   - Encrypted backup storage
   - Test restore procedures
   - Backup retention policy

### Container Security

1. **Image Security:**
   - Use official base images
   - Scan images for vulnerabilities
   - Keep images updated
   - Minimal image size (fewer attack vectors)

2. **Runtime Security:**
   - Run as non-root user
   - Read-only file systems where possible
   - Resource limits (CPU, memory)
   - Network segmentation

## Known Limitations

### Current Security Limitations

1. **Encryption Key Management:**
   - Keys generated in-memory on startup
   - Keys lost on restart (tokens become invalid)
   - **Recommendation:** Integrate with KMS (AWS KMS, Azure Key Vault, GCP KMS)

2. **Rate Limiting:**
   - In-memory storage (not distributed)
   - Lost on restart
   - Won't scale across multiple instances
   - **Recommendation:** Use Redis for distributed rate limiting

3. **Session Management:**
   - No distributed session storage
   - **Recommendation:** Use Redis for session storage in multi-instance deployments

4. **Payment Processing:**
   - Mock implementation only
   - **Action Required:** Integrate with real payment gateway (Stripe, Square, etc.)

5. **Audit Logging:**
   - Local logging only
   - **Recommendation:** Centralized logging (ELK Stack, Splunk, Datadog)

## Security Checklist

### Development

- [ ] Never commit secrets to version control
- [ ] Use `.env` files (gitignored)
- [ ] Review code for SQL injection
- [ ] Review code for XSS vulnerabilities
- [ ] Validate all user inputs
- [ ] Sanitize all outputs
- [ ] Use parameterized queries
- [ ] Apply least privilege principle

### Testing

- [ ] Test authentication flows
- [ ] Test authorization boundaries
- [ ] Test input validation
- [ ] Test rate limiting
- [ ] Test CORS configuration
- [ ] Security scanning (OWASP ZAP, Burp Suite)
- [ ] Dependency vulnerability scanning

### Production

- [ ] All checklist items from "Pre-Deployment Checklist"
- [ ] Monitoring and alerting configured
- [ ] Log aggregation and analysis
- [ ] Incident response plan documented
- [ ] Regular security updates scheduled
- [ ] Penetration testing completed
- [ ] Compliance requirements met (PCI DSS if applicable)

## Incident Response

### Security Incident Procedure

1. **Detection:**
   - Monitor logs for suspicious activity
   - Set up alerts for:
     - Failed authentication attempts
     - Rate limit violations
     - Unusual payment patterns
     - System errors

2. **Response:**
   - Isolate affected systems
   - Preserve evidence (logs, memory dumps)
   - Assess impact and scope
   - Contain the incident

3. **Recovery:**
   - Patch vulnerabilities
   - Rotate compromised credentials
   - Restore from clean backups if needed
   - Verify system integrity

4. **Post-Incident:**
   - Root cause analysis
   - Update security measures
   - Document lessons learned
   - Update incident response plan

### Suspicious Activity Indicators

- Unusual number of failed login attempts
- Rate limit violations from single IP
- Abnormal payment amounts
- Requests from unexpected geographic locations
- Malformed or suspicious input patterns
- Unexpected error rates

### Emergency Contacts

```
Security Team: security@example.com
On-Call Engineer: +1-XXX-XXX-XXXX
Incident Hotline: +1-XXX-XXX-XXXX
```

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [PCI DSS Compliance](https://www.pcisecuritystandards.org/)
- [Spring Security Reference](https://docs.spring.io/spring-security/reference/)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)

## Reporting Security Issues

If you discover a security vulnerability, please report it to:

**Email:** security@example.com

**Do NOT:**
- Create public GitHub issues for security vulnerabilities
- Disclose vulnerabilities publicly before patch is available

**Please include:**
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

---

**Last Updated:** 2025-01-19
**Version:** 1.0.0
