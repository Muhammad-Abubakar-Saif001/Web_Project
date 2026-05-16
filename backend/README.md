# CourseFlow Backend

Node.js + Express API connected to PostgreSQL with email/password auth, role-based access,
course approvals, and enrollment tracking.

## Setup

1. Create a PostgreSQL database:

```bash
createdb courseflow
```

2. Copy the environment file:

```bash
copy .env.example .env
```

3. Update `DATABASE_URL` in `.env`.

```text
DATABASE_URL=postgresql://postgres:<YOUR-SUPABASE-PASSWORD>@db.nqrfskmrepojqmurjrvo.supabase.co:5432/postgres?sslmode=no-verify
DB_SSL_REJECT_UNAUTHORIZED=false
```

You can open a Supabase `psql` session with:

```bash
npm run db:psql:supabase
```

4. Run schema and seed:

```bash
npm run db:schema
npm run db:seed
```

5. Start the API:

```bash
npm run dev:api
```

## API

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/auth/me`
- `GET /api/health`
- `GET /api/users`
- `GET /api/users/instructors`
- `POST /api/users/instructors`
- `PATCH /api/users/:id/status`
- `GET /api/courses`
- `POST /api/courses`
- `PUT /api/courses/:id`
- `PATCH /api/courses/:id/decision`
- `DELETE /api/courses/:id`
- `POST /api/courses/:id/enroll`
- `GET /api/me/enrollments`
- `PATCH /api/me/enrollments/:courseId/progress`
- `GET /api/instructor/students`
