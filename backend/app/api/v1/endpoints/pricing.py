from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import require_admin
from app.models.user import User
from app.models.product import Product
from app.schemas.product import ProductPricingMatrixUpdate, ProductDynamicOut
from app.services.pricing_service import resolve_product_pricing
from app.services.audit_service import record_audit

router = APIRouter()


@router.put("/{product_id}", response_model=ProductDynamicOut)
def update_pricing_matrix(
    product_id: int,
    pricing_in: ProductPricingMatrixUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    for field, val in pricing_in.model_dump(exclude_unset=True).items():
        if val is not None:
            setattr(product, field, val)

    db.commit()
    db.refresh(product)

    record_audit(
        db=db,
        action="PRICING_MATRIX_UPDATED",
        module="PRICING",
        details=f"Updated pricing for '{product.name}': MRP={product.mrp}, Cust={product.customer_price}, Dist={product.distributor_price}, Bulk={product.bulk_price}",
        user=admin_user
    )

    return resolve_product_pricing(product, admin_user)
