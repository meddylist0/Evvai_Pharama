# 💊 PharmaLink Enterprise Application

![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Next.js 14](https://img.shields.io/badge/Frontend-Next.js%2014-000000?style=for-the-badge&logo=next.js&logoColor=white)
![Python 3.11+](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![SQLite / PostgreSQL](https://img.shields.io/badge/Database-SQLite%2FPostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Security Passed](https://img.shields.io/badge/Security_Audit-100%25_PASS-brightgreen?style=for-the-badge)

PharmaLink Enterprise is a full-stack B2B Wholesale and B2C Retail Pharmaceutical Commerce & Supply Chain Management Platform built with **FastAPI (Python)** and **Next.js 14 (React / TypeScript / TailwindCSS)**.

---

## 🌟 Key Features

- **🛍️ Dual B2B Wholesale & B2C Retail Storefront**: Seamless experience for end-consumers, verified distributors, and super-admins.
- **🏷️ Dynamic Role-Based Pricing**: Retail MRP vs. Verified Distributor Wholesale Price vs. Tiered Bulk MOQ Pricing.
- **📜 License Verification & KYC Workflow**: GSTIN and Drug License (Form 20B/21B) validation workflow for B2B portal access.
- **🔒 Enterprise Security Standard**:
  - Short-lived JWT (15-min access tokens) with secure HTTP-only cookies / authorization headers.
  - Granular RBAC authorization rules (`SUPER_ADMIN`, `DISTRIBUTOR`, `CUSTOMER`).
  - Strict IDOR/BOLA resource ownership validation.
  - In-memory rate limiting against brute-force attacks.
  - HMAC-SHA256 signature verification for Razorpay payment webhooks.
- **📦 Order Fulfillment & Automated Invoicing**: Real-time stock reservation lock, GST tax calculations, and digital invoice generation.
- **📊 Audit Logging & Compliance Reports**: Complete history tracking of administrative actions, user authentication, and inventory shifts.

---

## 🚀 Quick Start Guide

### 1. Start FastAPI Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
python run.py
```
- **API Base URL**: `http://127.0.0.1:8000/api/v1`
- **Swagger Interactive Docs**: `http://127.0.0.1:8000/docs`
- **ReDoc API Spec**: `http://127.0.0.1:8000/redoc`

### 2. Run Automated Test Suites

```bash
cd backend
python master_health_check.py
python release_health_check.py
python uat_acceptance_check.py
```

### 3. Start Next.js Frontend

```bash
cd pharmachain-app
npm install
npm run dev
```
- **Storefront & Portals**: `http://localhost:3000`

---

## 🔑 Demo Login Accounts

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@pharmalink.com` | `Admin@123` | Full System Control, Inventory & KYC Approvals |
| **Distributor** | `distributor@medplus.com` | `Dist@123` | B2B Wholesale Purchasing & Bulk Discounts |
| **Customer** | `customer@gmail.com` | `Cust@123` | B2C Retail Ordering |

---

## 📄 Complete Project Documentation

- [`API_DOCUMENTATION_AND_IMPLEMENTATION_GUIDE.md`](./API_DOCUMENTATION_AND_IMPLEMENTATION_GUIDE.md)
- [`PHARMALINK_ENTERPRISE_MASTER_DOCUMENTATION.md`](./PHARMALINK_ENTERPRISE_MASTER_DOCUMENTATION.md)
- [`TECHNICAL_ARCHITECTURE_AND_CODEBASE_SPEC.md`](./TECHNICAL_ARCHITECTURE_AND_CODEBASE_SPEC.md)
- [`PROJECT_COMPLETE_AUDIT_SUMMARY.md`](./PROJECT_COMPLETE_AUDIT_SUMMARY.md)
- [`PROJECT_COMPLETION_STATUS.md`](./PROJECT_COMPLETION_STATUS.md)

---
© 2026 PharmaLink Enterprise Platform. All rights reserved.
