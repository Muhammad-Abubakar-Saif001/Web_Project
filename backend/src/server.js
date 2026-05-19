import bcrypt from 'bcryptjs';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { randomUUID } from 'node:crypto';
import { query } from './data-source.js';
import { requireAuth, requireRole, signToken } from './middleware/auth.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://127.0.0.1:5173',
    credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));

function publicUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    status: row.status,
    joined: row.joined_at?.toISOString?.().slice(0, 10) || row.joined_at,
  };
}

function publicCourse(row) {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    level: row.level,
    instructorId: row.instructor_id,
    instructor: row.instructor,
    price: Number(row.price),
    rating: Number(row.rating),
    students: Number(row.students),
    lessons: Number(row.lessons),
    duration: row.duration,
    status: row.status,
    progress: Number(row.progress || 0),
    description: row.description,
    denialReason: row.denial_reason,
    updated: row.updated_at?.toISOString?.().slice(0, 10) || row.updated_at,
  };
}

function parseNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function nextStatus(status) {
  const order = ['Active', 'Pending', 'Suspended'];
  return order[(order.indexOf(status) + 1) % order.length] || 'Active';
}

async function getUserById(id) {
  const result = await query(
    'select id, name, email, role, status, joined_at from users where id = $1',
    [id],
  );
  return result.rows[0] ? publicUser(result.rows[0]) : null;
}

app.get('/api/health', async (_req, res, next) => {
  try {
    const result = await query('select now() as time');
    res.json({ ok: true, database: 'connected', time: result.rows[0].time });
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name?.trim() || !email?.trim() || !password || password.length < 6) {
      return res.status(400).json({ message: 'Name, email, and a 6+ character password are required.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await query(
      `insert into users (id, name, email, password_hash, role, status)
       values ($1, $2, $3, $4, 'student', 'Active')
       returning id, name, email, role, status, joined_at`,
      [`user-${randomUUID().slice(0, 10)}`, name.trim(), email.trim().toLowerCase(), passwordHash],
    );

    const user = publicUser(result.rows[0]);
    res.status(201).json({ user, token: signToken(user) });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }
    return next(error);
  }
});

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await query(
      `select id, name, email, password_hash, role, status, joined_at
       from users
       where email = $1`,
      [email?.trim().toLowerCase()],
    );

    if (!result.rowCount) return res.status(401).json({ message: 'Invalid email or password.' });
    const row = result.rows[0];
    const valid = await bcrypt.compare(password || '', row.password_hash || '');
    if (!valid) return res.status(401).json({ message: 'Invalid email or password.' });
    if (row.status !== 'Active') return res.status(403).json({ message: 'This account is not active.' });

    const user = publicUser(row);
    res.json({ user, token: signToken(user) });
  } catch (error) {
    next(error);
  }
});

app.get('/api/auth/me', requireAuth, async (req, res, next) => {
  try {
    const user = await getUserById(req.user.sub);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/change-password', requireAuth, async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await query(`update users set password_hash = $1 where id = $2`, [passwordHash, req.user.sub]);
    res.json({ message: 'Password updated successfully.' });
  } catch (error) {
    next(error);
  }
});

app.get('/api/users', requireAuth, requireRole(['admin']), async (_req, res, next) => {
  try {
    const result = await query(
      `select id, name, email, role, status, joined_at
       from users
       order by joined_at desc, name asc`,
    );
    res.json({ users: result.rows.map(publicUser) });
  } catch (error) {
    next(error);
  }
});

app.get('/api/users/instructors', requireAuth, requireRole(['admin']), async (_req, res, next) => {
  try {
    const result = await query(
      `select id, name, email, role, status, joined_at
       from users
       where role = 'instructor' and status = 'Active'
       order by name asc`,
    );
    res.json({ instructors: result.rows.map(publicUser) });
  } catch (error) {
    next(error);
  }
});

app.post('/api/users/instructors', requireAuth, requireRole(['admin']), async (req, res, next) => {
  try {
    const { name, email, password = '11223344' } = req.body;
    if (!name?.trim() || !email?.trim()) {
      return res.status(400).json({ message: 'Instructor name and email are required.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await query(
      `insert into users (id, name, email, password_hash, role, status)
       values ($1, $2, $3, $4, 'instructor', 'Active')
       returning id, name, email, role, status, joined_at`,
      [`instructor-${randomUUID().slice(0, 10)}`, name.trim(), email.trim().toLowerCase(), passwordHash],
    );

    res.status(201).json({ user: publicUser(result.rows[0]) });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }
    return next(error);
  }
});

app.patch('/api/users/:id/status', requireAuth, requireRole(['admin']), async (req, res, next) => {
  try {
    const current = await query('select status from users where id = $1', [req.params.id]);
    if (!current.rowCount) return res.status(404).json({ message: 'User not found.' });

    const status = req.body.status || nextStatus(current.rows[0].status);
    const result = await query(
      `update users
       set status = $1
       where id = $2
       returning id, name, email, role, status, joined_at`,
      [status, req.params.id],
    );
    res.json({ user: publicUser(result.rows[0]) });
  } catch (error) {
    next(error);
  }
});

app.get('/api/courses', requireAuth, async (req, res, next) => {
  try {
    const { search = '', category = 'All', level = 'All', status = 'All', sort = 'popular' } = req.query;
    const clauses = [];
    const values = [];

    if (req.user.role === 'student') {
      clauses.push("status = 'Approved'");
    } else if (req.user.role === 'instructor') {
      values.push(req.user.sub);
      clauses.push(`instructor_id = $${values.length}`);
    } else if (status !== 'All') {
      values.push(status);
      clauses.push(`status = $${values.length}`);
    }

    if (req.user.role !== 'admin' && status !== 'All' && req.user.role !== 'student') {
      values.push(status);
      clauses.push(`status = $${values.length}`);
    }

    if (search) {
      values.push(`%${search}%`);
      clauses.push(`(title ilike $${values.length} or category ilike $${values.length} or level ilike $${values.length} or instructor ilike $${values.length} or description ilike $${values.length})`);
    }

    if (category !== 'All') {
      values.push(category);
      clauses.push(`category = $${values.length}`);
    }

    if (level !== 'All') {
      values.push(level);
      clauses.push(`level = $${values.length}`);
    }

    const orderBy = {
      popular: 'students desc',
      rating: 'rating desc',
      'price-low': 'price asc',
      newest: 'updated_at desc',
    }[sort] || 'students desc';

    const result = await query(
      `select *
       from courses
       ${clauses.length ? `where ${clauses.join(' and ')}` : ''}
       order by ${orderBy}, title asc`,
      values,
    );
    res.json({ courses: result.rows.map(publicCourse) });
  } catch (error) {
    next(error);
  }
});

app.post('/api/courses', requireAuth, requireRole(['instructor', 'admin']), async (req, res, next) => {
  try {
    const course = req.body;
    let instructorId = req.user.sub;
    let instructorName = req.user.name;
    let status = 'Pending';

    if (req.user.role === 'admin') {
      instructorId = course.instructorId || req.user.sub;
      const instructorResult = await query('select name from users where id = $1 and role in ($2, $3)', [
        instructorId,
        'instructor',
        'admin',
      ]);
      if (!instructorResult.rowCount) return res.status(400).json({ message: 'Choose a valid instructor.' });
      instructorName = instructorResult.rows[0].name;
      status = course.status || 'Approved';
    }

    const result = await query(
      `insert into courses
       (id, title, category, level, instructor_id, instructor, price, rating, students, lessons, duration, status, progress, description)
       values ($1, $2, $3, $4, $5, $6, $7, $8, 0, $9, $10, $11, 0, $12)
       returning *`,
      [
        `c-${randomUUID().slice(0, 8)}`,
        course.title,
        course.category,
        course.level,
        instructorId,
        instructorName,
        parseNumber(course.price),
        parseNumber(course.rating, 4.7),
        parseNumber(course.lessons),
        course.duration || '4h 00m',
        status,
        course.description,
      ],
    );
    res.status(201).json({ course: publicCourse(result.rows[0]) });
  } catch (error) {
    next(error);
  }
});

app.put('/api/courses/:id', requireAuth, requireRole(['instructor', 'admin']), async (req, res, next) => {
  try {
    const existing = await query('select * from courses where id = $1', [req.params.id]);
    if (!existing.rowCount) return res.status(404).json({ message: 'Course not found.' });
    if (req.user.role === 'instructor' && existing.rows[0].instructor_id !== req.user.sub) {
      return res.status(403).json({ message: 'You can only edit your own courses.' });
    }

    const course = req.body;
    const status = req.user.role === 'admin' ? course.status || existing.rows[0].status : 'Pending';
    const result = await query(
      `update courses
       set title = $1, category = $2, level = $3, price = $4, rating = $5,
           lessons = $6, duration = $7, status = $8, description = $9,
           denial_reason = null, updated_at = now()
       where id = $10
       returning *`,
      [
        course.title,
        course.category,
        course.level,
        parseNumber(course.price),
        parseNumber(course.rating, 4.7),
        parseNumber(course.lessons),
        course.duration || '4h 00m',
        status,
        course.description,
        req.params.id,
      ],
    );
    res.json({ course: publicCourse(result.rows[0]) });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/courses/:id/decision', requireAuth, requireRole(['admin']), async (req, res, next) => {
  try {
    const { decision, reason = null } = req.body;
    if (!['Approved', 'Denied'].includes(decision)) {
      return res.status(400).json({ message: 'Decision must be Approved or Denied.' });
    }

    const result = await query(
      `update courses
       set status = $1, denial_reason = $2, updated_at = now()
       where id = $3
       returning *`,
      [decision, decision === 'Denied' ? reason : null, req.params.id],
    );
    if (!result.rowCount) return res.status(404).json({ message: 'Course not found.' });
    res.json({ course: publicCourse(result.rows[0]) });
  } catch (error) {
    next(error);
  }
});

app.delete('/api/courses/:id', requireAuth, requireRole(['instructor', 'admin']), async (req, res, next) => {
  try {
    const existing = await query('select instructor_id from courses where id = $1', [req.params.id]);
    if (!existing.rowCount) return res.status(404).json({ message: 'Course not found.' });
    if (req.user.role === 'instructor' && existing.rows[0].instructor_id !== req.user.sub) {
      return res.status(403).json({ message: 'You can only delete your own courses.' });
    }

    await query('delete from courses where id = $1', [req.params.id]);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.post('/api/courses/:id/enroll', requireAuth, requireRole(['student']), async (req, res, next) => {
  try {
    const course = await query("select id from courses where id = $1 and status = 'Approved'", [req.params.id]);
    if (!course.rowCount) return res.status(404).json({ message: 'Approved course not found.' });

    await query(
      `insert into enrollments (id, student_id, course_id, progress)
       values ($1, $2, $3, 0)
       on conflict (student_id, course_id) do nothing`,
      [`enr-${randomUUID().slice(0, 10)}`, req.user.sub, req.params.id],
    );
    await query("update courses set students = (select count(*) from enrollments where course_id = $1 and status = 'Approved') where id = $1", [
      req.params.id,
    ]);

    const result = await query('select * from courses where id = $1', [req.params.id]);
    res.json({ course: publicCourse(result.rows[0]) });
  } catch (error) {
    next(error);
  }
});

app.get('/api/me/enrollments', requireAuth, requireRole(['student']), async (req, res, next) => {
  try {
    const result = await query(
      `select c.*, e.progress, e.status as enrollment_status, e.completed_lessons
       from enrollments e
       join courses c on c.id = e.course_id
       where e.student_id = $1
       order by e.enrolled_at desc`,
      [req.user.sub],
    );
    res.json({ courses: result.rows.map(row => ({ ...publicCourse(row), enrollmentStatus: row.enrollment_status, completedLessons: row.completed_lessons || [] })) });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/me/enrollments/:courseId/progress', requireAuth, requireRole(['student']), async (req, res, next) => {
  try {
    const { completedLessons } = req.body;
    const courseRes = await query('select lessons from courses where id = $1', [req.params.courseId]);
    if (!courseRes.rowCount) return res.status(404).json({ message: 'Course not found.' });
    const totalLessons = courseRes.rows[0].lessons;
    
    const safeCompleted = Array.isArray(completedLessons) ? completedLessons : [];
    const progress = totalLessons > 0 ? Math.round((safeCompleted.length / totalLessons) * 100) : 100;
    
    const result = await query(
      `update enrollments
       set progress = least(100, greatest(0, $1)), completed_lessons = $2::jsonb
       where student_id = $3 and course_id = $4
       returning progress`,
      [progress, JSON.stringify(safeCompleted), req.user.sub, req.params.courseId],
    );
    if (!result.rowCount) return res.status(404).json({ message: 'Enrollment not found.' });

    const course = await query(
      `select c.*, e.progress, e.status as enrollment_status, e.completed_lessons
       from enrollments e
       join courses c on c.id = e.course_id
       where e.student_id = $1 and e.course_id = $2`,
      [req.user.sub, req.params.courseId],
    );
    res.json({ course: { ...publicCourse(course.rows[0]), enrollmentStatus: course.rows[0].enrollment_status, completedLessons: course.rows[0].completed_lessons || [] } });
  } catch (error) {
    next(error);
  }
});

app.get('/api/instructor/students', requireAuth, requireRole(['instructor', 'admin']), async (req, res, next) => {
  try {
    const values = [];
    const instructorClause = req.user.role === 'instructor' ? 'where c.instructor_id = $1' : '';
    if (req.user.role === 'instructor') values.push(req.user.sub);

    const result = await query(
      `select
         c.id as course_id,
         c.title as course_title,
         u.id as student_id,
         u.name as student_name,
         u.email as student_email,
         e.progress,
         e.enrolled_at
       from courses c
       join enrollments e on e.course_id = c.id
       join users u on u.id = e.student_id
       ${instructorClause}
       order by c.title asc, u.name asc`,
      values,
    );
    res.json({
      enrollments: result.rows.map((row) => ({
        courseId: row.course_id,
        courseTitle: row.course_title,
        studentId: row.student_id,
        studentName: row.student_name,
        studentEmail: row.student_email,
        progress: Number(row.progress),
        enrolled: row.enrolled_at?.toISOString?.().slice(0, 10) || row.enrolled_at,
      })),
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/enrollments/pending', requireAuth, requireRole(['admin']), async (req, res, next) => {
  try {
    const result = await query(
      `select e.id as enrollment_id, u.name as student_name, u.email as student_email, c.title as course_title, e.enrolled_at
       from enrollments e
       join users u on u.id = e.student_id
       join courses c on c.id = e.course_id
       where e.status = 'Pending'
       order by e.enrolled_at asc`
    );
    res.json({ enrollments: result.rows });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/enrollments/:id/decision', requireAuth, requireRole(['admin']), async (req, res, next) => {
  try {
    const { decision } = req.body;
    if (!['Approved', 'Denied'].includes(decision)) {
      return res.status(400).json({ message: 'Decision must be Approved or Denied.' });
    }

    if (decision === 'Denied') {
      const existing = await query('select course_id from enrollments where id = $1', [req.params.id]);
      if (!existing.rowCount) return res.status(404).json({ message: 'Enrollment not found.' });
      
      const courseId = existing.rows[0].course_id;
      await query('delete from enrollments where id = $1', [req.params.id]);
      
      await query("update courses set students = (select count(*) from enrollments where course_id = $1 and status = 'Approved') where id = $1", [
        courseId,
      ]);
      
      return res.json({ message: 'Enrollment denied and removed.' });
    }

    const result = await query(
      `update enrollments
       set status = $1
       where id = $2
       returning *`,
      [decision, req.params.id]
    );
    if (!result.rowCount) return res.status(404).json({ message: 'Enrollment not found.' });

    await query("update courses set students = (select count(*) from enrollments where course_id = $1 and status = 'Approved') where id = $1", [
      result.rows[0].course_id,
    ]);

    res.json({ enrollment: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(error.status || 500).json({
    message: error.message || 'Something went wrong.',
  });
});

app.listen(port, () => {
  console.log(`CourseFlow API running on http://127.0.0.1:${port}`);
});
