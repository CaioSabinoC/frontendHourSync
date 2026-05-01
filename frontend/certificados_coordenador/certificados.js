/* =====================================================
   HourSync — certificados.js (INTEGRADO AO BACKEND)
   Usado por: certificados_admin.html
   Backend: http://localhost:8080
   ===================================================== */

const API_BASE = 'http://localhost:8080';

const GRUPO_CORES = {
  'Atividades de Ensino':   '#4f46e5',
  'Atividades de Pesquisa': '#0891b2',
  'Atividades de Extensão': '#059669',
};

let certificadosData              = [];
let currentSearchTerm             = '';
let currentCertificadoSelecionado = null;
let modalCert, modalConfirm, modalRej;

/* ─── fetch autenticado ─────────────────────────── */
async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('hoursync_token');
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    },
    ...options
  };
  if (options.body instanceof FormData) delete config.headers['Content-Type'];

  const response = await fetch(`${API_BASE}${endpoint}`, config);

  if (response.status === 401) {
    localStorage.removeItem('hoursync_token');
    localStorage.removeItem('hoursync_user');
    window.location.href = '../login/login.html';
    return;
  }
  if (response.status === 204) return null;

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || `Erro ${response.status}`);
  return data;
}

/* ─── normalizar campos do backend ─────────────── */
function normalizarCertificado(cert) {
  const status = cert.status ? (cert.status.charAt(0).toUpperCase() + cert.status.slice(1).toLowerCase()) : 'Pendente';
  return {
    id:                 cert._id || cert.id,
    alunoId:            cert.alunoId?._id || cert.alunoId,
    aluno:              cert.alunoId?.nome       || cert.aluno             || '—',
    matricula:          cert.alunoId?.matricula  || '—',
    curso:              cert.cursoId?.nome       || cert.curso             || '—',
    turma:              cert.turma               || '—',
    grupo:              cert.grupo               || cert.categoriaId?.grupo || '—',
    codigoAtividade:    cert.codigoAtividade     || '—',
    descricaoAtividade: cert.descricaoAtividade  || cert.titulo            || '—',
    horasSolicitadas:   cert.horas               || cert.horasSolicitadas  || 0,
    horasAprovadas:     cert.horasAprovadas       ?? null,
    data: cert.dataEmissao
  ?   new Date(cert.dataEmissao).toLocaleDateString('pt-BR')
  :   '—',
    status,
    imgUrl: cert.arquivoUrl || cert.imgUrl || '../img/certificado.png',
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
  const term     = currentSearchTerm.toLowerCase().trim();
  const filtered = term
    ? certificadosData.filter(c => c.aluno.toLowerCase().includes(term))
    : [...certificadosData];

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
      <td>${getGrupoBadge(cert.grupo)}<br>
        <small class="text-muted"><strong>${cert.codigoAtividade}</strong> — ${cert.descricaoAtividade}</small>
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
  if (img) img.src = src;
  if (link) link.href = src;

  const el = (id, val) => { const e = document.getElementById(id); if (e) e.innerHTML = val; };
  el('modalAlunoNome',      certificado.aluno);
  el('modalAlunoMatricula', certificado.matricula || '—');
  el('modalCurso',          certificado.curso);
  el('modalCategoria', `${getGrupoBadge(certificado.grupo)}
    <br><small class="text-muted mt-1 d-inline-block">
      <strong>${certificado.codigoAtividade}</strong> — ${certificado.descricaoAtividade}
    </small>`);
  el('modalhorasPorSemestre', `<span class="text-muted">Conforme manual do curso</span>`);
  modalCert.show();
}

function abrirModalConfirmacao() {
  if (!currentCertificadoSelecionado) return;
  modalCert.hide();
  if (typeof renderizarCalculoConfirmacao === 'function') renderizarCalculoConfirmacao(currentCertificadoSelecionado, {});
  modalConfirm.show();
}

async function confirmarAprovacao() {
  if (!currentCertificadoSelecionado) return;
  const btn = document.getElementById('btnConfirmarAprovacao');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Aprovando...'; }

  try {
    const usuario = JSON.parse(localStorage.getItem('hoursync_user') || '{}');
    const coordenadorId = usuario._id || usuario.id || '';

    await apiFetch(`/certificados/${currentCertificadoSelecionado.id}/validar?status=APROVADO&coordenadorId=${coordenadorId}`, { method: 'PATCH' });

    const idx = certificadosData.findIndex(c => String(c.id) === String(currentCertificadoSelecionado.id));
    if (idx !== -1) { certificadosData[idx].status = 'Aprovado'; certificadosData[idx].horasAprovadas = certificadosData[idx].horasSolicitadas; }

    updateStats(); renderTabelaCertificados(); modalConfirm.hide();
    showResultModal('success', 'Certificado Aprovado com Sucesso!', '');
  } catch (err) {
    showResultModal('danger', 'Erro ao Aprovar', err.message || 'Não foi possível aprovar.');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = 'Confirmar Aprovação'; }
    currentCertificadoSelecionado = null;
  }
}

function cancelarConfirmacao() { modalConfirm.hide(); currentCertificadoSelecionado = null; }

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
    const coordenadorId = usuario._id || usuario.id || '';

    await apiFetch(
      `/certificados/${currentCertificadoSelecionado.id}/validar?status=REJEITADO&coordenadorId=${coordenadorId}&justificativa=${encodeURIComponent(motivo)}`,
      { method: 'PATCH' }
    );

    const idx = certificadosData.findIndex(c => String(c.id) === String(currentCertificadoSelecionado.id));
    if (idx !== -1) certificadosData[idx].status = 'Rejeitado';

    updateStats(); renderTabelaCertificados(); modalRej.hide();
    showResultModal('danger', 'Certificado Rejeitado', `Aluno: ${currentCertificadoSelecionado.aluno}\nMotivo: ${motivo}`);
  } catch (err) {
    showResultModal('danger', 'Erro ao Rejeitar', err.message || 'Não foi possível rejeitar.');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = 'Confirmar Rejeição'; }
    currentCertificadoSelecionado = null;
  }
}

function init() {
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

  carregarCertificados();
}

init();
