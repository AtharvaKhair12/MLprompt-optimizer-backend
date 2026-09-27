FROM python:3.10-slim

# Set up a working directory
WORKDIR /code

# Copy the requirements file and install dependencies
COPY backend/requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# Copy the backend code and artifacts
COPY backend /code/backend

# Set the environment variable to ensure HuggingFace downloads models properly
ENV TRANSFORMERS_CACHE=/tmp/huggingface

# Run the FastAPI app on port 7860 (Hugging Face default)
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "7860"]
