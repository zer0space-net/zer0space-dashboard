'use strict';

const form         = document.getElementById('loginForm');
const btn          = document.getElementById('submitBtn');
const errorMsg     = document.getElementById('errorMsg');
const twoFaForm    = document.getElementById('twoFaForm');
const twoFaInput   = document.getElementById('twoFaCode');
const twoFaBtn     = document.getElementById('twoFaSubmitBtn');
const twoFaError   = document.getElementById('twoFaErrorMsg');
const registerHint = document.getElementById('registerHint');

// Set once the password step returns 202 requires_2fa — the CSRF token minted
// for the pending session, needed on the /api/2fa/login request below.
let pendingCsrfToken = null;

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  if (!username || !password) return;

  btn.disabled = true;
  btn.textContent = '…';
  errorMsg.classList.remove('visible');

  const resetButton = () => {
    btn.disabled = false;
    btn.textContent = t('login.submit');
  };

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json().catch(() => ({}));

    if (res.status === 202 && data.requires_2fa) {
      pendingCsrfToken = data.csrfToken || null;
      form.style.display = 'none';
      registerHint.style.display = 'none';
      twoFaForm.style.display = '';
      twoFaInput.focus();
      resetButton();
      return;
    }

    if (res.ok) {
      window.location.href = '/';
    } else {
      errorMsg.textContent = I18N.tError(data, 'login.invalid');
      errorMsg.classList.add('visible');
      resetButton();
      document.getElementById('password').value = '';
      document.getElementById('password').focus();
    }
  } catch {
    errorMsg.textContent = t('common.serverUnreachable');
    errorMsg.classList.add('visible');
    resetButton();
  }
});

async function submitTwoFa() {
  const code = twoFaInput.value.trim();
  if (!code) return;

  twoFaBtn.disabled = true;
  twoFaInput.disabled = true;
  twoFaError.classList.remove('visible');

  const reset = () => {
    twoFaBtn.disabled = false;
    twoFaInput.disabled = false;
  };

  try {
    const res = await fetch('/api/2fa/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': pendingCsrfToken || '' },
      body: JSON.stringify({ code }),
    });
    if (res.ok) {
      window.location.href = '/';
      return;
    }
    const data = await res.json().catch(() => ({}));
    twoFaError.textContent = I18N.tError(data, 'login.twofaInvalid');
    twoFaError.classList.add('visible');
    twoFaInput.value = '';
    reset();
    twoFaInput.focus();
  } catch {
    twoFaError.textContent = t('common.serverUnreachable');
    twoFaError.classList.add('visible');
    reset();
  }
}

twoFaForm.addEventListener('submit', (e) => {
  e.preventDefault();
  submitTwoFa();
});

// Auto-submit once exactly 6 digits are entered (the normal TOTP-code case).
// A recovery code (e.g. ABCDE-FGHIJ) is longer and not all-numeric, so it falls
// through to the manual submit button instead.
twoFaInput.addEventListener('input', () => {
  const v = twoFaInput.value;
  if (/^\d{6}$/.test(v)) submitTwoFa();
});

// Same reasoning as the password-step error line: don't let a language switch
// paper over a specific error with the generic default while it's showing.
window.addEventListener('languagechange:zs', () => {
  errorMsg.classList.remove('visible');
  twoFaError.classList.remove('visible');
});
