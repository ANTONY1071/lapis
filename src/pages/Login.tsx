import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';

const ADMIN_EMAIL = 'antonynitheen@gmail.com';
const ADMIN_PASSWORD = '11112007NOVEMBER1071';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Admin hardcoded check
    if (email === ADMIN_EMAIL && password !== ADMIN_PASSWORD) {
      setError('Invalid admin password.');
      setLoading(false);
      return;
    }

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (email === ADMIN_EMAIL) {
      localStorage.setItem('lapis_role', 'admin');
      navigate('/admin');
    } else {
      const { data: userRecord } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single();

      const role = userRecord?.role || 'customer';
      localStorage.setItem('lapis_role', role);

      if (role === 'shopkeeper') navigate('/shopkeeper/dashboard');
      else navigate('/customer/dashboard');
    }

    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      {/* Logo */}
      <div className="mb-10 text-center">
        <h1 className="text-6xl font-bold tracking-tight text-white">Lapis</h1>
        <p className="text-white/40 text-sm mt-2 tracking-widest uppercase">Order Management Platform</p>
      </div>

      {/* Card */}
      <div className="card w-full max-w-sm p-8">
        <h2 className="text-xl font-semibold mb-6">Sign in to your account</h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 mb-5">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider mb-1.5 block">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider mb-1.5 block">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="flex justify-between mt-5 text-sm text-white/50">
          <Link to="/register" className="hover:text-white transition-colors">
            Create account
          </Link>
          <button
            type="button"
            onClick={async () => {
              if (!email) { setError('Enter your email first.'); return; }
              const { error } = await supabase.auth.resetPasswordForEmail(email);
              if (error) setError(error.message);
              else setError('Password reset email sent!');
            }}
            className="hover:text-white transition-colors"
          >
            Forgot password?
          </button>
        </div>
      </div>
    </div>
  );
}
