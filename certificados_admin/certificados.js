/* =====================================================
   HourSync — certificados.js (ADMIN)
   Backend: https://backendhoursync-1.onrender.com/api
   ===================================================== */

const API_BASE = 'https://backendhoursync-1.onrender.com/api';

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



const GRUPO_CORES = {
  'Atividades de Ensino':   '#4f46e5',
  'Atividades de Pesquisa': '#0891b2',
  'Atividades de Extensão': '#059669',
};

let certificadosData              = [];
let currentSearchTerm             = '';
let currentCursoFilter            = '';
let currentCertificadoSelecionado = null;
let modalCert, modalConfirm, modalRej;

/* ─── usuário logado na sidebar ─────────────────── */
function preencherUsuarioSidebar() {
  const usuario = JSON.parse(localStorage.getItem('hoursync_user') || '{}');
  const nomeEl = document.querySelector('.profile h6');
  const imgEl  = document.querySelector('.profile img');
  if (nomeEl && usuario.nome) nomeEl.textContent = usuario.nome;
  if (imgEl && usuario.foto) imgEl.src = usuario.foto;
}


/* ─── normalizar campos do backend ─────────── */
function normalizarCertificado(cert) {
  const rawStatus = cert.status || 'PENDENTE';
  const status = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1).toLowerCase();
  return {
    id:               cert._id || cert.id,
    alunoId:          cert.alunoId?._id    || cert.alunoId,
    aluno:            cert.alunoId?.nome    || '—',
    matricula:        cert.alunoId?.matricula  || '—',
    horasPorSemestre: cert.atividadeId?.horasPorSemestre ?? '—',
    curso:            cert.cursoId?.nome    || '—',
    turma:            cert.turma            || '—',
    categoria:        cert.categoriaId?.nome || cert.grupo || '—',
    atividade:        cert.atividadeId?.nome || cert.descricaoAtividade || cert.titulo || '—',
    horasSolicitadas: cert.horas            || 0,
    horasAprovadas:   cert.horasAprovadas   ?? null,
    justificativa:    cert.justificativa    || '',
    data: cert.criadoEm
      ? new Date(cert.criadoEm).toLocaleDateString('pt-BR')
      : '—',
    status,
    dataOriginal: cert.criadoEm || null,
    imgUrl: cert.arquivoUrl || '../img/certificado.png',
  };
}

/* ─── carregar do backend ───────────────────────── */
async function carregarCertificados() {
  const tbody = document.getElementById('certificadosTableBody');
  if (tbody) tbody.innerHTML = `
    <tr><td colspan="8" class="text-center py-4">
      <div class="spinner-border text-primary" role="status"></div>
      <div class="mt-2 text-muted">Carregando certificados...</div>
    </td></tr>`;

  try {
    const dados = await apiFetch('/certificados');
    certificadosData = (dados || []).map(normalizarCertificado);

    // Popular filtro de cursos
    const cursoSel = document.getElementById('cursoFilter');
    if (cursoSel) {
      const cursos = [...new Map(certificadosData.map(c => [c.curso, c.curso])).entries()];
      cursos.forEach(([nome]) => {
        if (nome !== '—') cursoSel.innerHTML += `<option value="${nome}">${nome}</option>`;
      });
    }
  } catch (err) {
    console.error('Erro ao carregar:', err);
    if (tbody) tbody.innerHTML = `
      <tr><td colspan="8" class="text-center py-4 text-danger">
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        Não foi possível carregar os certificados. Verifique se o backend está rodando.
      </td></tr>`;
    return;
  }
  updateStats();
  renderTabelaCertificados();
}

function updateStats() {
  const el = (id, v) => { const e = document.getElementById(id); if (e) e.innerText = v; };
  el('pendentesCount',  certificadosData.filter(c => c.status === 'Pendente').length);
  el('aprovadosCount',  certificadosData.filter(c => c.status === 'Aprovado').length);
  el('rejeitadosCount', certificadosData.filter(c => c.status === 'Rejeitado').length);
}

function getGrupoBadge(grupo) {
  const cor = GRUPO_CORES[grupo];
  if (!cor) return `<span class="badge bg-secondary">${grupo || '—'}</span>`;
  return `<span class="badge" style="background:${cor}22;color:${cor};border:1px solid ${cor}55;">${grupo}</span>`;
}

function renderTabelaCertificados() {
  const term = currentSearchTerm.toLowerCase().trim();

  let filtered = [...certificadosData];

  // Filtro por busca
  if (term) filtered = filtered.filter(c => c.aluno.toLowerCase().includes(term));

  // Filtro por curso
  if (currentCursoFilter) filtered = filtered.filter(c =>
    (c.cursoId?._id || c.cursoId) === currentCursoFilter ||
    c.curso === currentCursoFilter
  );

  // Ordenação: pendentes primeiro, depois por data de criação
  const ordem = { 'Pendente': 0, 'Aprovado': 1, 'Rejeitado': 2 };
  filtered.sort((a, b) => {
    const statusDiff = (ordem[a.status] ?? 9) - (ordem[b.status] ?? 9);
    if (statusDiff !== 0) return statusDiff;
    return new Date(b.dataOriginal) - new Date(a.dataOriginal);
  });

  const tbody = document.getElementById('certificadosTableBody');
  tbody.innerHTML = '';

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">Nenhum certificado encontrado</td></tr>`;
    const ec = document.getElementById('exibindoCount'); if (ec) ec.innerText = 0;
    return;
  }

  filtered.forEach(cert => {
    let statusHtml = '';
    if (cert.status === 'Aprovado') {
      const h = cert.horasAprovadas !== null ? cert.horasAprovadas : cert.horasSolicitadas;
      statusHtml = `<span class="status-aprovado"><i class="bi bi-check-circle-fill me-1"></i>Aprovado (${h}h)</span>`;
    } else if (cert.status === 'Pendente') {
      statusHtml = `<span class="status-pendente"><i class="bi bi-hourglass-split me-1"></i>Pendente</span>`;
    } else {
      statusHtml = `<span class="status-rejeitado"><i class="bi bi-x-circle-fill me-1"></i>Rejeitado</span>`;
    }

    const btnAnalise = cert.status === 'Pendente'
      ? `<button class="btn-analisar" data-id="${cert.id}">Analisar</button>`
      : `<button class="btn-analisar" style="background:#b0b8d4;cursor:not-allowed;" disabled>Analisar</button>`;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${cert.aluno}</strong></td>
      <td>${cert.curso}</td>
      <td>${cert.turma}</td>
      <td>
        <div>${cert.categoria}</div>
        <small class="text-muted">${cert.atividade}</small>
      </td>
      <td>${cert.horasSolicitadas}h</td>
      <td>${cert.data}</td>
      <td>${statusHtml}</td>
      <td>${btnAnalise}</td>`;
    tbody.appendChild(row);
  });

  const ec = document.getElementById('exibindoCount'); if (ec) ec.innerText = filtered.length;

  document.querySelectorAll('.btn-analisar[data-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const cert = certificadosData.find(c => String(c.id) === String(btn.dataset.id));
      if (cert && cert.status === 'Pendente') abrirModalVisualizar(cert);
    });
  });
}

function abrirModalVisualizar(certificado) {
  currentCertificadoSelecionado = certificado;
  const img  = document.getElementById('modalCertificadoImg');
  const link = document.getElementById('modalCertificadoLink');
  const src  = certificado.imgUrl;
  if (img)  img.src  = src;
  if (link) link.href = src;

  const el = (id, val) => { const e = document.getElementById(id); if (e) e.innerHTML = val; };
  el('modalAlunoNome',      certificado.aluno);
  el('modalAlunoMatricula', certificado.matricula || '—');
  el('modalCurso',          certificado.curso);
  el('modalCategoria', `<strong>${certificado.categoria}</strong>`);
  el('modalAtividade', certificado.atividade || '—');
  el('modalHorasSolicitadas', `${certificado.horasSolicitadas}h`);
  el('modalLimiteSubcat', `<span class="text-muted">${certificado.horasPorSemestre}h por semestre</span>`);
  modalCert.show();
}

/* ─── APROVAR ───────────────────────────────────── */
function abrirModalConfirmacao() {
  if (!currentCertificadoSelecionado) return;
  modalCert.hide();

  const cert = currentCertificadoSelecionado;
  const horasSolicitadas = cert.horasSolicitadas || 0;
  const limite = cert.horasPorSemestre !== '—' ? cert.horasPorSemestre : null;
  const horasAceitas = (limite !== null && horasSolicitadas > limite) ? limite : horasSolicitadas;

  // Salva as horas aceitas para usar na confirmação
  currentCertificadoSelecionado._horasAceitas = horasAceitas;

  const cont = document.getElementById('calculoContentConfirmacao');
  if (cont) {
    const excedeu = limite !== null && horasSolicitadas > limite;
    cont.innerHTML = `
      <p><strong>Aluno:</strong> ${cert.aluno}</p>
      <p><strong>Atividade:</strong> ${cert.atividade}</p>
      <hr>
      <p><strong>Horas solicitadas:</strong> ${horasSolicitadas}h</p>
      <p><strong>Limite da atividade:</strong> ${limite !== null ? limite + 'h por semestre' : '—'}</p>
      <hr>
      <p style="font-size:1.1rem;">
        <strong>Horas aceitas:</strong>
        <span style="color:${excedeu ? '#e05c2a' : '#22c55e'};font-weight:bold;"> ${horasAceitas}h</span>
        ${excedeu ? '<small class="text-muted"> (limitado pelo teto da atividade)</small>' : ''}
      </p>`;
  }
  modalConfirm.show();
}

async function confirmarAprovacao() {
  if (!currentCertificadoSelecionado) return;
  const btn = document.getElementById('btnConfirmarAprovacao');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Aprovando...'; }

  try {
    const usuario = JSON.parse(localStorage.getItem('hoursync_user') || '{}');

    await apiFetch(`/certificados/${currentCertificadoSelecionado.id}/status`, {
      method: 'PUT',
      body: JSON.stringify({
        status: 'APROVADO',
        horasAprovadas: currentCertificadoSelecionado._horasAceitas ?? currentCertificadoSelecionado.horasSolicitadas,
        coordenadorId: usuario._id || usuario.id || ''
      })
    });

    const idx = certificadosData.findIndex(c => String(c.id) === String(currentCertificadoSelecionado.id));
    if (idx !== -1) {
      certificadosData[idx].status = 'Aprovado';
      certificadosData[idx].horasAprovadas = currentCertificadoSelecionado._horasAceitas ?? currentCertificadoSelecionado.horasSolicitadas;
    }

    updateStats();
    renderTabelaCertificados();
    modalConfirm.hide();
    alert('Certificado aprovado com sucesso!');
  } catch (err) {
    alert('Erro ao aprovar: ' + (err.message || 'Tente novamente.'));
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="bi bi-check-lg"></i> Confirmar Aprovação'; }
    currentCertificadoSelecionado = null;
  }
}

function cancelarConfirmacao() { modalConfirm.hide(); currentCertificadoSelecionado = null; }

/* ─── REJEITAR ──────────────────────────────────── */
function abrirModalRejeicao() {
  modalCert.hide();
  const m = document.getElementById('motivoRejeicao'); if (m) m.value = '';
  modalRej.show();
}

async function confirmarRejeicao() {
  const motivo = document.getElementById('motivoRejeicao')?.value.trim();
  if (!motivo) { alert('Digite um motivo para a rejeição.'); return; }
  if (!currentCertificadoSelecionado) return;

  const btn = document.getElementById('confirmarRejeicaoBtn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Rejeitando...'; }

  try {
    const usuario = JSON.parse(localStorage.getItem('hoursync_user') || '{}');

    await apiFetch(`/certificados/${currentCertificadoSelecionado.id}/status`, {
      method: 'PUT',
      body: JSON.stringify({
        status: 'REJEITADO',
        justificativa: motivo,
        coordenadorId: usuario._id || usuario.id || ''
      })
    });

    const idx = certificadosData.findIndex(c => String(c.id) === String(currentCertificadoSelecionado.id));
    if (idx !== -1) certificadosData[idx].status = 'Rejeitado';

    updateStats();
    renderTabelaCertificados();
    modalRej.hide();
    alert('Certificado rejeitado.');
  } catch (err) {
    alert('Erro ao rejeitar: ' + (err.message || 'Tente novamente.'));
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = 'Enviar para aluno'; }
    currentCertificadoSelecionado = null;
  }
}

/* ─── INIT ──────────────────────────────────────── */
function init() {
  preencherUsuarioSidebar();

  modalCert    = new bootstrap.Modal(document.getElementById('modalCertificado'));
  modalConfirm = new bootstrap.Modal(document.getElementById('modalConfirmacaoAprovacao'));
  modalRej     = new bootstrap.Modal(document.getElementById('modalRejeicao'));

  document.getElementById('btnAprovarModal')?.addEventListener('click', abrirModalConfirmacao);
  document.getElementById('btnRejeitarModal')?.addEventListener('click', abrirModalRejeicao);
  document.getElementById('btnConfirmarAprovacao')?.addEventListener('click', confirmarAprovacao);
  document.getElementById('btnCancelarConfirmacao')?.addEventListener('click', cancelarConfirmacao);
  document.getElementById('confirmarRejeicaoBtn')?.addEventListener('click', confirmarRejeicao);
  document.getElementById('searchInput')?.addEventListener('input', e => {
    currentSearchTerm = e.target.value;
    renderTabelaCertificados();
  });

  document.getElementById('cursoFilter')?.addEventListener('change', e => {
    currentCursoFilter = e.target.value;
    renderTabelaCertificados();
  });

  carregarCertificados();
}

init();
