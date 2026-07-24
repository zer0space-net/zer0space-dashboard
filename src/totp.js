'use strict';

// TOTP (RFC 6238) on top of HOTP (RFC 4226), implemented with only Node's built-in
// crypto module. No otplib/speakeasy dependency: this repo has no build step and
// deliberately keeps native/runtime dependencies minimal (see CLAUDE.md) — HOTP/TOTP
// is a small, fully-specified algorithm, not something worth a third-party package for.
//
// The QR code shown during 2FA setup is likewise rendered client-side from a vendored
// copy of Kazuhiko Arase's qrcode-generator (src/public/vendor/qrcode-generator.js,
// MIT licensed) instead of a server-side qrcode+Pillow image — same result (a scannable
// QR shown once at setup), no extra runtime dependency.

const crypto = require('crypto');

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const SECRET_BYTES = 20; // 160 bits -> 32 base32 chars, no padding — matches pyotp.random_base32()'s default length

function base32Encode(buffer) {
  let bits = '';
  for (const byte of buffer) bits += byte.toString(2).padStart(8, '0');
  let out = '';
  for (let i = 0; i + 5 <= bits.length; i += 5) {
    out += BASE32_ALPHABET[parseInt(bits.slice(i, i + 5), 2)];
  }
  const remainder = bits.length % 5;
  if (remainder) {
    const lastChunk = bits.slice(bits.length - remainder).padEnd(5, '0');
    out += BASE32_ALPHABET[parseInt(lastChunk, 2)];
  }
  return out;
}

function base32Decode(str) {
  const clean = String(str).toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = '';
  for (const ch of clean) {
    const val = BASE32_ALPHABET.indexOf(ch);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

function generateSecret() {
  return base32Encode(crypto.randomBytes(SECRET_BYTES));
}

// RFC 4226 HOTP: HMAC-SHA1 over an 8-byte big-endian counter, dynamic truncation to 6 digits.
function hotp(secretBase32, counter) {
  const key = base32Decode(secretBase32);
  const counterBuf = Buffer.alloc(8);
  counterBuf.writeUInt32BE(Math.floor(counter / 2 ** 32), 0);
  counterBuf.writeUInt32BE(counter % 2 ** 32, 4);

  const hmac = crypto.createHmac('sha1', key).update(counterBuf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(binary % 1_000_000).padStart(6, '0');
}

function totp(secretBase32, { step = 30, time = Date.now() } = {}) {
  const counter = Math.floor(time / 1000 / step);
  return hotp(secretBase32, counter);
}

// valid_window semantics matching pyotp: accept the current step plus `window`
// steps on either side (covers clock drift and the "previous code" case).
function verifyTotp(secretBase32, token, { window = 1, step = 30, time = Date.now() } = {}) {
  if (typeof token !== 'string' || !/^\d{6}$/.test(token)) return false;
  const counter = Math.floor(time / 1000 / step);
  for (let errorWindow = -window; errorWindow <= window; errorWindow++) {
    if (hotp(secretBase32, counter + errorWindow) === token) return true;
  }
  return false;
}

function buildOtpauthUri({ secret, username, issuer = 'zer0space Dashboard' }) {
  const label = encodeURIComponent(`${issuer}:${username}`);
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: 'SHA1',
    digits: '6',
    period: '30',
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}

module.exports = { generateSecret, hotp, totp, verifyTotp, buildOtpauthUri, base32Encode, base32Decode };
