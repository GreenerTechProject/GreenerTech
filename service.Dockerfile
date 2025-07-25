FROM python:3.10-slim

WORKDIR /app

COPY service/requirements.txt .

RUN pip install --no-cache-dir --progress-bar=off -r requirements.txt

COPY service .

EXPOSE 8080 8765

CMD ["python3", "video_streaming_service.py"]