# app/models/webhook.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, JSON
from sqlalchemy.sql import func
from app.core.database import Base

class WebhookLog(Base):
    """Log all incoming Shopify webhooks for debugging"""
    __tablename__ = "webhook_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    topic = Column(String, nullable=False, index=True)  # orders/create, products/update
    shop_domain = Column(String, nullable=False, index=True)
    
    # Webhook headers
    hmac_signature = Column(String, nullable=True)
    api_version = Column(String, nullable=True)
    
    # Payload
    payload = Column(JSON, nullable=False)
    
    # Processing status
    processed = Column(Boolean, default=False)
    processing_error = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())