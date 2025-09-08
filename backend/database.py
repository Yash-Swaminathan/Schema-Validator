import psycopg2
from psycopg2 import extras
from fastapi import FastAPI
from contextlib import asynccontextmanager
import os

# PostgreSQL Database Configuration (uses environment variables)
DB_NAME = os.getenv("POSTGRES_DB", "postgres") 
DB_USER = os.getenv("POSTGRES_USER", "postgres")  
DB_PASSWORD = os.getenv("POSTGRES_PASSWORD", "postgres")
DB_HOST = os.getenv("DB_HOST", "localhost")  
DB_PORT = os.getenv("DB_PORT", "5432")

# For Render, we need to handle the database URL if provided
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL:
    # Parse the DATABASE_URL for Render
    import urllib.parse
    parsed = urllib.parse.urlparse(DATABASE_URL)
    DB_NAME = parsed.path[1:] if parsed.path else "postgres"
    DB_USER = parsed.username or "postgres"
    DB_PASSWORD = parsed.password or "postgres"
    DB_HOST = parsed.hostname or "localhost"
    DB_PORT = parsed.port or "5432"

# Establishing the Connection
def get_connection():
    try:
        print(f"Attempting to connect to database: {DB_HOST}:{DB_PORT}/{DB_NAME}")
        conn = psycopg2.connect(
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            host=DB_HOST,
            port=DB_PORT
        )
        conn.autocommit = True
        print("Database connection successful")
        return conn
    except Exception as e:
        print(f"Database connection failed: {e}")
        return None

# FastAPI Lifespan to handle startup/shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Try to establish connection
    conn = get_connection()
    if conn:
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
        try:
            with conn.cursor() as cur:
                cur.execute(create_table_sql)
            print("Startup: Table created or already exists.")
        except Exception as e:
            print(f"Error creating table: {e}")
        finally:
            conn.close()
    else:
        print("Warning: Could not establish database connection during startup")
    
    yield  # Yield control to application
    
    print("Shutdown: Database connection closed.")