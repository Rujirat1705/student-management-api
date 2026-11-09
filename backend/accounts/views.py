from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth.models import User
from .serializers import RegisterSerializer, UserSerializer, CustomTokenObtainPairSerializer


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    API สำหรับเข้าสู่ระบบ โดยรองรับการเข้าสู่ระบบด้วย Email หรือ Username
    """
    serializer_class = CustomTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    """
    API สำหรับสมัครสมาชิกผู้ใช้งานใหม่
    เมื่อสมัครสำเร็จจะส่ง JWT Token (Access & Refresh) และสร้างข้อมูล Student ให้อัตโนมัติ
    """
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # สร้างข้อมูล Student อัตโนมัติและผูกกับผู้สมัครทันที
        try:
            from students.models import Student, Department, Teacher
            dept = Department.objects.first()
            if not dept:
                dept = Department.objects.create(code='CPE', name='วิศวกรรมคอมพิวเตอร์', faculty='คณะวิศวกรรมศาสตร์')
            advisor = Teacher.objects.first()
            Student.objects.update_or_create(
                email=user.email,
                defaults={
                    'student_id': user.username,
                    'title': 'นาย',
                    'first_name': user.first_name or user.username,
                    'last_name': user.last_name or '',
                    'gender': 'M',
                    'date_of_birth': '2005-01-01',
                    'phone': '0890000000',
                    'department': dept,
                    'advisor': advisor,
                    'year_level': 1,
                    'status': 'ACTIVE',
                    'gpa': 0.00
                }
            )
        except Exception as e:
            pass

        # สร้าง JWT token สำหรับผู้ใช้ใหม่ทันที
        refresh = RefreshToken.for_user(user)

        return Response({
            "message": "สมัครสมาชิกสำเร็จ",
            "user": UserSerializer(user).data,
            "tokens": {
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    API สำหรับดูและแก้ไขข้อมูลส่วนตัวของผู้ใช้งานที่เข้าสู่ระบบ
    """
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user
