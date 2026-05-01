/* =====================================================
   HourSync — coordenadores_admin.js
   ===================================================== */

let availableCourses = [
  { id: "c1", name: "ADS" },
  { id: "c2", name: "Jogos Digitais" },
  { id: "c3", name: "Internet das Coisas" },
  { id: "c4", name: "Gastronomia" }
];

let coordinators = [
  { id: "coord1", name: "Amelara Silva",  email: "amelara@gmail.com",               password: "123456", courses: ["c1","c2"], active: true },
  { id: "coord2", name: "Carlos Mendes",  email: "carlos.mendes@faculdade.edu.br",  password: "123456", courses: ["c3"],      active: true },
  { id: "coord3", name: "Fernanda Lima",  email: "fernanda.lima@faculdade.edu.br",  password: "123456", courses: ["c4"],      active: false }
];

let currentDeleteId       = null;
let tempSelectedCourses   = [];
let tempEditSelectedCourses = [];

function getCourseName(id) {
  return (availableCourses.find(c => c.id === id) || {}).name || id;
}

function updateStats() {
  const ativos   = coordinators.filter(c => c.active).length;
  const allCourses = new Set(coordinators.flatMap(c => c.courses));
  document.getElementById('totalCoordenadoresCount').innerText = coordinators.length;
  document.getElementById('ativosCount').innerText             = ativos;
  document.getElementById('inativosCount').innerText           = coordinators.length - ativos;
  document.getElementById('totalCursosVinculados').innerText   = allCourses.size;
}

function renderCoordinatorsTable() {
  const tbody = document.getElementById('coordinatorsTableBody');
  if (!tbody) return;

  if (coordinators.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">Nenhum coordenador cadastrado.</td></tr>';
    return;
  }

  tbody.innerHTML = coordinators.map(coord => `
    <tr>
      <td><strong>${escapeHtml(coord.name)}</strong></td>
      <td>${escapeHtml(coord.email)}</td>
      <td>${coord.courses.map(id => `<span class="course-tag">${escapeHtml(getCourseName(id))}</span>`).join('') || '<span class="text-muted">Nenhum</span>'}</td>
      <td><span class="status-badge ${coord.active ? 'status-ativo' : 'status-inativo'}">${coord.active ? 'Ativo' : 'Inativo'}</span></td>
      <td>
        <button class="btn-action toggle" data-id="${coord.id}" title="${coord.active ? 'Desativar' : 'Ativar'}"><i class="bi ${coord.active ? 'bi-pause-circle' : 'bi-play-circle'}"></i></button>
        <button class="btn-action edit"   data-id="${coord.id}" title="Editar"><i class="bi bi-pencil-fill"></i></button>
        <button class="btn-action delete" data-id="${coord.id}" data-name="${escapeHtml(coord.name)}" title="Excluir"><i class="bi bi-trash-fill"></i></button>
      </td>
    </tr>
  `).join('');

  document.querySelectorAll('.btn-action.toggle').forEach(btn => btn.addEventListener('click', e => { e.stopPropagation(); toggleStatus(btn.dataset.id); }));
  document.querySelectorAll('.btn-action.edit').forEach(btn =>   btn.addEventListener('click', e => { e.stopPropagation(); openEditModal(btn.dataset.id); }));
  document.querySelectorAll('.btn-action.delete').forEach(btn => btn.addEventListener('click', e => { e.stopPropagation(); openDeleteModal(btn.dataset.id, btn.dataset.name); }));
}

function toggleStatus(id) {
  const c = coordinators.find(c => c.id === id);
  if (c) { c.active = !c.active; renderCoordinatorsTable(); updateStats(); }
}

function openDeleteModal(id, name) {
  currentDeleteId = id;
  document.getElementById('deleteCoordName').innerText = name;
  new bootstrap.Modal(document.getElementById('deleteModal')).show();
}

function confirmDelete() {
  if (currentDeleteId) {
    coordinators = coordinators.filter(c => c.id !== currentDeleteId);
    renderCoordinatorsTable();
    updateStats();
    bootstrap.Modal.getInstance(document.getElementById('deleteModal'))?.hide();
    currentDeleteId = null;
  }
}

function openEditModal(id) {
  const coord = coordinators.find(c => c.id === id);
  if (!coord) return;
  tempEditSelectedCourses = [...coord.courses];
  document.getElementById('editCoordId').value       = id;
  document.getElementById('editCoordName').value     = coord.name;
  document.getElementById('editCoordEmail').value    = coord.email;
  document.getElementById('editCoordPassword').value = '';
  updateEditCoursesDisplay();
  new bootstrap.Modal(document.getElementById('editCoordinatorModal')).show();
}

function updateEditCoursesDisplay() {
  const container = document.getElementById('editSelectedCoursesContainer');
  container.innerHTML = tempEditSelectedCourses.length
    ? tempEditSelectedCourses.map(id => `<span class="course-tag">${escapeHtml(getCourseName(id))}<i class="bi bi-x-circle-fill remove-edit-course" data-course="${id}"></i></span>`).join('')
    : '<span class="text-muted small">Nenhum curso selecionado</span>';
  document.querySelectorAll('.remove-edit-course').forEach(icon => icon.addEventListener('click', () => {
    tempEditSelectedCourses = tempEditSelectedCourses.filter(i => i !== icon.dataset.course);
    updateEditCoursesDisplay();
  }));
}

function saveEditCoordinator() {
  const id    = document.getElementById('editCoordId').value;
  const coord = coordinators.find(c => c.id === id);
  if (!coord) return;
  const name  = document.getElementById('editCoordName').value.trim();
  const email = document.getElementById('editCoordEmail').value.trim();
  const pass  = document.getElementById('editCoordPassword').value;
  if (!name || !email) { alert('Preencha nome e email.'); return; }
  coord.name    = name;
  coord.email   = email;
  if (pass) coord.password = pass;
  coord.courses = [...tempEditSelectedCourses];
  renderCoordinatorsTable();
  updateStats();
  bootstrap.Modal.getInstance(document.getElementById('editCoordinatorModal'))?.hide();
}

function updateCoursesDisplay() {
  const container = document.getElementById('selectedCoursesContainer');
  container.innerHTML = tempSelectedCourses.length
    ? tempSelectedCourses.map(id => `<span class="course-tag">${escapeHtml(getCourseName(id))}<i class="bi bi-x-circle-fill remove-course" data-course="${id}"></i></span>`).join('')
    : '<span class="text-muted small">Nenhum curso selecionado</span>';
  document.querySelectorAll('.remove-course').forEach(icon => icon.addEventListener('click', () => {
    tempSelectedCourses = tempSelectedCourses.filter(i => i !== icon.dataset.course);
    updateCoursesDisplay();
  }));
}

function addNewCoordinator() {
  const name  = document.getElementById('coordName').value.trim();
  const email = document.getElementById('coordEmail').value.trim();
  const pass  = document.getElementById('coordPassword').value;
  if (!name || !email || !pass) { alert('Preencha todos os campos obrigatórios.'); return; }
  coordinators.push({ id: generateId(), name, email, password: pass, courses: [...tempSelectedCourses], active: true });
  renderCoordinatorsTable();
  updateStats();
  ['coordName','coordEmail','coordPassword'].forEach(id => document.getElementById(id).value = '');
  tempSelectedCourses = [];
  updateCoursesDisplay();
  bootstrap.Modal.getInstance(document.getElementById('addCoordinatorModal'))?.hide();
  alert(`Coordenador "${name}" adicionado!`);
}

function populateCourseSelects() {
  ['courseSelect','editCourseSelect'].forEach(selId => {
    const sel = document.getElementById(selId);
    if (sel) sel.innerHTML = '<option value="">Selecione um curso...</option>' +
      availableCourses.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
  });
}

function setupSearch() {
  document.getElementById('searchInput')?.addEventListener('input', e => {
    const term = e.target.value.toLowerCase();
    document.querySelectorAll('#coordinatorsTableBody tr').forEach(row => {
      row.style.display = row.textContent.toLowerCase().includes(term) ? '' : 'none';
    });
  });
}

function init() {
  tempSelectedCourses = [];
  renderCoordinatorsTable();
  updateStats();
  setupSearch();
  populateCourseSelects();

  document.getElementById('confirmAddCoordBtn').addEventListener('click', addNewCoordinator);
  document.getElementById('addCourseBtn').addEventListener('click', () => {
    const sel = document.getElementById('courseSelect');
    if (!sel.value) { alert('Selecione um curso.'); return; }
    if (!tempSelectedCourses.includes(sel.value)) { tempSelectedCourses.push(sel.value); updateCoursesDisplay(); }
    else alert('Curso já adicionado.');
    sel.value = '';
  });
  document.getElementById('confirmEditCoordBtn').addEventListener('click', saveEditCoordinator);
  document.getElementById('editAddCourseBtn').addEventListener('click', () => {
    const sel = document.getElementById('editCourseSelect');
    if (!sel.value) { alert('Selecione um curso.'); return; }
    if (!tempEditSelectedCourses.includes(sel.value)) { tempEditSelectedCourses.push(sel.value); updateEditCoursesDisplay(); }
    else alert('Curso já adicionado.');
    sel.value = '';
  });
  document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);
}

init();
