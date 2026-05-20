import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage({ onClose }) {
  const { login } = useAuth();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e) {
    e.preventDefault(); setError('');
    setLoading(true);
    try { await login(email, password); onClose?.(); }
    catch { setError('Invalid email or password.'); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-sm">
        <div className="rounded-2xl border border-white/10 bg-kz-900 p-7 shadow-2xl">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/25 hover:text-white/60 text-xl transition-colors">✕</button>
          <div className="text-center mb-7">
            <div className="text-4xl mb-2">⚽</div>
            <h2 className="font-display text-3xl text-kz-300 tracking-widest">Admin Login</h2>
            <p className="text-white/35 text-sm mt-1">Kickerz Cup 2026</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-white/40 text-xs uppercase tracking-wider mb-1.5 block">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full bg-black/40 border border-white/15 rounded-xl text-white px-4 py-3 focus:outline-none focus:border-kz transition-colors"
                placeholder="admin@kickerz.com" />
            </div>
            <div>
              <label className="text-white/40 text-xs uppercase tracking-wider mb-1.5 block">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                className="w-full bg-black/40 border border-white/15 rounded-xl text-white px-4 py-3 focus:outline-none focus:border-kz transition-colors"
                placeholder="••••••••" />
            </div>
            {error && <p className="text-red-400 text-sm bg-red-900/20 border border-red-500/25 rounded-lg px-3 py-2">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full bg-kz hover:bg-kz-400 disabled:opacity-50 text-white font-semibold rounded-xl py-3 transition-colors mt-1">
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}