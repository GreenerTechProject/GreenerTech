FROM python:3.13-slim

WORKDIR /app

COPY backend/requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY backend .

CMD /bin/sh -c '\
until pg_isready -h db -p 5432 -U postgres; do \
  echo "⏳ Waiting for PostgreSQL..."; \
  sleep 1; \
done && \
echo "✅ PostgreSQL is ready. Running migrations..." && \
flask db init 2>/dev/null || true && \
flask db migrate -m "create tables" 2>/dev/null || true && \
flask db upgrade && \
echo "🚀 Starting Flask..." && \
flask run --host=0.0.0.0 --port=5000'