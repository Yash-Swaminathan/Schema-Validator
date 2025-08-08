#!/bin/bash
# Startup script for Render deployment

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI application
uvicorn backend.main:APP --host 0.0.0.0 --port $PORT 