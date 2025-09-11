from fastapi import FastAPI, File, UploadFile, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Dict, Optional, List, Any
from backend.Schema import SCHEMA  # Import the SCHEMA from Schema.py
import uvicorn
import yaml
import os
from jsonschema import validate, ValidationError, SchemaError
import json
from deepdiff import DeepDiff
import psycopg2
import psycopg2.extras
from backend.database import lifespan, get_connection  # Import the FastAPI instance and DB connection

app = FastAPI(lifespan=lifespan)

# Health check endpoint
@app.get("/")
def root():
    return {"message": "Schema Validator API is running!", "status": "healthy"}

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "schema-validator"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development; restrict this in production
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

# Health check endpoint
@app.get("/")
async def root():
    """
    Health check endpoint for Render deployment.
    """
    return {"message": "Schema Validator API is running!", "status": "healthy"}

# Health check endpoint
@app.get("/health")
async def health_check():
    """
    Health check endpoint for monitoring.
    """
    try:
        conn = get_connection()
        if conn:
            conn.close()
            return {"status": "healthy", "database": "connected"}
        else:
            return {"status": "unhealthy", "database": "disconnected"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

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

# Pydantic models for schema comparison
class SchemaComparisonInput(BaseModel):
    schema1_content: str = Field(..., description="First YAML schema content")
    schema2_content: str = Field(..., description="Second YAML schema content")
    schema1_name: Optional[str] = Field(None, description="Name for first schema")
    schema2_name: Optional[str] = Field(None, description="Name for second schema")

class SchemaComparisonResult(BaseModel):
    are_identical: bool
    schema1_name: Optional[str]
    schema2_name: Optional[str]
    differences: Optional[Dict[str, Any]] = None
    schema1_valid: bool
    schema2_valid: bool
    schema1_errors: Optional[List[str]] = None
    schema2_errors: Optional[List[str]] = None

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

# Function to parse and validate a single YAML schema
def parse_and_validate_yaml_schema(yaml_content: str):
    """Parse YAML content and return validation status with errors if any."""
    errors = []
    parsed_data = None
    is_valid = True
    
    try:
        parsed_data = yaml.safe_load(yaml_content)
        if parsed_data is None:
            errors.append("YAML content is empty or null")
            is_valid = False
    except yaml.YAMLError as e:
        errors.append(f"YAML parsing error: {str(e)}")
        is_valid = False
    except Exception as e:
        errors.append(f"Unexpected error parsing YAML: {str(e)}")
        is_valid = False
    
    return {
        "is_valid": is_valid,
        "parsed_data": parsed_data,
        "errors": errors
    }

# Function to compare two YAML schemas
def compare_yaml_schemas(schema1_content: str, schema2_content: str, 
                        schema1_name: Optional[str] = None, 
                        schema2_name: Optional[str] = None) -> SchemaComparisonResult:
    """Compare two YAML schemas and return detailed comparison results."""
    
    # Parse and validate both schemas
    schema1_result = parse_and_validate_yaml_schema(schema1_content)
    schema2_result = parse_and_validate_yaml_schema(schema2_content)
    
    # Initialize result
    result = SchemaComparisonResult(
        are_identical=False,
        schema1_name=schema1_name or "Schema 1",
        schema2_name=schema2_name or "Schema 2",
        schema1_valid=schema1_result["is_valid"],
        schema2_valid=schema2_result["is_valid"],
        schema1_errors=schema1_result["errors"] if schema1_result["errors"] else None,
        schema2_errors=schema2_result["errors"] if schema2_result["errors"] else None
    )
    
    # If both schemas are valid, compare them
    if schema1_result["is_valid"] and schema2_result["is_valid"]:
        try:
            # Use DeepDiff to find differences
            diff = DeepDiff(
                schema1_result["parsed_data"], 
                schema2_result["parsed_data"],
                ignore_order=True
            )
            
            if not diff:
                result.are_identical = True
            else:
                # Convert DeepDiff result to a serializable dictionary
                result.differences = dict(diff)
                
        except Exception as e:
            result.schema1_errors = result.schema1_errors or []
            result.schema1_errors.append(f"Comparison error: {str(e)}")
    
    return result


# Compares the given YAML file to the SCHEMA, validating the file
@app.post("/validate", summary="Validate a YAML file against the defined schema")
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


# Compare two YAML schemas (JSON input)
@app.post("/compare-schemas", summary="Compare two YAML schemas", response_model=SchemaComparisonResult)
async def compare_schemas_json(comparison_input: SchemaComparisonInput):
    """
    Compare two YAML schemas provided as JSON input.
    Returns detailed comparison results including differences.
    """
    try:
        result = compare_yaml_schemas(
            comparison_input.schema1_content,
            comparison_input.schema2_content,
            comparison_input.schema1_name,
            comparison_input.schema2_name
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error comparing schemas: {str(e)}")


# Compare two YAML schema files
@app.post("/compare-schema-files", summary="Compare two YAML schema files", response_model=SchemaComparisonResult)
async def compare_schema_files(
    file1: UploadFile = File(..., description="First YAML schema file"),
    file2: UploadFile = File(..., description="Second YAML schema file")
):
    """
    Compare two uploaded YAML schema files.
    Returns detailed comparison results including differences.
    """
    try:
        # Read file contents
        content1 = await file1.read()
        content2 = await file2.read()
        
        schema1_content = content1.decode("utf-8")
        schema2_content = content2.decode("utf-8")
        
        # Use filenames as schema names
        schema1_name = file1.filename or "Schema 1"
        schema2_name = file2.filename or "Schema 2"
        
        result = compare_yaml_schemas(
            schema1_content,
            schema2_content,
            schema1_name,
            schema2_name
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing files: {str(e)}")


# Used to add a new configuration in the database
@app.post("/configs/")
def ADD_CONFIG(config: ConfigInput):
    """
    Add a new configuration to the PostgreSQL database.
    """
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
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
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(insert_sql, values)
            new_record = cur.fetchone()  
        return new_record
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        conn.close()
    

# Retrieve Configuration based on the ID
@app.get("/configs/{ID}")
def GET_CONFIG(ID: int):
    """
    Retrieve a configuration by its ID from the PostgreSQL database.
    """
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    # SQL query to fetch the configuration details for the given ID
    select_sql = """
        SELECT id, name, age, email, is_active, hobbies, street, city, zip_code
        FROM configs
        WHERE id = %s;
    """
    # Execute the SQL query and fetch the record
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(select_sql, (ID,))
            record = cur.fetchone()
        
        # If no record is found, raise a 404 error
        if not record:
            raise HTTPException(status_code=404, detail="Config not found")

        return record
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        conn.close()


# Updates the Configuration of an ID
@app.put("/configs/{ID}")
def UPDATE_CONFIG(ID: int, config: ConfigInput):
    """
    Update an existing configuration by ID in the PostgreSQL database.
    """
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
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
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(update_sql, values)
            updated_record = cur.fetchone()

        # If no record is updated, raise a 404 error
        if not updated_record:
            raise HTTPException(status_code=404, detail="Config not found")

        return updated_record
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        conn.close()
   

# Deletes the configuration based on its ID
@app.delete("/configs/{ID}")
def DELETE_CONFIG(ID: int):
    """
    Delete a configuration by its ID from the PostgreSQL database.
    """
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    # SQL query to delete the configuration and return the deleted ID
    delete_sql = "DELETE FROM configs WHERE id = %s RETURNING id;"

    # Execute the SQL query and check if a record was deleted
    try:
        with conn.cursor() as cur:
            cur.execute(delete_sql, (ID,))
            deleted = cur.fetchone()

        # If no record is deleted, raise a 404 error
        if not deleted:
            raise HTTPException(status_code=404, detail="Config not found")
        
        return {"message": f"Config with ID {ID} has been deleted."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        conn.close()

# For local development
if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))  # Use PORT env var or default to 8000
    uvicorn.run(app, host="0.0.0.0", port=port)