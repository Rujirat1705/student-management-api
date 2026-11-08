/**
 * API Service Client Module
 * ทำหน้าที่เชื่อมต่อกับ Django RESTful API ผ่าน Fetch API
 * จัดการ JWT Token (Access/Refresh), จัดการ Error, และสลับระหว่าง Live API กับ Mock Demo Mode
 */

const API_STORAGE_KEYS = {
  BASE_URL: 'sms_api_base_url',
  ACCESS_TOKEN: 'sms_access_token',
  REFRESH_TOKEN: 'sms_refresh_token',
  USER_DATA: 'sms_user_data',
  USE_MOCK: 'sms_use_mock_mode',
};

class ApiService {
  constructor() {
    const savedUrl = localStorage.getItem(API_STORAGE_KEYS.BASE_URL);
    if (savedUrl) {
      this.baseUrl = savedUrl;
    } else if (window.location.protocol.startsWith('http') && window.location.hostname !== '127.0.0.1' && window.location.hostname !== 'localhost') {
      this.baseUrl = window.location.origin;
    } else {
      this.baseUrl = 'http://127.0.0.1:8000';
    }
    this.accessToken = localStorage.getItem(API_STORAGE_KEYS.ACCESS_TOKEN) || null;
    this.refreshToken = localStorage.getItem(API_STORAGE_KEYS.REFRESH_TOKEN) || null;
    this.user = JSON.parse(localStorage.getItem(API_STORAGE_KEYS.USER_DATA) || 'null');
    // เชื่อมต่อ API อัตโนมัติ ปิดโหมด Mock ถาวร
    this.isMockMode = false;
    localStorage.removeItem(API_STORAGE_KEYS.USE_MOCK);
    this.isServerOnline = false;
  }

  setBaseUrl(url) {
    let cleanUrl = url.trim();
    if (cleanUrl.endsWith('/')) {
      cleanUrl = cleanUrl.slice(0, -1);
    }
    this.baseUrl = cleanUrl;
    localStorage.setItem(API_STORAGE_KEYS.BASE_URL, cleanUrl);
  }

  setMockMode(enable) {
    this.isMockMode = false; // ล็อกให้เป็น false เสมอ (ไม่เปิด Mock)
    localStorage.removeItem(API_STORAGE_KEYS.USE_MOCK);
  }

  saveAuthTokens(tokens, userData = null) {
    if (tokens.access) {
      this.accessToken = tokens.access;
      localStorage.setItem(API_STORAGE_KEYS.ACCESS_TOKEN, tokens.access);
    }
    if (tokens.refresh) {
      this.refreshToken = tokens.refresh;
      localStorage.setItem(API_STORAGE_KEYS.REFRESH_TOKEN, tokens.refresh);
    }
    if (userData) {
      this.user = userData;
      localStorage.setItem(API_STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
    }
  }

  clearAuth() {
    this.accessToken = null;
    this.refreshToken = null;
    this.user = null;
    localStorage.removeItem(API_STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(API_STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(API_STORAGE_KEYS.USER_DATA);
  }

  isAuthenticated() {
    return !!this.accessToken;
  }

  isAdmin() {
    if (!this.user) return false;
    return this.user.is_staff === true || this.user.username === 'admin';
  }

  async checkServerHealth() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${this.baseUrl}/api/dashboard/stats/`, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      clearTimeout(timeoutId);
      this.isServerOnline = res.ok;
      return res.ok;
    } catch (err) {
      this.isServerOnline = false;
      return false;
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(url, { ...options, headers });

      // Handle 401 Unauthorized -> try refresh token once
      if (response.status === 401 && this.refreshToken && !options._isRetry) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          options._isRetry = true;
          return this.request(endpoint, options);
        } else {
          this.clearAuth();
          window.dispatchEvent(new CustomEvent('auth-changed'));
        }
      }

      if (response.status === 204) {
        return null; // No Content
      }

      const data = await response.json();
      if (!response.ok) {
        const errorMsg = data.detail || data.error || (typeof data === 'object' ? JSON.stringify(data) : 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
        throw new Error(errorMsg);
      }
      return data;
    } catch (error) {
      throw error;
    }
  }

  async refreshAccessToken() {
    try {
      const res = await fetch(`${this.baseUrl}/api/auth/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: this.refreshToken }),
      });
      if (res.ok) {
        const data = await res.json();
        this.saveAuthTokens({ access: data.access });
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  // =================== AUTHENTICATION ===================
  async login(username, password) {
    if (this.isMockMode) {
      const isSuper = username === 'admin';
      const mockUser = {
        id: 1,
        username: username,
        email: `${username}@university.ac.th`,
        first_name: isSuper ? 'ผู้ดูแล' : 'ภานุพงศ์',
        last_name: isSuper ? 'ระบบกลาง' : 'มณีโรจน์',
        is_staff: isSuper,
      };
      this.saveAuthTokens({ access: 'mock_jwt_access_token_xyz', refresh: 'mock_jwt_refresh_token_xyz' }, mockUser);
      return { user: mockUser, tokens: { access: 'mock_jwt_access_token_xyz' } };
    }

    const data = await this.request('/api/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    this.saveAuthTokens(data);

    // Fetch user profile
    try {
      const profile = await this.getProfile();
      this.user = profile;
      localStorage.setItem(API_STORAGE_KEYS.USER_DATA, JSON.stringify(profile));
    } catch (e) {
      this.user = { username };
    }

    return data;
  }

  async register(formData) {
    if (this.isMockMode) {
      const mockUser = {
        id: Date.now(),
        username: formData.username,
        email: formData.email,
        first_name: formData.first_name || '',
        last_name: formData.last_name || '',
        is_staff: false,
      };
      this.saveAuthTokens({ access: 'mock_jwt_access_token_xyz', refresh: 'mock_jwt_refresh_token_xyz' }, mockUser);
      return { message: 'สมัครสมาชิกสำเร็จ (Mock Mode)', user: mockUser };
    }

    const data = await this.request('/api/auth/register/', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
    if (data.tokens) {
      this.saveAuthTokens(data.tokens, data.user);
    }
    return data;
  }

  async getProfile() {
    if (this.isMockMode) {
      return this.user || { username: 'Guest', email: 'guest@university.ac.th' };
    }
    return this.request('/api/auth/profile/');
  }

  // =================== DASHBOARD STATS ===================
  async getDashboardStats() {
    if (this.isMockMode) {
      const totalStudents = mockStudents.length;
      const activeStudents = mockStudents.filter(s => s.status === 'ACTIVE').length;
      const graduatedStudents = mockStudents.filter(s => s.status === 'GRADUATED').length;
      const totalGpa = mockStudents.reduce((acc, s) => acc + parseFloat(s.gpa || 0), 0);
      const avgGpa = totalStudents > 0 ? (totalGpa / totalStudents).toFixed(2) : 0.00;

      const deptMap = {};
      mockDepartments.forEach(d => { deptMap[d.id] = { id: d.id, code: d.code, name: d.name, count: 0 }; });
      mockStudents.forEach(s => {
        if (deptMap[s.department]) deptMap[s.department].count++;
      });

      const yearMap = { 1: 0, 2: 0, 3: 0, 4: 0 };
      mockStudents.forEach(s => {
        const y = s.year_level || 1;
        yearMap[y] = (yearMap[y] || 0) + 1;
      });

      return {
        summary: {
          total_students: totalStudents,
          active_students: activeStudents,
          graduated_students: graduatedStudents,
          total_teachers: mockTeachers.length,
          total_courses: mockCourses.length,
          total_departments: mockDepartments.length,
          total_enrollments: mockEnrollments.length,
          average_gpa: parseFloat(avgGpa),
        },
        students_by_department: Object.values(deptMap),
        students_by_year: Object.entries(yearMap).map(([yr, count]) => ({ year_level: parseInt(yr), count })),
      };
    }

    return this.request('/api/dashboard/stats/');
  }

  // =================== STUDENTS CRUD ===================
  async getStudents(params = {}) {
    if (this.isMockMode) {
      let filtered = [...mockStudents];
      if (params.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter(s =>
          s.student_id.toLowerCase().includes(q) ||
          s.first_name.toLowerCase().includes(q) ||
          s.last_name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q)
        );
      }
      if (params.department) {
        filtered = filtered.filter(s => s.department == params.department);
      }
      if (params.year_level) {
        filtered = filtered.filter(s => s.year_level == params.year_level);
      }
      if (params.status) {
        filtered = filtered.filter(s => s.status === params.status);
      }
      return { count: filtered.length, results: filtered };
    }

    const query = new URLSearchParams(params).toString();
    const endpoint = `/api/students/${query ? `?${query}` : ''}`;
    const res = await this.request(endpoint);
    // Handle both paginated ({ count, results }) and plain list
    if (Array.isArray(res)) {
      return { count: res.length, results: res };
    }
    return res;
  }

  async getStudent(id) {
    if (this.isMockMode) {
      const student = mockStudents.find(s => s.id === Number(id));
      if (!student) throw new Error('ไม่พบข้อมูลนักศึกษา');
      return student;
    }
    return this.request(`/api/students/${id}/`);
  }

  async createStudent(studentData) {
    if (this.isMockMode) {
      const dept = mockDepartments.find(d => d.id == studentData.department);
      const adv = mockTeachers.find(t => t.id == studentData.advisor);
      const newStudent = {
        id: Date.now(),
        ...studentData,
        department: Number(studentData.department),
        department_code: dept ? dept.code : '',
        department_name: dept ? dept.name : '',
        advisor: studentData.advisor ? Number(studentData.advisor) : null,
        advisor_name: adv ? adv.full_name : '',
        full_name: `${studentData.title || ''}${studentData.first_name} ${studentData.last_name}`,
        gpa: '0.00',
        enrollments: [],
      };
      mockStudents.unshift(newStudent);
      return newStudent;
    }
    return this.request('/api/students/', {
      method: 'POST',
      body: JSON.stringify(studentData),
    });
  }

  async updateStudent(id, studentData) {
    if (this.isMockMode) {
      const idx = mockStudents.findIndex(s => s.id === Number(id));
      if (idx === -1) throw new Error('ไม่พบข้อมูลนักศึกษา');
      const dept = mockDepartments.find(d => d.id == studentData.department);
      const adv = mockTeachers.find(t => t.id == studentData.advisor);
      const updated = {
        ...mockStudents[idx],
        ...studentData,
        department: Number(studentData.department),
        department_code: dept ? dept.code : mockStudents[idx].department_code,
        department_name: dept ? dept.name : mockStudents[idx].department_name,
        advisor: studentData.advisor ? Number(studentData.advisor) : null,
        advisor_name: adv ? adv.full_name : '',
        full_name: `${studentData.title || ''}${studentData.first_name} ${studentData.last_name}`,
      };
      mockStudents[idx] = updated;
      return updated;
    }
    return this.request(`/api/students/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(studentData),
    });
  }

  async deleteStudent(id) {
    if (this.isMockMode) {
      mockStudents = mockStudents.filter(s => s.id !== Number(id));
      mockEnrollments = mockEnrollments.filter(e => e.student !== Number(id));
      return { success: true };
    }
    return this.request(`/api/students/${id}/`, {
      method: 'DELETE',
    });
  }

  async recalculateGPA(studentId) {
    if (this.isMockMode) {
      const newGpa = calculateMockStudentGPA(studentId);
      const student = mockStudents.find(s => s.id === Number(studentId));
      return {
        message: 'คำนวณเกรดเฉลี่ยใหม่สำเร็จ (Mock Mode)',
        student_id: student ? student.student_id : studentId,
        full_name: student ? student.full_name : '',
        gpa: newGpa,
      };
    }
    return this.request(`/api/students/${studentId}/recalculate_gpa/`, {
      method: 'POST',
    });
  }

  // =================== COURSES CRUD ===================
  async getCourses(params = {}) {
    if (this.isMockMode) {
      let filtered = [...mockCourses];
      if (params.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter(c =>
          c.course_code.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q)
        );
      }
      if (params.department) {
        filtered = filtered.filter(c => c.department == params.department);
      }
      return { count: filtered.length, results: filtered };
    }
    const query = new URLSearchParams(params).toString();
    const res = await this.request(`/api/courses/${query ? `?${query}` : ''}`);
    if (Array.isArray(res)) return { count: res.length, results: res };
    return res;
  }

  async createCourse(courseData) {
    if (this.isMockMode) {
      const dept = mockDepartments.find(d => d.id == courseData.department);
      const inst = mockTeachers.find(t => t.id == courseData.instructor);
      const newCourse = {
        id: Date.now(),
        ...courseData,
        department_name: dept ? dept.name : '',
        instructor_name: inst ? inst.full_name : '',
        enrolled_count: 0,
      };
      mockCourses.unshift(newCourse);
      return newCourse;
    }
    return this.request('/api/courses/', {
      method: 'POST',
      body: JSON.stringify(courseData),
    });
  }

  async updateCourse(id, courseData) {
    if (this.isMockMode) {
      const idx = mockCourses.findIndex(c => c.id === Number(id));
      if (idx === -1) throw new Error('ไม่พบรายวิชา');
      const dept = mockDepartments.find(d => d.id == courseData.department);
      const inst = mockTeachers.find(t => t.id == courseData.instructor);
      mockCourses[idx] = {
        ...mockCourses[idx],
        ...courseData,
        department_name: dept ? dept.name : mockCourses[idx].department_name,
        instructor_name: inst ? inst.full_name : mockCourses[idx].instructor_name,
      };
      return mockCourses[idx];
    }
    return this.request(`/api/courses/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(courseData),
    });
  }

  async deleteCourse(id) {
    if (this.isMockMode) {
      const idx = mockCourses.findIndex(c => c.id === Number(id));
      if (idx !== -1) mockCourses.splice(idx, 1);
      return { success: true };
    }
    return this.request(`/api/courses/${id}/`, {
      method: 'DELETE',
    });
  }

  // =================== DEPARTMENTS & TEACHERS ===================
  async getDepartments() {
    if (this.isMockMode) {
      return { count: mockDepartments.length, results: mockDepartments };
    }
    const res = await this.request('/api/departments/');
    if (Array.isArray(res)) return { count: res.length, results: res };
    return res;
  }

  async getTeachers(params = {}) {
    if (this.isMockMode) {
      let filtered = [...mockTeachers];
      if (params.department) {
        filtered = filtered.filter(t => t.department == params.department);
      }
      return { count: filtered.length, results: filtered };
    }
    const query = new URLSearchParams(params).toString();
    const res = await this.request(`/api/teachers/${query ? `?${query}` : ''}`);
    if (Array.isArray(res)) return { count: res.length, results: res };
    return res;
  }

  // =================== ENROLLMENTS CRUD ===================
  async getEnrollments(params = {}) {
    if (this.isMockMode) {
      let filtered = [...mockEnrollments];
      if (params.student) {
        filtered = filtered.filter(e => e.student == params.student);
      }
      if (params.course) {
        filtered = filtered.filter(e => e.course == params.course);
      }
      if (params.semester) {
        filtered = filtered.filter(e => e.semester === params.semester);
      }
      return { count: filtered.length, results: filtered };
    }
    const query = new URLSearchParams(params).toString();
    const res = await this.request(`/api/enrollments/${query ? `?${query}` : ''}`);
    if (Array.isArray(res)) return { count: res.length, results: res };
    return res;
  }

  async createEnrollment(enrollData) {
    if (this.isMockMode) {
      const student = mockStudents.find(s => s.id == enrollData.student);
      const course = mockCourses.find(c => c.id == enrollData.course);
      const newEnroll = {
        id: Date.now(),
        student: Number(enrollData.student),
        student_code: student ? student.student_id : '',
        student_name: student ? student.full_name : '',
        course: Number(enrollData.course),
        course_code: course ? course.course_code : '',
        course_name: course ? course.name : '',
        course_credits: course ? course.credits : 3,
        semester: enrollData.semester || '1/2569',
        academic_year: enrollData.academic_year || 2569,
        grade: enrollData.grade || null,
        status: enrollData.status || 'ENROLLED',
        enrolled_at: new Date().toISOString(),
      };
      mockEnrollments.unshift(newEnroll);
      if (student) {
        if (!student.enrollments) student.enrollments = [];
        student.enrollments.unshift(newEnroll);
        calculateMockStudentGPA(student.id);
      }
      return newEnroll;
    }
    return this.request('/api/enrollments/', {
      method: 'POST',
      body: JSON.stringify(enrollData),
    });
  }

  async updateEnrollment(id, enrollData) {
    if (this.isMockMode) {
      const idx = mockEnrollments.findIndex(e => e.id === Number(id));
      if (idx === -1) throw new Error('ไม่พบข้อมูลการลงทะเบียน');
      mockEnrollments[idx] = { ...mockEnrollments[idx], ...enrollData };
      calculateMockStudentGPA(mockEnrollments[idx].student);
      return mockEnrollments[idx];
    }
    return this.request(`/api/enrollments/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(enrollData),
    });
  }

  async deleteEnrollment(id) {
    if (this.isMockMode) {
      const enroll = mockEnrollments.find(e => e.id === Number(id));
      const studentId = enroll ? enroll.student : null;
      mockEnrollments = mockEnrollments.filter(e => e.id !== Number(id));
      if (studentId) {
        const std = mockStudents.find(s => s.id === studentId);
        if (std && std.enrollments) {
          std.enrollments = std.enrollments.filter(e => e.id !== Number(id));
          calculateMockStudentGPA(studentId);
        }
      }
      return { success: true };
    }
    return this.request(`/api/enrollments/${id}/`, {
      method: 'DELETE',
    });
  }
}

// สร้าง Global Instance สำหรับให้ app.js เรียกใช้ได้ง่าย
window.smsApi = new ApiService();
