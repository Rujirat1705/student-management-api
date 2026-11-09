#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -o errexit

echo "==> 1. Installing Python dependencies..."
pip install -r backend/requirements.txt

echo "==> 2. Running database migrations..."
python backend/manage.py migrate

echo "==> 3. Collecting static files..."
python backend/manage.py collectstatic --no-input

echo "==> 4. Seeding initial data (Admin, Test Student, Departments, Courses)..."
python backend/manage.py seed_data

echo "==> Build completed successfully! 🚀"
