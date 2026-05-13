import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProject, useUsers } from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { format, parseISO, isPast } from 'date-fns';

const STATUSES = [
  { key: 'TODO', label: 'To Do', color: '#8fa3c8' },
  { key: 'IN_PROGRESS', label: 'In Progress', color: '#4a7cf7' },
  { key: 'REVIEW', label: 'Review', color: '#f59e0b' },
  { key: 'DONE', label: 'Done', color: '#22c55e' },
];

function priorityColor(p) {
  return { HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#22c55e' }[p] || '#8fa3c8';
}

function initials(name) {
  return name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
}

const AC = ['#1a3a8c','#0f2d1c','#1f0d2d','#2d1f0a'];
const AT = ['#a8c4ff','#22c55e','#a855f7','#f59e0b'];
function ava(id) { const i = id ? id.charCodeAt(0) % 4 : 0; return [AC[i], AT[i]]; }

function TaskCard({ task, onClick }) {
  const overdue = task.dueDate && task.status !== 'DONE' && isPast(parseISO(task.dueDate));
  const [bg, tc] = task.assignee ? ava(task.assignee.id) : ['var(--bg4)', 'var(--text3)'];
  return (
    <div onClick={onClick} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: 12, marginBottom: 8, cursor: 'pointer', transition: 'border-color .15s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border2)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8, lineHeight: 1.3 }}>{task.title}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: priorityColor(task.priority), display: 'inline-block', flexShrink: 0 }} />
        <span style={{ fontSize: 11, color: 'var(--text3)' }}>{task.priority}</span>
        {task.dueDate && (
          <span style={{ fontSize: 11, color: overdue ? 'var(--red)' : 'var(--text3)' }}>
            {format(parseISO(task.dueDate), 'MMM d')}
          </span>
        )}
        {task.assignee && (
          <div className="avatar" style={{ width: 20, height: 20, fontSize: 9, fontWeight: 600, background: bg, color: tc, marginLeft: 'auto', flexShrink: 0 }}>
            {initials(task.assignee.name)}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();
  const { data, loading, refetch } = useProject(id);
  const { data: usersData } = useUsers();

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const today = new Date().toISOString().split('T')[0];
  const [taskForm, setTaskForm] = useState({ title: '', description: '', assigneeId: '', status: 'TODO', priority: 'MEDIUM', dueDate: today });

  const project = data?.project;
  const tasks = project?.tasks || [];
  const users = usersData?.users || [];

  const openTaskModal = () => {
    setTaskForm({ title: '', description: '', assigneeId: user.id, status: 'TODO', priority: 'MEDIUM', dueDate: today });
    setError('');
    setShowTaskModal(true);
  };

  const createTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) { setError('Title required'); return; }
    setSaving(true); setError('');
    try {
      await api.post('/tasks', { ...taskForm, projectId: id, dueDate: taskForm.dueDate || undefined });
      setShowTaskModal(false);
      refetch();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create task');
    } finally { setSaving(false); }
  };

  const updateTask = async (field, value) => {
    try {
      await api.patch(`/tasks/${selectedTask.id}`, { [field]: value });
      setSelectedTask(t => ({ ...t, [field]: value }));
      refetch();
    } catch (err) { console.error(err); }
  };

  const deleteTask = async () => {
    if (!confirm('Delete this task?')) return;
    await api.delete(`/tasks/${selectedTask.id}`);
    setSelectedTask(null);
    refetch();
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><div className="spinner" /></div>;
  if (!project) return <div style={{ textAlign: 'center', padding: 48, color: 'var(--text3)' }}>Project not found.</div>;

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text3)', marginBottom: 16 }}>
        <span style={{ cursor: 'pointer', color: 'var(--text2)' }} onClick={() => navigate('/projects')}>Projects</span>
        <span>›</span>
        <span>{project.name}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: project.color }} />
            <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-.5px' }}>{project.name}</div>
            <span className={`tag ${project.status === 'ACTIVE' ? 'tag-green' : project.status === 'ON_HOLD' ? 'tag-amber' : 'tag-blue'}`}>
              {project.status?.replace('_', ' ')}
            </span>
          </div>
          {project.description && <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>{project.description}</div>}
        </div>
        <button className="btn btn-primary" onClick={openTaskModal}>+ Add Task</button>
      </div>

      {/* Kanban */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 280px)', gap: 16, overflowX: 'auto', paddingBottom: 8 }}>
        {STATUSES.map(s => {
          const col = tasks.filter(t => t.status === s.key);
          return (
            <div key={s.key} style={{ background: 'var(--bg3)', borderRadius: 12, padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5, color: s.color }}>{s.label}</span>
                <span style={{ background: 'var(--bg4)', borderRadius: 10, fontSize: 11, padding: '2px 8px', color: 'var(--text2)' }}>{col.length}</span>
              </div>
              {col.map(t => (
                <TaskCard key={t.id} task={t} onClick={() => setSelectedTask(t)} />
              ))}
              {col.length === 0 && (
                <div style={{ textAlign: 'center', padding: 20, color: 'var(--text3)', fontSize: 12 }}>No tasks</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Create Task Modal */}
      {showTaskModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={e => e.target === e.currentTarget && setShowTaskModal(false)}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 16, padding: 24, width: 480 }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Add Task to {project.name}</div>
            {error && <div style={{ background: 'var(--red-bg)', color: 'var(--red)', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{error}</div>}
            <form onSubmit={createTask}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-input" value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} placeholder="What needs to be done?" autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" rows={2} value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} placeholder="More details..." />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Assignee</label>
                  <select className="form-input" value={taskForm.assigneeId} onChange={e => setTaskForm(f => ({ ...f, assigneeId: e.target.value }))}>
                    <option value="">Unassigned</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input className="form-input" type="date" value={taskForm.dueDate} onChange={e => setTaskForm(f => ({ ...f, dueDate: e.target.value }))} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-input" value={taskForm.status} onChange={e => setTaskForm(f => ({ ...f, status: e.target.value }))}>
                    {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-input" value={taskForm.priority} onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value }))}>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowTaskModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating…' : 'Create Task'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={e => e.target === e.currentTarget && setSelectedTask(null)}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 16, padding: 24, width: 480 }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{selectedTask.title}</div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}>{selectedTask.description || 'No description.'}</div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-input" defaultValue={selectedTask.status} onChange={e => updateTask('status', e.target.value)}>
                  {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-input" defaultValue={selectedTask.priority} onChange={e => updateTask('priority', e.target.value)}>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Assignee</label>
                <select className="form-input" defaultValue={selectedTask.assignee?.id || ''} onChange={e => updateTask('assigneeId', e.target.value || null)}>
                  <option value="">Unassigned</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input className="form-input" type="date" defaultValue={selectedTask.dueDate ? selectedTask.dueDate.split('T')[0] : ''} onChange={e => updateTask('dueDate', e.target.value || null)} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', marginTop: 8 }}>
              <button className="btn btn-danger btn-sm" onClick={deleteTask}>Delete Task</button>
              <button className="btn btn-ghost" onClick={() => setSelectedTask(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
