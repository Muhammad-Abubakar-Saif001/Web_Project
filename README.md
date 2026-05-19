# CourseFlow Marketplace

A full-stack online course marketplace and learning platform built with React, Node.js, Express, and PostgreSQL.

## Features

- React frontend with role-aware student, instructor, and admin workspaces
- Node.js/Express backend API with unified dashboard endpoints for performance optimization
- Modular React component architecture and centralized state management
- Database entities for structured data access
- PostgreSQL schema and seed data
- Real email/password authentication with JWT-protected API actions
- Student registration by default
- Admin-created instructor accounts
- Admin approval or denial for new instructor course submissions
- Course CRUD operations
- Marketplace search, filters, sorting, and pagination
- Enrollment and lesson progress tracking
- Student view for enrolled courses
- Instructor view for students enrolled in their courses
- Admin panel for users, instructors, moderation, reports, and platform metrics

## Project Structure

```text
frontend/
  index.html
  vite.config.js
  src/main.jsx
  src/App.jsx
  src/store/
backend/
  db/schema.sql
  db/seed.sql
  src/server.js
  src/auth.js
  src/db.js
  src/entity/
```

## Setup

Install dependencies:

```bash
npm install
```

Create your environment file:

```bash
copy .env.example .env
```

Update `.env` with your database connection details and a secure JWT secret. **Do not commit these secrets.**

For the React frontend, set this in `frontend/.env` or in your hosting provider's environment variables:

```text
VITE_API_URL=https://your-backend-project.onrender.com/api
```

Create and seed the database:

```bash
npm run db:schema
npm run db:seed
```

Run the full app:

```bash
npm run dev
```

Frontend: `http://127.0.0.1:5173/`

Backend: `http://127.0.0.1:4000/api/health`

## Platform Tutorial

Welcome to CourseFlow! Here is a full tutorial on how to use the platform across its three main roles: Student, Instructor, and Admin.

### 1. Student Experience
- **Registration:** Anyone can visit the site and create an account. By default, new accounts are created as Students.
- **Browsing:** Students can explore the "Marketplace" to see all approved courses. They can use the search bar, category filters, and sorting options to find the perfect course.
- **Enrolling & Payment:** When a student finds a course they want, they click "Enroll". A payment modal will appear with instructions to manually send the course fee via NayaPay. After confirming, the enrollment goes into a "Payment Pending Approval" state.
- **My Learning:** Students can track their approved enrollments in the "My Learning" dashboard, where they can mark lessons as complete and track their overall progress.

### 2. Instructor Experience
- **Account Creation:** Instructors cannot register themselves. They must be invited and created by an Admin from the Admin Panel.
- **Course Creation:** Once logged in, Instructors can create new courses via their dashboard. They fill out course details, including title, category, description, and price. 
- **Approval Workflow:** Newly created courses are marked as "Pending" and are not visible in the public marketplace until an Admin reviews and approves them.
- **Student Roster:** Instructors can view a list of all students enrolled in their active courses and track their learning progress.

### 3. Admin Experience
- **User Management:** Admins have full access to manage all users on the platform. They can view the user list, change roles, or suspend active accounts.
- **Course Moderation:** Admins review "Pending" courses submitted by instructors. They can "Approve" them to go live in the marketplace or "Deny" them.
- **Payment Approvals:** When a student confirms a manual payment, the request appears in the "Payment Approvals" queue on the Admin Panel. The admin verifies the transaction and clicks "Approve" to grant the student access to the course content, or "Deny" if the payment was not received.

## Useful Commands

```bash
npm run dev:frontend
npm run dev:api
npm run lint
npm run build
npm run db:psql:supabase
npm run skills:supabase
```
