'use strict';

const express = require('express');
const helmet  = require('helmet');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const db = require('./db');
const vaultCrypto = require('./vault-crypto');
const totp = require('./totp');
const createVaultRouter = require('./routes/vault');

const app = express();
const PORT = 3000;
// DATA_DIR is no longer the database location — the DB lives in PostgreSQL on
// zs-state-01. It still holds FILES that are not DB rows:
//   /data/background/    uploaded background images
//   /data/backup-status/ JSON written by backup.sh
// So the volume stays mounted; only services.db is gone.
const DATA_DIR = process.env.DATA_DIR || '/data';
const BG_DIR = path.join(DATA_DIR, 'background');
const PROXY_URL       = process.env.DOCKER_PROXY_URL || 'http://socketproxy:2375';
const GLANCES_SERVICE = process.env.GLANCES_SERVICE  || 'dashboard_glances';
const GLANCES_PORT    = process.env.GLANCES_PORT     || '61208';
const METRICS_TIMEOUT = 4000;

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(BG_DIR))   fs.mkdirSync(BG_DIR,   { recursive: true });

const readSecret = db.readSecret;

// ---- Async route helper ----
// Express 4 does not catch rejected promises from async handlers — without this
// wrapper a failed query becomes an unhandled rejection instead of a response.
const ah = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ---- First-run: seed admin ----
// Runs ONLY when the users table is completely empty (fresh DB).
// After that, DASHBOARD_USER / DASHBOARD_HASH / DASHBOARD_PASS are NEVER read again.
// All password changes via the UI are written to the DB and are permanent.
async function seedAdmin() {
  // COUNT(*) comes back as a bigint, which node-postgres returns as a STRING.
  // The ::int cast keeps this an actual number (a plain === 0 would never match).
  const { c: userCount } = await db.one('SELECT COUNT(*)::int AS c FROM users');
  if (userCount !== 0) return;

  const adminUser = process.env.DASHBOARD_USER;
  // Priority: Docker Secret / DASHBOARD_HASH (pre-computed bcrypt, preferred for production)
  //        → DASHBOARD_PASS (plaintext, hashed here at runtime, simpler for first-run setup)
  let adminHash = readSecret('dashboard_hash', 'DASHBOARD_HASH');
  if (!adminHash && process.env.DASHBOARD_PASS) {
    adminHash = bcrypt.hashSync(process.env.DASHBOARD_PASS, 12);
    console.log('[dashboard] DASHBOARD_PASS used — hashed at runtime. Use DASHBOARD_HASH for production.');
  }
  if (adminUser && adminHash) {
    if (!adminHash.startsWith('$2')) {
      console.error('[dashboard] DASHBOARD_HASH does not look like a bcrypt hash ($2...). Admin NOT created.');
    } else {
      await db.query('INSERT INTO users (username, hash, role) VALUES ($1, $2, $3)', [adminUser, adminHash, 'admin']);
      console.log(`[dashboard] Initial admin created: ${adminUser}`);
    }
  } else {
    console.error('[dashboard] WARNING: Set DASHBOARD_USER + DASHBOARD_PASS (or DASHBOARD_HASH) to create the initial admin.');
  }
}

// ---- Session secret ----
// Priority: Docker Secret → SESSION_SECRET env var → value stored in the DB →
// freshly generated and stored in the DB (so it survives restarts).
//
// If Postgres is unreachable at startup we fall back to an ephemeral secret so the
// server can still boot (see startup() below) — sessions then do not survive a
// restart until the DB is back. That is logged loudly rather than crashing.
async function getSessionSecret() {
  const fromSecret = readSecret('session_secret', 'SESSION_SECRET');
  if (fromSecret) return fromSecret;

  const row = await db.one("SELECT value FROM settings WHERE key = 'session_secret'");
  if (row) return row.value;

  const generated = crypto.randomBytes(32).toString('hex');
  // ON CONFLICT guards the race where two instances start at the same time:
  // the loser keeps the winner's value instead of overwriting it.
  const { rows } = await db.query(
    `INSERT INTO settings (key, value) VALUES ('session_secret', $1)
     ON CONFLICT (key) DO UPDATE SET value = settings.value
     RETURNING value`,
    [generated]
  );
  console.log('[dashboard] Auto-generated SESSION_SECRET stored in DB (persistent across restarts).');
  return rows[0].value;
}

// ---- TOTP secret encryption key ----
// Same priority pattern as getSessionSecret(): Docker Secret -> env var -> DB ->
// freshly generated. This key encrypts users.totp_secret at rest (AES-256-GCM via
// vault-crypto's generic encryptField/decryptField) so a raw DB dump alone does not
// hand over anyone's TOTP seed. Deliberately a SERVER-wide key, not derived from the
// user's password like the vault key: verifying a 2FA code (or an admin looking up
// whether 2FA is on) must work without the plaintext password in hand.
async function getTotpEncryptionKey() {
  const fromSecret = readSecret('totp_enc_key', 'TOTP_ENC_KEY');
  let material = fromSecret;
  if (!material) {
    const row = await db.one("SELECT value FROM settings WHERE key = 'totp_enc_key'");
    if (row) material = row.value;
  }
  if (!material) {
    const generated = crypto.randomBytes(32).toString('hex');
    const { rows } = await db.query(
      `INSERT INTO settings (key, value) VALUES ('totp_enc_key', $1)
       ON CONFLICT (key) DO UPDATE SET value = settings.value
       RETURNING value`,
      [generated]
    );
    material = rows[0].value;
    console.log('[dashboard] Auto-generated TOTP_ENC_KEY stored in DB (persistent across restarts).');
  }
  // Normalise arbitrary-length secret material (hex string, or an operator-supplied
  // passphrase) to exactly 32 bytes for AES-256.
  return crypto.createHash('sha256').update(material).digest();
}

// ---- Brute-force rate limiting (in-memory) ----

const loginAttempts = new Map(); // key: `ip:username` → { count, windowStart, lockedUntil }
const RATE_MAX    = 5;
const RATE_WINDOW = 10 * 60_000; // 10 min window
const RATE_LOCK   = 15 * 60_000; // 15 min lockout

function getRateKey(req, username) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
           || req.socket?.remoteAddress || 'unknown';
  return `${ip}:${username.toLowerCase()}`;
}

function checkRateLimit(key) {
  const now = Date.now();
  const e = loginAttempts.get(key);
  if (!e) return null;
  if (now < e.lockedUntil) return { locked: true, remaining: e.lockedUntil - now };
  if (now - e.windowStart > RATE_WINDOW) { loginAttempts.delete(key); return null; }
  return null;
}

function recordFailure(key) {
  const now = Date.now();
  const e = loginAttempts.get(key) || { count: 0, windowStart: now, lockedUntil: 0 };
  if (now - e.windowStart > RATE_WINDOW) { e.count = 0; e.windowStart = now; e.lockedUntil = 0; }
  e.count++;
  if (e.count >= RATE_MAX) e.lockedUntil = now + RATE_LOCK;
  loginAttempts.set(key, e);
}

function clearFailures(key) { loginAttempts.delete(key); }

// Periodic cleanup so the map doesn't grow unbounded
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of loginAttempts) {
    if (now > Math.max(v.lockedUntil, v.windowStart + RATE_WINDOW)) loginAttempts.delete(k);
  }
}, 30 * 60_000);

// ---- 2FA-verify rate limiting (in-memory) ----
// Separate from the login limiter above: this gates the TOTP-code-guessing step
// specifically (max 5 tries / 5 min per user), independent of the IP+username
// login limiter and the persistent DB lockout counter.
const twoFaAttempts = new Map(); // key: userId -> { count, windowStart }
const TWOFA_RATE_MAX    = 5;
const TWOFA_RATE_WINDOW = 5 * 60_000;

function checkTwoFaRateLimit(userId) {
  const now = Date.now();
  const e = twoFaAttempts.get(userId);
  if (!e) return null;
  if (now - e.windowStart > TWOFA_RATE_WINDOW) { twoFaAttempts.delete(userId); return null; }
  if (e.count >= TWOFA_RATE_MAX) return { remaining: e.windowStart + TWOFA_RATE_WINDOW - now };
  return null;
}

function recordTwoFaFailure(userId) {
  const now = Date.now();
  const e = twoFaAttempts.get(userId) || { count: 0, windowStart: now };
  if (now - e.windowStart > TWOFA_RATE_WINDOW) { e.count = 0; e.windowStart = now; }
  e.count++;
  twoFaAttempts.set(userId, e);
}

function clearTwoFaFailures(userId) { twoFaAttempts.delete(userId); }

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of twoFaAttempts) {
    if (now - v.windowStart > TWOFA_RATE_WINDOW) twoFaAttempts.delete(k);
  }
}, 30 * 60_000);

// ---- Registration rate limiting (in-memory, per IP — 3/hour) ----
const registerAttempts = new Map(); // key: ip -> { count, windowStart }
const REGISTER_RATE_MAX    = 3;
const REGISTER_RATE_WINDOW = 60 * 60_000;

function checkRegisterRateLimit(ip) {
  const now = Date.now();
  const e = registerAttempts.get(ip);
  if (!e) return null;
  if (now - e.windowStart > REGISTER_RATE_WINDOW) { registerAttempts.delete(ip); return null; }
  if (e.count >= REGISTER_RATE_MAX) return { remaining: e.windowStart + REGISTER_RATE_WINDOW - now };
  return null;
}

function recordRegisterAttempt(ip) {
  const now = Date.now();
  const e = registerAttempts.get(ip) || { count: 0, windowStart: now };
  if (now - e.windowStart > REGISTER_RATE_WINDOW) { e.count = 0; e.windowStart = now; }
  e.count++;
  registerAttempts.set(ip, e);
}

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of registerAttempts) {
    if (now - v.windowStart > REGISTER_RATE_WINDOW) registerAttempts.delete(k);
  }
}, 30 * 60_000);

// ---- Multer for background upload ----

const bgUpload = multer({
  dest: BG_DIR,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype));
  },
});

// ---- Middleware ----

// FORCE_HTTPS=true → HSTS + upgrade-insecure-requests active (use behind Cloudflare/TLS).
// FORCE_HTTPS=false (default) → neither sent; safe for plain HTTP on LAN/port 8080.
const forceHttps = process.env.FORCE_HTTPS === 'true';

// CSP: own assets + jsdelivr for Tabler Icons CSS/fonts.
// style-src needs 'unsafe-inline' for dynamic inline styles (metric-bar widths via innerHTML).
// script-src has no 'unsafe-inline' → injected inline scripts are blocked (XSS protection).
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:     ["'self'"],
      scriptSrc:      ["'self'"],
      styleSrc:       ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
      fontSrc:        ["'self'", 'https://cdn.jsdelivr.net'],
      imgSrc:         ["'self'", 'data:', 'blob:'],
      connectSrc:     ["'self'"],
      frameAncestors: ["'none'"],
      objectSrc:      ["'none'"],
      baseUri:        ["'self'"],
      formAction:     ["'self'"],
      // Only active when actually running behind HTTPS — prevents ERR_SSL_PROTOCOL_ERROR on HTTP.
      ...(forceHttps ? { upgradeInsecureRequests: [] } : {}),
    },
  },
  crossOriginEmbedderPolicy: false,
  // HSTS must not be sent over plain HTTP: once the browser stores it, it upgrades every
  // subsequent request to https:// — breaking CSS/JS on http://node:8080.
  // helmet v7+: option key is strictTransportSecurity (not hsts — that key is silently ignored).
  strictTransportSecurity: forceHttps ? { maxAge: 31536000, includeSubDomains: true } : false,
}));

app.use(express.json({ limit: '16kb' }));

// Static images (mascot logo, favicons) are content-stable: they only change when
// a new file is committed, so they get a long max-age instead of the revalidation
// round trip every page load would otherwise cost. Mounted before the general
// static handler so it wins for /img/*.
//
// Deliberately NOT applied to the HTML/JS/CSS below: this frontend has no build
// step and therefore no content hashes in filenames, so caching those would leave
// browsers on a stale bundle after a deploy.
app.use('/img', express.static(path.join(__dirname, 'public', 'img'), {
  maxAge: '30d',
  immutable: false,
}));

// { index: false } prevents express.static from auto-serving index.html for GET /
// without a session. The SPA root is served explicitly below, behind requireAuth.
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// The session middleware needs its secret up front, but the secret may have to be
// read from the DB (async). It is therefore built during startup() and delegated to
// here, so route registration below can stay at module level.
//
// NOTE: the store is deliberately the default in-memory store, NOT a Postgres-backed
// one. req.session holds the user's derived vault key (see /api/login) and that key
// must never reach the database — a DB-backed session store would write it there and
// break the vault threat model. Consequence: sessions are per-process, so the
// dashboard must stay at replicas: 1 and a restart logs everyone out.
let sessionMiddleware = null;
let totpEncKey = null; // set during startup() — see getTotpEncryptionKey()

// ---- Recovery codes (2FA fallback) ----
// 8 single-use codes generated once at 2FA setup, shown once, stored bcrypt-hashed
// (never plaintext, never reversible — unlike totp_secret they don't need to be
// decrypted, only compared against, so a one-way hash is the right tool here).
function generateRecoveryCodes(count = 8) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    const raw = crypto.randomBytes(5).toString('hex').toUpperCase(); // 10 hex chars
    codes.push(`${raw.slice(0, 5)}-${raw.slice(5)}`);
  }
  return codes;
}

async function storeRecoveryCodes(userId, codes) {
  await db.tx(async (client) => {
    await client.query('DELETE FROM recovery_codes WHERE user_id = $1', [userId]);
    for (const code of codes) {
      await client.query(
        'INSERT INTO recovery_codes (user_id, code_hash) VALUES ($1, $2)',
        [userId, bcrypt.hashSync(code, 10)]
      );
    }
  });
}

// Each unused code is bcrypt-hashed with its own salt, so lookup can't be indexed —
// there are at most 8 rows per user, so a linear compareSync scan is cheap enough.
// The UPDATE ... WHERE used_at IS NULL makes the "mark used" step atomic (no TOCTOU
// window where the same code could be consumed twice by parallel requests).
async function consumeRecoveryCode(userId, code) {
  const normalized = String(code).trim().toUpperCase();
  const rows = await db.all('SELECT id, code_hash FROM recovery_codes WHERE user_id = $1 AND used_at IS NULL', [userId]);
  for (const row of rows) {
    if (bcrypt.compareSync(normalized, row.code_hash)) {
      const r = await db.query('UPDATE recovery_codes SET used_at = NOW() WHERE id = $1 AND used_at IS NULL', [row.id]);
      return r.rowCount > 0;
    }
  }
  return false;
}
app.use((req, res, next) => {
  if (!sessionMiddleware) return res.status(503).json({ error: 'Server is still starting', code: 'STARTING' });
  return sessionMiddleware(req, res, next);
});

// ---- Auth + role helpers ----

function requireAuth(req, res, next) {
  if (req.session?.userId) return next();
  if (req.path.startsWith('/api/')) return res.status(401).json({ error: 'Not signed in', code: 'UNAUTHORIZED' });
  res.redirect('/login');
}

function requireAdmin(req, res, next) {
  if (req.session?.role !== 'admin')
    return res.status(403).json({ error: 'Not permitted (admin required)', code: 'FORBIDDEN_ADMIN' });
  next();
}

// ---- CSRF: double-submit token, session-bound ----
// Shared by every state-changing route below (not just /api/vault, which had its own
// copy of this before — kept here now so ALL POST/PUT/DELETE routes use one
// definition). The token is minted once per session (see /api/login and the
// pending-2FA session in /api/login below) and handed back via /api/me; the client
// echoes it in the X-CSRF-Token header on every mutating request.
// Login, register and the 2FA verify-code step are deliberately exempt: they either
// run before any session/token exists (login, register) or would otherwise create a
// chicken-and-egg problem (a wrong password/code must still count as a failed
// attempt without a valid token already in hand).
function requireCsrf(req, res, next) {
  const sent = req.headers['x-csrf-token'];
  const expected = req.session?.csrfToken;
  const sentBuf = Buffer.from(String(sent || ''));
  const expectedBuf = Buffer.from(String(expected || ''));
  const valid = sent && expected
    && sentBuf.length === expectedBuf.length
    && crypto.timingSafeEqual(sentBuf, expectedBuf);
  if (!valid) return res.status(403).json({ error: 'Invalid CSRF token', code: 'CSRF' });
  next();
}

// ---- Public routes ----

// login.js must be reachable before auth so the login page can load it.
app.get('/login.js', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'login.js')));

app.get('/login', (req, res) => {
  if (req.session?.userId) return res.redirect('/');
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Failed-login accounting shared by /api/login: bumps the persistent DB counter
// and locks the account at 10, independent of the short-lived in-memory rate
// limiter above. Kept generic on the response side — see requireCsrf comment for
// why login can't reveal *why* it failed (wrong password vs. locked account both
// come back as BAD_CREDENTIALS; only the admin user list shows the real lock state).
async function recordDbFailure(user) {
  await db.query(
    `UPDATE users SET failed_logins = failed_logins + 1,
       locked = CASE WHEN failed_logins + 1 >= 10 THEN true ELSE locked END,
       locked_at = CASE WHEN failed_logins + 1 >= 10 AND NOT locked THEN NOW() ELSE locked_at END
     WHERE id = $1`,
    [user.id]
  );
}

app.post('/api/login', ah(async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Input missing', code: 'INPUT_MISSING' });

  const key = getRateKey(req, username);
  const rate = checkRateLimit(key);
  if (rate?.locked) {
    const mins = Math.ceil(rate.remaining / 60_000);
    return res.status(429).json({ error: `Zu viele Versuche. Bitte ${mins} Minute(n) warten.` });
  }

  const user = await db.one('SELECT * FROM users WHERE username = $1', [username]);
  // Locked accounts fail the same generic way as a wrong password — the lock state
  // is only ever exposed to admins (user list), never to the person logging in.
  if (!user || user.locked || !bcrypt.compareSync(password, user.hash)) {
    recordFailure(key);
    if (user && !user.locked) await recordDbFailure(user);
    return res.status(401).json({ error: 'Wrong username or password', code: 'BAD_CREDENTIALS' });
  }

  clearFailures(key);
  if (user.failed_logins > 0) await db.query('UPDATE users SET failed_logins = 0 WHERE id = $1', [user.id]);

  if (user.totp_enabled) {
    // Step 1 of 2 passed. Do NOT set req.session.userId yet — requireAuth (and
    // therefore every /api/* route below it) keys off that field, so a pending
    // session cannot reach anything but /api/2fa/login. The vault key is likewise
    // not derived yet; it happens only once the full session is established below.
    req.session.pending2faUserId = user.id;
    req.session.pending2faPassword = password; // kept only until /api/2fa/login succeeds — needed to derive the vault key without a second password prompt
    req.session.pending2faExpires = Date.now() + 5 * 60_000;
    if (!req.session.csrfToken) req.session.csrfToken = crypto.randomBytes(32).toString('hex');
    return res.status(202).json({ requires_2fa: true, csrfToken: req.session.csrfToken });
  }

  req.session.userId   = user.id;
  req.session.username = user.username;
  req.session.role     = user.role || 'viewer';

  // Derive this user's vault encryption key from their plaintext password
  // (only available here, before it goes out of scope) + their PBKDF2 salt.
  // The key lives ONLY in the server-side session — never written to the DB.
  let vaultSalt = user.vault_salt;
  if (!vaultSalt) {
    vaultSalt = vaultCrypto.newSalt();
    await db.query('UPDATE users SET vault_salt = $1 WHERE id = $2', [vaultSalt, user.id]);
  }
  req.session.vaultKey = vaultCrypto.deriveVaultKey(password, vaultSalt).toString('base64');

  // CSRF token for state-changing requests (double-submit pattern). Generated
  // once per session, returned via /api/me.
  if (!req.session.csrfToken) req.session.csrfToken = crypto.randomBytes(32).toString('hex');

  res.json({ ok: true, role: user.role });
}));

// Step 2 of the 2FA login flow. Deliberately mounted BEFORE app.use(requireAuth):
// req.session.userId is not set yet at this point, only pending2faUserId from
// step 1, so this route (and only this route) is reachable in that state.
app.post('/api/2fa/login', ah(async (req, res) => {
  const pendingId = req.session.pending2faUserId;
  if (!pendingId || Date.now() > (req.session.pending2faExpires || 0)) {
    return res.status(401).json({ error: 'Session expired — please log in again', code: 'TWOFA_SESSION_EXPIRED' });
  }

  const rate = checkTwoFaRateLimit(pendingId);
  if (rate) {
    const mins = Math.ceil(rate.remaining / 60_000);
    return res.status(429).json({ error: `Zu viele Versuche. Bitte ${mins} Minute(n) warten.` });
  }

  const { code } = req.body || {};
  const user = await db.one('SELECT * FROM users WHERE id = $1', [pendingId]);
  const password = req.session.pending2faPassword;
  if (!user || !user.totp_enabled) {
    return res.status(401).json({ error: 'Session expired — please log in again', code: 'TWOFA_SESSION_EXPIRED' });
  }

  const secret = user.totp_secret ? vaultCrypto.decryptField(user.totp_secret, totpEncKey) : null;
  const validCode = secret && totp.verifyTotp(secret, String(code || ''), { window: 1 });
  const validRecovery = !validCode && typeof code === 'string' && await consumeRecoveryCode(user.id, code);

  if (!validCode && !validRecovery) {
    recordTwoFaFailure(pendingId);
    return res.status(401).json({ error: 'Invalid code', code: 'TWOFA_INVALID' });
  }
  clearTwoFaFailures(pendingId);

  delete req.session.pending2faUserId;
  delete req.session.pending2faPassword;
  delete req.session.pending2faExpires;

  req.session.userId   = user.id;
  req.session.username = user.username;
  req.session.role     = user.role || 'viewer';

  let vaultSalt = user.vault_salt;
  if (!vaultSalt) {
    vaultSalt = vaultCrypto.newSalt();
    await db.query('UPDATE users SET vault_salt = $1 WHERE id = $2', [vaultSalt, user.id]);
  }
  req.session.vaultKey = vaultCrypto.deriveVaultKey(password, vaultSalt).toString('base64');
  if (!req.session.csrfToken) req.session.csrfToken = crypto.randomBytes(32).toString('hex');

  res.json({ ok: true, role: user.role, usedRecoveryCode: validRecovery });
}));

app.post('/api/logout', requireCsrf, (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// register.html/js must be reachable before auth, same reasoning as login.js above.
app.get('/register.js', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'register.js')));
app.get('/register', (req, res) => {
  if (req.session?.userId) return res.redirect('/');
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
}

// Public, invite-gated self-registration. Rate-limited per IP (3/h) on top of the
// invite code itself being single-use — the limiter mainly guards against someone
// grinding through guesses of a not-yet-used code.
app.post('/api/register', ah(async (req, res) => {
  const ip = getClientIp(req);
  const rate = checkRegisterRateLimit(ip);
  if (rate) {
    const mins = Math.ceil(rate.remaining / 60_000);
    return res.status(429).json({ error: `Zu viele Versuche. Bitte ${mins} Minute(n) warten.` });
  }
  recordRegisterAttempt(ip);

  const { inviteCode, username, password } = req.body || {};
  if (!inviteCode || !username || !password) return res.status(400).json({ error: 'Fields missing', code: 'FIELDS_MISSING' });
  if (!/^[a-zA-Z0-9_-]{3,32}$/.test(username)) return res.status(400).json({ error: 'Invalid username', code: 'USERNAME_INVALID' });
  if (password.length < 12) return res.status(400).json({ error: 'Password must be at least 12 characters', code: 'PW_TOO_SHORT' });

  // FOR UPDATE locks the invite row for the duration of the transaction — two
  // concurrent registrations racing on the same code can't both pass the
  // used_at/expired/revoked check before either commits.
  const result = await db.tx(async (client) => {
    const { rows } = await client.query('SELECT * FROM invite_codes WHERE code = $1 FOR UPDATE', [inviteCode]);
    const invite = rows[0];
    if (!invite || invite.revoked || invite.used_at || new Date(invite.expires_at) < new Date()) {
      return { error: 'invalid' };
    }
    const { rows: existing } = await client.query('SELECT id FROM users WHERE username = $1', [username.trim()]);
    if (existing[0]) return { error: 'taken' };
    const { rows: userRows } = await client.query(
      `INSERT INTO users (username, hash, role) VALUES ($1, $2, $3) RETURNING id, username, role`,
      [username.trim(), bcrypt.hashSync(password, 12), invite.role]
    );
    await client.query('UPDATE invite_codes SET used_at = NOW(), used_by = $1 WHERE id = $2', [userRows[0].id, invite.id]);
    return { user: userRows[0] };
  });

  // Invalid, expired, revoked AND already-used codes all get the exact same generic
  // message — never reveal which, so a guesser can't distinguish "wrong" from
  // "right but already spent".
  if (result.error === 'invalid') return res.status(400).json({ error: 'Invalid or expired invite code', code: 'INVITE_INVALID' });
  if (result.error === 'taken')   return res.status(409).json({ error: 'Username already taken', code: 'USERNAME_TAKEN' });

  res.status(201).json({ ok: true, username: result.user.username });
}));

// ---- Protected zone ----

app.use(requireAuth);

// SPA root — only reachable after requireAuth passes (valid dashboard session).
// Cloudflare Access alone is not sufficient; a real dashboard login is required.
app.get('/', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// ---- Any authenticated user ----

app.get('/api/me', ah(async (req, res) => {
  const user = await db.one('SELECT username, role, theme, totp_enabled FROM users WHERE id = $1', [req.session.userId]);
  res.json({
    username:  user?.username || req.session.username,
    role:      user?.role     || req.session.role || 'viewer',
    theme:     user?.theme    || null,
    csrfToken: req.session.csrfToken || null,
    vaultUnlocked: Boolean(req.session.vaultKey),
    totpEnabled: Boolean(user?.totp_enabled),
  });
}));

app.post('/api/change-password', requireCsrf, ah(async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Fields missing', code: 'FIELDS_MISSING' });
  if (newPassword.length < 12) return res.status(400).json({ error: 'Password must be at least 12 characters', code: 'PW_TOO_SHORT' });
  const user = await db.one('SELECT * FROM users WHERE id = $1', [req.session.userId]);
  if (!user || !bcrypt.compareSync(currentPassword, user.hash))
    return res.status(401).json({ error: 'Current password is wrong', code: 'PW_CURRENT_WRONG' });

  // Self-service password change is the ONE place we still hold both the old
  // and the new plaintext password in the same request, so the vault can be
  // re-encrypted losslessly. Rotate the salt too (fresh key, not just a
  // re-derivation with the same salt).
  const newSalt = vaultCrypto.newSalt();
  const newKey  = req.session.vaultKey ? vaultCrypto.deriveVaultKey(newPassword, newSalt) : null;

  // Re-encryption and the password/salt update run in ONE transaction: a crash
  // in between would otherwise leave entries encrypted with the old key while
  // the salt already points at the new one — permanently undecryptable.
  await db.tx(async (client) => {
    if (newKey) {
      const oldKey = Buffer.from(req.session.vaultKey, 'base64');
      const { rows } = await client.query('SELECT * FROM vault_entries WHERE user_id = $1', [user.id]);
      for (const row of rows) {
        const pw    = vaultCrypto.decryptField(row.encrypted_password, oldKey);
        const notes = vaultCrypto.decryptField(row.encrypted_notes, oldKey);
        // pw/notes === null would mean the OLD key itself was already wrong
        // (shouldn't happen here — it was just used to unlock the vault at
        // login). Skip defensively rather than encrypt garbage.
        if (pw === null || notes === null) continue;
        await client.query(
          'UPDATE vault_entries SET encrypted_password = $1, encrypted_notes = $2 WHERE id = $3 AND user_id = $4',
          [vaultCrypto.encryptField(pw, newKey), vaultCrypto.encryptField(notes, newKey), row.id, user.id]
        );
      }
    }
    await client.query(
      'UPDATE users SET hash = $1, vault_salt = $2 WHERE id = $3',
      [bcrypt.hashSync(newPassword, 12), newSalt, user.id]
    );
  });

  // Only swap the in-session key after the transaction committed.
  if (newKey) req.session.vaultKey = newKey.toString('base64');
  res.json({ ok: true });
}));

// ---- 2FA (TOTP) — setup / verify / disable ----
// All three require a full session (mounted after requireAuth) and the current
// password, on top of the session already being authenticated — enabling or
// disabling a second factor is sensitive enough to re-confirm identity even when
// a valid session cookie is presented (covers a hijacked-but-unlocked browser tab).

app.post('/api/2fa/setup', requireCsrf, ah(async (req, res) => {
  const { password } = req.body || {};
  if (!password) return res.status(400).json({ error: 'Current password required', code: 'PW_REQUIRED' });
  const user = await db.one('SELECT * FROM users WHERE id = $1', [req.session.userId]);
  if (!user || !bcrypt.compareSync(password, user.hash))
    return res.status(401).json({ error: 'Current password is wrong', code: 'PW_CURRENT_WRONG' });
  if (user.totp_enabled) return res.status(409).json({ error: '2FA is already enabled', code: 'TWOFA_ALREADY_ENABLED' });

  // The secret is held in the SESSION only until /api/2fa/verify confirms the user
  // actually scanned it and can produce a valid code — it is NOT written to the DB
  // yet, so an abandoned setup leaves no trace and can just be started over.
  const secret = totp.generateSecret();
  req.session.pendingTotpSecret = secret;
  res.json({ secret, otpauthUrl: totp.buildOtpauthUri({ secret, username: user.username }) });
}));

app.post('/api/2fa/verify', requireCsrf, ah(async (req, res) => {
  const { code } = req.body || {};
  const secret = req.session.pendingTotpSecret;
  if (!secret) return res.status(409).json({ error: 'No 2FA setup in progress', code: 'TWOFA_NO_SETUP' });

  const rate = checkTwoFaRateLimit(req.session.userId);
  if (rate) {
    const mins = Math.ceil(rate.remaining / 60_000);
    return res.status(429).json({ error: `Zu viele Versuche. Bitte ${mins} Minute(n) warten.` });
  }

  if (!totp.verifyTotp(secret, String(code || ''), { window: 1 })) {
    recordTwoFaFailure(req.session.userId);
    return res.status(401).json({ error: 'Invalid code', code: 'TWOFA_INVALID' });
  }
  clearTwoFaFailures(req.session.userId);

  const recoveryCodes = generateRecoveryCodes(8);
  await db.tx(async (client) => {
    await client.query(
      'UPDATE users SET totp_secret = $1, totp_enabled = true WHERE id = $2',
      [vaultCrypto.encryptField(secret, totpEncKey), req.session.userId]
    );
  });
  await storeRecoveryCodes(req.session.userId, recoveryCodes);
  delete req.session.pendingTotpSecret;

  // recoveryCodes are returned exactly once, in this response — there is no route
  // that can ever retrieve them again (only bcrypt hashes are stored).
  res.json({ ok: true, recoveryCodes });
}));

app.post('/api/2fa/disable', requireCsrf, ah(async (req, res) => {
  const { password, code } = req.body || {};
  if (!password || !code) return res.status(400).json({ error: 'Password and code required', code: 'FIELDS_MISSING' });

  const user = await db.one('SELECT * FROM users WHERE id = $1', [req.session.userId]);
  if (!user || !bcrypt.compareSync(password, user.hash))
    return res.status(401).json({ error: 'Current password is wrong', code: 'PW_CURRENT_WRONG' });
  if (!user.totp_enabled) return res.status(409).json({ error: '2FA is not enabled', code: 'TWOFA_NOT_ENABLED' });

  const rate = checkTwoFaRateLimit(req.session.userId);
  if (rate) {
    const mins = Math.ceil(rate.remaining / 60_000);
    return res.status(429).json({ error: `Zu viele Versuche. Bitte ${mins} Minute(n) warten.` });
  }

  const secret = vaultCrypto.decryptField(user.totp_secret, totpEncKey);
  if (!secret || !totp.verifyTotp(secret, String(code), { window: 1 })) {
    recordTwoFaFailure(req.session.userId);
    return res.status(401).json({ error: 'Invalid code', code: 'TWOFA_INVALID' });
  }
  clearTwoFaFailures(req.session.userId);

  await db.tx(async (client) => {
    await client.query('UPDATE users SET totp_secret = NULL, totp_enabled = false WHERE id = $1', [req.session.userId]);
    await client.query('DELETE FROM recovery_codes WHERE user_id = $1', [req.session.userId]);
  });
  res.json({ ok: true });
}));

// Save own theme preference (any authenticated user)
app.put('/api/user/theme', requireCsrf, ah(async (req, res) => {
  const { theme } = req.body || {};
  if (!theme) return res.status(400).json({ error: 'Theme required', code: 'THEME_REQUIRED' });
  await db.query('UPDATE users SET theme = $1 WHERE id = $2', [theme, req.session.userId]);
  res.json({ ok: true });
}));

app.get('/api/settings', ah(async (_req, res) => {
  const out = {};
  (await db.all('SELECT key, value FROM settings')).forEach(r => { out[r.key] = r.value; });
  res.json(out);
}));

app.get('/api/services', ah(async (_req, res) => {
  res.json(await db.all('SELECT * FROM services ORDER BY id'));
}));

app.get('/api/background', ah(async (_req, res) => {
  const row = await db.one("SELECT value FROM settings WHERE key = 'bg_file'");
  if (!row) return res.status(404).end();
  const file = path.join(BG_DIR, path.basename(row.value));
  if (!fs.existsSync(file)) return res.status(404).end();
  res.sendFile(file);
}));

// Vault (native password manager) — every route here inherits requireAuth
// from app.use(requireAuth) above; CSRF + vault-key checks happen inside.
app.use('/api/vault', createVaultRouter(db));

app.get('/api/status', async (_req, res) => {
  try {
    const [nr, sr, tr] = await Promise.all([
      fetch(`${PROXY_URL}/nodes`),
      fetch(`${PROXY_URL}/services`),
      fetch(`${PROXY_URL}/tasks`),
    ]);
    const [nodes, services, tasks] = await Promise.all([nr.json(), sr.json(), tr.json()]);
    const nodesOnline = nodes.filter(n => n.Status?.State === 'ready').length;
    const serviceStatus = services.map(s => ({
      id: s.ID, name: s.Spec?.Name ?? '',
      running: tasks.filter(t => t.ServiceID === s.ID && t.Status?.State === 'running').length,
      desired: s.Spec?.Mode?.Replicated?.Replicas ?? 1,
    }));
    res.json({ nodesOnline, servicesActive: services.length, serviceStatus });
  } catch {
    res.status(503).json({ error: 'Docker proxy unavailable', code: 'PROXY_UNAVAILABLE' });
  }
});

// ---- Admin-only routes ----

app.put('/api/settings', requireAdmin, requireCsrf, ah(async (req, res) => {
  const { key, value } = req.body || {};
  if (!key || value === undefined) return res.status(400).json({ error: 'Key and value required', code: 'KEY_VALUE_REQUIRED' });
  await db.query(
    `INSERT INTO settings (key, value) VALUES ($1, $2)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [key, String(value)]
  );
  res.json({ ok: true });
}));

function validateServiceInput({ name, description, url, icon }) {
  if (typeof name !== 'string' || !name.trim())                     return 'name required';
  if (name.length > 100)                                            return 'name too long';
  if (typeof description !== 'string' || description.length > 300)  return 'description too long';
  if (typeof url !== 'string'         || url.length > 500)          return 'url too long';
  if (typeof icon !== 'string'        || icon.length > 60)          return 'icon too long';
  return null;
}

app.post('/api/services', requireAdmin, requireCsrf, ah(async (req, res) => {
  const { name, description = '', url = '', icon = 'layout-dashboard', status = 'unknown' } = req.body ?? {};
  const err = validateServiceInput({ name, description, url, icon });
  if (err) return res.status(400).json({ error: err });
  // RETURNING * replaces SQLite's lastInsertRowid + follow-up SELECT.
  const row = await db.one(
    `INSERT INTO services (name, description, url, icon, status)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [name.trim(), description.trim(), url.trim(), icon.trim() || 'layout-dashboard', status]
  );
  res.status(201).json(row);
}));

app.put('/api/services/:id', requireAdmin, requireCsrf, ah(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Invalid id', code: 'INVALID_ID' });
  const { name, description = '', url = '', icon = 'layout-dashboard', status = 'unknown' } = req.body ?? {};
  const err = validateServiceInput({ name, description, url, icon });
  if (err) return res.status(400).json({ error: err });
  const row = await db.one(
    `UPDATE services SET name = $1, description = $2, url = $3, icon = $4, status = $5
     WHERE id = $6 RETURNING *`,
    [name.trim(), description.trim(), url.trim(), icon.trim() || 'layout-dashboard', status, id]
  );
  if (!row) return res.status(404).json({ error: 'Service not found', code: 'SERVICE_NOT_FOUND' });
  res.json(row);
}));

app.delete('/api/services/:id', requireAdmin, requireCsrf, ah(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Invalid id', code: 'INVALID_ID' });
  await db.query('DELETE FROM services WHERE id = $1', [id]);
  res.sendStatus(204);
}));

app.post('/api/background', requireAdmin, requireCsrf, bgUpload.single('image'), ah(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file or invalid type (JPG/PNG/WebP)', code: 'BAD_UPLOAD' });
  const extMap = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
  const ext  = extMap[req.file.mimetype] || 'jpg';
  const dest = path.join(BG_DIR, `background.${ext}`);
  ['jpg', 'png', 'webp'].forEach(e => {
    const old = path.join(BG_DIR, `background.${e}`);
    try { if (fs.existsSync(old)) fs.unlinkSync(old); } catch {}
  });
  try { fs.renameSync(req.file.path, dest); } catch {
    fs.unlinkSync(req.file.path);
    return res.status(500).json({ error: 'Storage error', code: 'STORAGE_ERROR' });
  }
  await db.query(
    `INSERT INTO settings (key, value) VALUES ('bg_mode', 'image')
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`
  );
  await db.query(
    `INSERT INTO settings (key, value) VALUES ('bg_file', $1)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [`background.${ext}`]
  );
  res.json({ ok: true });
}));

app.delete('/api/background', requireAdmin, requireCsrf, ah(async (_req, res) => {
  const row = await db.one("SELECT value FROM settings WHERE key = 'bg_file'");
  if (row) {
    const file = path.join(BG_DIR, path.basename(row.value));
    try { if (fs.existsSync(file)) fs.unlinkSync(file); } catch {}
  }
  await db.query("DELETE FROM settings WHERE key IN ('bg_mode', 'bg_file')");
  res.json({ ok: true });
}));

// User management (admin only)

app.get('/api/users', requireAdmin, ah(async (_req, res) => {
  res.json(await db.all('SELECT id, username, role, totp_enabled, locked FROM users ORDER BY id'));
}));

app.post('/api/users', requireAdmin, requireCsrf, ah(async (req, res) => {
  const { username, password, role } = req.body || {};
  if (!username?.trim() || !password) return res.status(400).json({ error: 'Fields missing', code: 'FIELDS_MISSING' });
  if (password.length < 12) return res.status(400).json({ error: 'Password must be at least 12 characters', code: 'PW_TOO_SHORT' });
  if (!['admin', 'viewer'].includes(role)) return res.status(400).json({ error: 'Invalid role', code: 'INVALID_ROLE' });
  // ON CONFLICT instead of a SELECT-then-INSERT: the UNIQUE index decides, so two
  // concurrent requests for the same name can't both get past a pre-check.
  const row = await db.one(
    `INSERT INTO users (username, hash, role) VALUES ($1, $2, $3)
     ON CONFLICT (username) DO NOTHING
     RETURNING id, username, role`,
    [username.trim(), bcrypt.hashSync(password, 12), role]
  );
  if (!row) return res.status(409).json({ error: 'Username already taken', code: 'USERNAME_TAKEN' });
  res.status(201).json(row);
}));

app.put('/api/users/:id/password', requireAdmin, requireCsrf, ah(async (req, res) => {
  const id = Number(req.params.id);
  const { password } = req.body || {};
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Invalid id', code: 'INVALID_ID' });
  if (!password || password.length < 12) return res.status(400).json({ error: 'Password must be at least 12 characters', code: 'PW_TOO_SHORT' });

  // Admin-forced reset: the admin never has the target user's OLD plaintext
  // password, so their vault key can't be re-derived and the existing vault
  // entries become permanently undecryptable. Wipe them instead of leaving
  // dead ciphertext rows around, and rotate the salt for the next login.
  const updated = await db.tx(async (client) => {
    const { rows } = await client.query('SELECT id FROM users WHERE id = $1', [id]);
    if (!rows[0]) return false;
    await client.query('DELETE FROM vault_entries WHERE user_id = $1', [id]);
    await client.query(
      'UPDATE users SET hash = $1, vault_salt = $2, failed_logins = 0, locked = false, locked_at = NULL WHERE id = $3',
      [bcrypt.hashSync(password, 12), vaultCrypto.newSalt(), id]
    );
    return true;
  });
  if (!updated) return res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
  res.json({ ok: true, vaultWiped: true });
}));

// Admin unlock: clears the persistent lockout counter set by recordDbFailure()
// after 10 failed attempts. This is the ONLY way a locked account becomes usable
// again — there is no self-service or time-based auto-unlock by design.
app.put('/api/users/:id/unlock', requireAdmin, requireCsrf, ah(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Invalid id', code: 'INVALID_ID' });
  const row = await db.one(
    'UPDATE users SET locked = false, locked_at = NULL, failed_logins = 0 WHERE id = $1 RETURNING id',
    [id]
  );
  if (!row) return res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
  res.json({ ok: true });
}));

// Admin 2FA reset: for when the user loses their authenticator device. Drops the
// encrypted secret and every recovery code — the user re-enrolls from scratch via
// /api/2fa/setup on their next login (2FA is optional per-user, so this does not
// re-lock them out of the account, just turns TOTP back off for them).
app.put('/api/users/:id/reset-2fa', requireAdmin, requireCsrf, ah(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Invalid id', code: 'INVALID_ID' });
  const updated = await db.tx(async (client) => {
    const { rows } = await client.query('SELECT id FROM users WHERE id = $1', [id]);
    if (!rows[0]) return false;
    await client.query('UPDATE users SET totp_secret = NULL, totp_enabled = false WHERE id = $1', [id]);
    await client.query('DELETE FROM recovery_codes WHERE user_id = $1', [id]);
    return true;
  });
  if (!updated) return res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
  res.json({ ok: true });
}));

app.put('/api/users/:id/role', requireAdmin, requireCsrf, ah(async (req, res) => {
  const id = Number(req.params.id);
  const { role } = req.body || {};
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Invalid id', code: 'INVALID_ID' });
  if (!['admin', 'viewer'].includes(role)) return res.status(400).json({ error: 'Invalid role', code: 'INVALID_ROLE' });

  // The last-admin check and the update must be atomic — otherwise two parallel
  // demotions could both pass the check and leave the system without an admin.
  const result = await db.tx(async (client) => {
    const { rows } = await client.query('SELECT role FROM users WHERE id = $1 FOR UPDATE', [id]);
    if (!rows[0]) return 'notfound';
    if (rows[0].role === 'admin' && role !== 'admin') {
      const { rows: cnt } = await client.query("SELECT COUNT(*)::int AS c FROM users WHERE role = 'admin'");
      if (cnt[0].c <= 1) return 'lastadmin';
    }
    await client.query('UPDATE users SET role = $1 WHERE id = $2', [role, id]);
    return 'ok';
  });
  if (result === 'notfound')  return res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
  if (result === 'lastadmin') return res.status(400).json({ error: 'The last admin cannot be demoted', code: 'LAST_ADMIN_DEMOTE' });
  res.json({ ok: true });
}));

app.delete('/api/users/:id', requireAdmin, requireCsrf, ah(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Invalid id', code: 'INVALID_ID' });
  if (id === req.session.userId)
    return res.status(400).json({ error: 'You cannot delete your own account', code: 'SELF_DELETE' });

  const result = await db.tx(async (client) => {
    const { rows } = await client.query('SELECT role FROM users WHERE id = $1 FOR UPDATE', [id]);
    if (!rows[0]) return 'notfound';
    if (rows[0].role === 'admin') {
      const { rows: cnt } = await client.query("SELECT COUNT(*)::int AS c FROM users WHERE role = 'admin'");
      if (cnt[0].c <= 1) return 'lastadmin';
    }
    // Explicit cleanup before the user row goes — vault_entries/recovery_codes
    // reference users(id) with no ON DELETE CASCADE, and invite_codes.created_by/
    // used_by would otherwise block the delete outright (kept as NULL instead of
    // deleting invite history, so revoked/used invites stay auditable).
    await client.query('DELETE FROM vault_entries WHERE user_id = $1', [id]);
    await client.query('DELETE FROM recovery_codes WHERE user_id = $1', [id]);
    await client.query('UPDATE invite_codes SET created_by = NULL WHERE created_by = $1', [id]);
    await client.query('UPDATE invite_codes SET used_by = NULL WHERE used_by = $1', [id]);
    await client.query('DELETE FROM users WHERE id = $1', [id]);
    return 'ok';
  });
  if (result === 'notfound')  return res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
  if (result === 'lastadmin') return res.status(400).json({ error: 'The last admin cannot be deleted', code: 'LAST_ADMIN_DELETE' });
  res.json({ ok: true });
}));

// ---- Invite codes (admin only) ----
// Self-registration is invite-gated: an admin mints a code, hands it to the new
// user out-of-band (chat, in person), and /api/register (public, above) consumes it.

app.get('/api/invites', requireAdmin, ah(async (_req, res) => {
  res.json(await db.all(
    `SELECT i.id, i.code, i.role, i.created_at, i.expires_at, i.used_at, i.revoked,
            creator.username AS created_by_username, used.username AS used_by_username
     FROM invite_codes i
     LEFT JOIN users creator ON creator.id = i.created_by
     LEFT JOIN users used    ON used.id    = i.used_by
     ORDER BY i.created_at DESC`
  ));
}));

app.post('/api/invites', requireAdmin, requireCsrf, ah(async (req, res) => {
  const { role = 'viewer', expiresInHours = 72 } = req.body || {};
  if (!['admin', 'viewer'].includes(role)) return res.status(400).json({ error: 'Invalid role', code: 'INVALID_ROLE' });
  const hours = Number(expiresInHours);
  if (!Number.isFinite(hours) || hours < 1 || hours > 24 * 30) {
    return res.status(400).json({ error: 'expiresInHours must be between 1 and 720', code: 'INVALID_EXPIRY' });
  }
  // 32+ hex chars of CSPRNG output, per the same bar as the session/CSRF tokens above.
  const code = crypto.randomBytes(24).toString('hex'); // 48 hex chars = 192 bits
  const row = await db.one(
    `INSERT INTO invite_codes (code, role, created_by, expires_at)
     VALUES ($1, $2, $3, NOW() + ($4 || ' hours')::interval)
     RETURNING id, code, role, created_at, expires_at`,
    [code, role, req.session.userId, hours]
  );
  res.status(201).json(row);
}));

app.delete('/api/invites/:id', requireAdmin, requireCsrf, ah(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Invalid id', code: 'INVALID_ID' });
  const r = await db.query('UPDATE invite_codes SET revoked = true WHERE id = $1 AND used_at IS NULL', [id]);
  if (r.rowCount === 0) return res.status(404).json({ error: 'Invite not found or already used', code: 'INVITE_NOT_FOUND' });
  res.json({ ok: true });
}));

// ---- Metrics aggregation (Glances per-node, API v4) ----

async function fetchGlancesV4(ip, endpoint) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), METRICS_TIMEOUT);
  try {
    const r = await fetch(`http://${ip}:${GLANCES_PORT}/api/4/${endpoint}`, { signal: ctrl.signal });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally {
    clearTimeout(timer);
  }
}

// Glances v4 may return fs/network as dict (keyed by mount/interface) or array — handle both.
function gatherDisk(data) {
  const items = Array.isArray(data)
    ? data
    : Object.values(data || {});
  const root = items.find(f => f.mnt_point === '/') || items[0];
  if (!root) return { used: null, total: null, percent: null };
  return { used: root.used, total: root.size, percent: root.percent };
}

function gatherNet(data) {
  const items = Array.isArray(data)
    ? data.filter(n => n.interface_name !== 'lo')
    : Object.entries(data || {}).filter(([k]) => k !== 'lo').map(([, v]) => v);
  let rxRate = 0, txRate = 0;
  items.forEach(n => {
    const dt = n.time_since_update || 1;
    rxRate += n.rx_rate ?? ((n.rx ?? 0) / dt);
    txRate += n.tx_rate ?? ((n.tx ?? 0) / dt);
  });
  return { rx_rate: rxRate, tx_rate: txRate };
}

app.get('/api/metrics', async (_req, res) => {
  // Two fresh queries every poll, no cached state between calls.
  // /nodes → authoritative hostname list + Status.Addr (node LAN-IP), total count.
  // /tasks → which nodes have a running Glances task (by NodeID).
  // Glances runs with endpoint_mode:host, port 61208 bound directly on the host NIC.
  // No overlay IP or DNS lookup needed — Status.Addr is the stable LAN address.

  let swarmNodes = [], glancesTasks = [];
  try {
    const taskFilter = encodeURIComponent(JSON.stringify({ service: [GLANCES_SERVICE] }));
    const [nodesRes, tasksRes] = await Promise.all([
      fetch(`${PROXY_URL}/nodes`),
      fetch(`${PROXY_URL}/tasks?filters=${taskFilter}`),
    ]);
    swarmNodes   = await nodesRes.json();
    glancesTasks = await tasksRes.json();
  } catch {
    return res.status(503).json({ nodes: [], error: 'Docker proxy unavailable', code: 'PROXY_UNAVAILABLE' });
  }

  // nodeID → { hostname, addr } — addr = node's management/LAN IP from Swarm
  const nodeById = {};
  for (const n of (Array.isArray(swarmNodes) ? swarmNodes : [])) {
    nodeById[n.ID] = {
      hostname: n.Description?.Hostname || n.ID,
      addr:     n.Status?.Addr          || null,
    };
  }

  // Set of nodeIDs with a currently running Glances task
  const runningNodeIds = new Set();
  for (const t of (Array.isArray(glancesTasks) ? glancesTasks : [])) {
    if (t.Status?.State === 'running') runningNodeIds.add(t.NodeID);
  }

  const liveEntries = Object.entries(nodeById).filter(([id]) => runningNodeIds.has(id));
  console.log(
    `[metrics] poll — nodes:${Object.keys(nodeById).length} running:${runningNodeIds.size}` +
    ` addrs=[${liveEntries.map(([, i]) => i.addr || '?').join(', ') || 'none'}]`
  );

  // Query each live node via its LAN IP: metrics + /system for hostname confirmation.
  // Hostname priority: Swarm Description.Hostname → Glances system.hostname → raw IP.
  const agentResults = await Promise.all(
    liveEntries.map(async ([, { hostname, addr }]) => {
      if (!addr) return { hostname, online: false };
      try {
        const [system, cpu, mem, fsData, network] = await Promise.all([
          fetchGlancesV4(addr, 'system'),
          fetchGlancesV4(addr, 'cpu'),
          fetchGlancesV4(addr, 'mem'),
          fetchGlancesV4(addr, 'fs'),
          fetchGlancesV4(addr, 'network'),
        ]);
        // Guard against old container IDs (pre-redeploy): 12- or 64-char hex strings.
        const gh = system?.hostname;
        const glancesHostname = (gh && !/^[0-9a-f]{12,64}$/i.test(gh)) ? gh : null;
        return {
          hostname: hostname || glancesHostname || addr, online: true,
          cpu:  cpu.total ?? null,
          mem:  { used: mem.used, total: mem.total, percent: mem.percent },
          disk: gatherDisk(fsData),
          net:  gatherNet(network),
        };
      } catch {
        console.log(`[metrics] OFFLINE ${hostname} (${addr})`);
        return { hostname, online: false };
      }
    })
  );

  const responded = agentResults.filter(r => r.online).length;
  console.log(`[metrics] responded: ${responded}/${liveEntries.length} — ` +
    agentResults.map(r => `${r.hostname}:${r.online ? 'ok' : 'OFFLINE'}`).join(' '));

  // Swarm nodes not in agentResults → truly offline (no running task or addr missing).
  const coveredHostnames = new Set(agentResults.map(r => r.hostname));
  const offlineResults   = Object.values(nodeById)
    .filter(info => !coveredHostnames.has(info.hostname))
    .map(({ hostname }) => ({ hostname, online: false }));

  const results = [...agentResults, ...offlineResults];
  results.sort((a, b) => a.hostname.localeCompare(b.hostname));
  res.json({ nodes: results });
});

// ---- Backup status ----
// Reads all *.json files from BACKUP_STATUS_DIR — written by backup.sh on each node
// into /mnt/storage/dashboard/backup-status (central NFS), which the container sees
// as /data/backup-status. Deliberately NOT moved into PostgreSQL: the producer is a
// shell script that would otherwise need a psql client and DB credentials on every
// node, and file drops are the simpler contract for that.

const BACKUP_STATUS_DIR = process.env.BACKUP_STATUS_DIR || path.join(DATA_DIR, 'backup-status');
const BACKUP_STALE_MS   = 26 * 60 * 60 * 1000;

app.get('/api/backup', (_req, res) => {
  if (!fs.existsSync(BACKUP_STATUS_DIR)) {
    return res.json({ display_status: 'unknown', most_recent: null, nodes: [] });
  }

  let files;
  try {
    files = fs.readdirSync(BACKUP_STATUS_DIR).filter(f => f.endsWith('.json'));
  } catch {
    return res.json({ display_status: 'unknown', most_recent: null, nodes: [] });
  }

  const nodes = [];
  for (const file of files) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(BACKUP_STATUS_DIR, file), 'utf8'));
      const ageMs = Date.now() - new Date(data.last_run).getTime();
      const stale = isNaN(ageMs) || ageMs > BACKUP_STALE_MS;
      const display_status = data.status === 'failed' ? 'failed' : stale ? 'stale' : 'ok';
      nodes.push({ ...data, display_status });
    } catch { /* skip malformed */ }
  }

  // Sort newest first so most_recent is nodes[0]
  nodes.sort((a, b) => new Date(b.last_run) - new Date(a.last_run));

  // Collective status: any failed → failed; any stale → stale; else ok
  let display_status = nodes.length === 0 ? 'unknown' : 'ok';
  for (const n of nodes) {
    if (n.display_status === 'failed') { display_status = 'failed'; break; }
    if (n.display_status === 'stale' && display_status === 'ok') display_status = 'stale';
  }

  res.json({ display_status, most_recent: nodes[0]?.last_run ?? null, nodes });
});

// ---- Error handler ----
// Must be registered last. Turns a dead/unreachable database into a clear 503
// instead of a hanging request or a crashed process.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  if (db.isConnectionError(err)) {
    console.error(`[dashboard] DB unavailable on ${req.method} ${req.path}: ${err.message}`);
    return res.status(503).json({ error: 'Database unavailable — please try again later', code: 'DB_UNAVAILABLE' });
  }
  console.error(`[dashboard] error on ${req.method} ${req.path}: ${err.message}`);
  // err.message is deliberately NOT sent to the client (see docs/security.md).
  if (res.headersSent) return;
  res.status(500).json({ error: 'Internal error', code: 'INTERNAL' });
});

// ---- Startup ----

async function startup() {
  console.log(`[dashboard] PostgreSQL target: ${db.describeTarget()}`);

  const connected = await db.waitForDb({ attempts: 5, delayMs: 2000 });

  let secret = null;
  if (connected) {
    try {
      await db.initSchema();
      await seedAdmin();
      secret = await getSessionSecret();
      console.log('[dashboard] database ready (schema verified)');
    } catch (err) {
      console.error(`[dashboard] database setup failed: ${err.message}`);
    }
  }

  if (!secret) {
    // Reachable when Postgres is down OR schema setup failed. Boot anyway with an
    // ephemeral secret so the login page, metrics and backup card still work — DB
    // routes answer 503 until the connection recovers (retryInBackground below).
    secret = readSecret('session_secret', 'SESSION_SECRET') || crypto.randomBytes(32).toString('hex');
    console.error(
      '[dashboard] STARTING WITHOUT DATABASE — login and all DB-backed routes will return 503 ' +
      'until PostgreSQL is reachable. Check DB_HOST/DB_PORT/DB_USER/DB_PASS and that ' +
      'postgres on zs-state-01 accepts connections from this node.'
    );
    if (!process.env.SESSION_SECRET && !readSecret('session_secret', 'SESSION_SECRET')) {
      console.error(
        '[dashboard] NOTE: using a temporary session secret — existing sessions are invalid ' +
        'and will not survive a restart. Set SESSION_SECRET (or the session_secret Docker ' +
        'secret) to avoid this entirely.'
      );
    }
    db.retryInBackground();
  }

  // Loaded after the DB/schema/session-secret steps above so it can fall back to
  // an ephemeral key the same way getSessionSecret() does if Postgres never came up.
  totpEncKey = connected ? await getTotpEncryptionKey() : crypto.randomBytes(32);

  sessionMiddleware = session({
    secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      // 'strict' — this is a private single-page dashboard with no cross-site login
      // flow (no OAuth redirect back, no external POST target), so there is no
      // legitimate case that needs the cookie sent on a cross-site navigation.
      sameSite: 'strict',
      secure: process.env.COOKIE_SECURE === 'true',
      maxAge: 24 * 60 * 60 * 1000,
    },
  });

  app.listen(PORT, () => console.log(`[dashboard] listening :${PORT}`));
}

startup().catch((err) => {
  // Last resort: never exit silently, always say why.
  console.error(`[dashboard] fatal startup error: ${err.stack || err.message}`);
  process.exit(1);
});
