# app/routes/settings.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.settings import MerchantSettings
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/v1/settings", tags=["Settings"])

class SettingsResponse(BaseModel):
    merchant_id: str
    default_threshold: int
    default_reorder_qty: int
    default_waste_pct: float
    safety_buffer_enabled: bool
    safety_buffer_pct: float
    operation_mode: str
    auto_deduct_on_order: bool
    email_notifications_enabled: bool
    email_address: Optional[str]
    shopify_sync_enabled: bool

    class Config:
        from_attributes = True

class SettingsUpdate(BaseModel):
    default_threshold: Optional[int] = None
    default_reorder_qty: Optional[int] = None
    default_waste_pct: Optional[float] = None
    safety_buffer_enabled: Optional[bool] = None
    safety_buffer_pct: Optional[float] = None
    operation_mode: Optional[str] = None
    auto_deduct_on_order: Optional[bool] = None
    email_notifications_enabled: Optional[bool] = None
    email_address: Optional[str] = None
    shopify_sync_enabled: Optional[bool] = None

def get_current_merchant():
    return "test-merchant-123"

@router.get("", response_model=SettingsResponse)
def get_settings(db: Session = Depends(get_db)):
    """Get merchant settings (create if not exists)"""
    merchant_id = get_current_merchant()
    
    settings = db.query(MerchantSettings).filter(
        MerchantSettings.merchant_id == merchant_id
    ).first()
    
    if not settings:
        # Create default settings
        settings = MerchantSettings(merchant_id=merchant_id)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    
    return settings

@router.patch("", response_model=SettingsResponse)
def update_settings( updates: SettingsUpdate, db: Session = Depends(get_db)):
    """Update merchant settings"""
    merchant_id = get_current_merchant()
    
    settings = db.query(MerchantSettings).filter(
        MerchantSettings.merchant_id == merchant_id
    ).first()
    
    if not settings:
        raise HTTPException(status_code=404, detail="Settings not found")
    
    # Update only provided fields
    update_data = updates.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(settings, field, value)
    
    db.commit()
    db.refresh(settings)
    return settings