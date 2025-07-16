FROM python:3.13-slim

WORKDIR /app

COPY backend/requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY backend .

CMD /bin/sh -c "flask db init || true && flask db migrate -m 'create tables' || true && flask db upgrade"

CMD ["flask", "run", "--host=0.0.0.0", "--port=5000"]