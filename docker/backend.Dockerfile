FROM python:3.10-slim

WORKDIR /app

COPY backend/requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY backend .

CMD ['flask db init', 'flask db migrate -m "create tables" ','flask db upgrade']

CMD ["flask", "run", "--host=0.0.0.0", "--port=5000"]
