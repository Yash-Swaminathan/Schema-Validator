import pytest
from backend.main import APP
from fastapi.testclient import TestClient

client = TestClient(APP)


@pytest.fixture
def valid_config_data():
    """
    Returns a dictionary representing a valid configuration input.
    """
    return {
        "name": "John Doe",       # Valid name
        "age": 25,
        "email": "john@example.com",
        "is_active": True,
        "hobbies": "reading,basketball",
        "street": "123 Some St",
        "city": "London",         # Valid city
        "zip_code": "12345"
    }

@pytest.fixture
def invalid_name_config_data():
    """
    Returns a dictionary where 'name' contains invalid characters.
    """
    return {
        "name": "John123",        # Invalid name
        "age": 30,
        "email": "jane@example.com",
        "is_active": False,
        "hobbies": "coding,running",
        "street": "456 Another Rd",
        "city": "Paris",
        "zip_code": "54321"
    }

@pytest.fixture
def invalid_city_config_data():
    """
    Returns a dictionary where 'city' contains invalid characters.
    """
    return {
        "name": "Jane Doe",       # Valid name
        "age": 28,
        "email": "jane.doe@example.com",
        "is_active": True,
        "hobbies": "Volleyball,art",
        "street": "789 Random Ln",
        "city": "New_York1",      # Invalid city
        "zip_code": "11111"
    }



# 1. Test Creating a Config
def test_add_config_valid(valid_config_data):
    """
    Test adding a valid configuration. Expect a 200 OK and the returned record to match.
    """
    response = client.post("/configs/", json=valid_config_data)
    assert response.status_code == 200, response.text

    data = response.json()
    assert "id" in data
    assert data["name"] == valid_config_data["name"]
    assert data["city"] == valid_config_data["city"]


def test_add_config_invalid_name(invalid_name_config_data):
    """
    Test adding a configuration with an invalid name (should fail validation).
    """
    response = client.post("/configs/", json=invalid_name_config_data)
    # could get 400 or 422 depending on the FastAPI/Pydantic version
    assert response.status_code in [400, 422], response.text

def test_add_config_invalid_city(invalid_city_config_data):
    """
    Test adding a configuration with an invalid city (should fail validation).
    """
    response = client.post("/configs/", json=invalid_city_config_data)
    assert response.status_code in [400, 422], response.text



# 2. Test Fetching, Updating, and Deleting a Config
def test_crud_operations(valid_config_data):
    """
    Full cycle test: Create, Fetch, Update, and Delete a configuration.
    """
    # Create
    create_response = client.post("/configs/", json=valid_config_data)
    assert create_response.status_code == 200, create_response.text
    created_data = create_response.json()
    config_id = created_data["id"]

    # Fetch
    get_response = client.get(f"/configs/{config_id}")
    assert get_response.status_code == 200, get_response.text
    fetched_data = get_response.json()
    assert fetched_data["id"] == config_id
    assert fetched_data["name"] == valid_config_data["name"]

    # Update
    updated_payload = valid_config_data.copy()
    updated_payload["name"] = "Jane Smith"  # valid new name
    update_response = client.put(f"/configs/{config_id}", json=updated_payload)
    assert update_response.status_code == 200, update_response.text
    updated_data = update_response.json()
    assert updated_data["name"] == "Jane Smith"

    # Delete
    delete_response = client.delete(f"/configs/{config_id}")
    assert delete_response.status_code == 200, delete_response.text
    assert "message" in delete_response.json()

    # Fetch again to confirm deletion
    get_again_response = client.get(f"/configs/{config_id}")
    assert get_again_response.status_code == 404, get_again_response.text



# 3. Test /validate Endpoint
def test_validate_yaml_valid():
    """
    Test uploading a valid YAML file that matches the required fields:
    name (string), age (integer), email (valid email).
    """
    valid_yaml_content = b"""
    name: John Doe
    age: 25
    email: john@example.com
    """  # Minimal valid YAML for schema

    files = {
        "file": ("test.yaml", valid_yaml_content, "application/octet-stream")
    }
    response = client.post("/validate", files=files)
    assert response.status_code == 200, response.text
    result = response.json()
    assert result["is_valid"] is True, f"Validation failed: {result}"
    assert "message" in result


def test_validate_yaml_invalid():
    """
    Test uploading an invalid YAML file. Adjust 'invalid_yaml_content' 
    to ensure it fails your schema or is invalid YAML.
    """
    invalid_yaml_content = b"""
    This is not valid YAML: : :
    """

    files = {
        "file": ("invalid.yaml", invalid_yaml_content, "application/octet-stream")
    }
    response = client.post("/validate", files=files)
    # The endpoint returns 200 but with "is_valid": False, or it might raise an exception.
    assert response.status_code == 200, response.text
    result = response.json()
    assert result["is_valid"] is False
    assert "error" in result
