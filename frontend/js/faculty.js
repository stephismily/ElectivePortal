let currentElective = null;
let searchDebounceTimer = null;
let allStudentElectives = [];

function getElectiveCellValue(value) {
  if (!value) {
    return '<span class="student-elective-empty">-</span>';
  }

  return escapeHtml(value);
}

function renderStudentElectiveList(students, query = "") {
  const resultsDiv = document.getElementById("search-results");
  const summaryDiv = document.getElementById("student-list-summary");
  const trimmedQuery = query.trim();

  summaryDiv.innerHTML = `
    <span>
      Showing <strong>${students.length}</strong> of <strong>${allStudentElectives.length}</strong> student${allStudentElectives.length !== 1 ? "s" : ""}
    </span>
    ${trimmedQuery ? `<span>Filtered by "<strong>${escapeHtml(trimmedQuery)}</strong>"</span>` : ""}
  `;

  if (!students.length) {
    resultsDiv.innerHTML = `
      <div class="empty-state" style="padding:1.5rem;">
        <p>No students found${trimmedQuery ? ` for "<strong>${escapeHtml(trimmedQuery)}</strong>"` : ""}.</p>
      </div>
    `;
    return;
  }

  resultsDiv.innerHTML = `
    <div class="table-wrap student-electives-table-wrap">
      <table class="student-electives-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Roll Number</th>
            <th>Name</th>
            <th>Elective II</th>
            <th>Elective III</th>
            <th>Elective IV</th>
            <th>Elective V</th>
          </tr>
        </thead>
        <tbody>
          ${students
            .map(
              (student, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td class="student-roll">${escapeHtml(student.rollNumber)}</td>
                  <td>${escapeHtml(student.name)}</td>
                  <td>${getElectiveCellValue(student.electives?.electiveII)}</td>
                  <td>${getElectiveCellValue(student.electives?.electiveIII)}</td>
                  <td>${getElectiveCellValue(student.electives?.electiveIV)}</td>
                  <td>${getElectiveCellValue(student.electives?.electiveV)}</td>
                </tr>
              `,
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

async function loadStudentElectiveList() {
  const resultsDiv = document.getElementById("search-results");
  const summaryDiv = document.getElementById("student-list-summary");

  summaryDiv.innerHTML = "";
  resultsDiv.innerHTML = '<p style="color:var(--text-muted);font-size:0.875rem;">Loading student elective list...</p>';

  try {
    const data = await api.get("/faculty/student-electives", tokenStore.get());
    allStudentElectives = data.students || [];
    renderStudentElectiveList(allStudentElectives);
  } catch (err) {
    summaryDiv.innerHTML = "";
    resultsDiv.innerHTML = `<p style="color:var(--error);">${err.message}</p>`;
  }
}

// Load Elective Tiles
async function loadElectiveTiles() {
  const grid = document.getElementById("elective-tiles");
  grid.innerHTML = '<p style="color:var(--text-muted);font-size:0.875rem;">Loading electives...</p>';

  try {
    const data = await api.get("/faculty/electives", tokenStore.get());
    grid.innerHTML = data.electives
      .map(
        (e) => `
      <div class="elective-tile" onclick="openElectiveModal('${escapeHtml(e.name)}')">
        <div class="elective-tile__name">${escapeHtml(e.name)}</div>
        <div class="elective-tile__count">${e.studentCount}</div>
        <div class="elective-tile__label">student${e.studentCount !== 1 ? "s" : ""} enrolled</div>
      </div>
    `,
      )
      .join("");
  } catch (err) {
    grid.innerHTML = `<p style="color:var(--error);">${err.message}</p>`;
  }
}

// Open Modal
async function openElectiveModal(name) {
  currentElective = name;
  document.getElementById("modal-elective-name").textContent = name;
  document.getElementById("modal-student-count").textContent = "Loading...";
  document.getElementById("modal-student-list").innerHTML = "";
  document.getElementById("elective-modal").classList.add("open");

  try {
    const enc = encodeURIComponent(name);
    const data = await api.get(`/faculty/students-by-elective?name=${enc}`, tokenStore.get());
    const students = data.students;

    document.getElementById("modal-student-count").textContent =
      `${students.length} student${students.length !== 1 ? "s" : ""}`;

    if (!students.length) {
      document.getElementById("modal-student-list").innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">👤</div>
          <p>No students have selected this elective yet.</p>
        </div>`;
      document.getElementById("modal-export-btn").disabled = true;
      return;
    }

    document.getElementById("modal-export-btn").disabled = false;
    document.getElementById("modal-student-list").innerHTML = `
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>#</th><th>Name</th><th>Roll Number</th></tr>
          </thead>
          <tbody>
            ${students
              .map(
                (s, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${escapeHtml(s.name)}</td>
                <td style="font-family:monospace;">${escapeHtml(s.rollNumber)}</td>
              </tr>`,
              )
              .join("")}
          </tbody>
        </table>
      </div>`;
  } catch (err) {
    document.getElementById("modal-student-list").innerHTML =
      `<p style="color:var(--error);">${err.message}</p>`;
  }
}

function closeModal() {
  document.getElementById("elective-modal").classList.remove("open");
  currentElective = null;
}

// Export Elective
async function exportElective() {
  if (!currentElective) return;
  const btn = document.getElementById("modal-export-btn");
  const orig = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner" style="border-top-color:var(--success);border-color:rgba(0,0,0,0.2)"></span> Exporting...';

  try {
    const enc = encodeURIComponent(currentElective);
    const filename = `${currentElective.replace(/\s+/g, "_")}_students.xlsx`;
    await api.download(`/faculty/export-elective?name=${enc}`, tokenStore.get(), filename);
  } catch (err) {
    alert("Export failed: " + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = orig;
  }
}

async function exportStudentElectives() {
  const btn = document.getElementById("student-electives-export-btn");
  const original = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner" style="border-top-color:var(--success);border-color:rgba(0,0,0,0.2)"></span> Exporting...';

  try {
    await api.download(
      "/faculty/export-student-electives",
      tokenStore.get(),
      "student_elective_list.xlsx",
    );
  } catch (err) {
    alert("Export failed: " + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = original;
  }
}

// Search Students
function debounceSearch() {
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(searchStudents, 250);
}

function searchStudents() {
  const query = document.getElementById("student-search-input").value.trim().toLowerCase();

  if (!query) {
    renderStudentElectiveList(allStudentElectives);
    return;
  }

  const filteredStudents = allStudentElectives.filter(
    (student) =>
      student.rollNumber.toLowerCase().includes(query) ||
      student.name.toLowerCase().includes(query),
  );

  renderStudentElectiveList(filteredStudents, query);
}

// Close modal on overlay click
document.getElementById("elective-modal").addEventListener("click", function(e) {
  if (e.target === this) closeModal();
});
