# 🔐 PHARMALINK ENTERPRISE
## Volume 4 — Enterprise Security & Compliance Audit

**Document Reference**: `PHARMALINK-DOC-04-SEC`  
**Document Classification**: Enterprise Confidential  
**Document Type**: Security Architecture & Audit Report  
**Version**: 1.0  
**Status**: Approved / Engineering Handover  
**Security Status**: **26 / 26 Automated Security Tests Passed (100% Verified)**

---

## 1. Document Purpose

This document records the security architecture, security controls, threat mitigation, and automated security test suite execution results for the PharmaLink Enterprise platform.

---

## 2. Executive Security Summary

PharmaLink Enterprise underwent a comprehensive security hardening pass. The platform implements defense-in-depth across authentication, authorization, resource ownership checks, rate limiting, and sensitive data sanitization.

### Security Accomplishments:
- **Zero Hardcoded Secrets**: All Razorpay secrets, JWT secret keys, and passwords were removed from source code and test files.
- **Short-Lived Access Tokens**: Configured 15-minute JWT access token lifetime (`ACCESS_TOKEN_EXPIRE_MINUTES=15`).
- **Database-Backed RBAC**: Role validation explicitly queries authoritative database user roles (`UserRole`), rejecting unverified claims or frontend local storage assertions.
- **IDOR / BOLA Protection**: Order details and invoice endpoints enforce strict resource ownership checks (`current_user.id == order.user_id`).
- **Brute-Force Protection**: Login rate limiter blocks excessive failed login attempts (5 failures / 60s per IP/email), returning `HTTP 429`.
- **Sensitive Data Redaction**: Automatic Regex filter redacts passwords, tokens, PAN numbers, and secrets from audit logs.
- **26/26 Security Tests Passed**: All automated security test assertions pass cleanly with exit code 0.

---

## 3. Automated Security Test Suite Matrix (26/26 Passed)

### Test Execution Command
```bash
python backend/tests/test_security_auth.py
```

### Verification Matrix

| Test ID | Security Scenario | Executed Assertion | Result |
| :--- | :--- | :--- | :--- |
| **`test_01`** | Valid Login Credentials | Returns HTTP 200 OK + Valid JWT Access Token | **PASS** |
| **`test_02`** | Incorrect Password | Returns generic HTTP 401 ("Incorrect email or password") | **PASS** |
| **`test_03`** | Non-existent Email Login | Returns identical generic HTTP 401 (Prevents account enumeration) | **PASS** |
| **`test_04`** | Expired JWT Access Token | Returns HTTP 401 ("Could not validate credentials") | **PASS** |
| **`test_05`** | Malformed JWT String | Returns HTTP 401 ("Could not validate credentials") | **PASS** |
| **`test_06`** | Invalid Signature Key | Returns HTTP 401 ("Could not validate credentials") | **PASS** |
| **`test_07`** | Missing Authorization Header | Returns HTTP 401 Unauthorized | **PASS** |
| **`test_08`** | Malformed Non-numeric `sub` Claim | Returns HTTP 401 safely without HTTP 500 crashes | **PASS** |
| **`test_09`** | Non-existent User ID in JWT | Returns HTTP 401 Unauthorized | **PASS** |
| **`test_10`** | Deactivated User Account | Blocks authentication with HTTP 401 | **PASS** |
| **`test_11`** | Customer Accessing Admin Orders | Returns HTTP 403 Forbidden | **PASS** |
| **`test_12`** | Distributor Accessing Admin Users | Returns HTTP 403 Forbidden | **PASS** |
| **`test_13`** | Admin Accessing Admin Dashboard | Returns HTTP 200 OK | **PASS** |
| **`test_14`** | Customer Token Accessing Customer Orders | Returns HTTP 200 OK | **PASS** |
| **`test_15`** | Distributor Accessing Catalog | Returns HTTP 200 OK | **PASS** |
| **`test_16`** | Optional Auth (No Token) | Resolves `get_current_user_optional` to `None` | **PASS** |
| **`test_17`** | Optional Auth (Malformed Token) | Resolves `get_current_user_optional` to `None` without HTTP 500 | **PASS** |
| **`test_18`** | Password Hashing Safety | Hashes passwords using Bcrypt (`$2b$`) | **PASS** |
| **`test_19`** | Audit Log Data Sanitization | Redacts passwords, JWTs, PAN numbers, and secrets | **PASS** |
| **`test_20`** | Malformed Inputs SQLi/XSS | Returns HTTP 401/422; zero 500 error leaks | **PASS** |
| **`test_21`** | Login Rate Limiting (5 failures) | 6th failed attempt returns HTTP 429 Too Many Requests | **PASS** |
| **`test_22`** | IDOR: Customer A ➔ Customer B Order | Returns HTTP 403 Forbidden | **PASS** |
| **`test_23`** | IDOR: Customer A ➔ Customer B Invoice | Returns HTTP 403 Forbidden | **PASS** |
| **`test_24`** | BOLA: Customer ➔ Admin KYC Pending | Returns HTTP 403 Forbidden | **PASS** |
| **`test_25`** | BOLA: Distributor ➔ Admin KYC Review | Returns HTTP 403 Forbidden | **PASS** |
| **`test_26`** | BOLA: Customer ➔ Admin Toggle Status | Returns HTTP 403 Forbidden | **PASS** |

---

## 4. Cryptographic HMAC Signature Verification

Payment signatures received from Razorpay checkout widgets are validated using python `hmac` and SHA256 before persisting paid orders:

```python
# app/services/payment_service.py
def verify_razorpay_signature(key_secret: str, order_id: str, payment_id: str, signature: str) -> bool:
    msg = f"{order_id}|{payment_id}"
    generated_sig = hmac.new(
        key_secret.encode("utf-8"),
        msg.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(generated_sig, signature)
```

---

## 5. Audit Log Redaction Engine

Sensitive parameters (passwords, JWT bearer tokens, PAN numbers, and API secrets) are automatically sanitized before saving to the audit database:

```python
# app/services/audit_service.py
def sanitize_audit_details(details: Optional[str]) -> Optional[str]:
    if not details:
        return details
    sanitized = details
    sanitized = re.sub(r'(?i)password["\']?\s*[:=]\s*["\']?[^\s,"\'&]+', 'password=[REDACTED]', sanitized)
    sanitized = re.sub(r'Bearer\s+[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*', 'Bearer [REDACTED_TOKEN]', sanitized)
    sanitized = re.sub(r'[A-Z]{5}[0-9]{4}[A-Z]{1}', '[REDACTED_PAN]', sanitized)
    sanitized = re.sub(r'(?i)secret["\']?\s*[:=]\s*["\']?[^\s,"\'&]+', 'secret=[REDACTED]', sanitized)
    return sanitized
```
