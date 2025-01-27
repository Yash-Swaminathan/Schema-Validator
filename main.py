# Imports
from fastapi import FastAPI, HTTPException, Query, File, UploadFile
from pydantic import BaseModel, EmailStr, Field
from typing import Dict, Optional, List
from Schema import SCHEMA  # Import the SCHEMA from Schema.py
import uvicorn
import yaml
from jsonschema import validate, ValidationError, SchemaError


APP = FastAPI()

# Helps with storing configurations
DB = {}
CONFIG_ID_COUNTER = 1

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
    hobbies: Optional[str] = Query(None, description="List of hobbies (comma-separated)"),
    street: Optional[str] = Query(None, description="Street address"),
    city: Optional[str] = Query(None, description="City name"),
    zip_code: Optional[str] = Query(None, description="ZIP code"),
):
    """
    Add a new configuration to the in-memory database.
    """
    # Used to track the IDs
    global CONFIG_ID_COUNTER
    new_config = {
        "id": CONFIG_ID_COUNTER,
        "name": name,
        "age": age,
        "email": email,
        "is_active": is_active,
        "hobbies": hobbies.split(",") if hobbies else [],
        "address": {
            "street": street,
            "city": city,
            "zip_code": zip_code
        }
    }

    # Store new configuration in DB, and add an increment for when a new ID is created
    DB[CONFIG_ID_COUNTER] = new_config
    CONFIG_ID_COUNTER += 1
    return new_config

# Retrieve Configuration based on the ID
@APP.get("/configs/{ID}")
def GET_CONFIG(ID: int):
    """
    Retrieve a configuration by its ID.
    """
    if ID not in DB:
        raise HTTPException(status_code=404, detail="Config not found")
    return DB[ID]

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
    Update an existing configuration by ID.
    """
    if ID not in DB:
        raise HTTPException(status_code=404, detail="Config not found")
    # Updates the existing configuration with new values
    DB[ID] = {
        "id": ID,
        "name": name,
        "age": age,
        "email": email,
        "is_active": is_active,
        "hobbies": hobbies.split(",") if hobbies else [],
        "address": {
            "street": street,
            "city": city,
            "zip_code": zip_code
        }
    }
    return DB[ID]

# Deletes the configuration based on its ID
@APP.delete("/configs/{ID}")
def DELETE_CONFIG(ID: int):
    """
    Delete a configuration by its ID.
    """
    if ID not in DB:
        raise HTTPException(status_code=404, detail="Config not found")
    del DB[ID]
    return {"message": f"Config with ID {ID} has been deleted."}

# This executes the code and creates a localhost webpage
def MAIN():
    uvicorn.run(APP, host="127.0.0.1", port=8000)

if __name__ == "__main__":
    MAIN()