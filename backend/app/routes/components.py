# app/routes/components.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.component import Component, ComponentType
from app.schemas.component import (
    ComponentCreate,
    ComponentUpdate,
    ComponentResponse,
    StockAdjustment
)
from app.core.database import SessionLocal
from sqlalchemy import func

router = APIRouter(prefix="/api/v1/components", tags=["Components"])

def get_current_merchant():
    # TODO: Implement actual merchant extraction from Shopify session
    # For now, return a test merchant ID
    return "test-merchant-123"

@router.get("", response_model=List[ComponentResponse])
def list_components(
    skip: int = 0,
    limit: int = 100,
    component_type: Optional[ComponentType] = None,
    low_stock: bool = False,
    db: Session = Depends(get_db)
):
    """List all components for the current merchant"""
    merchant_id = get_current_merchant()
    
    query = db.query(Component).filter(
        Component.merchant_id == merchant_id,
        Component.is_active == True
    )
    
    if component_type:
        query = query.filter(Component.component_type == component_type)
    
    if low_stock:
        query = query.filter(Component.available <= Component.threshold)
    
    components = query.offset(skip).limit(limit).all()
    return components

@router.post("", response_model=ComponentResponse)
def create_component(
    component: ComponentCreate,
    db: Session = Depends(get_db)
):
    """Create a new component"""
    merchant_id = get_current_merchant()
    
    db_component = Component(
        merchant_id=merchant_id,
        **component.model_dump(),
        available=component.on_hand,
        reserved=0.0
    )
    
    db.add(db_component)
    db.commit()
    db.refresh(db_component)
    return db_component

@router.get("/{component_id}", response_model=ComponentResponse)
def get_component(component_id: int, db: Session = Depends(get_db)):
    """Get a specific component by ID"""
    merchant_id = get_current_merchant()
    
    component = db.query(Component).filter(
        Component.id == component_id,
        Component.merchant_id == merchant_id
    ).first()
    
    if not component:
        raise HTTPException(status_code=404, detail="Component not found")
    
    return component

@router.patch("/{component_id}", response_model=ComponentResponse)
def update_component(
    component_id: int,
    component_update: ComponentUpdate,
    db: Session = Depends(get_db)
):
    """Update a component"""
    merchant_id = get_current_merchant()
    
    db_component = db.query(Component).filter(
        Component.id == component_id,
        Component.merchant_id == merchant_id
    ).first()
    
    if not db_component:
        raise HTTPException(status_code=404, detail="Component not found")
    
    update_data = component_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_component, field, value)
    
    # Recalculate available
    db_component.available = db_component.on_hand - db_component.reserved
    
    db.commit()
    db.refresh(db_component)
    return db_component

@router.post("/{component_id}/adjust-stock", response_model=ComponentResponse)
def adjust_stock(
    component_id: int,
    adjustment: StockAdjustment,
    db: Session = Depends(get_db)
):
    """Adjust component stock with audit trail"""
    merchant_id = get_current_merchant()
    
    db_component = db.query(Component).filter(
        Component.id == component_id,
        Component.merchant_id == merchant_id
    ).first()
    
    if not db_component:
        raise HTTPException(status_code=404, detail="Component not found")
    
    # Store old values
    old_on_hand = db_component.on_hand
    
    # Apply adjustment
    db_component.on_hand += adjustment.quantity
    db_component.available = db_component.on_hand - db_component.reserved
    
    # TODO: Create inventory movement ledger entry
    # movement = InventoryMovement(
    #     merchant_id=merchant_id,
    #     component_id=component_id,
    #     movement_type="adjustment",
    #     quantity_delta=adjustment.quantity,
    #     reason=adjustment.reason,
    #     notes=adjustment.notes,
    #     before_qty=old_on_hand,
    #     after_qty=db_component.on_hand
    # )
    # db.add(movement)
    
    db.commit()
    db.refresh(db_component)
    return db_component

@router.get("/{component_id}/impact")
def get_component_impact(component_id: int, db: Session = Depends(get_db)):
    """Get which products are affected by this component"""
    merchant_id = get_current_merchant()
    
    component = db.query(Component).filter(
        Component.id == component_id,
        Component.merchant_id == merchant_id
    ).first()
    
    if not component:
        raise HTTPException(status_code=404, detail="Component not found")
    
    # TODO: Query BOM lines to find affected products
    # This will be implemented when we create BOM models
    
    return {
        "component_id": component_id,
        "component_name": component.name,
        "current_stock": component.available,
        "threshold": component.threshold,
        "is_low_stock": component.available <= component.threshold,
        "affected_products": []  # Will be populated later
    }