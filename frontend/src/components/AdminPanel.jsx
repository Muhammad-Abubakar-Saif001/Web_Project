import React, { useState, useMemo } from 'react';
import { Plus, UserCog, Filter, Users, ClipboardCheck, LibraryBig, Edit3, Search, ChevronLeft, ChevronRight, Mail, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import { PanelHeader } from './UI';
import UserForm from './UserForm';

const USER_PAGE_SIZE = 5;

export function AdminPanel({ users, courses, instructors, pendingEnrollments, createInstructor, cycleUserStatus, onDecision, onEnrollmentDecision, onNewCourse, onEdit, Field }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [userPage, setUserPage] = useState(1);
  const [expandedInstructor, setExpandedInstructor] = useState(null);

  const pending = courses.filter((course) => course.status === 'Pending');

  const filteredUsers = useMemo(() => {
    setUserPage(1); // Reset page on filter change
    return users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || user.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'All' || user.role.toLowerCase() === roleFilter.toLowerCase();
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  const totalUserPages = Math.ceil(filteredUsers.length / USER_PAGE_SIZE);
  const paginatedUsers = filteredUsers.slice((userPage - 1) * USER_PAGE_SIZE, userPage * USER_PAGE_SIZE);

  const openGmail = (email) => {
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${email}`, '_blank');
  };

  const toggleInstructor = (id) => {
    setExpandedInstructor(expandedInstructor === id ? null : id);
  };

  const getInstructorCourses = (instructorId) => {
    return courses.filter(c => c.instructorId === instructorId || c.instructor === instructors.find(i => i.id === instructorId)?.name);
  };

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
        {/* Left Column: User Management (Wider) */}
        <div className="view-stack">
          <section className="panel">
            <PanelHeader icon={Users} title="User Management" />
            <div className="toolbar" style={{ gridTemplateColumns: 'minmax(200px, 1fr) auto', marginBottom: '16px', padding: '10px' }}>
              <div className="search-box">
                <Search size={16} style={{ color: 'var(--muted)' }} />
                <input 
                  type="text" 
                  placeholder="Search users..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="select-control">
                <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                  <option value="All">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="instructor">Instructor</option>
                  <option value="student">Student</option>
                </select>
              </div>
            </div>
            <div className="table">
              <div className="table-row table-head">
                <span>Name</span>
                <span>Email</span>
                <span>Role</span>
                <span>Status</span>
                <span>Action</span>
              </div>
              {paginatedUsers.map((item) => (
                <div key={item.id} className="table-row">
                  <span>{item.name}</span>
                  <span 
                    onClick={(e) => { e.stopPropagation(); openGmail(item.email); }} 
                    style={{ cursor: 'pointer', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}
                    title="Send email via Gmail"
                  >
                    <Mail size={14} />
                    {item.email}
                  </span>
                  <span className="capitalize">{item.role}</span>
                  <span className={`pill ${item.status.toLowerCase()}`}>{item.status}</span>
                  <button className="text-btn" onClick={() => cycleUserStatus(item.id)}>Change</button>
                </div>
              ))}
              {!paginatedUsers.length && <p className="muted" style={{ padding: '16px 0', textAlign: 'center' }}>No users found.</p>}
            </div>
            {totalUserPages > 1 && (
              <div className="pagination" style={{ marginTop: '20px' }}>
                <button 
                  className="icon-btn" 
                  onClick={() => setUserPage(p => Math.max(1, p - 1))}
                  disabled={userPage === 1}
                >
                  <ChevronLeft size={18} />
                </button>
                <span style={{ margin: '0 16px', fontWeight: 'bold' }}>Page {userPage} of {totalUserPages}</span>
                <button 
                  className="icon-btn" 
                  onClick={() => setUserPage(p => Math.min(totalUserPages, p + 1))}
                  disabled={userPage === totalUserPages}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Everything Else */}
        <div className="view-stack">
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
            <PanelHeader icon={UserCog} title="Add Instructor" />
            <UserForm onSubmit={createInstructor} Field={Field} />
          </section>

          <section className="panel">
            <PanelHeader icon={ClipboardCheck} title="Instructors" />
            <div className="status-list">
              {instructors.map((item) => (
                <div key={item.id} style={{ display: 'grid', gap: '8px' }}>
                  <div 
                    className="status-row" 
                    style={{ gridTemplateColumns: 'auto 1fr auto auto', cursor: 'pointer' }}
                    onClick={() => toggleInstructor(item.id)}
                  >
                    <span className="status-dot published" />
                    <div>
                      <span style={{ display: 'block', fontWeight: 'bold' }}>{item.name}</span>
                      <span 
                        onClick={(e) => { e.stopPropagation(); openGmail(item.email); }} 
                        style={{ cursor: 'pointer', color: 'var(--primary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Mail size={12} />
                        {item.email}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right', marginRight: '10px' }}>
                      <strong style={{ display: 'block' }}>{item.status}</strong>
                      <small style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)' }}>Joined: {item.joined}</small>
                    </div>
                    {expandedInstructor === item.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                  
                  {expandedInstructor === item.id && (
                    <div style={{ padding: '0 10px 10px 30px', borderLeft: '2px solid var(--line)', marginLeft: '4px' }}>
                      <p style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: 'var(--muted)' }}>Courses Teaching:</p>
                      {getInstructorCourses(item.id).length > 0 ? (
                        <div style={{ display: 'grid', gap: '6px' }}>
                          {getInstructorCourses(item.id).map(course => (
                            <div key={course.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                              <BookOpen size={14} style={{ color: 'var(--primary)' }} />
                              <span>{course.title}</span>
                              <span className={`pill ${course.status.toLowerCase()}`} style={{ fontSize: '0.7rem', minHeight: '18px' }}>{course.status}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>No courses assigned yet.</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {!instructors.length && <p className="muted">No instructors yet.</p>}
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
      </div>
    </section>
  );
}

export default AdminPanel;
