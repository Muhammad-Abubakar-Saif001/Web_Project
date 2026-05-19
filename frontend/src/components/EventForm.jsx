import React, { useState } from 'react';
import { X } from 'lucide-react';

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

export function EventForm({ user, course, instructors, onClose, onSave, Field, Select }) {
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

export default EventForm;
