# AMG Holdings Multi-Subsidiary Enterprise E-Commerce & RFQ Platform

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Tests Passing](https://img.shields.io/badge/Vitest-46%2F46%20Passed-success?style=for-the-badge&logo=vitest)](https://vitest.dev/)
[![Compliance](https://img.shields.io/badge/Compliance-OWASP%20ASVS%20%7C%20PCI--DSS%20%7C%20ERCA-purple?style=for-the-badge)](#security--compliance)

Enterprise-grade multi-subsidiary digital commerce and engineering quotation platform engineered for **AMG Holdings PLC** (Ethiopia). Built under **ISO/IEC/IEEE 29148, OWASP ASVS v4.0, PCI-DSS v4.0, and Ethiopian ERCA fiscal tax compliance** standards.

---

## 🌟 Key Platform Capabilities

AMG Holdings encompasses heavy structural steel engineering, commercial transport, industrial gases, roofing solutions, and specialty coffee. The platform unifies two core procurement streams:

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                  AMG HOLDINGS STOREFRONT                                │
├────────────────────────────────────────────┬────────────────────────────────────────────┤
│         STREAM A: DIRECT CHECKOUT          │        STREAM B: CUSTOM RFQ ENGINE         │
├────────────────────────────────────────────┼────────────────────────────────────────────┤
│ • Fast-moving industrial & retail goods   │ • Engineered pre-engineered buildings (PEB)│
│ • Real-time warehouse inventory ledger    │ • Sinotruk trailers & bulk cryogenic gases  │
│ • Local Ethiopian gateways (Telebirr,      │ • Blueprint / CAD technical file upload    │
│   CBE Birr, Chapa, Bank Wire)              │ • Engineering Cost Breakdown formula:      │
│ • Automated 15% Ethiopian VAT invoicing   │   (Raw Materials + Machining + Coating +   │
│ • Branch physical inventory reservation    │    Freight + Target Margin %)              │
│ • Security QR code Gate Clearance pass     │ • Versioned Proforma Invoices (v1, v2)     │
│ • Physical POS transaction sync broker     │ • Official Ethiopian ERCA Fiscal Seal      │
└────────────────────────────────────────────┴────────────────────────────────────────────┘
```

---

## 🏢 Platform Portals & Role-Based Workflows

The platform features an instant **Role Switcher** in the top navigation bar to test all user personas without logging out:

### 1. Storefront & Customer Portal (`/`, `/catalog`, `/cart`, `/checkout`, `/orders`)
- **Stream A Shopping**: Add standard products (corrugated roofing, rebars, coffee, lubricants) to cart and pay with **Telebirr**, **CBE Birr**, or **Chapa**.
- **Stream B Custom RFQ Modal**: Submit technical engineering specs, blueprint drawings, and target delivery timelines.
- **Account & Orders**: Real-time order tracking, gate clearance status, and proforma PDF download.

### 2. Engineering Sales Agent Workspace (`/agent`)
- **RFQ Review & Interactive Negotiation**: In-platform messaging with client engineers.
- **Cost Formulation Engine**: Input exact parameters:
  $$\text{Total} = \text{Raw Material} + (\text{Machine Hours} \times \text{Rate}) + \text{Protective Coating} + \text{Freight} + \text{Margin \%}$$
- **Versioned Proforma Generator**: Issues versioned drafts (`v1`, `v2`, `v3`) with itemized 15% Ethiopian VAT calculation and authentic ERCA fiscal compliance seal.
- **1-Click Conversion**: Converts finalized proformas directly into verified procurement orders.

### 3. Branch Admin & Regional Depot Management (`/branch-admin`)
- **Depot Inventory Ledger**: Real-time physical stock and reserved units per branch (Addis Ababa, Adama, Hawassa, Dire Dawa).
- **One-Click Batch Intakes**: Instant **`+50 Intake`** and **`+500 Batch`** factory mill receipts.
- **Auto-Reorder PO Generation**: Automatically generates purchase orders when safety stock thresholds are breached.
- **Physical POS Sync**: Integrated with `/api/erp/pos-transaction` for offline cash register reconciliation.
- **Freight Dispatch & Gate Passes**: Generates secure QR-coded warehouse exit gate passes.
- **Sales Agent Portfolio Assignments**: Assigns specialized sales agents to corporate accounts (MIDROC, Sunshine Construction, Sur Construction, Dangote) with strict **ABAC subsidiary boundary enforcement**.

### 4. Super Admin Corporate Governance (`/admin`)
- **Cross-Subsidiary Catalog**: Manage product inventory across all sister subsidiaries.
- **Security Audit Logs**: Track RBAC/ABAC events, sensitive profile changes, and MFA verifications.
- **Dead-Letter Queue (DLQ)**: Monitor and retry failed ERP/SMS sync transactions.

---

## 🚀 Quick Start & Local Execution

### Prerequisites
- **Node.js** 18+ (tested on Node 22)
- **npm** or **pnpm**
- Modern web browser

### 1. Clone & Install
```bash
git clone https://github.com/amoori01/E-Commerce.git
cd E-Commerce
npm install
```

### 2. Run Automated Verification Tests
```bash
npm test
```
> Runs 46 automated Vitest unit & integration tests covering domain logic, Ethiopian VAT calculation, MFA gating, ABAC boundaries, and ERP sync.

### 3. Start Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🔑 Demo Personas & Test Credentials

Use the **Role Switcher** in the top navigation or log in with these pre-seeded accounts:

| Role | Name | Email | Password | Primary Scope |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | Dawit Haile | `superadmin@amgholdings.com` | `AmgAdmin2026!` | Cross-subsidiary governance & catalog management |
| **Branch Admin** | Mulugeta Tadesse | `roofing.admin@amgholdings.com` | `AmgBranch2026!` | Depot inventory, +50/+500 intakes, gate clearance |
| **Sales Agent** | Solomon Bekele | `agent.solomon@amgholdings.com` | `AmgAgent2026!` | Engineering pricing matrix, proforma VAT & ERCA seals |
| **B2B Customer** | Almaz Teferra (MIDROC) | `procurement@midroc-corp.et` | `AmgClient2026!` | Institutional RFQs, large-scale custom procurement |
| **B2C Customer** | Abebe Kebede | `abebe.kebede@gmail.com` | `AmgCustomer2026!` | Retail shopping with Telebirr & CBE Birr checkout |

---

## 🛠️ Tech Stack & Architecture

- **Framework**: [Next.js 15.5](https://nextjs.org/) (App Router, Server Components & Route Handlers)
- **UI & Design**: [React 19](https://react.dev/), [Tailwind CSS 3.4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/)
- **State & Data**: In-memory seeded enterprise ledger + Supabase/PostgreSQL schema ready
- **Testing**: [Vitest 4.1](https://vitest.dev/) (46/46 unit, integration, and security tests)
- **Authentication**: JWT, Session cookies, OTP-based MFA, Attribute-Based Access Control (ABAC)
- **Payment Gateways**: Telebirr, CBE Birr, Chapa Webhooks, Bank Wire transfer simulation
- **Tax Compliance**: Ethiopian Revenue and Customs Authority (ERCA) itemized 15% VAT & machine seal

---

## 🌐 API Route Specifications

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/products` | `GET`, `POST` | Catalog search, category filters, and product creation |
| `/api/quotes` | `GET`, `POST` | Stream B custom RFQ submission and quote retrieval |
| `/api/quotes/[id]` | `PATCH` | Engineering formula update, VAT calculation, proforma revision |
| `/api/quotes/convert-to-order` | `POST` | 1-click quote conversion to finalized procurement order |
| `/api/orders` | `GET`, `POST` | Stream A checkout and order status management |
| `/api/inventory/restock` | `POST` | Factory batch intakes (+50, +500) and restock PO generation |
| `/api/branch-admin/agents` | `GET`, `POST` | ABAC-enforced sales agent portfolio assignments |
| `/api/erp/pos-transaction` | `POST` | Physical branch POS cash register synchronization |
| `/api/webhooks/chapa` | `POST` | Webhook verification and automated payment reconciliation |

---

## 🚢 Deployment Guide

### Deploying to Vercel (1-Click)
1. Fork or push this repository to GitHub.
2. Sign in to [Vercel](https://vercel.com) and import the repository.
3. Keep default settings (`npm run build`) and click **Deploy**.

### Docker Deployment
```bash
# Build the container image
docker build -t amg-holdings-ecommerce .

# Run container on port 3000
docker run -p 3000:3000 amg-holdings-ecommerce
```

---

## 📄 License
Copyright © 2026 AMG Holdings PLC. All rights reserved. Enterprise Digital Transformation Platform.
