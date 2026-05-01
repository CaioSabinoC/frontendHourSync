/* =====================================================
   HourSync — gestao_cursos_admin.js (INTEGRADO)
   ===================================================== */

const API_BASE = 'https://backendhoursync-1.onrender.com/api';

let cursosData     = [];
let categoriasData = [];
let atividadesData = [];

let currentCursoId    = null;
let configModalInst   = null;
let addCursoModalInst = null;

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
    const [cursos, cats, ativs] = await Promise.all([
      apiFetch('/cursos'),
      apiFetch('/categorias'),
      apiFetch('/atividades')
    ]);
    cursosData     = cursos  || [];
    categoriasData = cats    || [];
    atividadesData = ativs   || [];
    updateStats();
    renderTabela();
  } catch (err) {
    console.error(err);
    alert('Erro ao carregar dados: ' + err.message);
  }
}

/* ─── stats ─────────────────────────────────────── */
function updateStats() {
  const totalHoras = cursosData.reduce((s, c) => s + (c.horasExigidas || 0), 0);
  const media = cursosData.length ? (totalHoras / cursosData.length).toFixed(1) : 0;
  const catsAtivas = new Set(atividadesData.map(a => a.categoriaId?._id || a.categoriaId)).size;

  document.getElementById('totalCursosCount').innerText     = cursosData.length;
  document.getElementById('totalHorasCount').innerText      = totalHoras;
  document.getElementById('totalCategoriasCount').innerText = catsAtivas;
  document.getElementById('mediaHorasExigidas').innerText   = media;
}

/* ─── tabela de cursos ──────────────────────────── */
function renderTabela() {
  const tbody = document.getElementById('coursesTableBody');
  if (!tbody) return;

  if (!cursosData.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">Nenhum curso cadastrado.</td></tr>';
    return;
  }

  tbody.innerHTML = cursosData.map(c => {
    // Categorias vinculadas a este curso
    const cats = categoriasData.filter(cat =>
      (cat.cursoId || []).some(cid => (cid._id || cid) === c._id)
    );
    const catsHtml = cats.length
      ? cats.map(cat => `<span class="category-badge">${cat.nome}</span>`).join(' ')
      : '<span class="text-muted small">Nenhuma</span>';

    return `
      <tr>
        <td><strong>${c.nome}</strong>${c.codigo ? `<br><small class="text-muted">${c.codigo}</small>` : ''}</td>
        <td>${c.horasExigidas || 0}h exigidas</td>
        <td>${catsHtml}</td>
        <td>
          <button class="btn-action configure" data-id="${c._id}" title="Configurar"><i class="bi bi-gear-fill"></i></button>
          <button class="btn-action delete"    data-id="${c._id}" title="Remover"><i class="bi bi-trash-fill"></i></button>
        </td>
      </tr>`;
  }).join('');

  tbody.querySelectorAll('.btn-action.configure').forEach(btn =>
    btn.addEventListener('click', () => abrirConfigModal(btn.dataset.id)));
  tbody.querySelectorAll('.btn-action.delete').forEach(btn =>
    btn.addEventListener('click', () => deletarCurso(btn.dataset.id)));
}

/* ─── deletar curso ─────────────────────────────── */
async function deletarCurso(id) {
  if (!confirm('Remover este curso?')) return;
  try {
    await apiFetch(`/cursos/${id}`, { method: 'DELETE' });
    cursosData = cursosData.filter(c => c._id !== id);
    updateStats();
    renderTabela();
  } catch (err) { alert('Erro ao remover: ' + err.message); }
}

/* ─── adicionar curso ───────────────────────────── */
async function adicionarCurso() {
  const nome         = document.getElementById('newCourseName').value.trim();
  const horasExigidas = parseInt(document.getElementById('newCourseTotalHours').value) || 100;

  if (!nome) { alert('Informe o nome do curso.'); return; }

  const btn = document.getElementById('confirmAddCourseBtn');
  btn.disabled = true;
  try {
    const novo = await apiFetch('/cursos', {
      method: 'POST',
      body: JSON.stringify({ nome, horasExigidas })
    });
    cursosData.push(novo);
    updateStats();
    renderTabela();
    addCursoModalInst.hide();
    document.getElementById('newCourseName').value = '';
    document.getElementById('newCourseTotalHours').value = '100';
  } catch (err) { alert('Erro ao adicionar: ' + err.message); }
  finally { btn.disabled = false; }
}

/* ════════════════════════════════════════════════════
   MODAL CONFIGURAR — Categorias e Atividades
   ════════════════════════════════════════════════════ */

function abrirConfigModal(cursoId) {
  currentCursoId = cursoId;
  const curso = cursosData.find(c => c._id === cursoId);
  document.getElementById('configModalCourseInfo').innerHTML =
    `<i class="bi bi-check-circle-fill text-success me-2"></i> Configurando: <strong>${curso?.nome}</strong>`;
  document.getElementById('configTotalRequired').value = curso?.horasExigidas || 100;

  renderCategoriasConfig();
  configModalInst.show();
}

function getCatsDoCurso() {
  return categoriasData.filter(cat =>
    (cat.cursoId || []).some(cid => (cid._id || cid) === currentCursoId)
  );
}

function getAtivsDeCategoria(catId) {
  return atividadesData.filter(a => {
    const catMatch = (a.categoriaId?._id || a.categoriaId) === catId;
    // cursoId pode ser array ou objeto
    const cursoIds = Array.isArray(a.cursoId)
      ? a.cursoId.map(c => c._id || c)
      : [a.cursoId?._id || a.cursoId];
    const cursoMatch = cursoIds.includes(currentCursoId);
    return catMatch && cursoMatch;
  });
}

function renderCategoriasConfig() {
  const container = document.getElementById('gruposConfigContainer');
  if (!container) return;

  const cats = getCatsDoCurso();

  const html = cats.map(cat => {
    const ativs = getAtivsDeCategoria(cat._id);
    const ativsHtml = ativs.map((a, i) => `
      <div class="d-flex align-items-center gap-2 mb-2 flex-wrap subcat-row">
        <span class="badge bg-secondary" style="min-width:36px;">${a.codigo}</span>
        <span class="flex-grow-1 small">${a.nome}</span>
        <div class="input-group input-group-sm" style="width:100px;flex-shrink:0;">
          <input type="number" class="form-control form-control-sm" value="${a.horasPorSemestre}" min="0"
            data-atv-id="${a._id}" onchange="salvarHorasAtividade('${a._id}', this.value)">
          <span class="input-group-text">h</span>
        </div>
        <button class="btn btn-sm btn-outline-secondary p-1" onclick="editarAtividade('${a._id}')" title="Editar">
          <i class="bi bi-pencil" style="font-size:.7rem;"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger p-1" onclick="deletarAtividade('${a._id}')" title="Excluir">
          <i class="bi bi-trash" style="font-size:.7rem;"></i>
        </button>
      </div>`).join('');

    return `
      <div class="grupo-block mb-3 p-3 rounded border" style="border-left:4px solid #6c83e6 !important;">
        <div class="d-flex align-items-center gap-2 mb-2 flex-wrap">
          <strong style="color:#6c83e6;flex:1;">${cat.nome}</strong>
          <span class="badge" style="background:#6c83e620;color:#6c83e6;">${ativs.length} atividades</span>
          <button class="btn btn-sm btn-outline-secondary" onclick="editarCategoria('${cat._id}')" title="Editar categoria">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="deletarCategoria('${cat._id}')" title="Excluir categoria">
            <i class="bi bi-trash"></i>
          </button>
        </div>
        <div class="ps-1">${ativsHtml}</div>
        <div class="mt-2">
          <button class="btn btn-sm btn-outline-primary" onclick="abrirModalNovaAtividade('${cat._id}')">
            <i class="bi bi-plus-circle me-1"></i> Adicionar atividade
          </button>
        </div>
      </div>`;
  }).join('');

  container.innerHTML = html + `
    <div class="text-center mt-3">
      <button class="btn btn-outline-success btn-sm" onclick="abrirModalNovaCategoria()">
        <i class="bi bi-plus-lg me-1"></i> Adicionar nova categoria
      </button>
    </div>`;
}

/* ─── salvar horas da atividade inline ──────────── */
async function salvarHorasAtividade(atvidadeId, valor) {
  const ativ = atividadesData.find(a => a._id === atvidadeId);
  if (!ativ) return;
  try {
    await apiFetch(`/atividades/${atvidadeId}`, {
      method: 'PUT',
      body: JSON.stringify({
        nome: ativ.nome,
        codigo: ativ.codigo,
        cursoId: ativ.cursoId?._id || ativ.cursoId,
        categoriaId: ativ.categoriaId?._id || ativ.categoriaId,
        horasPorSemestre: parseInt(valor) || 0
      })
    });
    ativ.horasPorSemestre = parseInt(valor) || 0;
  } catch (err) { alert('Erro ao salvar horas: ' + err.message); }
}

/* ─── salvar carga horária do curso ─────────────── */
async function salvarConfigCurso() {
  const curso = cursosData.find(c => c._id === currentCursoId);
  if (!curso) return;
  const horasExigidas = parseInt(document.getElementById('configTotalRequired').value) || 100;

  const btn = document.getElementById('saveConfigModalBtn');
  btn.disabled = true;
  try {
    const atualizado = await apiFetch(`/cursos/${currentCursoId}`, {
      method: 'PUT',
      body: JSON.stringify({ nome: curso.nome, horasExigidas })
    });
    curso.horasExigidas = atualizado.horasExigidas;
    updateStats();
    renderTabela();
    configModalInst.hide();
  } catch (err) { alert('Erro ao salvar: ' + err.message); }
  finally { btn.disabled = false; }
}

/* ─── deletar atividade ─────────────────────────── */
async function deletarAtividade(id) {
  if (!confirm('Remover esta atividade?')) return;
  try {
    await apiFetch(`/atividades/${id}`, { method: 'DELETE' });
    atividadesData = atividadesData.filter(a => a._id !== id);
    renderCategoriasConfig();
  } catch (err) { alert('Erro ao remover: ' + err.message); }
}

/* ─── deletar categoria ─────────────────────────── */
async function deletarCategoria(id) {
  if (!confirm('Remover esta categoria e suas atividades?')) return;
  try {
    // Deletar atividades da categoria primeiro
    const ativsDacat = atividadesData.filter(a =>
      (a.categoriaId?._id || a.categoriaId) === id);
    await Promise.all(ativsDacat.map(a => apiFetch(`/atividades/${a._id}`, { method: 'DELETE' })));
    atividadesData = atividadesData.filter(a => (a.categoriaId?._id || a.categoriaId) !== id);

    await apiFetch(`/categorias/${id}`, { method: 'DELETE' });
    categoriasData = categoriasData.filter(c => c._id !== id);
    renderCategoriasConfig();
    renderTabela();
  } catch (err) { alert('Erro ao remover: ' + err.message); }
}

/* ─── modal nova/editar categoria ──────────────── */
function abrirModalNovaCategoria(catId = null) {
  const cat = catId ? categoriasData.find(c => c._id === catId) : null;
  const isEdit = !!cat;

  document.getElementById('catModalTitulo').innerText = isEdit ? 'Editar Categoria' : 'Nova Categoria';
  document.getElementById('catModalNome').value = cat?.nome || '';
  document.getElementById('catModalId').value = catId || '';

  new bootstrap.Modal(document.getElementById('categoriaModal')).show();
}

function editarCategoria(catId) { abrirModalNovaCategoria(catId); }

async function salvarCategoria() {
  const nome  = document.getElementById('catModalNome').value.trim();
  const catId = document.getElementById('catModalId').value;
  if (!nome) { alert('Informe o nome da categoria.'); return; }

  const btn = document.getElementById('btnSalvarCategoria');
  btn.disabled = true;
  try {
    if (catId) {
      // Editar — busca categoria atualizada do backend para não perder cursos
      const catAtual = await apiFetch(`/categorias/${catId}`);
      const cursoIds = (catAtual.cursoId || []).map(c => c._id || c);
      const atualizada = await apiFetch(`/categorias/${catId}`, {
        method: 'PUT',
        body: JSON.stringify({ nome, cursoId: cursoIds })
      });
      const idx = categoriasData.findIndex(c => c._id === catId);
      if (idx !== -1) categoriasData[idx] = atualizada;
    } else {
      // Criar
      const nova = await apiFetch('/categorias', {
        method: 'POST',
        body: JSON.stringify({ nome, cursoId: [currentCursoId] })
      });
      categoriasData.push(nova);
    }
    bootstrap.Modal.getInstance(document.getElementById('categoriaModal')).hide();
    renderCategoriasConfig();
    renderTabela();
  } catch (err) { alert('Erro ao salvar categoria: ' + err.message); }
  finally { btn.disabled = false; }
}

/* ─── modal nova/editar atividade ───────────────── */
function abrirModalNovaAtividade(catId, atvId = null) {
  const atv = atvId ? atividadesData.find(a => a._id === atvId) : null;
  const isEdit = !!atv;

  document.getElementById('atvModalTitulo').innerText = isEdit ? 'Editar Atividade' : 'Nova Atividade';
  document.getElementById('atvModalNome').value       = atv?.nome || '';
  document.getElementById('atvModalCodigo').value     = atv?.codigo || '';
  document.getElementById('atvModalHoras').value      = atv?.horasPorSemestre || 10;
  document.getElementById('atvModalCatId').value      = catId;
  document.getElementById('atvModalId').value         = atvId || '';

  new bootstrap.Modal(document.getElementById('atividadeModal')).show();
}

function editarAtividade(atvId) {
  const atv = atividadesData.find(a => a._id === atvId);
  if (!atv) return;
  abrirModalNovaAtividade(atv.categoriaId?._id || atv.categoriaId, atvId);
}

async function salvarAtividade() {
  const nome            = document.getElementById('atvModalNome').value.trim();
  const codigo          = document.getElementById('atvModalCodigo').value.trim();
  const horasPorSemestre = parseInt(document.getElementById('atvModalHoras').value) || 0;
  const catId           = document.getElementById('atvModalCatId').value;
  const atvId           = document.getElementById('atvModalId').value;

  if (!nome || !codigo) { alert('Preencha nome e código.'); return; }

  const btn = document.getElementById('btnSalvarAtividade');
  btn.disabled = true;
  try {
    if (atvId) {
      // Editar
      const atualizada = await apiFetch(`/atividades/${atvId}`, {
        method: 'PUT',
        body: JSON.stringify({ nome, codigo, horasPorSemestre, cursoId: currentCursoId, categoriaId: catId })
      });
      const idx = atividadesData.findIndex(a => a._id === atvId);
      if (idx !== -1) atividadesData[idx] = atualizada;
    } else {
      // Criar
      const nova = await apiFetch('/atividades', {
        method: 'POST',
        body: JSON.stringify({ nome, codigo, horasPorSemestre, cursoId: currentCursoId, categoriaId: catId })
      });
      atividadesData.push(nova);
    }
    bootstrap.Modal.getInstance(document.getElementById('atividadeModal')).hide();
    renderCategoriasConfig();
  } catch (err) { alert('Erro ao salvar atividade: ' + err.message); }
  finally { btn.disabled = false; }
}

/* ─── INIT ──────────────────────────────────────── */
function init() {
  preencherSidebar();
  carregarDados();

  configModalInst   = new bootstrap.Modal(document.getElementById('configModal'));
  addCursoModalInst = new bootstrap.Modal(document.getElementById('addCourseModal'));

  document.getElementById('confirmAddCourseBtn').addEventListener('click', adicionarCurso);
  document.getElementById('saveConfigModalBtn').addEventListener('click', salvarConfigCurso);
  // Usar delegação porque os modais são recriados dinamicamente
  document.addEventListener('click', function(e) {
    if (e.target.closest('#btnSalvarCategoria')) salvarCategoria();
    if (e.target.closest('#btnSalvarAtividade')) salvarAtividade();
  });

  document.getElementById('searchInput')?.addEventListener('input', e => {
    const term = e.target.value.toLowerCase();
    document.querySelectorAll('#coursesTableBody tr').forEach(row => {
      row.style.display = row.textContent.toLowerCase().includes(term) ? '' : 'none';
    });
  });
}

init();
