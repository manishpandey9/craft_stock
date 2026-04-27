#!/usr/bin/env python
"""Reset Alembic version tracking and recreate initial migration."""
from app.core.database import engine
from sqlalchemy import text

# Clear version history
with engine.connect() as conn:
    conn.execute(text("DELETE FROM alembic_version;"))
    conn.commit()
    print("✅ Alembic version table cleared")

print("Migration tracking reset. You can now run: alembic stamp head")
