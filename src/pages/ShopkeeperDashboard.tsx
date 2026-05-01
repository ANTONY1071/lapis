import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { PaymentGate } from '../components/PaymentGate';

const EMAILJS_SERVICE_ID = 'service_i0emz7b';
const EMAILJS_TEMPLATE_ID = 'template_5sybd52';
const EMAILJS_PUBLIC_KEY = 'O0JyMG_z1jldfzJY6';

type Order = {
  id: string;
  customer_name: string;
  customer_email: string;
  item_name: string;
  quantity: number;
  notes: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  file_url: string | null;
  created_at: string;
};

type ShopInfo = {
  id: string;
  shop_id: string;
  shop_name: string;
  payment_status: boolean;
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-400',
  processing: 'bg-blue-500/15 text-blue-400',
  completed: 'bg-emerald-500/15 text-emerald-400',
  cancelled: 'bg-red-500/15 text-red-400',
};

const sendCompletionEmail = async (order: Order, shopName: string) => {
  try {
    await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        template_params: {
          email: order.customer_email,
          customer_name: order.customer_name,
          order_item: order.item_name,
          quantity: order.quantity,
          shop_name: shopName,
        },
      }),
    });
  } catch (err) {
    console.error('Email failed:', err);
  }
};

export default function ShopkeeperDashboard() {
  const [shop, setShop] = useState<ShopInfo | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate('/'); return; }

    const { data: shopData } = await supabase
      .from('shopkeepers')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!shopData) { setLoading(false); return; }
    setShop(shopData);

    if (!shopData.payment_status) {
      setShowPayment(true);
    }

    // Real-time payment status — reacts instantly when admin toggles
    supabase
      .channel(`payment-${shopData.shop_id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'shopkeepers',
        filter: `shop_id=eq.${shopData.shop_id}`,
      }, (payload: any) => {
        setShowPayment(!payload.new.payment_status);
        setShop((prev) => prev ? { ...prev, payment_status: payload.new.payment_status } : prev);
      })
      .subscribe();

    if (shopData.payment_status) {
      await fetchOrders(shopData.shop_id);

      supabase
        .channel('shopkeeper-orders')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `shop_id=eq.${shopData.shop_id}`,
        }, () => fetchOrders(shopData.shop_id))
        .subscribe();
    }

    setLoading(false);
  };

  const fetchOrders = async (shopId: string) => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false });
    setOrders((data as Order[]) || []);
  };

  const updateStatus = async (order: Order, newStatus: Order['status']) => {
    await supabase.from('orders').update({ status: newStatus }).eq('id', order.id);
    if (newStatus === 'completed' && shop) {
      await sendCompletionEmail(order, shop.shop_name);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('lapis_role');
    navigate('/');
  };

  const copyLink = () => {
    if (!shop) return;
    const url = `${window.location.origin}/order/${shop.shop_id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen text-white/40">Loading…</div>;
  if (showPayment) return <PaymentGate />;

  const pending = orders.filter((o) => o.status === 'pending').length;

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-bold">Lapis</h1>
          <p className="text-white/40 text-sm mt-1">
            {shop?.shop_name} · <span className="font-mono">{shop?.shop_id}</span>
          </p>
        </div>
        <button onClick={handleLogout} className="btn-ghost text-sm">Sign out</button>
      </div>

      <div className="card p-5 mb-8 flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1">
          <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Your Public Order Link</p>
          <p className="font-mono text-sm text-white/70 truncate">
            {window.location.origin}/order/{shop?.shop_id}
          </p>
        </div>
        <button onClick={copyLink} className="btn-primary shrink-0">
          {copied ? '✓ Copied!' : 'Copy Link'}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {(['pending', 'processing', 'completed', 'cancelled'] as Order['status'][]).map((s) => (
          <div key={s} className="card p-4">
            <p className="text-white/40 text-xs uppercase tracking-wider capitalize mb-1">{s}</p>
            <p className="text-2xl font-bold">{orders.filter((o) => o.status === s).length}</p>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <h2 className="font-semibold">Orders</h2>
          {pending > 0 && <span className="status-badge-pending">{pending} new</span>}
        </div>

        {orders.length === 0 ? (
          <div className="p-10 text-center text-white/40">
            <p className="text-lg mb-2">No orders yet</p>
            <p className="text-sm">Share your order link to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {orders.map((order) => (
              <div key={order.id} className="p-5 hover:bg-white/5 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold truncate">{order.item_name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_COLORS[order.status]}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm text-white/50">
                      {order.customer_name} · {order.customer_email} · Qty: {order.quantity}
                    </p>
                    {order.notes && <p className="text-xs text-white/30 mt-1 truncate">{order.notes}</p>}
                    {order.file_url && (
                      <a href={order.file_url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline mt-1 inline-block">
                        📎 Attachment
                      </a>
                    )}
                    <p className="text-xs text-white/20 mt-1">{new Date(order.created_at).toLocaleString()}</p>
                  </div>
                  <select
                    value={order.status}
                    onChange={(e) => updateStatus(order, e.target.value as Order['status'])}
                    className="bg-navy-700 border border-white/10 text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-white/30 shrink-0"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
