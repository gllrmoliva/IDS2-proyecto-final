import os
from pathlib import Path
import psycopg

DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://postgres:postgres_password@localhost:5432/casos_db"
).replace("+asyncpg", "")

SEED_FILE = Path(__file__).parent / "test_data.sql"

def seed_database() -> None:
    print(f"Conectandose a la base de datos...")
    try:
        with psycopg.connect(DATABASE_URL) as conn:
            with conn.cursor() as cur:
                print(f"Leyendo SQL de {SEED_FILE.name}...")
                sql = SEED_FILE.read_text(encoding="utf-8")
                
                print("Ejecutando transacción de semilla...")
                cur.execute(sql)
                
        print("Datos de testeo insertados correctamente")
        
    except psycopg.errors.UniqueViolation:
        print("Semilla abortada: Data ya existe (Unique Constraint Violation).")
    except Exception as e:
        print(f"Semilla fallada: {e}")

if __name__ == "__main__":
    seed_database()
