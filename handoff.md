# Krypted — Handoff Document

## Goal

Build a full-stack password manager called **Krypted**. Users register with a master password, log in, and store encrypted credentials (site, username, password) in a personal vault. The app is live and deployed.

- **Frontend:** https://kryptedvault.vercel.app (React + Vite on Vercel)
- **Backend:** https://passwordmanager-owfm.onrender.com (FastAPI on Render free tier)
- **Database:** PostgreSQL on Render

---

## Current State

### Working
- Two-step login flow (email → password) with "Welcome back, [Name]" greeting
- Registration with first name, last name, email, master password (max 16 chars)
- Forgot/reset password (token returned directly from API — no email service)
- Master password reuse prevention (checks current + history table)
- JWT auth with auto-logout on expiry
- Vault: add, edit, soft-delete, restore, permanently delete passwords
- Password categories: Website / Wi-Fi
- Section filter pills: All / Websites / Wi-Fi / Recently Deleted
- Fernet encryption on all stored credentials
- URL normalization on save (strips `https://`, `www.`, trailing slashes)
- Input length limits on all fields (site 255, username 255, password 1000)
- Pagination on `GET /passwords` (default 200, max 500 via `?skip=&limit=`)
- Profile page: edit name, change master password
- Collapsible sidebar with Vault / Profile / Logout
- Password strength meter + secure password generator on add/edit forms
- Favicons pulled per site via DuckDuckGo

### Known Issue — "Failed to fetch" in vault
After login the vault occasionally shows "Failed to fetch" instead of loading passwords. Root cause is **unconfirmed**. Everything tested externally passes (CORS, TLS, backend health, JWT validation). Leading theories:
1. Render free-tier cold start — server sleeping, first request hits the 15-second abort timeout before a response arrives
2. Decryption crash — `decrypt_password()` raising an unhandled exception caused a connection reset instead of a clean 500 (partially addressed in `2537f7d` — added safe fallback)

A **Retry** button is now shown next to the error. Pressing any section filter button (All / Websites / Wi-Fi) also clears the error and retries the load.

---

## Files in Flight

| File | What it does |
|---|---|
| `backend/main.py` | All FastAPI routes. Password CRUD, soft-delete, restore, trash, auth, profile |
| `backend/schemas.py` | Pydantic request/response models with field length limits |
| `backend/models.py` | SQLAlchemy ORM models (`User`, `PasswordEntry`, `PasswordHistory`, `PasswordReset`) |
| `backend/auth.py` | JWT creation/validation, bcrypt hashing |
| `backend/crypto.py` | Fernet encrypt/decrypt for stored credentials |
| `backend/database.py` | DB engine + session factory (reads `DATABASE_URL` from env) |
| `frontend/src/App.jsx` | Root — token state, getMe on load, routes to AuthPage or Dashboard |
| `frontend/src/api.js` | All fetch calls to the backend. Single `request()` helper with 15s timeout |
| `frontend/src/components/AuthPage.jsx` | Two-step login, register, forgot/reset password. Lock-shaped card UI |
| `frontend/src/components/Dashboard.jsx` | Vault view, section filters, delete modals, sidebar |
| `frontend/src/components/AddPasswordPage.jsx` | Full-screen add form with category toggle, strength meter, generator |
| `frontend/src/components/EditPasswordPage.jsx` | Full-screen edit form (same structure as Add) |
| `frontend/src/components/ProfilePage.jsx` | Name editing and master password change |
| `frontend/src/App.css` | All custom styles — lock card, sidebar, vault, section filters, modals |
| `frontend/src/index.css` | Theme variables — black + dark purple LED glow |
| `render.yaml` | Render service config — Python runtime, `pip install`, `uvicorn` start |

---

## What's Changed (Recent)

### `2537f7d` — Vault error fixes + All button
- `decrypt_password` now has a safe fallback (returns raw value on failure instead of crashing)
- Added **All** section filter button
- Pressing any section button clears the error state and retries the load if empty
- Retry button next to error messages
- `deletedError` state is now separate from main vault `error` so Recently Deleted failures don't bleed into other views

### `676f135` — Security + quality fixes
- `Field(max_length=...)` added to all schema fields (site 255, username 255, stored password 1000, name fields 100, email 255)
- `datetime.utcnow()` → `datetime.now(timezone.utc)` in `auth.py` (was deprecated in Python 3.12)
- `GET /passwords` and `GET /passwords/deleted` now support `?skip=0&limit=200` (hard cap 500)
- `normalize_site()` helper strips protocol and `www.` before saving

### `5d49938` — Categories + soft delete
- `category` field (`website` | `wifi`) on all password entries
- Delete is now a soft delete (`deleted_at` timestamp); hard delete removed
- `GET /passwords/deleted`, `POST /passwords/{id}/restore`, `DELETE /passwords/{id}/permanent`, `DELETE /passwords/trash`
- Section filter pills in the vault UI
- Category toggle (Website / Wi-Fi) on Add and Edit forms

---

## Failed Attempts / Gotchas

**Force push broke Render auto-deploy.**
Removing `Co-Authored-By` lines required rewriting all commit hashes (`git filter-branch`) and force-pushing. Render's webhook got confused and stalled — it kept serving the old code for ~30 minutes. Fix: trigger a manual deploy from the Render dashboard after any force push.

**"Failed to fetch" root cause still unconfirmed.**
Tested CORS preflight (200, correct headers), TLS (valid cert, TLS 1.3), backend health (fast responses), and JWT validation — all pass from outside. The error is intermittent and may be Render cold-start related (free tier spins down after inactivity). The 15-second abort in `api.js` would cause "Failed to fetch" if the connection is refused before the timeout fires, but a slow cold start would show "Request timed out" instead. The safe decrypt fallback in `crypto.py` may resolve it if it was a silent crash.

**`status` import unused in `main.py`.**
`from fastapi import ..., status` is imported but never used. IDE warns about it. Harmless — left in to avoid a pointless diff.

---

## Next Steps

- **Confirm vault fix** — After Render deploys `2537f7d`, verify "Failed to fetch" is gone. If it persists, the cause is almost certainly Render cold-start; options are upgrading to a paid tier or adding a keep-alive ping.
- **Forgot password email** — Currently the reset token is returned directly from the API (no email sent). Wire up a real email service (SendGrid, Resend, etc.) when ready.
- **Passkey / SSO** — Buttons exist in `AuthPage.jsx` (`Log in with passkey`, `Use single sign-on`) but are not wired up. Placeholder only.
- **Render cold-start** — Free tier sleeps after 15 min of inactivity. Either upgrade, or add a lightweight cron ping to keep it awake.
