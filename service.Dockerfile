FROM python:3.10-slim

WORKDIR /app

COPY service/requirements.txt .

#RUN apt-get update && apt-get install -y curl unzip && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir --progress-bar=off -r requirements.txt

COPY service .

#RUN curl -L -o ia/dataset.zip "https://www.kaggle.com/api/v1/datasets/download/abdellahelazzaoui/tomato-2-verus-datasets-yolo-datasets" && unzip -o ia/dataset.zip -d ia && rm ia/dataset.zip

EXPOSE 8080

CMD ["python3", "video_streaming_service.py"]