import { useState } from 'react';
import { useTasks, useProjects, useUsers } from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { format, parseISO, isPast } from 'date-fns';

const STATUSES = [
  { key: 'TODO', label: 'To Do', cls: 'tag-gray' },
  { key: 'IN_PROGRESS', label: 'In Progress', cls: 'tag-blue' },
  { key: 'REVIEW', label: 'Review', cls: 'tag-amber' },
  { key: 'DONE', label: 'Done', cls: 'tag-green' },
];

function priorityColor(p) {
  return { HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#22c55e' }[p] || '#8fa3c8';
}

export default function TasksPage() {
  const { user, isAdmin } = useAuth();
  const [filters, setFilters] = useState({ status: '', priority: '', myTasks: 'true' });
  const [showModal, setShowModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const emptyForm = { title: '', description: '', projectId: '', assigneeId: user.id, status: 'TODO', priority: 'MEDIUM', dueDate: today };
  const [form, setForm] = useState(emptyForm);

  const { data, loading, refetch } = useTasks(filters);
  const { data: projectsData } = useProjects();
  const { data: usersData } = useUsers();

  const tasks = data?.tasks || [];
  const projects = projectsData?.projects || [];
  const users = usersData?.users || [];

  const setFilter = (k, v) => setFilters(f => ({ ...f, [k]: v }));

  const openCreate = () => { setForm(emptyForm); setError(''); setShowModal(true); };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required'); return; }
    if (!form.projectId) { setError('Please select a project'); return; }
    setSaving(true); setError('');
    try {
      await api.post('/tasks', { ...form, dueDate: form.dueDate || undefined });
      setShowModal(false);
      refetch();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create task');
    } finally { setSaving(false); }
  };

  const updateTask = async (id, field, value) => {
    try {
      await api.patch(`/tasks/${id}`, { [field]: value });
      setSelectedTask(t => t ? { ...t, [field]: value } : null);
      refetch();
    } catch (err) { console.error(err); }
  };

  const deleteTask = async (id) => {
    if (!confirm('Delete this task?')) return;
    await api.delete(`/tasks/${id}`);
    setSelectedTask(null);
    refetch();
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-.5px' }}>Tasks</div>
        <button className="btn btn-primary" onClick={openCreate}>+ New Task</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <select className="form-input" style={{ width: 'auto', padding: '6px 10px', fontSize: 12 }} value={filters.myTasks} onChange={e => setFilter('myTasks', e.target.value)}>
          <option value="true">My Tasks</option>
          {isAdmin && <option value="">All Tasks</option>}
        </select>
        <select className="form-input" style={{ width: 'auto', padding: '6px 10px', fontSize: 12 }} value={filters.status} onChange={e => setFilter('status', e.target.value)}>
          <option value="">All Status</option>
          {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        <select className="form-input" style={{ width: 'auto', padding: '6px 10px', fontSize: 12 }} value={filters.priority} onChange={e => setFilter('priority', e.target.value)}>
          <option value="">All Priority</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        <button className="btn btn-ghost btn-sm" onClick={() => setFilters({ status: '', priority: '', myTasks: 'true' })}>Reset</button>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><div className="spinner" /></div>
        ) : tasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--text3)' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
            <div>No tasks match these filters.</div>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Task</th><th>Project</th><th>Status</th><th>Priority</th><th>Due Date</th><th>Assignee</th><th></th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(t => {
                const overdue = t.dueDate && t.status !== 'DONE' && isPast(parseISO(t.dueDate));
                const sc = STATUSES.find(s => s.key === t.status);
                return (
                  <tr key={t.id}>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: 13, cursor: 'pointer', maxWidth: 260 }} onClick={() => setSelectedTask(t)}>{t.title}</div>
                      {t.description && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{t.description.slice(0, 60)}{t.description.length > 60 ? '…' : ''}</div>}
                    </td>
                    <td><span style={{ fontSize: 12, color: 'var(--text3)' }}>{t.project?.name || '—'}</span></td>
                    <td><span className={`tag ${sc?.cls || 'tag-gray'}`}>{sc?.label || t.status}</span></td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: priorityColor(t.priority), display: 'inline-block' }} />
                        {t.priority}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: overdue ? 'var(--red)' : 'var(--text3)' }}>
                      {t.dueDate ? format(parseISO(t.dueDate), 'MMM d, yyyy') : '—'}
                      {overdue && <span style={{ fontSize: 10, marginLeft: 4 }}>Overdue</span>}
                    </td>
                    <td style={{ fontSize: 12 }}>{t.assignee?.name || <span style={{ color: 'var(--text3)' }}>Unassigned</span>}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => setSelectedTask(t)}>Edit</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 16, padding: 24, width: 480, maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Create Task</div>
            {error && <div style={{ background: 'var(--red-bg)', color: 'var(--red)', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{error}</div>}
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="What needs to be done?" autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="More details..." />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Project *</label>
                  <select className="form-input" value={form.projectId} onChange={e => setForm(f => ({ ...f, projectId: e.target.value }))}>
                    <option value="">Select project…</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Assignee</label>
                  <select className="form-input" value={form.assigneeId} onChange={e => setForm(f => ({ ...f, assigneeId: e.target.value }))}>
                    <option value="">Unassigned</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-input" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input className="form-input" type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating…' : 'Create Task'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {selectedTask && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={e => e.target === e.currentTarget && setSelectedTask(null)}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 16, padding: 24, width: 480 }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{selectedTask.title}</div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20, lineHeight: 1.5 }}>{selectedTask.description || 'No description.'}</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 12 }}>Project: <span style={{ color: 'var(--text2)' }}>{selectedTask.project?.name}</span></div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-input" defaultValue={selectedTask.status} onChange={e => updateTask(selectedTask.id, 'status', e.target.value)}>
                  {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-input" defaultValue={selectedTask.priority} onChange={e => updateTask(selectedTask.id, 'priority', e.target.value)}>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Assignee</label>
                <select className="form-input" defaultValue={selectedTask.assignee?.id || ''} onChange={e => updateTask(selectedTask.id, 'assigneeId', e.target.value || null)}>
                  <option value="">Unassigned</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input className="form-input" type="date" defaultValue={selectedTask.dueDate ? selectedTask.dueDate.split('T')[0] : ''} onChange={e => updateTask(selectedTask.id, 'dueDate', e.target.value || null)} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <button className="btn btn-danger btn-sm" onClick={() => deleteTask(selectedTask.id)}>Delete Task</button>
              <button className="btn btn-ghost" onClick={() => setSelectedTask(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
