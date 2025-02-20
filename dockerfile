FROM python:3.12-slim

WORKDIR /app

# Install system dependencies, including build-essential and libpq-dev
RUN apt-get update && \
    apt-get install -y curl gcc libpq-dev && \
    rm -rf /var/lib/apt/lists/*

# Install Poetry using the official installer
RUN curl -sSL https://install.python-poetry.org | python -

# Add Poetry to PATH (Poetry installs to /root/.local/bin by default)
ENV PATH="/root/.local/bin:${PATH}"

# Copy only the configuration files first
COPY pyproject.toml poetry.lock* ./

# Install dependencies without installing the root project (--no-root)
RUN poetry config virtualenvs.create false && \
    poetry install --no-root --only main --no-interaction --no-ansi -vvv

# Copy the rest of your application code
COPY . .

EXPOSE 9000

CMD ["uvicorn", "main:APP", "--host", "0.0.0.0", "--port", "9000"]
