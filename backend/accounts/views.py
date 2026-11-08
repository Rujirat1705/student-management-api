from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from .serializers import RegisterSerializer, UserSerializer


class RegisterView(generics.CreateAPIView):
    """
    API สำหรับสมัครสมาชิกผู้ใช้งานใหม่
    เมื่อสมัครสำเร็จจะส่ง JWT Token (Access & Refresh) และข้อมูลผู้ใช้กลับมาทันที
    """
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

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
