import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const [tab, setTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({ name: '', email: '', password: '', role: 'MEMBER' });

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(loginForm.email, loginForm.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await signup(signupForm);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed');
    } finally { setLoading(false); }
  };

  const quickLogin = (email, password) => {
    setLoginForm({ email, password });
    setTab('login');
    setTimeout(() => {
      setError(''); setLoading(true);
      login(email, password).then(() => navigate('/')).catch(e => setError(e.response?.data?.error || 'Login failed')).finally(() => setLoading(false));
    }, 100);
  };

  const s = {
    wrap: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' },
    card: { background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 20, padding: 36, width: 400 },
    tabs: { display: 'flex', background: 'var(--bg3)', borderRadius: 10, padding: 4, marginBottom: 24 },
    tab: (active) => ({ flex: 1, padding: '8px', borderRadius: 7, fontSize: 13, fontWeight: 500, cursor: 'pointer', textAlign: 'center', color: active ? 'var(--text)' : 'var(--text3)', background: active ? 'var(--bg2)' : 'none', border: 'none', transition: 'all .15s' }),
    demoBtn: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg3)', borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer', marginBottom: 8, width: '100%', color: 'var(--text)', transition: 'all .15s' },
    sep: { display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0', color: 'var(--text3)', fontSize: 12 },
  };

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 48, height: 48, background: 'var(--blue)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, margin: '0 auto 12px' }}>⬡</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>TeamFlow</div>
          <div style={{ fontSize: 14, color: 'var(--text3)', marginTop: 4 }}>Project & Task Management</div>
        </div>

        <div style={s.tabs}>
          <button style={s.tab(tab === 'login')} onClick={() => { setTab('login'); setError(''); }}>Sign In</button>
          <button style={s.tab(tab === 'signup')} onClick={() => { setTab('signup'); setError(''); }}>Sign Up</button>
        </div>

        {error && <div style={{ background: 'var(--red-bg)', border: '1px solid #3d1515', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: 'var(--red)', marginBottom: 16 }}>{error}</div>}

        {tab === 'login' ? (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={loginForm.email} onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))} placeholder="you@company.com" required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" value={loginForm.password} onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" required />
            </div>
            <button className="btn btn-primary" style={{ width: '100%', padding: 12, fontSize: 14, borderRadius: 10, marginTop: 8 }} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>

            <div style={s.sep}><span style={{ flex: 1, height: 1, background: 'var(--border)' }} /><span>or use a demo account</span><span style={{ flex: 1, height: 1, background: 'var(--border)' }} /></div>

            {[
              { name: 'Sarah Chen', email: 'admin@teamflow.dev', pass: 'Admin123', role: 'Admin', tagClass: 'tag-purple' },
              { name: 'Arjun Mehta', email: 'dev@teamflow.dev', pass: 'Member123', role: 'Member', tagClass: 'tag-blue' },
              { name: 'Priya Nair', email: 'design@teamflow.dev', pass: 'Member123', role: 'Member', tagClass: 'tag-blue' },
            ].map(acc => (
              <button key={acc.email} style={s.demoBtn} type="button" onClick={() => quickLogin(acc.email, acc.pass)}>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{acc.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{acc.email}</div>
                </div>
                <span className={`tag ${acc.tagClass}`}>{acc.role}</span>
              </button>
            ))}
          </form>
        ) : (
          <form onSubmit={handleSignup}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" value={signupForm.name} onChange={e => setSignupForm(f => ({ ...f, name: e.target.value }))} placeholder="Jane Smith" required />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={signupForm.email} onChange={e => setSignupForm(f => ({ ...f, email: e.target.value }))} placeholder="you@company.com" required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Password</label>
                <input className="form-input" type="password" value={signupForm.password} onChange={e => setSignupForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 6 chars" required />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-input" value={signupForm.role} onChange={e => setSignupForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="MEMBER">Member</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', padding: 12, fontSize: 14, borderRadius: 10, marginTop: 8 }} disabled={loading}>
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
