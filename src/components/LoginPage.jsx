import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage({ onClose }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      onClose?.();
    } catch (err) {
      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-sm mx-4">
        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-[#0f2516] p-8 shadow-2xl">
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/30 hover:text-white/70 transition-colors text-xl"
          >
            ✕
          </button>

          <div className="text-center mb-8">
            <div className="text-4xl mb-3">⚽</div>
            <h2 className="font-display text-3xl text-green-400 tracking-wider">Admin Login</h2>
            <p className="text-white/40 text-sm mt-1">Manage tournament fixtures & scores</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-white/50 text-xs uppercase tracking-wider mb-1.5 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-black/40 border border-white/20 rounded-xl text-white px-4 py-3 focus:outline-none focus:border-green-500 transition-colors"
                placeholder="admin@tournament.com"
              />
            </div>
            <div>
              <label className="text-white/50 text-xs uppercase tracking-wider mb-1.5 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full bg-black/40 border border-white/20 rounded-xl text-white px-4 py-3 focus:outline-none focus:border-green-500 transition-colors"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-900/20 border border-red-500/30 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold rounded-xl py-3 transition-colors mt-2"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
