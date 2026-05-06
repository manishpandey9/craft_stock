# app/services/risk.py
from sqlalchemy.orm import Session
from app.models.bom import ShopifyVariant, BOM, BOMLine
from app.models.component import Component
from typing import List, Dict
from pydantic import BaseModel

class ProductRisk(BaseModel):
    id: int
    shopify_variant_id: str
    title: str
    sku: str
    status: str  # "safe", "at_risk", "out_of_stock"
    can_make: int
    demand_estimate: int  # Just a placeholder for demo
    risk_percentage: float
    bottleneck_component: str | None
    bottleneck_stock: float | None

def calculate_product_risks(merchant_id: str, db: Session) -> List[Dict]:
    """
    Analyzes all variants with BOMs to find at-risk products.
    """
    results = []
    
    # Get all active variants for merchant
    variants = db.query(ShopifyVariant).filter(
        ShopifyVariant.merchant_id == merchant_id,
        ShopifyVariant.is_active == True
    ).all()
    
    for variant in variants:
        # Get active BOM
        bom = db.query(BOM).filter(
            BOM.variant_id == variant.id,
            BOM.is_active == True
        ).first()
        
        if not bom:
            continue
            
        # Calculate capacity based on components
        lines = db.query(BOMLine).filter(BOMLine.bom_id == bom.id).all()
        
        min_capacity = float('inf')
        bottleneck = None
        bottleneck_stock = None
        
        for line in lines:
            component = db.query(Component).filter(Component.id == line.component_id).first()
            if not component:
                continue
                
            waste_multiplier = 1 + ((line.waste_pct or 0) / 100)
            required_per_unit = line.qty_per_unit * waste_multiplier
            
            if required_per_unit > 0:
                capacity = component.available / required_per_unit
                if capacity < min_capacity:
                    min_capacity = capacity
                    bottleneck = component.name
                    bottleneck_stock = component.available
        
        capacity_int = int(min_capacity) if min_capacity != float('inf') else 0
        
        # Determine Status
        if capacity_int == 0:
            status = "out_of_stock"
            risk_pct = 100.0
        elif capacity_int <= 10:  # Threshold for "At Risk"
            status = "at_risk"
            risk_pct = max(0, 100 - (capacity_int * 5))
        else:
            status = "safe"
            risk_pct = 0.0
            
        # Mock demand for demo (e.g., 50 units expected next week)
        demand_estimate = 50
        
        results.append({
            "variant": variant,
            "can_make": capacity_int,
            "demand_estimate": demand_estimate,
            "status": status,
            "risk_pct": risk_pct,
            "bottleneck": bottleneck,
            "bottleneck_stock": bottleneck_stock
        })
        
    return results