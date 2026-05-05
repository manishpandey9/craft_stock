# app/services/deduction.py
from sqlalchemy.orm import Session
from app.models.bom import BOM, BOMLine
from app.models.component import Component
from typing import Dict, List, Tuple
import math

def process_order_deduction(variant_id: int, order_qty: int, db: Session) -> Dict:
    """
    Simulates order fulfillment:
    1. Fetch active BOM for variant
    2. Deduct components based on BOM lines
    3. Recalculate availability
    4. Return new stock levels & can_make_now
    """
    # 1. Get active BOM
    bom = db.query(BOM).filter(BOM.variant_id == variant_id, BOM.is_active == True).first()
    if not bom:
        return {"error": "No active BOM found for this variant"}
    
    lines = db.query(BOMLine).filter(BOMLine.bom_id == bom.id).all()
    if not lines:
        return {"error": "BOM has no components"}
    
    deducted_components: List[Dict] = []
    stock_issues: List[str] = []
    
    # 2. Deduct components
    for line in lines:
        component = db.query(Component).filter(Component.id == line.component_id).first()
        if not component:
            stock_issues.append(f"Component ID {line.component_id} not found")
            continue
            
        waste_multiplier = 1 + ((line.waste_pct or 0) / 100)
        required_qty = line.qty_per_unit * waste_multiplier * order_qty
        
        if component.available < required_qty:
            stock_issues.append(f"Insufficient {component.name}: need {required_qty}, have {component.available}")
            continue
            
        # Update stock
        old_available = component.available
        component.on_hand -= required_qty
        component.reserved = max(0, component.reserved - required_qty)  # Simplified
        component.available = component.on_hand - component.reserved
        
        deducted_components.append({
            "component_id": component.id,
            "name": component.name,
            "deducted": required_qty,
            "old_available": old_available,
            "new_available": component.available
        })
    
    if stock_issues:
        return {"error": "Stock insufficient", "details": stock_issues, "partial_deductions": deducted_components}
    
    db.commit()
    
    # 3. Recalculate availability
    from app.services.availability import calculate_availability
    new_availability = calculate_availability(variant_id, db)
    
    return {
        "status": "success",
        "order_qty": order_qty,
        "deducted_components": deducted_components,
        "new_availability": new_availability
    }