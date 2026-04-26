// ── Page Router ──
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById(pageId);
  if (page) page.classList.add('active');
  window.scrollTo(0, 0);
}

function routeUser(user) {
  const navbar = document.getElementById('navbar');

  if (!user) {
    navbar.classList.add('hidden');
    showPage('page-auth');
    return;
  }

  navbar.classList.remove('hidden');
  document.getElementById('navbar-user').textContent = `${user.name} · ${user.role}`;

  if (user.role === 'admin') {
    document.getElementById('admin-welcome').textContent = `Welcome, ${user.name}`;
    showPage('page-admin');
    loadFacultyList();

  } else if (user.role === 'faculty') {
    document.getElementById('faculty-welcome').textContent = `Welcome, ${user.name}`;
    if (user.isFirstLogin) {
      navbar.classList.add('hidden');
      showPage('page-reset-password');
    } else {
      showPage('page-faculty');
      loadElectiveTiles();
      loadStudentElectiveList();
    }

  } else if (user.role === 'student') {
    document.getElementById('student-welcome-select').textContent = `Hello, ${user.name}`;
    if (user.electivesSubmitted && user.electives) {
      loadStudentConfirmPage(user.electives);
    } else {
      showPage('page-student-select');
    }
  }
}

// ── Theme Toggle ──
function initTheme() {
  const saved = localStorage.getItem('ep_theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('ep_theme', next);
}

document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
document.getElementById('theme-toggle-auth').addEventListener('click', toggleTheme);

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  initTheme();

  const token = tokenStore.get();
  const user = userStore.get();

  if (token && user) {
    // Verify token is still valid
    api.get('/auth/me', token)
      .then(data => routeUser(data.user))
      .catch(() => {
        tokenStore.clear();
        userStore.clear();
        showPage('page-auth');
      });
  } else {
    showPage('page-auth');
  }
});
