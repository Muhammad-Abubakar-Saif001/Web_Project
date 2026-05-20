import React from 'react';
import { Search, Plus, LibraryBig, UserCog, Users, Star, Activity, BarChart3 } from 'lucide-react';
import { Metric, StatCard, PanelHeader } from './UI';

export function Dashboard({ user, stats, courses, enrolledCourses, studentRoster, setActiveView, onNewCourse }) {
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
          <Metric 
            icon={UserCog} 
            label="Instructors" 
            value={stats.instructors} 
            onClick={() => user.role === 'admin' && setActiveView('admin')}
          />
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

export default Dashboard;
