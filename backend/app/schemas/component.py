# app/schemas/component.py
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum

class ComponentType(str, Enum):
    RAW_MATERIAL = "raw_material"
    PACKAGING = "packaging"
    INSERT = "insert"
    CONSUMABLE = "consumable"

class ComponentBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    sku: Optional[str] = Field(None, max_length=100)
    component_type: ComponentType = ComponentType.RAW_MATERIAL
    unit: str = Field(default="piece", description="piece, gram, ml, meter")
    threshold: float = Field(default=0.0, ge=0)
    reorder_qty: Optional[float] = Field(None, ge=0)
    supplier: Optional[str] = Field(None, max_length=255)
    lead_time_days: Optional[int] = Field(None, ge=0)
    notes: Optional[str] = None

class ComponentCreate(ComponentBase):
    on_hand: float = Field(default=0.0, ge=0)

class ComponentUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    sku: Optional[str] = Field(None, max_length=100)
    component_type: Optional[ComponentType] = None
    unit: Optional[str] = None
    on_hand: Optional[float] = Field(None, ge=0)
    threshold: Optional[float] = Field(None, ge=0)
    reorder_qty: Optional[float] = Field(None, ge=0)
    supplier: Optional[str] = Field(None, max_length=255)
    lead_time_days: Optional[int] = Field(None, ge=0)
    notes: Optional[str] = None
    is_active: Optional[bool] = None

class ComponentResponse(ComponentBase):
    id: int
    merchant_id: str
    on_hand: float
    reserved: float
    available: float
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class StockAdjustment(BaseModel):
    quantity: float
    reason: str  # receiving, damage, spoilage, testing, correction, other
    notes: Optional[str] = None