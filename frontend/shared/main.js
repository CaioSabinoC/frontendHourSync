/* =====================================================
   HourSync — JS Compartilhado (main.js)
   Funções usadas em todas as telas
   ===================================================== */

function toggleSidebar() {
  if (window.innerWidth <= 767) {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.contains('mobile-open') ? closeMobileSidebar() : openMobileSidebar();
    return;
  }
  document.getElementById("sidebar").classList.toggle("collapsed");
}

window.toggleSidebar = toggleSidebar;

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, function(m) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
  });
}

/**
 * Tabela de limites por subcategoria conforme o Manual de
 * Atividades Complementares 2022 (Faculdade Senac PE).
 */
const LIMITES_MANUAL = {
  "1.1": 20, "1.2": 2,  "1.3": 20, "1.4": 20, "1.5": 10,
  "1.6": 10, "1.7": 5,  "1.8": 10, "1.9": 4,
  "2.1": 10, "2.2": 20, "2.3": 10, "2.4": 40, "2.5": 10,
  "3.1": 10, "3.2": 10, "3.3": 10, "3.4": 20, "3.5": 5,
  "3.6": 10, "3.7": 10
};

/**
 * Retorna o limite máximo de horas para a subcategoria do certificado.
 * Usa o limite configurado no curso se disponível, senão o padrão do manual.
 */
function getLimiteSubcategoria(certificado) {
  if (typeof courses !== "undefined") {
    const curso = courses.find(c => c.name === certificado.curso);
    if (curso && curso.config && curso.config.limits) {
      const key = certificado.grupo + "||" + certificado.codigoAtividade;
      const val = curso.config.limits[key];
      if (val !== undefined && val !== null) return val;
    }
  }
  const limite = LIMITES_MANUAL[certificado.codigoAtividade];
  return limite !== undefined ? limite : null;
}

/**
 * Calcula quantas horas podem ser aprovadas aplicando apenas o limite da subcategoria.
 * Não há mais limite semestral — só o limite da atividade conforme o Manual,
 * e o total do curso (horas já utilizadas vs. totalRequired).
 *
 * @param {number} horasSolicitadas   - horas pedidas pelo aluno
 * @param {number} horasUtilizadasCurso - horas já aprovadas no curso total
 * @param {number} totalRequired       - carga total exigida no curso
 * @param {number} limiteSubcategoria  - limite da subcategoria do manual
 */
/**
 * As horas aprovadas = limite da subcategoria (o aluno nunca pede mais do que isso).
 * Retorna o objeto de cálculo com as horas que serão aprovadas.
 */
function calcularHorasAprovadas(limiteSubcategoria) {
  const aprovadas = limiteSubcategoria !== null && limiteSubcategoria !== undefined
    ? limiteSubcategoria
    : 0;
  return { aprovadas };
}

/**
 * Renderiza o cálculo de horas no modal de confirmação.
 * Exibe: limite da atividade, horas usadas no curso (ex: 45 de 100), horas aprovadas.
 * Sem "horas solicitadas" e sem alertas de aprovação parcial.
 */
function renderizarCalculoConfirmacao(certificado, alunosInfo) {
  const alunoInfo = alunosInfo[certificado.alunoId];
  if (!alunoInfo) return;

  const horasUtilizadas    = alunoInfo.horasUtilizadasCurso || 0;
  const totalRequired      = alunoInfo.totalRequired || 100;
  const limiteSubcategoria = getLimiteSubcategoria(certificado);
  const calculo            = calcularHorasAprovadas(limiteSubcategoria);

  const container = document.getElementById("calculoContentConfirmacao");

  const linhaLimiteSub = limiteSubcategoria !== null ? `
    <div class="calculo-item">
      <span class="calculo-label">Limite desta atividade:</span>
      <span class="calculo-value" style="color:#e07b00;">${limiteSubcategoria}h</span>
    </div>
  ` : '';

  container.innerHTML = `
    ${linhaLimiteSub}
    <div class="calculo-item">
      <span class="calculo-label">Horas já utilizadas no curso:</span>
      <span class="calculo-value">${horasUtilizadas}h de ${totalRequired}h</span>
    </div>
    <div class="calculo-item">
      <span class="calculo-label">Horas que serão aprovadas:</span>
      <span class="calculo-value" style="color:#2a9d8f;font-size:18px;">${calculo.aprovadas}h</span>
    </div>
  `;

  return calculo;
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
}

/* =====================================================
   RESPONSIVIDADE — Hambúrguer Mobile
   ===================================================== */
function initMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  const btn = document.createElement('button');
  btn.className = 'hamburger-btn';
  btn.id = 'hamburgerBtn';
  btn.innerHTML = '<i class="bi bi-list"></i>';
  btn.setAttribute('aria-label', 'Abrir menu');
  document.body.appendChild(btn);

  const overlay = document.createElement('div');
  overlay.className = 'sidebar-overlay';
  overlay.id = 'sidebarOverlay';
  document.body.appendChild(overlay);

  btn.addEventListener('click', function () {
    sidebar.classList.contains('mobile-open') ? closeMobileSidebar() : openMobileSidebar();
  });
  overlay.addEventListener('click', closeMobileSidebar);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMobileSidebar();
  });
}

function openMobileSidebar() {
  document.getElementById('sidebar')?.classList.add('mobile-open');
  document.getElementById('sidebarOverlay')?.classList.add('active');
  const btn = document.getElementById('hamburgerBtn');
  if (btn) btn.style.display = 'none';
}

function closeMobileSidebar() {
  document.getElementById('sidebar')?.classList.remove('mobile-open');
  document.getElementById('sidebarOverlay')?.classList.remove('active');
  const btn = document.getElementById('hamburgerBtn');
  if (btn) btn.style.display = 'flex';
}

document.addEventListener('DOMContentLoaded', initMobileSidebar);

/* =====================================================
   MODO ESCURO
   ===================================================== */
(function() {
  if (localStorage.getItem('hoursync_darkmode') === 'true') {
    document.documentElement.classList.add('dark-mode');
    document.body.classList.add('dark-mode');
  }
})();

/* =====================================================
   MODAL DE RESULTADO (substitui alert)
   ===================================================== */
function showNotification(msg, type = 'info') {
  showResultModal(type, 'Atenção', msg);
}

function showResultModal(type, title, body) {
  const old = document.getElementById('resultModal');
  if (old) old.remove();

  const icons  = { success: 'bi-check-circle-fill', danger: 'bi-x-circle-fill', warning: 'bi-exclamation-triangle-fill', info: 'bi-info-circle-fill' };
  const colors = { success: '#2a9d8f', danger: '#e76f51', warning: '#f4a261', info: '#6c83e6' };
  const icon  = icons[type]  || icons.info;
  const color = colors[type] || colors.info;

  const isDark = document.documentElement.classList.contains('dark-mode') || document.body.classList.contains('dark-mode');
  const bgModal   = isDark ? '#1a2235' : '#ffffff';
  const textColor = isDark ? '#e2e8f0' : '#444444';
  const shadow    = isDark ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 32px rgba(0,0,0,0.15)';
  const closeBtnFilter = isDark ? 'filter:invert(1)' : '';

  // Se body for vazio, só mostra título (modal de sucesso limpo)
  const bodyHtml = body ? String(body).replace(/\n/g, '<br>') : '';

  const modalHtml = `
  <div class="modal fade" id="resultModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content" style="border-radius:20px;border:none;box-shadow:${shadow};background:${bgModal};">
        <div class="modal-header border-0 pb-0 pt-4 px-4" style="background:${bgModal};">
          <div class="d-flex align-items-center gap-3">
            <div style="width:44px;height:44px;border-radius:50%;background:${color}30;display:flex;align-items:center;justify-content:center;">
              <i class="bi ${icon}" style="font-size:1.4rem;color:${color};"></i>
            </div>
            <h5 class="modal-title fw-bold mb-0" style="color:${color};">${title}</h5>
          </div>
          <button type="button" class="btn-close" data-bs-dismiss="modal" style="${closeBtnFilter}"></button>
        </div>
        ${bodyHtml ? `<div class="modal-body px-4 py-3" style="background:${bgModal};color:${textColor};font-size:0.92rem;line-height:1.7;">${bodyHtml}</div>` : ''}
        <div class="modal-footer border-0 pt-0 pb-4 px-4" style="background:${bgModal};">
          <button type="button" class="btn text-white fw-semibold px-4" style="background:${color};border:none;border-radius:30px;" data-bs-dismiss="modal">OK</button>
        </div>
      </div>
    </div>
  </div>`;

  document.body.insertAdjacentHTML('beforeend', modalHtml);
  const m = new bootstrap.Modal(document.getElementById('resultModal'));
  m.show();
  document.getElementById('resultModal').addEventListener('hidden.bs.modal', () => {
    document.getElementById('resultModal')?.remove();
  });
}
