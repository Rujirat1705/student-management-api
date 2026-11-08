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
  updateServerStatusUI();

  // ตรวจสอบการเชื่อมต่อเซิร์ฟเวอร์ Backend
  const isOnline = await window.smsApi.checkServerHealth();
  if (!isOnline && !window.smsApi.isMockMode) {
    // ถ้าเซิร์ฟเวอร์ยังไม่เปิด ให้เปิดโหมด Mock Demo ให้อัตโนมัติ เพื่อให้ผู้ใช้เปิดดูผลงานได้ทันที
    window.smsApi.setMockMode(true);
    updateServerStatusUI();
    Swal.fire({
      icon: 'info',
      title: 'เปิดโหมดจำลอง (Mock Demo Mode)',
      text: 'ไม่พบการเชื่อมต่อกับ Django Backend API ระบบจึงเปิดโหมดข้อมูลจำลองให้คุณสามารถทดสอบคลิกดูผลงานได้ทันที!',
      confirmButtonText: 'รับทราบ',
      confirmButtonColor: '#4f46e5'
    });
  }

  // โหลดข้อมูลพื้นฐานและ Dashboard
  await loadBaseData();
  await loadDashboard();
});

// =================== TAB NAVIGATION ===================
function switchTab(tabName) {
  appState.currentTab = tabName;

  // ปรับการเน้นปุ่มบน Sidebar
  document.querySelectorAll('.nav-item').forEach(btn => {
    if (btn.getAttribute('data-tab') === tabName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // ปรับการแสดง Section
  document.querySelectorAll('.tab-content').forEach(sec => {
    sec.classList.add('hidden');
    sec.classList.remove('active');
  });

  const activeSec = document.getElementById(`tab-${tabName}`);
  if (activeSec) {
    activeSec.classList.remove('hidden');
    activeSec.classList.add('active');
  }

  // ปรับ Title บน Header
  const titles = {
    'dashboard': { title: 'ภาพรวมสถิติระบบ (Dashboard)', subtitle: 'รายงานสรุปข้อมูลนักศึกษาและการลงทะเบียนเรียนแบบเรียลไทม์' },
    'students': { title: 'จัดการข้อมูลนักศึกษา (Students)', subtitle: 'ค้นหา เพิ่ม แก้ไข ลบข้อมูลนักศึกษา และคำนวณ GPA สะสม' },
    'courses': { title: 'รายวิชาที่เปิดสอน (Courses)', subtitle: 'จัดการหลักสูตรและรายวิชาที่เปิดสอนในแต่ละภาควิชา' },
    'enrollments': { title: 'การลงทะเบียนเรียน & ตัดเกรด (Enrollment & Grading)', subtitle: 'บันทึกการลงทะเบียนรายวิชา และประมวลผลเกรดสะสม' },
    'departments': { title: 'ภาควิชา & คณาจารย์ (Departments & Faculty)', subtitle: 'โครงสร้างภาควิชาและทำเนียบคณาจารย์ที่ปรึกษา' },
    'api-docs': { title: 'เอกสาร API & เกณฑ์การประเมิน', subtitle: 'Interactive Swagger UI, Redoc และเกณฑ์คะแนนโครงงาน 100 คะแนนเต็ม' },
  };

  if (titles[tabName]) {
    document.getElementById('page-title').textContent = titles[tabName].title;
    document.getElementById('page-subtitle').textContent = titles[tabName].subtitle;
  }

  // โหลดข้อมูลตามแต่ละแท็บ
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
      switchTab(tab);
    });
  });

  // Refresh
  document.getElementById('btn-refresh-data').addEventListener('click', async () => {
    await loadBaseData();
    switchTab(appState.currentTab);
    showToast('success', 'รีเฟรชข้อมูลล่าสุดสำเร็จ');
  });

  // Mock Mode Toggle
  document.getElementById('btn-toggle-mock').addEventListener('click', () => {
    const newMode = !window.smsApi.isMockMode;
    window.smsApi.setMockMode(newMode);
    updateServerStatusUI();
    showToast('info', `สลับโหมดเป็น: ${newMode ? 'Mock Data (ข้อมูลจำลอง)' : 'Live Backend API'}`);
    loadDashboard();
  });

  // Server Config
  document.getElementById('btn-open-server-config').addEventListener('click', () => {
    document.getElementById('config-base-url').value = window.smsApi.baseUrl;
    openModal('modal-server-config');
  });

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
    showToast('info', 'ออกจากระบบเรียบร้อยแล้ว');
  });

  // Login Form
  document.getElementById('form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const u = document.getElementById('login-username').value;
    const p = document.getElementById('login-password').value;
    try {
      await window.smsApi.login(u, p);
      closeModal('modal-login');
      updateAuthUI();
      showToast('success', `ยินดีต้อนรับคุณ ${u}! เข้าสู่ระบบสำเร็จ`);
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
    const data = {
      username: document.getElementById('reg-username').value,
      email: document.getElementById('reg-email').value,
      first_name: document.getElementById('reg-first-name').value,
      last_name: document.getElementById('reg-last-name').value,
      password: p1,
      password_confirm: p2,
    };
    try {
      await window.smsApi.register(data);
      closeModal('modal-register');
      updateAuthUI();
      showToast('success', 'สมัครสมาชิกสำเร็จ! เข้าสู่ระบบให้อัตโนมัติ');
    } catch (err) {
      Swal.fire('สมัครสมาชิกไม่สำเร็จ', err.message, 'error');
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

async function loadStudents() {
  const tbody = document.getElementById('student-table-body');
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
    const students = res.results || res;
    appState.students = students;

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

      return `
        <tr class="hover:bg-slate-50/70 transition">
          <td class="py-3 px-4">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                ${initials || 'ST'}
              </div>
              <div>
                <p class="font-bold text-slate-800">${s.title || ''}${s.first_name} ${s.last_name}</p>
                <p class="text-[11px] text-slate-400 font-mono">${s.student_id}</p>
              </div>
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
              <button onclick="viewStudentDetail(${s.id})" class="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="ดูผลการเรียนและคำนวณ GPA">
                <i class="fa-solid fa-eye"></i>
              </button>
              <button onclick="editStudent(${s.id})" class="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition" title="แก้ไขข้อมูล">
                <i class="fa-solid fa-pen-to-square"></i>
              </button>
              <button onclick="deleteStudent(${s.id}, '${s.student_id}', '${s.first_name}')" class="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition" title="ลบข้อมูล">
                <i class="fa-solid fa-trash-can"></i>
              </button>
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

    document.getElementById('detail-name').textContent = `${student.title || ''}${student.first_name} ${student.last_name}`;
    document.getElementById('detail-code-dept').textContent = `รหัส: ${student.student_id} | ${student.department_name || ''} (ปี ${student.year_level})`;
    document.getElementById('detail-advisor').textContent = `อาจารย์ที่ปรึกษา: ${student.advisor_name || 'ไม่ระบุ'}`;
    document.getElementById('detail-gpa').textContent = student.gpa;
    document.getElementById('detail-avatar').textContent = (student.first_name || '').charAt(0) + (student.last_name || '').charAt(0);

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

    container.innerHTML = courses.map(c => `
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
          <div class="flex items-center gap-1">
            <button onclick="editCourse(${c.id})" class="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition" title="แก้ไขวิชา">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button onclick="deleteCourse(${c.id}, '${c.course_code}')" class="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition" title="ลบวิชา">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </div>
      </div>
    `).join('');
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
  tbody.innerHTML = '<tr><td colspan="7" class="py-8 text-center text-slate-400">กำลังโหลดรายการลงทะเบียน...</td></tr>';

  const params = {};
  const sem = document.getElementById('filter-enrollment-semester').value;
  if (sem) params.semester = sem;

  try {
    const res = await window.smsApi.getEnrollments(params);
    const enrollments = res.results || res;
    appState.enrollments = enrollments;

    if (enrollments.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="py-12 text-center text-slate-400">ไม่พบข้อมูลการลงทะเบียน</td></tr>';
      return;
    }

    tbody.innerHTML = enrollments.map(e => {
      const gradeBadge = e.grade ? `<span class="inline-block bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded text-xs border border-indigo-200">${e.grade}</span>` : '<span class="text-slate-400">-</span>';
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
            <div class="flex items-center justify-end gap-1.5">
              <button onclick="openGradeModal(${e.id}, '${e.student_name}', '${e.course_code} ${e.course_name}', '${e.grade || ''}', '${e.status}')" class="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg transition" title="ตัดเกรด">
                <i class="fa-solid fa-pen-nib mr-1"></i> ตัดเกรด
              </button>
              <button onclick="deleteEnrollment(${e.id})" class="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition" title="ยกเลิกการลงทะเบียน">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
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
  if (redocLink) redocLink.href = `${window.smsApi.baseUrl}/api/redoc/`;
  if (schemaLink) schemaLink.href = `${window.smsApi.baseUrl}/api/schema/`;

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

  if (window.smsApi.isAuthenticated()) {
    btnLogin.classList.add('hidden');
    badge.classList.remove('hidden');
    const user = window.smsApi.user;
    username.textContent = user ? (user.username || 'User') : 'User';
    role.textContent = (user && user.is_staff) ? 'Administrator' : 'Student/User';
  } else {
    btnLogin.classList.remove('hidden');
    badge.classList.add('hidden');
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
