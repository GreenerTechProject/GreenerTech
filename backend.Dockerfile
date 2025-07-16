FROM python:3.10-slim

WORKDIR /app

COPY backend/requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY backend .

# Rends le script exécutable
RUN chmod +x entrypoint.sh

ENTRYPOINT ["./entrypoint.sh"]