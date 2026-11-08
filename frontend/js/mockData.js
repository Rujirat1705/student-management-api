/**
 * Mock Data Module (ข้อมูลจำลองสำหรับการนำเสนอและทดสอบแบบ Standalone)
 * ข้อมูลจำลองนี้อิงตาม Seed Data ของ Django Backend 100%
 */

const mockDepartments = [
  { id: 1, code: 'CPE', name: 'วิศวกรรมคอมพิวเตอร์', faculty: 'คณะวิศวกรรมศาสตร์', description: 'หลักสูตรการออกแบบฮาร์ดแวร์และซอฟต์แวร์ระดับสูง', student_count: 3, course_count: 2 },
  { id: 2, code: 'IT', name: 'เทคโนโลยีสารสนเทศ', faculty: 'คณะวิทยาการสารสนเทศ', description: 'หลักสูตรการพัฒนาระบบเครือข่ายและเว็บแอพพลิเคชัน', student_count: 2, course_count: 2 },
  { id: 3, code: 'SE', name: 'วิศวกรรมซอฟต์แวร์', faculty: 'คณะวิทยาการสารสนเทศ', description: 'เน้นกระบวนการพัฒนาซอฟต์แวร์และการบริหารจัดการโปรเจกต์', student_count: 2, course_count: 1 },
  { id: 4, code: 'DS', name: 'วิทยาการข้อมูลและการวิเคราะห์', faculty: 'คณะวิทยาการสารสนเทศ', description: 'เน้นวิทยาศาสตร์ข้อมูล ปัญญาประดิษฐ์ และ Machine Learning', student_count: 1, course_count: 1 },
];

const mockTeachers = [
  { id: 1, teacher_code: 'T1001', title: 'ผศ.ดร.', first_name: 'สมชาย', last_name: 'ใจดีเลิศ', full_name: 'ผศ.ดร.สมชาย ใจดีเลิศ', email: 'somchai.j@university.ac.th', phone: '0812345678', department: 1, department_name: 'วิศวกรรมคอมพิวเตอร์', office: 'อาคาร 4 ชั้น 3 ห้อง 4301' },
  { id: 2, teacher_code: 'T1002', title: 'รศ.ดร.', first_name: 'วิภาดา', last_name: 'รัตนมงคล', full_name: 'รศ.ดร.วิภาดา รัตนมงคล', email: 'wiphada.r@university.ac.th', phone: '0823456789', department: 1, department_name: 'วิศวกรรมคอมพิวเตอร์', office: 'อาคาร 4 ชั้น 3 ห้อง 4302' },
  { id: 3, teacher_code: 'T2001', title: 'ดร.', first_name: 'กิตติพงษ์', last_name: 'ทรัพย์อนันต์', full_name: 'ดร.กิตติพงษ์ ทรัพย์อนันต์', email: 'kittipong.s@university.ac.th', phone: '0834567890', department: 2, department_name: 'เทคโนโลยีสารสนเทศ', office: 'อาคาร 8 ชั้น 2 ห้อง 8205' },
  { id: 4, teacher_code: 'T3001', title: 'อ.', first_name: 'ณัฐพร', last_name: 'เกียรติไพบูลย์', full_name: 'อ.ณัฐพร เกียรติไพบูลย์', email: 'nattaporn.k@university.ac.th', phone: '0845678901', department: 3, department_name: 'วิศวกรรมซอฟต์แวร์', office: 'อาคาร 8 ชั้น 4 ห้อง 8401' },
  { id: 5, teacher_code: 'T4001', title: 'ผศ.', first_name: 'ธีรเดช', last_name: 'สิริวิริยะกุล', full_name: 'ผศ.ธีรเดช สิริวิริยะกุล', email: 'teeradej.s@university.ac.th', phone: '0856789012', department: 4, department_name: 'วิทยาการข้อมูลและการวิเคราะห์', office: 'อาคาร 8 ชั้น 5 ห้อง 8503' },
];

const mockCourses = [
  { id: 1, course_code: 'CPE101', name: 'Computer Programming Fundamentals', credits: 3, description: 'หลักการเขียนโปรแกรมเบื้องต้นด้วยภาษา Python และ C', department: 1, department_name: 'วิศวกรรมคอมพิวเตอร์', instructor: 1, instructor_name: 'ผศ.ดร.สมชาย ใจดีเลิศ', enrolled_count: 4 },
  { id: 2, course_code: 'CPE202', name: 'Data Structures and Algorithms', credits: 3, description: 'โครงสร้างข้อมูล แถวลำดับ ลิงก์ลิสต์ ต้นไม้ กราฟ และขั้นตอนวิธี', department: 1, department_name: 'วิศวกรรมคอมพิวเตอร์', instructor: 2, instructor_name: 'รศ.ดร.วิภาดา รัตนมงคล', enrolled_count: 3 },
  { id: 3, course_code: 'IT201', name: 'Web Application Development', credits: 3, description: 'การพัฒนาเว็บแอปพลิเคชันยุคใหม่ Full-stack (HTML, CSS, JS, REST API)', department: 2, department_name: 'เทคโนโลยีสารสนเทศ', instructor: 3, instructor_name: 'ดร.กิตติพงษ์ ทรัพย์อนันต์', enrolled_count: 5 },
  { id: 4, course_code: 'IT302', name: 'Cloud Computing and DevOps', credits: 3, description: 'ระบบคลาวด์ การทำ Container ด้วย Docker และการส่งมอบซอฟต์แวร์ CI/CD', department: 2, department_name: 'เทคโนโลยีสารสนเทศ', instructor: 3, instructor_name: 'ดร.กิตติพงษ์ ทรัพย์อนันต์', enrolled_count: 2 },
  { id: 5, course_code: 'SE201', name: 'Software Engineering Principles', credits: 3, description: 'วงจรชีวิตการพัฒนาซอฟต์แวร์ Agile, Scrum, Kanban และการออกแบบระบบ', department: 3, department_name: 'วิศวกรรมซอฟต์แวร์', instructor: 4, instructor_name: 'อ.ณัฐพร เกียรติไพบูลย์', enrolled_count: 3 },
  { id: 6, course_code: 'DS101', name: 'Introduction to Data Science & AI', credits: 3, description: 'วิทยาศาสตร์ข้อมูลเบื้องต้น การวิเคราะห์ข้อมูล สถิติ และ Machine Learning พื้นฐาน', department: 4, department_name: 'วิทยาการข้อมูลและการวิเคราะห์', instructor: 5, instructor_name: 'ผศ.ธีรเดช สิริวิริยะกุล', enrolled_count: 2 },
];

let mockStudents = [
  {
    id: 1,
    student_id: '66010001',
    title: 'นาย',
    first_name: 'ภานุพงศ์',
    last_name: 'มณีโรจน์',
    full_name: 'นายภานุพงศ์ มณีโรจน์',
    gender: 'M',
    date_of_birth: '2004-05-15',
    email: 'panupong.m@student.ac.th',
    phone: '0891112233',
    address: '123/45 ถนนสุขุมวิท แขวงคลองเตย กรุงเทพมหานคร 10110',
    department: 1,
    department_code: 'CPE',
    department_name: 'วิศวกรรมคอมพิวเตอร์',
    advisor: 1,
    advisor_name: 'ผศ.ดร.สมชาย ใจดีเลิศ',
    year_level: 2,
    status: 'ACTIVE',
    gpa: '3.67',
    enrollments: [
      { id: 101, student: 1, student_code: '66010001', student_name: 'นายภานุพงศ์ มณีโรจน์', course: 1, course_code: 'CPE101', course_name: 'Computer Programming Fundamentals', course_credits: 3, semester: '1/2568', academic_year: 2568, grade: 'A', status: 'COMPLETED' },
      { id: 102, student: 1, student_code: '66010001', student_name: 'นายภานุพงศ์ มณีโรจน์', course: 2, course_code: 'CPE202', course_name: 'Data Structures and Algorithms', course_credits: 3, semester: '2/2568', academic_year: 2568, grade: 'B+', status: 'COMPLETED' },
      { id: 103, student: 1, student_code: '66010001', student_name: 'นายภานุพงศ์ มณีโรจน์', course: 3, course_code: 'IT201', course_name: 'Web Application Development', course_credits: 3, semester: '1/2569', academic_year: 2569, grade: 'A', status: 'COMPLETED' },
    ]
  },
  {
    id: 2,
    student_id: '66010002',
    title: 'นางสาว',
    first_name: 'กมลชนก',
    last_name: 'ประเสริฐยิ่ง',
    full_name: 'นางสาวกมลชนก ประเสริฐยิ่ง',
    gender: 'F',
    date_of_birth: '2004-08-20',
    email: 'kamolchanok.p@student.ac.th',
    phone: '0892223344',
    address: '88 หมู่ 3 ต.บางกระสอ อ.เมือง จ.นนทบุรี 11000',
    department: 1,
    department_code: 'CPE',
    department_name: 'วิศวกรรมคอมพิวเตอร์',
    advisor: 2,
    advisor_name: 'รศ.ดร.วิภาดา รัตนมงคล',
    year_level: 2,
    status: 'ACTIVE',
    gpa: '3.83',
    enrollments: [
      { id: 104, student: 2, student_code: '66010002', student_name: 'นางสาวกมลชนก ประเสริฐยิ่ง', course: 1, course_code: 'CPE101', course_name: 'Computer Programming Fundamentals', course_credits: 3, semester: '1/2568', academic_year: 2568, grade: 'A', status: 'COMPLETED' },
      { id: 105, student: 2, student_code: '66010002', student_name: 'นางสาวกมลชนก ประเสริฐยิ่ง', course: 2, course_code: 'CPE202', course_name: 'Data Structures and Algorithms', course_credits: 3, semester: '2/2568', academic_year: 2568, grade: 'A', status: 'COMPLETED' },
    ]
  },
  {
    id: 3,
    student_id: '65020001',
    title: 'นาย',
    first_name: 'ธนกฤต',
    last_name: 'เลิศวิวัฒน์วงศ์',
    full_name: 'นายธนกฤต เลิศวิวัฒน์วงศ์',
    gender: 'M',
    date_of_birth: '2003-02-10',
    email: 'thanakrit.l@student.ac.th',
    phone: '0893334455',
    address: '45/9 ถนนพหลโยธิน แขวงลาดยาว เขตจตุจักร กทม. 10900',
    department: 2,
    department_code: 'IT',
    department_name: 'เทคโนโลยีสารสนเทศ',
    advisor: 3,
    advisor_name: 'ดร.กิตติพงษ์ ทรัพย์อนันต์',
    year_level: 3,
    status: 'ACTIVE',
    gpa: '3.25',
    enrollments: [
      { id: 106, student: 3, student_code: '65020001', student_name: 'นายธนกฤต เลิศวิวัฒน์วงศ์', course: 3, course_code: 'IT201', course_name: 'Web Application Development', course_credits: 3, semester: '1/2568', academic_year: 2568, grade: 'B+', status: 'COMPLETED' },
      { id: 107, student: 3, student_code: '65020001', student_name: 'นายธนกฤต เลิศวิวัฒน์วงศ์', course: 4, course_code: 'IT302', course_name: 'Cloud Computing and DevOps', course_credits: 3, semester: '2/2568', academic_year: 2568, grade: 'B', status: 'COMPLETED' },
    ]
  },
  {
    id: 4,
    student_id: '65020002',
    title: 'นางสาว',
    first_name: 'ศิริพร',
    last_name: 'แสงสุวรรณ',
    full_name: 'นางสาวศิริพร แสงสุวรรณ',
    gender: 'F',
    date_of_birth: '2003-11-25',
    email: 'siriporn.s@student.ac.th',
    phone: '0894445566',
    address: '99/1 ต.บางแก้ว อ.บางพลี จ.สมุทรปราการ 10540',
    department: 2,
    department_code: 'IT',
    department_name: 'เทคโนโลยีสารสนเทศ',
    advisor: 3,
    advisor_name: 'ดร.กิตติพงษ์ ทรัพย์อนันต์',
    year_level: 3,
    status: 'ACTIVE',
    gpa: '3.50',
    enrollments: [
      { id: 108, student: 4, student_code: '65020002', student_name: 'นางสาวศิริพร แสงสุวรรณ', course: 3, course_code: 'IT201', course_name: 'Web Application Development', course_credits: 3, semester: '1/2568', academic_year: 2568, grade: 'A', status: 'COMPLETED' },
      { id: 109, student: 4, student_code: '65020002', student_name: 'นางสาวศิริพร แสงสุวรรณ', course: 4, course_code: 'IT302', course_name: 'Cloud Computing and DevOps', course_credits: 3, semester: '2/2568', academic_year: 2568, grade: 'B', status: 'COMPLETED' },
    ]
  },
  {
    id: 5,
    student_id: '64030001',
    title: 'นาย',
    first_name: 'อัครพล',
    last_name: 'วิริยะกิจ',
    full_name: 'นายอัครพล วิริยะกิจ',
    gender: 'M',
    date_of_birth: '2002-04-18',
    email: 'akarapol.w@student.ac.th',
    phone: '0895556677',
    address: '12/8 ซอยลาดพร้าว 101 แขวงคลองจั่น เขตบางกะปิ กทม. 10240',
    department: 3,
    department_code: 'SE',
    department_name: 'วิศวกรรมซอฟต์แวร์',
    advisor: 4,
    advisor_name: 'อ.ณัฐพร เกียรติไพบูลย์',
    year_level: 4,
    status: 'ACTIVE',
    gpa: '3.00',
    enrollments: [
      { id: 110, student: 5, student_code: '64030001', student_name: 'นายอัครพล วิริยะกิจ', course: 5, course_code: 'SE201', course_name: 'Software Engineering Principles', course_credits: 3, semester: '1/2567', academic_year: 2567, grade: 'B', status: 'COMPLETED' },
      { id: 111, student: 5, student_code: '64030001', student_name: 'นายอัครพล วิริยะกิจ', course: 3, course_code: 'IT201', course_name: 'Web Application Development', course_credits: 3, semester: '2/2567', academic_year: 2567, grade: 'B', status: 'COMPLETED' },
    ]
  },
  {
    id: 6,
    student_id: '67040001',
    title: 'นางสาว',
    first_name: 'พิชญา',
    last_name: 'ตั้งจิตมั่นคง',
    full_name: 'นางสาวพิชญา ตั้งจิตมั่นคง',
    gender: 'F',
    date_of_birth: '2005-09-05',
    email: 'pitchaya.t@student.ac.th',
    phone: '0896667788',
    address: '50/2 ถนนรัชดาภิเษก แขวงดินแดง เขตดินแดง กทม. 10400',
    department: 4,
    department_code: 'DS',
    department_name: 'วิทยาการข้อมูลและการวิเคราะห์',
    advisor: 5,
    advisor_name: 'ผศ.ธีรเดช สิริวิริยะกุล',
    year_level: 1,
    status: 'ACTIVE',
    gpa: '4.00',
    enrollments: [
      { id: 112, student: 6, student_code: '67040001', student_name: 'นางสาวพิชญา ตั้งจิตมั่นคง', course: 6, course_code: 'DS101', course_name: 'Introduction to Data Science & AI', course_credits: 3, semester: '1/2569', academic_year: 2569, grade: 'A', status: 'COMPLETED' },
    ]
  },
  {
    id: 7,
    student_id: '63010001',
    title: 'นาย',
    first_name: 'ปรเมษฐ์',
    last_name: 'วงศ์เจริญกิจ',
    full_name: 'นายปรเมษฐ์ วงศ์เจริญกิจ',
    gender: 'M',
    date_of_birth: '2001-01-12',
    email: 'paramate.w@student.ac.th',
    phone: '0897778899',
    address: '77/12 ถนนพระราม 9 แขวงห้วยขวาง เขตห้วยขวาง กทม. 10310',
    department: 1,
    department_code: 'CPE',
    department_name: 'วิศวกรรมคอมพิวเตอร์',
    advisor: 1,
    advisor_name: 'ผศ.ดร.สมชาย ใจดีเลิศ',
    year_level: 4,
    status: 'GRADUATED',
    gpa: '3.75',
    enrollments: [
      { id: 113, student: 7, student_code: '63010001', student_name: 'นายปรเมษฐ์ วงศ์เจริญกิจ', course: 1, course_code: 'CPE101', course_name: 'Computer Programming Fundamentals', course_credits: 3, semester: '1/2565', academic_year: 2565, grade: 'A', status: 'COMPLETED' },
      { id: 114, student: 7, student_code: '63010001', student_name: 'นายปรเมษฐ์ วงศ์เจริญกิจ', course: 2, course_code: 'CPE202', course_name: 'Data Structures and Algorithms', course_credits: 3, semester: '2/2565', academic_year: 2565, grade: 'A', status: 'COMPLETED' },
    ]
  },
  {
    id: 8,
    student_id: '64030002',
    title: 'นางสาว',
    first_name: 'วรัญญา',
    last_name: 'ชื่นชมบุญ',
    full_name: 'นางสาววรัญญา ชื่นชมบุญ',
    gender: 'F',
    date_of_birth: '2002-07-22',
    email: 'waranya.c@student.ac.th',
    phone: '0898889900',
    address: '23/4 หมู่บ้านเสรี ถนนเพชรเกษม แขวงบางหว้า เขตภาษีเจริญ กทม. 10160',
    department: 3,
    department_code: 'SE',
    department_name: 'วิศวกรรมซอฟต์แวร์',
    advisor: 4,
    advisor_name: 'อ.ณัฐพร เกียรติไพบูลย์',
    year_level: 4,
    status: 'ACTIVE',
    gpa: '3.50',
    enrollments: [
      { id: 115, student: 8, student_code: '64030002', student_name: 'นางสาววรัญญา ชื่นชมบุญ', course: 5, course_code: 'SE201', course_name: 'Software Engineering Principles', course_credits: 3, semester: '1/2567', academic_year: 2567, grade: 'B+', status: 'COMPLETED' },
      { id: 116, student: 8, student_code: '64030002', student_name: 'นางสาววรัญญา ชื่นชมบุญ', course: 1, course_code: 'CPE101', course_name: 'Computer Programming Fundamentals', course_credits: 3, semester: '2/2567', academic_year: 2567, grade: 'A', status: 'COMPLETED' },
    ]
  }
];

let mockEnrollments = [];
mockStudents.forEach(s => {
  if (s.enrollments) {
    mockEnrollments.push(...s.enrollments);
  }
});

const gradePointMap = {
  'A': 4.0,
  'B+': 3.5,
  'B': 3.0,
  'C+': 2.5,
  'C': 2.0,
  'D+': 1.5,
  'D': 1.0,
  'F': 0.0,
};

function calculateMockStudentGPA(studentId) {
  const student = mockStudents.find(s => s.id === Number(studentId));
  if (!student) return 0.0;
  const enrolls = mockEnrollments.filter(e => e.student === student.id && gradePointMap[e.grade] !== undefined);
  let totalPoints = 0;
  let totalCredits = 0;
  enrolls.forEach(e => {
    const course = mockCourses.find(c => c.id === e.course);
    const cr = course ? course.credits : (e.course_credits || 3);
    const pt = gradePointMap[e.grade] || 0.0;
    totalPoints += (pt * cr);
    totalCredits += cr;
  });
  const gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
  student.gpa = gpa;
  return gpa;
}
