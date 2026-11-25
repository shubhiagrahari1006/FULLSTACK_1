const state = {
  students: [],
  pendingDeleteId: null,
  searchTimer: null,
};

const dom = {
  dbStatusBadge: document.getElementById('dbStatusBadge'),
  kpiTotal: document.getElementById('kpiTotal'),
  kpiActive: document.getElementById('kpiActive'),
  kpiAvgCgpa: document.getElementById('kpiAvgCgpa'),
  kpiDepartments: document.getElementById('kpiDepartments'),
  recordCountLabel: document.getElementById('recordCountLabel'),
  searchInput: document.getElementById('searchInput'),
  departmentFilter: document.getElementById('departmentFilter'),
  statusFilter: document.getElementById('statusFilter'),
  sortSelect: document.getElementById('sortSelect'),
  resetFiltersBtn: document.getElementById('resetFiltersBtn'),
  tableBody: document.getElementById('studentTableBody'),
  emptyState: document.getElementById('emptyState'),
  studentModal: document.getElementById('studentModal'),
  modalTitle: document.getElementById('modalTitle'),
  studentForm: document.getElementById('studentForm'),
  studentId: document.getElementById('studentId'),
  rollNumber: document.getElementById('rollNumber'),
  fullName: document.getElementById('fullName'),
  email: document.getElementById('email'),
  phone: document.getElementById('phone'),
  department: document.getElementById('department'),
  semester: document.getElementById('semester'),
  cgpa: document.getElementById('cgpa'),
  status: document.getElementById('status'),
  enrollmentDate: document.getElementById('enrollmentDate'),
  formErrorBanner: document.getElementById('formErrorBanner'),
  openCreateModalBtn: document.getElementById('openCreateModalBtn'),
  closeModalBtn: document.getElementById('closeModalBtn'),
  cancelModalBtn: document.getElementById('cancelModalBtn'),
  deleteModal: document.getElementById('deleteModal'),
  deleteModalMessage: document.getElementById('deleteModalMessage'),
  cancelDeleteBtn: document.getElementById('cancelDeleteBtn'),
  confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),
  toastContainer: document.getElementById('toastContainer'),
};

function showToast(message, isError = false) {
  const toast = document.createElement('div');
  toast.className = `toast${isError ? ' toast--error' : ''}`;
  toast.textContent = message;
  dom.toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

function getInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

function getStatusClass(status) {
  if (status === 'Active') return 'status-pill--active';
  if (status === 'On Leave') return 'status-pill--leave';
  return 'status-pill--graduated';
}

async function checkDatabaseHealth() {
  try {
    const response = await fetch('/api/health');
    const health = await response.json();
    if (health.database === 'mongodb') {
      dom.dbStatusBadge.textContent = 'MongoDB Connected';
      dom.dbStatusBadge.className = 'status-pill status-pill--connected';
    } else {
      dom.dbStatusBadge.textContent = 'Local Fallback Store';
      dom.dbStatusBadge.className = 'status-pill status-pill--fallback';
    }
  } catch {
    dom.dbStatusBadge.textContent = 'Server Offline';
    dom.dbStatusBadge.className = 'status-pill status-pill--neutral';
  }
}

async function fetchStudents() {
  const params = new URLSearchParams({
    search: dom.searchInput.value.trim(),
    department: dom.departmentFilter.value,
    status: dom.statusFilter.value,
    sort: dom.sortSelect.value,
  });

  try {
    const response = await fetch(`/api/students?${params.toString()}`);
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || 'Failed to load student records.');
    }
    state.students = payload.data;
    renderStudents();
    updateSummaryMetrics();
  } catch (error) {
    showToast(error.message, true);
  }
}

function updateSummaryMetrics() {
  const total = state.students.length;
  const activeCount = state.students.filter((item) => item.status === 'Active').length;
  const avgCgpa =
    total > 0
      ? (state.students.reduce((sum, item) => sum + Number(item.cgpa), 0) / total).toFixed(2)
      : '0.00';
  const departmentCount = new Set(state.students.map((item) => item.department)).size;

  dom.kpiTotal.textContent = String(total);
  dom.kpiActive.textContent = String(activeCount);
  dom.kpiAvgCgpa.textContent = avgCgpa;
  dom.kpiDepartments.textContent = String(departmentCount);
  dom.recordCountLabel.textContent = `${total} ${total === 1 ? 'record' : 'records'}`;
}

function renderStudents() {
  dom.tableBody.innerHTML = '';

  if (state.students.length === 0) {
    dom.emptyState.hidden = false;
    return;
  }

  dom.emptyState.hidden = true;

  state.students.forEach((student) => {
    const row = document.createElement('tr');

    const rollCell = document.createElement('td');
    const rollSpan = document.createElement('span');
    rollSpan.className = 'roll-badge';
    rollSpan.textContent = student.rollNumber;
    rollCell.appendChild(rollSpan);

    const studentCell = document.createElement('td');
    const studentWrap = document.createElement('div');
    studentWrap.className = 'student-cell';
    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent = getInitials(student.fullName);
    const info = document.createElement('div');
    const nameEl = document.createElement('div');
    nameEl.className = 'student-name';
    nameEl.textContent = student.fullName;
    const dateEl = document.createElement('div');
    dateEl.className = 'student-meta';
    dateEl.textContent = `Enrolled: ${String(student.enrollmentDate || '').slice(0, 10)}`;
    info.append(nameEl, dateEl);
    studentWrap.append(avatar, info);
    studentCell.appendChild(studentWrap);

    const deptCell = document.createElement('td');
    deptCell.textContent = student.department;

    const semCell = document.createElement('td');
    semCell.className = 'tabular';
    semCell.textContent = `Sem ${student.semester}`;

    const cgpaCell = document.createElement('td');
    cgpaCell.className = 'tabular';
    cgpaCell.textContent = Number(student.cgpa).toFixed(2);

    const contactCell = document.createElement('td');
    const emailDiv = document.createElement('div');
    emailDiv.textContent = student.email;
    const phoneDiv = document.createElement('div');
    phoneDiv.className = 'student-meta tabular';
    phoneDiv.textContent = student.phone;
    contactCell.append(emailDiv, phoneDiv);

    const statusCell = document.createElement('td');
    const statusBadge = document.createElement('span');
    statusBadge.className = `status-pill ${getStatusClass(student.status)}`;
    statusBadge.textContent = student.status;
    statusCell.appendChild(statusBadge);

    const actionsCell = document.createElement('td');
    actionsCell.className = 'text-right';
    const actionWrap = document.createElement('div');
    actionWrap.className = 'row-actions';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'btn btn-secondary btn-sm';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => openEditModal(student));

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn btn-danger btn-sm';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => openDeleteModal(student));

    actionWrap.append(editBtn, deleteBtn);
    actionsCell.appendChild(actionWrap);

    row.append(
      rollCell,
      studentCell,
      deptCell,
      semCell,
      cgpaCell,
      contactCell,
      statusCell,
      actionsCell
    );
    dom.tableBody.appendChild(row);
  });
}

function openCreateModal() {
  dom.studentForm.reset();
  dom.studentId.value = '';
  dom.enrollmentDate.value = new Date().toISOString().slice(0, 10);
  dom.modalTitle.textContent = 'Register New Student';
  dom.formErrorBanner.hidden = true;
  dom.studentModal.hidden = false;
  dom.rollNumber.focus();
}

function openEditModal(student) {
  dom.studentId.value = student._id;
  dom.rollNumber.value = student.rollNumber;
  dom.fullName.value = student.fullName;
  dom.email.value = student.email;
  dom.phone.value = student.phone;
  dom.department.value = student.department;
  dom.semester.value = student.semester;
  dom.cgpa.value = student.cgpa;
  dom.status.value = student.status;
  dom.enrollmentDate.value = String(student.enrollmentDate || '').slice(0, 10);
  dom.modalTitle.textContent = 'Edit Student Record';
  dom.formErrorBanner.hidden = true;
  dom.studentModal.hidden = false;
  dom.fullName.focus();
}

function closeStudentModal() {
  dom.studentModal.hidden = true;
}

function openDeleteModal(student) {
  state.pendingDeleteId = student._id;
  dom.deleteModalMessage.textContent = `Remove ${student.fullName} (${student.rollNumber}) from the academic directory? This action cannot be undone.`;
  dom.deleteModal.hidden = false;
}

function closeDeleteModal() {
  state.pendingDeleteId = null;
  dom.deleteModal.hidden = true;
}

async function handleFormSubmit(event) {
  event.preventDefault();
  dom.formErrorBanner.hidden = true;

  const payload = {
    rollNumber: dom.rollNumber.value.trim(),
    fullName: dom.fullName.value.trim(),
    email: dom.email.value.trim(),
    phone: dom.phone.value.trim(),
    department: dom.department.value,
    semester: Number(dom.semester.value),
    cgpa: Number(dom.cgpa.value),
    status: dom.status.value,
    enrollmentDate: dom.enrollmentDate.value,
  };

  const isEditing = Boolean(dom.studentId.value);
  const endpoint = isEditing ? `/api/students/${dom.studentId.value}` : '/api/students';
  const method = isEditing ? 'PUT' : 'POST';

  try {
    const response = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Unable to save student record.');
    }

    closeStudentModal();
    showToast(result.message);
    await fetchStudents();
  } catch (error) {
    dom.formErrorBanner.textContent = error.message;
    dom.formErrorBanner.hidden = false;
  }
}

async function handleConfirmDelete() {
  if (!state.pendingDeleteId) return;

  try {
    const response = await fetch(`/api/students/${state.pendingDeleteId}`, {
      method: 'DELETE',
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Unable to delete student record.');
    }
    closeDeleteModal();
    showToast(result.message);
    await fetchStudents();
  } catch (error) {
    showToast(error.message, true);
  }
}

function bindEvents() {
  dom.openCreateModalBtn.addEventListener('click', openCreateModal);
  dom.closeModalBtn.addEventListener('click', closeStudentModal);
  dom.cancelModalBtn.addEventListener('click', closeStudentModal);
  dom.studentForm.addEventListener('submit', handleFormSubmit);

  dom.cancelDeleteBtn.addEventListener('click', closeDeleteModal);
  dom.confirmDeleteBtn.addEventListener('click', handleConfirmDelete);

  dom.searchInput.addEventListener('input', () => {
    clearTimeout(state.searchTimer);
    state.searchTimer = setTimeout(fetchStudents, 220);
  });

  [dom.departmentFilter, dom.statusFilter, dom.sortSelect].forEach((el) => {
    el.addEventListener('change', fetchStudents);
  });

  dom.resetFiltersBtn.addEventListener('click', () => {
    dom.searchInput.value = '';
    dom.departmentFilter.value = '';
    dom.statusFilter.value = '';
    dom.sortSelect.value = 'newest';
    fetchStudents();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeStudentModal();
      closeDeleteModal();
    }
  });
}

bindEvents();
checkDatabaseHealth();
fetchStudents();
