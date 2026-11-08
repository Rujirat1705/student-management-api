from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth.models import User
from students.models import Department, Teacher, Course, Student, Enrollment
from decimal import Decimal


class StudentManagementAPITests(APITestCase):
    def setUp(self):
        # สร้างผู้ใช้และ Login Token
        self.user = User.objects.create_user(username='testadmin', password='Password123!', is_staff=True)
        login_resp = self.client.post(reverse('token_obtain_pair'), {'username': 'testadmin', 'password': 'Password123!'})
        self.token = login_resp.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

        # สร้างข้อมูลพื้นฐาน
        self.dept = Department.objects.create(code='CPE', name='Computer Engineering')
        self.teacher = Teacher.objects.create(
            teacher_code='T01', title='ดร.', first_name='สมศักดิ์', last_name='รักเรียน',
            email='somsak@univ.ac.th', department=self.dept
        )
        self.course1 = Course.objects.create(
            course_code='CS101', name='Intro to Programming', credits=3,
            department=self.dept, instructor=self.teacher
        )
        self.course2 = Course.objects.create(
            course_code='CS102', name='Data Structures', credits=3,
            department=self.dept, instructor=self.teacher
        )
        self.student = Student.objects.create(
            student_id='6609999', title='นาย', first_name='สมชาย', last_name='เข้มแข็ง',
            email='somchai@student.univ.ac.th', department=self.dept, advisor=self.teacher, year_level=2
        )

    def test_list_students(self):
        """ทดสอบดึงรายการนักศึกษา"""
        response = self.client.get(reverse('student-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(response.data['count'], 1)

    def test_create_student(self):
        """ทดสอบสร้างนักศึกษาใหม่ (CRUD - Create)"""
        data = {
            'student_id': '6608888',
            'title': 'นางสาว',
            'first_name': 'วรรณา',
            'last_name': 'ใจงาม',
            'gender': 'F',
            'email': 'wanna@student.univ.ac.th',
            'department': self.dept.id,
            'advisor': self.teacher.id,
            'year_level': 1,
            'status': 'ACTIVE'
        }
        response = self.client.post(reverse('student-list'), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['student_id'], '6608888')

    def test_gpa_calculation_on_enrollment(self):
        """ทดสอบการคำนวณ GPA อัตโนมัติเมื่อลงทะเบียนและได้เกรด"""
        # ลงทะเบียนวิชาที่ 1 ได้เกรด A (4.0) 3 หน่วยกิต
        e1 = Enrollment.objects.create(
            student=self.student, course=self.course1,
            semester='1/2569', academic_year=2569, grade='A', status='COMPLETED'
        )
        self.student.refresh_from_db()
        self.assertEqual(self.student.gpa, Decimal('4.00'))

        # ลงทะเบียนวิชาที่ 2 ได้เกรด B (3.0) 3 หน่วยกิต -> GPA เฉลี่ยควรเป็น (4*3 + 3*3)/6 = 3.50
        e2 = Enrollment.objects.create(
            student=self.student, course=self.course2,
            semester='2/2569', academic_year=2569, grade='B', status='COMPLETED'
        )
        self.student.refresh_from_db()
        self.assertEqual(self.student.gpa, Decimal('3.50'))

    def test_dashboard_stats(self):
        """ทดสอบ Dashboard Stats API"""
        response = self.client.get(reverse('dashboard_stats'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('summary', response.data)
        self.assertIn('total_students', response.data['summary'])

    def test_swagger_schema_accessible(self):
        """ทดสอบ Swagger Schema OpenAPI 3"""
        response = self.client.get(reverse('schema'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
