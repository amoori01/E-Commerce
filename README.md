# AMG Holdings Multi-Subsidiary Enterprise E-Commerce & RFQ Platform

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Flutter](https://img.shields.io/badge/Flutter-3.47-02569B?style=for-the-badge&logo=flutter)](https://flutter.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Vitest Passing](https://img.shields.io/badge/Vitest-49%2F49%20Passed-success?style=for-the-badge&logo=vitest)](https://vitest.dev/)
[![Compliance](https://img.shields.io/badge/Compliance-OWASP%20ASVS%20%7C%20PCI--DSS%20%7C%20ERCA-purple?style=for-the-badge)](#security--compliance)

Enterprise-grade multi-subsidiary digital commerce, engineering quotation, and supply-chain logistics platform engineered for **AMG Holdings Group** (Ethiopia). Built in compliance with **ISO/IEC/IEEE 29148, OWASP ASVS v4.0, PCI-DSS v4.0, and Ethiopian ERCA fiscal tax compliance** standards.

---

## 🌟 Platform Architecture & Procurement Streams

AMG Holdings operates 5 industrial subsidiaries: Heavy Structural Steel Engineering, Ethio & Adama Roofing Solutions, Commercial Fleet Haulage, Industrial Cryogenic Gases, and Specialty Coffee Export. The platform unifies three primary commercial streams:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                  AMG HOLDINGS ENTERPRISE PLATFORM                               │
├──────────────────────────────┬──────────────────────────────┬───────────────────────────────────┤
│  STREAM A: DIRECT CHECKOUT   │ STREAM B: CUSTOM RFQ ENGINE  │  STREAM C: TREASURY & BANK RAILS  │
├──────────────────────────────┼──────────────────────────────┼───────────────────────────────────┤
│ • Fast-moving retail goods   │ • Engineered PEB buildings   │ • Commercial Bank of Ethiopia     │
│ • Real-time warehouse ledger │ • Sinotruk trailers & gases  │   (CBE) Core Banking FT matching  │
│ • Telebirr, CBE Birr, Chapa  │ • Blueprint / CAD uploads    │ • 4-hour stock reservation timer  │
│ • 15% Ethiopian VAT invoice  │ • Interactive negotiations & │ • ERCA fiscal receipts validation │
│ • QR-coded Gate Clearance    │   counter-offer adjustments  │ • Multi-stage warehouse release:  │
│ • Branch POS register sync   │ • Versioned Proforma Invoices│   Picking ➔ Staging ➔ Gate Pass   │
└──────────────────────────────┴──────────────────────────────┴───────────────────────────────────┘
```

---

## 🏢 Platform Workspaces & Role-Based Portals

The platform includes role-gated access with quick switcher support in the top navigation:

### 1. Storefront & Customer Portal (`/`, `/portal`)
- **Direct Catalog Shopping**: Real-time stock across regional depots with instant checkout via Telebirr, CBE Birr, and Chapa.
- **Custom Engineering RFQ**: Submit technical project requirements, CAD drawings, and target delivery milestones.
- **Real-Time Price Negotiations**: Two-way interactive messaging and counter-offer proposals with assigned AMG sales engineers.
- **Customer Portal**: Track orders, download ERCA-sealed proforma invoices, and access digital warehouse exit gate passes.

### 2. Engineering Sales Agent Workspace (`/agent`)
- **Quotation Formulation**: Formulates quotes using the standardized engineering cost formula:
  $$\text{Quote Total} = \text{Raw Materials} + (\text{Machine Hours} \times \text{Rate}) + \text{Protective Coating} + \text{Freight} + \text{Target Margin \%}$$
- **Versioned Proforma Generator**: Issues versioned proformas (`v1`, `v2`, `v3`) with itemized 15% VAT and official ERCA fiscal verification seal.
- **Real-time Counter-Offer Desk**: Reviews and approves customer discount requests and budget adjustments.
- **1-Click Order Conversion**: Directly converts accepted quotations into production procurement orders.

### 3. Corporate Finance & CBE Settlement Desk (`/finance`)
- **CBE Bank Transfer Verification**: Dedicated queue for verifying customer CBE Financial Transfer (FT) reference codes and payer accounts.
- **Settlement Approval**: One-click confirmation that triggers immediate stock release from reservation to warehouse fulfillment.
- **Audit Ledger**: Tracks ERCA tax withholdings, transaction receipts, and reconciliation audit logs.

### 4. Branch Depot Operations & Logistics (`/branch-admin`)
- **Multi-Hub Inventory Ledger**: Real-time physical inventory, allocated reserves, and reorder safety thresholds across Addis Ababa, Adama FTZ, Hawassa, and Dire Dawa.
- **Mill Intakes**: Instant **`+50 Intake`** and **`+500 Batch`** factory receipts with automated purchase order generation upon stock breach.
- **3-Stage Logistics Flow**: Complete stage management for **Picking**, **Staging**, and **Gate Clearance**.
- **Digital Gate Passes**: Generates cryptographically verifiable QR-coded gate passes for commercial carrier dispatch.
- **Sales Agent Portfolio Assignments**: Manages corporate client assignments with strict **ABAC subsidiary boundaries**.

### 5. Corporate Super Admin Console (`/admin`)
- **Consortium Catalog Governance**: Global control over subsidiaries, product lines, and pricing structures.
- **Security & RBAC Auditing**: Complete telemetric audit logging for all privileged logins, role elevations, and MFA challenges.
- **ERP Integration & DLQ**: Dead-Letter Queue monitoring for POS offline sync and external webhook deliveries.

---

## 📱 Cross-Platform Mobile Application (`/mobile`)

The `/mobile` directory contains a native **Flutter** cross-platform mobile companion app for iOS and Android:

- **Unified API Client**: Connects directly to the website's REST backend (`/api/products`, `/api/cart`, `/api/quotes`, and `/api/payments`).
- **Biometric Authentication**: Fingerprint and FaceID integration via `local_auth`.
- **Barcode & QR Scanner**: Warehouse inventory lookup and gate pass verification via camera scanner.
- **Deep Linking**: Seamless return navigation from mobile money gateway apps (`amg://checkout/confirm`).

### Testing the Mobile App:
```bash
cd mobile

# 1. Run in Chrome Browser (Quickest Desktop Test)
flutter run -d chrome

# 2. Run Automated Mobile Widget Tests
flutter test

# 3. Build Android Debug APK
flutter build apk --debug
```

---

## 🔑 Demo Personas & Test Credentials

Log in using the **1-Click Demo** tab on `/login` or enter the credentials below:

| Role | Name | Email | Password | Primary Scope |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | Dawit Haile | `superadmin@amgholdings.com` | `Password123!` | Consortium governance, catalog rules, audit logs |
| **Branch Admin** | Mulugeta Tadesse | `roofing.admin@amgholdings.com` | `Password123!` | Adama Depot, picking/staging, gate pass clearance |
| **Finance Lead** | Helen Girmachew | `finance.lead@amgholdings.com` | `Password123!` | CBE bank FT reconciliation & payment approvals |
| **Sales Agent** | Eng. Solomon Bekele | `agent.solomon@amgholdings.com` | `Password123!` | Technical RFQ pricing, proformas, ERCA seal |
| **B2B Customer** | Almaz Worku (MIDROC) | `procurement@midroc-corp.et` | `Password123!` | Institutional procurement, bulk RFQs & negotiations |
| **B2C Customer** | Ahmed | `ahmed@gmail.com` | `Password123!` | Direct retail shopping & CBE / Telebirr payment |

> **Note**: Privileged staff accounts (`super_admin`, `branch_admin`, `sales_agent`) enforce MFA security challenges (default verification code: `123456`).

---

## 🚀 Quick Start & Local Execution

### Prerequisites
- **Node.js** 18+ (tested on Node 22)
- **npm** or **pnpm**
- **Flutter SDK** 3.x (optional, for mobile app development)

### 1. Installation
```bash
git clone https://github.com/amoori01/E-Commerce.git
cd E-Commerce
npm install
```

### 2. Run Test Suite
```bash
# Web Vitest test suite (49 tests across 9 suites)
npm test

# TypeScript strict compile check
npx tsc --noEmit
```

### 3. Start Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🌐 API Route Specifications

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/products` | `GET`, `POST` | Paginated catalog search, subsidiary filtering, and stock counts |
| `/api/quotes` | `GET`, `POST` | Stream B RFQ submission and active quotes ledger |
| `/api/quotes/[id]` | `PATCH` | Engineering cost formulation and counter-offer revisions |
| `/api/quotes/convert-to-order` | `POST` | 1-click quote conversion into finalized procurement order |
| `/api/orders` | `GET`, `POST` | Order placement, delivery scheduling, and status retrieval |
| `/api/orders/[id]` | `PATCH` | Warehouse logistics stage progression (Picking ➔ Staging ➔ Gate) |
| `/api/inventory/restock` | `POST` | Mill batch intakes (+50, +500) and automated restock POs |
| `/api/branch-admin/agents` | `GET`, `POST` | ABAC-enforced sales agent portfolio assignments |
| `/api/erp/pos-transaction` | `POST` | Physical branch POS cash register synchronization |
| `/api/webhooks/chapa` | `POST` | Chapa payment webhook verification and automated settlement |
| `/api/webhooks/telebirr` | `POST` | Telebirr mobile money payment notification handler |

---

## 🛡️ Security & Compliance Standards

- **OWASP ASVS v4.0**: Edge middleware rate-limiting, strict CSRF headers, HTTP-only JWT cookies, and parameterized queries.
- **MFA Enforcement**: SMS/OTP two-factor authentication required for all administrative roles.
- **PCI-DSS v4.0**: No cardholder PAN/CVV stored on platform; fully tokenized payment processing.
- **ERCA Fiscal Compliance**: Itemized 15% Ethiopian VAT calculation with automated TIN/VAT validation and tamper-evident machine seals.

---

## 📄 License
Copyright © 2026 AMG Holdings Group. All corporate rights reserved.
Enterprise Multi-Subsidiary Digital Transformation Platform.
