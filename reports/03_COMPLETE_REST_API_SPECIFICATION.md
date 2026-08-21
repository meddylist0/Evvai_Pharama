# 📑 PHARMALINK ENTERPRISE
## Volume 3 — Complete REST API Specification

**Document Reference**: `PHARMALINK-DOC-03-API`  
**Document Classification**: Enterprise Confidential  
**Document Type**: API Reference Specification & Interface Control Document  
**Version**: 1.0  
**Status**: Approved / Engineering Handover  
**Base Path**: `/api/v1`  
**Data Interchange Format**: `application/json`

---

## 1. Document Purpose

This document provides the complete, un-truncated REST API specification for all 28 REST endpoints implemented across the PharmaLink Enterprise platform.

Each API endpoint specification defines:
- HTTP Method & Path
- Authentication & Authorization Level
- Request Headers & Query Parameters
- Request JSON Body Schema with examples
- Successful Response JSON Schema (200 OK / 201 Created) with examples
- Error Responses (400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 429 Too Many Requests, 422 Validation Error)

---

## 2. Global Headers & Error Schemas

### Standard Authorization Header
For all protected endpoints, the client must include the JWT access token in the standard HTTP `Authorization` header:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Standard Error Response Format
All error responses adhere to the standard FastAPI error format:
```json
{
  "detail": "Error description message"
}
```

---

## 3. Exhaustive REST API Endpoints Reference

---

### 3.1 Authentication Domain (`/api/v1/auth`)

#### 1. `POST /api/v1/auth/login`
- **Description**: Authenticates user email and password against Bcrypt database hashes, evaluates rate limiting, and issues a 15-minute JWT access token.
- **Auth Requirement**: Public (Rate Limited: 5 failed attempts / 60s per IP/Email)
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
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwicm9sZSI6IkFETUlOIn0...",
    "token_type": "bearer",
    "role": "ADMIN",
    "user_id": 1,
    "full_name": "Dr. Arun Bhairi",
    "email": "admin@pharmalink.com",
    "kyc_status": null,
    "avatar": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200"
  }
  ```
- **Errors**:
  - `401 Unauthorized`: `{"detail": "Incorrect email or password"}`
  - `429 Too Many Requests`: `{"detail": "Too many failed login attempts. Please try again after 60 seconds."}`

---

#### 2. `POST /api/v1/auth/register-customer`
- **Description**: Registers a new retail B2C customer account and profile in a single atomic database transaction.
- **Auth Requirement**: Public
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
- **Response (200 OK)**:
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1Ni...",
    "token_type": "bearer",
    "role": "CUSTOMER",
    "user_id": 3,
    "full_name": "Kavita Reddy",
    "email": "customer@gmail.com",
    "kyc_status": null,
    "avatar": null
  }
  ```
- **Errors**: `400 Bad Request` ("Email already registered").

---

#### 3. `POST /api/v1/auth/register-distributor`
- **Description**: Registers a new B2B distributor account, creates a company profile, and initiates a `PENDING` KYC record in an atomic transaction.
- **Auth Requirement**: Public
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
- **Response (200 OK)**:
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1Ni...",
    "token_type": "bearer",
    "role": "DISTRIBUTOR",
    "user_id": 2,
    "full_name": "Rajesh Kumar",
    "email": "distributor@medplus.com",
    "kyc_status": "PENDING",
    "avatar": null
  }
  ```

---

#### 4. `GET /api/v1/auth/me`
- **Description**: Returns detailed profile information for the authenticated token holder.
- **Auth Requirement**: Authenticated (`get_current_user`)
- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**:
  ```json
  {
    "id": 1,
    "email": "admin@pharmalink.com",
    "full_name": "Dr. Arun Bhairi",
    "phone": "+91 9123456789",
    "role": "ADMIN",
    "is_active": true,
    "is_verified": true,
    "avatar": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde...",
    "customer_profile": null,
    "distributor_profile": null,
    "created_at": "2026-08-19T05:00:00Z"
  }
  ```

---

#### 5. `PUT /api/v1/auth/profile`
- **Description**: Updates profile fields (full name, phone, company name, avatar URL) for the requesting user.
- **Auth Requirement**: Authenticated (`get_current_user`)
- **Request Body**:
  ```json
  {
    "full_name": "Dr. Arun Bhairi, Ph.D.",
    "phone": "+91 9123456789",
    "avatar": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200"
  }
  ```
- **Response (200 OK)**: Returns updated `UserOut` schema.

---

### 3.2 Products & Taxonomy Domain (`/api/v1/products`, `/api/v1/categories`)

#### 6. `GET /api/v1/products`
- **Description**: Retrieves formulation catalog. Automatically calculates role-based dynamic prices based on token role.
- **Auth Requirement**: Optional Bearer Token (`get_current_user_optional`)
- **Query Parameters**:
  - `category_slug` (string, optional): Filter by therapeutic category slug.
  - `search` (string, optional): Search by product name, composition, SKU, or brand.
  - `include_disabled` (boolean, default `false`): Include disabled SKUs (Admin only).
- **Response (200 OK)**:
  ```json
  [
    {
      "id": 1,
      "sku": "EVV-ZEN-001",
      "name": "Zene Melatonin Oral Spray",
      "composition": "Melatonin 5mg + Vitamin B6 1.5mg",
      "pack_size": "30ml Spray Bottle",
      "mrp": 395.0,
      "customer_price": 395.0,
      "distributor_price": 300.0,
      "bulk_price": 250.0,
      "bulk_moq": 40,
      "stock": 450,
      "reserved_stock": 20,
      "batch_no": "BN-ZEN-2026-01",
      "expiry_date": "2028-06-30",
      "display_price": 300.0,
      "category_id": 1,
      "status": "active"
    }
  ]
  ```

---

#### 7. `GET /api/v1/products/{product_id}`
- **Description**: Retrieves single formulation detail by ID.
- **Auth Requirement**: Optional Bearer Token (`get_current_user_optional`)
- **Response (200 OK)**: Single `ProductItem` object.
- **Errors**: `404 Not Found` ("Product not found").

---

#### 8. `POST /api/v1/products`
- **Description**: Creates a new formulation product in catalog.
- **Auth Requirement**: Admin Only (`require_admin`)
- **Request Body**:
  ```json
  {
    "sku": "EVV-AZI-500",
    "name": "Azithromycin 500mg Tablets",
    "composition": "Azithromycin IP 500mg",
    "pack_size": "10x3 Strip Pack",
    "mrp": 120.0,
    "customer_price": 110.0,
    "distributor_price": 85.0,
    "bulk_price": 75.0,
    "bulk_moq": 100,
    "stock": 1000,
    "batch_no": "AZI-2026-08",
    "expiry_date": "2028-12-31",
    "category_id": 2
  }
  ```
- **Response (200 OK)**: Returns created `ProductItem`.

---

#### 9. `PUT /api/v1/products/{product_id}`
- **Description**: Updates product details, prices, or batch details.
- **Auth Requirement**: Admin Only (`require_admin`)
- **Response (200 OK)**: Returns updated `ProductItem`.

---

#### 10. `DELETE /api/v1/products/{product_id}`
- **Description**: Deletes or disables a product SKU.
- **Auth Requirement**: Admin Only (`require_admin`)
- **Response (200 OK)**: `{"detail": "Product deleted successfully"}`.

---

#### 11. `POST /api/v1/products/{product_id}/adjust-stock`
- **Description**: Adjusts batch stock inventory with audit reason logging.
- **Auth Requirement**: Admin Only (`require_admin`)
- **Request Body**:
  ```json
  {
    "adjustment": 500,
    "reason": "New Warehouse Batch Receipt"
  }
  ```
- **Response (200 OK)**: Returns updated `ProductItem`.

---

#### 12. `GET /api/v1/categories`
- **Description**: Lists all therapeutic category taxonomies.
- **Auth Requirement**: Public
- **Response (200 OK)**: Array of `CategoryOut` items (`id`, `name`, `slug`, `description`).

---

#### 13. `POST /api/v1/categories`
- **Description**: Creates a new therapeutic category.
- **Auth Requirement**: Admin Only (`require_admin`)
- **Response (200 OK)**: Created `CategoryOut`.

---

### 3.3 Orders & Fulfillment Domain (`/api/v1/orders`)

#### 14. `POST /api/v1/orders`
- **Description**: Places an order, calculates unit prices based on user role and MOQ, locks product rows, deducts stock, calculates 12% GST, and generates invoice.
- **Auth Requirement**: Authenticated User (`get_current_user`)
- **Request Body**:
  ```json
  {
    "items": [
      { "product_id": 1, "quantity": 10 }
    ],
    "customer_name": "Kavita Reddy",
    "customer_phone": "+91 9988776655",
    "delivery_address": "Flat 402, Green Meadows",
    "delivery_city": "Hyderabad",
    "delivery_state": "Telangana",
    "delivery_pincode": "500081",
    "payment_method": "UPI"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "id": 1,
    "order_code": "ORD-260819-8773",
    "user_id": 3,
    "role": "CUSTOMER",
    "subtotal": 3950.0,
    "tax_amount": 474.0,
    "shipping_charge": 0.0,
    "total_amount": 4424.0,
    "order_status": "Pending",
    "payment_status": "Pending",
    "invoice_number": "INV-EVV-202608-6800",
    "created_at": "2026-08-19T10:00:00Z",
    "items": [
      {
        "id": 1,
        "product_id": 1,
        "product_name": "Zene Melatonin Oral Spray",
        "unit_price": 395.0,
        "quantity": 10,
        "total_price": 3950.0
      }
    ]
  }
  ```

---

#### 15. `GET /api/v1/orders/my-orders`
- **Description**: Retrieves all purchase orders created by the authenticated user.
- **Auth Requirement**: Authenticated User (`get_current_user`)
- **Response (200 OK)**: Array of `OrderOut` objects.

---

#### 16. `GET /api/v1/orders/admin/all`
- **Description**: Retrieves all system orders across all customers and distributors.
- **Auth Requirement**: Admin Only (`require_admin`)
- **Query Parameters**: `order_status` (optional), `search` (optional)
- **Response (200 OK)**: Array of `OrderOut` objects.

---

#### 17. `GET /api/v1/orders/{order_id}`
- **Description**: Retrieves order details by ID. Enforces strict IDOR ownership protection.
- **Auth Requirement**: Authenticated User (`get_current_user`)
- **IDOR Rule**: Granted if `current_user.id == order.user_id` OR `current_user.role == "ADMIN"`.
- **Errors**: `403 Forbidden` ("Access denied: You do not own this order").

---

#### 18. `PATCH /api/v1/orders/{order_id}/status`
- **Description**: Updates order fulfillment status (`Pending` ➔ `Confirmed` ➔ `Packed` ➔ `Shipped` ➔ `Delivered` ➔ `Cancelled`).
- **Auth Requirement**: Admin Only (`require_admin`)
- **Request Body**:
  ```json
  {
    "order_status": "Shipped",
    "tracking_number": "TRK99887766"
  }
  ```
- **Response (200 OK)**: Updated `OrderOut`.

---

#### 19. `GET /api/v1/orders/{order_id}/invoice`
- **Description**: Generates and retrieves official Tax Invoice metadata with GSTIN and HSN breakdowns. Enforces IDOR check.
- **Auth Requirement**: Authenticated User (`get_current_user`)
- **Errors**: `403 Forbidden`.

---

### 3.4 Distributor KYC Domain (`/api/v1/kyc`)

#### 20. `POST /api/v1/kyc/submit`
- **Description**: Submits or re-submits distributor Drug License and GSTIN for compliance verification.
- **Auth Requirement**: Distributor Only (`require_distributor`)
- **Request Body**:
  ```json
  {
    "gst_number": "36AAACR1234F1Z0",
    "drug_license_no": "TS/HYD/2026/8899",
    "pan_number": "ABCDE1234F",
    "document_file_url": "https://pharmalink.storage/dl_8899.pdf"
  }
  ```
- **Response (200 OK)**: `{"detail": "KYC submitted successfully", "kyc_status": "PENDING"}`.

---

#### 21. `GET /api/v1/kyc/pending`
- **Description**: Lists all distributor KYC submissions awaiting admin verification.
- **Auth Requirement**: Admin Only (`require_admin`)
- **Response (200 OK)**: Array of `KYCOut` objects.

---

#### 22. `GET /api/v1/kyc/my-status`
- **Description**: Retrieves KYC submission and verification status for current distributor.
- **Auth Requirement**: Distributor Only (`require_distributor`)

---

#### 23. `POST /api/v1/kyc/{submission_id}/review`
- **Description**: Approves or rejects a distributor KYC submission. If approved, marks `distributor.user.is_verified = True`.
- **Auth Requirement**: Admin Only (`require_admin`)
- **Request Body**:
  ```json
  {
    "status": "APPROVED",
    "admin_remarks": "Verified Drug License via DCA Portal."
  }
  ```
- **Response (200 OK)**: `{"detail": "KYC status updated successfully"}`.

---

### 3.5 Payments & Gateway Domain (`/api/v1/payments`)

#### 24. `GET /api/v1/payments/config`
- **Description**: Returns public configuration for Razorpay Key ID and active gateway status.
- **Auth Requirement**: Public
- **Response (200 OK)**:
  ```json
  {
    "key_id": "rzp_test_Bvq9kiuaq8gkcs",
    "is_active": true,
    "mode": "test",
    "currency": "INR",
    "cod_enabled": true
  }
  ```

---

#### 25. `POST /api/v1/payments/create-razorpay-order`
- **Description**: Interacts with Razorpay API to generate a gateway order ID.
- **Auth Requirement**: Authenticated (`get_current_user`)
- **Request Body**: `{"amount": 4424.0, "currency": "INR"}`
- **Response (200 OK)**: `{"razorpay_order_id": "order_KzX998877", "amount": 4424.0}`.

---

#### 26. `POST /api/v1/payments/verify-and-order`
- **Description**: Cryptographically verifies HMAC-SHA256 signature (`razorpay_signature`) sent from checkout JS widget and creates paid order.
- **Auth Requirement**: Authenticated (`get_current_user`)
- **Request Body**:
  ```json
  {
    "razorpay_payment_id": "pay_KzX112233",
    "razorpay_order_id": "order_KzX998877",
    "razorpay_signature": "e5d12a9...",
    "order_data": { ... }
  }
  ```
- **Response (200 OK)**: Created `OrderOut` with `payment_status: "Paid"`.

---

#### 27. `GET /api/v1/payments/admin/settings` & `PUT /api/v1/payments/admin/settings`
- **Description**: Manages Razorpay credentials (secrets masked in responses), gateway mode, and COD availability.
- **Auth Requirement**: Admin Only (`require_admin`)

---

### 3.6 Reporting & Analytics Domain (`/api/v1/reports`)

#### 28. `GET /api/v1/reports/dashboard`
- **Description**: Executive dashboard metrics (sales today, total revenue, pending orders, low stock warnings, KYC queue count).
- **Auth Requirement**: Admin Only (`require_admin`)
- **Response (200 OK)**:
  ```json
  {
    "total_sales": 68749.2,
    "sales_today": 4424.0,
    "total_orders": 12,
    "pending_orders": 3,
    "total_products": 28,
    "low_stock_products": 2,
    "pending_kyc_count": 0
  }
  ```

---

#### 29. `GET /api/v1/reports/commercial-analytics`
- **Description**: Breakdown of B2B Wholesale vs Retail Direct revenue and transaction analytics.
- **Auth Requirement**: Admin Only (`require_admin`)

---

### 3.7 Security Audit Domain (`/api/v1/audit`)

#### 30. `GET /api/v1/audit`
- **Description**: System audit trail of security events, profile updates, and operational actions. All sensitive values (passwords, tokens, PANs) are automatically redacted.
- **Auth Requirement**: Admin Only (`require_admin`)
- **Response (200 OK)**: Array of `AuditLogOut` records.

---

### 3.8 User Accounts Domain (`/api/v1/users`)

#### 31. `GET /api/v1/users`
- **Description**: Lists all registered accounts with order counts and spend metrics.
- **Auth Requirement**: Admin Only (`require_admin`)

---

#### 32. `POST /api/v1/users`
- **Description**: Creates a staff or user account directly from Admin console.
- **Auth Requirement**: Admin Only (`require_admin`)

---

#### 33. `PATCH /api/v1/users/{user_id}/toggle-status`
- **Description**: Activates or deactivates a user account.
- **Auth Requirement**: Admin Only (`require_admin`)
- **Response (200 OK)**: `{"detail": "User status toggled successfully", "is_active": false}`.
