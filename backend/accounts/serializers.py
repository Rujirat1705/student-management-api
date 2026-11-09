from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.db.models import Q


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Serializer สำหรับ Login โดยรองรับทั้ง email และ username
    รับ field ชื่อ 'email' หรือ 'username' ก็ได้ทั้งคู่
    และตรวจสอบว่านิสิต/อาจารย์ต้องใช้อีเมลโดเมน @ok.prolay เท่านั้น
    """
    # เพิ่ม field 'email' เพื่อให้ Postman / client ส่ง email มาได้โดยตรง
    email = serializers.CharField(required=False, allow_blank=True, write_only=True)

    def validate(self, attrs):
        # รับได้ทั้ง 'email' และ 'username' field
        username_or_email = (
            attrs.get('email') or attrs.get('username') or ''
        ).strip()

        user = None
        if username_or_email:
            user = User.objects.filter(
                Q(email__iexact=username_or_email) | Q(username__iexact=username_or_email)
            ).first()

        if user:
            # ผู้ใช้งานทั่วไป (นิสิต/อาจารย์) ต้องเป็นโดเมน @ok.prolay เท่านั้น
            if not user.is_staff and not user.is_superuser:
                if not (user.email and user.email.lower().endswith('@ok.prolay')):
                    raise serializers.ValidationError({"detail": "เข้าสู่ระบบไม่สำเร็จ: อนุญาตเฉพาะอีเมลโดเมน @ok.prolay เท่านั้น"})
            attrs['username'] = user.username
        else:
            if '@' in username_or_email and not username_or_email.lower().endswith('@ok.prolay'):
                raise serializers.ValidationError({"detail": "เข้าสู่ระบบไม่สำเร็จ: อนุญาตเฉพาะอีเมลโดเมน @ok.prolay เท่านั้น"})
            # ถ้าหาไม่เจอเลยให้ตั้ง username เป็นค่าที่ส่งมาเพื่อให้ parent validate ทำ error เอง
            if not attrs.get('username'):
                attrs['username'] = username_or_email

        return super().validate(attrs)


class UserSerializer(serializers.ModelSerializer):
    """Serializer สำหรับแสดงข้อมูลผู้ใช้งาน"""
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'is_staff', 'date_joined')
        read_only_fields = ('id', 'is_staff', 'date_joined')


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer สำหรับการลงทะเบียนผู้ใช้งานใหม่ (บังคับอีเมล @ok.prolay)"""
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
            'first_name': {'required': False, 'allow_blank': True},
            'last_name': {'required': False, 'allow_blank': True},
            'email': {'required': True},
        }

    def validate(self, attrs):
        if attrs.get('password') != attrs.get('password_confirm'):
            raise serializers.ValidationError({"password": "รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน"})

        email = attrs.get('email', '').strip().lower()
        if not email.endswith('@ok.prolay'):
            raise serializers.ValidationError({"email": "อีเมลต้องลงท้ายด้วย @ok.prolay เท่านั้น"})

        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError({"email": "อีเมลนี้มีผู้ใช้งานในระบบแล้ว"})

        # สร้าง username อัตโนมัติจาก email ให้ปลอดภัยและไม่ซ้ำในระบบ
        raw_user = (attrs.get('username') or email.split('@')[0]).strip()
        clean_user = "".join(c for c in raw_user if c.isalnum() or c in ['_', '.']) or 'user'
        username = clean_user
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{clean_user}{counter}"
            counter += 1
        attrs['username'] = username

        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'].strip().lower(),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user
