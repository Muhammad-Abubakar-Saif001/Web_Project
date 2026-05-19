import React, { useState } from 'react';

export function UserForm({ onSubmit, Field }) {
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

export default UserForm;
