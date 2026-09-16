from typing import Optional
from app.models.user import User, UserRole
from app.models.product import Product
from app.schemas.product import ProductDynamicOut, CategoryOut, BatchOut
from app.core.permissions import check_distributor_kyc_approved


# ==============================================================================
# PHARMALINK ENTERPRISE — DYNAMIC ROLE-BASED PRICING MATRIX SERVICE
# ==============================================================================

def resolve_product_pricing(product: Product, current_user: Optional[User] = None) -> ProductDynamicOut:
    """
    Computes dynamic display price, role labels, and permitted B2B fields
    strictly according to role-based dynamic pricing rules.
    """
    is_admin = current_user is not None and current_user.role == UserRole.ADMIN
    is_approved_distributor = current_user is not None and check_distributor_kyc_approved(current_user)
    is_retailer = current_user is not None and current_user.role == UserRole.RETAILER
    
    if is_approved_distributor:
        # Verified B2B Distributors get lowest wholesale rates & bulk volume break points
        display_price = product.distributor_price
        role_label = "Distributor B2B Rate"
        distributor_price = product.distributor_price
        customer_price = product.customer_price
        bulk_price = product.bulk_price
        bulk_moq = product.bulk_moq
    elif is_retailer:
        # Verified Retailers / Pharmacies get Trade Price (PTR: Price to Retailer)
        # PTR is typically wholesale trade price between distributor rate and MRP
        ptr_rate = round(product.distributor_price * 1.12, 2) if product.distributor_price else product.customer_price
        display_price = min(ptr_rate, product.customer_price)
        role_label = "Retailer Trade Price (PTR)"
        distributor_price = None
        customer_price = product.customer_price
        bulk_price = product.distributor_price
        bulk_moq = 5  # MOQ of 5 packs for bulk retailer discount
    elif is_admin:
        # Admins view customer retail price by default but retain access to wholesale metrics
        display_price = product.customer_price
        role_label = "Retail Rate (Admin View)"
        distributor_price = product.distributor_price
        customer_price = product.customer_price
        bulk_price = product.bulk_price
        bulk_moq = product.bulk_moq
    else:
        # Retail Customers & Unauthenticated Guests: Hide wholesale fields to prevent price leakage
        display_price = product.customer_price
        role_label = "Retail Customer Price"
        distributor_price = None
        customer_price = product.customer_price
        bulk_price = None
        bulk_moq = None

    # Calculate discount percentage relative to MRP
    discount_pct = 0.0
    if product.mrp > 0 and display_price < product.mrp:
        discount_pct = round(((product.mrp - display_price) / product.mrp) * 100, 1)

    cat_out = CategoryOut.model_validate(product.category) if product.category else None

    return ProductDynamicOut(
        id=product.id,
        sku=product.sku,
        name=product.name,
        subtitle=product.subtitle,
        composition=product.composition,
        pack_size=product.pack_size,
        description=product.description,
        category=cat_out,
        category_name=product.category.name if product.category else "Pharmaceuticals",
        mrp=product.mrp,
        display_price=display_price,
        role_price_label=role_label,
        discount_percentage=discount_pct,
        gst_rate=product.gst_rate if getattr(product, 'gst_rate', None) is not None else 0.12,
        hsn_code=product.hsn_code if getattr(product, 'hsn_code', None) else "3004",
        distributor_price=distributor_price,
        customer_price=customer_price,
        bulk_price=bulk_price,
        bulk_moq=bulk_moq,
        stock=product.stock,
        in_stock=(product.stock > 0 and product.status == "active"),
        batch_no=product.batch_no,
        expiry_date=product.expiry_date,
        batches=[BatchOut.model_validate(b) for b in product.batches] if getattr(product, 'batches', None) else None,
        image=product.image,
        status=product.status
    )
