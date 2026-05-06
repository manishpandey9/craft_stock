from app.core.database import SessionLocal
from app.services.csv_import import export_components_csv
from app.routes.csv import get_current_merchant

db = SessionLocal()
try:
    merchant_id = get_current_merchant()
    content, filename = export_components_csv(merchant_id, db)
    print("Success")
except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    db.close()
