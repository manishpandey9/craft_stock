# app/services/shopify_webhooks.py
import hashlib
import hmac
import base64
import json
from sqlalchemy.orm import Session
from app.models.webhook import WebhookLog
from app.models.bom import ShopifyVariant
from app.services.deduction import process_order_deduction
from typing import Optional, Dict, Any

SECRET_KEY = "your_shopify_webhook_secret"  # .env se lena hai

def verify_webhook_signature(
    payload: bytes,
    hmac_header: str,
    secret: str = SECRET_KEY
) -> bool:
    """
    Verify Shopify webhook signature
    Shopify sends HMAC-SHA256 signature in header
    """
    try:
        # Calculate expected HMAC
        digest = hmac.new(
            secret.encode('utf-8'),
            payload,
            hashlib.sha256
        ).digest()
        
        # Encode to base64
        calculated_hmac = base64.b64encode(digest).decode('utf-8')
        
        # Compare with received HMAC (constant-time comparison)
        return hmac.compare_digest(calculated_hmac, hmac_header)
        
    except Exception as e:
        print(f"Signature verification failed: {e}")
        return False

def log_webhook(
    db: Session,
    topic: str,
    shop_domain: str,
    hmac_signature: str,
    payload: Dict[str, Any]
) -> WebhookLog:
    """Log incoming webhook"""
    log = WebhookLog(
        topic=topic,
        shop_domain=shop_domain,
        hmac_signature=hmac_signature,
        payload=payload
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log

def process_order_webhook(
    webhook_log: WebhookLog,
    db: Session
) -> Dict[str, Any]:
    """
    Process orders/create webhook
    Auto-deduct stock based on line items
    """
    try:
        order_data = webhook_log.payload
        
        # Extract order details
        order_id = order_data.get('id')
        shop_domain = webhook_log.shop_domain
        line_items = order_data.get('line_items', [])
        
        results = []
        
        for item in line_items:
            variant_id = item.get('variant_id')
            quantity = item.get('quantity', 1)
            sku = item.get('sku')
            title = item.get('title')
            
            # Find variant in our database
            variant = db.query(ShopifyVariant).filter(
                ShopifyVariant.shopify_variant_id == str(variant_id),
                ShopifyVariant.merchant_id == shop_domain
            ).first()
            
            if variant and variant.is_active:
                # Process deduction
                deduction_result = process_order_deduction(
                    variant_id=variant.id,
                    order_qty=quantity,
                    db=db
                )
                
                results.append({
                    "variant_id": variant.id,
                    "variant_title": variant.title,
                    "quantity": quantity,
                    "result": deduction_result
                })
            else:
                # Variant not mapped to BOM yet
                results.append({
                    "shopify_variant_id": str(variant_id),
                    "sku": sku,
                    "title": title,
                    "quantity": quantity,
                    "result": {"status": "skipped", "reason": "No BOM mapped"}
                })
        
        # Mark webhook as processed
        webhook_log.processed = True
        db.commit()
        
        return {
            "success": True,
            "order_id": order_id,
            "items_processed": len(results),
            "results": results
        }
        
    except Exception as e:
        webhook_log.processed = False
        webhook_log.processing_error = str(e)
        db.commit()
        
        return {
            "success": False,
            "error": str(e)
        }

def process_product_update_webhook(
    webhook_log: WebhookLog,
    db: Session
) -> Dict[str, Any]:
    """
    Process products/update webhook
    Sync new/updated variants to our database
    """
    try:
        product_data = webhook_log.payload
        
        shop_domain = webhook_log.shop_domain
        product_id = product_data.get('id')
        variants = product_data.get('variants', [])
        
        synced_count = 0
        
        for variant_data in variants:
            variant_id = str(variant_data.get('id'))
            
            # Upsert variant
            variant = db.query(ShopifyVariant).filter(
                ShopifyVariant.shopify_variant_id == variant_id
            ).first()
            
            if variant:
                # Update existing
                variant.title = variant_data.get('title', variant.title)
                variant.sku = variant_data.get('sku', variant.sku)
                variant.updated_at = func.now()
            else:
                # Create new
                variant = ShopifyVariant(
                    merchant_id=shop_domain,
                    shopify_variant_id=variant_id,
                    shopify_product_id=str(product_id),
                    title=variant_data.get('title', 'Unknown'),
                    sku=variant_data.get('sku'),
                    is_active=True
                )
                db.add(variant)
            
            synced_count += 1
        
        db.commit()
        webhook_log.processed = True
        db.commit()
        
        return {
            "success": True,
            "product_id": product_id,
            "variants_synced": synced_count
        }
        
    except Exception as e:
        webhook_log.processed = False
        webhook_log.processing_error = str(e)
        db.commit()
        
        return {
            "success": False,
            "error": str(e)
        }