#!/bin/sh
echo "📦 Applying database migrations..."
flask db init || true
flask db migrate -m "create tables" || true
flask db upgrade

echo "🚀 Starting Flask app..."
exec flask run --host=0.0.0.0 --port=5000
