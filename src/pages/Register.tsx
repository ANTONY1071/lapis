import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';

type Role = 'customer' | 'shopkeeper';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('shopkeeper');
  const [shopName, setShopName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const generateShopId = async (): Promise<string> => {
    const { data } = await supabase
      .from('shopkeepers')
      .select('shop_id')
      .order('shop_id', { ascending: false })
      .limit(1)
      .single();

    if (!data?.shop_id) return 'S001';
    const num = parseInt(data.shop_id.replace('S', ''), 10);
    return `S${String(num + 1).padStart(3, '0')}`;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError || !authData.user) {
      setError(authError?.message || 'Signup failed.');
      setLoading(false);
      return;
    }

    const userId = authData.user.id;

    const { error: userError } = await supabase.from('users').insert({
      id: userId,
      name,
      email,
      role,
    });

    if (userError) {
      setError(userError.message);
      setLoading(false);
      return;
    }

    const shopId = await generateShopId();
    const { error: shopError } = await supabase.from('shopkeepers').insert({
      user_id: userId,
      shop_id: shopId,
      shop_name: shopName || name + "'s Shop",
      payment_status: false,
    });

    if (shopError) {
      setError(shopError.message);
      setLoading(false);
      return;
    }

    navigate('/');
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <div className="mb-10 text-center">
        <h1 className="text-6xl font-bold tracking-tight text-white">Lapis</h1>
        <p className="text-white/40 text-sm mt-2 tracking-widest uppercase">Create your account</p>
      </div>

      <div className="card w-full max-w-sm p-8">
        <h2 className="text-xl font-semibold mb-6">Register</h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 mb-5">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider mb-1.5 block">Full Name</label>
            <input
              type="text"
              placeholder="Your name"
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
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
              placeholder="Min. 6 characters"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider mb-1.5 block">Shop Name</label>
            <input
              type="text"
              placeholder="Your shop name"
              className="input-field"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-white/50 mt-5">
          Already have an account?{' '}
          <Link to="/" className="text-white hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}