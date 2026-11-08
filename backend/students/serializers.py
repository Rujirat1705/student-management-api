from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from .models import Department, Teacher, Course, Student, Enrollment


class DepartmentSerializer(serializers.ModelSerializer):
    """Serializer สำหรับภาควิชา"""
    student_count = serializers.IntegerField(source='students.count', read_only=True)
    course_count = serializers.IntegerField(source='courses.count', read_only=True)

    class Meta:
        model = Department
        fields = ('id', 'code', 'name', 'faculty', 'description', 'student_count', 'course_count', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')


class TeacherSerializer(serializers.ModelSerializer):
    """Serializer สำหรับข้อมูลอาจารย์"""
    full_name = serializers.CharField(read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = Teacher
        fields = (
            'id', 'teacher_code', 'title', 'first_name', 'last_name',
            'full_name', 'email', 'phone', 'department', 'department_name',
            'office', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class CourseSerializer(serializers.ModelSerializer):
    """Serializer สำหรับรายวิชา"""
    department_name = serializers.CharField(source='department.name', read_only=True)
    instructor_name = serializers.CharField(source='instructor.full_name', read_only=True)
    enrolled_count = serializers.IntegerField(source='enrollments.count', read_only=True)

    class Meta:
        model = Course
        fields = (
            'id', 'course_code', 'name', 'credits', 'description',
            'department', 'department_name', 'instructor', 'instructor_name',
            'enrolled_count', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class EnrollmentSerializer(serializers.ModelSerializer):
    """Serializer สำหรับการลงทะเบียนเรียน"""
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    student_code = serializers.CharField(source='student.student_id', read_only=True)
    course_code = serializers.CharField(source='course.course_code', read_only=True)
    course_name = serializers.CharField(source='course.name', read_only=True)
    course_credits = serializers.IntegerField(source='course.credits', read_only=True)

    class Meta:
        model = Enrollment
        fields = (
            'id', 'student', 'student_code', 'student_name',
            'course', 'course_code', 'course_name', 'course_credits',
            'semester', 'academic_year', 'grade', 'status',
            'enrolled_at', 'updated_at'
        )
        read_only_fields = ('id', 'enrolled_at', 'updated_at')


class StudentSerializer(serializers.ModelSerializer):
    """Serializer สำหรับรายการข้อมูลนักศึกษา"""
    full_name = serializers.CharField(read_only=True)
    department_code = serializers.CharField(source='department.code', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    advisor_name = serializers.CharField(source='advisor.full_name', read_only=True)

    class Meta:
        model = Student
        fields = (
            'id', 'student_id', 'title', 'first_name', 'last_name', 'full_name',
            'gender', 'date_of_birth', 'email', 'phone', 'address',
            'department', 'department_code', 'department_name',
            'advisor', 'advisor_name', 'year_level', 'status', 'gpa',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'gpa', 'created_at', 'updated_at')


class StudentDetailSerializer(StudentSerializer):
    """Serializer สำหรับรายละเอียดนักศึกษาแบบเจาะลึก (รวมประวัติการลงทะเบียน)"""
    enrollments = EnrollmentSerializer(many=True, read_only=True)
    total_credits = serializers.SerializerMethodField()

    class Meta(StudentSerializer.Meta):
        fields = StudentSerializer.Meta.fields + ('enrollments', 'total_credits')

    @extend_schema_field(serializers.IntegerField())
    def get_total_credits(self, obj):
        return sum(e.course.credits for e in obj.enrollments.all())
