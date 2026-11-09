from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.db.models import Q


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Serializer สำหรับ Login โดยรองรับทั้ง Email และ Username
    """
    def validate(self, attrs):
        username_or_email = attrs.get('username')
        if username_or_email:
            user = User.objects.filter(
                Q(email__iexact=username_or_email) | Q(username__iexact=username_or_email)
            ).first()
            if user:
                attrs['username'] = user.username
        return super().validate(attrs)


class UserSerializer(serializers.ModelSerializer):
    """Serializer สำหรับแสดงข้อมูลผู้ใช้งาน"""
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'is_staff', 'date_joined')
        read_only_fields = ('id', 'is_staff', 'date_joined')


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer สำหรับการลงทะเบียนผู้ใช้งานใหม่ (ไม่ต้องใช้ username ใช้ email แทนได้)"""
    username = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=150
    )
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'password_confirm', 'first_name', 'last_name')
        extra_kwargs = {
            'first_name': {'required': False},
            'last_name': {'required': False},
            'email': {'required': True},
        }

    def validate(self, attrs):
        if attrs.get('password') != attrs.get('password_confirm'):
            raise serializers.ValidationError({"password": "รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน"})
        if User.objects.filter(email=attrs.get('email')).exists():
            raise serializers.ValidationError({"email": "อีเมลนี้มีผู้ใช้งานในระบบแล้ว"})

        # หากไม่ได้กรอก username ให้ดึงจาก email อัตโนมัติ
        if not attrs.get('username'):
            base_username = attrs['email'].split('@')[0]
            username = base_username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1
            attrs['username'] = username
        elif User.objects.filter(username=attrs.get('username')).exists():
            raise serializers.ValidationError({"username": "ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว"})

        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user
