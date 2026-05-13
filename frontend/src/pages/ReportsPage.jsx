import { useTasks, useProjects, useUsers } from '../hooks/useFetch';
import { format, parseISO, isPast } from 'date-fns';

function priorityColor(p) {
  return { HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#22c55e' }[p] || '#8fa3c8';
}

const STATUS_MAP = { TODO: { label: 'To Do', cls: 'tag-gray' }, IN_PROGRESS: { label: 'In Progress', cls: 'tag-blue' }, REVIEW: { label: 'Review', cls: 'tag-amber' }, DONE: { label: 'Done', cls: 'tag-green' } };

const AC = ['#1a3a8c','#0f2d1c','#1f0d2d','#2d1f0a','#0d2020'];
const AT = ['#a8c4ff','#22c55e','#a855f7','#f59e0b','#14b8a6'];
function ava(id) { const i = id ? id.charCodeAt(0) % 5 : 0; return [AC[i], AT[i]]; }
function initials(name) { return name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'; }

function ProgressBar({ pct, color }) {
  return (
    <div style={{ height: 4, background: 'var(--bg4)', borderRadius: 2, overflow: 'hidden', marginTop: 6 }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color || 'var(--blue)', borderRadius: 2, transition: 'width .4s' }} />
    </div>
  );
}

export default function ReportsPage() {
  const { data: tasksData, loading: tasksLoading } = useTasks({});
  const { data: projectsData } = useProjects();
  const { data: usersData } = useUsers();

  const tasks = tasksData?.tasks || [];
  const projects = projectsData?.projects || [];
  const users = usersData?.users || [];

  // ── Derived stats ──────────────────────────────────────────────
  const total = tasks.length;
  const byStatus = { TODO: 0, IN_PROGRESS: 0, REVIEW: 0, DONE: 0 };
  tasks.forEach(t => { if (byStatus[t.status] !== undefined) byStatus[t.status]++; });

  const overdueTasks = tasks.filter(t => t.dueDate && t.status !== 'DONE' && isPast(parseISO(t.dueDate)));

  const userStats = users.map(u => {
    const myTasks = tasks.filter(t => t.assignee?.id === u.id);
    const done = myTasks.filter(t => t.status === 'DONE').length;
    const open = myTasks.filter(t => t.status !== 'DONE').length;
    const overdue = myTasks.filter(t => t.dueDate && t.status !== 'DONE' && isPast(parseISO(t.dueDate))).length;
    const pct = myTasks.length ? Math.round(done / myTasks.length * 100) : 0;
    return { ...u, myTasks, done, open, overdue, pct };
  }).sort((a, b) => b.myTasks.length - a.myTasks.length);

  const projectStats = projects.map(p => {
    const ptasks = tasks.filter(t => t.project?.id === p.id);
    const done = ptasks.filter(t => t.status === 'DONE').length;
    const pct = ptasks.length ? Math.round(done / ptasks.length * 100) : 0;
    return { ...p, ptasks, done, pct };
  });

  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-.5px', marginBottom: 20 }}>Reports & Analytics</div>

      {/* Top Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Tasks', val: total, color: 'var(--text)' },
          { label: 'In Progress', val: byStatus.IN_PROGRESS, color: 'var(--blue)' },
          { label: 'Completed', val: byStatus.DONE, color: 'var(--green)' },
          { label: 'Overdue', val: overdueTasks.length, color: 'var(--red)' },
        ].map(s => (
          <div key={s.label} className="card">
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -1, marginTop: 4, color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Status Breakdown + Completion Rate */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 16 }}>Status Breakdown</div>
          {Object.entries(byStatus).map(([status, count]) => {
            const s = STATUS_MAP[status];
            const pct = total ? Math.round(count / total * 100) : 0;
            const barColor = { TODO: '#8fa3c8', IN_PROGRESS: '#4a7cf7', REVIEW: '#f59e0b', DONE: '#22c55e' }[status];
            return (
              <div key={status} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: barColor, display: 'inline-block' }} />
                    {s.label}
                  </span>
                  <span style={{ color: 'var(--text3)' }}>{count} ({pct}%)</span>
                </div>
                <ProgressBar pct={pct} color={barColor} />
              </div>
            );
          })}
        </div>

        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 16 }}>Project Progress</div>
          {projectStats.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text3)', fontSize: 13 }}>No projects yet.</div>
          ) : projectStats.map(p => (
            <div key={p.id} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
                  {p.name}
                </span>
                <span style={{ color: 'var(--text3)' }}>{p.done}/{p.ptasks.length} · {p.pct}%</span>
              </div>
              <ProgressBar pct={p.pct} color={p.color} />
            </div>
          ))}
        </div>
      </div>

      {/* Per-member report */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 16 }}>Workload by Member</div>
        {tasksLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><div className="spinner" /></div>
        ) : userStats.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text3)', padding: 24 }}>No data yet.</div>
        ) : (
          <table className="table">
            <thead>
              <tr><th>Member</th><th>Role</th><th>Total</th><th>Open</th><th>Done</th><th>Overdue</th><th>Completion</th></tr>
            </thead>
            <tbody>
              {userStats.map(u => {
                const [bg, tc] = ava(u.id);
                return (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="avatar" style={{ width: 28, height: 28, fontSize: 10, background: bg, color: tc }}>{initials(u.name)}</div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{u.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text3)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className={`tag ${u.role === 'ADMIN' ? 'tag-purple' : 'tag-blue'}`}>{u.role}</span></td>
                    <td style={{ fontSize: 13 }}>{u.myTasks.length}</td>
                    <td style={{ fontSize: 13, color: u.open > 0 ? 'var(--amber)' : 'var(--text3)' }}>{u.open}</td>
                    <td style={{ fontSize: 13, color: 'var(--green)' }}>{u.done}</td>
                    <td style={{ fontSize: 13, color: u.overdue > 0 ? 'var(--red)' : 'var(--text3)' }}>{u.overdue}</td>
                    <td style={{ minWidth: 120 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 4, background: 'var(--bg4)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${u.pct}%`, background: tc, borderRadius: 2 }} />
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--text3)', width: 32, textAlign: 'right' }}>{u.pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Full task report */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: 600 }}>All Tasks — Full Report</div>
        <table className="table">
          <thead>
            <tr><th>Task</th><th>Project</th><th>Assignee</th><th>Status</th><th>Priority</th><th>Due Date</th></tr>
          </thead>
          <tbody>
            {tasks.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text3)', padding: 32 }}>No tasks yet.</td></tr>
            ) : tasks.map(t => {
              const overdue = t.dueDate && t.status !== 'DONE' && isPast(parseISO(t.dueDate));
              const s = STATUS_MAP[t.status] || { label: t.status, cls: 'tag-gray' };
              return (
                <tr key={t.id}>
                  <td style={{ fontWeight: 500, fontSize: 13 }}>{t.title}</td>
                  <td>
                    {t.project && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text3)' }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: t.project.color, display: 'inline-block' }} />
                        {t.project.name}
                      </span>
                    )}
                  </td>
                  <td style={{ fontSize: 12 }}>{t.assignee?.name || <span style={{ color: 'var(--text3)' }}>Unassigned</span>}</td>
                  <td><span className={`tag ${s.cls}`}>{s.label}</span></td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: priorityColor(t.priority), display: 'inline-block' }} />
                      {t.priority}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: overdue ? 'var(--red)' : 'var(--text3)' }}>
                    {t.dueDate ? format(parseISO(t.dueDate), 'MMM d, yyyy') : '—'}
                    {overdue && <span style={{ fontSize: 10, marginLeft: 4, color: 'var(--red)' }}>Overdue</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
