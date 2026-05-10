# app/routes/webhooks.py
from fastapi import APIRouter, Depends, Request, HTTPException, Header
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.shopify_webhooks import (
    verify_webhook_signature,
    log_webhook,
    process_order_webhook,
    process_product_update_webhook
)
from typing import Optional

router = APIRouter(prefix="/api/v1/webhooks", tags=["Shopify Webhooks"])

@router.post(
    "/shopify",
    openapi_extra={
        "requestBody": {
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "example": {
                            "id": 123456789,
                            "line_items": [
                                {
                                    "variant_id": 987654321,
                                    "quantity": 2,
                                    "sku": "TEST-SKU"
                                }
                            ]
                        }
                    }
                }
            }
        }
    }
)
async def shopify_webhook(
    request: Request,
    db: Session = Depends(get_db),
    x_shopify_topic: Optional[str] = Header(None),
    x_shopify_hmac_sha256: Optional[str] = Header(None),
    x_shopify_shop_domain: Optional[str] = Header(None),
    x_shopify_api_version: Optional[str] = Header(None),
):
    """
    Main Shopify webhook endpoint
    Handles: orders/create, products/update, inventory/update
    """
    # Read raw payload
    payload_bytes = await request.body()
    
    # Verify signature (if HMAC provided)
    if x_shopify_hmac_sha256:
        is_valid = verify_webhook_signature(
            payload_bytes,
            x_shopify_hmac_sha256
        )
        if not is_valid:
            raise HTTPException(status_code=401, detail="Invalid webhook signature")
    
    # Parse JSON payload
    try:
        payload = payload_bytes.decode('utf-8')
        if not payload.strip():
            payload = "{}"
        payload_json = __import__('json').loads(payload)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON: {str(e)}")
    
    # Log webhook
    webhook_log = log_webhook(
        db=db,
        topic=x_shopify_topic or "unknown",
        shop_domain=x_shopify_shop_domain or "unknown",
        hmac_signature=x_shopify_hmac_sha256 or "",
        payload=payload_json
    )
    
    # Process based on topic
    topic = x_shopify_topic or ""
    
    if topic == "orders/create":
        result = process_order_webhook(webhook_log, db)
    elif topic == "products/update":
        result = process_product_update_webhook(webhook_log, db)
    else:
        result = {
            "status": "ignored",
            "reason": f"Topic {topic} not handled"
        }
        webhook_log.processed = True
        db.commit()
    
    return {
        "webhook_id": webhook_log.id,
        "topic": topic,
        "status": "processed" if webhook_log.processed else "failed",
        "result": result
    }

@router.get("/shopify/logs")
def get_webhook_logs(
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get recent webhook logs for debugging"""
    from app.models.webhook import WebhookLog
    
    logs = db.query(WebhookLog).order_by(
        WebhookLog.created_at.desc()
    ).limit(limit).all()
    
    return {
        "count": len(logs),
        "logs": [
            {
                "id": log.id,
                "topic": log.topic,
                "shop_domain": log.shop_domain,
                "processed": log.processed,
                "created_at": log.created_at
            }
            for log in logs
        ]
    }