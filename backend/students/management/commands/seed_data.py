from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from students.models import Department, Teacher, Course, Student, Enrollment
from datetime import date


class Command(BaseCommand):
    help = 'สร้างข้อมูลตัวอย่างสำหรับระบบจัดการข้อมูลนักศึกษา (Seed Sample Data)'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.NOTICE('กำลังสร้างข้อมูลตัวอย่าง...'))

        # 1. สร้างผู้ดูแลระบบ (Admin)
        if not User.objects.filter(username='admin').exists():
            admin_user = User.objects.create_superuser('admin', 'admin@university.ac.th', 'admin1234')
            admin_user.first_name = 'ผู้ดูแล'
            admin_user.last_name = 'ระบบกลาง'
            admin_user.save()
            self.stdout.write(self.style.SUCCESS('สร้าง Superuser สำเร็จ: admin / admin1234'))
        else:
            self.stdout.write('มี Superuser admin อยู่แล้ว')

        # สร้างผู้ใช้ทั่วไปตัวอย่าง
        if not User.objects.filter(username='student1').exists():
            std_user = User.objects.create_user('student1', 'student1@university.ac.th', 'password1234')
            std_user.first_name = 'ภานุพงศ์'
            std_user.last_name = 'มณีโรจน์'
            std_user.save()
            self.stdout.write(self.style.SUCCESS('สร้างผู้ใช้งานตัวอย่าง: student1 / password1234'))

        # 2. สร้างภาควิชา
        departments_data = [
            {'code': 'CPE', 'name': 'วิศวกรรมคอมพิวเตอร์', 'faculty': 'คณะวิศวกรรมศาสตร์', 'description': 'หลักสูตรการออกแบบฮาร์ดแวร์และซอฟต์แวร์ระดับสูง'},
            {'code': 'IT', 'name': 'เทคโนโลยีสารสนเทศ', 'faculty': 'คณะวิทยาการสารสนเทศ', 'description': 'หลักสูตรการพัฒนาระบบเครือข่ายและเว็บแอพพลิเคชัน'},
            {'code': 'SE', 'name': 'วิศวกรรมซอฟต์แวร์', 'faculty': 'คณะวิทยาการสารสนเทศ', 'description': 'เน้นกระบวนการพัฒนาซอฟต์แวร์และการบริหารจัดการโปรเจกต์'},
            {'code': 'DS', 'name': 'วิทยาการข้อมูลและการวิเคราะห์', 'faculty': 'คณะวิทยาการสารสนเทศ', 'description': 'เน้นวิทยาศาสตร์ข้อมูล ปัญญาประดิษฐ์ และ Machine Learning'},
        ]

        dept_objs = {}
        for d in departments_data:
            obj, created = Department.objects.get_or_create(code=d['code'], defaults=d)
            dept_objs[d['code']] = obj

        self.stdout.write(self.style.SUCCESS(f'สร้าง/ตรวจสอบ ภาควิชาเรียบร้อย ({len(dept_objs)} แผนก)'))

        # 3. สร้างข้อมูลอาจารย์
        teachers_data = [
            {
                'teacher_code': 'T1001', 'title': 'ผศ.ดร.', 'first_name': 'สมชาย', 'last_name': 'ใจดีเลิศ',
                'email': 'somchai.j@university.ac.th', 'phone': '0812345678', 'department': dept_objs['CPE'], 'office': 'อาคาร 4 ชั้น 3 ห้อง 4301'
            },
            {
                'teacher_code': 'T1002', 'title': 'ดร.', 'first_name': 'วิภาดา', 'last_name': 'รุ่งเรืองวิทย์',
                'email': 'wipada.r@university.ac.th', 'phone': '0823456789', 'department': dept_objs['IT'], 'office': 'อาคาร 4 ชั้น 4 ห้อง 4402'
            },
            {
                'teacher_code': 'T1003', 'title': 'อ.', 'first_name': 'กิตติศักดิ์', 'last_name': 'พัฒนศิลป์',
                'email': 'kittisak.p@university.ac.th', 'phone': '0834567890', 'department': dept_objs['SE'], 'office': 'อาคาร 5 ชั้น 2 ห้อง 5205'
            },
            {
                'teacher_code': 'T1004', 'title': 'ผศ.', 'first_name': 'ณิชาภัทร', 'last_name': 'สุวรรณโชติ',
                'email': 'nichapat.s@university.ac.th', 'phone': '0845678901', 'department': dept_objs['DS'], 'office': 'อาคาร 5 ชั้น 3 ห้อง 5308'
            },
        ]

        teacher_objs = {}
        for t in teachers_data:
            obj, created = Teacher.objects.get_or_create(teacher_code=t['teacher_code'], defaults=t)
            teacher_objs[t['teacher_code']] = obj

        self.stdout.write(self.style.SUCCESS(f'สร้าง/ตรวจสอบ อาจารย์เรียบร้อย ({len(teacher_objs)} ท่าน)'))

        # 4. สร้างข้อมูลรายวิชา
        courses_data = [
            {
                'course_code': 'CPE101', 'name': 'Computer Programming (การเขียนโปรแกรมคอมพิวเตอร์)',
                'credits': 3, 'department': dept_objs['CPE'], 'instructor': teacher_objs['T1001'],
                'description': 'พื้นฐานการเขียนโปรแกรมด้วยภาษา Python โครงสร้างควบคุม ฟังก์ชัน และการจัดการไฟล์'
            },
            {
                'course_code': 'CPE201', 'name': 'Data Structures and Algorithms (โครงสร้างข้อมูลและขั้นตอนวิธี)',
                'credits': 3, 'department': dept_objs['CPE'], 'instructor': teacher_objs['T1001'],
                'description': 'โครงสร้างข้อมูลพื้นฐาน Stack, Queue, Tree, Graph และการวิเคราะห์ความซับซ้อนของอัลกอริทึม'
            },
            {
                'course_code': 'IT301', 'name': 'Database Systems and RESTful API (ระบบฐานข้อมูลและ RESTful API)',
                'credits': 3, 'department': dept_objs['IT'], 'instructor': teacher_objs['T1002'],
                'description': 'การออกแบบฐานข้อมูลเชิงสัมพันธ์ SQL, NoSQL และการพัฒนา RESTful Web Services'
            },
            {
                'course_code': 'SE202', 'name': 'Software Engineering Principles (หลักการวิศวกรรมซอฟต์แวร์)',
                'credits': 3, 'department': dept_objs['SE'], 'instructor': teacher_objs['T1003'],
                'description': 'SDLC, Agile Methodology, Scrum, Architecture Design และการประกันคุณภาพซอฟต์แวร์'
            },
            {
                'course_code': 'DS102', 'name': 'Applied Statistics and Data Analytics (สถิติประยุกต์และการวิเคราะห์ข้อมูล)',
                'credits': 3, 'department': dept_objs['DS'], 'instructor': teacher_objs['T1004'],
                'description': 'สถิติพรรณนาและอนุมาน การทำความสะอาดข้อมูล และการแสดงผลข้อมูลด้วยกราฟิก'
            },
        ]

        course_objs = {}
        for c in courses_data:
            obj, created = Course.objects.get_or_create(course_code=c['course_code'], defaults=c)
            course_objs[c['course_code']] = obj

        self.stdout.write(self.style.SUCCESS(f'สร้าง/ตรวจสอบ รายวิชาเรียบร้อย ({len(course_objs)} วิชา)'))

        # 5. สร้างข้อมูลนักศึกษา
        students_data = [
            {
                'student_id': '6601001', 'title': 'นาย', 'first_name': 'กฤษณะ', 'last_name': 'แก้วมณี',
                'gender': 'M', 'date_of_birth': date(2004, 5, 12), 'email': 'kritsana.k@mail.university.ac.th',
                'phone': '0891112233', 'department': dept_objs['CPE'], 'advisor': teacher_objs['T1001'],
                'year_level': 2, 'status': 'ACTIVE', 'address': '123/45 ถ.พหลโยธิน จ.กรุงเทพฯ'
            },
            {
                'student_id': '6601002', 'title': 'นางสาว', 'first_name': 'พิมพ์ชนก', 'last_name': 'วิเศษสมบูรณ์',
                'gender': 'F', 'date_of_birth': date(2004, 8, 20), 'email': 'pimchanok.w@mail.university.ac.th',
                'phone': '0892223344', 'department': dept_objs['IT'], 'advisor': teacher_objs['T1002'],
                'year_level': 2, 'status': 'ACTIVE', 'address': '88 ม.2 ถ.มิตรภาพ จ.นครราชสีมา'
            },
            {
                'student_id': '6501003', 'title': 'นาย', 'first_name': 'ธนากร', 'last_name': 'ประเสริฐยิ่ง',
                'gender': 'M', 'date_of_birth': date(2003, 3, 15), 'email': 'thanakorn.p@mail.university.ac.th',
                'phone': '0893334455', 'department': dept_objs['SE'], 'advisor': teacher_objs['T1003'],
                'year_level': 3, 'status': 'ACTIVE', 'address': '456 ถ.สุขุมวิท จ.ชลบุรี'
            },
            {
                'student_id': '6701004', 'title': 'นางสาว', 'first_name': 'ณัฐนันท์', 'last_name': 'เตชะสกุล',
                'gender': 'F', 'date_of_birth': date(2005, 11, 5), 'email': 'nathanan.t@mail.university.ac.th',
                'phone': '0894445566', 'department': dept_objs['DS'], 'advisor': teacher_objs['T1004'],
                'year_level': 1, 'status': 'ACTIVE', 'address': '99/1 ถ.งามวงศ์วาน จ.นนทบุรี'
            },
            {
                'student_id': '6401005', 'title': 'นาย', 'first_name': 'ชลธี', 'last_name': 'วาทินสกุล',
                'gender': 'M', 'date_of_birth': date(2002, 1, 30), 'email': 'chonlathee.v@mail.university.ac.th',
                'phone': '0895556677', 'department': dept_objs['CPE'], 'advisor': teacher_objs['T1001'],
                'year_level': 4, 'status': 'GRADUATED', 'address': '77 ถ.รัชดาภิเษก จ.กรุงเทพฯ'
            },
        ]

        student_objs = {}
        for s in students_data:
            obj, created = Student.objects.get_or_create(student_id=s['student_id'], defaults=s)
            student_objs[s['student_id']] = obj

        self.stdout.write(self.style.SUCCESS(f'สร้าง/ตรวจสอบ นักศึกษาเรียบร้อย ({len(student_objs)} คน)'))

        # 6. สร้างข้อมูลการลงทะเบียนเรียนและบันทึกเกรด
        enrollments_data = [
            # กฤษณะ (CPE ปี 2)
            {'student': student_objs['6601001'], 'course': course_objs['CPE101'], 'semester': '1/2568', 'academic_year': 2568, 'grade': 'A', 'status': 'COMPLETED'},
            {'student': student_objs['6601001'], 'course': course_objs['CPE201'], 'semester': '2/2568', 'academic_year': 2568, 'grade': 'B+', 'status': 'COMPLETED'},
            {'student': student_objs['6601001'], 'course': course_objs['IT301'], 'semester': '1/2569', 'academic_year': 2569, 'grade': None, 'status': 'ENROLLED'},

            # พิมพ์ชนก (IT ปี 2)
            {'student': student_objs['6601002'], 'course': course_objs['CPE101'], 'semester': '1/2568', 'academic_year': 2568, 'grade': 'A', 'status': 'COMPLETED'},
            {'student': student_objs['6601002'], 'course': course_objs['IT301'], 'semester': '1/2569', 'academic_year': 2569, 'grade': 'A', 'status': 'COMPLETED'},

            # ธนากร (SE ปี 3)
            {'student': student_objs['6501003'], 'course': course_objs['CPE101'], 'semester': '1/2567', 'academic_year': 2567, 'grade': 'B', 'status': 'COMPLETED'},
            {'student': student_objs['6501003'], 'course': course_objs['SE202'], 'semester': '2/2567', 'academic_year': 2567, 'grade': 'B+', 'status': 'COMPLETED'},
            {'student': student_objs['6501003'], 'course': course_objs['IT301'], 'semester': '1/2568', 'academic_year': 2568, 'grade': 'A', 'status': 'COMPLETED'},

            # ณัฐนันท์ (DS ปี 1)
            {'student': student_objs['6701004'], 'course': course_objs['CPE101'], 'semester': '1/2569', 'academic_year': 2569, 'grade': None, 'status': 'ENROLLED'},
            {'student': student_objs['6701004'], 'course': course_objs['DS102'], 'semester': '1/2569', 'academic_year': 2569, 'grade': None, 'status': 'ENROLLED'},

            # ชลธี (CPE บัณฑิต)
            {'student': student_objs['6401005'], 'course': course_objs['CPE101'], 'semester': '1/2566', 'academic_year': 2566, 'grade': 'A', 'status': 'COMPLETED'},
            {'student': student_objs['6401005'], 'course': course_objs['CPE201'], 'semester': '2/2566', 'academic_year': 2566, 'grade': 'A', 'status': 'COMPLETED'},
            {'student': student_objs['6401005'], 'course': course_objs['SE202'], 'semester': '1/2567', 'academic_year': 2567, 'grade': 'B+', 'status': 'COMPLETED'},
        ]

        for e in enrollments_data:
            enrollment, _ = Enrollment.objects.get_or_create(
                student=e['student'],
                course=e['course'],
                semester=e['semester'],
                academic_year=e['academic_year'],
                defaults=e
            )

        # คำนวณ GPA ให้นักศึกษาทุกคน
        for s in student_objs.values():
            s.calculate_gpa()

        self.stdout.write(self.style.SUCCESS('สร้างการลงทะเบียนและคำนวณ GPA อัตโนมัติเสร็จสิ้น!'))
        self.stdout.write(self.style.SUCCESS('=== ฐานข้อมูลพร้อมสำหรับการทดสอบและใช้งานแล้ว ==='))

