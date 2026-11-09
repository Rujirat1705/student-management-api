"""
URL Configuration for student_system project.
"""

from pathlib import Path
from django.contrib import admin
from django.urls import path, include, re_path
from django.http import JsonResponse, HttpResponse
from django.views.static import serve
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR.parent / 'frontend'
if not FRONTEND_DIR.exists():
    FRONTEND_DIR = BASE_DIR / 'frontend'


def serve_index(request):
    """เปิดหน้าเว็บ Frontend Single Page Dashboard ทันทีที่ root /"""
    index_file = FRONTEND_DIR / 'index.html'
    if index_file.exists():
        with open(index_file, 'r', encoding='utf-8') as f:
            return HttpResponse(f.read(), content_type='text/html; charset=utf-8')
    return api_root(request)


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
    # RESTful API Root JSON สำหรับ Backend
    path('', api_root, name='api-root'),
    path('app/', serve_index, name='frontend-home'),
    path('admin/', admin.site.urls),

    # Authentication Endpoints
    path('api/auth/', include('accounts.urls')),

    # Core System Endpoints (Students, Courses, Teachers, Departments, Enrollments)
    path('api/', include('students.urls')),

    # OpenAPI 3 / Swagger Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # Static assets สำหรับ Frontend (css, js)
    re_path(r'^(?P<path>(css|js)/.*)$', serve, {'document_root': FRONTEND_DIR}),
]
