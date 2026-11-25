# FinTracker — Bug Report & Future Fix Log

This document tracks reported UI/functional bugs, verified fixes, and known gaps queued for upcoming versions of FinTracker.

---

## Resolved in Current Web MVP

| ID | Area | Issue Summary | Resolution | Status |
| :--- | :--- | :--- | :--- | :--- |
| `BUG-001` | Authentication (`AuthGate`) | Password field lacked a show/hide visibility toggle on Sign In and Create Account forms. | Added accessible `Eye` / `EyeOff` visibility toggle button (`aria-label` + `aria-pressed`). | Fixed |
| `BUG-002` | Authentication (`AuthGate`) | Switching between Sign In and Create Account tabs retained previously typed email and password values. | Reset `email`, `password`, `showPassword`, `error`, and `notice` state when switching auth tabs. | Fixed |
| `BUG-003` | Authentication (`AuthGate` / `schema.sql`) | Missing Forgot Password flow and recovery password update handling. | Added hardened & rate-limited `check_email_registered` SQL RPC, unregistered-email Create Account prompt, reset email flow, and `PASSWORD_RECOVERY` update form. | Fixed |
| `BUG-006` | Currency & Localization (`currency` / `analytics` / `csv`) | Amounts and CSV exports were hardcoded to `USD ($)`. | Added 3-currency mode (`USD`, `THB`, `MMK`) in Setup & Export with fixed-rate conversion (`1 USD = 34.50 THB`, `1 USD = 4,400 MMK`), whole-number MMK formatting, account metadata + localStorage sync, and dynamic CSV headers. | Fixed |

---

## Open Bugs & Improvements for Future Versions

### `BUG-004` — Local-to-Supabase Data Migration Prompt
- **Severity**: Medium
- **Area**: Data Sync (`expenseStore` / `App`)
- **Current Behavior**: Entries logged in Local Browser Mode (`localStorage`) remain separate once Supabase environment keys are configured and the user signs in.
- **Expected Fix**: Detect non-empty `fintracker_local_expenses_v1` entries upon first authenticated Supabase session and offer a one-click "Import Local Entries to Account" action.

### `BUG-005` — Custom Date Range vs. Selected Month Precedence
- **Severity**: Low
- **Area**: Filtering (`FilterToolbar` / `analytics`)
- **Current Behavior**: When switching to `Custom Range` with dates outside `activeMonth`, summary KPIs still reflect `activeMonth` while the ledger table reflects the custom date range.
- **Expected Fix**: Display an explicit scope label on the Summary Strip or synchronize summary cards when `Custom Range` is active.

---

## Bug Report Template (For New Submissions)

```markdown
### [BUG-XXX] Short descriptive title
- **Severity**: Critical / High / Medium / Low
- **Environment**: Browser + OS, Local Mode vs. Supabase Mode
- **Steps to Reproduce**:
  1. ...
  2. ...
- **Actual Behavior**: ...
- **Expected Behavior**: ...
```
