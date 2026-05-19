import React from 'react';
import { Search, ChevronLeft, ChevronRight, Star, Users, Clock3, CheckCircle2, Edit3, Trash2 } from 'lucide-react';

export function EventList({
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
  Select
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

export function CourseCard({ user, course, onEnroll, onEdit, onDelete, onDecision }) {
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

export default EventList;
