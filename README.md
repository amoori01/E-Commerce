# AMG Holdings Multi-Subsidiary Enterprise E-Commerce Platform

Official web and cross-platform mobile commerce infrastructure for **AMG Holdings PLC** (Ethiopia).  
Engineered under **ISO/IEC/IEEE 29148, OWASP ASVS v4.0, PCI-DSS v4.0, and WCAG 2.1 AA** enterprise standards.

---

## 1. System Architecture Overview

AMG Holdings operates across heavy engineering, commercial transport, industrial gases, roofing, and FMCG.  
This platform bridges two distinct operational procurement streams:

1. **Stream A: Direct Self-Service Commerce (Instant Checkout)**
   - Fast-moving standardized building supplies, packaged specialty coffee, fasteners, and retail lubricants.
   - Self-service ordering with localized Ethiopian payment gateways (Telebirr, CBE Birr, Chapa, Bank Wire).
   - Automated 15% Ethiopian VAT calculation, branch stock reservation, and gate pass clearance.
2. **Stream B: Agent-Assisted Custom Quotation (RFQ & Negotiation Flow)**
   - Pre-engineered steel structures, H/I-beams, smart poles, telecom towers, fuel tankers, and commercial transport vehicles (Sinotruk + BPW trailers).
   - Multi-agent round-robin dispatch based on subsidiary domain expertise and territory.
   - In-platform negotiation chat, multi-version quote formulation (`v1`, `v2`, `v3`), and 1-click quote-to-order conversion.

---

## 2. Tech Stack

- **Web Frontend**: Next.js 15.5 (App Router), React 19, TypeScript 5.7, Tailwind CSS 3.4, Lucide Icons.
- **Backend & APIs**: Next.js Serverless Route Handlers, Edge Middleware, Supabase SSR / `@supabase/supabase-js`.
- **Mobile Client**: Flutter 3.47+ / Dart 3.13+ (`mobile/`) with FaceID/Fingerprint biometric authentication, camera barcode scanner, push notification listeners, and mobile wallet deep-linking (`amg://`).
- **Database & DDL**: PostgreSQL 15+ / Supabase with Row Level Security (RLS) and custom ENUM types.
- **ERP Integration**: Enterprise Sales Management System (SMS) bi-directional sync broker with exponential backoff and Dead-Letter Queue (DLQ).
- **Security & Ciphers**: AES-256-GCM encryption at rest for sensitive PII/financial data, short-lived JWT access tokens (15m) + rotating refresh tokens (7d), and HTTP-only SameSite cookies.

---

## 3. Quick Start & Local Execution

### Prerequisites
- Node.js 18+ (tested on Node 22)
- Flutter 3.20+ (for mobile app)
- PostgreSQL 15+ or Supabase account

### Web Application Setup
```bash
# Install dependencies
npm install

# Run automated test suite
npm test

# Build production bundle
npm run build

# Start local development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Mobile Client Setup (Flutter)
```bash
cd mobile

# Install mobile dependencies
flutter pub get

# Run on connected device or emulator
flutter run
```

---

## 4. Test Credentials & Seed Personas

| Role | Email | Password | Scope & Responsibilities |
|---|---|---|---|
| **Super Admin** | `superadmin@amgholdings.com` | `AmgAdmin2026!` | Enterprise governance, cross-subsidiary catalog, tax rules, DLQ audit |
| **Branch Admin** | `roofing.admin@amgholdings.com` | `AmgBranch2026!` | Adama Branch stock thresholds, fulfillment verification, truck gate pass |
| **Sales Agent** | `agent.solomon@amgholdings.com` | `AmgAgent2026!` | Heavy Structural & Transport RFQ reviews, pricing matrix, quote-to-order |
| **B2B Customer** | `procurement@midroc-corp.et` | `AmgClient2026!` | Corporate bulk buyer, direct orders, active RFQs, proforma tax invoices |
| **B2C Customer** | `abebe.kebede@gmail.com` | `AmgCustomer2026!` | Standard customer self-service checkout with Telebirr / CBE Birr |

*(Note: The web platform features an instant **Role Switcher** in the top navigation bar to test all stakeholder workflows in one click).*

---

## 5. Environment Variables (`.env.local`)

Copy `.env.example` to `.env.local` and configure your credentials:

```bash
# Public Application URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Supabase / PostgreSQL Database
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
DATABASE_URL="postgresql://postgres:password@localhost:5432/amg_commerce"

# Cryptographic Master Secrets (OWASP ASVS v4.0)
JWT_SECRET="high_entropy_secret_min_32_characters_here"
ENCRYPTION_SECRET_KEY="aes256_master_secret_32_bytes_here"

# Ethiopian Payment Gateways (Sandbox / Production)
CHAPA_SECRET_KEY="CHASECK_TEST-xxxxxxxxxxxxxxxxxxxx"
CHAPA_PUBLIC_KEY="CHAPUBK_TEST-xxxxxxxxxxxxxxxxxxxx"
CHAPA_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxxxxxxxxx"

TELEBIRR_APP_ID="telebirr_app_id"
TELEBIRR_APP_KEY="telebirr_app_key"
TELEBIRR_SHORT_CODE="102938"

CBE_BIRR_MERCHANT_ID="cbe_merchant_amg"
CBE_BIRR_API_KEY="cbe_test_api_key"
```

---

## 6. API Documentation & OpenAPI Specification

The complete RESTful API contract is specified in [`docs/openapi.yaml`](docs/openapi.yaml).
Core routes include:
- `POST /api/auth/register` & `POST /api/auth/login` (MFA OTP supported)
- `GET /api/products` (paginated, indexed, cached)
- `GET / POST / DELETE /api/cart` (cross-platform server cart sync)
- `POST /api/payments/initiate` (requires `Idempotency-Key` header)
- `POST /api/payments/verify`
- `PATCH /api/orders/[id]/status` (state machine transition engine)
- `POST /api/quotes/convert-to-order` (agent quote conversion)
- `POST /api/erp/pos-transaction` (branch physical POS sync)
- `GET /api/health` (system uptime and telemetry)

---

## 7. Disaster Recovery & Docker Deployment

### Database Backup Automation
```bash
# Run hourly incremental WAL backup (RPO < 1h)
./scripts/backup.sh hourly

# Run daily full compressed snapshot (RTO < 4h)
./scripts/backup.sh daily
```

### Docker Compose
```bash
# Build and launch Next.js application and Redis broker
docker-compose up -d --build

# Verify container health
docker-compose ps
```
