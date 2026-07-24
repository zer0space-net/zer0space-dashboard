'use strict';

const form       = document.getElementById('registerForm');
const btn        = document.getElementById('submitBtn');
const errorMsg   = document.getElementById('errorMsg');
const successMsg = document.getElementById('successMsg');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const inviteCode = document.getElementById('inviteCode').value.trim();
  const username   = document.getElementById('username').value.trim();
  const password   = document.getElementById('password').value;
  if (!inviteCode || !username || !password) return;

  btn.disabled = true;
  btn.textContent = '…';
  errorMsg.classList.remove('visible');
  successMsg.classList.remove('visible');

  try {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteCode, username, password }),
    });
    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      successMsg.textContent = t('register.success');
      successMsg.classList.add('visible');
      form.reset();
      btn.disabled = true; // stays disabled — the next step is /login, not another submit
      setTimeout(() => { window.location.href = '/login'; }, 1500);
    } else {
      errorMsg.textContent = I18N.tError(data, 'register.invalid');
      errorMsg.classList.add('visible');
      btn.disabled = false;
      btn.textContent = t('register.submit');
    }
  } catch {
    errorMsg.textContent = t('common.serverUnreachable');
    errorMsg.classList.add('visible');
    btn.disabled = false;
    btn.textContent = t('register.submit');
  }
});

window.addEventListener('languagechange:zs', () => {
  errorMsg.classList.remove('visible');
});
