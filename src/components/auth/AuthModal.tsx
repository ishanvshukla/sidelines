import { useState, type FormEvent } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  onClose(): void;
}

type Tab = 'login' | 'register';

export default function AuthModal({ onClose }: Props) {
  const { login, register } = useAuth();
  const [tab, setTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function switchTab(t: Tab) {
    setTab(t);
    setError('');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (tab === 'login') {
        await login(email, password);
      } else {
        await register(email, password);
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm mx-4 bg-espn-card border border-espn-border rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6">
          <div className="flex items-center gap-2">
            <span className="font-display font-black italic text-lg text-white tracking-wide uppercase">
              Side<span className="text-gold">lines</span>
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-white transition-colors w-7 h-7 flex items-center justify-center text-lg leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex mt-5 border-b border-espn-border">
          {(['login', 'register'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => switchTab(t)}
              className={`flex-1 py-3 font-oswald uppercase tracking-wider text-sm transition-colors ${
                tab === t
                  ? 'text-gold border-b-2 border-gold'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {t === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-oswald text-xs uppercase tracking-wider text-gray-500">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="bg-espn-dark border border-espn-border rounded-lg px-4 py-2.5 text-white text-sm font-inter placeholder:text-gray-700 focus:outline-none focus:border-gold transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-oswald text-xs uppercase tracking-wider text-gray-500">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
              placeholder={tab === 'register' ? 'At least 8 characters' : '••••••••'}
              className="bg-espn-dark border border-espn-border rounded-lg px-4 py-2.5 text-white text-sm font-inter placeholder:text-gray-700 focus:outline-none focus:border-gold transition-colors"
            />
          </div>

          {error && (
            <p className="text-red-400 text-xs font-inter text-center bg-red-400/10 rounded-lg py-2 px-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 py-3 rounded-lg font-oswald uppercase tracking-widest text-sm bg-gold text-black hover:bg-gold-bright transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Please wait…' : tab === 'login' ? 'Sign In' : 'Create Account'}
          </button>

          <p className="text-center text-xs text-gray-600 font-inter">
            {tab === 'login' ? (
              <>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchTab('register')}
                  className="text-gold hover:text-gold-bright transition-colors"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchTab('login')}
                  className="text-gold hover:text-gold-bright transition-colors"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </form>
      </div>
    </div>
  );
}
