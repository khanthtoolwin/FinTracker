# FinTracker — Multi-Currency Mode (USD, THB, MMK)

Add a three-currency mode (**US Dollars `USD`**, **Thai Baht `THB`**, and **Burmese Kyat `MMK`**) to FinTracker so users can switch their display and entry currency from **Setup & Export** with automatic fixed-rate conversion, tailored decimal formatting, and synchronized CSV exports.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> Confirmed Phase 1 and plan-review decisions for the multi-currency implementation.

- **Confirmed — Supported Currencies**: Restricted strictly to three options: **US Dollars (`USD`, `$`)**, **Thai Baht (`THB`, `฿`)**, and **Burmese Kyat (`MMK`, `Ks`)**.
- **Confirmed — Fixed-Rate Conversion**: Switching currencies updates all symbols/formatting and converts existing expense totals across the Summary Strip, charts, ledger rows, edit drawer, and CSV export using fixed exchange rates.
- **Confirmed — Switcher Placement**: Lives exclusively inside the **Setup & Export** tab (keeping the top bar and sidebar uncluttered).
- **Confirmed — Decimal Rules**: **Whole numbers (0 decimals)** for `MMK`, and **2 decimal places** for `USD` and `THB`.
- **Confirmed — Scope Boundary (`BUG-004` Remains Deferred)**: This currency feature works independently in both Local Browser Mode and Cloud Mode and does **not** require fixing `BUG-004` (migrating past `localStorage` expense rows into Supabase).
- **Confirmed — Preference Persistence**: Sync the selected currency to the user's authenticated account metadata alongside `localStorage` fallback, so signed-in users keep their currency choice across devices without touching `BUG-004`.
- **Confirmed — Fixed Exchange Rates & Schema Update**: Use `1 USD = 34.50 THB` and `1 USD = 4,400 MMK` as the fixed conversion rates, and record each entry's source currency (`USD` default for existing records) so repeated switching never introduces compounding rounding drift. *(Note: Adding the `currency` column to the cloud `expenses` table requires re-running `supabase/schema.sql` in the Supabase SQL Editor.)*

---

### 1. Overview & Core Concept

- **What It Does**: Lets users select `USD`, `THB`, or `MMK` in **Setup & Export**, immediately converting and formatting every displayed expense, monthly summary metric, chart axis/tooltip, expense entry form, and CSV export into the chosen currency.
- **Target Audience / Persona**: Individuals tracking daily spending across US, Thai, and Myanmar contexts who want one clean ledger without needing to maintain manual currency calculations.
- **Key Value**: Eliminates hardcoded USD-only formatting (`BUG-006`) while ensuring amounts entered in whole-number `MMK` or decimal `USD`/`THB` convert cleanly and predictably under transparent fixed rates.

---

### 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Selecting a Currency (`Setup & Export`)**:
     - Under **Workspace Storage**, a dedicated **Display Currency** sheet presents a clean three-option segmented control: `US Dollars ($)`, `Thai Baht (฿)`, and `Burmese MMK (Ks)`.
     - Below the control, a quiet single-line reference notes the active fixed rates (`1 USD = 34.50 THB · 1 USD = 4,400 MMK (whole numbers for MMK)`).
     - Selecting an option immediately converts all visible amounts across the workspace, persists the choice, and triggers a subtle confirmation toast (e.g., `Display currency set to Burmese MMK (Ks)`).
  2. **Logging & Editing Expenses**:
     - Opening **Log Expense** shows the active currency label (`Amount (USD)`, `Amount (THB)`, or `Amount (MMK)`), matching prefix (`$`, `฿`, or `Ks`), and appropriate numeric input step (`0.01` for `USD`/`THB`, `1` for `MMK` with whole-number validation).
     - Editing an entry originally logged in another currency pre-fills its converted amount in the active currency and saves the updated figure in the active currency.
  3. **Reading Summaries, Charts & Exports**:
     - **Summary Strip** (`Total Spent`, `Daily Average`, `Top Category`), **Monthly Charts** (Y-axis ticks, tooltips, and category share breakdown), and **Daily Ledger** rows all format with `tabular-nums`—rendering `USD`/`THB` to 2 decimals (`$12.50`, `฿431.25`) and `MMK` as whole numbers (`Ks 55,000`).
     - **CSV Export** converts amounts to the active currency and dynamically labels the column `Amount (USD)`, `Amount (THB)`, or `Amount (MMK)`.

- **Visual Identity & Theme**:
  - Preserves FinTracker's **Archival Editorial Notebook** design system (`#FAF9F6` ivory paper canvas, `#FFFFFF` single-elevation sheets with `1px solid #E7E5E0` borders, `#18181B` graphite ink, `#166534` forest-ink active states).
  - Currency switcher uses an interactive segmented button group (matching existing chart/date toggles) with `whitespace-nowrap shrink-0` single-line labels and zero decorative pill badges.
  - All monetary values retain `JetBrains Mono` with `font-variant-numeric: tabular-nums` so columns stay vertically aligned regardless of symbol width.

- **Interactive Feedback & Motion**:
  - Instant UI state transitions (`≤ 200ms`) with subtle toast feedback upon currency changes and clear validation error banners if an invalid amount (e.g., decimal input in `MMK` or zero/negative values) is submitted.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Store Source Currency Per Expense + Convert on Display vs. Mutating Stored Rows on Switch**
  - *Chosen Approach*: Keep each expense's original `amount` and `currency` (`USD`, `THB`, or `MMK`, defaulting existing entries to `USD`) and convert on the fly when `expense.currency !== activeCurrency`.
  - *Why*: Converting database rows in-place on every toggle would cause compounding rounding errors (especially when switching `USD → MMK → USD`) and require batch-updating every remote record on every click. Source-currency preservation guarantees `5,000 Ks` logged in `MMK` always stays exact `Ks 5,000` while still converting cleanly to `USD` or `THB` on demand.
  - *Alternatives Considered*: Converting all expenses into canonical `USD` on save (causes Kyat round-trip drift on `MMK` entries due to 2-decimal storage limits) or rewriting every database row on switch (slow and lossy).

- **Decision 2: Account Metadata + `localStorage` Persistence**
  - *Chosen Approach*: Save the active currency in `localStorage` for immediate startup and local-mode support, and sync that single preference to Supabase user metadata (`auth.updateUser`) when signed in.
  - *Why*: Works identically in both Local Browser Mode and Cloud Mode, requires no separate user-settings table, and is completely independent of `BUG-004` (local-to-cloud expense row migration).
  - *Alternatives Considered*: `localStorage`-only (resets if the user signs in from another browser) or adding a dedicated `user_preferences` table (unnecessary complexity for a single setting).

- **Decision 3: Centralized Fixed Rate Table**
  - *Chosen Approach*: Define fixed USD-anchored rates (`1 USD = 1 USD`, `1 USD = 34.50 THB`, `1 USD = 4,400 MMK`) in one shared currency utility used by analytics, drawer validation, and CSV export.
  - *Why*: Deterministic, offline-safe, zero external API dependencies, and straightforward to update in one place if rates change later.

---

### 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```text
┌───────────────────────────────────────────────────────────────────────────┐
│                         FinTracker Currency Flow                          │
│                                                                           │
│  ┌──────────────────────────┐        ┌─────────────────────────────────┐  │
│  │  Setup & Export Selector │───────►│   Currency Preference Store     │  │
│  │  (USD / THB / MMK)       │        │   • localStorage (immediate)    │  │
│  └──────────────────────────┘        │   • Supabase Auth metadata sync │  │
│                                      └────────────────┬────────────────┘  │
│                                                       │ activeCurrency    │
│                                                       ▼                   │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │              Currency Conversion & Formatting Engine                │  │
│  │  • Fixed FX Table (USD ↔ THB ↔ MMK)                                 │  │
│  │  • Precision Rules (USD/THB: 2 decimals · MMK: 0 decimals)          │  │
│  │  • Input Validation (step & rounding per active currency)           │  │
│  └──────┬──────────────────────────┬───────────────────────────┬───────┘  │
│         │                          │                           │          │
│         ▼                          ▼                           ▼          │
│  ┌──────────────┐        ┌──────────────────┐        ┌─────────────────┐  │
│  │ Summary Strip│        │ Daily Ledger &   │        │ CSV Exporter    │  │
│  │ & Recharts   │        │ Expense Drawer   │        │ Dynamic Header  │  │
│  └──────────────┘        └──────────────────┘        └─────────────────┘  │
└───────────────────────────────────────────────────────────────────────────┘
```

- **Data Model & State**:
  - **Currency Type**: `CurrencyCode = 'USD' | 'THB' | 'MMK'`.
  - **Expense Entity**: Adds `currency: CurrencyCode` (defaulting to `'USD'` when reading legacy local or database records that predate the column).
  - **Database Schema**: Add `currency text not null default 'USD' check (currency in ('USD', 'THB', 'MMK'))` to `public.expenses` with an idempotent `alter table` statement so both fresh installs and existing projects migrate cleanly under existing Row-Level Security policies.
  - **Conversion & Aggregation Rule**: Monthly summaries, daily series, category breakdowns, and `amount` sorting operate on amounts normalized to the active `CurrencyCode` so sorting (`Highest Amount` / `Lowest Amount`) and chart totals accurately reflect converted values.

- **Interactive Component & State Mapping**:
  - **Setup & Export**: Renders the 3-currency segmented selector, displays fixed rate context, and invokes `onChangeCurrency(nextCurrency)` which updates app state, writes `localStorage`, syncs user metadata if authenticated, and triggers a confirmation toast.
  - **Expense Drawer**: Reads `activeCurrency` to set the symbol prefix, decimal step, validation rules, and conversion when editing an entry saved in another currency; submits `{ amount, currency: activeCurrency }`.
  - **Summary Strip, Charts & Ledger**: Consume converted expense amounts and `formatCurrency(amount, activeCurrency)` / `formatCompactCurrency(amount, activeCurrency)`.
  - **CSV Exporter**: Converts each row to `activeCurrency`, formats using `0` or `2` decimals accordingly, and sets the column header to `Amount (${activeCurrency})`.
