"""
URL Configuration for student_system project.
"""

from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)


def api_root(request):
    """ยินดีต้อนรับสู่ RESTful API สำหรับระบบบริหารจัดการข้อมูลนักศึกษา"""
    return JsonResponse({
        "project": "Student Management System RESTful API",
        "version": "1.0.0",
        "academic_year": "2569",
        "documentation": {
            "swagger_ui": "/api/docs/",
            "redoc": "/api/redoc/",
            "openapi_schema": "/api/schema/",
        },
        "endpoints": {
            "authentication": {
                "register": "/api/auth/register/",
                "login": "/api/auth/login/",
                "token_refresh": "/api/auth/refresh/",
                "user_profile": "/api/auth/profile/",
            },
            "resources": {
                "departments": "/api/departments/",
                "teachers": "/api/teachers/",
                "courses": "/api/courses/",
                "students": "/api/students/",
                "enrollments": "/api/enrollments/",
                "dashboard_stats": "/api/dashboard/stats/",
            }
        }
    })


urlpatterns = [
    path('', api_root, name='api-root'),
    path('admin/', admin.site.urls),

    # Authentication Endpoints
    path('api/auth/', include('accounts.urls')),

    # Core System Endpoints (Students, Courses, Teachers, Departments, Enrollments)
    path('api/', include('students.urls')),

    # OpenAPI 3 / Swagger Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]
