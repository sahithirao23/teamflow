import { useTaskStats, useActivity, useTasks } from '../hooks/useFetch';
import { useProjects } from '../hooks/useFetch';
import { format, isPast, parseISO } from 'date-fns';

function StatCard({ label, value, color }) {
  return (
    <div className="card">
      <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: -1, marginTop: 4, color: color || 'var(--text)' }}>{value ?? '—'}</div>
    </div>
  );
}

function priorityColor(p) {
  return { HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#22c55e' }[p] || '#8fa3c8';
}

export default function DashboardPage() {
  const { data: statsData, loading: statsLoading } = useTaskStats();
  const { data: activityData } = useActivity();
  const { data: tasksData } = useTasks({ overdue: true });
  const { data: projectsData } = useProjects();

  const stats = statsData?.stats;
  const activities = activityData?.activities || [];
  const overdue = tasksData?.tasks || [];
  const projects = projectsData?.projects || [];

  const statusBars = [
    { label: 'To Do', key: 'todo', color: '#8fa3c8' },
    { label: 'In Progress', key: 'inProgress', color: '#4a7cf7' },
    { label: 'Review', key: 'review', color: '#f59e0b' },
    { label: 'Done', key: 'done', color: '#22c55e' },
  ];
  const maxBar = stats ? Math.max(stats.todo, stats.inProgress, stats.review, stats.done, 1) : 1;

  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-.5px', marginBottom: 20 }}>Dashboard</div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <StatCard label="Total Projects" value={projects.length} />
        <StatCard label="Open Tasks" value={stats ? stats.total - stats.done : null} color="var(--blue)" />
        <StatCard label="Completed" value={stats?.done} color="var(--green)" />
        <StatCard label="Overdue" value={stats?.overdue} color="var(--red)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Status Chart */}
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 16 }}>Task Status Overview</div>
          {statsLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><div className="spinner" /></div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 80 }}>
                {statusBars.map(b => (
                  <div key={b.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{ width: '100%', background: b.color, borderRadius: '4px 4px 0 0', height: `${Math.max(8, ((stats?.[b.key] || 0) / maxBar) * 72)}px`, transition: 'height .3s' }} title={`${b.label}: ${stats?.[b.key] || 0}`} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
                {statusBars.map(b => (
                  <span key={b.key} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text3)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: b.color, display: 'inline-block' }} />
                    {b.label}: {stats?.[b.key] || 0}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Activity Feed */}
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 12 }}>Recent Activity</div>
          {activities.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text3)', fontSize: 13 }}>No activity yet</div>
          ) : (
            activities.slice(0, 6).map((a, i) => (
              <div key={a.id || i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 0', borderBottom: i < 5 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: a.project?.color || 'var(--blue)', marginTop: 5, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13, lineHeight: 1.4 }}>{a.text}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                    {format(new Date(a.createdAt), 'MMM d, h:mm a')}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Project Progress */}
      {projects.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 14 }}>Project Progress</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '12px 24px' }}>
            {projects.map(p => {
              const tasks = p.tasks || [];
              const done = tasks.filter(t => t.status === 'DONE').length;
              const pct = tasks.length ? Math.round(done / tasks.length * 100) : 0;
              return (
                <div key={p.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
                      {p.name}
                    </span>
                    <span style={{ color: 'var(--text3)' }}>{pct}%</span>
                  </div>
                  <div style={{ height: 4, background: 'var(--bg4)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: p.color, borderRadius: 2, transition: 'width .3s' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Overdue Tasks */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: 600 }}>Overdue Tasks</div>
        <table className="table">
          <thead>
            <tr><th>Task</th><th>Project</th><th>Assignee</th><th>Due Date</th><th>Priority</th></tr>
          </thead>
          <tbody>
            {overdue.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text3)', padding: 24 }}>No overdue tasks 🎉</td></tr>
            ) : overdue.map(t => (
              <tr key={t.id}>
                <td style={{ fontWeight: 500 }}>{t.title}</td>
                <td><span style={{ fontSize: 12, color: 'var(--text3)' }}>{t.project?.name}</span></td>
                <td style={{ fontSize: 12 }}>{t.assignee?.name || 'Unassigned'}</td>
                <td style={{ color: 'var(--red)', fontSize: 12 }}>{t.dueDate ? format(parseISO(t.dueDate), 'MMM d, yyyy') : '—'}</td>
                <td>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: priorityColor(t.priority), display: 'inline-block' }} />
                    {t.priority}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
