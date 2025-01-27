#Madatory Parameters
MANDATORY_PARAMS = {
    "name": {"type": "string"},
    "age": {"type": "integer", "minimum": 0},
    "email": {"type": "string", "format": "email"},
}

#Optional Parameters
OPTIONAL_PARAMS = {
    "is_active": {"type": "boolean"},
    "hobbies": {
        "type": "array",
        "items": {"type": "string"}
    },
    "address": {
        "type": "object",
        "properties": {
            "street": {"type": "string"},
            "city": {"type": "string"},
            "zip_code": {
                "anyOf": [
                    {"type": "string"},
                    {"type": "integer"}
                ]
            }
        },

        "required": ["street", "city"]
    },
}

#What the Schema Contains
SCHEMA = {
    "type": "object",
    "properties": {**MANDATORY_PARAMS, **OPTIONAL_PARAMS},
    "required": list(MANDATORY_PARAMS.keys())
}
