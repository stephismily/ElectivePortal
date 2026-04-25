let currentElective = null;
let searchDebounceTimer = null;

// ── Load Elective Tiles ──
async function loadElectiveTiles() {
  const grid = document.getElementById('elective-tiles');
  grid.innerHTML = '<p style="color:var(--text-muted);font-size:0.875rem;">Loading electives…</p>';

  try {
    const data = await api.get('/faculty/electives', tokenStore.get());
    grid.innerHTML = data.electives.map(e => `
      <div class="elective-tile" onclick="openElectiveModal('${escapeHtml(e.name)}')">
        <div class="elective-tile__name">${escapeHtml(e.name)}</div>
        <div class="elective-tile__count">${e.studentCount}</div>
        <div class="elective-tile__label">student${e.studentCount !== 1 ? 's' : ''} enrolled</div>
      </div>
    `).join('');
  } catch (err) {
    grid.innerHTML = `<p style="color:var(--error);">${err.message}</p>`;
  }
}

// ── Open Modal ──
async function openElectiveModal(name) {
  currentElective = name;
  document.getElementById('modal-elective-name').textContent = name;
  document.getElementById('modal-student-count').textContent = 'Loading…';
  document.getElementById('modal-student-list').innerHTML = '';
  document.getElementById('elective-modal').classList.add('open');

  try {
    const enc = encodeURIComponent(name);
    const data = await api.get(`/faculty/students-by-elective?name=${enc}`, tokenStore.get());
    const students = data.students;

    document.getElementById('modal-student-count').textContent =
      `${students.length} student${students.length !== 1 ? 's' : ''}`;

    if (!students.length) {
      document.getElementById('modal-student-list').innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">👤</div>
          <p>No students have selected this elective yet.</p>
        </div>`;
      document.getElementById('modal-export-btn').disabled = true;
      return;
    }

    document.getElementById('modal-export-btn').disabled = false;
    document.getElementById('modal-student-list').innerHTML = `
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>#</th><th>Name</th><th>Roll Number</th></tr>
          </thead>
          <tbody>
            ${students.map((s, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${escapeHtml(s.name)}</td>
                <td style="font-family:monospace;">${escapeHtml(s.rollNumber)}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  } catch (err) {
    document.getElementById('modal-student-list').innerHTML =
      `<p style="color:var(--error);">${err.message}</p>`;
  }
}

function closeModal() {
  document.getElementById('elective-modal').classList.remove('open');
  currentElective = null;
}

// ── Export Elective ──
async function exportElective() {
  if (!currentElective) return;
  const btn = document.getElementById('modal-export-btn');
  const orig = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner" style="border-top-color:var(--success);border-color:rgba(0,0,0,0.2)"></span> Exporting…';

  try {
    const enc = encodeURIComponent(currentElective);
    const filename = `${currentElective.replace(/\s+/g, '_')}_students.xlsx`;
    await api.download(`/faculty/export-elective?name=${enc}`, tokenStore.get(), filename);
  } catch (err) {
    alert('Export failed: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = orig;
  }
}

// ── Search Students ──
function debounceSearch() {
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(searchStudents, 400);
}

async function searchStudents() {
  const query = document.getElementById('student-search-input').value.trim();
  const resultsDiv = document.getElementById('search-results');

  if (!query || query.length < 2) {
    resultsDiv.innerHTML = '';
    return;
  }

  resultsDiv.innerHTML = '<p style="color:var(--text-muted);font-size:0.875rem;">Searching…</p>';

  try {
    const enc = encodeURIComponent(query);
    const data = await api.get(`/faculty/search-student?query=${enc}`, tokenStore.get());
    const students = data.students;

    if (!students.length) {
      resultsDiv.innerHTML = `
        <div class="empty-state" style="padding:1.5rem;">
          <p>No students found for "<strong>${escapeHtml(query)}</strong>"</p>
        </div>`;
      return;
    }

    resultsDiv.innerHTML = `
      <div style="margin-top:0.5rem;">
        <p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:0.75rem;">
          Found ${students.length} result${students.length !== 1 ? 's' : ''}
        </p>
        ${students.map(s => `
          <div class="card" style="margin-bottom:0.75rem;padding:1rem;">
            <div class="flex justify-between items-center flex-wrap" style="gap:0.5rem;">
              <div>
                <div style="font-weight:500;">${escapeHtml(s.name)}</div>
                <div style="font-size:0.8rem;color:var(--text-muted);font-family:monospace;">${escapeHtml(s.rollNumber)}</div>
              </div>
              <span class="badge badge--student">Student</span>
            </div>
            ${s.electivesSubmitted ? `
              <div class="divider" style="margin:0.75rem 0;"></div>
              <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:0.4rem;font-weight:500;text-transform:uppercase;letter-spacing:0.04em;">Selected Electives</div>
              <div style="display:flex;flex-wrap:wrap;gap:0.3rem;">
                ${s.electives.electiveII ? `<span class="tag">II: ${escapeHtml(s.electives.electiveII)}</span>` : ''}
                ${s.electives.electiveIII ? `<span class="tag">III: ${escapeHtml(s.electives.electiveIII)}</span>` : ''}
                ${s.electives.electiveIV ? `<span class="tag">IV: ${escapeHtml(s.electives.electiveIV)}</span>` : ''}
                ${s.electives.electiveV ? `<span class="tag">V: ${escapeHtml(s.electives.electiveV)}</span>` : ''}
              </div>` :
              `<div class="divider" style="margin:0.75rem 0;"></div>
               <span style="font-size:0.8rem;color:var(--text-muted);font-style:italic;">Electives not yet submitted</span>`
            }
          </div>
        `).join('')}
      </div>`;
  } catch (err) {
    resultsDiv.innerHTML = `<p style="color:var(--error);">${err.message}</p>`;
  }
}

// Close modal on overlay click
document.getElementById('elective-modal').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});
