# app/services/availability.py
from sqlalchemy.orm import Session
from app.models.bom import BOM, BOMLine
from app.models.component import Component
from typing import Dict, Optional
import math

def calculate_availability(variant_id: int, db: Session, safety_buffer: float = 0.0) -> Dict:
    """
    PRD Formula:
    effective_qty = qty_per_unit * (1 + waste_pct/100)
    component_supported = floor((available - reserved - buffer) / effective_qty)
    can_make_now = MIN(component_supported)
    """
    bom = db.query(BOM).filter(
        BOM.variant_id == variant_id,
        BOM.is_active == True
    ).first()

    if not bom:
        return {"can_make_now": None, "bottleneck_component_id": None, "bottleneck_name": None, "message": "No active BOM"}

    lines = db.query(BOMLine).filter(BOMLine.bom_id == bom.id).all()
    if not lines:
        return {"can_make_now": 0, "bottleneck_component_id": None, "bottleneck_name": None, "message": "Empty BOM"}

    min_supported = float('inf')
    bottleneck_id = None
    bottleneck_name = None

    for line in lines:
        component = db.query(Component).filter(Component.id == line.component_id).first()
        if not component or not component.is_active:
            return {"can_make_now": 0, "bottleneck_component_id": line.component_id, "bottleneck_name": "Missing/Archived", "message": "Invalid component in BOM"}

        waste_multiplier = 1 + ((line.waste_pct or 0) / 100)
        effective_qty = line.qty_per_unit * waste_multiplier
        
        if effective_qty <= 0:
            continue

        # available = on_hand - reserved (materialized in component.available)
        usable_stock = component.available - safety_buffer
        supported_units = math.floor(usable_stock / effective_qty)

        if supported_units < min_supported:
            min_supported = supported_units
            bottleneck_id = component.id
            bottleneck_name = component.name

    can_make = max(0, int(min_supported)) if min_supported != float('inf') else 0
    return {
        "can_make_now": can_make,
        "bottleneck_component_id": bottleneck_id,
        "bottleneck_name": bottleneck_name,
        "message": "Calculated successfully"
    }