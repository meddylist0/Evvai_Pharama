# 🛠️ PHARMALINK ENTERPRISE
## Volume 5 — Step-by-Step Implementation & Developer Guide

**Document Reference**: `PHARMALINK-DOC-05-DEV`  
**Document Classification**: Enterprise Confidential  
**Document Type**: Developer Operations & Engineering Onboarding Manual  
**Version**: 1.0  
**Status**: Approved / Engineering Handover  
**Target Audience**: Software Engineers, Frontend/Backend Developers, QA Engineers, DevOps

---

## 1. Document Purpose

This document serves as the primary engineering onboarding reference for developers working on the PharmaLink Enterprise codebase.

It provides step-by-step guidance for local environment configuration, application execution, automated test execution, core feature implementation mechanics, and developer golden rules.

---

## 2. Technology Stack & Prerequisites

### Technology Stack
- **Backend**: Python 3.11+, FastAPI, SQLAlchemy 2.0+, PyJWT, Passlib (Bcrypt), SQLite (`pharmalink.db`), Uvicorn
- **Frontend**: Node.js 18+, Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4
- **Testing**: Pytest, FastAPI TestClient, Unittest
- **Payment Integration**: Razorpay API & Checkout JS SDK

---

## 3. Local Environment Setup

### 3.1 Backend Setup (FastAPI)
```bash
# 1. Navigate to backend directory
cd backend

# 2. Create & activate virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# 3. Install backend dependencies
pip install -r requirements.txt

# 4. Copy environment configuration
cp .env.example .env

# 5. Initialize database seed data
python -c "from app.seeds.seed_data import seed_database; seed_database()"

# 6. Start Uvicorn development server
python run.py
# Server running at: http://127.0.0.1:8000
# OpenAPI Docs: http://127.0.0.1:8000/docs
```

### 3.2 Running Automated Test Suites
```bash
cd backend

# Execute 26 Automated Security Tests
python tests/test_security_auth.py

# Execute Backend Workflow Integration Tests
python test_backend.py

# Execute Razorpay HMAC Signature Tests
python test_razorpay.py
```

### 3.3 Frontend Setup (Next.js 15)
```bash
# 1. Navigate to frontend directory
cd pharmachain-app

# 2. Install Node dependencies
npm install

# 3. Launch Next.js development server
npm run dev
# Application running at: http://localhost:3000
```

---

## 4. Feature Implementation Mechanics

### 4.1 Atomic Multi-Model Transactions
Registrations spanning multiple database models (e.g. `User` + `DistributorProfile` + `DistributorKYC`) use explicit single-transaction flushing:

```python
# app/api/v1/endpoints/auth.py
try:
    user = User(email=data.email, role=UserRole.DISTRIBUTOR, ...)
    db.add(user)
    db.flush()  # Obtains user.id

    profile = DistributorProfile(user_id=user.id, gstin=data.gstin, ...)
    db.add(profile)
    db.flush()  # Obtains profile.id

    kyc = DistributorKYC(distributor_id=profile.id, verification_status="PENDING", ...)
    db.add(kyc)

    record_audit(db=db, action="DISTRIBUTOR_REGISTER", module="AUTH", user=user)
    db.commit()     # Single atomic commit
    db.refresh(user)
except Exception:
    db.rollback()   # Complete rollback on failure
    raise
```

---

### 4.2 Dynamic Pricing Logic
In `GET /api/v1/products`, the backend checks the requesting user role:
- If user is `None` or role is `CUSTOMER`:
  - `display_price = mrp or customer_price`
  - `distributor_price = None`, `bulk_price = None` (hidden from response)
- If user role is `DISTRIBUTOR`:
  - `display_price = distributor_price`
  - `distributor_price` and `bulk_price` are exposed.

---

### 4.3 Automatic SQLite Schema Sync
`sync_db_schema()` in `app/core/database.py` executes on startup:
```python
def sync_db_schema():
    Base.metadata.create_all(bind=engine)
    inspector = inspect(engine)
    with engine.connect() as conn:
        for table_name, table in Base.metadata.tables.items():
            if inspector.has_table(table_name):
                existing_cols = {col["name"] for col in inspector.get_columns(table_name)}
                for column in table.columns:
                    if column.name not in existing_cols:
                        col_type = column.type.compile(engine.dialect)
                        conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column.name} {col_type}"))
                        conn.commit()
```
This ensures new columns (e.g. `avatar` on `User`) are added automatically on startup without resetting database tables.

---

## 5. Developer Golden Rules

1. **Production Secret Key**: Never check in production secrets. Always populate `SECRET_KEY` in production `.env` (minimum 32 characters).
2. **Generic Auth Errors**: Always return generic `HTTP 401` ("Incorrect email or password") to prevent user enumeration.
3. **Server-Side Authorization**: Never rely on frontend routing or local storage for authorization; guard endpoints with backend dependencies (`require_admin`, `require_distributor`).
4. **Audit Redaction**: Log operational actions using `record_audit()`. Sensitive parameters are automatically redacted.
