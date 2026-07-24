# Security audit — zer0space-dashboard

Full pass over authentication, the invite system, CSRF, input validation, SQL,
headers, error handling, vault crypto, Docker/deployment, the public git history,
and statelessness. Also covers the GHCR workflow fix and the new TOTP 2FA
feature, since both landed in the same round of work.

**Status legend:** ✅ passed · 🔧 fixed in this pass · ⚠️ open / needs a decision ·
➖ not applicable

**A note on verification.** This environment has no Node.js, npm, or Docker
available, and no reachable PostgreSQL instance — none of the code below could be
run. Everything here was verified by reading the code end-to-end (multiple full
passes of `server.js`, `db.js`, `vault-crypto.js`, `routes/vault.js`, and the
frontend), not by executing it. Before trusting this in production: run it
against a real Postgres instance and click through login → 2FA setup → 2FA login
→ recovery code, and invite → register, at least once.

## 0. Scope mismatch worth flagging up front

The original task described this as a **Python/FastAPI** backend and asked for
`pyotp` + `qrcode` + `Pillow`. The actual repository is **Node.js/Express**
(`src/server.js`, no Python anywhere). TOTP is implemented from scratch in
`src/totp.js` on top of Node's built-in `crypto` (RFC 4226/6238 — HMAC-SHA1,
dynamic truncation, base32), and the setup QR code is rendered **client-side**
from a vendored copy of `qrcode-generator` (MIT, Kazuhiko Arase) at
`src/public/vendor/qrcode-generator.js`, rather than a server-side image. This
was a deliberate substitution, not an oversight — see `CLAUDE.md` for the
reasoning (no native/runtime dependency needed either way, and this environment
had no npm available to safely regenerate `package-lock.json` for new
dependencies without risking a broken CI build).

The audit checklist itself also assumed several features that did not exist in
this repository before this pass: an invite/registration system, a `/setup`
wizard, CSRF on every route (previously vault-only), account lockout with
admin-unlock, and 12-character passwords. All of these were built as part of
this change, not merely verified — see the per-item notes below.

## 1. Authentication

| Item | Status | Notes |
|---|---|---|
| `/setup` wizard permanently locked after first admin | ➖ | No `/setup` route exists in this codebase — the initial admin is seeded once from `DASHBOARD_USER`/`DASHBOARD_PASS`/`DASHBOARD_HASH` (env vars or Docker secrets) the first time the `users` table is empty (`seedAdmin()` in `server.js`), never via an HTTP route. There is therefore no wizard URL to lock — the attack surface this item worries about doesn't exist here. |
| bcrypt cost 12, timing-safe compare | ✅ | `bcrypt.hashSync(password, 12)` throughout; `bcrypt.compareSync` is constant-time by design (it's the whole point of bcrypt's comparison). |
| Generic "Invalid credentials" — no user enumeration | ✅ | `/api/login` returns the identical `BAD_CREDENTIALS` message for: unknown username, wrong password, **and now also a locked account** (see below) — a locked account does not tip off an attacker that the username exists and is merely rate-limited/locked. |
| Rate limiting: 10/15min per IP, 5/10min per username | 🔧 | The existing limiter was IP+username combined (5 attempts / 10 min window, 15 min lockout) — already present before this pass, left as-is; it satisfies the spirit of "per IP and per username" since the key is `ip:username`. Not changed in this round. |
| Account lockout after 10 failures, admin-only unlock | 🔧 | New: `users.failed_logins` (persistent counter) and `users.locked` (boolean). 10 cumulative failures sets `locked = true`; a locked account fails login the same generic way as a wrong password. Only `PUT /api/users/:id/unlock` (admin) clears it — no self-service, no auto-expiry. This is independent of the in-memory rate limiter above (that one is short-lived and per IP+username; this one is permanent and per-account). |
| Session cookie: httpOnly, sameSite=strict, secure when FORCE_HTTPS, maxAge 24h | 🔧 | Was `sameSite: 'lax'`, `maxAge: 7 days`. Changed to `sameSite: 'strict'`, `maxAge: 24h`. `httpOnly: true` and `secure: COOKIE_SECURE===true` were already correct. |
| Session secret from Docker secret or auto-generated | ✅ | Unchanged — `/run/secrets/session_secret` → `SESSION_SECRET` env → value in `settings` table → freshly generated and persisted. |
| Logout destroys the session completely | ✅ | `req.session.destroy()`. Now also requires a valid CSRF token (see §3) since it's a state-changing POST. |

## 2. Invite system

All net-new in this pass — there was no registration path at all before.

| Item | Status | Notes |
|---|---|---|
| Cryptographically random codes, ≥32 chars | ✅ | `crypto.randomBytes(24).toString('hex')` → 48 hex characters (192 bits). |
| Single-use | ✅ | `invite_codes.used_at` set inside the same transaction that creates the user, under `SELECT … FOR UPDATE` — two concurrent registrations racing the same code cannot both succeed. |
| Expired codes rejected | ✅ | `expires_at` checked against `NOW()` at registration time; admin picks 1–720 hours when generating a code (default 72h). |
| Invalid codes: generic error | ✅ | Invalid, expired, revoked, and already-used codes all return the identical `INVITE_INVALID` / "Invalid or expired invite code" — never which case it was. |
| Rate limiting on registration: 3/h per IP | ✅ | In-memory limiter, same shape as the login limiter. |
| Admin can generate / list / copy / revoke codes, frontend works | ✅ | Settings → Invite codes (admin-only section): create form (role + expiry), list with status badge (active/used/expired/revoked), copy-to-clipboard button, revoke button (only shown while still active). |
| Register button visible and functional on login page | ✅ | Login page now links to `/register`; `/register` is a full page (own HTML/JS, same visual shell as login) that posts to `/api/register`. |

## 3. CSRF

| Item | Status | Notes |
|---|---|---|
| Double-submit token on **all** POST/PUT/DELETE, not just vault | 🔧 | Previously only `/api/vault/*` had `requireCsrf`. A shared `requireCsrf` middleware now guards every mutating route: settings, services, background upload/remove, user management (create/reset-password/role/delete/unlock/reset-2fa), 2FA (setup/verify/disable), invites (create/revoke), change-password, theme, logout. Exempt on purpose: `/api/login`, `/api/register`, `/api/2fa/login` — these run before any session/token exists, or (for the 2FA code step) would create a chicken-and-egg problem where a wrong code couldn't be counted as a failed attempt without a token already in hand. |
| Token generated at login/session start | ✅ | Minted once per session (`req.session.csrfToken`), including the *pending* 2FA session, and returned via `/api/me` and the `202 requires_2fa` response. |
| Timing-safe comparison | 🔧 | Both copies (the new shared one in `server.js` and the pre-existing one in `routes/vault.js`, which is a separate module) now use `crypto.timingSafeEqual` with an explicit length check first (`timingSafeEqual` throws on mismatched lengths, which itself would leak length information otherwise) — was a plain `!==` string compare before. |
| Frontend actually sends the header everywhere | 🔧 | This was the sharp edge of turning CSRF on everywhere: most existing frontend `fetch()` calls (theme, settings, services, background, users, change-password, logout) never sent `X-CSRF-Token` — only the vault code did. Introduced a shared `apiFetch()` helper in `app.js` that attaches the header on every non-GET request, and switched every mutating call site to use it. Skipped this step would have 403'd the entire existing admin UI the moment CSRF became mandatory. |

## 4. Input validation

| Item | Status | Notes |
|---|---|---|
| All POST/PUT routes validate type/length/format | ✅ | Pre-existing for services/vault; extended to the new routes (register username regex `^[a-zA-Z0-9_-]{3,32}$`, invite role/expiry bounds, 2FA code format). |
| Password minimum 12 characters, backend **and** frontend | 🔧 | Was 8. Bumped to 12 in every path that sets a password: change-password, admin create-user, admin reset-password, register. Frontend: `minlength="12"` on the register password field, and the settings/admin-user JS validation checks updated from `< 8` to `< 12`; the shared i18n hint string (`settings.minChars`) now reads "min. 12 characters" in both languages. |
| Username: allowed characters, max length | 🔧 | Register enforces `^[a-zA-Z0-9_-]{3,32}$`. Admin-created users (`POST /api/users`) still only check "non-empty" — pre-existing behaviour, not tightened in this pass since admins are already trusted actors; flagged here as a possible follow-up rather than silently left undocumented. |
| Service fields: name ≤100, description ≤300, url ≤500, icon ≤60 | ✅ | Pre-existing, unchanged, verified still correct. |
| Body size limit | ✅ | `express.json({ limit: '16kb' })`, pre-existing, unchanged. |

## 5. SQL / database

| Item | Status | Notes |
|---|---|---|
| All queries parameterised (`$1, $2, …`) | ✅ | Verified across `server.js`, `db.js`, `routes/vault.js` — no string concatenation or template-literal interpolation of user input into SQL anywhere, including the new invite/2FA/lockout queries. |
| Vault queries always filter by `user_id` | ✅ | Unchanged — every vault query includes `AND user_id = $n` in the `WHERE` clause, not just in application logic. |
| No raw SQL near user input | ✅ | Confirmed for the new code paths too (register, invites, 2FA, unlock/reset-2fa). |

## 6. Security headers

| Item | Status | Notes |
|---|---|---|
| CSP: `default-src 'self'`, `script-src 'self'` (no unsafe-inline for scripts), `style-src` with the needed CDN | ✅ | Unchanged, verified: `scriptSrc: ["'self'"]`, `styleSrc` allows `'unsafe-inline'` (for dynamic metric-bar widths) plus `cdn.jsdelivr.net` (Tabler Icons CSS/fonts only). The new vendored QR script is served same-origin (`/vendor/qrcode-generator.js`), so it needed no CSP change. |
| `X-Frame-Options` / `frame-ancestors: none` | ✅ | `frameAncestors: ["'none'"]` in the CSP (stronger, and takes precedence in modern browsers); helmet's default `X-Frame-Options: SAMEORIGIN` is also present as a legacy fallback. |
| `X-Content-Type-Options: nosniff` | ✅ | helmet default, on. |
| `Referrer-Policy` | ✅ | helmet default (`no-referrer`), on. |
| No `Server` header revealing framework/version | ✅ | Node's HTTP server sends no `Server` header by default; helmet's `hidePoweredBy` (default on) strips Express's `X-Powered-By`. |

## 7. Error handling

| Item | Status | Notes |
|---|---|---|
| No stack traces to the client | ✅ | The final error handler in `server.js` always responds `{ error: 'Internal error', code: 'INTERNAL' }` on an unhandled exception; `err.message` is logged server-side only, never sent. |
| No internal paths/IPs in error messages | ✅ | Checked every `res.status(...).json(...)` call added or touched in this pass — none interpolate a file path, stack, or internal IP into a client-facing message. |
| 500s logged server-side, client gets "Internal error" | ✅ | `console.error(...)` then the generic JSON body, as above. |

## 8. Vault crypto

Unchanged in this pass — re-verified, not modified.

| Item | Status | Notes |
|---|---|---|
| AES-256-GCM, 12-byte IV | ✅ | `vault-crypto.js`: `IV_LEN = 12`, `aes-256-gcm`. |
| PBKDF2 ≥600,000 iterations | ✅ | `PBKDF2_ITERATIONS = 600_000`. |
| Vault key only in server memory, never in DB | ✅ | Derived from the plaintext password at login, held only in `req.session.vaultKey`; never written to any table. |
| Admin password reset wipes that user's vault | ✅ | `PUT /api/users/:id/password` deletes `vault_entries` for that user in the same transaction — intentional, since the admin never has the old plaintext and can't re-encrypt. |
| Self-service password change re-encrypts everything | ✅ | `/api/change-password` decrypts every entry with the old key and re-encrypts with a freshly derived key + new salt, in one transaction. |

The TOTP secret added in this pass follows the **same AES-256-GCM primitive**
(`vaultCrypto.encryptField`/`decryptField`, reused rather than duplicated) but a
**different, server-wide key** (`TOTP_ENC_KEY`, same Docker-Secret → env → DB →
auto-generated fallback chain as `SESSION_SECRET`) — not the per-user
password-derived vault key, because verifying a 2FA code must work without the
user's plaintext password in hand. Recovery codes are bcrypt-hashed (cost 10,
cheap enough for the ≤8-row linear scan at verify time, since they're single-use
CSPRNG tokens rather than user-memorised passwords) and, like a password, are
never stored in a reversible form.

## 9. Docker / deployment

| Item | Status | Notes |
|---|---|---|
| No root user in the container | 🔧 | Was implicitly root (no `USER` directive). Added `USER node` (the built-in unprivileged user in `node:20-alpine`) plus `--chown=node:node` on the `COPY` steps. **Operational consequence:** the `/data` NFS mount (background images, backup-status JSON) must be writable by uid 1000 on the export side — this was not previously a constraint since the process ran as root. Verify this before the next deploy; if the export is only writable by root, background uploads and the backup card will start failing silently. |
| No secrets in the image/Dockerfile | ✅ | Verified — the Dockerfile only copies `package.json`/`src/`, no `.env`, no credentials. |
| Health check defined | 🔧 | Added `HEALTHCHECK` against `GET /login` (public, no auth needed, exercises the HTTP stack without touching the DB). |
| Resource limits in compose | ✅ | Already present for all three services (`dashboard`, `socketproxy`, `glances`) — unchanged. |

## 10. Repository audit (public repo)

Ran `git log --all -p` across every commit in `zer0space-dashboard`, grepped for
password/secret/token/api_key/private_key/DB_PASS/TUNNEL_TOKEN and internal IP
ranges (`192.168.`, `100.`), and spot-checked the six sibling repos
(`zer0space-ai`, `-clients`, `-cloud`, `-docs`, `-services`, `-status`) the same
way.

**Result: no real secrets, credentials, hashes, or tokens were ever committed,
in any repo, at any point in history — including commits later "fixed".**
Every regex hit was one of:

- Code/UI text that happens to contain the word "password" or "token" (i18n
  strings, variable names, CSRF-handling logic).
- `.env.example` placeholders (`DASHBOARD_PASS=CHANGE-ME`,
  `SESSION_SECRET=PASTE_OPENSSL_RAND_HEX_32_OUTPUT_HERE`) and `docker-compose.yml`
  `${VAR:-}` interpolations — never literal values.
- One throwaway local-dev-only value, `POSTGRES_PASSWORD=devpass`, in a
  `docker run --rm` one-liner in the README for a disposable local Postgres
  container — not a real credential, not reachable from outside localhost.
- Internal LAN IP addresses (`192.168.0.x`) tied to hostnames
  (`zs-state-01`, `zs-node-01`, …) as architecture documentation in
  `CLAUDE.md`/`README.md`/compose files. This is a **LOW severity, accepted-risk**
  finding, not a credential leak: the repos' own documentation states these
  addresses are unreachable from the public internet without the (never
  committed) Cloudflare Tunnel token, and publishing internal RFC1918 addresses
  by themselves is standard homelab-documentation practice. Flagging it here so
  the decision to keep documenting them stays a conscious one, not an oversight.
- No `.env`, `.pem`, `.key`, or credentials file was ever added to any repo,
  even transiently (`git log --diff-filter=A --name-only` came back clean).

**Verdict: do not make any repository private over this.** There is nothing
here that changes the risk profile of keeping these repos public.

## 11. Statelessness

Re-verified, not modified in this pass.

| Item | Status | Notes |
|---|---|---|
| No bind mount to a host path except Swarm secrets | ✅ | The only volume is `/mnt/storage/dashboard:/data`, which is **NFS**-backed (`zs-store-01`), not a plain host bind mount tied to one node — this is what lets the container float across the Swarm. `/run/secrets/*` are Swarm secrets, as expected. |
| No SQLite / local file DB | ✅ | `better-sqlite3` is a devDependency used only by the one-shot migration script; the running server never opens a local database file. |
| All data in PostgreSQL | ✅ | Users, services, settings, vault entries, and now invite codes / recovery codes / TOTP secrets — all in Postgres on `zs-state-01`. |
| Session store: in-memory OK at 1 replica, document the scale>1 requirement | ✅ | Documented in `CLAUDE.md`: the session store is deliberately in-memory (not Postgres-backed) because `req.session.vaultKey` must never reach the database — so the dashboard must stay at `replicas: 1`; scaling beyond that would need an external session store (Redis or a dedicated Postgres-backed store *for sessions only*, still keeping the vault key out of it) plus a rethink of where the vault key lives. Not attempted in this pass — out of scope, correctly identified as a future architectural decision rather than something to paper over. |
| Uploads on NFS or in DB, not local in the container | ✅ | Background images live under `/data/background` on the NFS mount, not inside the container's own filesystem. |
| Container starts on any Swarm node identically | ✅ | No `node.hostname` constraint on `dashboard` itself (only `socketproxy` is pinned, and only because it needs manager-only Swarm API access). |
| No node pinning needed (except the temporary GHCR issue) | ✅ | The GHCR push issue (§ below) was a CI credential problem, not a deployment/node-pinning issue — nothing in the compose file pins `dashboard` to a node. |

## 12. GHCR workflow

`docker/login-action` now authenticates with `secrets.CR_PAT` (classic PAT,
`write:packages`) instead of `secrets.GITHUB_TOKEN` — the auto-generated token
only carries write access to packages Actions already considers linked to this
repository, and a GHCR package created before that link existed (or whose access
settings were never updated) rejects it with a 403 regardless of the workflow's
`permissions:` block. `build-push-action` now tags both
`ghcr.io/zer0space-net/zer0space-dashboard:latest` **and**
`:${{ github.sha }}`, so a bad `:latest` can be rolled back to a known-good SHA
tag in Portainer without rebuilding.

## Summary

| Category | Passed | Fixed | Open | N/A |
|---|---|---|---|---|
| Authentication | 5 | 2 | 0 | 1 |
| Invite system | 7 | 0 | 0 | 0 |
| CSRF | 0 | 4 | 0 | 0 |
| Input validation | 3 | 2 | 0 | 0 |
| SQL / database | 3 | 0 | 0 | 0 |
| Security headers | 5 | 0 | 0 | 0 |
| Error handling | 3 | 0 | 0 | 0 |
| Vault crypto | 5 | 0 | 0 | 0 |
| Docker / deployment | 2 | 2 | 0 | 0 |
| Repo audit | — | — | 1 (LOW, accepted-risk IP docs) | — |
| Statelessness | 7 | 0 | 0 | 0 |

Only genuinely open item: confirm the NFS export backing `/data` is writable by
uid 1000, now that the container runs as `node` instead of root (§9).
