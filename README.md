# PharmaLink Enterprise Application

PharmaLink Enterprise is a full-stack B2B Wholesale and B2C Retail Pharmaceutical Commerce & Supply Chain Platform built with **FastAPI (Python)** and **Next.js (React / TypeScript)**.

---

## 🌟 Key Features
- **Dynamic Role-Based Pricing**: Retail MRP vs. Verified Distributor Wholesale Price vs. Tiered Bulk MOQ Pricing.
- **Distributor Compliance & KYC**: GSTIN and Drug License validation workflow for B2B portal access.
- **Enterprise Security**: Short-lived JWT (15-min access tokens), RBAC authorization dependencies, IDOR/BOLA resource ownership checks, in-memory login rate limiting, and HMAC-SHA256 payment signature verification.
- **Order Fulfillment & Invoicing**: Real-time stock reservation, GST tax calculations, and automated digital invoice generation.

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
- API Base URL: `http://127.0.0.1:8000/api/v1`
- Swagger Docs: `http://127.0.0.1:8000/docs`

### 2. Run Automated Security & Integration Tests
```bash
cd backend
python tests/test_security_auth.py
python test_backend.py
python test_razorpay.py
```

### 3. Start Next.js Frontend
```bash
cd pharmachain-app
npm install
npm run dev
```
- Storefront & Portals: `http://localhost:3000`

---

## 🔑 Demo Login Accounts

- **Admin**: `admin@pharmalink.com` / `Admin@123`
- **Distributor**: `distributor@medplus.com` / `Dist@123`
- **Customer**: `customer@gmail.com` / `Cust@123`

---

## 📄 Complete Developer Guide
For full architecture diagrams, database schemas, directory layouts, and security documentation, check out [`DEVELOPER_GUIDE.md`](./DEVELOPER_GUIDE.md).
