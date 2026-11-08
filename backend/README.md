# ระบบจัดการข้อมูลนักศึกษา (Student Management System RESTful API)

โครงงานประจำวิชา: พัฒนา RESTful API ด้วย Django สำหรับระบบบริการในองค์กร  
ปีการศึกษา: 2569

---

## 1. บทนำและวัตถุประสงค์ (Introduction & Objectives)
1. พัฒนา RESTful API สำหรับระบบบริหารจัดการข้อมูลนักศึกษาในสถาบันการศึกษา
2. จัดการข้อมูลโครงสร้างมหาวิทยาลัย เช่น ภาควิชา, อาจารย์, นักศึกษา, รายวิชา และการลงทะเบียนเรียน
3. รองรับการยืนยันตัวตนด้วย **JSON Web Token (JWT)** ตามมาตรฐานความปลอดภัย
4. มีเอกสารประกอบ API แบบ Interactive ด้วย **Swagger UI (drf-spectacular)**
5. รองรับการประมวลผลคำนวณเกรดเฉลี่ยสะสม (GPA) แบบ Real-time อัตโนมัติเมื่อมีการตัดเกรด

---

## 2. โครงสร้างฐานข้อมูล (Database Models & ER Concept)

ระบบประกอบด้วย 5 โมเดลหลัก และ 1 โมเดลผู้ใช้งาน (Django User):

```
+---------------+       1:N       +-------------------+       1:N       +-------------------+
|  Department   | <-------------- |      Teacher      | <-------------- |      Course       |
| (ภาควิชา/สาขา)|                 |     (อาจารย์)     |                 |     (รายวิชา)     |
+---------------+                 +-------------------+                 +-------------------+
        ^                                   ^                                     ^
        | 1:N                               | 1:N (อาจารย์ที่ปรึกษา)               |
        |                                   |                                     | 1:N
+---------------+                 +-------------------+                           |
|    Student    | ----------------+                   |                           |
|  (นักศึกษา)   |                                     |                           |
+---------------+                                     |                           |
        | 1:N                                         |                           |
        v                                             |                           |
+-----------------------------------------------------+---------------------------+
|                                    Enrollment                                   |
|                          (การลงทะเบียนเรียนและผลการเรียน)                         |
+---------------------------------------------------------------------------------+
```

### รายละเอียด Models:
1. **Department (ภาควิชา):** รหัสภาค (`code`), ชื่อ (`name`), คณะ (`faculty`), คำอธิบาย (`description`)
2. **Teacher (อาจารย์):** รหัสอาจารย์ (`teacher_code`), คำนำหน้า, ชื่อ-นามสกุล, อีเมล, เบอร์โทร, ภาควิชา, ห้องทำงาน
3. **Course (รายวิชา):** รหัสวิชา (`course_code`), ชื่อวิชา (`name`), หน่วยกิต (`credits`), ภาควิชา, อาจารย์ผู้สอนหลัก
4. **Student (นักศึกษา):** รหัสนักศึกษา (`student_id`), ชื่อ-นามสกุล, เพศ, วันเกิด, อีเมล, เบอร์โทร, ภาควิชา, อาจารย์ที่ปรึกษา, ชั้นปี, สถานะภาพ, เกรดเฉลี่ยสะสม (`gpa`)
5. **Enrollment (การลงทะเบียนเรียน):** นักศึกษา, รายวิชา, ภาคการศึกษา (`semester`), ปีการศึกษา (`academic_year`), ผลการเรียน (`grade` A, B+, B, C+, C, D+, D, F), สถานะ

---

## 3. สรุป API Endpoints

### 3.1 การยืนยันตัวตน (Authentication - SimpleJWT)
| Method | Endpoint | คำอธิบาย | สิทธิ์การเข้าถึง |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register/` | สมัครสมาชิกผู้ใช้งานใหม่ (รับ Token ทันที) | ทุกคน (Public) |
| `POST` | `/api/auth/login/` | เข้าสู่ระบบเพื่อรับ Access & Refresh Token | ทุกคน (Public) |
| `POST` | `/api/auth/refresh/` | ขอ Access Token ใหม่ด้วย Refresh Token | ทุกคน (Public) |
| `GET/PUT` | `/api/auth/profile/` | ดู/แก้ไขข้อมูลส่วนตัวของผู้ใช้งานปัจจุบัน | สมาชิก (JWT) |

### 3.2 ข้อมูลหลักและ CRUD (Core Resources)
| Method | Endpoint | คำอธิบาย | Filter / Search |
| :--- | :--- | :--- | :--- |
| `GET`, `POST` | `/api/departments/` | ดูรายการและเพิ่มภาควิชา | ค้นหา: code, name |
| `GET`, `PUT`, `DELETE` | `/api/departments/{id}/` | ดูรายละเอียด, แก้ไข, ลบภาควิชา | - |
| `GET`, `POST` | `/api/teachers/` | ดูรายการและเพิ่มอาจารย์ | กรอง: department / ค้นหา: name, email |
| `GET`, `PUT`, `DELETE` | `/api/teachers/{id}/` | ดูรายละเอียด, แก้ไข, ลบอาจารย์ | - |
| `GET`, `POST` | `/api/courses/` | ดูรายการและเพิ่มรายวิชา | กรอง: department, credits / ค้นหา: code, name |
| `GET`, `PUT`, `DELETE` | `/api/courses/{id}/` | ดูรายละเอียด, แก้ไข, ลบรายวิชา | - |
| `GET`, `POST` | `/api/students/` | ดูรายการและเพิ่มนักศึกษา | กรอง: department, year, status / ค้นหา: student_id, name |
| `GET`, `PUT`, `DELETE` | `/api/students/{id}/` | ดูข้อมูลนักศึกษาแบบลึก (รวมประวัติเรียน) | - |
| `GET` | `/api/students/{id}/enrollments/` | ดูวิชาที่นักศึกษาลงทะเบียนทั้งหมด | - |
| `POST` | `/api/students/{id}/recalculate_gpa/` | สั่งคำนวณ GPA ใหม่แบบ Real-time | - |
| `GET`, `POST` | `/api/enrollments/` | ดูประวัติและลงทะเบียนเรียน | กรอง: student, course, semester, grade |
| `PATCH`, `DELETE` | `/api/enrollments/{id}/` | บันทึก/แก้เกรด, ยกเลิกการลงทะเบียน | - |
| `GET` | `/api/dashboard/stats/` | สถิติภาพรวม Dashboard ทั้งหมด | ทุกคน (Public) |

### 3.3 เอกสารประกอบ API (Swagger & OpenAPI 3)
- **Swagger UI:** `http://127.0.0.1:8000/api/docs/`
- **Redoc:** `http://127.0.0.1:8000/api/redoc/`
- **Schema JSON:** `http://127.0.0.1:8000/api/schema/`

---

## 4. บัญชีผู้ใช้เริ่มต้นสำหรับทดสอบ (Default Accounts)

ระบบมาพร้อม Seed Data ที่สร้างไว้ล่วงหน้า:
- **ผู้ดูแลระบบ (Admin):**
  - Username: `admin`
  - Password: `admin1234`
  - สิทธิ์: Django Admin (`/admin/`) และจัดการข้อมูลได้ทั้งหมด
- **ผู้ใช้งานทั่วไป (Student):**
  - Username: `student1`
  - Password: `password1234`

---

## 5. วิธีการติดตั้งและรันระบบ (How to Run)

### ขั้นตอนที่ 1: ติดตั้ง Dependencies
```bash
pip install -r requirements.txt
```

### ขั้นตอนที่ 2: ดำเนินการสร้างฐานข้อมูลและเพิ่มข้อมูลตัวอย่าง
```bash
python manage.py migrate
python manage.py seed_data
```

### ขั้นตอนที่ 3: เริ่มรัน Development Server
```bash
python manage.py runserver 8000
```
เปิดบราวเซอร์ไปที่: `http://127.0.0.1:8000/api/docs/` เพื่อทดสอบผ่าน Swagger UI

### ขั้นตอนที่ 4: การรันชุดทดสอบอัตโนมัติ (Automated Unit Tests)
```bash
python manage.py test
```

---

## 6. การทดสอบด้วย Postman (Postman Testing)
ในโฟลเดอร์นี้มีไฟล์ `postman_collection.json`
- สามารถกดนำเข้า (Import) ในโปรแกรม Postman ได้ทันที
- มี Request ครบทุก Endpoint (Login, Register, Departments, Teachers, Courses, Students, Enrollments, Dashboard)
- มี Script บันทึก Token อัตโนมัติหลังกด Login ทำให้ทดสอบ Endpoint อื่นได้ทันที

---

## 7. การ Deploy ขึ้น Production (Render / Railway)
- **Render:** มีไฟล์ `render.yaml` สำหรับสั่ง Deploy Blueprint ได้ในคลิกเดียว
- **Procfile:** บันทึกคำสั่งรัน Gunicorn สำหรับ Cloud PaaS
- **Dockerfile:** บันทึกโครงสร้าง Container สำหรับ Railway หรือ Docker Hostings

