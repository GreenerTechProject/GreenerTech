FROM python:3.10-slim

WORKDIR /app

COPY service/requirements.txt .

RUN pip install --no-cache-dir --progress-bar=off -r requirements.txt

COPY service .

CMD ["python", "video_streaming_service.py"]