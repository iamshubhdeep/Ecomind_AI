# Use official Python 3.10 slim image
FROM python:3.10-slim

# Set the working directory
WORKDIR /app

# Install system dependencies (needed for OpenCV and ML libraries)
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the environment
COPY . .

# Expose the port Hugging Face uses (7860) and run the app
EXPOSE 7860
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
