import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  BarChart3,
  BookOpen,
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
import { apiRequest } from './api/axiosConfig';

// Import components from their new locations
import AuthScreen from './components/Login';
import EventForm from './components/EventForm';
import EventList from './components/EventList';
import UserForm from './components/UserForm';
import UserList from './components/UserList';

const PAGE_SIZE = 6;

export function App() {
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
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [activeCourseId, setActiveCourseId] = useState(null);
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
    setActiveCourseId(null);
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

  async function updateProgress(courseId, completedLessons) {
    try {
      const payload = await apiRequest(`/me/enrollments/${courseId}/progress`, {
        method: 'PATCH',
        body: { completedLessons },
        token,
      });
      setEnrolledCourses((prev) =>
        prev.map((c) => (c.id === courseId ? payload.course : c)),
      );
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
    return <AuthScreen loading={loading} onSubmit={authenticate} Field={Field} Footer={Footer} />;
  }

  return (
    <div className="app-shell">
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        role={user.role}
        theme={theme}
        toggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        user={user}
        onLogout={logout}
        onChangePassword={() => setShowPasswordModal(true)}
      />
      <main className="main-area">

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
          <EventList
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
            Select={Select}
          />
        )}

        {activeView === 'learning' && (
          <Learning 
            courses={enrolledCourses} 
            setActiveView={setActiveView} 
            setActiveCourseId={setActiveCourseId} 
          />
        )}

        {activeView === 'course-viewer' && activeCourseId && (
          <CourseViewer 
            course={enrolledCourses.find(c => c.id === activeCourseId)}
            updateProgress={updateProgress}
            onBack={() => {
              setActiveView('learning');
              setActiveCourseId(null);
            }}
          />
        )}

        {activeView === 'roster' && (
          <UserList enrollments={studentRoster} />
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
        <EventForm
          user={user}
          course={editingCourse}
          instructors={instructors}
          onClose={() => {
            setShowCourseForm(false);
            setEditingCourse(null);
          }}
          onSave={saveCourse}
          Field={Field}
          Select={Select}
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

      {showPasswordModal && (
        <ChangePasswordModal 
          onClose={() => setShowPasswordModal(false)} 
          token={token} 
          showToast={showToast} 
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}
      <Footer role={user.role} setActiveView={setActiveView} />
    </div>
  );
}

// Sub-components kept in App.jsx for simplicity as they aren't in the image list
function Navbar({ activeView, setActiveView, role, theme, toggleTheme, user, onLogout, onChangePassword }) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const items = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'marketplace', label: role === 'student' ? 'Marketplace' : 'Courses', icon: LibraryBig },
    { id: 'learning', label: 'My Learning', icon: GraduationCap, roles: ['student'] },
    { id: 'roster', label: 'Students', icon: Users, roles: ['instructor', 'admin'] },
    { id: 'admin', label: 'Admin Panel', icon: ShieldCheck, roles: ['admin'] },
  ];

  return (
    <header className="navbar">
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
                <span className="nav-label">{item.label}</span>
              </button>
            );
          })}
      </nav>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div className="theme-switch-wrapper" style={{ margin: 0, padding: 0 }}>
          <label className="theme-switch" title="Toggle Dark Mode">
            <input type="checkbox" checked={theme === 'dark'} onChange={toggleTheme} />
            <span className="slider"></span>
          </label>
        </div>
        <div className="navbar-footer" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <button 
            className="avatar profile-toggle" 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            title="Profile Menu"
          >
            {user.name.slice(0, 1).toUpperCase()}
          </button>
          
          {showProfileMenu && (
            <>
              <div className="profile-overlay" onClick={() => setShowProfileMenu(false)}></div>
              <div className="profile-dropdown">
                <div className="profile-dropdown-header">
                  <strong>{user.name}</strong>
                  <span>{user.email}</span>
                  <div className="profile-role">{role}</div>
                </div>
                <div className="profile-dropdown-body">
                  <button className="dropdown-item" onClick={() => { onChangePassword(); setShowProfileMenu(false); }}>
                    <LockKeyhole size={16} />
                    Change Password
                  </button>
                  <button className="dropdown-item text-danger" onClick={onLogout}>
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
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

function Learning({ courses, setActiveView, setActiveCourseId }) {
  return (
    <section className="view-stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">My learning</p>
          <h2>Your enrolled courses</h2>
        </div>
      </div>
      <div className="learning-layout" style={{ gridTemplateColumns: '1fr' }}>
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
                    <button 
                      className="primary-btn compact" 
                      onClick={() => {
                        setActiveCourseId(course.id);
                        setActiveView('course-viewer');
                      }}
                    >
                      Open Course
                    </button>
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

function CourseViewer({ course, updateProgress, onBack }) {
  const [localCompleted, setLocalCompleted] = useState(course.completedLessons || []);

  useEffect(() => {
    setLocalCompleted(course.completedLessons || []);
  }, [course.completedLessons]);

  const completedSet = new Set(localCompleted);
  const localProgress = course.lessons > 0 
    ? Math.round((localCompleted.length / course.lessons) * 100) 
    : 0;

  const toggleLesson = (lessonIndex) => {
    const newCompletedSet = new Set(completedSet);
    if (newCompletedSet.has(lessonIndex)) {
      newCompletedSet.delete(lessonIndex);
    } else {
      newCompletedSet.add(lessonIndex);
    }
    const newCompletedArray = Array.from(newCompletedSet);
    setLocalCompleted(newCompletedArray);
    updateProgress(course.id, newCompletedArray);
  };

  const lessons = Array.from({ length: course.lessons }, (_, i) => i + 1);

  return (
    <section className="view-stack">
      <div className="section-heading" style={{ display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'flex-start' }}>
        <button className="icon-btn" onClick={onBack} title="Back">
          <ArrowLeft size={18} />
        </button>
        <div>
          <p className="eyebrow">Course Viewer</p>
          <h2>{course.title}</h2>
        </div>
      </div>
      <div className="learning-layout" style={{ gridTemplateColumns: '1fr' }}>
        <section className="panel">
          <div className="progress-wrap large" style={{ marginBottom: '24px' }}>
            <div className="progress-label">
              <span>Course Progress</span>
              <strong>{localProgress}%</strong>
            </div>
            <div className="progress-track">
              <span style={{ width: `${localProgress}%` }} />
            </div>
          </div>
          
          <h3>Lessons</h3>
          <div className="lesson-list">
            {lessons.map((lesson) => (
              <label key={lesson} className={`lesson-item ${completedSet.has(lesson) ? 'completed' : ''}`}>
                <input 
                  type="checkbox" 
                  checked={completedSet.has(lesson)}
                  onChange={() => toggleLesson(lesson)}
                />
                <span>Lesson {lesson}</span>
              </label>
            ))}
            {lessons.length === 0 && <p className="muted">This course currently has no lessons.</p>}
          </div>
        </section>
      </div>
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
          <UserForm onSubmit={createInstructor} Field={Field} />
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

function ChangePasswordModal({ onClose, token, showToast }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }

    try {
      setLoading(true);
      await apiRequest('/auth/change-password', {
        method: 'POST',
        body: { newPassword },
        token,
      });
      showToast('Password changed successfully.', 'success');
      onClose();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <form className="modal payment-modal" onSubmit={handleSubmit}>
        <div className="modal-header">
          <div>
            <p className="eyebrow">Security</p>
            <h2>Change Password</h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div style={{ display: 'grid', gap: '14px' }}>
          <Field 
            label="New Password" 
            type="password" 
            value={newPassword} 
            onChange={setNewPassword} 
            required 
          />
          <Field 
            label="Confirm Password" 
            type="password" 
            value={confirmPassword} 
            onChange={setConfirmPassword} 
            required 
          />
        </div>
        <div className="modal-actions" style={{ marginTop: '20px' }}>
          <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? 'Saving...' : 'Update Password'}
          </button>
        </div>
      </form>
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

function Footer({ role, setActiveView }) {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-brand">
          <div className="brand">
            <div className="brand-mark">
              <BookOpen size={24} color="white" />
            </div>
            <div>
              <strong style={{ color: 'white' }}>CourseFlow</strong>
              <span style={{ color: 'rgba(255,255,255,0.7)' }}>Interactive learning platform</span>
            </div>
          </div>
          <p>
            Empowering learners and instructors worldwide with a seamless, 
            interactive, and professional educational marketplace.
          </p>
        </div>

        <div className="footer-links">
          <h4>Platform</h4>
          <ul>
            <li><span onClick={() => setActiveView('dashboard')}>Dashboard</span></li>
            <li><span onClick={() => setActiveView('marketplace')}>Marketplace</span></li>
            {role === 'student' && <li><span onClick={() => setActiveView('learning')}>My Learning</span></li>}
            {(role === 'instructor' || role === 'admin') && <li><span onClick={() => setActiveView('roster')}>Student Roster</span></li>}
          </ul>
        </div>

        <div className="footer-links">
          <h4>Company</h4>
          <ul>
            <li><a href="#">About Us</a></li>
            <li><a href="#">Careers</a></li>
            <li><a href="#">Partner Program</a></li>
            <li><a href="#">Privacy Policy</a></li>
          </ul>
        </div>

        <div className="footer-links">
          <h4>Support</h4>
          <ul>
            <li><a href="#">Help Center</a></li>
            <li><a href="#">Contact Support</a></li>
            <li><a href="#">Community</a></li>
            <li><a href="#">FAQ</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {currentYear} CourseFlow Marketplace. All rights reserved.</p>
        <div className="social-links">
          <a href="#" aria-label="Twitter">Twitter</a>
          <a href="#" aria-label="LinkedIn">LinkedIn</a>
          <a href="#" aria-label="GitHub">GitHub</a>
        </div>
      </div>
    </footer>
  );
}

export default App;
