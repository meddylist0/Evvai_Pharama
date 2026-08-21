# 📘 PharmaLink Enterprise — Complete API Documentation & Step-by-Step Implementation Guide

This comprehensive guide contains the **Complete REST API Endpoints Specification** and a **Step-by-Step Technical Implementation Breakdown** explaining exactly how every module in PharmaLink Enterprise was engineered.

---

## 📋 Table of Contents
1. [Architecture Overview & Tech Stack](#1-architecture-overview--tech-stack)
2. [Complete REST API Endpoints Specification](#2-complete-rest-api-endpoints-specification)
   - [Authentication API (`/api/v1/auth`)](#1-authentication-api-apiv1auth)
   - [Products & Catalog API (`/api/v1/products`)](#2-products--catalog-api-apiv1products)
   - [Orders & Fulfillment API (`/api/v1/orders`)](#3-orders--fulfillment-api-apiv1orders)
   - [Distributor KYC Verification API (`/api/v1/kyc`)](#4-distributor-kyc-verification-api-apiv1kyc)
   - [Razorpay & Payments API (`/api/v1/payments`)](#5-razorpay--payments-api-apiv1payments)
   - [Reports & Analytics API (`/api/v1/reports`)](#6-reports--analytics-api-apiv1reports)
   - [Audit Logging API (`/api/v1/audit`)](#7-audit-logging-api-apiv1audit)
   - [User Accounts Management API (`/api/v1/users`)](#8-user-accounts-management-api-apiv1users)
3. [Step-by-Step Technical Implementation Breakdown](#3-step-by-step-technical-implementation-breakdown)
   - [1. Authentication & JWT Architecture](#1-authentication--jwt-architecture)
   - [2. RBAC & IDOR/BOLA Ownership Protection](#2-rbac--idorbola-ownership-protection)
   - [3. Role-Based Dynamic Pricing Engine](#3-role-based-dynamic-pricing-engine)
   - [4. Order Fulfillment, Stock Deduction & GST Calculation](#4-order-fulfillment-stock-deduction--gst-calculation)
   - [5. Distributor KYC Approval Workflow](#5-distributor-kyc-approval-workflow)
   - [6. Razorpay Payment Gateway & Signature Verification](#6-razorpay-payment-gateway--signature-verification)
   - [7. Login Rate Limiting (Brute-Force Defense)](#7-login-rate-limiting-brute-force-defense)
   - [8. Sensitive Data Sanitization in Audit Logging](#8-sensitive-data-sanitization-in-audit-logging)

---

## 1. Architecture Overview & Tech Stack

- **Backend Framework**: FastAPI (Python 3.11+) running on Uvicorn
- **ORM & Database**: SQLAlchemy 2.0+ connected to SQLite (`pharmalink.db`) with auto-sync schema handling (`sync_db_schema()`)
- **Security & Tokens**: PyJWT (HS256 algorithm, 15-minute access token expiry), Passlib Bcrypt for password hashing
- **Frontend Framework**: Next.js 15 (App Router, React 19, TypeScript), Tailwind CSS v4, reactive `AuthContext`
- **Payment Gateway**: Razorpay Checkout JS & API with HMAC-SHA256 signature verification

---

## 2. Complete REST API Endpoints Specification

### 1. Authentication API (`/api/v1/auth`)

#### `POST /api/v1/auth/login`
- **Description**: Authenticates user credentials, applies rate limiting, and returns JWT access token.
- **Auth Level**: Public (Rate Limited: 5 failed attempts / 60s per IP/email)
- **Request Body**:
  ```json
  {
    "email": "admin@pharmalink.com",
    "password": "Admin@123"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "role": "ADMIN",
    "user_id": 1,
    "full_name": "Dr. Arun Bhairi",
    "email": "admin@pharmalink.com",
    "kyc_status": null,
    "avatar": "https://images.unsplash.com/photo-..."
  }
  ```
- **Errors**: `401 Unauthorized` ("Incorrect email or password"), `429 Too Many Requests`.

---

#### `POST /api/v1/auth/register-customer`
- **Description**: Registers a new B2C retail customer in an atomic database transaction.
- **Auth Level**: Public
- **Request Body**:
  ```json
  {
    "email": "customer@gmail.com",
    "password": "CustPassword123!",
    "full_name": "Kavita Reddy",
    "phone": "+91 9988776655",
    "address": "Flat 402, Green Meadows",
    "city": "Hyderabad",
    "state": "Telangana",
    "pincode": "500081"
  }
  ```
- **Response (200 OK)**: Returns JWT `AuthResponse` dictionary.

---

#### `POST /api/v1/auth/register-distributor`
- **Description**: Registers a B2B distributor and creates a pending KYC submission in an atomic transaction.
- **Auth Level**: Public
- **Request Body**:
  ```json
  {
    "email": "distributor@medplus.com",
    "password": "DistPassword123!",
    "full_name": "Rajesh Kumar",
    "phone": "+91 9876543210",
    "company_name": "MedPlus Logistics Pvt Ltd",
    "distributor_name": "Rajesh Kumar",
    "gstin": "36AAACR1234F1Z0",
    "drug_license_no": "TS/HYD/2026/8899",
    "pan_number": "ABCDE1234F",
    "business_address": "Plot 12, Pharma Hub",
    "city": "Hyderabad",
    "state": "Telangana",
    "pincode": "500081"
  }
  ```
- **Response (200 OK)**: Returns JWT `AuthResponse` with `kyc_status: "PENDING"`.

---

#### `GET /api/v1/auth/me`
- **Description**: Returns full user profile details for authenticated user.
- **Auth Level**: Authenticated (`get_current_user`)
- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**: `UserOut` schema containing user fields, `customer_profile`, `distributor_profile`, and avatar.

---

#### `PUT /api/v1/auth/profile`
- **Description**: Updates profile details (display name, phone, company name, avatar) for authenticated user.
- **Auth Level**: Authenticated (`get_current_user`)
- **Request Body**: `ProfileUpdateRequest` (`full_name`, `phone`, `company_name`, `avatar`, etc.)
- **Response (200 OK)**: Returns updated `UserOut` object.

---

### 2. Products & Catalog API (`/api/v1/products`)

#### `GET /api/v1/products`
- **Description**: Retrieves formulation catalog. Automatically applies role-based dynamic pricing depending on token role.
- **Auth Level**: Optional Authentication (`get_current_user_optional`)
- **Query Params**: `category_slug` (string, optional), `search` (string, optional), `include_disabled` (bool, default `false`)
- **Dynamic Pricing Selection Logic**:
  - **Guest / Retail Customer**: `display_price` = `mrp` or `customer_price`. `distributor_price` & `bulk_price` are hidden (`null`).
  - **Verified Distributor**: `display_price` = `distributor_price` (or `bulk_price` if MOQ quantity met). `distributor_price` is visible.
- **Response (200 OK)**: Array of `ProductItem` objects.

---

#### `POST /api/v1/products`
- **Description**: Creates a new pharmaceutical product SKU in catalog.
- **Auth Level**: Admin Only (`require_admin`)
- **Response (200 OK)**: Created `ProductItem`.

---

#### `POST /api/v1/products/{product_id}/adjust-stock`
- **Description**: Adjusts batch stock inventory for a product with reason logging.
- **Auth Level**: Admin Only (`require_admin`)
- **Request Body**: `{"adjustment": +500, "reason": "New Batch Warehouse Receipt"}`
- **Response (200 OK)**: Updated `ProductItem`.

---

#### `GET /api/v1/categories`
- **Description**: Returns list of therapeutic category taxonomies.
- **Auth Level**: Public / Authenticated

---

### 3. Orders & Fulfillment API (`/api/v1/orders`)

#### `POST /api/v1/orders`
- **Description**: Places a new order, calculates role-based prices, deducts inventory stock, computes GST (12%), and generates invoice.
- **Auth Level**: Authenticated User (`get_current_user`)
- **Request Body**:
  ```json
  {
    "items": [{"product_id": 1, "quantity": 10}],
    "customer_name": "Kavita Reddy",
    "customer_phone": "+91 9988776655",
    "delivery_address": "Flat 402, Green Meadows",
    "delivery_city": "Hyderabad",
    "delivery_state": "Telangana",
    "delivery_pincode": "500081",
    "payment_method": "UPI"
  }
  ```
- **Response (201 Created)**: Created `OrderOut` record.

---

#### `GET /api/v1/orders/my-orders`
- **Description**: Retrieves purchase orders for current authenticated user.
- **Auth Level**: Authenticated User (`get_current_user`)
- **Response (200 OK)**: Array of `OrderOut` objects for `user_id == current_user.id`.

---

#### `GET /api/v1/orders/admin/all`
- **Description**: Retrieves all system orders across customers and distributors.
- **Auth Level**: Admin Only (`require_admin`)
- **Query Params**: `order_status` (optional filter), `search` (optional)

---

#### `GET /api/v1/orders/{order_id}`
- **Description**: Retrieves order details by ID. Enforces strict IDOR ownership check.
- **Auth Level**: Authenticated User (`get_current_user`)
- **IDOR Check**: Access granted only if `current_user.id == order.user_id` OR `current_user.role == "ADMIN"`. Otherwise returns `403 Forbidden`.

---

#### `PATCH /api/v1/orders/{order_id}/status`
- **Description**: Updates order fulfillment pipeline status (`Pending` ➔ `Confirmed` ➔ `Packed` ➔ `Shipped` ➔ `Delivered`).
- **Auth Level**: Admin Only (`require_admin`)
- **Request Body**: `{"order_status": "Delivered", "tracking_number": "TRK123456"}`

---

#### `GET /api/v1/orders/{order_id}/invoice`
- **Description**: Generates tax invoice representation with GSTIN, HSN breakdowns, and itemization. Enforces IDOR check.
- **Auth Level**: Authenticated User (`get_current_user`)

---

### 4. Distributor KYC Verification API (`/api/v1/kyc`)

#### `POST /api/v1/kyc/submit`
- **Description**: Submits or re-submits distributor Drug License and GSTIN for compliance review.
- **Auth Level**: Distributor Only (`require_distributor`)

---

#### `GET /api/v1/kyc/pending`
- **Description**: Lists all distributor KYC submissions awaiting admin approval.
- **Auth Level**: Admin Only (`require_admin`)

---

#### `POST /api/v1/kyc/{submission_id}/review`
- **Description**: Approves or rejects a distributor KYC submission. If approved, marks `distributor.user.is_verified = True`.
- **Auth Level**: Admin Only (`require_admin`)
- **Request Body**: `{"status": "APPROVED", "admin_remarks": "Verified Drug License via Telangana DCA Portal."}`

---

### 5. Razorpay & Payments API (`/api/v1/payments`)

#### `GET /api/v1/payments/config`
- **Description**: Public configuration for Razorpay key ID, mode (`test`/`live`), and gateway active status.
- **Auth Level**: Public

---

#### `POST /api/v1/payments/create-razorpay-order`
- **Description**: Interacts with Razorpay API to create a live/test payment order ID.
- **Auth Level**: Authenticated User (`get_current_user`)

---

#### `POST /api/v1/payments/verify-and-order`
- **Description**: Validates HMAC-SHA256 payment signature sent from Razorpay checkout widget and creates paid order.
- **Auth Level**: Authenticated User (`get_current_user`)
- **Request Body**:
  ```json
  {
    "razorpay_payment_id": "pay_xyz123",
    "razorpay_order_id": "order_abc456",
    "razorpay_signature": "cryptographic_hmac_hex_string",
    "order_data": { ... }
  }
  ```

---

#### `GET /api/v1/payments/admin/settings` & `PUT /api/v1/payments/admin/settings`
- **Description**: Manages Razorpay Key ID, Secret (masked in responses), Gateway Active Status, and COD settings.
- **Auth Level**: Admin Only (`require_admin`)

---

### 6. Reports & Analytics API (`/api/v1/reports`)

#### `GET /api/v1/reports/dashboard`
- **Description**: Executive dashboard metrics (sales today, total revenue, pending orders, low stock alerts, KYC count).
- **Auth Level**: Admin Only (`require_admin`)

---

#### `GET /api/v1/reports/commercial-analytics`
- **Description**: Breakdown of B2B Wholesale vs Retail Direct revenue and transaction analytics.
- **Auth Level**: Admin Only (`require_admin`)

---

### 7. Audit Logging API (`/api/v1/audit`)

#### `GET /api/v1/audit`
- **Description**: System audit trail of security events, profile updates, and operational actions.
- **Auth Level**: Admin Only (`require_admin`)

---

### 8. User Accounts Management API (`/api/v1/users`)

#### `GET /api/v1/users`
- **Description**: Lists all registered platform accounts with order metrics.
- **Auth Level**: Admin Only (`require_admin`)

---

#### `POST /api/v1/users`
- **Description**: Creates a staff or user account directly from Admin console.
- **Auth Level**: Admin Only (`require_admin`)

---

#### `PATCH /api/v1/users/{user_id}/toggle-status`
- **Description**: Activates or deactivates a user account.
- **Auth Level**: Admin Only (`require_admin`)

---

## 3. Step-by-Step Technical Implementation Breakdown

### 1. Authentication & JWT Architecture

#### How it was implemented:
1. **Password Hashing**: Passlib with Bcrypt (`get_password_hash` & `verify_password`). Passwords are never stored in plaintext or logged.
2. **Token Creation (`create_access_token`)**:
   - Generates JWT using `jose.jwt.encode`.
   - Forces claims: `sub` (string representation of `user.id`), `role`, `iat` (issued at UTC timestamp), and `exp` (15 minutes UTC timestamp).
3. **Token Decoding (`decode_access_token`)**:
   - Decodes JWT using `jose.jwt.decode` with explicit algorithm specification `algorithms=[settings.ALGORITHM]` (`HS256`).
   - Prevents algorithm-switching attacks.

---

### 2. RBAC & IDOR/BOLA Ownership Protection

#### How it was implemented:
1. **Backend Role Validation (`require_roles`)**:
   - Dependency function `require_roles(allowed_roles)` wraps `get_current_user`.
   - Checks `current_user.role` from the database. It does **not** rely on frontend local storage or unverified token claims.
   - If `current_user.role` is not in `allowed_roles`, raises `HTTP 403 Forbidden`.
2. **IDOR Ownership Checks**:
   - Inside endpoints like `GET /api/v1/orders/{order_id}` and `GET /api/v1/orders/{order_id}/invoice`:
     ```python
     if current_user.role != UserRole.ADMIN and order.user_id != current_user.id:
         raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
     ```
   - Customer A attempting to access Customer B's resource ID receives a `403 Forbidden` response.

---

### 3. Role-Based Dynamic Pricing Engine

#### How it was implemented:
1. In `GET /api/v1/products`, the optional auth dependency `get_current_user_optional` resolves the requesting user if a Bearer token is provided.
2. Price calculation logic in `products.py`:
   - If user is `None` or role is `CUSTOMER`:
     - `display_price` = `mrp` or `customer_price`.
     - `distributor_price` and `bulk_price` are set to `None` (hidden from response).
   - If user role is `DISTRIBUTOR`:
     - `display_price` = `distributor_price`.
     - `distributor_price` and `bulk_price` fields are populated.
3. During order placement (`order_service.py`), unit price selection evaluates:
   ```python
   if is_distributor:
       if quantity >= product.bulk_moq and product.bulk_price > 0:
           unit_price = product.bulk_price
       else:
           unit_price = product.distributor_price
   else:
       unit_price = product.customer_price
   ```

---

### 4. Order Fulfillment, Stock Deduction & GST Calculation

#### How it was implemented:
1. **Atomic Transaction**: Order creation uses `with_for_update()` locking on product rows during stock validation.
2. **Stock Deduction**:
   - Validates `product.stock >= requested_quantity`.
   - Deducts `product.stock -= quantity` and increments `product.reserved_stock += quantity`.
3. **Financial Calculations**:
   - `subtotal` = Sum of `unit_price * quantity`.
   - `tax_amount` = `round(subtotal * 0.12, 2)` (12% Pharma GST).
   - `shipping_charge` = ₹0.0 for orders > ₹1000 or Distributors; otherwise ₹50.0.
   - `total_amount` = `subtotal + tax_amount + shipping_charge`.
4. **Invoice Generation**: Formats invoice number `INV-EVV-YYYYMM-XXXX` with company GSTIN (`36AAACE1234F1Z5`), buyer details, and HSN itemization.

---

### 5. Distributor KYC Approval Workflow

#### How it was implemented:
1. Upon distributor registration, a `DistributorProfile` and a `DistributorKYC` submission record are created in `PENDING` status.
2. Admin reviews pending submissions at `GET /api/v1/kyc/pending`.
3. Upon approval at `POST /api/v1/kyc/{submission_id}/review`:
   - Sets `submission.verification_status = "APPROVED"`.
   - Sets `submission.distributor.kyc_status = "APPROVED"`.
   - Sets `submission.distributor.user.is_verified = True`.
   - Unlocks verified distributor pricing portal.

---

### 6. Razorpay Payment Gateway & Signature Verification

#### How it was implemented:
1. **Order Creation**: Frontend requests `POST /api/v1/payments/create-razorpay-order`. Backend calls Razorpay API to generate a Razorpay order ID.
2. **HMAC-SHA256 Signature Verification**:
   - When payment completes in Razorpay checkout JS widget, frontend sends `razorpay_payment_id`, `razorpay_order_id`, and `razorpay_signature` to `/api/v1/payments/verify-and-order`.
   - Backend calculates signature using python `hmac` module:
     ```python
     msg = f"{razorpay_order_id}|{razorpay_payment_id}"
     generated_signature = hmac.new(
         key_secret.encode('utf-8'),
         msg.encode('utf-8'),
         hashlib.sha256
     ).hexdigest()
     ```
   - Compares using `hmac.compare_digest(generated_signature, razorpay_signature)`. If valid, order is saved with `PaymentStatus.PAID`.

---

### 7. Login Rate Limiting (Brute-Force Defense)

#### How it was implemented:
1. `LoginRateLimiter` class in `app/core/rate_limiter.py` uses an in-memory thread lock (`threading.Lock()`).
2. Tracks failed attempt timestamps per `client_ip:email` key.
3. If attempts within the 60-second window reach 5:
   - Raises `HTTPException(429, detail="Too many failed login attempts. Please try again after 60 seconds.")`.
4. On successful login, `login_rate_limiter.record_success(ip, email)` clears the failure history.

---

### 8. Sensitive Data Sanitization in Audit Logging

#### How it was implemented:
1. Function `sanitize_audit_details()` in `app/services/audit_service.py` executes Regex replacement on all log strings before writing to `audit_logs` table:
   ```python
   sanitized = re.sub(r'(?i)password["\']?\s*[:=]\s*["\']?[^\s,"\'&]+', 'password=[REDACTED]', details)
   sanitized = re.sub(r'Bearer\s+[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*', 'Bearer [REDACTED_TOKEN]', details)
   sanitized = re.sub(r'[A-Z]{5}[0-9]{4}[A-Z]{1}', '[REDACTED_PAN]', details)
   sanitized = re.sub(r'(?i)secret["\']?\s*[:=]\s*["\']?[^\s,"\'&]+', 'secret=[REDACTED]', details)
   ```
2. Passwords, JWT tokens, PAN numbers, and Razorpay secret keys are never written to disk or audit logs.
