import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

type Shop = {
  id: string;
  shop_id: string;
  shop_name: string;
  payment_status: boolean;
  created_at: string;
  users: { name: string; email: string } | null;
};

export default function AdminDashboard() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const fetchShops = async () => {
    const { data } = await supabase
      .from('shopkeepers')
      .select('*, users(name, email)')
      .order('created_at', { ascending: false });
    setShops((data as Shop[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchShops();
    const channel = supabase
      .channel('admin-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shopkeepers' }, fetchShops)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const toggleStatus = async (id: string, current: boolean) => {
    await supabase.from('shopkeepers').update({ payment_status: !current }).eq('id', id);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('lapis_role');
    navigate('/');
  };

  const filtered = shops.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.shop_id.toLowerCase().includes(q) ||
      s.shop_name.toLowerCase().includes(q) ||
      s.users?.name.toLowerCase().includes(q) ||
      s.users?.email.toLowerCase().includes(q)
    );
  });

  const activeCount = shops.filter((s) => s.payment_status).length;

  return (
    <div className="min-h-screen p-6 md:p-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-bold">Lapis</h1>
          <p className="text-white/40 text-sm mt-1">Admin Panel</p>
        </div>
        <button onClick={handleLogout} className="btn-ghost text-sm">
          Sign out
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="card p-5">
          <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Total Shops</p>
          <p className="text-3xl font-bold">{shops.length}</p>
        </div>
        <div className="card p-5">
          <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Active</p>
          <p className="text-3xl font-bold text-emerald-400">{activeCount}</p>
        </div>
        <div className="card p-5 col-span-2 md:col-span-1">
          <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Pending</p>
          <p className="text-3xl font-bold text-amber-400">{shops.length - activeCount}</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by shop ID, name, or email…"
          className="input-field max-w-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-white/40">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-white/40">No shops found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-4 text-white/40 font-medium uppercase text-xs tracking-wider">Shop ID</th>
                  <th className="text-left p-4 text-white/40 font-medium uppercase text-xs tracking-wider">Shop Name</th>
                  <th className="text-left p-4 text-white/40 font-medium uppercase text-xs tracking-wider">Owner</th>
                  <th className="text-left p-4 text-white/40 font-medium uppercase text-xs tracking-wider">Email</th>
                  <th className="text-left p-4 text-white/40 font-medium uppercase text-xs tracking-wider">Status</th>
                  <th className="text-left p-4 text-white/40 font-medium uppercase text-xs tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((shop) => (
                  <tr key={shop.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4 font-mono text-white/70">{shop.shop_id}</td>
                    <td className="p-4 font-semibold">{shop.shop_name}</td>
                    <td className="p-4 text-white/70">{shop.users?.name || '—'}</td>
                    <td className="p-4 text-white/50 text-xs">{shop.users?.email || '—'}</td>
                    <td className="p-4">
                      {shop.payment_status ? (
                        <span className="status-badge-active">● Active</span>
                      ) : (
                        <span className="status-badge-pending">● Pending</span>
                      )}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => toggleStatus(shop.id, shop.payment_status)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                          shop.payment_status
                            ? 'bg-red-500/15 text-red-400 hover:bg-red-500/25'
                            : 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'
                        }`}
                      >
                        {shop.payment_status ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
