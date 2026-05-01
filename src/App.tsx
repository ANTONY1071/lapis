import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import ShopkeeperDashboard from './pages/ShopkeeperDashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import PublicOrderForm from './pages/PublicOrderForm';

const ADMIN_EMAIL = 'antonynitheen@gmail.com';

function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole: string }) {
  const [status, setStatus] = useState<'loading' | 'allowed' | 'denied'>('loading');

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { setStatus('denied'); return; }

      if (requiredRole === 'admin') {
        setStatus(session.user.email === ADMIN_EMAIL ? 'allowed' : 'denied');
        return;
      }

      const { data } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();

      setStatus(data?.role === requiredRole ? 'allowed' : 'denied');
    });
  }, [requiredRole]);

  if (status === 'loading') return <div className="flex items-center justify-center min-h-screen text-white/40">Loading…</div>;
  if (status === 'denied') return <Navigate to="/" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <div className="min-h-screen bg-navy-900 text-white font-sans">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/order/:shopId" element={<PublicOrderForm />} />
          <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/shopkeeper/dashboard" element={<ProtectedRoute requiredRole="shopkeeper"><ShopkeeperDashboard /></ProtectedRoute>} />
          <Route path="/customer/dashboard" element={<ProtectedRoute requiredRole="customer"><CustomerDashboard /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
