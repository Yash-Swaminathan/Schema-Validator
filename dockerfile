# Use Python 3.12 slim image
FROM python:3.12-slim AS build

WORKDIR /app

RUN apt-get update && apt-get install -y curl gcc libpq-dev && rm -rf /var/lib/apt/lists/*

RUN python3 -m pip install poetry

# Copy project files
COPY pyproject.toml poetry.lock ./
RUN poetry install --no-root

# Copy the actual project source code
COPY intern_project /app/intern_project

# Set PYTHONPATH to include /app
ENV PYTHONPATH="/app:${PYTHONPATH}"

# Set environment variables for Poetry virtual environment
ENV PATH="/app/.venv/bin:$PATH"

EXPOSE 9000

# Run the application from the correct path
CMD ["poetry", "run", "python3", "intern_project/main.py"]