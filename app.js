// ============== CONFIG ==============
const APP_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbyIhcn_TP7TH66NQFKWXQnDXQBmz_jejBKgBQYderALeQUAbML7iyqhKKxGvBnUkGcF2w/exec';

// ============== GLOBAL STATE ==============
let currentUser = null;
let isAdmin = false;
let allData = [];
let currentPage = 1;
const itemsPerPage = 5;
let editingItem = null;

// ============== HELPER: CALL APPS SCRIPT ==============
async function apiGetAll() {
  const res = await fetch(`${APP_SCRIPT_URL}?action=getAll`, {
    method: 'GET',
    mode: 'cors'
  });
  return res.json();
}

async function apiSaveItem(item) {
  const res = await fetch(APP_SCRIPT_URL, {
    method: 'POST',
    mode: 'cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'saveItem',
      item
    })
  });
  return res.json();
}

async function apiDeleteItem(item) {
  const res = await fetch(APP_SCRIPT_URL, {
    method: 'POST',
    mode: 'cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'deleteItem',
      item
    })
  });
  return res.json();
}

async function loadAllData() {
  try {
    const result = await apiGetAll();
    if (result.success) {
      allData = result.data || [];
      updateUI();
    } else {
      console.error('โหลดข้อมูลไม่สำเร็จ', result);
    }
  } catch (error) {
    console.error('API error:', error);
  }
}

// ============== LOGIN ==============
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  Swal.fire({
    title: 'กำลังเข้าสู่ระบบ...',
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  setTimeout(async () => {
    // ตรวจ user จาก sheet (type = user)
    const adminUser = allData.find(u => u.type === 'user' && u.email === email);

    if (adminUser && adminUser.password === password && (adminUser.active === true || adminUser.active === 'TRUE' || adminUser.active === 'true')) {
      currentUser = adminUser;
      isAdmin = true;

      await Swal.fire({
        icon: 'success',
        title: 'เข้าสู่ระบบสำเร็จ!',
        text: `ยินดีต้อนรับ ${adminUser.fullName}`,
        timer: 1500,
        showConfirmButton: false
      });

      showDashboard();
    } else if (email === 'admin@system.com' && password === 'admin123') {
      // Default admin login
      currentUser = {
        email: email,
        fullName: 'ผู้ดูแลระบบ',
        position: 'ผู้ดูแลระบบ'
      };
      isAdmin = true;

      await Swal.fire({
        icon: 'success',
        title: 'เข้าสู่ระบบสำเร็จ!',
        text: 'ยินดีต้อนรับผู้ดูแลระบบ',
        timer: 1500,
        showConfirmButton: false
      });

      showDashboard();
    } else {
      Swal.fire({
        icon: 'error',
        title: 'เข้าสู่ระบบไม่สำเร็จ',
        text: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
      });
    }
  }, 800);
});

document.getElementById('guestBtn').addEventListener('click', async () => {
  Swal.fire({
    title: 'กำลังเข้าสู่ระบบ...',
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  setTimeout(async () => {
    currentUser = {
      email: 'guest@system.com',
      fullName: 'ผู้ใช้งานทั่วไป',
      position: 'ผู้ใช้งาน'
    };
    isAdmin = false;

    await Swal.fire({
      icon: 'success',
      title: 'เข้าสู่ระบบสำเร็จ!',
      text: 'ยินดีต้อนรับสู่ระบบ',
      timer: 1500,
      showConfirmButton: false
    });

    showDashboard();
  }, 800);
});

function showDashboard() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('dashboard').classList.add('active');

  // Update user info
  const initials = currentUser.fullName.split(' ').map(n => n[0]).join('');
  document.getElementById('userAvatar').textContent = initials;
  document.getElementById('userName').textContent = currentUser.fullName;
  document.getElementById('userPosition').textContent = currentUser.position || '';

  // Hide admin menus for guests
  if (!isAdmin) {
    document.getElementById('menuUsers').style.display = 'none';
    document.getElementById('menuCourses').style.display = 'none';
    document.getElementById('menuTeachers').style.display = 'none';
    document.getElementById('addCourseBtn').style.display = 'none';
    document.getElementById('actionHeader').style.display = 'none';
  } else {
    document.getElementById('menuUsers').style.display = 'flex';
    document.getElementById('menuCourses').style.display = 'flex';
    document.getElementById('menuTeachers').style.display = 'flex';
    document.getElementById('addCourseBtn').style.display = 'inline-block';
    document.getElementById('actionHeader').style.display = 'table-cell';
  }

  // โหลดข้อมูลจาก Google Sheet
  loadAllData();
}

// ============== LOGOUT ==============
document.getElementById('logoutBtn').addEventListener('click', () => {
  Swal.fire({
    title: 'ออกจากระบบ?',
    text: 'คุณต้องการออกจากระบบใช่หรือไม่?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'ใช่, ออกจากระบบ',
    cancelButtonText: 'ยกเลิก',
    confirmButtonColor: '#dc3545'
  }).then((result) => {
    if (result.isConfirmed) {
      currentUser = null;
      isAdmin = false;
      document.getElementById('dashboard').classList.remove('active');
      document.getElementById('loginScreen').style.display = 'flex';
      document.getElementById('loginForm').reset();
    }
  });
});

// ============== SIDEBAR TOGGLE ==============
document.getElementById('toggleSidebar').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('collapsed');
});

// ============== MENU NAVIGATION ==============
document.querySelectorAll('.menu-item').forEach(item => {
  item.addEventListener('click', () => {
    const page = item.getAttribute('data-page');

    document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
    item.classList.add('active');

    document.querySelectorAll('.page-content').forEach(p => p.classList.add('hidden'));
    document.getElementById(page + 'Page').classList.remove('hidden');

    updateUI();
  });
});

// ============== UI UPDATE ==============
function updateUI() {
  const selectedYear = document.getElementById('academicYearFilter')?.value || '';

  // Filter courses
  const courses = allData.filter(item => item.type === 'course');
  const filteredCourses = selectedYear
    ? courses.filter(c => c.academicYear === selectedYear)
    : courses;

  updateStats(filteredCourses);
  updateCourseTable(filteredCourses);
  updateUsersTable();
  updateCoursesManagementTable();
  updateTeachersTable();
}

function updateStats(courses) {
  const statsGrid = document.getElementById('statsGrid');
  if (!statsGrid) return;

  const totalByYear = [0, 0, 0, 0];
  const completedByYear = [0, 0, 0, 0];
  const inProgressByYear = [0, 0, 0, 0];
  const notStartedByYear = [0, 0, 0, 0];

  courses.forEach(course => {
    const year = parseInt(course.year, 10) - 1;
    if (year >= 0 && year < 4) {
      totalByYear[year]++;

      if (course.status1Date && course.status2Date && course.status3Date && (course.status4 === true || course.status4 === 'TRUE' || course.status4 === 'true')) {
        completedByYear[year]++;
      } else if (course.status1Date || course.status2Date || course.status3Date) {
        inProgressByYear[year]++;
      } else {
        notStartedByYear[year]++;
      }
    }
  });

  const total = totalByYear.reduce((a, b) => a + b, 0);
  const completed = completedByYear.reduce((a, b) => a + b, 0);
  const inProgress = inProgressByYear.reduce((a, b) => a + b, 0);
  const notStarted = notStartedByYear.reduce((a, b) => a + b, 0);

  statsGrid.innerHTML = `
    <div class="stat-card">
      <div class="stat-header">
        <div class="stat-icon blue">
          <i class="fas fa-book"></i>
        </div>
      </div>
      <div class="stat-number">${total}</div>
      <div class="stat-label">จำนวนรายวิชาทั้งหมด</div>
      <div class="year-breakdown">
        ${totalByYear.map((count, i) => `<span class="year-tag">ปี ${i + 1}: ${count}</span>`).join('')}
      </div>
    </div>
    
    <div class="stat-card">
      <div class="stat-header">
        <div class="stat-icon green">
          <i class="fas fa-check-circle"></i>
        </div>
      </div>
      <div class="stat-number">${completed}</div>
      <div class="stat-label">ส่งครบถ้วนแล้ว</div>
      <div class="year-breakdown">
        ${completedByYear.map((count, i) => `<span class="year-tag">ปี ${i + 1}: ${count}</span>`).join('')}
      </div>
    </div>
    
    <div class="stat-card">
      <div class="stat-header">
        <div class="stat-icon orange">
          <i class="fas fa-clock"></i>
        </div>
      </div>
      <div class="stat-number">${inProgress}</div>
      <div class="stat-label">อยู่ระหว่างดำเนินการ</div>
      <div class="year-breakdown">
        ${inProgressByYear.map((count, i) => `<span class="year-tag">ปี ${i + 1}: ${count}</span>`).join('')}
      </div>
    </div>
    
    <div class="stat-card">
      <div class="stat-header">
        <div class="stat-icon red">
          <i class="fas fa-exclamation-circle"></i>
        </div>
      </div>
      <div class="stat-number">${notStarted}</div>
      <div class="stat-label">ยังไม่ได้ส่ง</div>
      <div class="year-breakdown">
        ${notStartedByYear.map((count, i) => `<span class="year-tag">ปี ${i + 1}: ${count}</span>`).join('')}
      </div>
    </div>
  `;
}

function updateCourseTable(courses) {
  const tbody = document.getElementById('courseTableBody');
  if (!tbody) return;

  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const paginatedCourses = courses.slice(start, end);

  tbody.innerHTML = paginatedCourses.map(course => {
    const statusText = getStatusText(course);
    const isOverdue = isCoursOverdue(course);
    const statusBadge = isOverdue
      ? '<span class="status-badge overdue">เกินกำหนดส่ง</span>'
      : '<span class="status-badge normal">ปกติ</span>';

    const actions = isAdmin
      ? `<td>
          <div class="action-buttons">
            <button class="btn-icon btn-edit" onclick="editCourse('${course.__backendId}')">✏️</button>
            <button class="btn-icon btn-delete" onclick="deleteCourse('${course.__backendId}')">🗑️</button>
          </div>
        </td>`
      : '';

    const fileDisplay = course.fileUrl
      ? `<a href="${course.fileUrl}" target="_blank" style="color: #667eea;">ดูไฟล์</a>`
      : '-';

    return `
      <tr>
        <td>${course.courseName || ''}</td>
        <td>${course.coordinators || '-'}</td>
        <td>ปี ${course.year || ''}</td>
        <td>${course.room || ''}</td>
        <td>${course.semester || ''}</td>
        <td style="font-size: 12px;">${statusText}</td>
        <td>${fileDisplay}</td>
        ${actions}
        <td>${statusBadge}</td>
      </tr>
    `;
  }).join('');

  updatePagination(courses.length);
}

function getStatusText(course) {
  let status = [];
  if (course.status1Date) status.push(`1.งานวิชาการ (${formatDate(course.status1Date)})`);
  if (course.status2Date) status.push(`2.อาจารย์ประจำชั้น (${formatDate(course.status2Date)})`);
  if (course.status3Date) status.push(`3.รองผู้อำนวยการฯ (${formatDate(course.status3Date)})`);
  if (course.status4 === true || course.status4 === 'TRUE' || course.status4 === 'true') status.push('4.Scan แล้ว');
  return status.length > 0 ? status.join('<br>') : 'ยังไม่ได้ส่ง';
}

function isCoursOverdue(course) {
  if (!course.dueDate || !course.status3Date) return false;
  const dueDate = new Date(course.dueDate);
  const submitDate = new Date(course.status3Date);
  return submitDate > dueDate;
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
}

function updatePagination(totalItems) {
  const pagination = document.getElementById('pagination');
  if (!pagination) return;

  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  pagination.innerHTML = `
    <button onclick="goToPage(1)" ${currentPage === 1 ? 'disabled' : ''}>
      <i class="fas fa-angle-double-left"></i> หน้าแรก
    </button>
    <button onclick="goToPage(${Math.max(1, currentPage - 10)})" ${currentPage <= 10 ? 'disabled' : ''}>
      <i class="fas fa-fast-backward"></i> ย้อนกลับ 10
    </button>
    <button onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
      <i class="fas fa-chevron-left"></i> ก่อนหน้า
    </button>
    <span class="page-info">หน้า ${currentPage} / ${totalPages}</span>
    <button onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
      ถัดไป <i class="fas fa-chevron-right"></i>
    </button>
    <button onclick="goToPage(${Math.min(totalPages, currentPage + 10)})" ${currentPage >= totalPages - 9 ? 'disabled' : ''}>
      ไปข้างหน้า 10 <i class="fas fa-fast-forward"></i>
    </button>
    <button onclick="goToPage(${totalPages})" ${currentPage === totalPages ? 'disabled' : ''}>
      หน้าสุดท้าย <i class="fas fa-angle-double-right"></i>
    </button>
  `;
}

function goToPage(page) {
  currentPage = page;
  updateUI();
}

// ============== USERS MANAGEMENT ==============
function updateUsersTable() {
  const tbody = document.getElementById('userTableBody');
  if (!tbody) return;

  const users = allData.filter(item => item.type === 'user');

  tbody.innerHTML = users.map(user => `
    <tr>
      <td>${user.email || ''}</td>
      <td>${user.fullName || ''}</td>
      <td>${user.position || ''}</td>
      <td>
        <span class="status-badge ${user.active === true || user.active === 'TRUE' || user.active === 'true' ? 'completed' : 'not-started'}">
          ${user.active === true || user.active === 'TRUE' || user.active === 'true' ? 'ใช้งาน' : 'ปิดการใช้งาน'}
        </span>
      </td>
      <td>
        <div class="action-buttons">
          <button class="btn-icon btn-edit" onclick="editUser('${user.__backendId}')">✏️</button>
          <button class="btn-icon btn-delete" onclick="deleteUser('${user.__backendId}')">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ============== COURSES MANAGEMENT (PAGE 2) ==============
function updateCoursesManagementTable() {
  const tbody = document.getElementById('courseTableBody2');
  if (!tbody) return;

  const courses = allData.filter(item => item.type === 'course');

  tbody.innerHTML = courses.map(course => `
    <tr>
      <td>${course.courseName || ''}</td>
      <td>${course.coordinators || '-'}</td>
      <td>ปี ${course.year || ''}</td>
      <td>${course.room || ''}</td>
      <td>${course.semester || ''}</td>
      <td>${formatDate(course.dueDate)}</td>
      <td>
        <div class="action-buttons">
          <button class="btn-icon btn-edit" onclick="editCourse('${course.__backendId}')">✏️</button>
          <button class="btn-icon btn-delete" onclick="deleteCourse('${course.__backendId}')">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ============== TEACHERS MANAGEMENT ==============
function updateTeachersTable() {
  const tbody = document.getElementById('teacherTableBody');
  if (!tbody) return;

  const teachers = allData.filter(item => item.type === 'teacher');

  tbody.innerHTML = teachers.map(teacher => `
    <tr>
      <td>${teacher.teacherName || ''}</td>
      <td>
        <div class="action-buttons">
          <button class="btn-icon btn-edit" onclick="editTeacher('${teacher.__backendId}')">✏️</button>
          <button class="btn-icon btn-delete" onclick="deleteTeacher('${teacher.__backendId}')">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ============== COURSE MODAL ==============
function openCourseModal(course = null) {
  editingItem = course;
  const modal = document.getElementById('courseModal');
  const title = document.getElementById('courseModalTitle');
  const form = document.getElementById('courseForm');

  title.textContent = course ? 'แก้ไขรายวิชา' : 'เพิ่มรายวิชา';

  if (course) {
    document.getElementById('courseName').value = course.courseName || '';
    document.getElementById('courseYear').value = course.year || '1';
    document.getElementById('courseRoom').value = course.room || '';
    document.getElementById('courseSemester').value = course.semester || '1';
    document.getElementById('courseAcademicYear').value = course.academicYear || '';
    document.getElementById('courseDueDate').value = course.dueDate || '';

    document.getElementById('status1').checked = !!course.status1Date;
    document.getElementById('status1Date').value = course.status1Date || '';
    document.getElementById('status2').checked = !!course.status2Date;
    document.getElementById('status2Date').value = course.status2Date || '';
    document.getElementById('status3').checked = !!course.status3Date;
    document.getElementById('status3Date').value = course.status3Date || '';
    document.getElementById('status4').checked = (course.status4 === true || course.status4 === 'TRUE' || course.status4 === 'true');
  } else {
    form.reset();
  }

  loadCoordinatorsList(course?.coordinators);
  modal.classList.add('active');
}

function loadCoordinatorsList(selectedCoordinators = '') {
  const container = document.getElementById('coordinatorsList');
  const teachers = allData.filter(item => item.type === 'teacher');
  const selected = selectedCoordinators ? selectedCoordinators.split(', ').map(s => s.trim()) : [];

  container.innerHTML = teachers.map(teacher => `
    <div class="checkbox-group">
      <input type="checkbox" id="coord_${teacher.__backendId}" value="${teacher.teacherName}"
        ${selected.includes(teacher.teacherName) ? 'checked' : ''}>
      <label for="coord_${teacher.__backendId}">${teacher.teacherName}</label>
    </div>
  `).join('');
}

function closeCourseModal() {
  document.getElementById('courseModal').classList.remove('active');
  editingItem = null;
}

document.getElementById('courseForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  Swal.fire({
    title: 'กำลังบันทึก...',
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  // (จำลอง) ไฟล์ PDF — ตอนนี้เก็บแค่ชื่อไฟล์ไว้เป็น text
  const fileInput = document.getElementById('courseFile');
  const fileName = fileInput.files && fileInput.files[0] ? fileInput.files[0].name : (editingItem?.fileUrl || '');

  const coordinators = Array.from(document.querySelectorAll('#coordinatorsList input:checked'))
    .map(cb => cb.value)
    .join(', ');

  const baseData = {
    type: 'course',
    courseName: document.getElementById('courseName').value,
    coordinators: coordinators,
    year: parseInt(document.getElementById('courseYear').value, 10),
    room: document.getElementById('courseRoom').value,
    semester: document.getElementById('courseSemester').value,
    academicYear: document.getElementById('courseAcademicYear').value,
    dueDate: document.getElementById('courseDueDate').value,
    status1Date: document.getElementById('status1').checked ? document.getElementById('status1Date').value : '',
    status2Date: document.getElementById('status2').checked ? document.getElementById('status2Date').value : '',
    status3Date: document.getElementById('status3').checked ? document.getElementById('status3Date').value : '',
    status4: document.getElementById('status4').checked,
    fileUrl: fileName,
    createdAt: editingItem?.createdAt || new Date().toISOString()
  };

  const payload = editingItem
    ? { ...baseData, __backendId: editingItem.__backendId }
    : baseData;

  try {
    const result = await apiSaveItem(payload);
    if (result.success) {
      await Swal.fire({
        icon: 'success',
        title: 'บันทึกสำเร็จ!',
        timer: 1500,
        showConfirmButton: false
      });
      closeCourseModal();
      await loadAllData();
    } else {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: result.message || 'ไม่สามารถบันทึกข้อมูลได้'
      });
    }
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'เกิดข้อผิดพลาด',
      text: 'ไม่สามารถบันทึกข้อมูลได้'
    });
  }
});

async function editCourse(id) {
  const course = allData.find(item => item.__backendId === id);
  if (course) {
    openCourseModal(course);
  }
}

async function deleteCourse(id) {
  const result = await Swal.fire({
    title: 'ยืนยันการลบ?',
    text: 'คุณต้องการลบรายวิชานี้ใช่หรือไม่?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'ใช่, ลบเลย',
    cancelButtonText: 'ยกเลิก',
    confirmButtonColor: '#dc3545'
  });

  if (result.isConfirmed) {
    Swal.fire({
      title: 'กำลังลบ...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const res = await apiDeleteItem({ type: 'course', __backendId: id });
      if (res.success) {
        await Swal.fire({
          icon: 'success',
          title: 'ลบสำเร็จ!',
          timer: 1500,
          showConfirmButton: false
        });
        await loadAllData();
      } else {
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: res.message || 'ไม่สามารถลบข้อมูลได้'
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถลบข้อมูลได้'
      });
    }
  }
}

// ============== USER MODAL ==============
function openUserModal(user = null) {
  editingItem = user;
  const modal = document.getElementById('userModal');
  const title = document.getElementById('userModalTitle');
  const form = document.getElementById('userForm');

  title.textContent = user ? 'แก้ไขผู้ใช้งาน' : 'เพิ่มผู้ใช้งาน';

  if (user) {
    document.getElementById('userEmail').value = user.email || '';
    document.getElementById('userPassword').value = user.password || '';
    document.getElementById('userFullName').value = user.fullName || '';
    document.getElementById('userPositionInput').value = user.position || '';
    document.getElementById('userActive').checked = (user.active === true || user.active === 'TRUE' || user.active === 'true');
  } else {
    form.reset();
    document.getElementById('userActive').checked = true;
  }

  modal.classList.add('active');
}

function closeUserModal() {
  document.getElementById('userModal').classList.remove('active');
  editingItem = null;
}

document.getElementById('userForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  Swal.fire({
    title: 'กำลังบันทึก...',
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  const baseData = {
    type: 'user',
    email: document.getElementById('userEmail').value,
    password: document.getElementById('userPassword').value,
    fullName: document.getElementById('userFullName').value,
    position: document.getElementById('userPositionInput').value,
    active: document.getElementById('userActive').checked,
    createdAt: editingItem?.createdAt || new Date().toISOString()
  };

  const payload = editingItem
    ? { ...baseData, __backendId: editingItem.__backendId }
    : baseData;

  try {
    const result = await apiSaveItem(payload);
    if (result.success) {
      await Swal.fire({
        icon: 'success',
        title: 'บันทึกสำเร็จ!',
        timer: 1500,
        showConfirmButton: false
      });
      closeUserModal();
      await loadAllData();
    } else {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: result.message || 'ไม่สามารถบันทึกข้อมูลได้'
      });
    }
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'เกิดข้อผิดพลาด',
      text: 'ไม่สามารถบันทึกข้อมูลได้'
    });
  }
});

async function editUser(id) {
  const user = allData.find(item => item.__backendId === id);
  if (user) {
    openUserModal(user);
  }
}

async function deleteUser(id) {
  const result = await Swal.fire({
    title: 'ยืนยันการลบ?',
    text: 'คุณต้องการลบผู้ใช้งานนี้ใช่หรือไม่?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'ใช่, ลบเลย',
    cancelButtonText: 'ยกเลิก',
    confirmButtonColor: '#dc3545'
  });

  if (result.isConfirmed) {
    Swal.fire({
      title: 'กำลังลบ...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const res = await apiDeleteItem({ type: 'user', __backendId: id });
      if (res.success) {
        await Swal.fire({
          icon: 'success',
          title: 'ลบสำเร็จ!',
          timer: 1500,
          showConfirmButton: false
        });
        await loadAllData();
      } else {
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: res.message || 'ไม่สามารถลบข้อมูลได้'
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถลบข้อมูลได้'
      });
    }
  }
}

// ============== TEACHER MODAL ==============
function openTeacherModal(teacher = null) {
  editingItem = teacher;
  const modal = document.getElementById('teacherModal');
  const title = document.getElementById('teacherModalTitle');
  const form = document.getElementById('teacherForm');

  title.textContent = teacher ? 'แก้ไขอาจารย์' : 'เพิ่มอาจารย์';

  if (teacher) {
    document.getElementById('teacherName').value = teacher.teacherName || '';
  } else {
    form.reset();
  }

  modal.classList.add('active');
}

function closeTeacherModal() {
  document.getElementById('teacherModal').classList.remove('active');
  editingItem = null;
}

document.getElementById('teacherForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  Swal.fire({
    title: 'กำลังบันทึก...',
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  const baseData = {
    type: 'teacher',
    teacherName: document.getElementById('teacherName').value,
    createdAt: editingItem?.createdAt || new Date().toISOString()
  };

  const payload = editingItem
    ? { ...baseData, __backendId: editingItem.__backendId }
    : baseData;

  try {
    const result = await apiSaveItem(payload);
    if (result.success) {
      await Swal.fire({
        icon: 'success',
        title: 'บันทึกสำเร็จ!',
        timer: 1500,
        showConfirmButton: false
      });
      closeTeacherModal();
      await loadAllData();
    } else {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: result.message || 'ไม่สามารถบันทึกข้อมูลได้'
      });
    }
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'เกิดข้อผิดพลาด',
      text: 'ไม่สามารถบันทึกข้อมูลได้'
    });
  }
});

async function editTeacher(id) {
  const teacher = allData.find(item => item.__backendId === id);
  if (teacher) {
    openTeacherModal(teacher);
  }
}

async function deleteTeacher(id) {
  const result = await Swal.fire({
    title: 'ยืนยันการลบ?',
    text: 'คุณต้องการลบอาจารย์นี้ใช่หรือไม่?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'ใช่, ลบเลย',
    cancelButtonText: 'ยกเลิก',
    confirmButtonColor: '#dc3545'
  });

  if (result.isConfirmed) {
    Swal.fire({
      title: 'กำลังลบ...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const res = await apiDeleteItem({ type: 'teacher', __backendId: id });
      if (res.success) {
        await Swal.fire({
          icon: 'success',
          title: 'ลบสำเร็จ!',
          timer: 1500,
          showConfirmButton: false
        });
        await loadAllData();
      } else {
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: res.message || 'ไม่สามารถลบข้อมูลได้'
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถลบข้อมูลได้'
      });
    }
  }
}

// ============== FILTER CHANGE ==============
document.getElementById('academicYearFilter').addEventListener('change', () => {
  currentPage = 1;
  updateUI();
});

// ============== BUTTON EVENTS ==============
document.getElementById('addCourseBtn').addEventListener('click', () => openCourseModal());
document.getElementById('addCourseBtn2').addEventListener('click', () => openCourseModal());
document.getElementById('addUserBtn').addEventListener('click', () => openUserModal());
document.getElementById('addTeacherBtn').addEventListener('click', () => openTeacherModal());

// ============== INITIAL LOAD ==============
// โหลดข้อมูล (เพื่อให้ login ใช้ข้อมูล user ใน sheet ได้ ถ้ามี)
loadAllData();



