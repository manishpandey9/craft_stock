# app/models/bom.py
from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class ShopifyVariant(Base):
    """Local cache of Shopify variants for BOM mapping"""
    __tablename__ = "shopify_variants"
    
    id = Column(Integer, primary_key=True, index=True)
    merchant_id = Column(String, nullable=False, index=True)
    shopify_variant_id = Column(String, unique=True, nullable=False, index=True)
    shopify_product_id = Column(String, nullable=False)
    title = Column(String, nullable=False)
    sku = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    boms = relationship("BOM", back_populates="variant", uselist=False)

class BOM(Base):
    """Bill of Materials for a specific variant"""
    __tablename__ = "boms"
    
    id = Column(Integer, primary_key=True, index=True)
    variant_id = Column(Integer, ForeignKey("shopify_variants.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    version = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    variant = relationship("ShopifyVariant", back_populates="boms")
    lines = relationship("BOMLine", back_populates="bom", cascade="all, delete-orphan")

class BOMLine(Base):
    """Individual component requirement in a BOM"""
    __tablename__ = "bom_lines"
    
    id = Column(Integer, primary_key=True, index=True)
    bom_id = Column(Integer, ForeignKey("boms.id"), nullable=False)
    component_id = Column(Integer, ForeignKey("components.id"), nullable=False)
    qty_per_unit = Column(Float, nullable=False)
    waste_pct = Column(Float, default=0.0)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    bom = relationship("BOM", back_populates="lines")
    component = relationship("Component")
    
    __table_args__ = (
        UniqueConstraint('bom_id', 'component_id', name='uq_bom_component'),
    )