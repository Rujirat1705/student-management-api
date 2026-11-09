# 🎓 UniCore SMS — ระบบบริหารจัดการข้อมูลนักศึกษาและผลการเรียน
**Student Management System RESTful API & Modern Web Application**

ระบบบริหารจัดการข้อมูลนักศึกษา ภาควิชา รายวิชา อาจารย์ที่ปรึกษา และการลงทะเบียนเรียน พร้อมระบบตัดเกรดและคำนวณเกรดเฉลี่ยสะสม (GPA) อัตโนมัติแบบ Real-time พัฒนาด้วยสถาปัตยกรรม RESTful API (Django REST Framework) และหน้าเว็บ Single Page Dashboard (TailwindCSS + Chart.js)

---

## ✨ คุณสมบัติเด่นของระบบ (Features)

- 🔐 **ระบบความปลอดภัยและการยืนยันตัวตน (JWT Authentication):**
  - รองรับการเข้าสู่ระบบด้วยอีเมลหรือชื่อผู้ใช้
  - บังคับใช้อีเมลเฉพาะโดเมนขององค์กร: `@ok.prolay`
  - มีปุ่มเปิด-ปิดการมองเห็นรหัสผ่าน (Password Visibility Toggle)
  - แบ่งสิทธิ์ชัดเจน (**Admin**: จัดการข้อมูลทั้งหมด CRUD / **Student**: สิทธิ์ Read-Only ดูเฉพาะข้อมูลตนเอง)
- 📊 **หน้าภาพรวมสถิติ (Interactive Dashboard):**
  - แสดงตัวเลขสรุป Real-time: นักศึกษาทั้งหมด, เกรดเฉลี่ยรวม, รายวิชา, การลงทะเบียน
  - กราฟสัดส่วนนักศึกษาแยกตามภาควิชา (Doughnut Chart)
  - กราฟจำแนกนักศึกษาตามชั้นปี (Bar Chart)
- 🧑‍🎓 **ระบบจัดการข้อมูลนักศึกษา (Student Management):**
  - ค้นหาและกรองข้อมูลตามภาควิชา, ชั้นปี, เพศ, สถานะภาพ
  - มุมมองเฉพาะนักศึกษา (Student View) เพื่อความเป็นส่วนตัว
  - ดูประวัติรายวิชาที่ลงทะเบียนและเกรดทุกภาคการศึกษา
- 📚 **ระบบจัดการรายวิชาและภาควิชา (Courses & Departments):**
  - ค้นหาหลักสูตร รหัสวิชา หน่วยกิต และอาจารย์ผู้สอน
- 📝 **ระบบลงทะเบียนและตัดเกรด (Enrollment & GPA Engine):**
  - ลงทะเบียนเรียนรายวิชา
  - บันทึกผลการเรียน A, B+, B, C+, C, D+, D, F
  - คำนวณเกรดเฉลี่ยสะสม (GPA) ให้อัตโนมัติทันทีที่มีการบันทึกหรือแก้ไขเกรด
- 📖 **เอกสารคู่มือ API (Interactive API Documentation):**
  - OpenAPI 3.0 / Swagger UI ทดสอบ API ได้ผ่านเบราว์เซอร์ที่ `/api/docs/`
  - Redoc Documentation ที่ `/api/redoc/`

---

## 🚀 วิธีเปิดใช้งานบน Render.com (Deploy to Render)

คุณสามารถนำโปรเจกต์นี้ขึ้นรันบนคลาวด์ [Render.com](https://render.com/) ได้ฟรี:

### วิธีที่ 1: Deploy ผ่าน Web Service (แนะนำ)
1. สมัคร/เข้าสู่ระบบที่ [Render.com](https://render.com/)
2. กดปุ่ม **New +** ที่มุมขวาบน เลือก **Web Service**
3. เลือกเชื่อมต่อกับ Repository ของคุณ: `wngscannabuyvththi-sketch/student-management-projact`
4. ตั้งค่าตามนี้:
   - **Name:** `unicore-sms` (หรือชื่อที่คุณต้องการ)
   - **Runtime:** `Python 3`
   - **Build Command:** `bash build.sh`
   - **Start Command:** `gunicorn --chdir backend config.wsgi:application --bind 0.0.0.0:$PORT`
5. ในส่วน **Advanced** -> **Add Environment Variable**:
   - `PYTHON_VERSION` = `3.11.9`
   - `DJANGO_ALLOWED_HOSTS` = `*`
   - `DJANGO_DEBUG` = `False`
6. กดปุ่ม **Create Web Service**
7. รอระบบ Build และ Migrate ข้อมูลประมาณ 2-3 นาที จะได้ URL เช่น `https://unicore-sms.onrender.com` พร้อมใช้งานทันทีทั้งหน้าเว็บและ API!

---

## 💻 วิธีรันบนเครื่อง Local (Local Development)

### 1. ติดตั้งไลบรารีที่จำเป็น
```bash
cd backend
pip install -r requirements.txt
```

### 2. รันคำสั่งเตรียมฐานข้อมูลและ Seed ข้อมูลตัวอย่าง
```bash
python manage.py migrate
python manage.py seed_data
```

### 3. เริ่มต้นการทำงานของ Backend Server
```bash
python manage.py runserver
```
ระบบจะเปิดทำงานที่ `http://127.0.0.1:8000`

---

## 🔑 บัญชีสำหรับทดสอบระบบ (Test Accounts)

| บทบาท (Role) | อีเมล (Email) | รหัสผ่าน (Password) | สิทธิ์การใช้งาน |
|---|---|---|---|
| 👑 **ผู้ดูแลระบบ (Admin)** | `admin@ok.prolay` | `admin1234` | เพิ่ม/ลบ/แก้ไขข้อมูลทั้งหมด, ตัดเกรด |
| 🎓 **นักศึกษาทดสอบ (Student)** | `student1@ok.prolay` | `student1234` | ดูข้อมูลของตนเอง, ดูวิชาและภาควิชา (Read-Only) |

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

- **Backend:** Python 3, Django 5.x, Django REST Framework, SimpleJWT, Gunicorn, Whitenoise
- **Database:** SQLite3 / Django ORM
- **Frontend:** HTML5, Modern JavaScript (ES6), TailwindCSS, Chart.js, FontAwesome 6, SweetAlert2
- **Documentation:** Drf-spectacular (OpenAPI 3.0 & Swagger UI)

---
Developed by **Boonrit Wongchanna** & Team

