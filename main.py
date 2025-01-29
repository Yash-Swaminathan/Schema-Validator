# Imports
from fastapi import FastAPI, HTTPException, Query, File, UploadFile
from pydantic import BaseModel, EmailStr, Field
from typing import Dict, Optional, List
from Schema import SCHEMA  # Import the SCHEMA from Schema.py
import uvicorn
import yaml
from jsonschema import validate, ValidationError, SchemaError
import psycopg2
import psycopg2.extras
from contextlib import asynccontextmanager

# Connecting to the PostgreSQL database
DB_NAME = "postgres"  
DB_USER = "Intern-Project"
DB_PASSWORD = "Yash214!"
DB_HOST = "localhost"
DB_PORT = "5432"

conn = psycopg2.connect(
    dbname=DB_NAME,
    user=DB_USER,
    password=DB_PASSWORD,
    host=DB_HOST,
    port=DB_PORT
)
conn.autocommit = True

APP = FastAPI()


# FastAPI Lifespan to manage startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    # SQL query to create the required table if it does not exist
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
        cur.execute(create_table_sql) # create table

    print("Startup: Table created or already exists.")
 
    yield # Yield's letting command run

    conn.close()
    print("Shutdown: Database connection closed.")



# Function to validate YAML content, will return the type of error
def VALIDATE_YAML(yaml_content: str):
    try:
        yaml_data = yaml.safe_load(yaml_content)
        validate(instance=yaml_data, schema=SCHEMA)
        return {"is_valid": True, "message": "YAML is valid."}
    except yaml.YAMLError as e:
        return {"is_valid": False, "error": f"YAML Parsing Error: {e}"}
    except ValidationError as e:
        return {"is_valid": False, "error": f"Schema Validation Error: {e.message}"}
    except SchemaError as e:
        return {"is_valid": False, "error": f"Invalid Schema: {e.message}"}
    except Exception as e:
        return {"is_valid": False, "error": f"Unexpected Error: {str(e)}"}


# Compares the given YAML file to the SCHEMA, validating the file
@APP.post("/validate", summary="Validate a YAML file against the defined schema")
async def VALIDATE_YAML_ENDPOINT(file: UploadFile = File(..., description="YAML file to be validated")):
    """
    Compares the uploaded YAML file against a predefined schema.
    """
    try:
        content = await file.read()
        yaml_content = content.decode("utf-8")
        validation_result = VALIDATE_YAML(yaml_content)
        return validation_result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing file: {str(e)}")


# Used to add a new configuration in the database
@APP.post("/configs/")
def ADD_CONFIG(
    name: str = Query(..., description="Name"),
    age: int = Query(..., ge=0, description="Age must be a non-negative integer"),
    email: EmailStr = Query(..., description="Valid email address"),
    is_active: Optional[bool] = Query(None, description="User active status"),
    hobbies: Optional[str] = Query(None, description="List of hobbies"),
    street: Optional[str] = Query(None, description="Street address"),
    city: Optional[str] = Query(None, description="City name"),
    zip_code: Optional[str] = Query(None, description="ZIP code"),
):
    """
    Add a new configuration to the PostgreSQL database.
    """
    # Stored as a list
    hobbies_list = hobbies.split(",") if hobbies else []

# SQL query to insert data into the configs table
    insert_sql = """
        INSERT INTO configs (name, age, email, is_active, hobbies, street, city, zip_code)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id, name, age, email, is_active, hobbies, street, city, zip_code;
    """
    values = (name, age, email, is_active, hobbies_list, street, city, zip_code)

# Execute query and fetch new record
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(insert_sql, values)
        new_record = cur.fetchone()  

    return new_record
    

# Retrieve Configuration based on the ID
@APP.get("/configs/{ID}")
def GET_CONFIG(ID: int):
    """
    Retrieve a configuration by its ID from the PostgreSQL database.
    """
# SQL query to fetch the configuration details for the given ID
    select_sql = """
        SELECT id, name, age, email, is_active, hobbies, street, city, zip_code
        FROM configs
        WHERE id = %s;
    """
    # Execute the SQL query and fetch the record
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(select_sql, (ID,))
        record = cur.fetchone()
    
    # If no record is found, raise a 404 error
    if not record:
        raise HTTPException(status_code=404, detail="Config not found")

    return record


# Updates the Configuration of an ID
@APP.put("/configs/{ID}")
def UPDATE_CONFIG(
    ID: int,
    name: str = Query(..., description="Name"),
    age: int = Query(..., ge=0, description="Age must be a non-negative integer"),
    email: EmailStr = Query(..., description="Valid email address"),
    is_active: Optional[bool] = Query(None, description="User active status"),
    hobbies: Optional[str] = Query(None, description="List of hobbies (comma-separated)"),
    street: Optional[str] = Query(None, description="Street address"),
    city: Optional[str] = Query(None, description="City name"),
    zip_code: Optional[str] = Query(None, description="ZIP code"),
):
    """
    Update an existing configuration by ID in the PostgreSQL database.
    """
    # Convert hobbies string to a list if provided
    hobbies_list = hobbies.split(",") if hobbies else []

 # SQL query to update the configuration details for the given ID
    update_sql = """
        UPDATE configs
        SET
            name = %s,
            age = %s,
            email = %s,
            is_active = %s,
            hobbies = %s,
            street = %s,
            city = %s,
            zip_code = %s,
            updated_at = NOW()
        WHERE id = %s
        RETURNING id, name, age, email, is_active, hobbies, street, city, zip_code;
    """
    values = (name, age, email, is_active, hobbies_list, street, city, zip_code, ID)

 # Execute the SQL query and fetch the updated record
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(update_sql, values)
        updated_record = cur.fetchone()

  # If no record is updated, raise a 404 error
    if not updated_record:
        raise HTTPException(status_code=404, detail="Config not found")

    return updated_record
   

# Deletes the configuration based on its ID
@APP.delete("/configs/{ID}")
def DELETE_CONFIG(ID: int):
    """
    Delete a configuration by its ID from the PostgreSQL database.
    """
    # SQL query to delete the configuration and return the deleted ID
    delete_sql = "DELETE FROM configs WHERE id = %s RETURNING id;"

     # Execute the SQL query and check if a record was deleted
    with conn.cursor() as cur:
        cur.execute(delete_sql, (ID,))
        deleted = cur.fetchone()

  # If no record is deleted, raise a 404 error
    if not deleted:
        raise HTTPException(status_code=404, detail="Config not found")
    
    return {"message": f"Config with ID {ID} has been deleted."}



# This executes the code and creates a localhost webpage
def MAIN():
    APP = FastAPI(lifespan=lifespan)
    uvicorn.run(APP, host="127.0.0.1", port=9000)

if __name__ == "__main__":
    MAIN()