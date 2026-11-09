/**
 * Main Application Controller (app.js)
 * จัดการ State ของหน้าเว็บ, การเปลี่ยนแท็บ, การผูก Event Listeners,
 * การเรนเดอร์ UI (Tables, Cards, Modals), การวาดกราฟสถิติด้วย Chart.js,
 * และการประสานงานกับ api.js
 */

// =================== STATE MANAGEMENT ===================
const appState = {
  currentTab: 'dashboard',
  departments: [],
  teachers: [],
  courses: [],
  students: [],
  enrollments: [],
  charts: {
    deptChart: null,
    yearChart: null,
  },
  activeStudentDetailId: null,
};

// =================== INITIALIZATION ===================
document.addEventListener('DOMContentLoaded', async () => {
  initEventListeners();
  updateAuthUI();

  // เชื่อมต่อ Backend API อัตโนมัติ (ล้างโหมด Mock ถาวร)
  localStorage.removeItem('sms_use_mock_mode');
  window.smsApi.isMockMode = false;
  try {
    await window.smsApi.checkServerHealth();
  } catch (e) {
    // ดำเนินการต่อเพื่อเชื่อมต่อ API
  }
  updateServerStatusUI();

  // ตรวจสอบสิทธิ์การเข้าสู่ระบบ
  const isAuth = window.smsApi && window.smsApi.isAuthenticated();
  if (isAuth) {
    await loadBaseData();
    switchTab('dashboard');
  } else {
    // บังคับซ่อนทุกแท็บและแสดงหน้าจอล็อกอย่างเด็ดขาด
    document.querySelectorAll('.tab-content').forEach(sec => {
      sec.classList.add('hidden');
      sec.classList.remove('active');
    });
    const lock = document.getElementById('auth-lock-screen');
    if (lock) lock.classList.remove('hidden');
    document.getElementById('page-title').textContent = 'เข้าสู่ระบบก่อนนะจ่ะ';
    document.getElementById('page-subtitle').textContent = 'กรุณาเข้าสู่ระบบด้วยบัญชีแอดมินหรือบัญชีนักศึกษาเพื่อเข้าถึงและจัดการข้อมูลในหน้านี้';
  }
});

// =================== TAB NAVIGATION ===================
function switchTab(tabName) {
  appState.currentTab = tabName;

  const authLockScreen = document.getElementById('auth-lock-screen');
  const isAuth = window.smsApi && window.smsApi.isAuthenticated();

  // ปรับการเน้นปุ่มบน Sidebar
  document.querySelectorAll('.nav-item').forEach(btn => {
    if (btn.getAttribute('data-tab') === tabName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // ซ่อนเนื้อหาทุกแท็บ
  document.querySelectorAll('.tab-content').forEach(sec => {
    sec.classList.add('hidden');
    sec.classList.remove('active');
  });

  // หากยังไม่เข้าสู่ระบบ: บังคับแสดงหน้าจอล็อกทุกหน้า และไม่อนุญาตให้โหลดข้อมูลใดๆ
  if (!isAuth) {
    if (authLockScreen) authLockScreen.classList.remove('hidden');
    document.getElementById('page-title').textContent = 'เข้าสู่ระบบก่อนนะจ่ะ';
    document.getElementById('page-subtitle').textContent = 'กรุณาเข้าสู่ระบบด้วยบัญชีแอดมินหรือบัญชีนักศึกษาเพื่อเข้าถึงและจัดการข้อมูลในหน้านี้';
    return;
  }

  // หากเข้าสู่ระบบแล้ว: ซ่อนหน้าจอล็อก และแสดงแท็บที่เลือก
  if (authLockScreen) authLockScreen.classList.add('hidden');

  const activeSec = document.getElementById(`tab-${tabName}`);
  if (activeSec) {
    activeSec.classList.remove('hidden');
    activeSec.classList.add('active');
  }

  // ปรับ Title บน Header ตามแต่ละแท็บ
  const titles = {
    'dashboard': { title: 'ภาพรวมสถิติระบบ (Dashboard)', subtitle: 'รายงานสรุปข้อมูลนักศึกษาและการลงทะเบียนเรียนแบบเรียลไทม์' },
    'students': { title: 'จัดการข้อมูลนักศึกษา (Students)', subtitle: 'ค้นหา เพิ่ม แก้ไข ลบข้อมูลนักศึกษา และคำนวณ GPA สะสม' },
    'courses': { title: 'รายวิชาที่เปิดสอน (Courses)', subtitle: 'จัดการหลักสูตรและรายวิชาที่เปิดสอนในแต่ละภาควิชา' },
    'enrollments': { title: 'การลงทะเบียนเรียน & ตัดเกรด (Enrollment & Grading)', subtitle: 'บันทึกการลงทะเบียนรายวิชา และประมวลผลเกรดสะสม' },
    'departments': { title: 'ภาควิชา & คณาจารย์ (Departments & Faculty)', subtitle: 'โครงสร้างภาควิชาและทำเนียบคณาจารย์ที่ปรึกษา' },
    'schedule': { title: 'ตารางเรียนของนิสิต (Class Schedule)', subtitle: 'ตารางแสดงวันและเวลาเรียนตามรายวิชาที่ลงทะเบียนในภาคการศึกษา' },
    'api-docs': { title: 'เอกสาร API & เกณฑ์การประเมิน', subtitle: 'Interactive Swagger UI, Redoc และเกณฑ์คะแนนโครงงาน 100 คะแนนเต็ม' },
  };

  if (titles[tabName]) {
    document.getElementById('page-title').textContent = titles[tabName].title;
    document.getElementById('page-subtitle').textContent = titles[tabName].subtitle;
  }

  // โหลดข้อมูลตามแต่ละแท็บ (เฉพาะเมื่อล็อกอินแล้วเท่านั้น)
  switch (tabName) {
    case 'dashboard':
      loadDashboard();
      break;
    case 'students':
      loadStudents();
      break;
    case 'courses':
      loadCourses();
      break;
    case 'enrollments':
      loadEnrollments();
      break;
    case 'departments':
      renderDepartments();
      renderTeachers();
      break;
    case 'schedule':
      loadSchedule();
      break;
  }
}

// =================== EVENT LISTENERS ===================
function initEventListeners() {
  // Mobile Sidebar Toggle
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('-translate-x-full');
      sidebar.classList.toggle('absolute');
    });
  }

  // Navigation
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      const isAuth = window.smsApi && window.smsApi.isAuthenticated();
      if (!isAuth) {
        showToast('warning', 'เข้าสู่ระบบก่อนนะจ่ะ');
        openModal('modal-login');
        return;
      }
      switchTab(tab);
    });
  });

  // Refresh
  document.getElementById('btn-refresh-data').addEventListener('click', async () => {
    await loadBaseData();
    switchTab(appState.currentTab);
    showToast('success', 'รีเฟรชข้อมูลล่าสุดสำเร็จ');
  });

  // Schedule Student Selector Change
  const scheduleSelect = document.getElementById('schedule-student-select');
  if (scheduleSelect) {
    scheduleSelect.addEventListener('change', (e) => {
      loadSchedule(e.target.value);
    });
  }

  // Mock Mode Toggle
  const btnToggleMock = document.getElementById('btn-toggle-mock');
  if (btnToggleMock) {
    btnToggleMock.addEventListener('click', () => {
      const newMode = !window.smsApi.isMockMode;
      window.smsApi.setMockMode(newMode);
      updateServerStatusUI();
      showToast('info', `สลับโหมดเป็น: ${newMode ? 'Mock Data (ข้อมูลจำลอง)' : 'Live Backend API'}`);
      loadDashboard();
    });
  }

  // Server Config
  const btnOpenConfig = document.getElementById('btn-open-server-config');
  if (btnOpenConfig) {
    btnOpenConfig.addEventListener('click', () => {
      document.getElementById('config-base-url').value = window.smsApi.baseUrl;
      openModal('modal-server-config');
    });
  }

  document.getElementById('btn-save-server-config').addEventListener('click', async () => {
    const val = document.getElementById('config-base-url').value;
    if (val) {
      window.smsApi.setBaseUrl(val);
      updateServerStatusUI();
      closeModal('modal-server-config');
      showToast('success', 'บันทึก URL สำเร็จ กำลังตรวจสอบการเชื่อมต่อ...');
      await window.smsApi.checkServerHealth();
      updateServerStatusUI();
      loadDashboard();
    }
  });

  document.getElementById('btn-test-connection').addEventListener('click', async () => {
    const testUrl = document.getElementById('config-base-url').value;
    if (testUrl) window.smsApi.setBaseUrl(testUrl);
    const online = await window.smsApi.checkServerHealth();
    updateServerStatusUI();
    if (online) {
      Swal.fire('เชื่อมต่อสำเร็จ! 🎉', `สามารถเชื่อมต่อไปยัง ${window.smsApi.baseUrl} ได้สมบูรณ์`, 'success');
    } else {
      Swal.fire('เชื่อมต่อไม่สำเร็จ ⚠️', `ไม่สามารถติดต่อเซิร์ฟเวอร์ที่ ${window.smsApi.baseUrl} ได้ โปรดตรวจสอบว่ารัน backend อยู่หรือไม่`, 'warning');
    }
  });

  // Auth Modals & Logout
  document.getElementById('btn-login-modal').addEventListener('click', () => openModal('modal-login'));
  document.getElementById('btn-logout').addEventListener('click', () => {
    window.smsApi.clearAuth();
    updateAuthUI();
    switchTab(appState.currentTab);
    showToast('info', 'ออกจากระบบเรียบร้อยแล้ว');
  });

  // Login Form
  document.getElementById('form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const u = document.getElementById('login-username').value.trim();
    const p = document.getElementById('login-password').value;

    // ตรวจสอบโดเมน @ok.prolay
    if (u !== 'admin' && !u.startsWith('admin@') && u.includes('@') && !u.toLowerCase().endsWith('@ok.prolay')) {
      return Swal.fire('อีเมลไม่ถูกต้อง', 'อนุญาตเฉพาะอีเมลโดเมน @ok.prolay เท่านั้น', 'warning');
    }

    try {
      await window.smsApi.login(u, p);
      closeModal('modal-login');
      updateAuthUI();
      await loadBaseData();
      switchTab(appState.currentTab);
      showToast('success', `ยินดีต้อนรับคุณ ${window.smsApi.user?.first_name || u}! เข้าสู่ระบบสำเร็จ`);
    } catch (err) {
      Swal.fire('เข้าสู่ระบบไม่สำเร็จ', err.message, 'error');
    }
  });

  // Register Form
  document.getElementById('form-register').addEventListener('submit', async (e) => {
    e.preventDefault();
    const p1 = document.getElementById('reg-password').value;
    const p2 = document.getElementById('reg-password-confirm').value;
    if (p1 !== p2) {
      return Swal.fire('รหัสผ่านไม่ตรงกัน', 'กรุณากรอกยืนยันรหัสผ่านให้ตรงกัน', 'warning');
    }
    if (p1.length < 8) {
      return Swal.fire('รหัสผ่านสั้นเกินไป', 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร', 'warning');
    }
    if (!/[a-zA-Z]/.test(p1)) {
      return Swal.fire('รูปแบบรหัสผ่านไม่ถูกต้อง', 'รหัสผ่านต้องมีตัวอักษรภาษาอังกฤษอย่างน้อย 1 ตัว', 'warning');
    }

    const emailInput = document.getElementById('reg-email');
    const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
    if (!email) {
      return Swal.fire('กรุณากรอกอีเมล', 'กรุณาระบุอีเมลที่ต้องการใช้งาน', 'warning');
    }
    if (!email.endsWith('@ok.prolay')) {
      return Swal.fire('อีเมลไม่ถูกต้อง', 'อีเมลต้องลงท้ายด้วย @ok.prolay เท่านั้น (เช่น 67310075@ok.prolay)', 'warning');
    }

    const firstNameEl = document.getElementById('reg-first-name');
    const lastNameEl = document.getElementById('reg-last-name');
    const fName = firstNameEl ? firstNameEl.value.trim() : '';
    const lName = lastNameEl ? lastNameEl.value.trim() : '';

    if (!fName || !lName) {
      return Swal.fire('กรุณากรอกชื่อและนามสกุล', 'กรุณาระบุชื่อจริงและนามสกุลของคุณ', 'warning');
    }

    const autoUsername = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') || `user${Date.now()}`;

    const phone = document.getElementById('reg-phone')?.value.trim() || '';
    const dob = document.getElementById('reg-dob')?.value || '';
    const gender = document.querySelector('input[name="reg-gender"]:checked')?.value || 'M';

    const data = {
      email: email,
      username: autoUsername,
      first_name: fName,
      last_name: lName,
      password: p1,
      password_confirm: p2,
      phone: phone,
      date_of_birth: dob,
      gender: gender,
    };

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> กำลังสมัคร...';
    }

    try {
      await window.smsApi.register(data);
      closeModal('modal-register');
      updateAuthUI();
      await loadBaseData();
      switchTab('dashboard');
      showToast('success', `ยินดีต้อนรับคุณ ${fName}! สมัครสมาชิกสำเร็จและเข้าสู่ระบบให้อัตโนมัติ`);
    } catch (err) {
      Swal.fire('สมัครสมาชิกไม่สำเร็จ', err.message, 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    }
  });

  // Students Filters & Search
  let searchTimeout;
  document.getElementById('student-search-input').addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(loadStudents, 300);
  });
  document.getElementById('filter-student-dept').addEventListener('change', loadStudents);
  document.getElementById('filter-student-year').addEventListener('change', loadStudents);
  document.getElementById('filter-student-status').addEventListener('change', loadStudents);

  // Add Student Button
  document.getElementById('btn-add-student').addEventListener('click', () => {
    document.getElementById('student-modal-title').innerHTML = '<i class="fa-solid fa-user-plus text-indigo-600"></i> เพิ่มข้อมูลนักศึกษา';
    document.getElementById('form-student').reset();
    document.getElementById('student-form-id').value = '';
    document.getElementById('std-id').readOnly = false;
    openModal('modal-student-form');
  });

  // Student Form Submit (Add / Edit)
  document.getElementById('form-student').addEventListener('submit', async (e) => {
    e.preventDefault();
    const editId = document.getElementById('student-form-id').value;
    const stdData = {
      student_id: document.getElementById('std-id').value,
      title: document.getElementById('std-title').value,
      first_name: document.getElementById('std-first-name').value,
      last_name: document.getElementById('std-last-name').value,
      gender: document.getElementById('std-gender').value,
      date_of_birth: document.getElementById('std-dob').value || null,
      email: document.getElementById('std-email').value,
      phone: document.getElementById('std-phone').value,
      department: document.getElementById('std-department').value,
      advisor: document.getElementById('std-advisor').value || null,
      year_level: parseInt(document.getElementById('std-year').value),
      status: document.getElementById('std-status').value,
      address: document.getElementById('std-address').value,
    };

    try {
      if (editId) {
        await window.smsApi.updateStudent(editId, stdData);
        showToast('success', 'อัปเดตข้อมูลนักศึกษาสำเร็จ');
      } else {
        await window.smsApi.createStudent(stdData);
        showToast('success', 'เพิ่มนักศึกษาใหม่สำเร็จ');
      }
      closeModal('modal-student-form');
      loadStudents();
      loadDashboard();
    } catch (err) {
      Swal.fire('บันทึกไม่สำเร็จ', err.message, 'error');
    }
  });

  // Recalculate GPA Button in detail modal
  document.getElementById('btn-recalculate-gpa').addEventListener('click', async () => {
    if (!appState.activeStudentDetailId) return;
    try {
      const res = await window.smsApi.recalculateGPA(appState.activeStudentDetailId);
      document.getElementById('detail-gpa').textContent = res.gpa;
      showToast('success', `คำนวณ GPA ใหม่สำเร็จ: ${res.gpa}`);
      loadStudents();
      loadDashboard();
    } catch (err) {
      Swal.fire('คำนวณไม่สำเร็จ', err.message, 'error');
    }
  });

  // Courses Search
  document.getElementById('course-search-input').addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(loadCourses, 300);
  });

  // Add Course Button
  document.getElementById('btn-add-course').addEventListener('click', () => {
    document.getElementById('course-modal-title').innerHTML = '<i class="fa-solid fa-plus text-indigo-600"></i> เพิ่มรายวิชา';
    document.getElementById('form-course').reset();
    document.getElementById('course-form-id').value = '';
    openModal('modal-course-form');
  });

  // Course Form Submit
  document.getElementById('form-course').addEventListener('submit', async (e) => {
    e.preventDefault();
    const editId = document.getElementById('course-form-id').value;
    const cData = {
      course_code: document.getElementById('course-code').value,
      name: document.getElementById('course-name').value,
      credits: parseInt(document.getElementById('course-credits').value),
      department: document.getElementById('course-dept').value,
      instructor: document.getElementById('course-instructor').value || null,
      description: document.getElementById('course-desc').value,
    };

    try {
      if (editId) {
        await window.smsApi.updateCourse(editId, cData);
        showToast('success', 'อัปเดตรายวิชาสำเร็จ');
      } else {
        await window.smsApi.createCourse(cData);
        showToast('success', 'เพิ่มรายวิชาสำเร็จ');
      }
      closeModal('modal-course-form');
      loadCourses();
    } catch (err) {
      Swal.fire('บันทึกไม่สำเร็จ', err.message, 'error');
    }
  });

  // Enrollments Search & Filter
  document.getElementById('enrollment-search-input').addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(loadEnrollments, 300);
  });
  document.getElementById('filter-enrollment-semester').addEventListener('change', loadEnrollments);

  // Add Enrollment Button
  document.getElementById('btn-add-enrollment').addEventListener('click', () => {
    populateEnrollmentDropdowns();
    openModal('modal-enrollment-form');
  });

  // Enrollment Form Submit
  document.getElementById('form-enrollment').addEventListener('submit', async (e) => {
    e.preventDefault();
    const eData = {
      student: document.getElementById('enroll-student-select').value,
      course: document.getElementById('enroll-course-select').value,
      semester: document.getElementById('enroll-semester').value,
      academic_year: parseInt(document.getElementById('enroll-year').value),
    };

    try {
      await window.smsApi.createEnrollment(eData);
      showToast('success', 'ลงทะเบียนรายวิชาเรียบร้อยแล้ว');
      closeModal('modal-enrollment-form');
      loadEnrollments();
      loadDashboard();
    } catch (err) {
      Swal.fire('ลงทะเบียนไม่สำเร็จ', err.message, 'error');
    }
  });

  // Grade Form Submit
  document.getElementById('form-grade').addEventListener('submit', async (e) => {
    e.preventDefault();
    const enrollId = document.getElementById('grade-enrollment-id').value;
    const gradeData = {
      grade: document.getElementById('grade-val').value || null,
      status: document.getElementById('grade-status').value,
    };

    try {
      await window.smsApi.updateEnrollment(enrollId, gradeData);
      showToast('success', 'บันทึกเกรดสำเร็จ ระบบได้คำนวณ GPA สะสมใหม่อัตโนมัติ!');
      closeModal('modal-grade-form');
      loadEnrollments();
      loadDashboard();
      if (appState.activeStudentDetailId) {
        viewStudentDetail(appState.activeStudentDetailId);
      }
    } catch (err) {
      Swal.fire('บันทึกเกรดไม่สำเร็จ', err.message, 'error');
    }
  });
}

// =================== LOAD DATA FUNCTIONS ===================
async function loadBaseData() {
  try {
    const [deptRes, teacherRes] = await Promise.all([
      window.smsApi.getDepartments(),
      window.smsApi.getTeachers(),
    ]);
    appState.departments = deptRes.results || deptRes;
    appState.teachers = teacherRes.results || teacherRes;

    populateDepartmentSelects();
    populateTeacherSelects();
  } catch (e) {
    console.error('Error loading base data:', e);
  }
}

async function loadDashboard() {
  try {
    const data = await window.smsApi.getDashboardStats();
    const sum = data.summary;

    document.getElementById('stat-total-students').textContent = sum.total_students || 0;
    document.getElementById('stat-active-students').textContent = sum.active_students || 0;
    document.getElementById('stat-avg-gpa').textContent = (sum.average_gpa || 0).toFixed(2);
    document.getElementById('stat-total-courses').textContent = sum.total_courses || 0;
    document.getElementById('stat-total-enrollments').textContent = sum.total_enrollments || 0;
    document.getElementById('stat-total-teachers').textContent = sum.total_teachers || 0;

    renderDashboardCharts(data);
    await renderDashboardStudents();
  } catch (e) {
    console.error('Error loading dashboard:', e);
  }
}

function renderDashboardCharts(data) {
  // Chart 1: Departments
  const deptCtx = document.getElementById('chart-departments');
  if (deptCtx) {
    if (appState.charts.deptChart) appState.charts.deptChart.destroy();
    const labels = data.students_by_department.map(d => `${d.code} (${d.name})`);
    const counts = data.students_by_department.map(d => d.count);

    appState.charts.deptChart = new Chart(deptCtx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: counts,
          backgroundColor: ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'],
          borderWidth: 2,
          borderColor: '#ffffff',
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, font: { family: 'Kanit', size: 11 } } },
        },
        cutout: '70%',
      }
    });
  }

  // Chart 2: Years
  const yearCtx = document.getElementById('chart-years');
  if (yearCtx) {
    if (appState.charts.yearChart) appState.charts.yearChart.destroy();
    const yearLabels = (data.students_by_year || []).map(y => `ชั้นปีที่ ${y.year_level}`);
    const yearCounts = (data.students_by_year || []).map(y => y.count);

    appState.charts.yearChart = new Chart(yearCtx, {
      type: 'bar',
      data: {
        labels: yearLabels,
        datasets: [{
          label: 'จำนวนนักศึกษา (คน)',
          data: yearCounts,
          backgroundColor: '#4f46e5',
          borderRadius: 8,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1, font: { family: 'Kanit' } }, grid: { color: '#f1f5f9' } },
          x: { ticks: { font: { family: 'Kanit' } }, grid: { display: false } }
        }
      }
    });
  }
}

// โหลดและแสดงรายชื่อนักศึกษาที่หน้าแรก (สามารถดูได้ทุกคนแม้ยังไม่เข้าสู่ระบบ)
async function renderDashboardStudents() {
  const tbody = document.getElementById('dashboard-students-tbody');
  if (!tbody) return;

  try {
    const res = await window.smsApi.getStudents();
    const students = res.results || res;

    if (!students || students.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="py-8 text-center text-slate-400">ยังไม่มีข้อมูลนักศึกษาในระบบ</td></tr>';
      return;
    }

    tbody.innerHTML = students.map(s => {
      const gpa = parseFloat(s.gpa || 0);
      let gpaClass = 'gpa-low';
      if (gpa >= 3.0) gpaClass = 'gpa-high';
      else if (gpa >= 2.0) gpaClass = 'gpa-medium';

      const statusMap = {
        'ACTIVE': { label: 'กำลังศึกษา', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        'GRADUATED': { label: 'สำเร็จการศึกษา', class: 'bg-blue-50 text-blue-700 border-blue-200' },
        'SUSPENDED': { label: 'พักการเรียน', class: 'bg-amber-50 text-amber-700 border-amber-200' },
        'DROPPED': { label: 'พ้นสภาพ', class: 'bg-rose-50 text-rose-700 border-rose-200' },
      };
      const st = statusMap[s.status] || { label: s.status || '-', class: 'bg-slate-100 text-slate-600' };
      const initials = (s.first_name || '').charAt(0) + (s.last_name || '').charAt(0);

      return `
        <tr class="hover:bg-slate-50/70 transition">
          <td class="py-3 px-4">
            <div class="flex items-center gap-3">
              <button type="button" onclick="viewStudentDetail(${s.id})" class="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-100 to-violet-100 text-indigo-700 font-bold flex items-center justify-center text-xs hover:scale-105 hover:ring-2 hover:ring-indigo-400 transition cursor-pointer" title="คลิกเพื่อดูข้อมูลทั้งหมด">
                ${initials || 'ST'}
              </button>
              <button type="button" onclick="viewStudentDetail(${s.id})" class="text-left group cursor-pointer focus:outline-none" title="คลิกเพื่อดูข้อมูลทั้งหมด">
                <p class="font-bold text-slate-800 group-hover:text-indigo-600 group-hover:underline transition flex items-center gap-1.5">
                  <span>${s.title || ''}${s.first_name} ${s.last_name}</span>
                  <i class="fa-solid fa-arrow-up-right-from-square text-[10px] text-slate-400 group-hover:text-indigo-600 transition"></i>
                </p>
                <p class="text-[11px] text-slate-400 font-mono">${s.student_id}</p>
              </button>
            </div>
          </td>
          <td class="py-3 px-4">
            <span class="inline-block bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded border border-indigo-100 mb-0.5">
              ${s.department_code || 'CPE'}
            </span>
            <p class="text-[11px] text-slate-500">ชั้นปีที่ ${s.year_level || 1}</p>
          </td>
          <td class="py-3 px-4 text-slate-600 text-xs">
            ${s.advisor_name || 'ไม่ระบุ'}
          </td>
          <td class="py-3 px-4 text-center">
            <span class="inline-block font-extrabold text-xs px-2.5 py-1 rounded-lg ${gpaClass}">
              ${parseFloat(s.gpa || 0).toFixed(2)}
            </span>
          </td>
          <td class="py-3 px-4 text-center">
            <span class="inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full border ${st.class}">
              ${st.label}
            </span>
          </td>
          <td class="py-3 px-4 text-right">
            <button onclick="viewStudentDetail(${s.id})" class="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-bold text-xs transition ml-auto" title="ดูข้อมูลนักศึกษา">
              <i class="fa-solid fa-eye"></i>
              <span>ดูข้อมูล</span>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('Error rendering dashboard students:', err);
    tbody.innerHTML = '<tr><td colspan="6" class="py-6 text-center text-slate-400">กำลังเชื่อมต่อข้อมูลนักศึกษา...</td></tr>';
  }
}

// ค้นหานักศึกษาที่ตรงกับผู้ใช้งานปัจจุบัน (สำหรับมุมมองนักศึกษา)
function findStudentForCurrentUser(studentsList) {
  const user = window.smsApi.user;
  if (!user) return null;
  const userEmail = (user.email || '').toLowerCase().trim();
  const userName = (user.username || '').toLowerCase().trim();
  const userFirst = (user.first_name || '').toLowerCase().trim();
  const userLast = (user.last_name || '').toLowerCase().trim();

  // 1. ตรวจสอบจาก email ตรงกัน
  let found = (studentsList || []).find(s => s.email && s.email.toLowerCase().trim() === userEmail);
  
  // 2. ตรวจสอบจาก student_id ตรงกับ username หรือ email prefix
  if (!found) {
    found = (studentsList || []).find(s => s.student_id && (
      s.student_id.toLowerCase().trim() === userName ||
      userEmail.startsWith(s.student_id.toLowerCase())
    ));
  }
  
  // 3. ตรวจสอบจากชื่อจริงและนามสกุล
  if (!found && userFirst) {
    found = (studentsList || []).find(s => s.first_name && s.first_name.toLowerCase().trim() === userFirst);
  }

  // 4. บัญชีทดสอบ student1
  if (!found && userName === 'student1') {
    found = (studentsList || []).find(s => s.student_id === '6601001');
  }

  // 5. หากยังไม่พบ (เช่น ผู้สมัครสมาชิกใหม่): ใช้ข้อมูลจริงของผู้สมัครเอง ห้ามเอาข้อมูลคนอื่นมาสวมเด็ดขาด!
  if (!found) {
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || 'นิสิต';
    found = {
      id: user.id || 'me',
      student_id: user.username || userEmail.split('@')[0],
      first_name: user.first_name || fullName,
      last_name: user.last_name || '',
      full_name: fullName,
      email: user.email || `${user.username}@ok.prolay`,
      department_name: 'วิศวกรรมคอมพิวเตอร์ (CPE)',
      advisor_name: 'ผศ.ดร.สมชาย ใจดีเลิศ',
      year_level: 1,
      status: 'ACTIVE',
      gpa: 0.00,
      gender: 'M',
    };
  }
  return found;
}

async function loadStudents() {
  const tbody = document.getElementById('student-table-body');
  const isAdmin = window.smsApi.isAdmin();
  const isAuth = window.smsApi.isAuthenticated();

  // ลบ Banner แจ้งเตือนเดิมถ้ามี
  const existingBanner = document.getElementById('student-view-banner');
  if (existingBanner) existingBanner.remove();

  // ต้องเข้าสู่ระบบก่อนถึงจะเห็นข้อมูลในหน้าข้อมูลนิสิต
  if (!isAuth) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="py-16 text-center">
          <div class="max-w-md mx-auto space-y-3">
            <div class="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl mx-auto shadow-xs">
              <i class="fa-solid fa-lock"></i>
            </div>
            <h4 class="text-base font-bold text-slate-800">เข้าสู่ระบบก่อนนะจ่ะ</h4>
            <p class="text-xs text-slate-500">กรุณาเข้าสู่ระบบด้วยบัญชีแอดมินหรือบัญชีนักศึกษาเพื่อเข้าถึงและจัดการข้อมูลในหน้านี้</p>
            <button onclick="openModal('modal-login')" class="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow transition">
              <i class="fa-solid fa-right-to-bracket"></i>
              <span>เข้าสู่ระบบ (Login)</span>
            </button>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = '<tr><td colspan="6" class="py-8 text-center text-slate-400">กำลังโหลดข้อมูลนักศึกษา...</td></tr>';

  const params = {};
  const search = document.getElementById('student-search-input').value.trim();
  const dept = document.getElementById('filter-student-dept').value;
  const year = document.getElementById('filter-student-year').value;
  const status = document.getElementById('filter-student-status').value;

  if (search) params.search = search;
  if (dept) params.department = dept;
  if (year) params.year_level = year;
  if (status) params.status = status;

  try {
    const res = await window.smsApi.getStudents(params);
    let students = res.results || res;
    appState.students = students;

    // ถ้าเข้าสู่ระบบในฐานะนักศึกษา (ไม่ใช่แอดมิน) ให้แสดงเฉพาะข้อมูลของตัวเองเท่านั้น!
    if (isAuth && !isAdmin) {
      const myStudent = findStudentForCurrentUser(students);
      if (myStudent) {
        students = [myStudent];
      }
      // สร้าง Banner สวยงามบอกให้รู้ว่าเป็นมุมมองนักศึกษา
      const banner = document.createElement('div');
      banner.id = 'student-view-banner';
      banner.className = 'mb-4 p-4 bg-gradient-to-r from-indigo-50 via-blue-50 to-indigo-50 border border-indigo-200/80 text-indigo-900 rounded-2xl text-xs flex items-center justify-between shadow-xs';
      banner.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-sm shadow-xs">
            <i class="fa-solid fa-user-lock"></i>
          </div>
          <div>
            <p class="font-bold text-slate-900 text-sm">มุมมองนักศึกษา: แสดงเฉพาะข้อมูลของคุณ (${myStudent ? myStudent.full_name : 'นักศึกษา'})</p>
            <p class="text-[11px] text-slate-500 mt-0.5">คุณสามารถคลิกที่ชื่อเพื่อดูรายละเอียดผลการเรียนรายวิชาทั้งหมดได้</p>
          </div>
        </div>
        <span class="text-[11px] bg-white text-indigo-700 font-bold px-3 py-1 rounded-full border border-indigo-100 shadow-2xs">
          Student View
        </span>
      `;
      const tableCard = tbody.closest('.glass-card');
      if (tableCard && tableCard.parentNode) {
        tableCard.parentNode.insertBefore(banner, tableCard);
      }
    }

    if (students.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="py-12 text-center text-slate-400 font-medium">ไม่พบข้อมูลนักศึกษาที่ตรงตามเงื่อนไข</td></tr>';
      return;
    }

    tbody.innerHTML = students.map(s => {
      const gpa = parseFloat(s.gpa || 0);
      let gpaClass = 'gpa-low';
      if (gpa >= 3.0) gpaClass = 'gpa-high';
      else if (gpa >= 2.0) gpaClass = 'gpa-medium';

      const statusMap = {
        'ACTIVE': { label: 'กำลังศึกษา', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        'GRADUATED': { label: 'สำเร็จการศึกษา', class: 'bg-blue-50 text-blue-700 border-blue-200' },
        'SUSPENDED': { label: 'พักการเรียน', class: 'bg-amber-50 text-amber-700 border-amber-200' },
        'DROPPED': { label: 'พ้นสภาพ', class: 'bg-rose-50 text-rose-700 border-rose-200' },
      };
      const st = statusMap[s.status] || { label: s.status, class: 'bg-slate-100 text-slate-600' };

      const initials = (s.first_name || '').charAt(0) + (s.last_name || '').charAt(0);

      // ปุ่มการจัดการ: แอดมินทำได้ครบทุกอย่าง, นักศึกษาดูได้อย่างเดียว
      const actionButtons = isAdmin
        ? `
          <button onclick="viewStudentDetail(${s.id})" class="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="ดูผลการเรียนและคำนวณ GPA">
            <i class="fa-solid fa-eye"></i>
          </button>
          <button onclick="editStudent(${s.id})" class="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition" title="แก้ไขข้อมูล">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button onclick="deleteStudent(${s.id}, '${s.student_id}', '${s.first_name}')" class="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition" title="ลบข้อมูล">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        `
        : `
          <button onclick="viewStudentDetail(${s.id})" class="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-bold text-xs transition" title="ดูผลการเรียนของคุณ">
            <i class="fa-solid fa-eye"></i>
            <span>ดูข้อมูล</span>
          </button>
        `;

      return `
        <tr class="hover:bg-slate-50/70 transition">
          <td class="py-3 px-4">
            <div class="flex items-center gap-3">
              <button type="button" onclick="viewStudentDetail(${s.id})" class="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-100 to-violet-100 text-indigo-700 font-bold flex items-center justify-center text-xs hover:scale-105 hover:ring-2 hover:ring-indigo-400 transition cursor-pointer" title="คลิกเพื่อดูข้อมูลทั้งหมด">
                ${initials || 'ST'}
              </button>
              <button type="button" onclick="viewStudentDetail(${s.id})" class="text-left group cursor-pointer focus:outline-none" title="คลิกเพื่อดูข้อมูลทั้งหมด">
                <p class="font-bold text-slate-800 group-hover:text-indigo-600 group-hover:underline transition flex items-center gap-1.5">
                  <span>${s.title || ''}${s.first_name} ${s.last_name}</span>
                  <i class="fa-solid fa-arrow-up-right-from-square text-[10px] text-slate-400 group-hover:text-indigo-600 transition"></i>
                </p>
                <p class="text-[11px] text-slate-400 font-mono">${s.student_id}</p>
              </button>
            </div>
          </td>
          <td class="py-3 px-4">
            <span class="inline-block bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded text-[11px] mb-0.5">
              ${s.department_code || 'สาขา'}
            </span>
            <p class="text-[11px] text-slate-500">ชั้นปีที่ ${s.year_level}</p>
          </td>
          <td class="py-3 px-4">
            <p class="text-slate-700">${s.advisor_name || '<span class=\"text-slate-400\">- ไม่มีอาจารย์ที่ปรึกษา -</span>'}</p>
          </td>
          <td class="py-3 px-4 text-center">
            <span class="inline-block px-2.5 py-1 rounded-lg font-bold text-xs ${gpaClass}">
              ${s.gpa}
            </span>
          </td>
          <td class="py-3 px-4 text-center">
            <span class="inline-block border px-2 py-0.5 rounded-full text-[11px] font-medium ${st.class}">
              ${st.label}
            </span>
          </td>
          <td class="py-3 px-4 text-right">
            <div class="flex items-center justify-end gap-1.5">
              ${actionButtons}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="py-8 text-center text-rose-500">เกิดข้อผิดพลาด: ${err.message}</td></tr>`;
  }
}

async function viewStudentDetail(id) {
  appState.activeStudentDetailId = id;
  try {
    const student = await window.smsApi.getStudent(id);

    // Profile header
    document.getElementById('detail-name').textContent = `${student.title || ''}${student.first_name} ${student.last_name}`;
    document.getElementById('detail-code-dept').textContent = `รหัส: ${student.student_id} | ${student.department_name || ''} (ปี ${student.year_level || '-'})`;
    document.getElementById('detail-advisor').textContent = `อาจารย์ที่ปรึกษา: ${student.advisor_name || 'ไม่ระบุ'}`;
    document.getElementById('detail-gpa').textContent = student.gpa;
    document.getElementById('detail-avatar').textContent = (student.first_name || '').charAt(0) + (student.last_name || '').charAt(0);

    // Status label mapping
    const statusMap = {
      ACTIVE: { label: 'กำลังศึกษา (Active)', class: 'bg-emerald-100 text-emerald-700' },
      GRADUATED: { label: 'สำเร็จการศึกษา (Graduated)', class: 'bg-blue-100 text-blue-700' },
      SUSPENDED: { label: 'พักการเรียน (Suspended)', class: 'bg-amber-100 text-amber-700' },
      DROPPED: { label: 'พ้นสภาพ (Dropped)', class: 'bg-rose-100 text-rose-700' },
    };
    const stObj = statusMap[student.status] || { label: student.status || '-', class: 'bg-slate-100 text-slate-700' };
    const detailStatus = document.getElementById('detail-status');
    if (detailStatus) {
      detailStatus.textContent = stObj.label;
      detailStatus.className = `${stObj.class} text-[10px] font-semibold px-2 py-0.5 rounded-full`;
    }

    // แมปข้อมูลนักศึกษาทั้งหมดให้ตรงตามหน้าแก้ไขข้อมูลนักศึกษา
    const genderLabels = { 'M': 'ชาย', 'F': 'หญิง', 'O': 'อื่นๆ' };
    const genderText = genderLabels[student.gender] || (student.gender === 'M' ? 'ชาย' : student.gender === 'F' ? 'หญิง' : student.gender || '-');

    // ค้นหาชื่อภาควิชา
    let deptName = student.department_name;
    if (!deptName && student.department && Array.isArray(appState.departments)) {
      const d = appState.departments.find(dept => dept.id === student.department || dept.id === Number(student.department));
      if (d) deptName = `${d.code} - ${d.name}`;
    }
    if (!deptName) deptName = student.department || '-';

    // ค้นหาชื่ออาจารย์ที่ปรึกษา
    let advName = student.advisor_name;
    if (!advName && student.advisor && Array.isArray(appState.teachers)) {
      const t = appState.teachers.find(tch => tch.id === student.advisor || tch.id === Number(student.advisor));
      if (t) advName = `${t.full_name || `${t.title || ''} ${t.first_name} ${t.last_name}`} (${t.teacher_code || ''})`;
    }
    if (!advName) advName = student.advisor || 'ไม่ระบุ';

    const setElem = (elemId, text) => {
      const el = document.getElementById(elemId);
      if (el) el.textContent = (text !== undefined && text !== null && text !== '') ? text : '-';
    };

    setElem('detail-info-student-id', student.student_id);
    setElem('detail-info-title', student.title);
    setElem('detail-info-gender', genderText);
    setElem('detail-info-first-name', student.first_name);
    setElem('detail-info-last-name', student.last_name);
    setElem('detail-info-email', student.email);
    setElem('detail-info-phone', student.phone || 'ไม่ระบุ');
    setElem('detail-info-dob', student.date_of_birth || 'ไม่ระบุ');
    setElem('detail-info-department', deptName);
    setElem('detail-info-advisor', advName);
    setElem('detail-info-year', student.year_level ? `ปี ${student.year_level}` : '-');
    setElem('detail-info-status', stObj.label);
    setElem('detail-info-address', student.address || 'ไม่ระบุที่อยู่');

    const tbody = document.getElementById('detail-enrollment-tbody');
    const enrollments = student.enrollments || [];

    let totalCredits = 0;
    if (enrollments.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="py-6 text-center text-slate-400">ยังไม่มีประวัติการลงทะเบียนรายวิชา</td></tr>';
    } else {
      tbody.innerHTML = enrollments.map(e => {
        totalCredits += (e.course_credits || 3);
        const gradeBadge = e.grade ? `<span class="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">${e.grade}</span>` : '<span class="text-slate-400 font-normal">รอเกรด</span>';
        return `
          <tr class="hover:bg-slate-50">
            <td class="py-2.5 px-3 font-mono font-bold text-slate-700">${e.course_code}</td>
            <td class="py-2.5 px-3">${e.course_name}</td>
            <td class="py-2.5 px-3 text-center">${e.course_credits || 3}</td>
            <td class="py-2.5 px-3 text-slate-500">${e.semester}</td>
            <td class="py-2.5 px-3 text-center">${gradeBadge}</td>
            <td class="py-2.5 px-3 text-center"><span class="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">${e.status}</span></td>
          </tr>
        `;
      }).join('');
    }

    document.getElementById('detail-credits-summary').textContent = `รวม ${totalCredits} หน่วยกิต (${enrollments.length} รายวิชา)`;

    openModal('modal-student-detail');
  } catch (err) {
    Swal.fire('เกิดข้อผิดพลาด', err.message, 'error');
  }
}

async function editStudent(id) {
  try {
    const student = await window.smsApi.getStudent(id);
    document.getElementById('student-modal-title').innerHTML = '<i class="fa-solid fa-pen-to-square text-indigo-600"></i> แก้ไขข้อมูลนักศึกษา';
    document.getElementById('student-form-id').value = student.id;
    document.getElementById('std-id').value = student.student_id;
    document.getElementById('std-id').readOnly = true;
    document.getElementById('std-title').value = student.title || 'นาย';
    document.getElementById('std-gender').value = student.gender || 'M';
    document.getElementById('std-first-name').value = student.first_name || '';
    document.getElementById('std-last-name').value = student.last_name || '';
    document.getElementById('std-email').value = student.email || '';
    document.getElementById('std-phone').value = student.phone || '';
    document.getElementById('std-dob').value = student.date_of_birth || '';
    document.getElementById('std-department').value = student.department || '';
    document.getElementById('std-advisor').value = student.advisor || '';
    document.getElementById('std-year').value = student.year_level || 1;
    document.getElementById('std-status').value = student.status || 'ACTIVE';
    document.getElementById('std-address').value = student.address || '';

    openModal('modal-student-form');
  } catch (err) {
    Swal.fire('เกิดข้อผิดพลาด', err.message, 'error');
  }
}

async function deleteStudent(id, code, name) {
  const result = await Swal.fire({
    title: 'ยืนยันการลบนักศึกษา?',
    text: `คุณต้องการลบข้อมูลนักศึกษา ${code} - ${name} ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'ลบข้อมูล',
    cancelButtonText: 'ยกเลิก'
  });

  if (result.isConfirmed) {
    try {
      await window.smsApi.deleteStudent(id);
      showToast('success', 'ลบข้อมูลนักศึกษาเรียบร้อยแล้ว');
      loadStudents();
      loadDashboard();
    } catch (err) {
      Swal.fire('ลบไม่สำเร็จ', err.message, 'error');
    }
  }
}

async function loadCourses() {
  const container = document.getElementById('courses-grid');
  container.innerHTML = '<div class="col-span-3 py-8 text-center text-slate-400">กำลังโหลดรายวิชา...</div>';

  const params = {};
  const search = document.getElementById('course-search-input').value.trim();
  if (search) params.search = search;

  try {
    const res = await window.smsApi.getCourses(params);
    const courses = res.results || res;
    appState.courses = courses;

    if (courses.length === 0) {
      container.innerHTML = '<div class="col-span-3 py-12 text-center text-slate-400">ไม่พบรายวิชาที่ค้นหา</div>';
      return;
    }

    const isAdmin = window.smsApi.isAdmin();

    container.innerHTML = courses.map(c => {
      // ปุ่มแก้ไข/ลบรายวิชา ให้เฉพาะแอดมินเท่านั้น
      const adminActions = isAdmin
        ? `
          <div class="flex items-center gap-1">
            <button onclick="editCourse(${c.id})" class="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition" title="แก้ไขวิชา">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button onclick="deleteCourse(${c.id}, '${c.course_code}')" class="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition" title="ลบวิชา">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        `
        : '';

      return `
      <div class="glass-card p-5 rounded-2xl flex flex-col justify-between border border-slate-200">
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              ${c.course_code}
            </span>
            <span class="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              ${c.credits} หน่วยกิต
            </span>
          </div>
          <h4 class="font-bold text-slate-900 text-sm mt-1 mb-1">${c.name}</h4>
          <p class="text-xs text-slate-500 mb-3 line-clamp-2">${c.description || 'ไม่มีคำอธิบายรายวิชา'}</p>
        </div>

        <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <div>
            <p class="text-[11px] text-slate-400">อาจารย์ผู้สอน</p>
            <p class="font-medium text-slate-700">${c.instructor_name || 'ยังไม่กำหนด'}</p>
          </div>
          ${adminActions}
        </div>
      </div>
    `;
    }).join('');
  } catch (err) {
    container.innerHTML = `<div class="col-span-3 py-8 text-center text-rose-500">เกิดข้อผิดพลาด: ${err.message}</div>`;
  }
}

async function editCourse(id) {
  try {
    const course = appState.courses.find(c => c.id === id);
    if (!course) return;
    document.getElementById('course-modal-title').innerHTML = '<i class="fa-solid fa-pen-to-square text-indigo-600"></i> แก้ไขรายวิชา';
    document.getElementById('course-form-id').value = course.id;
    document.getElementById('course-code').value = course.course_code;
    document.getElementById('course-name').value = course.name;
    document.getElementById('course-credits').value = course.credits;
    document.getElementById('course-dept').value = course.department;
    document.getElementById('course-instructor').value = course.instructor || '';
    document.getElementById('course-desc').value = course.description || '';
    openModal('modal-course-form');
  } catch (err) {
    Swal.fire('เกิดข้อผิดพลาด', err.message, 'error');
  }
}

async function deleteCourse(id, code) {
  const result = await Swal.fire({
    title: 'ยืนยันการลบรายวิชา?',
    text: `คุณต้องการลบรายวิชา ${code} ใช่หรือไม่?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    confirmButtonText: 'ลบรายวิชา',
    cancelButtonText: 'ยกเลิก'
  });
  if (result.isConfirmed) {
    try {
      await window.smsApi.deleteCourse(id);
      showToast('success', 'ลบรายวิชาสำเร็จ');
      loadCourses();
      loadDashboard();
    } catch (err) {
      Swal.fire('ลบไม่สำเร็จ', err.message, 'error');
    }
  }
}

async function loadEnrollments() {
  const tbody = document.getElementById('enrollment-table-body');
  const isAdmin = window.smsApi.isAdmin();
  const isAuth = window.smsApi.isAuthenticated();

  // ต้องเข้าสู่ระบบก่อนถึงจะเห็นข้อมูลในหน้าการลงทะเบียนตัดเกรด
  if (!isAuth) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="py-16 text-center">
          <div class="max-w-md mx-auto space-y-3">
            <div class="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl mx-auto shadow-xs">
              <i class="fa-solid fa-lock"></i>
            </div>
            <h4 class="text-base font-bold text-slate-800">เข้าสู่ระบบก่อนนะจ่ะ</h4>
            <p class="text-xs text-slate-500">กรุณาเข้าสู่ระบบด้วยบัญชีผู้ใช้เพื่อดูประวัติการลงทะเบียนรายวิชาและจัดการผลการเรียน</p>
            <button onclick="openModal('modal-login')" class="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow transition">
              <i class="fa-solid fa-right-to-bracket"></i>
              <span>เข้าสู่ระบบ (Login)</span>
            </button>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = '<tr><td colspan="7" class="py-8 text-center text-slate-400">กำลังโหลดรายการลงทะเบียน...</td></tr>';

  const params = {};
  const sem = document.getElementById('filter-enrollment-semester').value;
  if (sem) params.semester = sem;

  try {
    const res = await window.smsApi.getEnrollments(params);
    let enrollments = res.results || res;

    // หากล็อกอินเป็นนักศึกษา ให้เห็นเฉพาะวิชาที่ตัวเองลงทะเบียนไว้เท่านั้น!
    if (isAuth && !isAdmin) {
      const myStudent = findStudentForCurrentUser(appState.students);
      if (myStudent) {
        enrollments = enrollments.filter(e => e.student === myStudent.id || e.student_code === myStudent.student_id);
      }
    }
    appState.enrollments = enrollments;

    if (enrollments.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="py-12 text-center text-slate-400">ไม่พบข้อมูลการลงทะเบียน</td></tr>';
      return;
    }

    tbody.innerHTML = enrollments.map(e => {
      const gradeBadge = e.grade ? `<span class="inline-block bg-indigo-50 text-indigo-700 font-bold px-2.5 py-1 rounded text-xs border border-indigo-200">${e.grade}</span>` : '<span class="text-slate-400 font-medium">รอการตัดเกรด</span>';

      // ปุ่มตัดเกรด: มีให้เฉพาะแอดมินหรืออาจารย์เท่านั้น! นักศึกษาไม่สามารถตัดเกรดตัวเองได้
      const actionCell = isAdmin
        ? `
          <div class="flex items-center justify-end gap-1.5">
            <button onclick="openGradeModal(${e.id}, '${e.student_name}', '${e.course_code} ${e.course_name}', '${e.grade || ''}', '${e.status}')" class="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg transition" title="ตัดเกรด">
              <i class="fa-solid fa-pen-nib mr-1"></i> ตัดเกรด
            </button>
            <button onclick="deleteEnrollment(${e.id})" class="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition" title="ยกเลิกการลงทะเบียน">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        `
        : `
          <span class="text-xs text-slate-400 font-medium"><i class="fa-solid fa-check text-emerald-500 mr-1"></i>ลงทะเบียนแล้ว</span>
        `;

      return `
        <tr class="hover:bg-slate-50 transition">
          <td class="py-3 px-4">
            <p class="font-bold text-slate-800">${e.student_name}</p>
            <p class="text-[11px] text-slate-400 font-mono">${e.student_code}</p>
          </td>
          <td class="py-3 px-4">
            <p class="font-bold text-indigo-600 font-mono">${e.course_code}</p>
            <p class="text-[11px] text-slate-500">${e.course_name}</p>
          </td>
          <td class="py-3 px-4 text-center font-semibold text-slate-700">${e.course_credits || 3}</td>
          <td class="py-3 px-4 text-slate-600">${e.semester}</td>
          <td class="py-3 px-4 text-center">${gradeBadge}</td>
          <td class="py-3 px-4 text-center">
            <span class="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
              ${e.status}
            </span>
          </td>
          <td class="py-3 px-4 text-right">
            ${actionCell}
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="py-8 text-center text-rose-500">เกิดข้อผิดพลาด: ${err.message}</td></tr>`;
  }
}

function openGradeModal(id, studentName, courseInfo, currentGrade, currentStatus) {
  document.getElementById('grade-enrollment-id').value = id;
  document.getElementById('grade-student-label').textContent = `นักศึกษา: ${studentName}`;
  document.getElementById('grade-course-label').textContent = `วิชา: ${courseInfo}`;
  document.getElementById('grade-val').value = currentGrade || '';
  document.getElementById('grade-status').value = currentStatus || 'COMPLETED';
  openModal('modal-grade-form');
}

async function deleteEnrollment(id) {
  const res = await Swal.fire({
    title: 'ยกเลิกการลงทะเบียน?',
    text: 'คุณต้องการลบรายการลงทะเบียนนี้ใช่หรือไม่?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    confirmButtonText: 'ลบรายการ',
    cancelButtonText: 'ยกเลิก'
  });
  if (res.isConfirmed) {
    try {
      await window.smsApi.deleteEnrollment(id);
      showToast('success', 'ลบรายการลงทะเบียนแล้ว');
      loadEnrollments();
      loadDashboard();
    } catch (err) {
      Swal.fire('เกิดข้อผิดพลาด', err.message, 'error');
    }
  }
}

function renderDepartments() {
  const container = document.getElementById('departments-grid');
  container.innerHTML = appState.departments.map(d => `
    <div class="glass-card p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
            ${d.code}
          </span>
          <span class="text-[11px] text-slate-400 font-medium">${d.faculty}</span>
        </div>
        <h4 class="font-bold text-slate-900 text-sm mb-1">${d.name}</h4>
        <p class="text-xs text-slate-500 mb-3">${d.description || 'หลักสูตรมาตรฐานสากล'}</p>
      </div>
      <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-medium">
        <span><i class="fa-solid fa-user-graduate text-indigo-500 mr-1"></i> นักศึกษา: ${d.student_count || 0}</span>
        <span><i class="fa-solid fa-book text-blue-500 mr-1"></i> รายวิชา: ${d.course_count || 0}</span>
      </div>
    </div>
  `).join('');
}

function renderTeachers() {
  const container = document.getElementById('teachers-grid');
  container.innerHTML = appState.teachers.map(t => `
    <div class="glass-card p-5 rounded-2xl border border-slate-200 flex items-start gap-4">
      <div class="w-12 h-12 rounded-xl bg-gradient-to-tr from-slate-100 to-indigo-100 text-indigo-600 flex items-center justify-center text-lg font-bold">
        <i class="fa-solid fa-user-tie"></i>
      </div>
      <div class="flex-1">
        <div class="flex items-center justify-between">
          <h4 class="font-bold text-slate-900 text-sm">${t.full_name || `${t.title}${t.first_name} ${t.last_name}`}</h4>
          <span class="text-[10px] font-mono text-slate-400 font-semibold bg-slate-100 px-1.5 py-0.5 rounded">${t.teacher_code}</span>
        </div>
        <p class="text-xs text-indigo-600 font-medium mb-1.5">${t.department_name || 'อาจารย์ประจำภาควิชา'}</p>
        <div class="space-y-0.5 text-[11px] text-slate-500">
          <p><i class="fa-solid fa-envelope text-slate-400 mr-1.5"></i> ${t.email}</p>
          <p><i class="fa-solid fa-phone text-slate-400 mr-1.5"></i> ${t.phone || 'ไม่ระบุ'}</p>
          <p><i class="fa-solid fa-building text-slate-400 mr-1.5"></i> ${t.office || 'อาคารส่วนกลาง'}</p>
        </div>
      </div>
    </div>
  `).join('');
}

// =================== POPULATE DROPDOWNS ===================
function populateDepartmentSelects() {
  const stdDept = document.getElementById('std-department');
  const courseDept = document.getElementById('course-dept');
  const filterDept = document.getElementById('filter-student-dept');

  const options = appState.departments.map(d => `<option value="${d.id}">${d.code} - ${d.name}</option>`).join('');
  if (stdDept) stdDept.innerHTML = options;
  if (courseDept) courseDept.innerHTML = options;
  if (filterDept) filterDept.innerHTML = '<option value="">ทุกภาควิชา</option>' + options;
}

function populateTeacherSelects() {
  const stdAdv = document.getElementById('std-advisor');
  const cInst = document.getElementById('course-instructor');

  const options = '<option value="">-- ไม่ระบุ --</option>' + appState.teachers.map(t => `<option value="${t.id}">${t.full_name || `${t.title}${t.first_name} ${t.last_name}`} (${t.teacher_code})</option>`).join('');
  if (stdAdv) stdAdv.innerHTML = options;
  if (cInst) cInst.innerHTML = options;
}

async function populateEnrollmentDropdowns() {
  const stdSel = document.getElementById('enroll-student-select');
  const crsSel = document.getElementById('enroll-course-select');

  // โหลด students & courses
  const [stdRes, crsRes] = await Promise.all([
    window.smsApi.getStudents(),
    window.smsApi.getCourses(),
  ]);

  const stdList = stdRes.results || stdRes;
  const crsList = crsRes.results || crsRes;

  stdSel.innerHTML = stdList.map(s => `<option value="${s.id}">${s.student_id} - ${s.title || ''}${s.first_name} ${s.last_name}</option>`).join('');
  crsSel.innerHTML = crsList.map(c => `<option value="${c.id}">${c.course_code} - ${c.name} (${c.credits} หน่วยกิต)</option>`).join('');
}

// =================== UI HELPERS ===================
function updateServerStatusUI() {
  const pill = document.getElementById('server-status-pill');
  const endpoint = document.getElementById('current-api-endpoint');
  const mockText = document.getElementById('mock-status-text');

  if (endpoint) endpoint.textContent = window.smsApi.baseUrl;
  if (mockText) mockText.textContent = window.smsApi.isMockMode ? 'Mock: ON' : 'Mock: OFF';

  // Update Swagger link
  const swaggerLink = document.getElementById('link-swagger');
  const redocLink = document.getElementById('link-redoc');
  const schemaLink = document.getElementById('link-schema');
  if (swaggerLink) swaggerLink.href = `${window.smsApi.baseUrl}/api/docs/`;
  if (redocLink) redocLink.href = 'redoc.html';
  if (schemaLink) schemaLink.href = `${window.smsApi.baseUrl}/api/schema/`;

  // Status pill is hidden — no need to update its style
  if (!pill) return;

  if (window.smsApi.isMockMode) {
    pill.className = 'flex items-center gap-1.5 font-semibold text-amber-600 text-[11px] bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200';
    pill.innerHTML = '<span class="w-2 h-2 rounded-full bg-amber-500 pulse-mock"></span> โหมดจำลอง Mock';
  } else if (window.smsApi.isServerOnline) {
    pill.className = 'flex items-center gap-1.5 font-semibold text-emerald-600 text-[11px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200';
    pill.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-500 pulse-online"></span> เซิร์ฟเวอร์ออนไลน์';
  } else {
    pill.className = 'flex items-center gap-1.5 font-semibold text-rose-600 text-[11px] bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200';
    pill.innerHTML = '<span class="w-2 h-2 rounded-full bg-rose-500"></span> เซิร์ฟเวอร์ออฟไลน์';
  }
}

function updateAuthUI() {
  const btnLogin = document.getElementById('btn-login-modal');
  const badge = document.getElementById('user-profile-badge');
  const username = document.getElementById('auth-username');
  const role = document.getElementById('auth-role');

  const btnAddStudent = document.getElementById('btn-add-student');
  const btnAddCourse = document.getElementById('btn-add-course');
  const btnAddEnrollment = document.getElementById('btn-add-enrollment');

  const isAdmin = window.smsApi.isAdmin();
  const isAuth = window.smsApi.isAuthenticated();

  if (isAuth) {
    btnLogin.classList.add('hidden');
    badge.classList.remove('hidden');
    const user = window.smsApi.user;
    const fullName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : '';
    username.textContent = fullName || (user ? user.username : 'User');
    role.textContent = isAdmin ? 'Administrator (ผู้ดูแลระบบ)' : `Student (รหัส: ${user?.username || 'นิสิต'})`;
  } else {
    btnLogin.classList.remove('hidden');
    badge.classList.add('hidden');
  }

  // ซ่อนปุ่มสิทธิ์ระดับแอดมินถ้าล็อกอินเป็นนักศึกษา
  if (btnAddStudent) {
    if (isAdmin) btnAddStudent.classList.remove('hidden');
    else btnAddStudent.classList.add('hidden');
  }
  if (btnAddCourse) {
    if (isAdmin) btnAddCourse.classList.remove('hidden');
    else btnAddCourse.classList.add('hidden');
  }
  if (btnAddEnrollment) {
    if (isAdmin) btnAddEnrollment.classList.remove('hidden');
    else btnAddEnrollment.classList.add('hidden');
  }
}

function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('hidden');
}

function quickFillLogin(u, p) {
  document.getElementById('login-username').value = u;
  document.getElementById('login-password').value = p;
}

function setQuickServerUrl(url) {
  document.getElementById('config-base-url').value = url;
}

function showToast(icon, title) {
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 2500,
    timerProgressBar: true,
  });
  Toast.fire({ icon, title });
}

function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const icon = btn.querySelector('i');
  if (input.type === 'password') {
    input.type = 'text';
    if (icon) {
      icon.classList.remove('fa-eye');
      icon.classList.add('fa-eye-slash');
    }
  } else {
    input.type = 'password';
    if (icon) {
      icon.classList.remove('fa-eye-slash');
      icon.classList.add('fa-eye');
    }
  }
}

// =================== CLASS SCHEDULE (ตารางเรียนของนิสิต) ===================

/**
 * แผนที่ตารางเวลามาตรฐานสำหรับรายวิชาหลัก (กำหนดวัน เวลา ห้องเรียน แบบคงที่)
 * ทุกนิสิตที่ลงวิชาเดียวกันจะได้วัน เวลา และห้องเรียนเหมือนกัน 100%
 */
const COURSE_SCHEDULE_MAP = {
  'CPE101': {
    day: 1,
    dayName: 'วันจันทร์',
    slot: 'morning',
    time: '09:00 - 12:00',
    room: 'LAB-401 (ปฏิบัติการคอมฯ)',
    color: 'indigo',
    instructor: 'ผศ.ดร.สมชาย ใจดีเลิศ',
  },
  'CPE201': {
    day: 2,
    dayName: 'วันอังคาร',
    slot: 'afternoon',
    time: '13:00 - 16:00',
    room: 'LAB-402 (โครงสร้างข้อมูล)',
    color: 'cyan',
    instructor: 'ผศ.ดร.สมชาย ใจดีเลิศ',
  },
  'IT301': {
    day: 3,
    dayName: 'วันพุธ',
    slot: 'morning',
    time: '09:00 - 12:00',
    room: 'ROOM-502 (ห้องบรรยาย)',
    color: 'purple',
    instructor: 'ดร.วิภาดา รุ่งเรืองวิทย์',
  },
  'SE202': {
    day: 4,
    dayName: 'วันพฤหัสบดี',
    slot: 'afternoon',
    time: '13:00 - 16:00',
    room: 'ROOM-501 (ห้องบรรยาย)',
    color: 'amber',
    instructor: 'อ.กิตติศักดิ์ พัฒนศิลป์',
  },
  'DS102': {
    day: 5,
    dayName: 'วันศุกร์',
    slot: 'morning',
    time: '09:00 - 12:00',
    room: 'LAB-303 (วิเคราะห์ข้อมูล)',
    color: 'emerald',
    instructor: 'ผศ.ณิชาภัทร สุวรรณโชติ',
  },
};

/**
 * คำนวณวันและเวลาเรียนของวิชาแบบคงที่ (Deterministic Hashing)
 * หากเป็นวิชาใหม่ที่เพิ่มเข้ามา ก็จะถูกคำนวณวัน เวลา และห้อง ให้เหมือนกันทุกคนเสมอ
 */
function getCourseScheduleSlot(courseCode) {
  const code = (courseCode || '').toUpperCase().trim();
  if (COURSE_SCHEDULE_MAP[code]) {
    return COURSE_SCHEDULE_MAP[code];
  }

  const days = [
    { day: 1, dayName: 'วันจันทร์', color: 'indigo' },
    { day: 2, dayName: 'วันอังคาร', color: 'pink' },
    { day: 3, dayName: 'วันพุธ', color: 'emerald' },
    { day: 4, dayName: 'วันพฤหัสบดี', color: 'amber' },
    { day: 5, dayName: 'วันศุกร์', color: 'cyan' },
  ];

  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = code.charCodeAt(i) + ((hash << 5) - hash);
  }

  const dayIndex = Math.abs(hash) % days.length;
  const isMorning = Math.abs(hash >> 3) % 2 === 0;
  const roomNum = (Math.abs(hash) % 8) + 1;
  const dayInfo = days[dayIndex];

  return {
    day: dayInfo.day,
    dayName: dayInfo.dayName,
    slot: isMorning ? 'morning' : 'afternoon',
    time: isMorning ? '09:00 - 12:00' : '13:00 - 16:00',
    room: `ROOM-40${roomNum}`,
    color: dayInfo.color,
    instructor: 'คณาจารย์ประจำภาควิชา',
  };
}

/**
 * โหลดและแสดงผลตารางเรียนของนิสิต
 */
async function loadSchedule(selectedStudentId = null) {
  try {
    // 1. ตรวจสอบและดึงข้อมูลพื้นฐานที่จำเป็น
    if (!appState.students || appState.students.length === 0) {
      const res = await window.smsApi.getStudents();
      appState.students = res.results || res;
    }
    if (!appState.courses || appState.courses.length === 0) {
      const res = await window.smsApi.getCourses();
      appState.courses = res.results || res;
    }
    if (!appState.enrollments || appState.enrollments.length === 0) {
      const res = await window.smsApi.getEnrollments();
      appState.enrollments = res.results || res;
    }

    const isAdmin = window.smsApi.isAdmin();
    const studentSelectBox = document.getElementById('schedule-student-selector-box');
    const studentSelect = document.getElementById('schedule-student-select');

    // 2. ระบุตัวตนของนิสิตเป้าหมาย
    let targetStudent = null;

    if (isAdmin) {
      // แอดมิน: แสดงช่องเลือกดูตารางเรียนของนิสิตคนใดก็ได้
      if (studentSelectBox) studentSelectBox.classList.remove('hidden');

      // เติมรายชื่อนิสิตใน Dropdown
      if (studentSelect && studentSelect.children.length <= 1) {
        studentSelect.innerHTML = appState.students.map(s => `
          <option value="${s.id || s.student_id}">
            ${s.student_id} - ${s.title || ''}${s.first_name} ${s.last_name}
          </option>
        `).join('');
      }

      if (selectedStudentId) {
        targetStudent = appState.students.find(s => String(s.id) === String(selectedStudentId) || String(s.student_id) === String(selectedStudentId));
        if (studentSelect) studentSelect.value = selectedStudentId;
      } else if (studentSelect && studentSelect.value) {
        targetStudent = appState.students.find(s => String(s.id) === String(studentSelect.value) || String(s.student_id) === String(studentSelect.value));
      }

      if (!targetStudent) {
        targetStudent = appState.students[0];
      }
    } else {
      // นิสิต: ซ่อน Dropdown และล็อกให้ดูเฉพาะตารางของตนเองเท่านั้น
      if (studentSelectBox) studentSelectBox.classList.add('hidden');
      targetStudent = findStudentForCurrentUser(appState.students);
    }

    if (!targetStudent) {
      console.warn('Schedule: Target student not found');
      return;
    }

    // 3. ดึงรายการวิชาที่นิสิตคนนี้ลงทะเบียนเรียน
    let studentEnrollments = appState.enrollments.filter(e => {
      const matchId = String(e.student) === String(targetStudent.id) || String(e.student_id) === String(targetStudent.id);
      const matchCode = String(e.student_code) === String(targetStudent.student_id) || String(e.student) === String(targetStudent.student_id);
      return matchId || matchCode;
    });

    // หากยังไม่พบ อาจเกิดจากเป็นนิสิตที่เพิ่งสมัครใหม่ ให้ลองดึงข้อมูลจาก detail API
    if (studentEnrollments.length === 0 && targetStudent.id) {
      try {
        const detail = await window.smsApi.getStudent(targetStudent.id);
        if (detail && detail.enrollments && detail.enrollments.length > 0) {
          studentEnrollments = detail.enrollments;
        }
      } catch (e) {
        // เงียบไว้
      }
    }

    // 4. ประกอบข้อมูลวิชาเรียนพร้อมวันเวลาห้องเรียน
    const scheduledCourses = studentEnrollments.map(e => {
      const courseCode = e.course_code || (appState.courses.find(c => c.id === e.course)?.course_code) || 'GEN101';
      const courseObj = appState.courses.find(c => c.course_code === courseCode || c.id === e.course);
      const courseName = e.course_name || courseObj?.name || 'รายวิชาทั่วไป';
      const credits = e.course_credits || courseObj?.credits || 3;
      const slotInfo = getCourseScheduleSlot(courseCode);
      const instructorName = courseObj?.instructor_name || slotInfo.instructor;

      return {
        ...e,
        courseCode,
        courseName,
        credits,
        instructorName,
        schedule: slotInfo,
      };
    });

    // 5. อัปเดตข้อมูลบน Header และ Chips สถิติ
    const studentFullName = targetStudent.full_name || `${targetStudent.title || ''}${targetStudent.first_name || ''} ${targetStudent.last_name || ''}`.trim() || 'นิสิต';
    const deptName = targetStudent.department_name || (appState.departments.find(d => d.id === targetStudent.department)?.name) || 'วิศวกรรมคอมพิวเตอร์';
    const totalCredits = scheduledCourses.reduce((sum, c) => sum + (Number(c.credits) || 0), 0);

    const nameEl = document.getElementById('schedule-header-student-name');
    if (nameEl) nameEl.textContent = `ตารางเรียน: ${studentFullName}`;

    const descEl = document.getElementById('schedule-header-student-desc');
    if (descEl) descEl.textContent = `รหัสนักศึกษา ${targetStudent.student_id || '-'} | ภาควิชา ${deptName} | ภาคการศึกษา 1/2569`;

    const statIdEl = document.getElementById('schedule-stat-id');
    if (statIdEl) statIdEl.textContent = targetStudent.student_id || '-';

    const statDeptEl = document.getElementById('schedule-stat-dept');
    if (statDeptEl) statDeptEl.textContent = deptName;

    const statCoursesEl = document.getElementById('schedule-stat-courses');
    if (statCoursesEl) statCoursesEl.textContent = `${scheduledCourses.length} วิชา`;

    const statCreditsEl = document.getElementById('schedule-stat-credits');
    if (statCreditsEl) statCreditsEl.textContent = `${totalCredits} หน่วยกิต`;

    // 6. เรนเดอร์ตารางเรียนประจำสัปดาห์ (Weekly Timetable Grid)
    renderTimetableGrid(scheduledCourses);

    // 7. เรนเดอร์การ์ดสรุปรายการวิชาที่ลงทะเบียน
    renderScheduleCoursesList(scheduledCourses);

  } catch (err) {
    console.error('Error loading schedule:', err);
  }
}

/**
 * เรนเดอร์ช่องตารางเรียน 5 วัน (จันทร์ - ศุกร์)
 */
function renderTimetableGrid(scheduledCourses) {
  const tbody = document.getElementById('schedule-table-body');
  if (!tbody) return;

  const days = [
    { num: 1, name: 'วันจันทร์', en: 'Monday', badge: 'bg-amber-100 text-amber-900 border-amber-300' },
    { num: 2, name: 'วันอังคาร', en: 'Tuesday', badge: 'bg-pink-100 text-pink-900 border-pink-300' },
    { num: 3, name: 'วันพุธ', en: 'Wednesday', badge: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
    { num: 4, name: 'วันพฤหัสบดี', en: 'Thursday', badge: 'bg-orange-100 text-orange-900 border-orange-300' },
    { num: 5, name: 'วันศุกร์', en: 'Friday', badge: 'bg-sky-100 text-sky-900 border-sky-300' },
  ];

  tbody.innerHTML = days.map(d => {
    // หาวิชาที่เรียนวันและช่วงเวลานี้
    const morningCourse = scheduledCourses.find(c => c.schedule.day === d.num && c.schedule.slot === 'morning');
    const afternoonCourse = scheduledCourses.find(c => c.schedule.day === d.num && c.schedule.slot === 'afternoon');

    return `
      <tr class="hover:bg-slate-50/60 transition-colors">
        <!-- Day Badge Column -->
        <td class="py-3 px-3 font-semibold align-middle">
          <div class="inline-flex flex-col px-2.5 py-1.5 rounded-xl border ${d.badge} shadow-2xs">
            <span class="text-xs font-bold leading-tight">${d.name}</span>
            <span class="text-[10px] font-normal opacity-75">${d.en}</span>
          </div>
        </td>

        <!-- 08:00 - 09:00 (Activity / Prep) -->
        <td class="py-3 px-2 text-center border-l border-slate-100 text-slate-300 text-xs">
          -
        </td>

        <!-- 09:00 - 12:00 (Morning Slot) -->
        <td class="p-2 border-l border-slate-100 align-middle">
          ${renderScheduleSlotCard(morningCourse, 'morning')}
        </td>

        <!-- 12:00 - 13:00 (Lunch Break) -->
        <td class="py-3 px-2 text-center border-l border-slate-100 bg-amber-50/20 text-slate-400 text-[11px] font-medium">
          <span class="opacity-70">🍱 พัก</span>
        </td>

        <!-- 13:00 - 16:00 (Afternoon Slot) -->
        <td class="p-2 border-l border-slate-100 align-middle">
          ${renderScheduleSlotCard(afternoonCourse, 'afternoon')}
        </td>

        <!-- 16:00 - 17:00 (Consultation) -->
        <td class="py-3 px-2 text-center border-l border-slate-100 text-slate-300 text-xs">
          -
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * เรนเดอร์การ์ดวิชาเรียนในแต่ละช่องของตาราง
 */
function renderScheduleSlotCard(course, slotType) {
  if (!course) {
    return `
      <div class="h-20 rounded-xl border border-dashed border-slate-200 bg-slate-50/40 flex items-center justify-center text-slate-300 text-xs">
        <span class="italic">ไม่มีวิชาเรียน</span>
      </div>
    `;
  }

  const colorStyles = {
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-900 border-l-4 border-l-indigo-600',
    cyan: 'bg-cyan-50 border-cyan-200 text-cyan-900 border-l-4 border-l-cyan-600',
    purple: 'bg-purple-50 border-purple-200 text-purple-900 border-l-4 border-l-purple-600',
    amber: 'bg-amber-50 border-amber-200 text-amber-900 border-l-4 border-l-amber-600',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-900 border-l-4 border-l-emerald-600',
    pink: 'bg-pink-50 border-pink-200 text-pink-900 border-l-4 border-l-pink-600',
  };

  const style = colorStyles[course.schedule.color] || colorStyles.indigo;

  return `
    <div class="p-2.5 rounded-xl border ${style} shadow-2xs hover:shadow-md transition-all duration-200">
      <div class="flex items-center justify-between gap-1 mb-1">
        <span class="font-bold text-xs font-mono tracking-tight">${course.courseCode}</span>
        <span class="text-[10px] font-semibold bg-white/80 px-1.5 py-0.5 rounded shadow-2xs border border-black/5">
          ${course.credits} หน่วยกิต
        </span>
      </div>
      <div class="font-medium text-xs leading-snug line-clamp-1 mb-1.5" title="${course.courseName}">
        ${course.courseName}
      </div>
      <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] opacity-80 pt-1 border-t border-black/5">
        <span class="flex items-center gap-1 font-semibold">
          <i class="fa-solid fa-location-dot text-indigo-500"></i> ${course.schedule.room}
        </span>
        <span class="flex items-center gap-1 text-[10px] truncate max-w-[140px]" title="${course.instructorName}">
          <i class="fa-solid fa-user-tie opacity-70"></i> ${course.instructorName}
        </span>
      </div>
    </div>
  `;
}

/**
 * เรนเดอร์การ์ดสรุปวิชาทั้งหมดที่ลงทะเบียนเรียน
 */
function renderScheduleCoursesList(scheduledCourses) {
  const container = document.getElementById('schedule-courses-list');
  if (!container) return;

  if (scheduledCourses.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-8 text-center text-slate-400">
        <i class="fa-solid fa-calendar-xmark text-3xl mb-2 block opacity-40"></i>
        <span>ยังไม่มีวิชาที่ลงทะเบียนในภาคการศึกษานี้</span>
      </div>
    `;
    return;
  }

  container.innerHTML = scheduledCourses.map(c => `
    <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-indigo-300 transition-all flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between mb-2">
          <span class="font-bold text-indigo-600 font-mono text-sm">${c.courseCode}</span>
          <span class="text-[11px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100">
            ${c.credits} หน่วยกิต
          </span>
        </div>
        <h5 class="font-bold text-slate-800 text-xs mb-2">${c.courseName}</h5>
      </div>

      <div class="space-y-1.5 pt-3 border-t border-slate-100 text-xs text-slate-600">
        <div class="flex items-center gap-2">
          <i class="fa-solid fa-clock text-indigo-500 w-4 text-center"></i>
          <span>${c.schedule.dayName} เวลา ${c.schedule.time}</span>
        </div>
        <div class="flex items-center gap-2">
          <i class="fa-solid fa-door-open text-emerald-500 w-4 text-center"></i>
          <span>${c.schedule.room}</span>
        </div>
        <div class="flex items-center gap-2">
          <i class="fa-solid fa-chalkboard-user text-purple-500 w-4 text-center"></i>
          <span class="truncate">${c.instructorName}</span>
        </div>
      </div>
    </div>
  `).join('');
}
