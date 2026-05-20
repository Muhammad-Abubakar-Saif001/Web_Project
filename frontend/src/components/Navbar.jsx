import React, { useState } from 'react';
import { BookOpen, LayoutDashboard, LibraryBig, GraduationCap, Users, ShieldCheck, LockKeyhole, LogOut } from 'lucide-react';

export function Navbar({ activeView, setActiveView, role, theme, toggleTheme, user, onLogout, onChangePassword }) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const items = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'marketplace', label: role === 'student' ? 'Marketplace' : 'Courses', icon: LibraryBig },
    { id: 'instructors', label: 'Instructors', icon: UserCog },
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

export default Navbar;
