/* =====================================================
   HourSync — coordenadores_admin.js (INTEGRADO)
   ===================================================== */

const API_BASE = 'https://backendhoursync-1.onrender.com/api';

let coordenadoresData = [];
let cursosData        = [];
let tempCursos        = [];
let tempCursosEdit    = [];
let currentDeleteId   = null;

/* ─── sidebar ───────────────────────────────────── */
function preencherSidebar() {
  const u = JSON.parse(localStorage.getItem('hoursync_user') || '{}');
  const el = document.querySelector('.profile h6');
  if (el && u.nome) el.textContent = u.nome;
}

/* ─── fetch autenticado ─────────────────────────── */
async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('hoursync_token');
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    },
    ...options
  };
  const res = await fetch(`${API_BASE}${endpoint}`, config);
  if (res.status === 401) { window.location.href = '../login/login.html'; return; }
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.erro || `Erro ${res.status}`);
  return data;
}

/* ─── carregar dados ────────────────────────────── */
async function carregarDados() {
  try {
    const [coords, cursos] = await Promise.all([
      apiFetch('/usuarios/coordenadores'),
      apiFetch('/cursos')
    ]);
    coordenadoresData = coords || [];
    cursosData        = cursos || [];
    updateStats();
    renderTabela();
    popularSelects();
  } catch (err) {
    console.error(err);
    const tbody = document.getElementById('coordinatorsTableBody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger py-4">Erro ao carregar: ${err.message}</td></tr>`;
  }
}

/* ─── stats ─────────────────────────────────────── */
function updateStats() {
  const ativos   = coordenadoresData.filter(c => c.ativo !== false).length;
  const cursosVinc = new Set(coordenadoresData.map(c => c.cursoId?._id || c.cursoId).filter(Boolean)).size;
  document.getElementById('totalCoordenadoresCount').innerText = coordenadoresData.length;
  document.getElementById('ativosCount').innerText             = ativos;
  document.getElementById('inativosCount').innerText           = coordenadoresData.length - ativos;
  document.getElementById('totalCursosVinculados').innerText   = cursosVinc;
}

/* ─── tabela ─────────────────────────────────────── */
function renderTabela() {
  const tbody = document.getElementById('coordinatorsTableBody');
  if (!tbody) return;

  if (!coordenadoresData.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">Nenhum coordenador cadastrado.</td></tr>';
    return;
  }

  tbody.innerHTML = coordenadoresData.map(c => {
    const ativo    = c.ativo !== false;
    const cursos = Array.isArray(c.cursoId)
      ? c.cursoId.map(cur => cur?.nome || cur).filter(Boolean)
      : c.cursoId?.nome ? [c.cursoId.nome] : [];
    const cursoNome = cursos.length ? cursos.map(n => `<span class="course-tag">${n}</span>`).join(' ') : '—';

    return `
      <tr>
        <td><strong>${c.nome}</strong></td>
        <td>${c.email}</td>
        <td>${cursoNome}</td>
        <td><span class="status-badge ${ativo ? 'status-ativo' : 'status-inativo'}">${ativo ? 'Ativo' : 'Inativo'}</span></td>
        <td>
          <button class="btn-action toggle" data-id="${c._id}" title="${ativo ? 'Desativar' : 'Ativar'}">
            <i class="bi ${ativo ? 'bi-pause-circle' : 'bi-play-circle'}"></i>
          </button>
          <button class="btn-action edit"   data-id="${c._id}" title="Editar"><i class="bi bi-pencil-fill"></i></button>
          <button class="btn-action delete" data-id="${c._id}" data-name="${c.nome}" title="Excluir"><i class="bi bi-trash-fill"></i></button>
        </td>
      </tr>`;
  }).join('');

  tbody.querySelectorAll('.btn-action.toggle').forEach(btn =>
    btn.addEventListener('click', () => toggleStatus(btn.dataset.id)));
  tbody.querySelectorAll('.btn-action.edit').forEach(btn =>
    btn.addEventListener('click', () => abrirModalEditar(btn.dataset.id)));
  tbody.querySelectorAll('.btn-action.delete').forEach(btn =>
    btn.addEventListener('click', () => abrirModalDeletar(btn.dataset.id, btn.dataset.name)));
}

/* ─── toggle ativo/inativo ──────────────────────── */
async function toggleStatus(id) {
  const coord = coordenadoresData.find(c => c._id === id);
  if (!coord) return;
  try {
    await apiFetch(`/usuarios/${id}/ativo?ativo=${!coord.ativo}`, { method: 'PUT' });
    coord.ativo = !coord.ativo;
    updateStats();
    renderTabela();
  } catch (err) { alert('Erro ao alterar status: ' + err.message); }
}

/* ─── deletar ───────────────────────────────────── */
function abrirModalDeletar(id, nome) {
  currentDeleteId = id;
  document.getElementById('deleteCoordName').innerText = nome;
  new bootstrap.Modal(document.getElementById('deleteModal')).show();
}

async function confirmarDeletar() {
  if (!currentDeleteId) return;
  try {
    await apiFetch(`/usuarios/${currentDeleteId}`, { method: 'DELETE' });
    coordenadoresData = coordenadoresData.filter(c => c._id !== currentDeleteId);
    updateStats();
    renderTabela();
    bootstrap.Modal.getInstance(document.getElementById('deleteModal'))?.hide();
    currentDeleteId = null;
  } catch (err) { alert('Erro ao excluir: ' + err.message); }
}

/* ─── popular selects de cursos ─────────────────── */
function popularSelects() {
  ['courseSelect', 'editCourseSelect'].forEach(selId => {
    const sel = document.getElementById(selId);
    if (!sel) return;
    sel.innerHTML = '<option value="">Selecione um curso...</option>' +
      cursosData.map(c => `<option value="${c._id}">${c.nome}</option>`).join('');
  });
}

/* ─── adicionar coordenador ─────────────────────── */
async function adicionarCoordenador() {
  const nome   = document.getElementById('coordName').value.trim();
  const email  = document.getElementById('coordEmail').value.trim();
  const senha  = document.getElementById('coordPassword').value;
  const cursoId = document.getElementById('courseSelect').value;

  if (!nome || !email || !senha) { alert('Preencha todos os campos obrigatórios.'); return; }

  const btn = document.getElementById('confirmAddCoordBtn');
  btn.disabled = true;
  try {
    const novo = await apiFetch('/usuarios', {
      method: 'POST',
      body: JSON.stringify({ nome, email, senha, role: 'COORDENADOR', cursoId: cursoId || undefined })
    });
    coordenadoresData.push(novo);
    updateStats();
    renderTabela();
    bootstrap.Modal.getInstance(document.getElementById('addCoordinatorModal'))?.hide();
    ['coordName', 'coordEmail', 'coordPassword'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('courseSelect').value = '';
  } catch (err) { alert('Erro ao adicionar: ' + err.message); }
  finally { btn.disabled = false; }
}

/* ─── editar coordenador ────────────────────────── */
function renderEditCursos() {
  const container = document.getElementById('editSelectedCoursesContainer');
  if (!container) return;
  container.innerHTML = tempCursosEdit.map(id => {
    const curso = cursosData.find(c => c._id === id);
    return `<span class="badge bg-primary me-1 mb-1" style="font-size:.85rem;">
      ${curso?.nome || id}
      <i class="bi bi-x ms-1" style="cursor:pointer;" onclick="removerCursoEdit('${id}')"></i>
    </span>`;
  }).join('');
}

function removerCursoEdit(id) {
  tempCursosEdit = tempCursosEdit.filter(c => c !== id);
  renderEditCursos();
}

function abrirModalEditar(id) {
  const coord = coordenadoresData.find(c => c._id === id);
  if (!coord) return;

  document.getElementById('editCoordId').value       = id;
  document.getElementById('editCoordName').value     = coord.nome;
  document.getElementById('editCoordEmail').value    = coord.email;
  document.getElementById('editCoordPassword').value = '';
  document.getElementById('editCourseSelect').value  = '';

  // Carregar cursos já vinculados
  const cursoIds = Array.isArray(coord.cursoId)
    ? coord.cursoId.map(c => c._id || c)
    : coord.cursoId ? [coord.cursoId._id || coord.cursoId] : [];
  tempCursosEdit = [...cursoIds];
  renderEditCursos();

  new bootstrap.Modal(document.getElementById('editCoordinatorModal')).show();
}

async function salvarEdicao() {
  const id    = document.getElementById('editCoordId').value;
  const nome  = document.getElementById('editCoordName').value.trim();
  const email = document.getElementById('editCoordEmail').value.trim();
  const senha = document.getElementById('editCoordPassword').value;

  if (!nome || !email) { alert('Preencha nome e email.'); return; }

  const btn = document.getElementById('confirmEditCoordBtn');
  btn.disabled = true;
  try {
    const body = { nome, email, cursoId: tempCursosEdit };
    if (senha) body.senha = senha;

    const atualizado = await apiFetch(`/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    });

    const idx = coordenadoresData.findIndex(c => c._id === id);
    if (idx !== -1) coordenadoresData[idx] = { ...coordenadoresData[idx], ...atualizado };
    updateStats();
    renderTabela();
    bootstrap.Modal.getInstance(document.getElementById('editCoordinatorModal'))?.hide();
  } catch (err) { alert('Erro ao editar: ' + err.message); }
  finally { btn.disabled = false; }
}

/* ─── busca ─────────────────────────────────────── */
function setupSearch() {
  document.getElementById('searchInput')?.addEventListener('input', e => {
    const term = e.target.value.toLowerCase();
    document.querySelectorAll('#coordinatorsTableBody tr').forEach(row => {
      row.style.display = row.textContent.toLowerCase().includes(term) ? '' : 'none';
    });
  });
}

/* ─── INIT ──────────────────────────────────────── */
function init() {
  preencherSidebar();
  carregarDados();
  setupSearch();

  document.getElementById('confirmAddCoordBtn').addEventListener('click', adicionarCoordenador);

  document.getElementById('editAddCourseBtn')?.addEventListener('click', () => {
    const sel = document.getElementById('editCourseSelect');
    const id  = sel.value;
    if (!id) { alert('Selecione um curso.'); return; }
    if (tempCursosEdit.includes(id)) { alert('Curso já adicionado.'); return; }
    tempCursosEdit.push(id);
    renderEditCursos();
    sel.value = '';
  });
  document.getElementById('confirmEditCoordBtn').addEventListener('click', salvarEdicao);
  document.getElementById('confirmDeleteBtn').addEventListener('click', confirmarDeletar);
}

init();
