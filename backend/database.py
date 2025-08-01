import psycopg2
from psycopg2 import extras
from fastapi import FastAPI
from contextlib import asynccontextmanager
import os

# PostgreSQL Database Configuration (uses Railway environment variables)
DB_NAME = os.getenv("PGDATABASE", os.getenv("POSTGRES_DB", "postgres"))
DB_USER = os.getenv("PGUSER", os.getenv("POSTGRES_USER", "postgres"))
DB_PASSWORD = os.getenv("PGPASSWORD", os.getenv("POSTGRES_PASSWORD", "postgres"))
DB_HOST = os.getenv("PGHOST", os.getenv("DB_HOST", "localhost"))
DB_PORT = os.getenv("PGPORT", os.getenv("DB_PORT", "5432"))


# Establishing the Connection
conn = psycopg2.connect(
    dbname=DB_NAME,
    user=DB_USER,
    password=DB_PASSWORD,
    host=DB_HOST,
    port=DB_PORT
)
conn.autocommit = True

# FastAPI Lifespan to handle startup/shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS configs (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        age INT NOT NULL,
        email VARCHAR(100) NOT NULL,
        is_active BOOLEAN,
        hobbies TEXT[],
        street VARCHAR(100),
        city VARCHAR(100),
        zip_code VARCHAR(20),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    """
    with conn.cursor() as cur:
        cur.execute(create_table_sql)

    print("Startup: Table created or already exists.")
    yield  # Yield control to application
    conn.close()
    print("Shutdown: Database connection closed.")

# Initialize FastAPI App 
APP = FastAPI(lifespan=lifespan)