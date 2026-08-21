from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import require_admin
from app.models.user import User
from app.models.product import Product
from app.schemas.product import ProductDynamicOut, StockAdjustRequest
from app.services.pricing_service import resolve_product_pricing

router = APIRouter()


@router.get("", response_model=List[ProductDynamicOut])
def get_inventory_status(
    low_stock_only: bool = Query(False, description="Filter for products at or below low-stock threshold"),
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    query = db.query(Product)
    if low_stock_only:
        query = query.filter(Product.stock <= Product.low_stock_threshold)
    products = query.order_by(Product.stock.asc()).all()
    return [resolve_product_pricing(p, admin_user) for p in products]
