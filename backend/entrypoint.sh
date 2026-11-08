#!/bin/sh
set -e

echo "=== Running Database Migrations ==="
python manage.py migrate --noinput

echo "=== Seeding Initial Sample Data & Admin Account ==="
python manage.py seed_data || true

echo "=== Starting Gunicorn Server ==="
exec gunicorn config.wsgi:application --bind 0.0.0.0:8000
