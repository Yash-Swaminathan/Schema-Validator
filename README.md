# Configuration File Management & Validation System

## **Overview**
This project is a **FastAPI-based service** that validates YAML configuration files against predefined schemas, stores configurations in a **PostgreSQL database**, and provides a **REST API interface**. The backend is containerized with **Docker**, dependencies are managed using **Poetry**, and the frontend is built with **React.js**.

## **Features**
- **YAML Configuration Validation** using `jsonschema` and `PyYAML`
- **FastAPI REST API** with endpoints for validation, database operations, and schema management
- **PostgreSQL Database** to store configurations and metadata
- **Dockerized Deployment** with `docker-compose`
- **Poetry for Dependency Management**
- **React.js Web Interface** for user interaction (file uploads, validation, and CRUD operations)

---

## **Tech Stack**
| Component   | Technology Used  |
|-------------|----------------|
| Backend API | FastAPI (Python) |
| Database    | PostgreSQL |
| Containerization | Docker, Docker-Compose |
| Package Management | Poetry |
| Frontend    | React.js, Formik, Yup |

---


## **Installation & Setup**
### **1. Clone the Repository**
```sh
git clone https://github.com/yashswaminathan/Intern-Project-1.git
cd Intern-Project-1
```
### **2. Install Dependencies**
```sh
poetry install
or
pip install -r requirements.txt
```

### **3. Running The Application**
```sh
docker-compose up --build
```
This will:

Start the FastAPI application on http://localhost:8000
Spin up a PostgreSQL database
Expose APIs for validation and config management



API Endpoints
HTTP Method	Endpoint	Description
POST	/validate	Validate a YAML file against schema
POST	/configs/	Add a new configuration
GET	/configs/{id}	Retrieve a config by ID
PUT	/configs/{id}	Update a config
DELETE	/configs/{id}	Delete a config
