from typing import Optional
from app.models.user import User, UserRole
from app.models.product import Product
from app.schemas.product import ProductDynamicOut, CategoryOut


from app.core.permissions import check_distributor_kyc_approved


def resolve_product_pricing(product: Product, current_user: Optional[User] = None) -> ProductDynamicOut:
    """
    Computes dynamic display price, role labels, and permitted B2B fields
    strictly according to PRD Section 2.1 Role-Based Dynamic Pricing rules.
    Distributor pricing requires an APPROVED KYC status.
    """
    is_admin = current_user is not None and current_user.role == UserRole.ADMIN
    is_approved_distributor = current_user is not None and check_distributor_kyc_approved(current_user)
    
    if is_approved_distributor:
        display_price = product.distributor_price
        role_label = "Distributor B2B Rate"
        distributor_price = product.distributor_price
        customer_price = None
        bulk_price = product.bulk_price
        bulk_moq = product.bulk_moq
    elif is_admin:
        display_price = product.customer_price
        role_label = "Retail Rate (Admin View)"
        distributor_price = product.distributor_price
        customer_price = product.customer_price
        bulk_price = product.bulk_price
        bulk_moq = product.bulk_moq
    else:
        # Default / Retail Customer / Guest
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
        image=product.image,
        status=product.status
    )

