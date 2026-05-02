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



let alunosData        = [];
let cursosDisponiveis = [];
let currentSearchTerm = '';
let cursosAdicionais  = [];



function getCursoNome(cursoId) {
  if (!cursoId) return '—';
  if (Array.isArray(cursoId)) return cursoId.map(c => c?.nome || c).filter(Boolean).join(', ') || '—';
  return cursoId?.nome || '—';
}

function getCursoHoras(cursoId) {
  if (!cursoId) return 0;
  if (Array.isArray(cursoId)) return cursoId[0]?.horasExigidas || 0;
  return cursoId?.horasExigidas || 0;
}

function preencherUsuarioSidebar() {
  const usuario = JSON.parse(localStorage.getItem('hoursync_user') || '{}');
  const nomeEl = document.querySelector('.profile h6');
  if (nomeEl && usuario.nome) nomeEl.textContent = usuario.nome;
}



async function carregarDados() {
  try {
    const [alunos, cursos] = await Promise.all([
      apiFetch('/usuarios/alunos'),
      apiFetch('/cursos')
    ]);

    alunosData        = alunos  || [];
    cursosDisponiveis = cursos  || [];

    preencherSelectCursos();
    updateStats();
    renderTabelaAlunos();
  } catch (err) {
    console.error('Erro ao carregar dados:', err);
    const tbody = document.getElementById('alunosTableBody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-danger">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>Não foi possível carregar os alunos.
    </td></tr>`;
  }
}

function preencherSelectCursos() {
  const select = document.getElementById('cadastroCurso');
  if (!select) return;
  select.innerHTML = '<option value="">Selecione o curso</option>';
  cursosDisponiveis.forEach(c => {
    select.innerHTML += `<option value="${c._id}">${c.nome}</option>`;
  });
}


function getStatus(aluno) {
  const horasCursadas  = aluno.horasCursadas || 0;
  const horasExigidas  = getCursoHoras(aluno.cursoId);
  return horasExigidas > 0 && horasCursadas >= horasExigidas ? 'Concluído' : 'Em Andamento';
}

function updateStats() {
  const total       = alunosData.length;
  const emAndamento = alunosData.filter(a => getStatus(a) === 'Em Andamento').length;
  const concluido   = alunosData.filter(a => getStatus(a) === 'Concluído').length;
  const mediaHoras  = total
    ? Math.round(alunosData.reduce((acc, a) => acc + (a.horasCursadas || 0), 0) / total)
    : 0;

  document.getElementById('totalAlunosCount').innerText = total;
  document.getElementById('emAndamentoCount').innerText = emAndamento;
  document.getElementById('concluidoCount').innerText   = concluido;
  const mediaEl = document.querySelector('.stat-card.border-info-custom .stat-number');
  if (mediaEl) mediaEl.innerHTML = mediaHoras + '<span class="stat-unit">h</span>';
}


function renderTabelaAlunos() {
  const term = currentSearchTerm.toLowerCase().trim();
  const filtered = term
    ? alunosData.filter(a =>
        a.nome?.toLowerCase().includes(term) ||
        a.matricula?.includes(term) ||
        getCursoNome(a.cursoId).toLowerCase().includes(term))
    : [...alunosData];

  const tbody = document.getElementById('alunosTableBody');
  tbody.innerHTML = '';

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">Nenhum aluno encontrado</td></tr>`;
    document.getElementById('exibindoCount').innerText = 0;
    return;
  }

  filtered.forEach(aluno => {
    const horasCursadas = aluno.horasCursadas || 0;
    const horasExigidas = getCursoHoras(aluno.cursoId);
    const pct           = horasExigidas > 0 ? Math.min((horasCursadas / horasExigidas) * 100, 100) : 0;
    const status        = getStatus(aluno);
    const sClass        = status === 'Concluído' ? 'badge-concluido' : 'badge-andamento';
    const cursoNome     = getCursoNome(aluno.cursoId);

    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong style="color:#6c83e6;">${aluno.nome}</strong><br><small style="color:#6c757d;">${aluno.matricula || '—'}</small></td>
      <td><span class="badge-curso-mini">${cursoNome}</span></td>
      <td style="color:#2c3e66;">${horasCursadas}h/${horasExigidas}h</td>
      <td>
        <div class="progress-wrapper">
          <div class="progress"><div class="progress-bar-custom" style="width:${pct}%;"></div></div>
          <span class="progress-text">${Math.round(pct)}%</span>
        </div>
      </td>
      <td><span class="badge-status ${sClass}">${status}</span></td>
      <td><button class="btn-ver" data-id="${aluno._id}">Ver</button></td>`;
    tbody.appendChild(row);
  });

  document.getElementById('exibindoCount').innerText = filtered.length;

  document.querySelectorAll('.btn-ver').forEach(btn => {
    btn.addEventListener('click', () => {
      const aluno = alunosData.find(a => a._id === btn.dataset.id);
      if (aluno) abrirModalAluno(aluno);
    });
  });
}


async function abrirModalAluno(aluno) {
  document.getElementById('modalAlunoNome').innerText      = aluno.nome;
  document.getElementById('modalAlunoMatricula').innerText = aluno.matricula || '—';
  document.getElementById('modalAlunoEmail').innerText     = aluno.email || '—';

  const container = document.getElementById('modalCursosContainer');
  container.innerHTML = '<div class="text-center py-3"><div class="spinner-border spinner-border-sm text-primary"></div> Carregando...</div>';

  new bootstrap.Modal(document.getElementById('modalAluno')).show();

  try {
    
    const todos = await apiFetch('/certificados');
    const aprovados = (todos || []).filter(c =>
      (c.alunoId?._id || c.alunoId) === aluno._id && c.status === 'APROVADO'
    );

    const horasCursadas = aluno.horasCursadas || 0;
    const horasExigidas = getCursoHoras(aluno.cursoId);
    const pct           = horasExigidas > 0 ? Math.min((horasCursadas / horasExigidas) * 100, 100) : 0;
    const restantes     = Math.max(0, horasExigidas - horasCursadas);
    const status        = getStatus(aluno);
    const sClass        = status === 'Concluído' ? 'badge-concluido' : 'badge-andamento';

    const certsHTML = aprovados.length
      ? aprovados.map(cert => `
          <div class="cert-item">
            <span>
              <i class="bi bi-file-text-fill" style="color:#6c83e6;"></i>
              <strong>${cert.categoriaId?.nome || '—'}</strong>
              — ${cert.atividadeId?.nome || cert.titulo || '—'}
            </span>
            <span class="badge bg-light text-dark">${cert.horasAprovadas || cert.horas}h</span>
          </div>`).join('')
      : '<p class="text-muted small">Nenhum certificado aprovado.</p>';

    container.innerHTML = `
      <div class="mb-2"><strong>Curso:</strong> <span style="color:#6c83e6;">${getCursoNome(aluno.cursoId)}</span></div>
      <div class="d-flex align-items-center justify-content-between mb-2">
        <span class="badge-status ${sClass}">${status}</span>
        <span class="text-muted small">${horasCursadas}h / ${horasExigidas}h</span>
      </div>
      <div class="progress progress-md mb-1">
        <div class="progress-bar-custom" style="width:${pct}%;"></div>
      </div>
      <div class="d-flex justify-content-between mb-3">
        <small class="text-muted">${Math.round(pct)}% concluído</small>
        <small class="text-muted">${restantes}h restantes</small>
      </div>
      <h6 class="fw-bold"><i class="bi bi-patch-check"></i> Certificados Aceitos:</h6>
      <div class="modal-cert-list">${certsHTML}</div>`;

  } catch (err) {
    container.innerHTML = `<p class="text-danger">Erro ao carregar certificados.</p>`;
  }
}


async function cadastrarAluno() {
  const nome       = document.getElementById('cadastroNome').value.trim();
  const matricula  = document.getElementById('cadastroMatricula').value.trim();
  const cursoId    = document.getElementById('cadastroCurso').value;
  const email      = document.getElementById('cadastroEmail').value.trim();
  const senha      = document.getElementById('cadastroSenha').value;

  if (!nome || !matricula || !cursoId || !email || !senha) {
    alert('Preencha todos os campos obrigatórios!'); return;
  }
  if (senha.length < 6) { alert('A senha deve ter no mínimo 6 caracteres.'); return; }

  const btn = document.getElementById('btnConfirmarCadastro');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Cadastrando...';

  try {
    await apiFetch('/usuarios', {
      method: 'POST',
      body: JSON.stringify({
        nome, matricula, email, senha,
        cursoId: [cursoId, ...cursosAdicionais].filter(Boolean),
        role: 'ALUNO'
      })
    });

    document.getElementById('formCadastroAluno').reset();
    cursosAdicionais = [];
    renderCursosAdicionais();
    bootstrap.Modal.getInstance(document.getElementById('modalCadastroAluno')).hide();
    alert(`Aluno ${nome} cadastrado com sucesso!`);
    await carregarDados();
  } catch (err) {
    alert('Erro ao cadastrar: ' + (err.message || 'Tente novamente.'));
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Cadastrar Aluno';
  }
}



let cursosAdicionais = [];

function renderCursosAdicionais() {
  const container = document.getElementById('cursosAdicionaisContainer');
  if (!container) return;
  container.innerHTML = cursosAdicionais.map((id, i) => {
    const curso = cursosDisponiveis.find(c => c._id === id);
    return `
      <div class="d-flex align-items-center gap-2 mb-2">
        <select class="form-select form-select-custom" onchange="cursosAdicionais[${i}]=this.value">
          <option value="">Selecione um curso</option>
          ${cursosDisponiveis.map(c => `<option value="${c._id}" ${c._id === id ? 'selected' : ''}>${c.nome}</option>`).join('')}
        </select>
        <button type="button" class="btn btn-sm btn-outline-danger" onclick="removerCursoAdicional(${i})">
          <i class="bi bi-x"></i>
        </button>
      </div>`;
  }).join('');
}

function removerCursoAdicional(i) {
  cursosAdicionais.splice(i, 1);
  renderCursosAdicionais();
}


function init() {
  preencherUsuarioSidebar();
  carregarDados();

  document.getElementById('btnConfirmarCadastro').addEventListener('click', cadastrarAluno);

  document.getElementById('btnAdicionarCurso')?.addEventListener('click', () => {
    cursosAdicionais.push('');
    renderCursosAdicionais();
  });

  document.getElementById('toggleSenhaCadastro')?.addEventListener('click', function () {
    const input = document.getElementById('cadastroSenha');
    const ativo = input.type === 'password';
    input.type = ativo ? 'text' : 'password';
    this.classList.toggle('bi-eye-slash', !ativo);
    this.classList.toggle('bi-eye', ativo);
  });

  document.getElementById('searchInput').addEventListener('input', e => {
    currentSearchTerm = e.target.value;
    renderTabelaAlunos();
  });
}

init();
