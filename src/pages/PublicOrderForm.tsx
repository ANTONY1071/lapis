import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

type ShopInfo = {
  shop_name: string;
  shop_id: string;
  payment_status: boolean;
};

export default function PublicOrderForm() {
  const { shopId } = useParams<{ shopId: string }>();
  const [shop, setShop] = useState<ShopInfo | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    item_name: '',
    quantity: 1,
    notes: '',
  });
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    const loadShop = async () => {
      const { data } = await supabase
        .from('shopkeepers')
        .select('shop_name, shop_id, payment_status')
        .eq('shop_id', shopId)
        .single();

      if (!data) { setNotFound(true); }
      else { setShop(data); }
      setLoading(false);
    };
    loadShop();
  }, [shopId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    let file_url: string | null = null;

    // Upload file if provided
    if (file) {
      const ext = file.name.split('.').pop();
      const path = `${shopId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('order-files')
        .upload(path, file);

      if (uploadError) {
        setError('File upload failed: ' + uploadError.message);
        setSubmitting(false);
        return;
      }

      const { data: urlData } = supabase.storage.from('order-files').getPublicUrl(path);
      file_url = urlData.publicUrl;
    }

    const { error: insertError } = await supabase.from('orders').insert({
      shop_id: shopId,
      customer_name: form.customer_name,
      customer_email: form.customer_email,
      item_name: form.item_name,
      quantity: form.quantity,
      notes: form.notes,
      file_url,
      status: 'pending',
    });

    if (insertError) {
      setError(insertError.message);
    } else {
      setSubmitted(true);
    }
    setSubmitting(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-white/40">Loading…</div>;
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-white/40 text-center p-6">
        <h2 className="text-2xl font-bold text-white mb-2">Shop not found</h2>
        <p className="text-sm">The link you followed may be incorrect or expired.</p>
      </div>
    );
  }

  if (!shop?.payment_status) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-white/40 text-center p-6">
        <h2 className="text-2xl font-bold text-white mb-2">Shop unavailable</h2>
        <p className="text-sm">This shop is not yet active. Please try again later.</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <div className="text-5xl mb-4">✓</div>
        <h2 className="text-2xl font-bold mb-2">Order placed!</h2>
        <p className="text-white/50 mb-6">
          Your order has been sent to <span className="text-white font-semibold">{shop?.shop_name}</span>.
          You'll receive updates via email.
        </p>
        <button
          onClick={() => { setSubmitted(false); setForm({ customer_name: '', customer_email: '', item_name: '', quantity: 1, notes: '' }); setFile(null); }}
          className="btn-ghost"
        >
          Place another order
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-6 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold">Lapis</h1>
        <p className="text-white/40 text-sm mt-1">Order from {shop?.shop_name}</p>
      </div>

      <div className="card w-full max-w-md p-8">
        <h2 className="text-xl font-semibold mb-6">Place an Order</h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 mb-5">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider mb-1.5 block">Your Name</label>
            <input
              type="text"
              placeholder="Full name"
              className="input-field"
              value={form.customer_name}
              onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider mb-1.5 block">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              className="input-field"
              value={form.customer_email}
              onChange={(e) => setForm({ ...form, customer_email: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider mb-1.5 block">Item / Service</label>
            <input
              type="text"
              placeholder="What do you need?"
              className="input-field"
              value={form.item_name}
              onChange={(e) => setForm({ ...form, item_name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider mb-1.5 block">Quantity</label>
            <input
              type="number"
              min={1}
              className="input-field"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })}
              required
            />
          </div>
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider mb-1.5 block">Notes (optional)</label>
            <textarea
              placeholder="Any special instructions…"
              rows={3}
              className="input-field resize-none"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider mb-1.5 block">Attachment (optional)</label>
            <input
              type="file"
              className="w-full text-sm text-white/60 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-white/10 file:text-white file:text-xs file:font-medium hover:file:bg-white/20 cursor-pointer"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full mt-2">
            {submitting ? 'Placing order…' : 'Place Order'}
          </button>
        </form>
      </div>
    </div>
  );
}
