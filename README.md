# FinTracker — Project Specification & Setup Guide

**FinTracker** is a daily expense tracker Web MVP designed with an archival editorial notebook aesthetic, monthly spending visualizations, live search and filtering, CSV/JSON export, and Supabase persistence with Row-Level Security.

## Implemented Features

- **Editorial Notebook Workspace**: Archival warm-paper canvas (`#FAF9F6`), subtle ruled ledger rows, single-elevation white sheets, `Fraunces` + `Plus Jakarta Sans` + `JetBrains Mono` (`tabular-nums`) typography, and smooth Framer Motion (`motion/react`) transitions.
- **Authentication & Password Recovery (`Supabase Auth`)**:
  - Email/password **Sign In** and **Create Account** tabs with accessible show/hide password toggles and automatic field/state reset on tab switches.
  - **Forgot Password** flow powered by a hardened, rate-limited `SECURITY DEFINER` Postgres function (`check_email_registered`, capped at 5 checks per email per 15 minutes): unregistered emails receive a one-click **Create Account with This Email** prompt, while registered emails receive a reset link that opens the **Set New Password** recovery screen (`PASSWORD_RECOVERY`).
  - Clear error handling for Supabase's built-in 2-emails-per-hour default rate limit.
- **Daily Expense CRUD**: Slide-over entry drawer with validation (amount, description, curated categories, date, payment method, optional notes), inline edit, and 2-step delete confirmation.
- **Monthly Analytics (`Recharts`)**: Interactive **Daily Spending Rhythm** chart (toggleable between Daily Bars and Trend Line) and **Category Breakdown** horizontal bar chart with tabular share percentages.
- **Search, Filters & Safe Export**: Live keyword search, category filter, date-range presets (`Selected Month`, `Last 7 Days`, `Custom Range`), sorting, and formula-safe RFC-4180 CSV + JSON exports.
- **Multi-Currency Mode (`USD`, `THB`, `MMK`)**: Switch between US Dollars (`$`), Thai Baht (`฿`), and Burmese MMK (`Ks`) in **Setup & Export** with fixed-rate conversion (`1 USD = 34.50 THB`, `1 USD = 4,400 MMK`), whole-number formatting for MMK, dynamic CSV headers, and account metadata + `localStorage` persistence.
- **Preview Resilience**: Runs in a `localStorage`-backed Local Browser Mode whenever Supabase environment variables are unset, and switches automatically to authenticated Supabase sync once configured.

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **UI & Motion**: Lucide React icons, Framer Motion (`motion/react`), Recharts
- **Backend & Auth**: Supabase (PostgreSQL, Email/Password Auth, Row-Level Security, `check_email_registered` RPC)
- **Deployment & VCS**: Vercel (`vercel.json` SPA rewrites + security headers), Git & GitHub
- **Documentation & Issue Tracking**:
  - [`docs/implementation_plan.md`](./docs/implementation_plan.md) — Initial Web MVP plan
  - [`docs/multi_currency_plan.md`](./docs/multi_currency_plan.md) — Multi-currency (`USD`, `THB`, `MMK`) plan
  - [`docs/BUG_REPORT.md`](./docs/BUG_REPORT.md) — Bug report and fix log

## Local & Supabase Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and add your Supabase project credentials:
   ```bash
   cp .env.example .env
   ```
   Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (or `SUPABASE_URL` and `SUPABASE_ANON_KEY`) from **Supabase Dashboard → Project Settings → API**.
3. Initialize the database in **Supabase Dashboard → SQL Editor** by pasting and running [`supabase/schema.sql`](./supabase/schema.sql). This creates:
   - `public.expenses` (including `currency` support for `USD`, `THB`, and `MMK`) with `CHECK` constraints, indexes, `updated_at` trigger, and `auth.uid() = user_id` RLS policies.
   - `public.auth_email_lookup_attempts` and `public.check_email_registered(email_input)` for throttled Forgot Password lookups.
4. Configure **Supabase Dashboard → Authentication**:
   - Add your local URL (`http://localhost:3000`) and Vercel production URL under **URL Configuration → Redirect URLs** so password reset links resolve cleanly.
   - *(Recommended for production)* Configure a **Custom SMTP** provider under **Authentication → SMTP Settings** and adjust **Authentication → Rate Limits** beyond Supabase's default 2 emails/hour quota.
5. Start the development server:
   ```bash
   npm run dev
   ```

## Deploying to Vercel via GitHub

1. Push this repository to GitHub.
2. Import the repository in **Vercel → Add New Project** (`vercel.json` is preconfigured for Vite SPA routing and security headers).
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under **Project Settings → Environment Variables**.
4. Deploy and add the resulting Vercel domain to your Supabase **Redirect URLs**.
