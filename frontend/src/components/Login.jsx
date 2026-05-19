import React, { useState } from 'react';
import { BookOpen, LockKeyhole } from 'lucide-react';

export function AuthScreen({ loading, onSubmit, initialMode = 'login', Field, Footer }) {
  const [mode, setMode] = useState(initialMode);
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
      <div className="full" style={{ marginTop: '40px' }}>
        <Footer />
      </div>
    </main>
  );
}

export default AuthScreen;
