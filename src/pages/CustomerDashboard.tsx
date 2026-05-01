import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

type Order = {
  id: string;
  shop_id: string;
  item_name: string;
  quantity: number;
  notes: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  file_url: string | null;
  created_at: string;
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-400',
  processing: 'bg-blue-500/15 text-blue-400',
  completed: 'bg-emerald-500/15 text-emerald-400',
  cancelled: 'bg-red-500/15 text-red-400',
};

const STATUS_STEPS = ['pending', 'processing', 'completed'];

export default function CustomerDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate('/'); return; }

    const { data: userData } = await supabase
      .from('users')
      .select('name')
      .eq('id', user.id)
      .single();
    setUserName(userData?.name || 'Customer');

    await fetchOrders(user.email || '');
    setLoading(false);

    supabase
      .channel('customer-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `customer_email=eq.${user.email}` }, () => fetchOrders(user.email || ''))
      .subscribe();
  };

  const fetchOrders = async (email: string) => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_email', email)
      .order('created_at', { ascending: false });
    setOrders((data as Order[]) || []);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('lapis_role');
    navigate('/');
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-white/40">Loading…</div>;
  }

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-bold">Lapis</h1>
          <p className="text-white/40 text-sm mt-1">Welcome back, {userName}</p>
        </div>
        <button onClick={handleLogout} className="btn-ghost text-sm">Sign out</button>
      </div>

      <h2 className="text-xl font-semibold mb-6">Your Orders</h2>

      {orders.length === 0 ? (
        <div className="card p-12 text-center text-white/40">
          <p className="text-lg mb-2">No orders yet</p>
          <p className="text-sm">Use a shop's order link to place your first order.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const stepIndex = STATUS_STEPS.indexOf(order.status);
            return (
              <div key={order.id} className="card p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="font-semibold text-lg">{order.item_name}</p>
                    <p className="text-sm text-white/50">
                      Shop: <span className="font-mono">{order.shop_id}</span> · Qty: {order.quantity}
                    </p>
                    {order.notes && (
                      <p className="text-xs text-white/30 mt-1">{order.notes}</p>
                    )}
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize shrink-0 ${STATUS_COLORS[order.status]}`}>
                    {order.status}
                  </span>
                </div>

                {/* Progress bar (for non-cancelled) */}
                {order.status !== 'cancelled' && (
                  <div className="flex items-center gap-2 mt-4">
                    {STATUS_STEPS.map((step, i) => (
                      <React.Fragment key={step}>
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full ${i <= stepIndex ? 'bg-white' : 'bg-white/20'}`} />
                          <span className="text-[10px] text-white/40 mt-1 capitalize">{step}</span>
                        </div>
                        {i < STATUS_STEPS.length - 1 && (
                          <div className={`flex-1 h-px ${i < stepIndex ? 'bg-white' : 'bg-white/15'} mb-4`} />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                )}

                <p className="text-xs text-white/20 mt-3">
                  Placed {new Date(order.created_at).toLocaleString()}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
