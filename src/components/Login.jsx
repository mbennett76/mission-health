import { useState } from 'react';
import { useAuth } from '../auth.jsx';

export function Login() {
  const { signIn, resetMyPassword, problem, signOut, user } = useAuth();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  if (user && problem) return (
    <div className="login"><div className="card"><h1>Mission Health</h1><p>{problem}</p><button className="btn" onClick={signOut}>Sign out</button></div></div>
  );

  async function go(e) {
    e.preventDefault(); setBusy(true); setMsg('');
    try { await signIn(email, pw); }
    catch (err) { setMsg(err.code === 'auth/too-many-requests' ? 'Too many tries — wait a few minutes.' : 'That email or password didn\'t work.'); }
    setBusy(false);
  }
  return (
    <div className="login">
      <form className="card" onSubmit={go}>
        <img src={import.meta.env.BASE_URL + 'icon.svg'} alt="" width="56" height="56" />
        <h1>Mission Health</h1>
        <label className="field"><span>Email</span><input type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required /></label>
        <label className="field"><span>Password</span><input type="password" autoComplete="current-password" value={pw} onChange={e => setPw(e.target.value)} required /></label>
        <button className="btn" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        <button type="button" className="link small" onClick={async () => {
          if (!email) return setMsg('Type your email above first.');
          try { await resetMyPassword(email); setMsg('Check your email (and junk folder) for a reset link.'); } catch { setMsg('Could not send a reset email to that address.'); }
        }}>Forgot password?</button>
        {msg && <p className="small">{msg}</p>}
        <p className="small muted">You stay signed in on this device until you sign out.</p>
      </form>
    </div>
  );
}

export function ChangePassword() {
  const { changePassword, signOut } = useAuth();
  const [a, setA] = useState(''); const [b, setB] = useState(''); const [msg, setMsg] = useState('');
  async function go(e) {
    e.preventDefault();
    if (a.length < 8) return setMsg('Use at least 8 characters.');
    if (a !== b) return setMsg('The two passwords don\'t match.');
    try { await changePassword(a); } catch (err) { setMsg(err.code === 'auth/requires-recent-login' ? 'Please sign out and sign in again, then change it.' : 'Could not change the password.'); }
  }
  return (
    <div className="login">
      <form className="card" onSubmit={go}>
        <h1>Choose your password</h1>
        <p className="small muted">Replace the temporary password with one only you know.</p>
        <label className="field"><span>New password</span><input type="password" autoComplete="new-password" value={a} onChange={e => setA(e.target.value)} /></label>
        <label className="field"><span>Type it again</span><input type="password" autoComplete="new-password" value={b} onChange={e => setB(e.target.value)} /></label>
        <button className="btn">Save password</button>
        {msg && <p className="small">{msg}</p>}
        <button type="button" className="link small" onClick={signOut}>Sign out</button>
      </form>
    </div>
  );
}
