# app/schemas/bom.py
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class BOMLineCreate(BaseModel):
    component_id: int
    qty_per_unit: float = Field(..., gt=0)
    waste_pct: float = Field(default=0.0, ge=0)
    notes: Optional[str] = None

class BOMLineResponse(BOMLineCreate):
    id: int
    bom_id: int
    created_at: datetime

class BOMCreate(BaseModel):
    variant_id: int
    lines: List[BOMLineCreate]

class BOMLineUpdate(BaseModel):
    qty_per_unit: Optional[float] = Field(None, gt=0)
    waste_pct: Optional[float] = Field(None, ge=0)
    notes: Optional[str] = None

class BOMResponse(BaseModel):
    id: int
    variant_id: int
    is_active: bool
    version: int
    lines: List[BOMLineResponse]
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True