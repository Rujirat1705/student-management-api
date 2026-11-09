from rest_framework import viewsets, filters, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Avg, Count
from drf_spectacular.utils import extend_schema, OpenApiResponse

from .models import Department, Teacher, Course, Student, Enrollment
from .serializers import (
    DepartmentSerializer,
    TeacherSerializer,
    CourseSerializer,
    StudentSerializer,
    StudentDetailSerializer,
    EnrollmentSerializer,
)


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission:
    - GET / HEAD / OPTIONS → ทุกคนที่ล็อกอินแล้วทำได้
    - POST / PUT / PATCH / DELETE → เฉพาะ Admin (is_staff) เท่านั้น
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_staff or request.user.is_superuser


class DepartmentViewSet(viewsets.ModelViewSet):
    """
    CRUD API สำหรับจัดการข้อมูลภาควิชา
    - รองรับการค้นหาตามรหัส (code) หรือชื่อ (name)
    - รองรับการเรียงลำดับ
    - Admin เท่านั้น: เพิ่ม / แก้ไข / ลบ
    """
    permission_classes = (IsAdminOrReadOnly,)
    queryset = Department.objects.all().prefetch_related('students', 'courses')
    serializer_class = DepartmentSerializer
    filter_backends = (filters.SearchFilter, filters.OrderingFilter)
    search_fields = ('code', 'name', 'faculty')
    ordering_fields = ('code', 'name', 'created_at')
    ordering = ('code',)


class TeacherViewSet(viewsets.ModelViewSet):
    """
    CRUD API สำหรับจัดการข้อมูลอาจารย์
    - รองรับการกรองตามภาควิชา (department)
    - รองรับการค้นหาตามชื่อ-นามสกุล, รหัสอาจารย์, อีเมล
    - Admin เท่านั้น: เพิ่ม / แก้ไข / ลบ
    """
    permission_classes = (IsAdminOrReadOnly,)
    queryset = Teacher.objects.select_related('department').all()
    serializer_class = TeacherSerializer
    filter_backends = (DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter)
    filterset_fields = ('department',)
    search_fields = ('teacher_code', 'first_name', 'last_name', 'email')
    ordering_fields = ('teacher_code', 'first_name', 'last_name')
    ordering = ('teacher_code',)


class CourseViewSet(viewsets.ModelViewSet):
    """
    CRUD API สำหรับจัดการข้อมูลรายวิชา
    - รองรับการกรองตามภาควิชา (department) หรืออาจารย์ผู้สอน (instructor)
    - รองรับการค้นหารหัสวิชา หรือชื่อวิชา
    - Admin เท่านั้น: เพิ่ม / แก้ไข / ลบ
    """
    permission_classes = (IsAdminOrReadOnly,)
    queryset = Course.objects.select_related('department', 'instructor').prefetch_related('enrollments').all()
    serializer_class = CourseSerializer
    filter_backends = (DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter)
    filterset_fields = ('department', 'instructor', 'credits')
    search_fields = ('course_code', 'name')
    ordering_fields = ('course_code', 'name', 'credits')
    ordering = ('course_code',)


class StudentViewSet(viewsets.ModelViewSet):
    """
    CRUD API สำหรับจัดการข้อมูลนักศึกษา
    - ดูรายละเอียดแบบเจาะลึกพร้อมประวัติการเรียน
    - กรองข้อมูลตาม ภาควิชา, ชั้นปี, เพศ, สถานะ, อาจารย์ที่ปรึกษา
    - ค้นหาด้วยรหัสนักศึกษา, ชื่อ, นามสกุล หรืออีเมล
    - Admin เท่านั้น: เพิ่ม / แก้ไข / ลบ
    """
    permission_classes = (IsAdminOrReadOnly,)
    queryset = Student.objects.select_related('department', 'advisor').prefetch_related('enrollments__course').all()
    filter_backends = (DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter)
    filterset_fields = ('department', 'year_level', 'status', 'gender', 'advisor')
    search_fields = ('student_id', 'first_name', 'last_name', 'email')
    ordering_fields = ('student_id', 'first_name', 'last_name', 'gpa', 'year_level', 'created_at')
    ordering = ('student_id',)

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return StudentDetailSerializer
        return StudentSerializer

    @action(detail=True, methods=['get'])
    def enrollments(self, request, pk=None):
        """ดูรายการวิชาที่นักศึกษาคนนี้ลงทะเบียนทั้งหมด"""
        student = self.get_object()
        enrollments = student.enrollments.all()
        serializer = EnrollmentSerializer(enrollments, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def recalculate_gpa(self, request, pk=None):
        """สั่งคำนวณ GPA ของนักศึกษาใหม่จากวิชาที่บันทึกผลการเรียนแล้ว"""
        student = self.get_object()
        new_gpa = student.calculate_gpa()
        return Response({
            "message": "คำนวณเกรดเฉลี่ยใหม่สำเร็จ",
            "student_id": student.student_id,
            "full_name": student.full_name,
            "gpa": str(new_gpa)
        }, status=status.HTTP_200_OK)


class EnrollmentViewSet(viewsets.ModelViewSet):
    """
    CRUD API สำหรับจัดการการลงทะเบียนและผลการเรียน
    - บันทึกการลงทะเบียน
    - ตัดเกรด/อัปเดตเกรด
    - กรองตามนักศึกษา, รายวิชา, ภาคการศึกษา, ปีการศึกษา และสถานะ
    - Admin เท่านั้น: เพิ่ม / แก้ไข / ลบ / บันทึกเกรด
    """
    permission_classes = (IsAdminOrReadOnly,)
    queryset = Enrollment.objects.select_related('student', 'course').all()
    serializer_class = EnrollmentSerializer
    filter_backends = (DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter)
    filterset_fields = ('student', 'course', 'semester', 'academic_year', 'status', 'grade')
    search_fields = ('student__student_id', 'student__first_name', 'course__course_code', 'course__name')
    ordering_fields = ('academic_year', 'semester', 'enrolled_at')
    ordering = ('-academic_year', 'semester')


class DashboardStatsView(APIView):
    """
    API สรุปภาพรวมสถิติของระบบ (Dashboard Metrics)
    """
    permission_classes = (permissions.AllowAny,)

    @extend_schema(
        summary="สถิติภาพรวมระบบ",
        description="แสดงข้อมูลสรุปจำนวนนักศึกษา, อาจารย์, รายวิชา, ภาควิชา, สถิติการลงทะเบียน และเกรดเฉลี่ยรวม",
        responses={200: OpenApiResponse(description="ข้อมูลสรุปสถิติภาพรวม")}
    )
    def get(self, request):
        total_students = Student.objects.count()
        active_students = Student.objects.filter(status='ACTIVE').count()
        graduated_students = Student.objects.filter(status='GRADUATED').count()
        total_teachers = Teacher.objects.count()
        total_courses = Course.objects.count()
        total_departments = Department.objects.count()
        total_enrollments = Enrollment.objects.count()

        avg_gpa = Student.objects.filter(status='ACTIVE').aggregate(avg=Avg('gpa'))['avg'] or 0.0

        students_by_department = (
            Department.objects.annotate(count=Count('students'))
            .values('id', 'code', 'name', 'count')
        )

        students_by_year = (
            Student.objects.values('year_level')
            .annotate(count=Count('id'))
            .order_by('year_level')
        )

        return Response({
            "summary": {
                "total_students": total_students,
                "active_students": active_students,
                "graduated_students": graduated_students,
                "total_teachers": total_teachers,
                "total_courses": total_courses,
                "total_departments": total_departments,
                "total_enrollments": total_enrollments,
                "average_gpa": round(float(avg_gpa), 2),
            },
            "students_by_department": list(students_by_department),
            "students_by_year": list(students_by_year),
        })
