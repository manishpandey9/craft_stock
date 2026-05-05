# app/services/csv_import.py
import pandas as pd
import io
from sqlalchemy.orm import Session
from app.models.component import Component, ComponentType
from typing import Dict, List, Tuple
from datetime import datetime

def parse_components_csv(file_content: bytes, merchant_id: str, db: Session, filename: str = ".csv") -> Dict:
    """
    Parse CSV or Excel file and import components
    Expected columns: name, sku, component_type, unit, on_hand, threshold, supplier
    """
    try:
        # Read File
        if filename.endswith('.xlsx'):
            df = pd.read_excel(io.BytesIO(file_content))
        else:
            df = pd.read_csv(io.BytesIO(file_content))
        
        # Validate required columns
        required_cols = ['name']
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            return {
                "success": False,
                "error": f"Missing required columns: {', '.join(missing_cols)}"
            }
        
        imported = []
        errors = []
        
        for idx, row in df.iterrows():
            try:
                # Validate component type
                comp_type = row.get('component_type', 'raw_material')
                if comp_type not in [t.value for t in ComponentType]:
                    comp_type = 'raw_material'
                
                # Create component
                component = Component(
                    merchant_id=merchant_id,
                    name=str(row['name']),
                    sku=str(row.get('sku', '')) or None,
                    component_type=comp_type,
                    unit=str(row.get('unit', 'piece')),
                    on_hand=float(row.get('on_hand', 0)),
                    reserved=0.0,
                    available=float(row.get('on_hand', 0)),
                    threshold=float(row.get('threshold', 10)),
                    reorder_qty=float(row.get('reorder_qty', 0)) if pd.notna(row.get('reorder_qty')) else None,
                    supplier=str(row.get('supplier', '')) or None,
                    lead_time_days=int(row.get('lead_time_days', 0)) if pd.notna(row.get('lead_time_days')) else None,
                    notes=str(row.get('notes', '')) or None,
                )
                
                db.add(component)
                imported.append({
                    "row": idx + 2,  # 1-indexed + header
                    "name": component.name,
                    "id": None  # Will be set after commit
                })
                
            except Exception as e:
                errors.append({
                    "row": idx + 2,
                    "error": str(e),
                    "data": row.to_dict()
                })
        
        db.commit()
        
        # Get IDs for imported components
        for imp in imported:
            comp = db.query(Component).filter(
                Component.merchant_id == merchant_id,
                Component.name == imp['name']
            ).first()
            if comp:
                imp['id'] = comp.id
        
        return {
            "success": True,
            "imported_count": len(imported),
            "error_count": len(errors),
            "imported": imported,
            "errors": errors
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to parse CSV: {str(e)}"
        }

def export_components_csv(merchant_id: str, db: Session) -> Tuple[bytes, str]:
    """Export components to CSV"""
    components = db.query(Component).filter(
        Component.merchant_id == merchant_id,
        Component.is_active == True
    ).all()
    
    data = []
    for c in components:
        data.append({
            'name': c.name,
            'sku': c.sku or '',
            'component_type': getattr(c.component_type, 'value', c.component_type),
            'unit': c.unit,
            'on_hand': c.on_hand,
            'reserved': c.reserved,
            'available': c.available,
            'threshold': c.threshold,
            'reorder_qty': c.reorder_qty or '',
            'supplier': c.supplier or '',
            'lead_time_days': c.lead_time_days or '',
            'notes': c.notes or ''
        })
    
    df = pd.DataFrame(data)
    csv_buffer = io.StringIO()
    df.to_csv(csv_buffer, index=False)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"components_export_{timestamp}.csv"
    
    return csv_buffer.getvalue().encode('utf-8'), filename