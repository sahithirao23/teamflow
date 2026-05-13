import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

function initials(name) {
  return name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
}

const AVATAR_COLORS = ['#1a3a8c', '#0f2d1c', '#1f0d2d', '#2d1f0a', '#0d2020'];
const AVATAR_TEXT = ['#a8c4ff', '#22c55e', '#a855f7', '#f59e0b', '#14b8a6'];

function userColor(id, arr) {
  const idx = id ? id.charCodeAt(0) % arr.length : 0;
  return arr[idx];
}

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [newTaskOpen, setNewTaskOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItem = ({ isActive }) => ({
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '8px 10px', borderRadius: 8, fontSize: 13,
    color: isActive ? '#a8c4ff' : 'var(--text2)',
    background: isActive ? 'var(--blue3)' : 'transparent',
    border: 'none', width: '100%', textAlign: 'left',
    cursor: 'pointer', transition: 'all .15s', marginBottom: 2,
    textDecoration: 'none',
  });

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* Sidebar */}
      <aside style={{ width: 220, background: 'var(--bg2)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, background: 'var(--blue)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>⬡</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-.3px' }}>TeamFlow</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>Workspace</div>
            </div>
          </div>
        </div>

        <nav style={{ padding: '12px 8px', flex: 1, overflowY: 'auto' }}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text3)', padding: '8px 8px 4px' }}>Main</div>
          <NavLink to="/" end style={navItem}>
            <span style={{ width: 16, textAlign: 'center' }}>◈</span> Dashboard
          </NavLink>
          <NavLink to="/projects" style={navItem}>
            <span style={{ width: 16, textAlign: 'center' }}>▦</span> Projects
          </NavLink>
          <NavLink to="/tasks" style={navItem}>
            <span style={{ width: 16, textAlign: 'center' }}>✓</span> My Tasks
          </NavLink>
          {isAdmin && (
            <>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text3)', padding: '8px 8px 4px', marginTop: 8 }}>Admin</div>
              <NavLink to="/team" style={navItem}>
                <span style={{ width: 16, textAlign: 'center' }}>⬡</span> Team
              </NavLink>
              <NavLink to="/reports" style={navItem}>
                <span style={{ width: 16, textAlign: 'center' }}>◎</span> Reports
              </NavLink>
            </>
          )}
        </nav>

        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="avatar" style={{ width: 32, height: 32, fontSize: 12, background: userColor(user?.id, AVATAR_COLORS), color: userColor(user?.id, AVATAR_TEXT) }}>
              {initials(user?.name)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>{user?.role}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: 56, borderBottom: '1px solid var(--border)', background: 'var(--bg2)', flexShrink: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-.3px' }}>TeamFlow</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/tasks')}>+ New Task</button>
            <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Sign Out</button>
          </div>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
