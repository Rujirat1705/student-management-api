# ใช้ Python 3.11 Slim
FROM python:3.11-slim

# กำหนด environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

# ตั้งค่า working directory
WORKDIR /app

# ติดตั้ง requirements
COPY backend/requirements.txt /app/backend/
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r /app/backend/requirements.txt

# คัดลอกโค้ดโปรเจกต์ทั้งหมด
COPY . /app/

# เตรียม static files
RUN python backend/manage.py collectstatic --no-input

# Expose port
EXPOSE 8000

# คำสั่งเริ่มต้น: migrate -> seed data -> รัน gunicorn
CMD sh -c "python backend/manage.py migrate && python backend/manage.py seed_data && gunicorn --chdir backend config.wsgi:application --bind 0.0.0.0:${PORT:-8000}"

