FROM python:3.10-slim

WORKDIR /app

COPY services/requirements.txt .

#RUN apt-get update && apt-get install -y curl unzip && rm -rf /var/lib/apt/lists/*

# Install required system packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libjpeg62-turbo \
    libpng-dev \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir --progress-bar=off -r requirements.txt

COPY services .

#RUN curl -L -o ia/dataset.zip "https://www.kaggle.com/api/v1/datasets/download/abdellahelazzaoui/tomato-2-verus-datasets-yolo-datasets" && unzip -o ia/dataset.zip -d ia && rm ia/dataset.zip

EXPOSE 8080

CMD ["python3", "services.py"]