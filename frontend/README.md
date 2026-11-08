# ระบบบริหารจัดการข้อมูลนักศึกษา (Frontend Dashboard)

เว็บแอปพลิเคชันสำหรับบริหารจัดการข้อมูลนักศึกษา หลักสูตร รายวิชา และการตัดเกรด พัฒนาขึ้นเพื่อทำงานร่วมกับ **Django RESTful API** (SimpleJWT Authentication)

---

## 📁 โครงสร้างไฟล์ใน Frontend

| ลำดับ | ไฟล์ | ประเภท | คำอธิบายและหน้าที่ |
| :---: | :--- | :---: | :--- |
| 1 | `index.html` | HTML5 Structure | โครงสร้างหน้าเว็บหลักแบบ Single Page Application (SPA) รวมทั้ง Sidebar นำทาง, Dashboard Metrics, ตารางข้อมูลนักศึกษา, การลงทะเบียนเรียน และ Modals ฟอร์มต่างๆ |
| 2 | `css/style.css` | Stylesheet | สไตล์เฉพาะตัว เช่น เอฟเฟกต์ Glassmorphism กระจกโปร่งแสง, การจัดระเบียบฟอนต์ Kanit/Plus Jakarta Sans, แถบสี GPA Badge และ Pulse Animations |
| 3 | `js/api.js` | API Client Module | คลาส `ApiService` ควบคุมการยิง HTTP Request (Fetch API), ส่งแนบ JWT Bearer Token, ตรวจจับสถานะการเชื่อมต่อเซิร์ฟเวอร์ และสลับระหว่างโหมดเซิร์ฟเวอร์จริงกับ Mock Data |
| 4 | `js/mockData.js` | Mock Data Fallback | ข้อมูลจำลองที่สอดคล้องกับโครงสร้างฐานข้อมูล SQLite และ Seed Data ของ Django 100% ทำให้เปิดดูและทดสอบระบบได้ทันทีโดยไม่ต้องเปิดเซิร์ฟเวอร์ล่วงหน้า |
| 5 | `js/app.js` | UI Application Controller | ควบคุม Logic ทั้งหมด: การเปลี่ยนแท็บ, การผูกปุ่มกด, การวาดกราฟสถิติด้วย Chart.js, การกรอง/ค้นหาข้อมูลนักศึกษา, การคำนวณ GPA สะสมแบบ Real-time และการแจ้งเตือน Pop-up |

---

## 🚀 วิธีเปิดดูผลงาน (How to Run Frontend)

### วิธีที่ 1: ดับเบิลคลิกเปิดไฟล์ได้ทันที (ง่ายที่สุด)
1. ไปที่โฟลเดอร์ `student-management-projact/frontend/`
2. ดับเบิลคลิกที่ไฟล์ **`index.html`**
3. ระบบจะเปิดขึ้นมาในเบราว์เซอร์ (Google Chrome, Edge, Brave) โดยอัตโนมัติ
4. *ระบบจะเชื่อมต่อไปยังโหมด Mock Data หรือ Live API ให้ทันทีพร้อมใช้งาน!*

### วิธีที่ 2: เปิดผ่าน VS Code Live Server
1. เปิดโฟลเดอร์ `student-management-projact` ใน VS Code
2. คลิกขวาที่ไฟล์ `frontend/index.html`
3. เลือก **"Open with Live Server"**

---

## 🔑 บัญชีทดสอบในระบบ (Quick Login)
- **ผู้ดูแลระบบ (Admin):** Username: `admin` | Password: `admin1234`
- **นักศึกษา (Student):** Username: `student1` | Password: `password1234`
*(มีปุ่มคลิกเดียวเพื่อกรอกชื่อและรหัสผ่านให้อัตโนมัติในหน้าต่างเข้าสู่ระบบ)*
