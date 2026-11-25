const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const Student = require('../models/Student');

const FALLBACK_FILE = path.join(__dirname, '..', 'data', 'students.fallback.json');

const INITIAL_SAMPLE_STUDENTS = [
  {
    rollNumber: 'CS-2024-001',
    fullName: 'Aarav Kulkarni',
    email: 'aarav.kulkarni@university.edu',
    phone: '+91 98201 45120',
    department: 'Computer Science',
    semester: 5,
    cgpa: 8.94,
    status: 'Active',
    enrollmentDate: '2024-08-01',
  },
  {
    rollNumber: 'IT-2024-014',
    fullName: 'Meera Nair',
    email: 'meera.nair@university.edu',
    phone: '+91 98450 77312',
    department: 'Information Technology',
    semester: 5,
    cgpa: 9.21,
    status: 'Active',
    enrollmentDate: '2024-08-01',
  },
  {
    rollNumber: 'EC-2023-029',
    fullName: 'Rohan Deshmukh',
    email: 'rohan.deshmukh@university.edu',
    phone: '+91 97654 11890',
    department: 'Electronics & Communication',
    semester: 7,
    cgpa: 8.15,
    status: 'Active',
    enrollmentDate: '2023-08-01',
  },
  {
    rollNumber: 'ME-2023-008',
    fullName: 'Ananya Chatterjee',
    email: 'ananya.chatterjee@university.edu',
    phone: '+91 98300 66241',
    department: 'Mechanical Engineering',
    semester: 7,
    cgpa: 7.86,
    status: 'On Leave',
    enrollmentDate: '2023-08-01',
  },
  {
    rollNumber: 'CS-2022-042',
    fullName: 'Vikramaditya Joshi',
    email: 'vikram.joshi@university.edu',
    phone: '+91 99100 32874',
    department: 'Computer Science',
    semester: 8,
    cgpa: 9.42,
    status: 'Graduated',
    enrollmentDate: '2022-08-01',
  },
];

function isMongoReady() {
  return mongoose.connection.readyState === 1;
}

function ensureFallbackStore() {
  const dir = path.dirname(FALLBACK_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(FALLBACK_FILE)) {
    const seeded = INITIAL_SAMPLE_STUDENTS.map((item) => ({
      _id: crypto.randomUUID(),
      ...item,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(seeded, null, 2));
  }
}

function readFallbackStudents() {
  ensureFallbackStore();
  return JSON.parse(fs.readFileSync(FALLBACK_FILE, 'utf8'));
}

function writeFallbackStudents(records) {
  ensureFallbackStore();
  fs.writeFileSync(FALLBACK_FILE, JSON.stringify(records, null, 2));
}

function validateStudentPayload(payload) {
  const errors = [];
  const rollNumber = String(payload.rollNumber || '').trim().toUpperCase();
  const fullName = String(payload.fullName || '').trim();
  const email = String(payload.email || '').trim().toLowerCase();
  const phone = String(payload.phone || '').trim();
  const department = String(payload.department || '').trim();
  const semester = Number(payload.semester);
  const cgpa = Number(payload.cgpa);
  const status = String(payload.status || 'Active').trim();
  const enrollmentDate = payload.enrollmentDate || new Date().toISOString().slice(0, 10);

  if (!/^[A-Z0-9-]{3,20}$/.test(rollNumber)) {
    errors.push('Roll number must be 3-20 alphanumeric characters or hyphens.');
  }
  if (fullName.length < 2 || fullName.length > 80) {
    errors.push('Full name must be between 2 and 80 characters.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('A valid email address is required.');
  }
  if (!/^[0-9+\-\s]{7,15}$/.test(phone)) {
    errors.push('Contact number must be 7-15 digits or separators.');
  }
  if (!department) {
    errors.push('Department is required.');
  }
  if (!Number.isInteger(semester) || semester < 1 || semester > 8) {
    errors.push('Semester must be an integer between 1 and 8.');
  }
  if (Number.isNaN(cgpa) || cgpa < 0 || cgpa > 10) {
    errors.push('CGPA must be a number between 0.0 and 10.0.');
  }
  if (!['Active', 'On Leave', 'Graduated'].includes(status)) {
    errors.push('Status must be Active, On Leave, or Graduated.');
  }

  return {
    errors,
    cleanData: {
      rollNumber,
      fullName,
      email,
      phone,
      department,
      semester,
      cgpa: Number(cgpa.toFixed(2)),
      status,
      enrollmentDate,
    },
  };
}

function buildSortSpec(sortKey) {
  switch (sortKey) {
    case 'name_asc':
      return { fullName: 1 };
    case 'cgpa_desc':
      return { cgpa: -1 };
    case 'roll_asc':
      return { rollNumber: 1 };
    default:
      return { createdAt: -1 };
  }
}

async function listStudents({ search = '', department = '', status = '', sort = 'newest' } = {}) {
  const query = search.trim().toLowerCase();

  if (isMongoReady()) {
    const filter = {};
    if (department) filter.department = department;
    if (status) filter.status = status;
    if (query) {
      const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ rollNumber: regex }, { fullName: regex }, { email: regex }];
    }
    return Student.find(filter).sort(buildSortSpec(sort)).lean();
  }

  let records = readFallbackStudents();
  if (department) {
    records = records.filter((item) => item.department === department);
  }
  if (status) {
    records = records.filter((item) => item.status === status);
  }
  if (query) {
    records = records.filter(
      (item) =>
        item.rollNumber.toLowerCase().includes(query) ||
        item.fullName.toLowerCase().includes(query) ||
        item.email.toLowerCase().includes(query)
    );
  }

  records.sort((a, b) => {
    if (sort === 'name_asc') return a.fullName.localeCompare(b.fullName);
    if (sort === 'cgpa_desc') return b.cgpa - a.cgpa;
    if (sort === 'roll_asc') return a.rollNumber.localeCompare(b.rollNumber);
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return records;
}

async function createStudent(payload) {
  const { errors, cleanData } = validateStudentPayload(payload);
  if (errors.length > 0) {
    const err = new Error(errors.join(' '));
    err.statusCode = 400;
    throw err;
  }

  if (isMongoReady()) {
    const created = await Student.create(cleanData);
    return created.toObject();
  }

  const records = readFallbackStudents();
  const duplicate = records.find(
    (item) => item.rollNumber === cleanData.rollNumber || item.email === cleanData.email
  );
  if (duplicate) {
    const err = new Error('A student with this roll number or email already exists.');
    err.statusCode = 409;
    throw err;
  }

  const now = new Date().toISOString();
  const created = { _id: crypto.randomUUID(), ...cleanData, createdAt: now, updatedAt: now };
  records.unshift(created);
  writeFallbackStudents(records);
  return created;
}

async function updateStudent(id, payload) {
  const { errors, cleanData } = validateStudentPayload(payload);
  if (errors.length > 0) {
    const err = new Error(errors.join(' '));
    err.statusCode = 400;
    throw err;
  }

  if (isMongoReady()) {
    const updated = await Student.findByIdAndUpdate(id, cleanData, {
      new: true,
      runValidators: true,
    }).lean();
    if (!updated) {
      const err = new Error('Student record not found.');
      err.statusCode = 404;
      throw err;
    }
    return updated;
  }

  const records = readFallbackStudents();
  const index = records.findIndex((item) => item._id === id);
  if (index === -1) {
    const err = new Error('Student record not found.');
    err.statusCode = 404;
    throw err;
  }

  const conflict = records.find(
    (item) =>
      item._id !== id &&
      (item.rollNumber === cleanData.rollNumber || item.email === cleanData.email)
  );
  if (conflict) {
    const err = new Error('Another student already uses this roll number or email.');
    err.statusCode = 409;
    throw err;
  }

  records[index] = {
    ...records[index],
    ...cleanData,
    updatedAt: new Date().toISOString(),
  };
  writeFallbackStudents(records);
  return records[index];
}

async function deleteStudent(id) {
  if (isMongoReady()) {
    const deleted = await Student.findByIdAndDelete(id).lean();
    if (!deleted) {
      const err = new Error('Student record not found.');
      err.statusCode = 404;
      throw err;
    }
    return deleted;
  }

  const records = readFallbackStudents();
  const index = records.findIndex((item) => item._id === id);
  if (index === -1) {
    const err = new Error('Student record not found.');
    err.statusCode = 404;
    throw err;
  }
  const [removed] = records.splice(index, 1);
  writeFallbackStudents(records);
  return removed;
}

module.exports = {
  INITIAL_SAMPLE_STUDENTS,
  isMongoReady,
  listStudents,
  createStudent,
  updateStudent,
  deleteStudent,
};
