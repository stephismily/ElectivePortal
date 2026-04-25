// ── UI Helpers ──
function showAlert(id, msg, type = 'error') {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = `alert alert--${type} show`;
  el.textContent = msg;
}

function hideAlert(id) {
  const el = document.getElementById(id);
  if (el) el.className = 'alert';
}

function setLoading(btnId, loading, text = 'Loading…') {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = loading;
  btn.innerHTML = loading
    ? `<span class="spinner"></span> ${text}`
    : btn.dataset.originalText || btn.textContent;
  if (!loading) btn.innerHTML = btn.dataset.originalText || btn.textContent;
}

function saveBtnText(btnId) {
  const btn = document.getElementById(btnId);
  if (btn) btn.dataset.originalText = btn.innerHTML;
}

// ── Tab Switch ──
function switchTab(tab) {
  document.getElementById('form-login').classList.toggle('hidden', tab !== 'login');
  document.getElementById('form-register').classList.toggle('hidden', tab !== 'register');
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-register').classList.toggle('active', tab === 'register');
  ['login-error','login-success','register-error','register-success'].forEach(hideAlert);
}

// ── Login ──
async function handleLogin() {
  hideAlert('login-error');
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  if (!email || !password) {
    return showAlert('login-error', 'Please enter your email and password.');
  }

  const btn = document.getElementById('login-btn');
  const orig = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Signing in…';

  try {
    const data = await api.post('/auth/login', { email, password });
    tokenStore.set(data.token);
    userStore.set(data.user);
    routeUser(data.user);
  } catch (err) {
    showAlert('login-error', err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = orig;
  }
}

// ── Register ──
async function handleRegister() {
  hideAlert('register-error');
  const rollNumber = document.getElementById('reg-rollno').value.trim().toUpperCase();
  const name = document.getElementById('reg-name').value.trim().toUpperCase();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const confirmPassword = document.getElementById('reg-confirm').value;

  if (!rollNumber || !name || !email || !password || !confirmPassword) {
    return showAlert('register-error', 'All fields are required.');
  }

  const btn = document.getElementById('register-btn');
  const orig = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Creating account…';

  try {
    const data = await api.post('/auth/register', { rollNumber, name, email, password, confirmPassword });
    tokenStore.set(data.token);
    userStore.set(data.user);
    showAlert('register-success', 'Account created! Redirecting…', 'success');
    setTimeout(() => routeUser(data.user), 1200);
  } catch (err) {
    showAlert('register-error', err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = orig;
  }
}

// ── Reset Password ──
async function handleResetPassword() {
  hideAlert('reset-error');
  const newPassword = document.getElementById('reset-new').value;
  const confirmPassword = document.getElementById('reset-confirm').value;

  if (!newPassword || !confirmPassword) {
    return showAlert('reset-error', 'Both fields are required.');
  }
  if (newPassword !== confirmPassword) {
    return showAlert('reset-error', 'Passwords do not match.');
  }
  if (newPassword.length < 6) {
    return showAlert('reset-error', 'Password must be at least 6 characters.');
  }

  try {
    await api.post('/faculty/reset-password', { newPassword, confirmPassword }, tokenStore.get());
    showAlert('reset-success', 'Password updated! Redirecting…', 'success');

    // Update local user
    const user = userStore.get();
    user.isFirstLogin = false;
    userStore.set(user);

    setTimeout(() => showPage('page-faculty'), 1200);
  } catch (err) {
    showAlert('reset-error', err.message);
  }
}

// ── Logout ──
function logout() {
  tokenStore.clear();
  userStore.clear();
  showPage('page-auth');
  document.getElementById('navbar').classList.add('hidden');
  // Clear fields
  document.getElementById('login-email').value = '';
  document.getElementById('login-password').value = '';
  switchTab('login');
}

document.getElementById('logout-btn').addEventListener('click', logout);

// Allow Enter key on login
document.getElementById('login-password').addEventListener('keydown', e => {
  if (e.key === 'Enter') handleLogin();
});
