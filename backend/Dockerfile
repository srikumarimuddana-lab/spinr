FROM python:3.10-slim

WORKDIR /app

# Copy the requirements file first for better caching
COPY backend/requirements.txt requirements.txt

RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire backend directory into /app/backend
COPY backend backend

# Set PYTHONPATH to include /app so "backend" is importable
ENV PYTHONPATH=/app

# Expose port
EXPOSE 8000

# Command to run the application as a package
# This fixes the relative import errors
CMD ["uvicorn", "backend.server:app", "--host", "0.0.0.0", "--port", "8000"]
