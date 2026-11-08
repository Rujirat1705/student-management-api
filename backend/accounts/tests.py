from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth.models import User


class AccountsAuthTests(APITestCase):
    def test_user_registration(self):
        """ทดสอบการลงทะเบียนผู้ใช้ใหม่และการได้ JWT Token"""
        url = reverse('auth_register')
        data = {
            'username': 'newuser1',
            'email': 'newuser1@test.com',
            'password': 'Password123!',
            'password_confirm': 'Password123!',
            'first_name': 'สมหมาย',
            'last_name': 'มุ่งมั่น'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('tokens', response.data)
        self.assertIn('access', response.data['tokens'])

    def test_user_login(self):
        """ทดสอบการเข้าสู่ระบบเพื่อรับ Token"""
        User.objects.create_user(username='loginuser', email='login@test.com', password='Password123!')
        url = reverse('token_obtain_pair')
        data = {
            'username': 'loginuser',
            'password': 'Password123!'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
