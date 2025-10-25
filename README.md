# Configuration File Management & Validation System
https://schema-validator-lilac.vercel.app/

## 🚀 **Live Demo**
- **Frontend**: Deployed on **Vercel**
- **Backend**: Deployed on **Google Cloud Run** 

## **Overview**
This project is a **FastAPI-based service** that validates YAML configuration files against predefined schemas, stores configurations in a **PostgreSQL database**, and provides a **REST API interface**. The backend is containerized with **Docker**, dependencies are managed using **Poetry**, and the frontend is built with **React.js**.

## **Features**
- **YAML Configuration Validation** using `jsonschema` and `PyYAML`
- **FastAPI REST API** with endpoints for validation, database operations, and schema management
- **PostgreSQL Database** to store configurations and metadata
- **Dockerized Deployment** with `docker-compose`
- **Poetry for Dependency Management**
- **React.js Web Interface** for user interaction (file uploads, validation, and CRUD operations)
- **Cloud Deployment** on Vercel (frontend) and Google Cloud Run (backend)

---

## **Tech Stack**
| Component   | Technology Used  |
|-------------|----------------|
| Backend API | FastAPI (Python) |
| Database    | PostgreSQL |
| Containerization | Docker, Docker-Compose |
| Package Management | Poetry |
| Frontend    | React.js, Formik, Yup |
| Deployment  | Vercel (Frontend) + Google Cloud Run (Backend) |

---
## **System Architecture**
![Alt text](System_Diagram.png)

## **Installation & Setup**
### **1. Clone The Repository**
```sh
git clone https://github.com/Yash-Swaminathan/Schema-Validator.git
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


## **Frontend (React)**
### **1. Start The Frontend**
```sh
cd frontend
npm install
npm start
```
Accessible at http://localhost:3000 Built using Formik & Yup for form validation
