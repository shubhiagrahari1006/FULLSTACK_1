require('dotenv').config();
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const studentStore = require('./services/studentStore');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/student_management_db';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    database: studentStore.isMongoReady() ? 'mongodb' : 'local-fallback',
    uriConfigured: Boolean(process.env.MONGODB_URI),
  });
});

app.get('/api/students', async (req, res, next) => {
  try {
    const students = await studentStore.listStudents(req.query);
    res.json({ data: students, count: students.length });
  } catch (error) {
    next(error);
  }
});

app.post('/api/students', async (req, res, next) => {
  try {
    const created = await studentStore.createStudent(req.body);
    res.status(201).json({ data: created, message: 'Student registered successfully.' });
  } catch (error) {
    next(error);
  }
});

app.put('/api/students/:id', async (req, res, next) => {
  try {
    const updated = await studentStore.updateStudent(req.params.id, req.body);
    res.json({ data: updated, message: 'Student record updated successfully.' });
  } catch (error) {
    next(error);
  }
});

app.delete('/api/students/:id', async (req, res, next) => {
  try {
    await studentStore.deleteStudent(req.params.id);
    res.json({ message: 'Student record deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

// Centralized error formatting for Mongoose and validation errors
app.use((error, _req, res, _next) => {
  if (error.code === 11000) {
    return res.status(409).json({
      error: 'A student with this roll number or email address already exists.',
    });
  }
  if (error.name === 'ValidationError') {
    const details = Object.values(error.errors)
      .map((item) => item.message)
      .join(' ');
    return res.status(400).json({ error: details });
  }
  if (error.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid student identifier.' });
  }

  const statusCode = error.statusCode || 500;
  res.status(statusCode).json({
    error: error.message || 'An unexpected server error occurred.',
  });
});

async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 2500 });
    console.log(`Connected to MongoDB at ${MONGODB_URI}`);
  } catch (error) {
    console.warn(
      `MongoDB unavailable (${error.message}). Running with local JSON fallback store until MongoDB is started.`
    );
  }

  app.listen(PORT, () => {
    console.log(`Student Management System running on http://localhost:${PORT}`);
  });
}

startServer();
