from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    products,
    categories,
    orders,
    pricing,
    inventory,
    kyc,
    reports,
    audit,
    users,
    payments,
    notifications,
    addresses,
    claims,
    inquiries
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication & Profiles"])
api_router.include_router(products.router, prefix="/products", tags=["Product Catalog & Management"])
api_router.include_router(categories.router, prefix="/categories", tags=["Categories"])
api_router.include_router(orders.router, prefix="/orders", tags=["Orders & Invoicing"])
api_router.include_router(pricing.router, prefix="/pricing", tags=["Pricing Matrix"])
api_router.include_router(inventory.router, prefix="/inventory", tags=["Inventory & Batch Stock"])
api_router.include_router(kyc.router, prefix="/kyc", tags=["Distributor KYC Verification"])
api_router.include_router(reports.router, prefix="/reports", tags=["Analytics & Reports"])
api_router.include_router(audit.router, prefix="/audit", tags=["Compliance & Audit Logs"])
api_router.include_router(users.router, prefix="/users", tags=["Users & Role Administration"])
api_router.include_router(payments.router, prefix="/payments", tags=["Razorpay & Payments"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["SMS & Email Notifications"])
api_router.include_router(addresses.router, prefix="/addresses", tags=["Saved Delivery Addresses"])
api_router.include_router(claims.router, prefix="/claims", tags=["Retailer Returns & Claims"])
api_router.include_router(inquiries.router, prefix="/inquiries", tags=["Commercial Contact Inquiries"])



