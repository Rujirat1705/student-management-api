from django.db import models
from django.db.models import Avg
from decimal import Decimal


GRADE_POINTS = {
    'A': Decimal('4.00'),
    'B+': Decimal('3.50'),
    'B': Decimal('3.00'),
    'C+': Decimal('2.50'),
    'C': Decimal('2.00'),
    'D+': Decimal('1.50'),
    'D': Decimal('1.00'),
    'F': Decimal('0.00'),
}


class Department(models.Model):
    """โมเดลข้อมูลภาควิชา / คณะ"""
    code = models.CharField(max_length=20, unique=True, verbose_name="รหัสภาควิชา")
    name = models.CharField(max_length=150, verbose_name="ชื่อภาควิชา")
    faculty = models.CharField(max_length=150, default="คณะเทคโนโลยีและวิทยาการคอมพิวเตอร์", verbose_name="คณะ")
    description = models.TextField(blank=True, verbose_name="รายละเอียด")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="สร้างเมื่อ")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="อัปเดตเมื่อ")

    class Meta:
        verbose_name = "ภาควิชา"
        verbose_name_plural = "ข้อมูลภาควิชา"
        ordering = ['code']

    def __str__(self):
        return f"{self.code} - {self.name}"


class Teacher(models.Model):
    """โมเดลข้อมูลอาจารย์ / อาจารย์ที่ปรึกษา"""
    teacher_code = models.CharField(max_length=20, unique=True, verbose_name="รหัสอาจารย์")
    title = models.CharField(max_length=30, default="อ.", verbose_name="คำนำหน้าชื่อ")
    first_name = models.CharField(max_length=100, verbose_name="ชื่อ")
    last_name = models.CharField(max_length=100, verbose_name="นามสกุล")
    email = models.EmailField(unique=True, verbose_name="อีเมล")
    phone = models.CharField(max_length=20, blank=True, verbose_name="เบอร์โทรศัพท์")
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='teachers', verbose_name="ภาควิชา")
    office = models.CharField(max_length=100, blank=True, verbose_name="ห้องทำงาน")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="สร้างเมื่อ")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="อัปเดตเมื่อ")

    class Meta:
        verbose_name = "อาจารย์"
        verbose_name_plural = "ข้อมูลอาจารย์"
        ordering = ['teacher_code']

    def __str__(self):
        return f"{self.title}{self.first_name} {self.last_name} ({self.teacher_code})"

    @property
    def full_name(self):
        return f"{self.title}{self.first_name} {self.last_name}"


class Course(models.Model):
    """โมเดลข้อมูลรายวิชา"""
    course_code = models.CharField(max_length=20, unique=True, verbose_name="รหัสวิชา")
    name = models.CharField(max_length=150, verbose_name="ชื่อรายวิชา")
    credits = models.IntegerField(default=3, verbose_name="หน่วยกิต")
    description = models.TextField(blank=True, verbose_name="คำอธิบายรายวิชา")
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='courses', verbose_name="ภาควิชา")
    instructor = models.ForeignKey(Teacher, on_delete=models.SET_NULL, null=True, blank=True, related_name='teaching_courses', verbose_name="ผู้สอนหลัก")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="สร้างเมื่อ")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="อัปเดตเมื่อ")

    class Meta:
        verbose_name = "รายวิชา"
        verbose_name_plural = "ข้อมูลรายวิชา"
        ordering = ['course_code']

    def __str__(self):
        return f"{self.course_code} {self.name} ({self.credits} หน่วยกิต)"


class Student(models.Model):
    """โมเดลข้อมูลนักศึกษา"""
    GENDER_CHOICES = (
        ('M', 'ชาย'),
        ('F', 'หญิง'),
        ('OTHER', 'อื่นๆ'),
    )

    STATUS_CHOICES = (
        ('ACTIVE', 'กำลังศึกษา'),
        ('GRADUATED', 'สำเร็จการศึกษา'),
        ('SUSPENDED', 'พักการเรียน'),
        ('DROPPED', 'พ้นสภาพ'),
    )

    student_id = models.CharField(max_length=20, unique=True, db_index=True, verbose_name="รหัสนักศึกษา")
    title = models.CharField(max_length=20, default="นาย", verbose_name="คำนำหน้าชื่อ")
    first_name = models.CharField(max_length=100, verbose_name="ชื่อ")
    last_name = models.CharField(max_length=100, verbose_name="นามสกุล")
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, default='M', verbose_name="เพศ")
    date_of_birth = models.DateField(null=True, blank=True, verbose_name="วันเดือนปีเกิด")
    email = models.EmailField(unique=True, verbose_name="อีเมล")
    phone = models.CharField(max_length=20, blank=True, verbose_name="เบอร์โทรศัพท์")
    address = models.TextField(blank=True, verbose_name="ที่อยู่")
    department = models.ForeignKey(Department, on_delete=models.PROTECT, related_name='students', verbose_name="ภาควิชา/สาขาวิชา")
    advisor = models.ForeignKey(Teacher, on_delete=models.SET_NULL, null=True, blank=True, related_name='advisees', verbose_name="อาจารย์ที่ปรึกษา")
    year_level = models.PositiveSmallIntegerField(default=1, verbose_name="ชั้นปี")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE', verbose_name="สถานะภาพนักศึกษา")
    gpa = models.DecimalField(max_digits=4, decimal_places=2, default=Decimal('0.00'), verbose_name="เกรดเฉลี่ยสะสม (GPA)")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="สร้างเมื่อ")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="อัปเดตเมื่อ")

    class Meta:
        verbose_name = "นักศึกษา"
        verbose_name_plural = "ข้อมูลนักศึกษา"
        ordering = ['student_id']

    def __str__(self):
        return f"{self.student_id} - {self.first_name} {self.last_name}"

    @property
    def full_name(self):
        return f"{self.title}{self.first_name} {self.last_name}"

    def calculate_gpa(self):
        """คำนวณ GPA จากรายวิชาที่ลงทะเบียนและมีเกรดแล้ว"""
        valid_enrollments = self.enrollments.filter(grade__in=GRADE_POINTS.keys())
        total_points = Decimal('0.00')
        total_credits = 0

        for enrollment in valid_enrollments:
            course_credit = enrollment.course.credits
            grade_point = GRADE_POINTS.get(enrollment.grade, Decimal('0.00'))
            total_points += (grade_point * course_credit)
            total_credits += course_credit

        if total_credits > 0:
            calculated = round(total_points / Decimal(total_credits), 2)
            self.gpa = calculated
        else:
            self.gpa = Decimal('0.00')
        self.save(update_fields=['gpa', 'updated_at'])
        return self.gpa


class Enrollment(models.Model):
    """โมเดลข้อมูลการลงทะเบียนเรียนและผลการเรียน"""
    GRADE_CHOICES = (
        ('A', 'A (4.0)'),
        ('B+', 'B+ (3.5)'),
        ('B', 'B (3.0)'),
        ('C+', 'C+ (2.5)'),
        ('C', 'C (2.0)'),
        ('D+', 'D+ (1.5)'),
        ('D', 'D (1.0)'),
        ('F', 'F (0.0)'),
        ('I', 'I (Incomplete)'),
        ('W', 'W (Withdraw)'),
    )

    STATUS_CHOICES = (
        ('ENROLLED', 'ลงทะเบียนเรียน'),
        ('COMPLETED', 'เรียนเสร็จสิ้น'),
        ('DROPPED', 'ถอนรายวิชา'),
    )

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='enrollments', verbose_name="นักศึกษา")
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments', verbose_name="รายวิชา")
    semester = models.CharField(max_length=10, default="1/2569", verbose_name="ภาคการศึกษา")
    academic_year = models.PositiveIntegerField(default=2569, verbose_name="ปีการศึกษา")
    grade = models.CharField(max_length=5, blank=True, null=True, choices=GRADE_CHOICES, verbose_name="เกรด")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ENROLLED', verbose_name="สถานะการลงทะเบียน")
    enrolled_at = models.DateTimeField(auto_now_add=True, verbose_name="วันที่ลงทะเบียน")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="อัปเดตเมื่อ")

    class Meta:
        verbose_name = "การลงทะเบียนเรียน"
        verbose_name_plural = "ข้อมูลการลงทะเบียนเรียน"
        unique_together = ('student', 'course', 'semester', 'academic_year')
        ordering = ['-academic_year', 'semester', 'course']

    def __str__(self):
        return f"{self.student.student_id} - {self.course.course_code} ({self.semester})"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # คำนวณ GPA ให้นักศึกษาอัตโนมัติเมื่อมีการบันทึกผลการเรียน
        self.student.calculate_gpa()
