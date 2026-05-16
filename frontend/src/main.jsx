import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Edit3,
  Filter,
  GraduationCap,
  LayoutDashboard,
  LibraryBig,
  LockKeyhole,
  LogOut,
  Moon,
  Plus,
  Search,
  ShieldCheck,
  Star,
  Sun,
  Trash2,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import './styles.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:4000/api';
const PAGE_SIZE = 6;

const emptyCourse = {
  title: '',
  category: 'Development',
  level: 'Beginner',
  instructorId: '',
  price: 99,
  rating: 4.7,
  lessons: 24,
  duration: '4h 00m',
  status: 'Approved',
  description: '',
};

async function apiRequest(path, { method = 'GET', body, token } = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) return null;
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || 'Request failed.');
  return payload;
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('courseflow-token') || '');
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('courseflow-theme') || 'light');
  const [activeView, setActiveView] = useState('dashboard');
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [studentRoster, setStudentRoster] = useState([]);
  const [pendingEnrollments, setPendingEnrollments] = useState([]);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({ category: 'All', level: 'All', status: 'All', sort: 'popular' });
  const [page, setPage] = useState(1);
  const [editingCourse, setEditingCourse] = useState(null);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [paymentCourse, setPaymentCourse] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    refreshSession(token);
  }, [token]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('courseflow-theme', theme);
  }, [theme]);

  useEffect(() => {
    setPage(1);
  }, [query, filters]);

  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function refreshSession(authToken = token) {
    try {
      setLoading(true);
      const me = await apiRequest('/auth/me', { token: authToken });
      setUser(me.user);
      await loadData(authToken, me.user);
    } catch (error) {
      showToast(error.message, 'error');
      logout();
    } finally {
      setLoading(false);
    }
  }

  async function loadData(authToken = token, currentUser = user) {
    const coursePayload = await apiRequest('/courses', { token: authToken });
    setCourses(coursePayload.courses);

    if (currentUser?.role === 'admin') {
      const [usersPayload, instructorsPayload, rosterPayload, pendingPayload] = await Promise.all([
        apiRequest('/users', { token: authToken }),
        apiRequest('/users/instructors', { token: authToken }),
        apiRequest('/instructor/students', { token: authToken }),
        apiRequest('/enrollments/pending', { token: authToken }),
      ]);
      setUsers(usersPayload.users);
      setInstructors(instructorsPayload.instructors);
      setStudentRoster(rosterPayload.enrollments);
      setPendingEnrollments(pendingPayload.enrollments);
      setEnrolledCourses([]);
    }

    if (currentUser?.role === 'student') {
      const enrolledPayload = await apiRequest('/me/enrollments', { token: authToken });
      setEnrolledCourses(enrolledPayload.courses);
      setUsers([]);
      setInstructors([]);
      setStudentRoster([]);
    }

    if (currentUser?.role === 'instructor') {
      const rosterPayload = await apiRequest('/instructor/students', { token: authToken });
      setStudentRoster(rosterPayload.enrollments);
      setUsers([]);
      setInstructors([]);
      setEnrolledCourses([]);
    }
  }

  async function authenticate(mode, form) {
    try {
      setLoading(true);
      const endpoint = mode === 'register' ? '/auth/register' : '/auth/login';
      const payload = await apiRequest(endpoint, { method: 'POST', body: form });
      localStorage.setItem('courseflow-token', payload.token);
      setToken(payload.token);
      setUser(payload.user);
      await loadData(payload.token, payload.user);
      setActiveView('dashboard');
      showToast('Login successful');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem('courseflow-token');
    setToken('');
    setUser(null);
    setCourses([]);
    setUsers([]);
    setInstructors([]);
    setEnrolledCourses([]);
    setStudentRoster([]);
    setActiveView('dashboard');
    showToast('Logged out');
  }

  async function saveCourse(course) {
    try {
      const payload = await apiRequest(course.id ? `/courses/${course.id}` : '/courses', {
        method: course.id ? 'PUT' : 'POST',
        body: course,
        token,
      });
      setShowCourseForm(false);
      setEditingCourse(null);
      await loadData(token, user);
      showToast(
        payload.course.status === 'Pending'
          ? 'Course submitted for approval.'
          : 'Course saved successfully.',
      );
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  async function deleteCourse(courseId) {
    try {
      await apiRequest(`/courses/${courseId}`, { method: 'DELETE', token });
      await loadData(token, user);
      showToast('Course deleted.');
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  async function decideCourse(courseId, decision) {
    try {
      const reason = decision === 'Denied' ? 'Course needs revision before publication.' : null;
      await apiRequest(`/courses/${courseId}/decision`, {
        method: 'PATCH',
        body: { decision, reason },
        token,
      });
      await loadData(token, user);
      showToast(`Course ${decision.toLowerCase()}.`);
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  async function decideEnrollment(enrollmentId, decision) {
    try {
      await apiRequest(`/enrollments/${enrollmentId}/decision`, {
        method: 'PATCH',
        body: { decision },
        token,
      });
      await loadData(token, user);
      showToast(`Enrollment ${decision.toLowerCase()}.`);
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  async function enroll(courseId) {
    try {
      await apiRequest(`/courses/${courseId}/enroll`, { method: 'POST', token });
      await loadData(token, user);
      showToast('Enrollment request sent.');
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  async function updateProgress(courseId, amount) {
    try {
      await apiRequest(`/me/enrollments/${courseId}/progress`, {
        method: 'PATCH',
        body: { amount },
        token,
      });
      await loadData(token, user);
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  async function createInstructor(form) {
    try {
      await apiRequest('/users/instructors', { method: 'POST', body: form, token });
      await loadData(token, user);
      showToast('Instructor account created.');
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  async function cycleUserStatus(userId) {
    try {
      await apiRequest(`/users/${userId}/status`, { method: 'PATCH', token });
      await loadData(token, user);
      showToast('User status updated.');
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(courses.map((course) => course.category)))],
    [courses],
  );

  const filteredCourses = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return courses
      .filter((course) => {
        const matchesQuery =
          !normalizedQuery ||
          [course.title, course.category, course.level, course.instructor, course.description]
            .join(' ')
            .toLowerCase()
            .includes(normalizedQuery);
        const matchesCategory = filters.category === 'All' || course.category === filters.category;
        const matchesLevel = filters.level === 'All' || course.level === filters.level;
        const matchesStatus = filters.status === 'All' || course.status === filters.status;
        return matchesQuery && matchesCategory && matchesLevel && matchesStatus;
      })
      .sort((a, b) => {
        if (filters.sort === 'rating') return b.rating - a.rating;
        if (filters.sort === 'price-low') return a.price - b.price;
        if (filters.sort === 'newest') return new Date(b.updated) - new Date(a.updated);
        return b.students - a.students;
      });
  }, [courses, filters, query]);

  const totalPages = Math.max(1, Math.ceil(filteredCourses.length / PAGE_SIZE));
  const paginatedCourses = filteredCourses.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = useMemo(() => {
    const source = user?.role === 'student' ? enrolledCourses : courses;
    const revenue = courses.reduce((sum, course) => sum + course.price * course.students, 0);
    return {
      totalCourses: source.length,
      approved: courses.filter((course) => course.status === 'Approved').length,
      pending: courses.filter((course) => course.status === 'Pending').length,
      totalStudents: user?.role === 'admin' 
        ? users.filter(u => u.role === 'student').length 
        : courses.reduce((sum, course) => sum + course.students, 0),
      revenue,
      avgRating: courses.length ? courses.reduce((sum, course) => sum + course.rating, 0) / courses.length : 0,
      instructors: new Set(courses.map((course) => course.instructorId || course.instructor)).size,
    };
  }, [courses, enrolledCourses, user, users]);

  if (!user) {
    return <AuthScreen loading={loading} onSubmit={authenticate} />;
  }

  return (
    <div className="app-shell">
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        role={user.role} 
        theme={theme} 
        toggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')} 
      />
      <main className="main-area">
        <Topbar user={user} onLogout={logout} />

        {activeView === 'dashboard' && (
          <Dashboard
            user={user}
            stats={stats}
            courses={courses}
            enrolledCourses={enrolledCourses}
            studentRoster={studentRoster}
            setActiveView={setActiveView}
            onNewCourse={() => {
              setEditingCourse(null);
              setShowCourseForm(true);
            }}
          />
        )}

        {activeView === 'marketplace' && (
          <Marketplace
            user={user}
            categories={categories}
            courses={paginatedCourses}
            total={filteredCourses.length}
            page={page}
            totalPages={totalPages}
            setPage={setPage}
            query={query}
            setQuery={setQuery}
            filters={filters}
            setFilters={setFilters}
            onEnroll={(courseId) => {
              const course = courses.find((c) => c.id === courseId);
              setPaymentCourse(course);
            }}
            onEdit={(course) => {
              setEditingCourse(course);
              setShowCourseForm(true);
            }}
            onDelete={deleteCourse}
            onDecision={decideCourse}
          />
        )}

        {activeView === 'learning' && (
          <Learning courses={enrolledCourses} updateProgress={updateProgress} />
        )}

        {activeView === 'roster' && (
          <Roster enrollments={studentRoster} />
        )}

        {activeView === 'admin' && user.role === 'admin' && (
          <AdminPanel
            users={users}
            courses={courses}
            instructors={instructors}
            pendingEnrollments={pendingEnrollments}
            createInstructor={createInstructor}
            cycleUserStatus={cycleUserStatus}
            onDecision={decideCourse}
            onEnrollmentDecision={decideEnrollment}
            onNewCourse={() => {
              setEditingCourse(null);
              setShowCourseForm(true);
            }}
            onEdit={(course) => {
              setEditingCourse(course);
              setShowCourseForm(true);
            }}
          />
        )}
      </main>

      {showCourseForm && (
        <CourseModal
          user={user}
          course={editingCourse}
          instructors={instructors}
          onClose={() => {
            setShowCourseForm(false);
            setEditingCourse(null);
          }}
          onSave={saveCourse}
        />
      )}

      {paymentCourse && (
        <PaymentModal
          course={paymentCourse}
          onClose={() => setPaymentCourse(null)}
          onConfirm={() => {
            enroll(paymentCourse.id);
            setPaymentCourse(null);
          }}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}

function AuthScreen({ loading, onSubmit }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  function submit(event) {
    event.preventDefault();
    onSubmit(mode, form);
  }

  return (
    <main className="auth-page">
      <section className="auth-hero">
        <div className="brand large">
          <div className="brand-mark">
            <BookOpen size={28} />
          </div>
          <div>
            <strong>CourseFlow</strong>
            <span>Interactive learning platform</span>
          </div>
        </div>
        <h1>Login to manage your learning journey.</h1>
        <p>
          Join our community of lifelong learners. Register as a student to access premium 
          courses or sign in to continue your professional development.
        </p>
      </section>
      <form className="auth-card" onSubmit={submit}>
        <div className="role-switcher">
          <button type="button" className={mode === 'login' ? 'role active' : 'role'} onClick={() => setMode('login')}>
            Login
          </button>
          <button type="button" className={mode === 'register' ? 'role active' : 'role'} onClick={() => setMode('register')}>
            Register
          </button>
        </div>
        {mode === 'register' && (
          <Field label="Name" value={form.name} onChange={(name) => setForm({ ...form, name })} required />
        )}
        <Field label="Email" type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} required />
        <Field label="Password" type="password" value={form.password} onChange={(password) => setForm({ ...form, password })} required />
        <button className="primary-btn" type="submit" disabled={loading}>
          <LockKeyhole size={18} />
          {mode === 'login' ? 'Login' : 'Create student account'}
        </button>
      </form>
    </main>
  );
}

function Sidebar({ activeView, setActiveView, role, theme, toggleTheme }) {
  const items = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'marketplace', label: role === 'student' ? 'Marketplace' : 'Courses', icon: LibraryBig },
    { id: 'learning', label: 'My Learning', icon: GraduationCap, roles: ['student'] },
    { id: 'roster', label: 'Students', icon: Users, roles: ['instructor', 'admin'] },
    { id: 'admin', label: 'Admin Panel', icon: ShieldCheck, roles: ['admin'] },
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          <BookOpen size={24} />
        </div>
        <div>
          <strong>CourseFlow</strong>
          <span>{role} workspace</span>
        </div>
      </div>
      <nav>
        {items
          .filter((item) => !item.roles || item.roles.includes(role))
          .map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={activeView === item.id ? 'nav-item active' : 'nav-item'}
                onClick={() => setActiveView(item.id)}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </button>
            );
          })}
        
        <div className="theme-switch-wrapper">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {theme === 'light' ? <Moon size={19} /> : <Sun size={19} />}
            <span>Dark Mode</span>
          </div>
          <label className="theme-switch">
            <input type="checkbox" checked={theme === 'dark'} onChange={toggleTheme} />
            <span className="slider"></span>
          </label>
        </div>
      </nav>
      <div className="sidebar-footer">
        <LockKeyhole size={18} />
        <p>All data is securely synced and updated in real-time.</p>
      </div>
    </aside>
  );
}

function Topbar({ user, onLogout }) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">Authenticated {user.role} session</p>
        <h1>Welcome back, {user.name}.</h1>
      </div>
      <div className="profile-chip">
        <div className="avatar">{user.name.slice(0, 1)}</div>
        <div>
          <strong>{user.name}</strong>
          <span>{user.email}</span>
        </div>
        <button className="icon-btn" onClick={onLogout} title="Logout">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}

function Dashboard({ user, stats, courses, enrolledCourses, studentRoster, setActiveView, onNewCourse }) {
  return (
    <section className="view-stack">
      <div className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Role workspace</p>
          <h2>
            {user.role === 'student' && 'Learn from approved courses and track your enrollments.'}
            {user.role === 'instructor' && 'Create courses and see the students enrolled in your classes.'}
            {user.role === 'admin' && 'Create instructors, publish courses, and moderate new submissions.'}
          </h2>
          <p>
            Authentication, course approvals, enrollments, and dashboards are powered by our 
            secure backend infrastructure.
          </p>
          <div className="hero-actions">
            <button className="primary-btn" onClick={() => setActiveView('marketplace')}>
              <Search size={18} />
              {user.role === 'student' ? 'Browse courses' : 'Manage courses'}
            </button>
            {user.role !== 'student' && (
              <button className="secondary-btn" onClick={onNewCourse}>
                <Plus size={18} />
                New course
              </button>
            )}
          </div>
        </div>
        <div className="hero-metrics">
          <Metric icon={LibraryBig} label="Courses" value={stats.totalCourses} />
          <Metric icon={UserCog} label="Instructors" value={stats.instructors} />
          <Metric icon={Users} label="Students" value={stats.totalStudents} />
        </div>
      </div>

      <div className="stat-grid">
        {(user.role === 'admin') && (
          <StatCard icon={LibraryBig} label="Courses" value={stats.totalCourses} trend="Total offerings" />
        )}
        {(user.role === 'admin' || user.role === 'instructor') && (
          <StatCard icon={Activity} label="Pending" value={stats.pending} trend="Admin review queue" />
        )}
        {(user.role === 'admin' || user.role === 'student') && (
          <StatCard icon={Star} label="Avg. rating" value={stats.avgRating.toFixed(1)} trend="Approved catalog" />
        )}
        {(user.role === 'admin') && (
          <StatCard icon={BarChart3} label="Revenue" value={`PKR ${Math.round(stats.revenue).toLocaleString()}`} trend="From enrollments" />
        )}
      </div>

      <div className="content-grid">
        <section className="panel wide">
          <PanelHeader icon={BarChart3} title={user.role === 'student' ? 'My Enrollments' : 'Course Performance'} />
          <div className="course-bars">
            {(user.role === 'student' ? enrolledCourses : courses).slice(0, 6).map((course) => (
              <div key={course.id} className="bar-row">
                <div>
                  <strong>{course.title}</strong>
                  <span>{course.instructor}</span>
                </div>
                <div className="bar-track">
                  <span style={{ width: `${user.role === 'student' ? course.progress : Math.min(100, course.students * 20)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="panel">
          <PanelHeader icon={Users} title="Students" />
          <div className="status-list">
            {studentRoster.slice(0, 5).map((item) => (
              <div key={`${item.courseId}-${item.studentId}`} className="status-row">
                <span className="status-dot published" />
                <span>{item.studentName}</span>
                <strong>{item.progress}%</strong>
              </div>
            ))}
            {!studentRoster.length && <p className="muted">No enrolled students yet.</p>}
          </div>
        </section>
      </div>
    </section>
  );
}

function Marketplace({
  user,
  categories,
  courses,
  total,
  page,
  totalPages,
  setPage,
  query,
  setQuery,
  filters,
  setFilters,
  onEnroll,
  onEdit,
  onDelete,
  onDecision,
}) {
  return (
    <section className="view-stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{user.role === 'student' ? 'Marketplace' : 'Course operations'}</p>
          <h2>{user.role === 'student' ? 'Approved courses' : 'Offered Courses'}</h2>
        </div>
        <span className="result-count">{total} results</span>
      </div>
      <div className="toolbar">
        <label className="search-box">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search for courses..." />
        </label>
        <Select label="Category" value={filters.category} onChange={(category) => setFilters({ ...filters, category })} options={categories} />
        <Select label="Level" value={filters.level} onChange={(level) => setFilters({ ...filters, level })} options={['All', 'Beginner', 'Intermediate', 'Advanced']} />
        <Select label="Status" value={filters.status} onChange={(status) => setFilters({ ...filters, status })} options={['All', 'Pending', 'Approved', 'Denied']} />
        <Select label="Sort" value={filters.sort} onChange={(sort) => setFilters({ ...filters, sort })} options={[['popular', 'Most enrolled'], ['rating', 'Top rated'], ['price-low', 'Lowest price'], ['newest', 'Newest']]} />
      </div>
      <div className="course-grid">
        {courses.map((course) => (
          <CourseCard
            key={course.id}
            user={user}
            course={course}
            onEnroll={onEnroll}
            onEdit={onEdit}
            onDelete={onDelete}
            onDecision={onDecision}
          />
        ))}
      </div>
      <div className="pagination">
        <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>
          <ChevronLeft size={18} />
        </button>
        <span>Page {page} of {totalPages}</span>
        <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}>
          <ChevronRight size={18} />
        </button>
      </div>
    </section>
  );
}

function CourseCard({ user, course, onEnroll, onEdit, onDelete, onDecision }) {
  return (
    <article className="course-card">
      <div className="course-cover">
        <span>{course.category}</span>
        <strong>PKR {course.price}</strong>
      </div>
      <div className="course-body">
        <div className="course-title-row">
          <h3>{course.title}</h3>
          <span className={`pill ${course.status.toLowerCase()}`}>{course.status}</span>
        </div>
        <p>{course.description}</p>
        {course.denialReason && <p className="warning-text">{course.denialReason}</p>}
        <div className="course-meta">
          <span><Star size={15} />{course.rating}</span>
          <span><Users size={15} />{course.students}</span>
          <span><Clock3 size={15} />{course.duration}</span>
        </div>
        <div className="card-actions">
          {user.role === 'student' && (
            <button className="primary-btn compact" onClick={() => onEnroll(course.id)}>
              <CheckCircle2 size={16} />
              Enroll
            </button>
          )}
          {user.role !== 'student' && (
            <>
              <button className="icon-btn" onClick={() => onEdit(course)} title="Edit course">
                <Edit3 size={17} />
              </button>
              <button className="icon-btn danger" onClick={() => onDelete(course.id)} title="Delete course">
                <Trash2 size={17} />
              </button>
            </>
          )}
          {user.role === 'admin' && course.status === 'Pending' && (
            <>
              <button className="primary-btn compact" onClick={() => onDecision(course.id, 'Approved')}>Approve</button>
              <button className="secondary-btn compact" onClick={() => onDecision(course.id, 'Denied')}>Deny</button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

function Learning({ courses, updateProgress }) {
  return (
    <section className="view-stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">My learning</p>
          <h2>Your enrolled courses</h2>
        </div>
      </div>
      <div className="learning-layout">
        <section className="panel wide">
          <PanelHeader icon={GraduationCap} title="Progress Tracking" />
          <div className="course-list">
            {courses.map((course) => (
              <div key={course.id} className="learning-card">
                <div>
                  <strong>{course.title}</strong>
                  <span>{course.instructor}</span>
                </div>
                <div className="progress-wrap">
                  <div className="progress-label">
                    <span>Completion</span>
                    <strong>{course.progress}%</strong>
                  </div>
                  <div className="progress-track">
                    <span style={{ width: `${course.progress}%` }} />
                  </div>
                </div>
                {course.enrollmentStatus === 'Pending' ? (
                  <div className="hero-actions">
                    <span className="api-status">Payment Pending Approval</span>
                  </div>
                ) : (
                  <div className="hero-actions">
                    <button className="primary-btn compact" onClick={() => updateProgress(course.id, 10)}>Complete lesson</button>
                    <button className="secondary-btn compact" onClick={() => updateProgress(course.id, -10)}>Reopen</button>
                  </div>
                )}
              </div>
            ))}
            {!courses.length && <p className="muted">You are not enrolled in any courses yet.</p>}
          </div>
        </section>
      </div>
    </section>
  );
}

function Roster({ enrollments }) {
  return (
    <section className="view-stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Students</p>
          <h2>Students enrolled in instructor courses</h2>
        </div>
        <span className="result-count">{enrollments.length} enrollments</span>
      </div>
      <section className="panel wide">
        <div className="table">
          <div className="table-row table-head roster-row">
            <span>Student</span>
            <span>Email</span>
            <span>Course</span>
            <span>Progress</span>
            <span>Enrolled</span>
          </div>
          {enrollments.map((item) => (
            <div key={`${item.courseId}-${item.studentId}`} className="table-row roster-row">
              <span>{item.studentName}</span>
              <span>{item.studentEmail}</span>
              <span>{item.courseTitle}</span>
              <span>{item.progress}%</span>
              <span>{item.enrolled}</span>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}

function AdminPanel({ users, courses, instructors, pendingEnrollments, createInstructor, cycleUserStatus, onDecision, onEnrollmentDecision, onNewCourse, onEdit }) {
  const pending = courses.filter((course) => course.status === 'Pending');
  return (
    <section className="view-stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Admin panel</p>
          <h2>Users, instructors, courses, and approvals</h2>
        </div>
        <button className="primary-btn" onClick={onNewCourse}>
          <Plus size={18} />
          Add course
        </button>
      </div>
      <div className="admin-grid">
        <section className="panel">
          <PanelHeader icon={UserCog} title="Add Instructor" />
          <InstructorForm onSubmit={createInstructor} />
        </section>
        <section className="panel">
          <PanelHeader icon={Filter} title="Payment Approvals" />
          <div className="status-list">
            {pendingEnrollments.map((enrollment) => (
              <div key={enrollment.enrollment_id} className="moderation-item">
                <div>
                  <strong>{enrollment.student_name}</strong>
                  <span>{enrollment.course_title}</span>
                </div>
                <div className="hero-actions">
                  <button className="primary-btn compact" onClick={() => onEnrollmentDecision(enrollment.enrollment_id, 'Approved')}>Approve</button>
                  <button className="secondary-btn compact" onClick={() => onEnrollmentDecision(enrollment.enrollment_id, 'Denied')}>Deny</button>
                </div>
              </div>
            ))}
            {!pendingEnrollments.length && <p className="muted">No pending payments.</p>}
          </div>
        </section>
        <section className="panel">
          <PanelHeader icon={Filter} title="Course Requests" />
          <div className="status-list">
            {pending.map((course) => (
              <div key={course.id} className="moderation-item">
                <div>
                  <strong>{course.title}</strong>
                  <span>{course.instructor}</span>
                </div>
                <div className="hero-actions">
                  <button className="primary-btn compact" onClick={() => onDecision(course.id, 'Approved')}>Approve</button>
                  <button className="secondary-btn compact" onClick={() => onDecision(course.id, 'Denied')}>Deny</button>
                </div>
              </div>
            ))}
            {!pending.length && <p className="muted">No pending course requests.</p>}
          </div>
        </section>
        <section className="panel wide">
          <PanelHeader icon={Users} title="User Management" />
          <div className="table">
            <div className="table-row table-head">
              <span>Name</span>
              <span>Email</span>
              <span>Role</span>
              <span>Status</span>
              <span>Action</span>
            </div>
            {users.map((item) => (
              <div key={item.id} className="table-row">
                <span>{item.name}</span>
                <span>{item.email}</span>
                <span className="capitalize">{item.role}</span>
                <span className={`pill ${item.status.toLowerCase()}`}>{item.status}</span>
                <button className="text-btn" onClick={() => cycleUserStatus(item.id)}>Change</button>
              </div>
            ))}
          </div>
        </section>
        <section className="panel">
          <PanelHeader icon={ClipboardCheck} title="Instructors" />
          <div className="status-list">
            {instructors.map((item) => (
              <div key={item.id} className="status-row">
                <span className="status-dot published" />
                <span>{item.name}</span>
                <strong>{item.status}</strong>
              </div>
            ))}
          </div>
        </section>
        <section className="panel">
          <PanelHeader icon={LibraryBig} title="All Courses" />
          <div className="status-list">
            {courses.slice(0, 8).map((course) => (
              <div key={course.id} className="moderation-item">
                <div>
                  <strong>{course.title}</strong>
                  <span>{course.status}</span>
                </div>
                <button className="icon-btn" onClick={() => onEdit(course)} title="Edit course">
                  <Edit3 size={17} />
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

function InstructorForm({ onSubmit }) {
  const [form, setForm] = useState({ name: '', email: '', password: '11223344' });
  return (
    <form className="stack-form" onSubmit={(event) => {
      event.preventDefault();
      onSubmit(form);
      setForm({ name: '', email: '', password: '11223344' });
    }}>
      <Field label="Name" value={form.name} onChange={(name) => setForm({ ...form, name })} required />
      <Field label="Email" type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} required />
      <Field label="Password" type="password" value={form.password} onChange={(password) => setForm({ ...form, password })} required />
      <button className="primary-btn" type="submit">Create instructor</button>
    </form>
  );
}

function CourseModal({ user, course, instructors, onClose, onSave }) {
  const [form, setForm] = useState({ ...emptyCourse, ...course });

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submit(event) {
    event.preventDefault();
    onSave(form);
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <form className="modal" onSubmit={submit}>
        <div className="modal-header">
          <div>
            <p className="eyebrow">{course ? 'Edit course' : 'Create course'}</p>
            <h2>{course ? course.title : 'New course'}</h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="form-grid">
          <Field label="Title" value={form.title} onChange={(value) => updateField('title', value)} required />
          <Select label="Category" value={form.category} onChange={(value) => updateField('category', value)} options={['Development', 'Business', 'Data', 'Design', 'Security', 'Operations']} />
          <Select label="Level" value={form.level} onChange={(value) => updateField('level', value)} options={['Beginner', 'Intermediate', 'Advanced']} />
          {user.role === 'admin' && (
            <Select
              label="Instructor"
              value={form.instructorId || instructors[0]?.id || ''}
              onChange={(value) => updateField('instructorId', value)}
              options={instructors.map((item) => [item.id, item.name])}
            />
          )}
          {user.role === 'admin' && (
            <Select label="Status" value={form.status} onChange={(value) => updateField('status', value)} options={['Pending', 'Approved', 'Denied']} />
          )}
          <Field label="Price" type="number" value={form.price} onChange={(value) => updateField('price', value)} />
          <Field label="Rating" type="number" value={form.rating} onChange={(value) => updateField('rating', value)} />
          <Field label="Lessons" type="number" value={form.lessons} onChange={(value) => updateField('lessons', value)} />
          <Field label="Duration" value={form.duration} onChange={(value) => updateField('duration', value)} />
        </div>
        <label className="field full">
          <span>Description</span>
          <textarea value={form.description} onChange={(event) => updateField('description', event.target.value)} required />
        </label>
        <div className="modal-actions">
          <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="primary-btn">Save course</button>
        </div>
      </form>
    </div>
  );
}

function PaymentModal({ course, onClose, onConfirm }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal payment-modal">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Payment Required</p>
            <h2>{course.title}</h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="payment-details">
          <p className="payment-intro">Please send <strong>PKR {course.price}</strong> to the following account:</p>
          <ul className="payment-list">
            <li><strong>Account Title:</strong> Muhammad Abubakar Saif</li>
            <li><strong>Payment Account Number:</strong> 03306664425</li>
            <li><strong>Pay through:</strong> Nayapay</li>
          </ul>
          <p className="payment-note">
            After you confirm your payment, the approval request will be sent to the admin.
            The admin will approve the request within 24 hours.
          </p>
        </div>
        <div className="modal-actions">
          <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
          <button type="button" className="primary-btn" onClick={onConfirm}>Confirm Payment</button>
        </div>
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="metric">
      <Icon size={19} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, trend }) {
  return (
    <article className="stat-card">
      <Icon size={22} />
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{trend}</small>
    </article>
  );
}

function PanelHeader({ icon: Icon, title }) {
  return (
    <div className="panel-header">
      <div>
        <Icon size={19} />
        <h3>{title}</h3>
      </div>
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="select-control">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => {
          const optionValue = Array.isArray(option) ? option[0] : option;
          const optionLabel = Array.isArray(option) ? option[1] : option;
          return <option key={optionValue} value={optionValue}>{optionLabel}</option>;
        })}
      </select>
    </label>
  );
}

function Field({ label, value, onChange, type = 'text', required = false }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} />
    </label>
  );
}

function Toast({ message, type }) {
  return (
    <div className={`toast ${type}`}>
      {message}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
