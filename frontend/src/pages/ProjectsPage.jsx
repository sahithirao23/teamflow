import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

function ProjectCard({ project, onClick }) {
  const tasks = project.tasks || [];
  const done = tasks.filter(t => t.status === 'DONE').length;
  const pct = tasks.length ? Math.round(done / tasks.length * 100) : 0;
  const members = project.members || [];
  const statusColors = { ACTIVE: 'tag-green', ON_HOLD: 'tag-amber', COMPLETED: 'tag-blue' };
  const COLORS = ['#1a3a8c','#0f2d1c','#1f0d2d','#2d1f0a','#0d2020'];
  const TCOLORS = ['#a8c4ff','#22c55e','#a855f7','#f59e0b','#14b8a6'];

  return (
    <div onClick={onClick} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 18, cursor: 'pointer', transition: 'all .2s' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.background = 'var(--bg3)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg2)'; }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: project.color, flexShrink: 0 }} />
        <div style={{ fontSize: 14, fontWeight: 600 }}>{project.name}</div>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 12, lineHeight: 1.4 }}>{project.description || 'No description'}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: 'var(--text3)' }}>{tasks.length} tasks · {done} done</span>
        <span className={`tag ${statusColors[project.status] || 'tag-gray'}`} style={{ fontSize: 10 }}>{project.status?.replace('_', ' ')}</span>
      </div>
      <div style={{ height: 4, background: 'var(--bg4)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: project.color, borderRadius: 2 }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
        <div style={{ display: 'flex' }}>
          {members.slice(0, 4).map((m, i) => (
            <div key={m.userId} className="avatar" style={{ width: 22, height: 22, fontSize: 9, fontWeight: 600, background: COLORS[i % COLORS.length], color: TCOLORS[i % TCOLORS.length], border: '2px solid var(--bg2)', marginLeft: i > 0 ? -6 : 0 }}>
              {m.user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2)}
            </div>
          ))}
        </div>
        <span style={{ fontSize: 11, color: 'var(--text3)' }}>{pct}% complete</span>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const { data, loading, refetch } = useProjects();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', description: '', color: '#4a7cf7', status: 'ACTIVE' });

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Project name is required'); return; }
    setSaving(true); setError('');
    try {
      await api.post('/projects', form);
      setShowModal(false);
      setForm({ name: '', description: '', color: '#4a7cf7', status: 'ACTIVE' });
      refetch();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create project');
    } finally { setSaving(false); }
  };

  const projects = data?.projects || [];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-.5px' }}>Projects</div>
        {isAdmin && <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Project</button>}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><div className="spinner" /></div>
      ) : projects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 64, color: 'var(--text3)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>▦</div>
          <div style={{ fontSize: 14, marginBottom: 16 }}>No projects yet.</div>
          {isAdmin && <button className="btn btn-primary" onClick={() => setShowModal(true)}>Create your first project</button>}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {projects.map(p => (
            <ProjectCard key={p.id} project={p} onClick={() => navigate(`/projects/${p.id}`)} />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 16, padding: 24, width: 480 }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Create Project</div>
            {error && <div style={{ background: 'var(--red-bg)', color: 'var(--red)', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{error}</div>}
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Project Name *</label>
                <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Mobile App Redesign" />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What is this project about?" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    <option value="ACTIVE">Active</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Color</label>
                  <select className="form-input" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))}>
                    <option value="#4a7cf7">Blue</option>
                    <option value="#22c55e">Green</option>
                    <option value="#a855f7">Purple</option>
                    <option value="#f59e0b">Amber</option>
                    <option value="#14b8a6">Teal</option>
                    <option value="#ef4444">Red</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating…' : 'Create Project'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
