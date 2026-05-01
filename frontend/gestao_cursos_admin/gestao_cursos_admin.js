/* =====================================================
   HourSync — gestao_cursos_admin.js  (v28)
   - Sem limite por semestre
   - Categorias e subcategorias totalmente editáveis
   ===================================================== */

/* ---------- ESTADO GLOBAL ---------- */
let CATEGORIAS_MANUAL = {
  "Atividades de Ensino": {
    descricao: "Atividades vinculadas ao ensino",
    cor: "#4f46e5",
    subcategorias: [
      { codigo: "1.1", descricao: "Participação em monitoria no curso",                                      limiteHoras: 20, unidade: "por semestre" },
      { codigo: "1.2", descricao: "Comparecimento a defesas de monografias – temas pertinentes",             limiteHoras: 2,  unidade: "por participação" },
      { codigo: "1.3", descricao: "Disciplina cursada em outros cursos da Faculdade Senac",                  limiteHoras: 20, unidade: "por disciplina" },
      { codigo: "1.4", descricao: "Disciplinas cursadas fora da Faculdade Senac",                            limiteHoras: 20, unidade: "por disciplina" },
      { codigo: "1.5", descricao: "Cursos instrumentais – informática e/ou Língua Estrangeira",              limiteHoras: 10, unidade: "por semestre" },
      { codigo: "1.6", descricao: "Certificações Reconhecidas da área",                                      limiteHoras: 10, unidade: "por semestre" },
      { codigo: "1.7", descricao: "Elaboração de material didático com supervisão do professor",             limiteHoras: 5,  unidade: "por material" },
      { codigo: "1.8", descricao: "Atividade extraclasse promovida como parte da formação do aluno",         limiteHoras: 10, unidade: "por participação" },
      { codigo: "1.9", descricao: "Visitas técnicas",                                                        limiteHoras: 4,  unidade: "por visita" }
    ]
  },
  "Atividades de Pesquisa": {
    descricao: "Atividades vinculadas à pesquisa",
    cor: "#0891b2",
    subcategorias: [
      { codigo: "2.1", descricao: "Participação em pesquisas ou atividades de pesquisa",                    limiteHoras: 10, unidade: "por produto final publicado" },
      { codigo: "2.2", descricao: "Programas de bolsa de Iniciação Científica",                             limiteHoras: 20, unidade: "por bolsa" },
      { codigo: "2.3", descricao: "Publicações de artigos em revistas, periódicos e congêneres",            limiteHoras: 10, unidade: "por produto publicado" },
      { codigo: "2.4", descricao: "Publicação em livro na área",                                            limiteHoras: 40, unidade: "por produto publicado" },
      { codigo: "2.5", descricao: "Participação em programa especial de treinamento",                       limiteHoras: 10, unidade: "por semestre" }
    ]
  },
  "Atividades de Extensão": {
    descricao: "Atividades vinculadas à extensão",
    cor: "#059669",
    subcategorias: [
      { codigo: "3.1", descricao: "Participação em seminários, congressos, conferências, encontros",        limiteHoras: 10, unidade: "por participação (4h como público)" },
      { codigo: "3.2", descricao: "Atendimento comunitário de cunho social",                                limiteHoras: 10, unidade: "por semestre" },
      { codigo: "3.3", descricao: "Apresentação de trabalhos, concursos, exposições, mostras",              limiteHoras: 10, unidade: "pela apresentação" },
      { codigo: "3.4", descricao: "Estágio extracurricular em entidades públicas ou privadas conveniadas",  limiteHoras: 20, unidade: "por semestre" },
      { codigo: "3.5", descricao: "Participação em órgãos colegiados da Faculdade Senac",                   limiteHoras: 5,  unidade: "por semestre" },
      { codigo: "3.6", descricao: "Representação estudantil",                                               limiteHoras: 10, unidade: "por semestre" },
      { codigo: "3.7", descricao: "Cursos de extensão universitária, dentro ou fora da Faculdade Senac",    limiteHoras: 10, unidade: "por curso" }
    ]
  }
};

/* Monta config padrão sem semesterHours */
function buildDefaultConfig() {
  const limits = {};
  Object.keys(CATEGORIAS_MANUAL).forEach(grupo => {
    CATEGORIAS_MANUAL[grupo].subcategorias.forEach(sub => {
      limits[`${grupo}||${sub.codigo}`] = sub.limiteHoras;
    });
  });
  return {
    acceptedGroups: Object.keys(CATEGORIAS_MANUAL),
    limits,
    totalRequired: 100
  };
}

let courses = [
  { id:"c1", name:"ADS",                totalHours:100, code:"ADS-01",  duration:4, config: buildDefaultConfig() },
  { id:"c2", name:"Jogos Digitais",      totalHours:100, code:"JD-02",   duration:4, config: buildDefaultConfig() },
  { id:"c3", name:"Internet das Coisas", totalHours:100, code:"IOT-03",  duration:3, config: buildDefaultConfig() },
  { id:"c4", name:"Gastronomia",         totalHours:100, code:"GAST-04", duration:4, config: buildDefaultConfig() }
];

let currentConfigCourseId = null;
let configModalInstance   = null;
let addModalInstance      = null;

// Estado temporário dos grupos editados no modal (antes de salvar)
let editingGroups = null;

/* ---------- UTILS ---------- */
function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function generateId() {
  return 'id_' + Math.random().toString(36).substr(2,9) + Date.now().toString(36);
}

/* ---------- STATS ---------- */
function updateStats() {
  const totalGrupos = new Set(courses.flatMap(c => c.config?.acceptedGroups || []));
  document.getElementById('totalCursosCount').innerText     = courses.length;
  document.getElementById('totalHorasCount').innerText      = courses.reduce((s,c) => s + (c.config?.totalRequired || 0), 0);
  document.getElementById('totalCategoriasCount').innerText = totalGrupos.size;
  const avg = courses.length
    ? (courses.reduce((s,c) => s + (c.config?.totalRequired || 0), 0) / courses.length).toFixed(1)
    : 0;
  document.getElementById('mediaHorasExigidas').innerText = avg;
}

/* ---------- TABELA ---------- */
function renderCoursesTable() {
  const tbody = document.getElementById('coursesTableBody');
  if (!tbody) return;
  if (courses.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">Nenhum curso cadastrado.</td></tr>';
    return;
  }
  tbody.innerHTML = courses.map(c => {
    const grupos = c.config?.acceptedGroups || [];
    const gruposHtml = grupos.length
      ? grupos.map(g => {
          const cor = CATEGORIAS_MANUAL[g]?.cor || '#6c757d';
          return `<span class="category-badge" style="background:${cor}18;color:${cor};border:1px solid ${cor}55;font-size:0.72rem;">${escapeHtml(g)}</span>`;
        }).join(' ')
      : '<span class="text-muted">Nenhuma</span>';

    return `
      <tr>
        <td><strong>${escapeHtml(c.name)}</strong>${c.code ? `<br><small class="text-muted">${escapeHtml(c.code)}</small>` : ''}</td>
        <td>${c.config?.totalRequired || 0}h exigidas</td>
        <td>${gruposHtml}</td>
        <td>
          <button class="btn-action configure" data-id="${c.id}" title="Configurar"><i class="bi bi-gear-fill"></i></button>
          <button class="btn-action delete"    data-id="${c.id}" title="Remover"><i class="bi bi-trash-fill"></i></button>
        </td>
      </tr>
    `;
  }).join('');

  document.querySelectorAll('.btn-action.delete').forEach(btn =>
    btn.addEventListener('click', e => { e.stopPropagation(); deleteCourse(btn.dataset.id); }));
  document.querySelectorAll('.btn-action.configure').forEach(btn =>
    btn.addEventListener('click', e => { e.stopPropagation(); openConfigModal(btn.dataset.id); }));
}

function deleteCourse(id) {
  if (confirm('Remover este curso?')) {
    courses = courses.filter(c => c.id !== id);
    if (currentConfigCourseId === id) currentConfigCourseId = null;
    renderCoursesTable();
    updateStats();
  }
}

/* ================================================================
   MODAL CONFIG — grupos totalmente editáveis
   ================================================================ */

function openConfigModal(courseId) {
  const course = courses.find(c => c.id === courseId);
  if (!course) return;
  currentConfigCourseId = courseId;

  document.getElementById('configModalCourseInfo').innerHTML =
    `<i class="bi bi-check-circle-fill text-success me-2"></i> Configurando: <strong>${escapeHtml(course.name)}</strong>`;

  const cfg = course.config || buildDefaultConfig();
  document.getElementById('configTotalRequired').value = cfg.totalRequired || 100;

  // Clonar grupos do manual mais overrides do curso para edição temporária
  editingGroups = deepCloneGroups(cfg);

  renderGruposConfig();

  if (!configModalInstance) configModalInstance = new bootstrap.Modal(document.getElementById('configModal'));
  configModalInstance.show();
}

/* Clona estrutura de grupos para edição temporária */
function deepCloneGroups(cfg) {
  const result = {};
  Object.entries(CATEGORIAS_MANUAL).forEach(([grupo, info]) => {
    result[grupo] = {
      descricao: info.descricao,
      cor: info.cor,
      enabled: (cfg.acceptedGroups || []).includes(grupo),
      subcategorias: info.subcategorias.map(sub => {
        const key = `${grupo}||${sub.codigo}`;
        return {
          codigo: sub.codigo,
          descricao: sub.descricao,
          limiteHoras: cfg.limits?.[key] !== undefined ? cfg.limits[key] : sub.limiteHoras,
          unidade: sub.unidade
        };
      })
    };
  });
  return result;
}

/* -------- renderGruposConfig -------- */
function renderGruposConfig() {
  const container = document.getElementById('gruposConfigContainer');
  if (!container) return;

  const gruposHtml = Object.entries(editingGroups).map(([grupo, info]) => {
    const grupoId = grupo.replace(/\s/g,'_');
    const subcatsHtml = info.subcategorias.map((sub, idx) => buildSubcatRow(grupo, idx, sub, info.enabled)).join('');

    return `
      <div class="grupo-block mb-3 p-3 rounded border" data-grupo="${escapeHtml(grupo)}" style="border-left:4px solid ${info.cor} !important;">
        <!-- Cabeçalho do grupo -->
        <div class="d-flex align-items-center gap-2 mb-2 flex-wrap">
          <input class="form-check-input grupo-checkbox" type="checkbox"
            id="chk_${grupoId}" data-grupo="${escapeHtml(grupo)}" ${info.enabled ? 'checked' : ''}>
          <label class="fw-bold mb-0 flex-grow-1" for="chk_${grupoId}" style="color:${info.cor};cursor:pointer;">
            ${escapeHtml(grupo)}
          </label>
          <span class="badge ms-1" style="background:${info.cor}22;color:${info.cor};">${info.subcategorias.length} atividades</span>
          <button class="btn btn-sm btn-outline-danger ms-1 btn-del-grupo" data-grupo="${escapeHtml(grupo)}" title="Excluir categoria">
            <i class="bi bi-trash"></i>
          </button>
          <button class="btn btn-sm btn-outline-secondary btn-edit-grupo" data-grupo="${escapeHtml(grupo)}" title="Renomear categoria">
            <i class="bi bi-pencil"></i>
          </button>
        </div>

        <!-- Subcategorias -->
        <div class="subcats-container ps-1" data-grupo="${escapeHtml(grupo)}">
          ${subcatsHtml}
        </div>

        <!-- Botão adicionar subcategoria -->
        <div class="mt-2">
          <button class="btn btn-sm btn-outline-primary btn-add-subcat" data-grupo="${escapeHtml(grupo)}" ${info.enabled ? '' : 'disabled'}>
            <i class="bi bi-plus-circle me-1"></i> Adicionar atividade
          </button>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = gruposHtml + `
    <div class="text-center mt-3">
      <button class="btn btn-outline-success btn-sm" id="btnAddGrupo">
        <i class="bi bi-plus-lg me-1"></i> Adicionar nova categoria
      </button>
    </div>
  `;

  bindGrupoEvents(container);
}

function buildSubcatRow(grupo, idx, sub, grupoEnabled) {
  return `
    <div class="d-flex align-items-center gap-2 mb-2 flex-wrap subcat-row" data-grupo="${escapeHtml(grupo)}" data-idx="${idx}">
      <span class="badge bg-secondary" style="min-width:36px;text-align:center;">${escapeHtml(sub.codigo)}</span>
      <span class="flex-grow-1 small" title="${escapeHtml(sub.descricao)}">${escapeHtml(sub.descricao)}</span>
      <span class="text-muted" style="font-size:0.7rem;white-space:nowrap;">(${escapeHtml(sub.unidade)})</span>
      <div class="input-group input-group-sm" style="width:100px;flex-shrink:0;">
        <input type="number" class="form-control form-control-sm subcat-limit-input"
          data-grupo="${escapeHtml(grupo)}" data-idx="${idx}"
          value="${sub.limiteHoras}" min="0"
          ${grupoEnabled ? '' : 'disabled'}>
        <span class="input-group-text">h</span>
      </div>
      <button class="btn btn-sm btn-outline-secondary btn-edit-subcat p-1" data-grupo="${escapeHtml(grupo)}" data-idx="${idx}" title="Editar" ${grupoEnabled ? '' : 'disabled'}>
        <i class="bi bi-pencil" style="font-size:0.7rem;"></i>
      </button>
      <button class="btn btn-sm btn-outline-danger btn-del-subcat p-1" data-grupo="${escapeHtml(grupo)}" data-idx="${idx}" title="Excluir" ${grupoEnabled ? '' : 'disabled'}>
        <i class="bi bi-trash" style="font-size:0.7rem;"></i>
      </button>
    </div>
  `;
}

function bindGrupoEvents(container) {
  // Toggle grupo
  container.querySelectorAll('.grupo-checkbox').forEach(chk => {
    chk.addEventListener('change', () => {
      editingGroups[chk.dataset.grupo].enabled = chk.checked;
      syncLimitInputs(chk.closest('.grupo-block'), chk.checked);
      container.querySelector(`.btn-add-subcat[data-grupo="${CSS.escape(chk.dataset.grupo)}"]`).disabled = !chk.checked;
    });
  });

  // Sincroniza inputs de limite quando muda habilitado/desabilitado
  function syncLimitInputs(block, enabled) {
    block.querySelectorAll('.subcat-limit-input, .btn-edit-subcat, .btn-del-subcat').forEach(el => el.disabled = !enabled);
  }

  // Excluir grupo
  container.querySelectorAll('.btn-del-grupo').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm(`Excluir a categoria "${btn.dataset.grupo}" e todas as suas atividades?`)) {
        delete editingGroups[btn.dataset.grupo];
        renderGruposConfig();
      }
    });
  });

  // Renomear grupo
  container.querySelectorAll('.btn-edit-grupo').forEach(btn => {
    btn.addEventListener('click', () => {
      const grupoAtual = btn.dataset.grupo;
      openGrupoModal(grupoAtual);
    });
  });

  // Adicionar subcategoria
  container.querySelectorAll('.btn-add-subcat').forEach(btn => {
    btn.addEventListener('click', () => openSubcatModal(btn.dataset.grupo, null));
  });

  // Editar subcategoria
  container.querySelectorAll('.btn-edit-subcat').forEach(btn => {
    btn.addEventListener('click', () => openSubcatModal(btn.dataset.grupo, parseInt(btn.dataset.idx)));
  });

  // Excluir subcategoria
  container.querySelectorAll('.btn-del-subcat').forEach(btn => {
    btn.addEventListener('click', () => {
      const g = btn.dataset.grupo;
      const i = parseInt(btn.dataset.idx);
      if (confirm(`Excluir a atividade "${editingGroups[g].subcategorias[i].descricao}"?`)) {
        editingGroups[g].subcategorias.splice(i, 1);
        renderGruposConfig();
      }
    });
  });

  // Sync inputs de limite em tempo real
  container.querySelectorAll('.subcat-limit-input').forEach(inp => {
    inp.addEventListener('input', () => {
      const g = inp.dataset.grupo;
      const i = parseInt(inp.dataset.idx);
      editingGroups[g].subcategorias[i].limiteHoras = parseInt(inp.value) || 0;
    });
  });

  // Adicionar novo grupo
  document.getElementById('btnAddGrupo')?.addEventListener('click', () => openGrupoModal(null));
}

/* -------- Modal: Editar / Criar grupo -------- */
function openGrupoModal(grupoAtual) {
  // Reutilizar modal inline simples
  const isEdit = grupoAtual !== null;
  const info = isEdit ? editingGroups[grupoAtual] : null;

  const modalHtml = `
    <div class="modal fade" id="grupoModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header modal-header-gradient">
            <h5 class="modal-title"><i class="bi bi-collection me-2"></i> ${isEdit ? 'Editar' : 'Nova'} Categoria</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4">
            <div class="mb-3">
              <label class="form-label fw-bold">Nome da Categoria</label>
              <input type="text" class="form-control" id="grupoModalNome" value="${escapeHtml(grupoAtual || '')}" placeholder="Ex: Atividades Culturais">
            </div>
            <div class="mb-3">
              <label class="form-label fw-bold">Cor (hex)</label>
              <div class="d-flex gap-2 align-items-center">
                <input type="color" class="form-control form-control-color" id="grupoModalCor" value="${info?.cor || '#6c757d'}" style="width:60px;height:38px;">
                <input type="text" class="form-control" id="grupoModalCorHex" value="${info?.cor || '#6c757d'}" placeholder="#000000">
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary btn-cancel-modal" data-bs-dismiss="modal">Cancelar</button>
            <button class="btn btn-primary" id="confirmGrupoBtn">${isEdit ? 'Salvar' : 'Criar'}</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Remove modal anterior se existir
  document.getElementById('grupoModal')?.remove();
  document.body.insertAdjacentHTML('beforeend', modalHtml);

  const modalEl = document.getElementById('grupoModal');
  const corInput = document.getElementById('grupoModalCor');
  const hexInput = document.getElementById('grupoModalCorHex');
  corInput.addEventListener('input', () => { hexInput.value = corInput.value; });
  hexInput.addEventListener('input', () => { if(/^#[0-9A-Fa-f]{6}$/.test(hexInput.value)) corInput.value = hexInput.value; });

  const modal = new bootstrap.Modal(modalEl);
  modal.show();

  document.getElementById('confirmGrupoBtn').addEventListener('click', () => {
    const novoNome = document.getElementById('grupoModalNome').value.trim();
    const novaCor  = document.getElementById('grupoModalCorHex').value.trim() || '#6c757d';
    if (!novoNome) { alert('Informe o nome da categoria.'); return; }

    if (isEdit) {
      if (novoNome !== grupoAtual) {
        // Renomear chave
        const antiga = editingGroups[grupoAtual];
        editingGroups[novoNome] = { ...antiga, cor: novaCor };
        delete editingGroups[grupoAtual];
      } else {
        editingGroups[grupoAtual].cor = novaCor;
      }
    } else {
      editingGroups[novoNome] = {
        descricao: novoNome,
        cor: novaCor,
        enabled: true,
        subcategorias: []
      };
    }

    modal.hide();
    modalEl.addEventListener('hidden.bs.modal', () => { modalEl.remove(); renderGruposConfig(); }, { once: true });
  });

  modalEl.addEventListener('hidden.bs.modal', () => { modalEl.remove(); }, { once: true });
}

/* -------- Modal: Editar / Criar subcategoria -------- */
function openSubcatModal(grupo, idx) {
  const isEdit = idx !== null;
  const sub = isEdit ? editingGroups[grupo].subcategorias[idx] : null;

  // Calcular próximo código automático
  function getNextCodigo() {
    const subs = editingGroups[grupo].subcategorias;
    const nums = subs.map(s => parseFloat(s.codigo)).filter(n => !isNaN(n));
    const max = nums.length ? Math.max(...nums) : 0;
    const grupoIdx = Object.keys(editingGroups).indexOf(grupo) + 1;
    return `${grupoIdx}.${subs.length + 1}`;
  }

  const modalHtml = `
    <div class="modal fade" id="subcatModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header modal-header-gradient">
            <h5 class="modal-title"><i class="bi bi-list-task me-2"></i> ${isEdit ? 'Editar' : 'Nova'} Atividade</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4">
            <div class="mb-3">
              <label class="form-label fw-bold">Código</label>
              <input type="text" class="form-control" id="subcatCodigo" value="${escapeHtml(sub?.codigo || getNextCodigo())}" placeholder="Ex: 1.1">
            </div>
            <div class="mb-3">
              <label class="form-label fw-bold">Descrição da Atividade</label>
              <textarea class="form-control" id="subcatDescricao" rows="2" placeholder="Ex: Participação em monitoria no curso">${escapeHtml(sub?.descricao || '')}</textarea>
            </div>
            <div class="row">
              <div class="col-6 mb-3">
                <label class="form-label fw-bold">Limite de Horas</label>
                <input type="number" class="form-control" id="subcatHoras" value="${sub?.limiteHoras || 10}" min="0">
              </div>
              <div class="col-6 mb-3">
                <label class="form-label fw-bold">Unidade</label>
                <input type="text" class="form-control" id="subcatUnidade" value="${escapeHtml(sub?.unidade || 'por participação')}" placeholder="Ex: por semestre">
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary btn-cancel-modal" data-bs-dismiss="modal">Cancelar</button>
            <button class="btn btn-primary" id="confirmSubcatBtn">${isEdit ? 'Salvar' : 'Adicionar'}</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('subcatModal')?.remove();
  document.body.insertAdjacentHTML('beforeend', modalHtml);

  const modalEl = document.getElementById('subcatModal');
  const modal = new bootstrap.Modal(modalEl);
  modal.show();

  document.getElementById('confirmSubcatBtn').addEventListener('click', () => {
    const codigo   = document.getElementById('subcatCodigo').value.trim();
    const descricao = document.getElementById('subcatDescricao').value.trim();
    const horas    = parseInt(document.getElementById('subcatHoras').value) || 0;
    const unidade  = document.getElementById('subcatUnidade').value.trim() || 'por participação';

    if (!descricao) { alert('Informe a descrição da atividade.'); return; }

    const novaSub = { codigo, descricao, limiteHoras: horas, unidade };

    if (isEdit) {
      editingGroups[grupo].subcategorias[idx] = novaSub;
    } else {
      editingGroups[grupo].subcategorias.push(novaSub);
    }

    modal.hide();
    modalEl.addEventListener('hidden.bs.modal', () => { modalEl.remove(); renderGruposConfig(); }, { once: true });
  });

  modalEl.addEventListener('hidden.bs.modal', () => { modalEl.remove(); }, { once: true });
}

/* ---------- SALVAR CONFIG ---------- */
function saveCurrentConfig() {
  const course = courses.find(c => c.id === currentConfigCourseId);
  if (!course) { alert('Nenhum curso selecionado.'); return; }

  const totalRequired = parseInt(document.getElementById('configTotalRequired').value) || 100;

  const selectedGroups = [];
  const limits = {};

  Object.entries(editingGroups).forEach(([grupo, info]) => {
    // Salvar subcategorias de volta no CATEGORIAS_MANUAL global
    if (!CATEGORIAS_MANUAL[grupo]) {
      CATEGORIAS_MANUAL[grupo] = { descricao: info.descricao, cor: info.cor, subcategorias: [] };
    }
    CATEGORIAS_MANUAL[grupo].subcategorias = info.subcategorias.map(s => ({ ...s }));
    CATEGORIAS_MANUAL[grupo].cor = info.cor;

    if (info.enabled) selectedGroups.push(grupo);
    info.subcategorias.forEach(sub => {
      limits[`${grupo}||${sub.codigo}`] = sub.limiteHoras;
    });
  });

  // Remover grupos deletados do CATEGORIAS_MANUAL
  Object.keys(CATEGORIAS_MANUAL).forEach(g => {
    if (!editingGroups[g]) delete CATEGORIAS_MANUAL[g];
  });

  course.config = { acceptedGroups: selectedGroups, limits, totalRequired };
  course.totalHours = totalRequired;

  alert(`Configurações salvas para: ${course.name}`);
  renderCoursesTable();
  updateStats();
  configModalInstance?.hide();
}

/* ---------- ADICIONAR CURSO ---------- */
function addNewCourse() {
  const name = document.getElementById('newCourseName').value.trim();
  const code = document.getElementById('newCourseCode').value.trim();
  const dur  = document.getElementById('newCourseDuration').value;
  if (!name) { alert('Informe o nome do curso.'); return; }

  const cfg = buildDefaultConfig();
  cfg.totalRequired = parseInt(document.getElementById('newCourseTotalHours').value) || 100;

  courses.push({
    id: generateId(),
    name,
    totalHours: cfg.totalRequired,
    code: code || null,
    duration: parseInt(dur),
    config: cfg
  });

  renderCoursesTable();
  updateStats();
  addModalInstance?.hide();

  ['newCourseName','newCourseCode'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('newCourseTotalHours').value = '100';
  document.getElementById('newCourseDuration').value   = '4';
  alert(`Curso "${name}" adicionado!`);
}

/* ---------- BUSCA ---------- */
function setupSearch() {
  document.getElementById('searchInput')?.addEventListener('input', e => {
    const term = e.target.value.toLowerCase();
    document.querySelectorAll('#coursesTableBody tr').forEach(row => {
      row.style.display = row.textContent.toLowerCase().includes(term) ? '' : 'none';
    });
  });
}

/* ---------- INIT ---------- */
function init() {
  renderCoursesTable();
  updateStats();
  setupSearch();

  addModalInstance    = new bootstrap.Modal(document.getElementById('addCourseModal'));
  configModalInstance = new bootstrap.Modal(document.getElementById('configModal'));

  document.getElementById('confirmAddCourseBtn').addEventListener('click', addNewCourse);
  document.getElementById('saveConfigModalBtn').addEventListener('click', saveCurrentConfig);
}

init();
