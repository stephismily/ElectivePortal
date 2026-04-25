const CAT1 = ["Human Computer Interaction", "Computer Networks", "DevOps"];
const CAT2 = ["Data Mining", "Smart Computing using Python"];

function getCheckedValues(containerSelector) {
  return [
    ...document.querySelectorAll(
      `${containerSelector} input[type="checkbox"]:checked`,
    ),
  ].map((cb) => cb.value);
}

function getRadioValue(name) {
  const el = document.querySelector(`input[name="${name}"]:checked`);
  return el ? el.value : null;
}

function handleElectiveChange() {
  const cat1Checked = getCheckedValues("#cat1-checkboxes");
  const cat2Checked = getCheckedValues("#cat2-checkboxes");
  const total = cat1Checked.length + cat2Checked.length;

  // Update counters
  document.getElementById("cat1-count").textContent = cat1Checked.length;
  document.getElementById("cat2-count").textContent = cat2Checked.length;
  document.getElementById("total-count").textContent = `Total: ${total}/3`;

  // Rule enforcement:
  // If total = 3: lock everything not already checked
  // If cat1 = 3: disable all cat2
  // If cat2 = 1: disable remaining cat2

  const cat1Els = document.querySelectorAll("#cat1-checkboxes .checkbox-item");
  const cat2Els = document.querySelectorAll("#cat2-checkboxes .checkbox-item");

  cat1Els.forEach((item) => {
    const cb = item.querySelector("input");
    const isChecked = cb.checked;

    if (total >= 3 && !isChecked) {
      item.classList.add("disabled");
      cb.disabled = true;
    } else {
      item.classList.remove("disabled");
      cb.disabled = false;
    }
    item.classList.toggle("checked", isChecked);
  });

  cat2Els.forEach((item) => {
    const cb = item.querySelector("input");
    const isChecked = cb.checked;

    const cat1IsFull = cat1Checked.length === 3;
    const cat2IsFull = cat2Checked.length === 1 && !isChecked;
    const totalFull = total >= 3 && !isChecked;

    if (cat1IsFull || cat2IsFull || totalFull) {
      item.classList.add("disabled");
      cb.disabled = true;
    } else {
      item.classList.remove("disabled");
      cb.disabled = false;
    }
    item.classList.toggle("checked", isChecked);
  });

  // Radio items
  document.querySelectorAll('input[name="electiveV"]').forEach((r) => {
    const item = r.closest(".checkbox-item");
    item.classList.toggle("checked", r.checked);
  });

  // Enable submit only if: total = 3 AND elective V selected
  const electiveV = getRadioValue("electiveV");
  const btn = document.getElementById("submit-electives-btn");
  btn.disabled = !(total === 3 && electiveV);

  hideAlert("elective-error");
}

async function handleElectiveSubmit() {
  hideAlert("elective-error");

  const cat1Checked = getCheckedValues("#cat1-checkboxes");
  const cat2Checked = getCheckedValues("#cat2-checkboxes");
  const allSelected = [...cat1Checked, ...cat2Checked];
  const electiveV = getRadioValue("electiveV");

  // Client-side validation (mirrors server)
  if (allSelected.length !== 3) {
    return showAlert(
      "elective-error",
      "You must select exactly 3 subjects from Category 1 and 2.",
    );
  }
  if (cat1Checked.length < 2) {
    return showAlert(
      "elective-error",
      "At least 2 subjects must be from Category 1.",
    );
  }
  if (!electiveV) {
    return showAlert("elective-error", "Please select an Elective V option.");
  }

  // Assign to slots II, III, IV
  const [electiveII, electiveIII, electiveIV] = allSelected;

  const btn = document.getElementById("submit-electives-btn");
  const orig = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Submitting…';

  try {
    const data = await api.post(
      "/student/select-electives",
      {
        electiveII,
        electiveIII,
        electiveIV,
        electiveV,
      },
      tokenStore.get(),
    );

    // Update stored user
    const user = userStore.get();
    user.electivesSubmitted = true;
    user.electives = data.student.electives;
    userStore.set(user);

    showConfirmationPage(data.student.electives);
  } catch (err) {
    showAlert("elective-error", err.message);
    btn.disabled = false;
    btn.innerHTML = orig;
  }
}

function showConfirmationPage(electives) {
  const list = document.getElementById("confirm-elective-list");
  const items = [
    { label: "Elective II", value: electives.electiveII },
    { label: "Elective III", value: electives.electiveIII },
    { label: "Elective IV", value: electives.electiveIV },
    { label: "Elective V", value: electives.electiveV },
  ];

  list.innerHTML = items
    .map(
      (item) => `
    <li>
      <span class="elective-label">${item.label}</span>
      <span style="font-weight:500;">${item.value || "—"}</span>
    </li>
  `,
    )
    .join("");

  showPage("page-student-confirm");
}

function loadStudentConfirmPage(electives) {
  showConfirmationPage(electives);
}
