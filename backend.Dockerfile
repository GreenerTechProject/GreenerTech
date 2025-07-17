FROM python:3.13-slim

WORKDIR /app

COPY backend/requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY backend .

CMD /bin/sh -c '\
sleep 1 && \
flask db init 2>/dev/null || true && \
flask db migrate -m "create tables" 2>/dev/null || true && \
flask db upgrade && \
flask run --host=0.0.0.0 --port=5000'