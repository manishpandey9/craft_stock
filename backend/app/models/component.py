from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String, func
from enum import Enum

from app.core.database import Base


class ComponentType(str, Enum):
    """Component types for classification"""
    RAW_MATERIAL = "raw_material"
    PACKAGING = "packaging"
    INSERT = "insert"
    CONSUMABLE = "consumable"


class Component(Base):
    __tablename__ = "components"

    # Primary identifiers
    id = Column(Integer, primary_key=True, index=True)
    merchant_id = Column(String(255), nullable=False, index=True)  # Multi-tenant support
    
    # Component details
    name = Column(String(255), nullable=False, index=True)
    sku = Column(String(100), nullable=False, index=True)  # sku per merchant is unique
    component_type = Column(String(50), nullable=False, default=ComponentType.RAW_MATERIAL)
    unit = Column(String(30), nullable=False, default="piece")
    
    # Stock tracking
    on_hand = Column(Float, nullable=False, default=0.0)  # Physical quantity
    reserved = Column(Float, nullable=False, default=0.0)  # Reserved for orders
    available = Column(Float, nullable=False, default=0.0)  # on_hand - reserved
    cost_per_unit = Column(Float, nullable=False, default=0.0)  # Cost price for valuation
    
    # Inventory management
    threshold = Column(Float, nullable=False, default=0.0)  # Low stock threshold
    reorder_qty = Column(Float, nullable=True)  # Suggested reorder quantity
    
    # Supplier info
    supplier = Column(String(255), nullable=True)
    lead_time_days = Column(Integer, nullable=True)  # Supplier lead time
    
    # Additional info
    notes = Column(String(1000), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True, index=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )