# Lapis 🪨
### Multi-Role Order Management Platform

A full-stack web application that enables businesses to manage customer orders through a structured, role-based system — built with React, TypeScript, Tailwind CSS, and Supabase.

🔴 **[Live Demo](https://lapis-jet.vercel.app/)**

---

## Overview

Lapis is a SaaS-style order management platform with three distinct user roles. Shopkeepers register their business, pay a one-time activation fee, and receive a unique public order link to share with customers. Customers place orders through that link and track their status in real time. Admins manage all shops and control platform access.

---

## Features

### 🛡️ Admin
- View and manage all registered shopkeeper accounts
- Toggle payment and activation status per shop
- Real-time dashboard updates via Supabase Realtime

### 🏪 Shopkeeper
- Register a shop and receive a unique Shop ID (S001, S002...)
- Payment gate — access is restricted until activation fee is paid
- Manage incoming orders — update status from pending to completed
- Real-time order notifications

### 👤 Customer
- Place orders via a shop's unique public link — no account required
- Attach files to orders (e.g. documents, images)
- Track order status in real time

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS |
| Backend | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Realtime | Supabase Realtime |
| Deployment | Vercel |

---

## Architecture

```
src/
├── lib/
│   └── supabaseClient.ts        # Supabase connection
├── pages/
│   ├── Login.tsx                # Login (all roles)
│   ├── Register.tsx             # Registration (customer / shopkeeper)
│   ├── AdminDashboard.tsx       # Admin panel — manage all shops
│   ├── ShopkeeperDashboard.tsx  # Shopkeeper — view and manage orders
│   ├── CustomerDashboard.tsx    # Customer — track orders
│   └── PublicOrderForm.tsx      # Public order form (/order/:shopId)
├── components/
│   └── PaymentGate.tsx          # Payment screen for unpaid shopkeepers
├── App.tsx                      # Routes + auth guard
├── main.tsx                     # Entry point
└── index.css                    # Tailwind + global styles
```

---

## Database Design

Built on PostgreSQL via Supabase with three core tables:

- **users** — extends Supabase auth, stores role (admin / shopkeeper / customer)
- **shopkeepers** — shop details, auto-incremented shop ID, payment status
- **orders** — linked to shop, stores item details, file URL, and order status

Row Level Security (RLS) is enforced on all tables — users can only access data they own or are authorized to view.

---

## Security

- Row Level Security (RLS) enabled on all tables
- Role-based access control enforced at database level via RLS policies
- Admin permissions controlled through a `is_admin()` SQL function
- Public order form is scoped to active, paid shops only
- File uploads are sandboxed to the `order-files` storage bucket

---

## Local Setup

### 1. Clone the repository
```bash
git clone https://github.com/ANTONY1071/lapis.git
cd lapis
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up Supabase
1. Create a new project at [supabase.com](https://supabase.com)
2. Open the SQL Editor and run the contents of `supabase_schema.sql`
3. Go to Storage → create a bucket named `order-files` with Public access enabled

### 4. Configure environment variables
```bash
cp .env.example .env
```
Fill in your Supabase URL and anon key from **Project Settings > API**

### 5. Run the development server
```bash
npm run dev
```

---

## Deployment

This project is deployed on Vercel. To deploy your own instance:

```bash
npm run build
```

Push to GitHub and import the repository on [vercel.com](https://vercel.com). Add your environment variables in the Vercel project settings.

---

## Author

**Nitheen Antony** — 1st Year AI & Data Science Student
Jerusalem College of Engineering, Chennai

---


