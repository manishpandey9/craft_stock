import os
from sqlalchemy import create_engine, inspect
from dotenv import load_dotenv

load_dotenv()

db_url = os.getenv("DATABASE_URL")
if not db_url:
    print("DATABASE_URL not found")
    exit(1)

engine = create_engine(db_url, connect_args={"sslmode": "require"})
inspector = inspect(engine)

print(f"Checking table 'components' in {db_url.split('@')[-1]}")
columns = inspector.get_columns('components')
for col in columns:
    print(f"Column: {col['name']}, Type: {col['type']}")
