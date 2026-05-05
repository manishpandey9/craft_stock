# app/routes/alerts.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.alert import Alert, AlertSeverity
from app.services.alerts import check_and_create_alerts, get_unread_alerts, mark_alert_read
from pydantic import BaseModel
from datetime import datetime
from typing import List

router = APIRouter(prefix="/api/v1/alerts", tags=["Alerts"])

class AlertResponse(BaseModel):
    id: int
    alert_type: str
    severity: str
    title: str
    message: str
    is_read: bool
    is_resolved: bool
    created_at: datetime

    class Config:
        from_attributes = True

def get_current_merchant():
    return "test-merchant-123"

@router.get("", response_model=List[AlertResponse])
def list_alerts(limit: int = 50, db: Session = Depends(get_db)):
    """Fetch unread alerts (auto-refreshes before returning)"""
    merchant_id = get_current_merchant()
    check_and_create_alerts(merchant_id, db)  # Refresh alerts first
    return get_unread_alerts(merchant_id, db)[:limit]

@router.get("/count")
def unread_count(db: Session = Depends(get_db)):
    """Get unread alert count for notification badge"""
    merchant_id = get_current_merchant()
    count = db.query(Alert).filter(
        Alert.merchant_id == merchant_id,
        Alert.is_read == False,
        Alert.is_resolved == False
    ).count()
    return {"count": count}

@router.post("/{alert_id}/read", response_model=AlertResponse)
def mark_read(alert_id: int, db: Session = Depends(get_db)):
    """Mark a specific alert as read"""
    merchant_id = get_current_merchant()
    alert = mark_alert_read(alert_id, merchant_id, db)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert