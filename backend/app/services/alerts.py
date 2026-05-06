# app/services/alerts.py
from sqlalchemy.orm import Session
from app.models.alert import Alert, AlertType, AlertSeverity
from app.models.component import Component
from typing import List
import json

def check_and_create_alerts(merchant_id: str, db: Session) -> List[Alert]:
    """
    Check all components and create alerts for:
    - Out of stock
    - Low stock (below threshold)
    - Reorder suggestions
    """
    new_alerts = []
    
    components = db.query(Component).filter(
        Component.merchant_id == merchant_id,
        Component.is_active == True
    ).all()
    
    for component in components:
        # Out of stock alert
        if component.available <= 0:
            alert = create_alert(
                db=db,
                merchant_id=merchant_id,
                component_id=component.id,
                alert_type=AlertType.OUT_OF_STOCK,
                severity=AlertSeverity.CRITICAL,
                title=f"Out of Stock: {component.name}",
                message=f"{component.name} ({component.sku or 'N/A'}) is completely out of stock. Immediate action required.",
                metadata_json=json.dumps({
                    "current_stock": component.available,
                    "threshold": component.threshold,
                    "reorder_qty": component.reorder_qty
                })
            )
            new_alerts.append(alert)
        
        # Low stock alert
        elif component.available <= component.threshold:
            alert = create_alert(
                db=db,
                merchant_id=merchant_id,
                component_id=component.id,
                alert_type=AlertType.LOW_STOCK,
                severity=AlertSeverity.HIGH,
                title=f"Low Stock: {component.name}",
                message=f"{component.name} has only {component.available} {component.unit} left (threshold: {component.threshold}).",
                metadata_json=json.dumps({
                    "current_stock": component.available,
                    "threshold": component.threshold,
                    "reorder_qty": component.reorder_qty
                })
            )
            new_alerts.append(alert)
    
    return new_alerts

def create_alert(
    db: Session,
    merchant_id: str,
    component_id: int,
    alert_type: AlertType,
    severity: AlertSeverity,
    title: str,
    message: str,
    metadata_json: str = None
) -> Alert:
    """Create alert if not already exists (prevent duplicates)"""
    
    # Check if similar alert already exists (not resolved)
    existing = db.query(Alert).filter(
        Alert.merchant_id == merchant_id,
        Alert.component_id == component_id,
        Alert.alert_type == alert_type,
        Alert.is_resolved == False
    ).first()
    
    if existing:
        return existing
    
    alert = Alert(
        merchant_id=merchant_id,
        component_id=component_id,
        alert_type=alert_type,
        severity=severity,
        title=title,
        message=message,
        metadata_json=metadata_json
    )
    
    db.add(alert)
    db.commit()
    db.refresh(alert)
    
    return alert

def get_unread_alerts(merchant_id: str, db: Session) -> List[Alert]:
    """Get all unread alerts for a merchant"""
    return db.query(Alert).filter(
        Alert.merchant_id == merchant_id,
        Alert.is_read == False,
        Alert.is_resolved == False
    ).order_by(Alert.created_at.desc()).all()

def mark_alert_read(alert_id: int, merchant_id: str, db: Session) -> Alert:
    """Mark alert as read"""
    alert = db.query(Alert).filter(
        Alert.id == alert_id,
        Alert.merchant_id == merchant_id
    ).first()
    
    if alert:
        alert.is_read = True
        db.commit()
        db.refresh(alert)
    
    return alert