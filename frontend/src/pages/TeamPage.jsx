import { useState } from 'react';
import { useUsers, useTasks } from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

const AC = ['#1a3a8c','#0f2d1c','#1f0d2d','#2d1f0a','#0d2020'];
const AT = ['#a8c4ff','#22c55e','#a855f7','#f59e0b','#14b8a6'];
function ava(id) { const i = id ? id.charCodeAt(0) % 5 : 0; return [AC[i], AT[i]]; }
function initials(name) { return name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'; }

export default function TeamPage() {
  const { user: me } = useAuth();
  const { data, loading, refetch } = useUsers();
  const { data: tasksData } = useTasks({});
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'MEMBER' });

  const users = data?.users || [];
  const allTasks = tasksData?.tasks || [];

  const taskCountFor = (uid) => allTasks.filter(t => t.assignee?.id === uid && t.status !== 'DONE').length;
  const doneCountFor = (uid) => allTasks.filter(t => t.assignee?.id === uid && t.status === 'DONE').length;

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email || !form.password) { setError('All fields required'); return; }
    setSaving(true); setError('');
    try {
      await api.post('/users', form);
      setShowModal(false);
      setForm({ name: '', email: '', password: '', role: 'MEMBER' });
      refetch();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add member');
    } finally { setSaving(false); }
  };

  const handleRoleChange = async (uid, role) => {
    try {
      await api.patch(`/users/${uid}`, { role });
      refetch();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (uid, name) => {
    if (!confirm(`Remove ${name} from the team? This cannot be undone.`)) return;
    try {
      await api.delete(`/users/${uid}`);
      refetch();
    } catch (err) { alert(err.response?.data?.error || 'Failed to remove user'); }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-.5px' }}>Team Members</div>
        <button className="btn btn-primary" onClick={() => { setError(''); setShowModal(true); }}>+ Add Member</button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        <div className="card">
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>Total Members</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>{users.length}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>Admins</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4, color: 'var(--purple)' }}>{users.filter(u => u.role === 'ADMIN').length}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>Members</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4, color: 'var(--blue)' }}>{users.filter(u => u.role === 'MEMBER').length}</div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><div className="spinner" /></div>
        ) : (
          <table className="table">
            <thead>
              <tr><th>Member</th><th>Role</th><th>Open Tasks</th><th>Completed</th><th>Joined</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {users.map(u => {
                const [bg, tc] = ava(u.id);
                const open = taskCountFor(u.id);
                const done = doneCountFor(u.id);
                const isMe = u.id === me.id;
                return (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar" style={{ width: 34, height: 34, fontSize: 12, background: bg, color: tc }}>
                          {initials(u.name)}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{u.name} {isMe && <span style={{ fontSize: 10, color: 'var(--text3)' }}>(you)</span>}</div>
                          <div style={{ fontSize: 11, color: 'var(--text3)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {isMe ? (
                        <span className={`tag ${u.role === 'ADMIN' ? 'tag-purple' : 'tag-blue'}`}>{u.role}</span>
                      ) : (
                        <select
                          className="form-input"
                          style={{ width: 'auto', padding: '4px 8px', fontSize: 12 }}
                          value={u.role}
                          onChange={e => handleRoleChange(u.id, e.target.value)}
                        >
                          <option value="MEMBER">MEMBER</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: 13, fontWeight: open > 0 ? 600 : 400, color: open > 0 ? 'var(--amber)' : 'var(--text3)' }}>
                        {open}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: 13, color: 'var(--green)' }}>{done}</span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text3)' }}>
                      {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td>
                      {!isMe && (
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u.id, u.name)}>Remove</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Member Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 16, padding: 24, width: 440 }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Add Team Member</div>
            {error && <div style={{ background: 'var(--red-bg)', color: 'var(--red)', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{error}</div>}
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Jane Smith" autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input className="form-input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="jane@company.com" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Temporary Password *</label>
                  <input className="form-input" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 6 chars" />
                </div>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="form-input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                    <option value="MEMBER">Member</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Adding…' : 'Add Member'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
