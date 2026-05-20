import React, { useEffect, useMemo, useState } from 'react';
import { apiRequest } from './api/axiosConfig';

// Import components from their new locations
import AuthScreen from './components/Login';
import CourseForm from './components/CourseForm';
import CourseList from './components/CourseList';
import UserForm from './components/UserForm';
import UserList from './components/UserList';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import Learning from './components/Learning';
import CourseViewer from './components/CourseViewer';
import InstructorList from './components/InstructorList';
import AdminPanel from './components/AdminPanel';
import PaymentModal from './components/PaymentModal';
import ChangePasswordModal from './components/ChangePasswordModal';
import Footer from './components/Footer';
import { Field, Select, Toast } from './components/UI';

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

  async function loadData(authToken = token) {
    try {
      const summary = await apiRequest('/dashboard/summary', { token: authToken });
      
      setCourses(summary.courses || []);
      setUsers(summary.users || []);
      setInstructors(summary.instructors || []);
      setStudentRoster(summary.studentRoster || []);
      setPendingEnrollments(summary.pendingEnrollments || []);
      setEnrolledCourses(summary.enrolledCourses || []);
    } catch (error) {
      showToast('Failed to load dashboard data', 'error');
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
          <CourseList
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
            setActiveView={setActiveView}
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

        {activeView === 'instructors' && (
          <InstructorList instructors={instructors} courses={courses} />
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
            Field={Field}
          />
        )}
      </main>

      {showCourseForm && (
        <CourseForm
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
          Field={Field}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}
      <Footer role={user.role} setActiveView={setActiveView} />
    </div>
  );
}

export default App;
