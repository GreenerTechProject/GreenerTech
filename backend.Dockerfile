FROM python:3.10-slim

WORKDIR /app

COPY backend/requirements.txt .

RUN pip install --no-cache-dir --progress-bar=off -r requirements.txt

COPY backend .

#CMD ["flask", "run", "--host=0.0.0.0", "--port=5000"]
CMD sh -c '[ -f .env ] || cp copy.env .env && flask run --host=0.0.0.0 --port=5000'