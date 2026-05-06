# app/models/settings.py
from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, JSON
from sqlalchemy.sql import func
from app.core.database import Base

class MerchantSettings(Base):
    __tablename__ = "merchant_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    merchant_id = Column(String, unique=True, nullable=False, index=True)
    
    # Stock Management
    default_threshold = Column(Integer, default=10)
    default_reorder_qty = Column(Integer, default=50)
    default_waste_pct = Column(Float, default=0.0)
    safety_buffer_enabled = Column(Boolean, default=True)
    safety_buffer_pct = Column(Float, default=5.0)  # 5% buffer
    
    # Operation Mode
    operation_mode = Column(String, default="advisory")  # "advisory" or "mirror"
    auto_deduct_on_order = Column(Boolean, default=False)
    
    # Notifications
    email_notifications_enabled = Column(Boolean, default=True)
    email_address = Column(String, nullable=True)
    low_stock_email_threshold = Column(Integer, default=20)
    
    # Shopify Integration
    shopify_sync_enabled = Column(Boolean, default=False)
    shopify_last_sync = Column(DateTime(timezone=True), nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Additional settings as JSON
    custom_settings = Column(JSON, nullable=True)