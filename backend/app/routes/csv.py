# app/routes/csv.py
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from fastapi.responses import StreamingResponse
from app.core.database import get_db
from app.services.csv_import import parse_components_csv, export_components_csv
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/api/v1/csv", tags=["CSV Import/Export"])

def get_current_merchant():
    return "test-merchant-123"

@router.post("/import/components")
def import_components(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Import components from CSV"""
    merchant_id = get_current_merchant()
    
    # Validate file type
    if not (file.filename.endswith('.csv') or file.filename.endswith('.xlsx')):
        raise HTTPException(status_code=400, detail="Only CSV and Excel (.xlsx) files are allowed")
    
    # Read file
    content = file.file.read()
    
    # Parse and import
    result = parse_components_csv(content, merchant_id, db, filename=file.filename)
    
    if not result['success']:
        raise HTTPException(status_code=400, detail=result['error'])
    
    return result

@router.get("/export/components")
def export_components(db: Session = Depends(get_db)):
    """Export components to CSV"""
    merchant_id = get_current_merchant()
    
    content, filename = export_components_csv(merchant_id, db)
    
    return StreamingResponse(
        iter([content]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/template/components")
def get_component_template():
    """Download CSV template for component import"""
    template = """name,sku,component_type,unit,on_hand,threshold,reorder_qty,supplier,lead_time_days,notes
Glass Jar 8oz,JAR-8OZ-001,packaging,piece,100,20,50,Packaging Co.,7,Clear glass jar
Lavender Wax,WAX-LAV-001,raw_material,gram,500,100,200,Wax Supplier,14,Premium lavender scented
Cotton Wick,WICK-COT-001,raw_material,piece,200,50,100,Wick Co.,5,100% cotton
"""
    
    return StreamingResponse(
        iter([template.encode('utf-8')]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=components_template.csv"}
    )