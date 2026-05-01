-- ============================================================
-- LAPIS — Supabase SQL Schema
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'shopkeeper', 'customer')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Shopkeepers table
CREATE TABLE IF NOT EXISTS public.shopkeepers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  shop_id TEXT NOT NULL UNIQUE,          -- e.g. S001, S002
  shop_name TEXT NOT NULL,
  payment_status BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id TEXT NOT NULL REFERENCES public.shopkeepers(shop_id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopkeepers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- USERS policies
CREATE POLICY "Users can read own record"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own record"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- SHOPKEEPERS policies
CREATE POLICY "Shopkeepers can read own shop"
  ON public.shopkeepers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Shopkeepers can insert own shop"
  ON public.shopkeepers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Shopkeepers can update own shop"
  ON public.shopkeepers FOR UPDATE
  USING (auth.uid() = user_id);

-- Admin can read all shopkeepers (using service role or anon with service key on admin routes)
CREATE POLICY "Public can read shopkeeper status by shop_id"
  ON public.shopkeepers FOR SELECT
  USING (TRUE);  -- Needed for public order form to verify shop is active

-- ORDERS policies
CREATE POLICY "Anyone can insert orders"
  ON public.orders FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Shopkeepers can read their shop orders"
  ON public.orders FOR SELECT
  USING (
    shop_id IN (
      SELECT shop_id FROM public.shopkeepers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Shopkeepers can update their shop orders"
  ON public.orders FOR UPDATE
  USING (
    shop_id IN (
      SELECT shop_id FROM public.shopkeepers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Customers can read their own orders"
  ON public.orders FOR SELECT
  USING (customer_email = (SELECT email FROM public.users WHERE id = auth.uid()));

-- ============================================================
-- ADMIN POLICIES (bypass RLS for admin email)
-- Option: Use Supabase service role key on admin calls, OR
-- add a policy that allows the admin user to read everything.
-- Simplest approach: give admin user special permissions via a function.
-- ============================================================

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Admin can read all shopkeepers
CREATE POLICY "Admin can read all shopkeepers"
  ON public.shopkeepers FOR SELECT
  USING (public.is_admin());

-- Admin can update all shopkeepers (for toggling payment_status)
CREATE POLICY "Admin can update all shopkeepers"
  ON public.shopkeepers FOR UPDATE
  USING (public.is_admin());

-- Admin can read all users
CREATE POLICY "Admin can read all users"
  ON public.users FOR SELECT
  USING (public.is_admin());

-- ============================================================
-- STORAGE: order-files bucket
-- Run this OR create manually in Supabase Dashboard > Storage
-- ============================================================

-- Create the bucket (if using storage API)
-- Note: In Supabase dashboard, go to Storage > New Bucket
-- Name: order-files, Public: true

INSERT INTO storage.buckets (id, name, public)
VALUES ('order-files', 'order-files', true)
ON CONFLICT DO NOTHING;

-- Allow anyone to upload to order-files
CREATE POLICY "Public can upload order files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'order-files');

-- Allow public read of order files
CREATE POLICY "Public can read order files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'order-files');

-- ============================================================
-- SEED: Insert admin user record (run AFTER signing up with the admin email)
-- Replace the UUID below with the actual auth.users id for antonynitheen@gmail.com
-- ============================================================

-- INSERT INTO public.users (id, name, email, role)
-- VALUES ('REPLACE_WITH_ADMIN_AUTH_UUID', 'Nitheen Antony', 'antonynitheen@gmail.com', 'admin');
