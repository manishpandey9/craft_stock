# app/routes/risk.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.risk import calculate_product_risks
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/api/v1/risk", tags=["Product Risk"])

def get_current_merchant():
    return "test-merchant-123"

class RiskItemResponse(BaseModel):
    id: int
    title: str
    sku: str
    status: str
    can_make: int
    demand_estimate: int
    risk_pct: float
    bottleneck: str | None
    
    class Config:
        from_attributes = True

@router.get("/overview")
def get_risk_overview(db: Session = Depends(get_db)):
    merchant_id = get_current_merchant()
    
    raw_data = calculate_product_risks(merchant_id, db)
    
    # Format for response
    response_items = []
    for item in raw_data:
        response_items.append({
            "id": item["variant"].id,
            "title": item["variant"].title,
            "sku": item["variant"].sku or "N/A",
            "status": item["status"],
            "can_make": item["can_make"],
            "demand_estimate": item["demand_estimate"],
            "risk_pct": item["risk_pct"],
            "bottleneck": item["bottleneck"]
        })
        
    return {"products": response_items}