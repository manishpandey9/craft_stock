# app/routes/boms.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.bom import BOM, BOMLine, ShopifyVariant
from app.schemas.bom import BOMCreate, BOMResponse
from app.services.availability import calculate_availability
from app.services.deduction import process_order_deduction

router = APIRouter(prefix="/api/v1/boms", tags=["BOM & Availability"])

def get_current_merchant():
    return "test-merchant-123"

@router.get("/{variant_id}/bom", response_model=BOMResponse)
def get_bom(variant_id: int, db: Session = Depends(get_db)):
    """Get active BOM for a variant"""
    bom = db.query(BOM).filter(
        BOM.variant_id == variant_id,
        BOM.is_active == True
    ).first()
    
    if not bom:
        raise HTTPException(status_code=404, detail="No active BOM found for this variant")
    
    return bom

@router.post("/{variant_id}/bom", response_model=BOMResponse)
def create_update_bom(
    variant_id: int,
    data: BOMCreate,  # ✅ Fixed: parameter name added
    db: Session = Depends(get_db)
):
    """Create or update BOM for a variant"""
    # Deactivate existing BOM if any
    existing_bom = db.query(BOM).filter(
        BOM.variant_id == variant_id,
        BOM.is_active == True
    ).first()
    
    if existing_bom:
        existing_bom.is_active = False
        db.commit()
        new_version = existing_bom.version + 1
    else:
        new_version = 1
    
    # Create new BOM
    new_bom = BOM(
        variant_id=variant_id,
        version=new_version,
        is_active=True
    )
    db.add(new_bom)
    db.flush()  # Get ID without commit
    
    # Add BOM lines
    for line_data in data.lines:
        new_line = BOMLine(
            bom_id=new_bom.id,
            component_id=line_data.component_id,
            qty_per_unit=line_data.qty_per_unit,
            waste_pct=line_data.waste_pct or 0.0,
            notes=line_data.notes
        )
        db.add(new_line)
    
    db.commit()
    db.refresh(new_bom)
    
    return new_bom

@router.get("/{variant_id}/availability")
def get_availability(
    variant_id: int,
    safety_buffer: float = 0.0,
    db: Session = Depends(get_db)
):
    """Calculate availability for a variant"""
    result = calculate_availability(variant_id, db, safety_buffer)
    return result

@router.post("/{variant_id}/simulate-order")
def simulate_order(variant_id: int, qty: int = 1, db: Session = Depends(get_db)):
    """Simulate an order to test deduction & recalculation"""
    result = process_order_deduction(variant_id, qty, db)
    return result