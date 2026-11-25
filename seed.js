require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('./models/Student');
const { INITIAL_SAMPLE_STUDENTS } = require('./services/studentStore');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/student_management_db';

async function seedDatabase() {
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    await Student.deleteMany({});
    const inserted = await Student.insertMany(INITIAL_SAMPLE_STUDENTS);
    console.log(`Seeded ${inserted.length} student records into MongoDB.`);
  } catch (error) {
    console.error('Failed to seed MongoDB:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedDatabase();
