# Use Python 3.12 slim image
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Poetry
RUN python3 -m pip install poetry

# Copy project files
COPY pyproject.toml poetry.lock ./

# Install dependencies
RUN poetry config virtualenvs.create false \
    && poetry install --no-dev --no-interaction --no-ansi

# Copy the actual project source code
COPY backend /app/backend

# Set PYTHONPATH to include /app
ENV PYTHONPATH="/app:${PYTHONPATH}"

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "backend.main:APP", "--host", "0.0.0.0", "--port", "8000"]
