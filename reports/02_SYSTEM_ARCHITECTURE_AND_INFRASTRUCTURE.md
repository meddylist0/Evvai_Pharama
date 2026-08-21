# 🏗️ PHARMALINK ENTERPRISE
## Volume 2 — System Architecture & Infrastructure

**Document Reference**: `PHARMALINK-DOC-02-ARCH`  
**Document Classification**: Enterprise Confidential  
**Document Type**: Architectural Specification & System Design Handover  
**Version**: 1.0  
**Status**: Approved / Engineering Handover  
**Target Audience**: Solution Architects, Lead Engineers, Infrastructure & Operations Teams, Security Auditors

---

## 1. Document Purpose

This document defines the complete technical architecture, component topology, data flow, database entity-relationship (ER) schemas, and module design for the PharmaLink Enterprise platform.

---

## 2. Architecture Principles & Design Goals

1. **Decoupled API-First Design**: The frontend React/Next.js UI communicates with the FastAPI backend strictly via JSON REST APIs using JWT Bearer tokens.
2. **Stateless Authentication**: Server sessions are stateless; authorization is evaluated per-request via JWT claims verified against database roles.
3. **Database Integrity & Schema Sync**: Database tables are modeled via SQLAlchemy ORM; schema changes are automatically migrated on startup using `sync_db_schema()`.
4. **Defense-in-Depth Security**: Multiple layers of security (Rate limiting ➔ JWT validation ➔ DB Role lookup ➔ Resource ownership check ➔ Regex audit redaction).

---

## 3. High-Level System Topology & Context

```mermaid
graph TB
    subgraph Client Layer [Next.js 15 App Router Frontend]
        Storefront["Public Storefront & Corporate Pages"]
        CustPortal["B2C Customer Portal"]
        DistPortal["B2B Distributor Portal"]
        AdminConsole["Enterprise Admin Console"]
        AuthCtx["Reactive AuthContext & LocalStorage Sync"]
    end

    subgraph API Gateway & Core Layer [FastAPI Uvicorn Backend]
        Router["V1 API Router (/api/v1)"]
        RateLimit["Login Rate Limiter (Sliding Window)"]
        AuthGuard["JWT & RBAC Dependency Guard"]
        OrderEngine["Order & Dynamic Pricing Engine"]
        AuditEngine["Redacted Audit Logging Engine"]
        PaymentVerifier["Razorpay HMAC Signature Verifier"]
    end

    subgraph Persistence Layer [Database Engine]
        DB[("SQLite Database - pharmalink.db")]
        AutoSync["Auto Schema Sync Engine"]
    end

    subgraph External Gateways
        RazorpayGateway["Razorpay Payment Gateway API"]
    end

    Storefront --> AuthCtx
    CustPortal --> AuthCtx
    DistPortal --> AuthCtx
    AdminConsole --> AuthCtx

    AuthCtx -->|HTTP REST / JWT Bearer| Router
    Router --> RateLimit
    RateLimit --> AuthGuard
    AuthGuard --> OrderEngine
    AuthGuard --> AuditEngine
    AuthGuard --> PaymentVerifier

    OrderEngine --> DB
    AuditEngine --> DB
    PaymentVerifier --> DB
    AutoSync --> DB

    PaymentVerifier <-->|HMAC-SHA256 Sig Check| RazorpayGateway
```

---

## 4. Database Entity-Relationship (ER) Schema

```mermaid
erDiagram
    USERS ||--o| CUSTOMER_PROFILES : "has profile"
    USERS ||--o| DISTRIBUTOR_PROFILES : "has profile"
    USERS ||--o{ ORDERS : "places"
    USERS ||--o{ AUDIT_LOGS : "triggers"
    DISTRIBUTOR_PROFILES ||--o{ DISTRIBUTOR_KYC : "submits"
    CATEGORIES ||--o{ PRODUCTS : "contains"
    ORDERS ||--o{ ORDER_ITEMS : "contains"
    PRODUCTS ||--o{ ORDER_ITEMS : "referenced_in"

    USERS {
        int id PK
        string email UK
        string hashed_password
        string full_name
        string phone
        string avatar
        string role "ADMIN | DISTRIBUTOR | CUSTOMER"
        boolean is_active
        boolean is_verified
        datetime created_at
    }

    CUSTOMER_PROFILES {
        int id PK
        int user_id FK
        string address
        string city
        string state
        string pincode
    }

    DISTRIBUTOR_PROFILES {
        int id PK
        int user_id FK
        string company_name
        string distributor_name
        string gstin
        string drug_license_no
        string business_address
        string city
        string state
        string pincode
        string kyc_status "PENDING | APPROVED | REJECTED"
    }

    DISTRIBUTOR_KYC {
        int id PK
        int distributor_id FK
        string gst_number
        string drug_license_no
        string pan_number
        string document_file_url
        string verification_status "PENDING | APPROVED | REJECTED"
        string admin_remarks
    }

    PRODUCTS {
        int id PK
        int category_id FK
        string sku UK
        string name
        string composition
        string pack_size
        float mrp
        float customer_price
        float distributor_price
        float bulk_price
        int bulk_moq
        int stock
        int reserved_stock
        string batch_no
        string status "active | disabled"
    }

    ORDERS {
        int id PK
        string order_code UK
        int user_id FK
        string role
        float subtotal
        float tax_amount
        float shipping_charge
        float total_amount
        string order_status "Pending | Confirmed | Packed | Shipped | Delivered | Cancelled"
        string payment_status "Pending | Paid | Failed | COD"
        string invoice_number
    }

    ORDER_ITEMS {
        int id PK
        int order_id FK
        int product_id FK
        string product_name
        string sku
        float unit_price
        int quantity
        float total_price
    }
```

---

## 5. Core Backend Module Architecture

### 5.1 `app/core/config.py` (Configuration Management)
- Uses Pydantic `BaseSettings` for type-safe environment variable parsing.
- Enforces strict security validation: If `ENVIRONMENT == "production"`, validates that `SECRET_KEY` is at least 32 characters long and rejects default placeholder values.

### 5.2 `app/core/permissions.py` (Authorization Guard)
- Extracts JWT token from HTTP `Authorization: Bearer <token>` header via `OAuth2PasswordBearer`.
- `get_current_user`: Decodes JWT using `HS256`, validates expiration, extracts `sub` (user ID), and loads active user record from database.
- `require_roles`: Dependency factory enforcing authoritative database role (`current_user.role`).
- `get_current_user_optional`: Safely resolves requesting user if token exists; returns `None` gracefully for unauthenticated calls without raising HTTP 500 errors.

### 5.3 `app/core/rate_limiter.py` (In-Memory Login Rate Limiter)
- Thread-safe sliding window rate limiter tracking failed login attempts per `(client_ip, email)` key over a 60-second window.
- Exceeding 5 failed attempts triggers `HTTP 429 Too Many Requests`.

---

## 6. Frontend Next.js 15 App Architecture

- **App Router Layouts**: Separates public pages (`/app/(public)`), customer portal (`/app/customer`), distributor portal (`/app/distributor`), and admin console (`/app/admin`).
- **Global Auth Context (`AuthContext.tsx`)**: Provides global reactive state for `user`, `login()`, `logout()`, `updateProfile()`, and synchronization across browser tabs.
- **API Client (`lib/api.ts`)**: Unified fetch wrapper attaching Bearer headers automatically, handling errors, and firing reactive window events (`pharmalink_user_updated`).
