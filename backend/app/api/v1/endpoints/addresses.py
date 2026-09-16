from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import get_current_user
from app.models.user import User, UserAddress
from app.schemas.user import AddressCreateRequest, AddressUpdateRequest, AddressOut
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/me", response_model=List[AddressOut])
def get_my_addresses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all saved addresses for the authenticated user."""
    addresses = (
        db.query(UserAddress)
        .filter(UserAddress.user_id == current_user.id)
        .order_by(UserAddress.is_default.desc(), UserAddress.created_at.desc())
        .all()
    )
    return addresses


@router.post("/", response_model=AddressOut, status_code=status.HTTP_201_CREATED)
def create_address(
    req: AddressCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new delivery address."""
    if req.is_default:
        db.query(UserAddress).filter(UserAddress.user_id == current_user.id).update({"is_default": False})

    existing_count = db.query(UserAddress).filter(UserAddress.user_id == current_user.id).count()
    is_default = req.is_default or (existing_count == 0)

    address = UserAddress(
        user_id=current_user.id,
        address_type=req.address_type.upper().strip(),
        recipient_name=req.recipient_name.strip(),
        phone=req.phone.strip(),
        street_address=req.street_address.strip(),
        city=req.city.strip(),
        state=req.state.strip(),
        pincode=req.pincode.strip(),
        is_default=is_default,
    )
    db.add(address)
    db.commit()
    db.refresh(address)
    return address


@router.put("/{address_id}", response_model=AddressOut)
def update_address(
    address_id: int,
    req: AddressUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an existing address."""
    address = (
        db.query(UserAddress)
        .filter(UserAddress.id == address_id, UserAddress.user_id == current_user.id)
        .first()
    )
    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Address not found or does not belong to you.",
        )

    if req.is_default:
        db.query(UserAddress).filter(UserAddress.user_id == current_user.id).update({"is_default": False})
        address.is_default = True
    elif req.is_default is False:
        address.is_default = False

    if req.address_type is not None:
        address.address_type = req.address_type.upper().strip()
    if req.recipient_name is not None:
        address.recipient_name = req.recipient_name.strip()
    if req.phone is not None:
        address.phone = req.phone.strip()
    if req.street_address is not None:
        address.street_address = req.street_address.strip()
    if req.city is not None:
        address.city = req.city.strip()
    if req.state is not None:
        address.state = req.state.strip()
    if req.pincode is not None:
        address.pincode = req.pincode.strip()

    db.commit()
    db.refresh(address)
    return address


@router.patch("/{address_id}/default", response_model=AddressOut)
def set_default_address(
    address_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Set an address as the default delivery address."""
    address = (
        db.query(UserAddress)
        .filter(UserAddress.id == address_id, UserAddress.user_id == current_user.id)
        .first()
    )
    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Address not found.",
        )

    db.query(UserAddress).filter(UserAddress.user_id == current_user.id).update({"is_default": False})
    address.is_default = True
    db.commit()
    db.refresh(address)
    return address


@router.delete("/{address_id}", status_code=status.HTTP_200_OK)
def delete_address(
    address_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a saved address."""
    address = (
        db.query(UserAddress)
        .filter(UserAddress.id == address_id, UserAddress.user_id == current_user.id)
        .first()
    )
    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Address not found.",
        )

    was_default = address.is_default
    db.delete(address)
    db.commit()

    if was_default:
        remaining = (
            db.query(UserAddress)
            .filter(UserAddress.user_id == current_user.id)
            .order_by(UserAddress.created_at.desc())
            .first()
        )
        if remaining:
            remaining.is_default = True
            db.commit()

    return {"message": "Address deleted successfully", "id": address_id}
