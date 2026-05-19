import React from 'react';

export function UserList({ enrollments }) {
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

export default UserList;
