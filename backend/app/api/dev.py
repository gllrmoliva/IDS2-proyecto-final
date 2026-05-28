from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text, MetaData
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.database import get_db

router = APIRouter(tags=["Utilidades de desarrollo"], prefix="/dev")

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent

@router.get("/reset-database")
async def reset_database(db: AsyncSession = Depends(get_db)):
    """
    WARNING: Destructive action. Drops all tables, recreates schema, and seeds data.
    """
    schema_file = PROJECT_ROOT / "db" / "migrations" / "001_initial_schema.sql"
    seeds_file = PROJECT_ROOT / "db" / "seeds" / "test_data.sql"

    if not schema_file.exists():
        raise HTTPException(status_code=404, detail=f"Schema file not found: {schema_file}")
    if not seeds_file.exists():
        raise HTTPException(status_code=404, detail=f"Seeds file not found: {seeds_file}")

    try:
        # Step 1: Drop all tables synchronously using run_sync
        conn = await db.connection()
        
        def drop_tables(sync_conn):
            metadata = MetaData()
            metadata.reflect(bind=sync_conn)
            metadata.drop_all(bind=sync_conn)
            
            # If using custom ENUMs in Postgres, metadata.drop_all() leaves them behind.
            # We explicitly drop the custom types here to avoid errors on recreation.
            sync_conn.execute(text("DROP TYPE IF EXISTS estado_caso CASCADE;"))
            sync_conn.execute(text("DROP TYPE IF EXISTS gravedad CASCADE;"))
            sync_conn.execute(text("DROP TYPE IF EXISTS estado_incidente CASCADE;")) # Asegúrate de limpiar también este
            
        await conn.run_sync(drop_tables)

        # Step 2: Recreate schema statement by statement
        schema_sql = schema_file.read_text()
        for statement in schema_sql.split(';'):
            clean_statement = statement.strip()
            if clean_statement:  # Ignore empty strings from trailing semicolons
                await db.execute(text(clean_statement))

        # Step 3: Add data from test_data.sql statement by statement
        seeds_sql = seeds_file.read_text()
        for statement in seeds_sql.split(';'):
            clean_statement = statement.strip()
            if clean_statement:
                await db.execute(text(clean_statement))

        # Step 4: Sincronizar secuencias autoincrementales
        # Ajusta esta lista con todas las tablas que tengan un ID numérico (IDENTITY o SERIAL)
        tablas_autoincrementales = [
            ("Incidente", "id_incidente"),
            ("Caso", "id_caso"),
            ("Hito", "id_hito"),
            ("Documento", "id_doc"),
            ("Curso", "id_curso")
        ]

        for tabla, columna in tablas_autoincrementales:
            sync_query = f"""
                SELECT setval(
                    pg_get_serial_sequence('"{tabla}"', '{columna}'), 
                    (SELECT COALESCE(MAX({columna}), 1) FROM "{tabla}")
                );
            """
            await db.execute(text(sync_query))

        # Commit all the changes
        await db.commit()

        return {
            "status": "success", 
            "message": "Database successfully wiped, recreated, seeded, and sequences synced."
        }

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Database reset failed: {str(e)}")
