# FinTracker — Daily Expense Tracker Web MVP

FinTracker is a web-based daily expense tracker built with React, Vite, Tailwind CSS, Framer Motion, Recharts, and Supabase. It pairs the calm focus of a ruled paper financial notebook with live monthly spending analytics, fast search and filtering, and one-click CSV export.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> Your Phase 1 choices are locked in below. Review the confirmed decisions and the one recommended operational default before proceeding to implementation.

- **Confirmed — Persistence & Auth**: FinTracker will connect to your own Supabase project via environment variables (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`) with Supabase Email/Password authentication and Row-Level Security.
- **Confirmed — Visual Aesthetic**: Editorial notebook theme featuring ruled-paper warmth, crisp ink hierarchy, and sleek typography (`Fraunces`, `Plus Jakarta Sans`, and `JetBrains Mono`).
- **Confirmed — Core Capabilities**: Daily expense logging, interactive Recharts monthly spending visualizations, live search, category/date/sort filters, and CSV export.
- **Confirmed — Scope**: Web MVP focused on desktop-first ledger ergonomics and responsive browser usability (mobile native/PWA deferred to a later phase).
- **Confirmed — Schema & Deployment Configuration**: Include a production-ready Supabase SQL schema with Row-Level Security policies and indexes, environment variable templates, Vercel SPA routing and security headers configuration, and a GitHub-ready setup guide.
- **Confirmed — Preview Resilience**: Because Supabase project credentials are supplied via environment variables (never entered inside app UI inputs), FinTracker starts in an immediately usable local browser workspace whenever Supabase environment keys are not yet configured, and automatically switches to authenticated Supabase sync once keys are provided.

---

### 1. Overview & Core Concept

- **What It Does**: FinTracker lets individuals record daily expenses in seconds, browse a clean chronological ledger styled like an archival notebook, inspect monthly spending patterns through interactive Recharts visualizations, filter entries by keyword, category, or date range, and export filtered records as CSV spreadsheets.
- **Target Audience / Persona**: Individuals and freelancers who want the clarity and intentionality of writing expenses in a physical notebook combined with automated monthly totals, visual trend charts, and cloud-synced records.
- **Key Value**: Eliminates cluttered spreadsheet fatigue and noisy fintech bloat—offering a single, serene workspace where capturing a daily expense takes under five seconds and monthly habits become immediately legible.

---

### 2. User Experience & Visual Design

- **Key User Flows**:
  1. **First Launch, Authentication & Password Recovery**:
     - *With Supabase configured*: User lands on a clean notebook cover/sign-in sheet supporting **Sign In** and **Create Account** tabs with show/hide password toggles, automatic form/state reset when switching tabs, and clear rate-limit error messaging.
     - *Forgot Password & Recovery*: From **Sign In**, users can trigger **Forgot password?**, which verifies email registration via a hardened, throttled SQL RPC (`check_email_registered`). Unregistered emails receive a one-click **"Create Account with This Email"** prompt; registered emails receive a reset link that returns to FinTracker (`PASSWORD_RECOVERY`) and opens the **Set New Password** form.
     - *Before Supabase keys are added*: User enters the local workspace directly with a quiet setup notice explaining which environment variables and SQL setup script to apply when connecting their Supabase project.
     - *Empty Ledger State*: First-time users see a clear explanation of the daily ledger and a primary **"Log First Expense"** action button.
  2. **Quick Daily Expense Logging**: Clicking **"Log Expense"** opens a compact, tactile notebook entry drawer/modal with amount, merchant/description, category, date (defaulting to today), payment method, and optional note. Submitting immediately validates inputs, saves to Supabase (or local workspace), and smoothly animates the new row into the ledger.
  3. **Browsing, Searching & Filtering the Ledger**: Users switch months via a sleek month selector, type into the live search bar (matching title, notes, or payment method), toggle category or date-range filters, and sort by newest, highest, or lowest amount. Inline edit and delete actions let users correct entries with confirmation safeguards.
  4. **Monthly Spending Analytics (Recharts)**: Directly integrated above or alongside the ledger, two synchronized Recharts visualizations update live as filters or months change:
     - *Daily Spending Rhythm*: Area/Bar chart showing day-by-day expenditure across the selected month with crisp custom notebook tooltips.
     - *Category Breakdown*: Clean horizontal bar or donut chart ranking top spending categories with exact percentages and tabular dollar totals.
  5. **CSV Export**: Clicking **"Export CSV"** downloads a clean, spreadsheet-safe `.csv` file reflecting the active month and filters.

- **Visual Identity & Theme**:
  - *Aesthetic Direction*: **Archival Editorial Notebook** — calm, disciplined, high-craft stationery aesthetic without cheesy skeuomorphic rings or clutter.
  - *Color Palette & Mood* (60-30-10 discipline):
    - **60% Canvas (`--background`)**: Archival warm ivory paper (`#FAF9F6`) accented by ultra-faint horizontal ledger rules (`rgba(24, 24, 27, 0.045)`).
    - **30% Structural Surfaces (`--surface` / `--border`)**: Crisp sheet white (`#FFFFFF`) containers with subtle `1px solid #E7E5E0` hairline borders, deep graphite ink (`#18181B`) primary text, and muted ash (`#57534E`) secondary metadata.
    - **10% Accent (`--primary`)**: Deep Fountain-Pen Forest Ink (`#166534` hover `#14532D`) reserved for primary CTAs, active navigation states, and primary chart focus; semantic status accents (`#DC2626` crimson for delete/over-limit alerts, `#D97706` amber for caution) always paired with explicit text labels.
  - *Typography & Hierarchy (2+1 Rule)*:
    - **Display & Month Headings**: `Fraunces` (sleek editorial serif with crisp optical contrast) for the FinTracker wordmark, active month heading, and hero monthly total.
    - **Body & Controls**: `Plus Jakarta Sans` for navigation, form inputs, category labels, and ledger descriptions.
    - **Financial Data & Dates**: `JetBrains Mono` with `font-variant-numeric: tabular-nums` so currency columns and dates align cleanly down every notebook row.
  - *Component Styling & Layout*:
    - **Workspace Layout**: Left sidebar (`240px` on desktop, collapsible drawer on narrow viewports) housing primary navigation (`Overview`, `Monthly Analytics`, `Ledger`, `Setup & Export`) + top workspace header (`whitespace-nowrap` month context & single primary **"Log Expense"** button) + main content canvas (`max-w-6xl`).
    - **Zero-Pill & Anti-Slop Discipline**: Category tags and dates render as clean unboxed text separated by `·` rather than candy pill badges; cards use single-level hairline borders without nested boxes, thick left accent stripes, or decorative status dots.

- **Interactive Feedback & Motion (Framer Motion)**:
  - Smooth GPU-composited (`opacity` and `transform`) transitions settling within `150ms–200ms` (`cubic-bezier(0.16, 1, 0.3, 1)`) for modal entry, ledger row additions/removals (`AnimatePresence`), and view tab switches.
  - Respects `prefers-reduced-motion`.
  - Dedicated loading skeletons matching row heights, inline form validation errors, and clean confirmation feedback when saving, deleting, or exporting CSVs.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Environment-Configured Supabase + Local Preview Fallback**
  - *Chosen Approach*: Read `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` exclusively from Vite environment variables (`.env` locally, Vercel Environment Variables in production), never exposing API key input forms in the UI. When env vars are absent, operate in a transparent local-storage ledger mode with a setup checklist.
  - *Why*: Protects credentials cleanly, prevents the app from breaking before Supabase keys are added, and keeps deployment to Vercel effortless.
  - *Alternatives Considered*: Hardcoding demo credentials (insecure) or blocking the entire UI behind a blank error screen when env vars are missing (poor developer experience).

- **Decision 2: Recharts Dual-View Monthly Analytics**
  - *Chosen Approach*: Pair a **Daily Spending Bar/Area Chart** (days 1–31 of the selected month) with a **Category Distribution Chart** using Recharts `ResponsiveContainer` and custom notebook-styled tooltips.
  - *Why*: Answers the two primary daily-tracker questions at a glance: *"Which days did I spend the most?"* and *"Where is my money going this month?"*
  - *Alternatives Considered*: Showing 5+ competing charts (creates dashboard clutter and fragments focal hierarchy).

- **Decision 3: Safe Client-Side CSV Export**
  - *Chosen Approach*: Generate RFC-4180 compliant CSV exports directly from the active filtered expense list, escaping quotes/commas and neutralizing spreadsheet formula prefixes (`=`, `+`, `-`, `@`).
  - *Why*: Zero backend latency, exports match exactly what the user filtered on screen, and protects users when opening CSV files in Excel or Google Sheets.

---

### 4. Technical Architecture & Data Strategy

- **Architecture & Component Diagram**:

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                        FinTracker Web Application                        │
│                                                                          │
│  ┌──────────────────────┐       ┌─────────────────────────────────────┐  │
│  │   Auth & Workspace   │       │         Data Provider Layer         │  │
│  │      Controller      │◄─────►│  • Supabase Client (env keys set)   │  │
│  │ (Session / Mode Gate)│       │  • Local Store Fallback (no keys)   │  │
│  └──────────┬───────────┘       └──────────────────┬──────────────────┘  │
│             │                                      │                     │
│             ▼                                      ▼                     │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                    Expense State & Filter Engine                   │  │
│  │  • Month Windowing   • Live Search   • Category & Sort Selectors   │  │
│  │  • Aggregations (Total, Daily Average, Top Category, Day Series)   │  │
│  └───────┬──────────────────────────┬─────────────────────────┬───────┘  │
│          │                          │                         │          │
│          ▼                          ▼                         ▼          │
│  ┌───────────────┐        ┌───────────────────┐      ┌────────────────┐  │
│  │   Recharts    │        │  Notebook Ledger  │      │  CSV Exporter  │  │
│  │ Monthly Views │        │  Table & Drawer   │      │ (Safe Escaping)│  │
│  │ (Daily + Cat) │        │  (CRUD + Motion)  │      │                │  │
│  └───────────────┘        └───────────────────┘      └────────────────┘  │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │ HTTPS + JWT (RLS Enforced)
                                     ▼
                       ┌───────────────────────────┐
                       │     Supabase Platform     │
                       │  • Auth (Email/Password)  │
                       │  • Postgres: expenses     │
                       │  • Row-Level Security     │
                       └───────────────────────────┘
```

- **Data Model & State**:
  - **`expenses` Table (Supabase Postgres)**:
    - `id` (UUID, primary key, generated by Postgres)
    - `user_id` (UUID, references `auth.users.id`, indexed)
    - `title` (Text, required, 1–120 chars)
    - `amount` (Numeric(12,2), required, > 0)
    - `category` (Text, constrained to curated categories: `Food & Dining`, `Transport`, `Groceries`, `Utilities & Bills`, `Shopping`, `Health`, `Entertainment`, `Other`)
    - `expense_date` (Date, required, indexed)
    - `payment_method` (Text: `Card`, `Cash`, `Bank Transfer`, `Digital Wallet`)
    - `notes` (Text, optional, max 500 chars)
    - `created_at` (Timestamptz, default `now()`)
  - **Row-Level Security (RLS)**: Strict policies ensuring authenticated users can only `SELECT`, `INSERT`, `UPDATE`, and `DELETE` rows where `auth.uid() = user_id`.
  - **`auth_email_lookup_attempts` Table & `check_email_registered` RPC (Supabase Postgres)**:
    - `auth_email_lookup_attempts` (`email_key`, `attempt_count`, `window_started_at`) with RLS enabled and zero direct client policies.
    - Hardened `SECURITY DEFINER` function (`set search_path = public, auth`) that normalizes/validates email inputs, enforces a rolling 5-attempts-per-15-minutes throttle per email, and returns `{ registered, rate_limited, invalid }` without exposing `auth.users` to clients.

- **Interactive Component & State Mapping**:
  - **Auth Cover Sheet**: Manages `signin`, `signup`, `forgot`, and `recoveryMode` states; includes show/hide password toggles, automatic form clearing on tab switches, unregistered-email sign-up shortcut, recovery password matching validation, and friendly formatting for Supabase `over_email_send_rate_limit` responses.
  - **Sidebar & Navigation**: Switches between **Overview** (KPI summary + Recharts monthly charts + recent entries), **Ledger** (full searchable/filterable expense notebook), **Analytics** (expanded monthly spending patterns and category breakdown), and **Setup & Export** (deployment readiness, copyable Supabase schema, JSON/CSV backups, and account controls).
  - **Expense Form Drawer**: Controlled state with client-side validation (positive numeric amount, non-empty title, valid date), loading submit button states, and clean error banner recovery.
  - **Search & Filter Toolbar**: Instant search input, category filter dropdown, date-range selector (`Selected Month`, `Last 7 Days`, `Custom Range`), sort selector, and **"Reset filters"** / **"Clear Filters"** button when zero matches occur.
  - **Summary Strip**: Tabular-numeral metrics computed live from the active month (`Total Spent`, `Daily Average`, `Entries Logged`, `Top Category`).

- **Schema & Deployment Configuration Deliverables**:
  - **Supabase SQL Schema & RLS Migration**: Complete SQL script defining `expenses` (with `CHECK` constraints, composite `(user_id, expense_date DESC)` index, and `updated_at` trigger), RLS policies, and the throttled `check_email_registered` RPC + `auth_email_lookup_attempts` table.
  - **Environment Variable Contract**: `.env.example` and Vite `loadEnv` config supporting `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (plus safe `SUPABASE_URL` / `SUPABASE_ANON_KEY` aliases) for local `.env` development and Vercel Project Settings injection.
  - **Vercel & GitHub Deployment Configuration**: Vercel configuration defining Vite build output (`dist`), SPA fallback rewrites so client routes resolve cleanly on refresh, and baseline HTTP security headers (`X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`), plus repository `README` and `BUG_REPORT` documentation.

- **Security & Deployment Safeguards**:
  - **Credential Boundaries**: Supabase URL and public anon key are read strictly from environment variables documented in `.env.example`; secret service-role keys are never exposed to client code.
  - **Database Isolation & Input Validation**: All Postgres access uses parameterized Supabase SDK queries governed by Row-Level Security (`auth.uid() = user_id`), paired with strict client and database-constraint validation; the `SECURITY DEFINER` email check locks `search_path` and throttles repeated lookups.
  - **Safe Rendering & Export**: All user-entered descriptions and notes render through React's escaped text bindings (no raw HTML injection), recovery tokens are cleared from the browser URL after password update, and CSV exports sanitize spreadsheet formula characters.
