# Question 1: Student Management System

A full-stack **Student Management System** built using **HTML, CSS, JavaScript, Node.js (Express), and MongoDB (Mongoose)**.

## Features

- Full **CRUD** operations (Create, Read, Update, Delete) backed by MongoDB via Mongoose schemas and validation.
- Live search by Roll Number, Full Name, or Email, alongside Department, Status, and Sort filters.
- Real-time KPI summary cards (Total Enrolled, Active Students, Average CGPA, Departments).
- Formal academic registrar UI with accessible modal dialogs and inline validation feedback.
- Built-in local JSON fallback store if MongoDB is temporarily offline, with a live status indicator in the header.

## Setup & Run

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment variables (optional if using default local MongoDB):
   ```bash
   cp .env.example .env
   ```
3. Ensure MongoDB is running (`mongodb://127.0.0.1:27017/student_management_db`), then optionally seed sample records:
   ```bash
   npm run seed
   ```
4. Start the server:
   ```bash
   npm start
   ```
5. Open `http://localhost:3000` in your browser.
