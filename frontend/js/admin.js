// ── Add Faculty ──
async function handleAddFaculty() {
  hideAlert('admin-error');
  hideAlert('admin-success');

  const title = document.getElementById('fac-title').value;
  const name = document.getElementById('fac-name').value.trim();
  const email = document.getElementById('fac-email').value.trim();

  if (!title || !name || !email) {
    return showAlert('admin-error', 'Title, name, and email are all required.');
  }

  try {
    const data = await api.post('/admin/add-faculty', { title, name, email }, tokenStore.get());
    showAlert('admin-success', data.message, 'success');
    document.getElementById('fac-title').value = '';
    document.getElementById('fac-name').value = '';
    document.getElementById('fac-email').value = '';
    loadFacultyList();
  } catch (err) {
    showAlert('admin-error', err.message);
  }
}

// ── Load Faculty List ──
async function loadFacultyList() {
  const wrap = document.getElementById('faculty-table-wrap');
  wrap.innerHTML = '<div class="empty-state"><p>Loading…</p></div>';

  try {
    const data = await api.get('/admin/faculty', tokenStore.get());
    const faculty = data.faculty;

    if (!faculty.length) {
      wrap.innerHTML = `<div class="empty-state">
        <div class="empty-state__icon">👥</div>
        <p>No faculty added yet.</p>
      </div>`;
      return;
    }

    wrap.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Added</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${faculty.map((f, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${escapeHtml(f.name)}</td>
                <td>${escapeHtml(f.email)}</td>
                <td>
                  ${f.isFirstLogin
                    ? '<span class="badge badge--admin">Pending Login</span>'
                    : '<span class="badge badge--student">Active</span>'}
                </td>
                <td style="font-size:0.8rem;color:var(--text-muted);">${new Date(f.createdAt).toLocaleDateString()}</td>
                <td>
                  <button class="btn btn--danger btn--sm" onclick="deleteFaculty('${f._id}', '${escapeHtml(f.name)}')">
                    Remove
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>`;
  } catch (err) {
    wrap.innerHTML = `<div class="empty-state"><p style="color:var(--error);">${err.message}</p></div>`;
  }
}

// ── Delete Faculty ──
async function deleteFaculty(id, name) {
  if (!confirm(`Remove faculty "${name}"? This action cannot be undone.`)) return;

  try {
    await api.delete(`/admin/faculty/${id}`, tokenStore.get());
    loadFacultyList();
    showAlert('admin-success', `Faculty "${name}" removed.`, 'success');
  } catch (err) {
    showAlert('admin-error', err.message);
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
