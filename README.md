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

## **Project Structure**

'''Intern-Project-1/
'''
├── .vscode/ # VS Code configuration files
│
├── intern_project/ # Backend application code
│ ├── database.py # PostgreSQL connection & table creation
│ ├── main.py # FastAPI endpoints for validation and config management
│ ├── Schema.py # JSON Schema definitions for validation
│
├── tests/ # Test cases for API
│
├── frontend/ # Frontend application code
│ ├── App.jsx # React frontend with Formik
│
├── docker-compose.yml # Dockerized environment setup
├── Dockerfile # Backend Docker setup
│
├── poetry.lock # Poetry dependency lockfile
├── pyproject.toml # Poetry dependencies
│
└── README.md # Project documentation

## **Installation & Setup**
### **1. Clone the Repository**
```sh
git clone https://github.com/yashswaminathan/Intern-Project-1.git
cd Intern-Project-1
