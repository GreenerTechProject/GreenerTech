FROM python:3.10-slim

RUN apt-get update && apt-get install -y \
    build-essential \
    libpango-1.0-0 \
    libcairo2 \
    libgdk-pixbuf2.0-0 \
    libffi-dev \
    libglib2.0-0 \
    gir1.2-pango-1.0 \
    gir1.2-glib-2.0 \
    fonts-liberation \
    fonts-freefont-ttf \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/requirements.txt .

RUN pip install --no-cache-dir --progress-bar=off -r requirements.txt

COPY backend .

CMD sh -c '[ -f .env ] || cp copy.env .env && flask run --host=0.0.0.0 --port=5000'
