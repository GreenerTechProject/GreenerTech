FROM python:3.10-slim

WORKDIR /app

# Avoid interactive prompts
ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies for OpenCV and AIORTC
RUN apt-get update && apt-get install -y \
    libglib2.0-0 libsm6 libxrender1 libxext6 libavdevice-dev libavfilter-dev libopus-dev libvpx-dev libavformat-dev libavcodec-dev libavutil-dev libswscale-dev libgtk2.0-dev libboost-all-dev ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY service/requirements.txt .

RUN pip install --no-cache-dir --progress-bar=off -r requirements.txt

COPY service .

CMD ["python3", "video_streaming_service.py"]