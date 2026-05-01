# Lapis — Order Management Platform

A multi-role order management platform built with React, TypeScript, Tailwind CSS, and Supabase.

## Roles
- **Admin** (`antonynitheen@gmail.com`) — manages all shops, toggles payment/activation status
- **Shopkeeper** — registers, pays, receives a public order link, manages incoming orders
- **Customer** — places orders via a shop's public link, tracks order status

---

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up Supabase
1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Open the **SQL Editor** and paste + run the contents of `supabase_schema.sql`.
3. Go to **Storage** → create a bucket named `order-files` with **Public** access enabled.

### 3. Configure environment
```bash
cp .env.example .env
```
Edit `.env` and fill in your Supabase URL and anon key from **Project Settings > API**.

### 4. Set up admin user
1. Sign up via the app using `antonynitheen@gmail.com` (password: `11112007NOVEMBER1071`).
2. In Supabase SQL Editor, find the UUID for that user:
   ```sql
   SELECT id FROM auth.users WHERE email = 'antonynitheen@gmail.com';
   ```
3. Uncomment and run the seed query at the bottom of `supabase_schema.sql` with that UUID.

### 5. Add QR image
Place your payment QR image at:
```
public/assets/WhatsApp Image 2026-04-30 at 8.13.24 PM.jpeg
```

### 6. Run the dev server
```bash
npm run dev
```

---

## Project Structure
```
src/
├── lib/
│   └── supabaseClient.ts     # Supabase connection
├── pages/
│   ├── Login.tsx             # Login (all roles)
│   ├── Register.tsx          # Registration (customer / shopkeeper)
│   ├── AdminDashboard.tsx    # Admin panel - manage shops
│   ├── ShopkeeperDashboard.tsx  # Shopkeeper - view/manage orders
│   ├── CustomerDashboard.tsx # Customer - track orders
│   └── PublicOrderForm.tsx   # Public order form (/order/:shopId)
├── components/
│   └── PaymentGate.tsx       # Payment screen shown to unpaid shopkeepers
├── App.tsx                   # Routes + auth guard
├── main.tsx                  # Entry point
└── index.css                 # Tailwind + global styles
```

---

## Build for Production
```bash
npm run build
```
Output is in the `dist/` folder — deploy to Vercel, Netlify, or any static host.

---

## Key Notes
- Real-time updates are enabled on admin dashboard and shopkeeper orders via Supabase Realtime.
- File attachments are uploaded to the `order-files` Supabase Storage bucket.
- Shop IDs are auto-incremented: S001, S002, S003…
- The admin password check is hardcoded in `Login.tsx` as a first-layer guard before Supabase auth.
