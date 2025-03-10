# Imports
from fastapi import FastAPI, HTTPException, Query, File, UploadFile, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Dict, Optional, List
from backend.Schema import SCHEMA  # Import the SCHEMA from Schema.py
import uvicorn
import yaml
from jsonschema import validate, ValidationError, SchemaError
import psycopg2
import psycopg2.extras
from backend.database import lifespan, conn  # Import the FastAPI instance and DB connection

APP = FastAPI(lifespan=lifespan)

APP.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development; restrict this in production
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

# Pydantic model for configuration data
class ConfigInput(BaseModel):
    name: str
    age: int = Field(..., ge=0, description="Age must be a non-negative integer")
    email: EmailStr
    is_active: Optional[bool] = None
    hobbies: Optional[str] = None
    street: Optional[str] = None
    city: Optional[str] = None
    zip_code: Optional[str] = None

    @field_validator('name')
    @classmethod
    def validate_name(cls, value):
        # Only letters and spaces
        if not value.replace(" ", "").isalpha():
            raise ValueError("Name must contain only letters")
        return value

    @field_validator('city')
    @classmethod
    def validate_city(cls, value):
        # Allow empty or None if city is optional
        if value and not value.replace(" ", "").isalpha():
            raise ValueError("City must contain only letters")
        return value

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
def ADD_CONFIG(config: ConfigInput):
    """
    Add a new configuration to the PostgreSQL database.
    """
    # Stored as a list
    hobbies_list = config.hobbies.split(",") if config.hobbies else []
    
    # SQL query to insert data into the configs table
    insert_sql = """
        INSERT INTO configs (name, age, email, is_active, hobbies, street, city, zip_code)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id, name, age, email, is_active, hobbies, street, city, zip_code;
    """
    values = (config.name, config.age, config.email, config.is_active, 
              hobbies_list, config.street, config.city, config.zip_code)

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
def UPDATE_CONFIG(ID: int, config: ConfigInput):
    """
    Update an existing configuration by ID in the PostgreSQL database.
    """
    # Convert hobbies string to a list if provided
    hobbies_list = config.hobbies.split(",") if config.hobbies else []

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
    values = (config.name, config.age, config.email, config.is_active, 
              hobbies_list, config.street, config.city, config.zip_code, ID)

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