from django.contrib import admin
from .models import Department, Teacher, Course, Student, Enrollment


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'faculty', 'created_at')
    search_fields = ('code', 'name', 'faculty')


@admin.register(Teacher)
class TeacherAdmin(admin.ModelAdmin):
    list_display = ('teacher_code', 'title', 'first_name', 'last_name', 'department', 'email', 'phone')
    list_filter = ('department',)
    search_fields = ('teacher_code', 'first_name', 'last_name', 'email')


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('course_code', 'name', 'credits', 'department', 'instructor')
    list_filter = ('department', 'credits')
    search_fields = ('course_code', 'name')


class EnrollmentInline(admin.TabularInline):
    model = Enrollment
    extra = 1


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('student_id', 'title', 'first_name', 'last_name', 'department', 'year_level', 'status', 'gpa')
    list_filter = ('department', 'year_level', 'status', 'gender')
    search_fields = ('student_id', 'first_name', 'last_name', 'email')
    inlines = [EnrollmentInline]
    readonly_fields = ('gpa', 'created_at', 'updated_at')


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ('student', 'course', 'semester', 'academic_year', 'grade', 'status', 'enrolled_at')
    list_filter = ('semester', 'academic_year', 'status', 'grade', 'course')
    search_fields = ('student__student_id', 'student__first_name', 'course__course_code', 'course__name')
