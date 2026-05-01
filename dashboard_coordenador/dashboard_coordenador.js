/* =====================================================
   HourSync — dashboard_coordenador.js
   ===================================================== */

const alunosInfo = {
  1: { nome: "João Silva",      curso: "ADS",          horasUtilizadasSemestre: 15, limiteSemestral: LIMITE_SEMESTRAL },
  2: { nome: "Ana Maria",       curso: "Gastronomia",  horasUtilizadasSemestre: 20, limiteSemestral: LIMITE_SEMESTRAL },
  3: { nome: "Julia Barboza",   curso: "Design",       horasUtilizadasSemestre: 8,  limiteSemestral: LIMITE_SEMESTRAL },
  4: { nome: "Maria Gabriela",  curso: "ADS",          horasUtilizadasSemestre: 22, limiteSemestral: LIMITE_SEMESTRAL },
  5: { nome: "Arthur Melo",     curso: "Engenharia",   horasUtilizadasSemestre: 5,  limiteSemestral: LIMITE_SEMESTRAL },
  6: { nome: "Camila Fernandes",curso: "Administração",horasUtilizadasSemestre: 3,  limiteSemestral: LIMITE_SEMESTRAL }
};

let certificadosData = [
  { id: 1, alunoId: 1, aluno: "João Silva",      curso: "ADS",          turma: "TADS047", categoria: "Curso",    horasSolicitadas: 40, data: "12/05/2024", status: "Pendente", imgUrl: "img/certificado.png", horasAprovadas: null },
  { id: 2, alunoId: 2, aluno: "Ana Maria",       curso: "Gastronomia",  turma: "GAS022",  categoria: "Palestra", horasSolicitadas: 10, data: "11/05/2024", status: "Pendente", imgUrl: "img/certificado.png", horasAprovadas: null },
  { id: 3, alunoId: 3, aluno: "Julia Barboza",   curso: "Design",       turma: "DSG011",  categoria: "Workshop", horasSolicitadas: 20, data: "10/05/2024", status: "Pendente", imgUrl: "img/certificado.png", horasAprovadas: null },
  { id: 4, alunoId: 4, aluno: "Maria Gabriela",  curso: "ADS",          turma: "TADS048", categoria: "Curso",    horasSolicitadas: 15, data: "09/05/2024", status: "Pendente", imgUrl: "img/certificado.png", horasAprovadas: null },
  { id: 5, alunoId: 5, aluno: "Arthur Melo",     curso: "Engenharia",   turma: "ENG033",  categoria: "Palestra", horasSolicitadas: 25, data: "08/05/2024", status: "Pendente", imgUrl: "img/certificado.png", horasAprovadas: null },
  { id: 6, alunoId: 6, aluno: "Camila Fernandes",curso: "Administração",turma: "ADM033",  categoria: "Evento",   horasSolicitadas: 30, data: "07/05/2024", status: "Pendente", imgUrl: "img/certificado.png", horasAprovadas: null }
];

let atividadesData = [
  { aluno: "João Silva",      acao: " Enviou certificado (40h)",     tempo: "Há 2 horas" },
  { aluno: "Maria Gabriela",  acao: " Certificado reprovado (15h)",  tempo: "Há 4 horas" },
  { aluno: "Arthur Melo",     acao: " Enviou certificado (25h)",     tempo: "Há 5 horas" },
  { aluno: "Camila Fernandes",acao: " Certificado aprovado (30h)",   tempo: "Há 6 horas" },
  { aluno: "Ana Maria",       acao: " Enviou certificado (10h)",     tempo: "Há 1 dia" }
];

let certificadosAprovados = [];
let certificadosRejeitados = [];
let currentSearchTerm = "";
let currentCertificadoSelecionado = null;
let modalCert, modalConfirm, modalRej;

function updateStats() {
  const totalHoras = certificadosAprovados.reduce((acc, c) => acc + (c.horasAprovadas || 0), 0);
  document.getElementById("pendentesCount").innerText  = certificadosData.filter(c => c.status === "Pendente").length;
  document.getElementById("aprovadosCount").innerText  = certificadosAprovados.length;
  document.getElementById("rejeitadosCount").innerText = certificadosRejeitados.length;
  document.getElementById("horasValidadasCount").innerHTML = totalHoras + '<span class="stat-unit">h</span>';
}

function updateAtividades() {
  const container = document.getElementById("activityList");
  container.innerHTML = '<h6><strong><i class="bi bi-clock-history"></i> Atividades Recentes</strong></h6>';
  atividadesData.slice(0, 10).forEach(a => {
    const div = document.createElement("div");
    div.className = "activity-item";
    div.innerHTML = `<div class="aluno-nome">${a.aluno}</div><div class="aluno-acao">${a.acao}</div><div class="aluno-tempo">${a.tempo}</div>`;
    container.appendChild(div);
  });
}

function adicionarAtividade(aluno, acao) {
  atividadesData.unshift({ aluno, acao, tempo: "Agora mesmo" });
  if (atividadesData.length > 20) atividadesData.pop();
  updateAtividades();
}

function renderTabelaCertificados() {
  const term     = currentSearchTerm.toLowerCase().trim();
  const filtered = term ? certificadosData.filter(c => c.aluno.toLowerCase().includes(term)) : [...certificadosData];
  const tbody    = document.getElementById("certificadosTableBody");
  tbody.innerHTML = "";

  filtered.forEach(cert => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><strong>${cert.aluno}</strong></td>
      <td>${cert.curso}</td><td>${cert.turma}</td><td>${cert.categoria}</td>
      <td>${cert.horasSolicitadas}h</td><td>${cert.data}</td>
      <td><span class="status-pendente">Pendente</span></td>
      <td><button class="btn-analisar" data-id="${cert.id}">Analisar</button></td>
    `;
    tbody.appendChild(row);
  });

  if (filtered.length === 0) tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">Nenhum certificado pendente</td></tr>`;

  document.querySelectorAll(".btn-analisar[data-id]").forEach(btn => {
    btn.addEventListener("click", () => {
      const cert = certificadosData.find(c => c.id === parseInt(btn.dataset.id));
      if (cert && cert.status === "Pendente") abrirModalVisualizar(cert);
    });
  });
}

function abrirModalVisualizar(cert) {
  currentCertificadoSelecionado = cert;
  document.getElementById("modalAlunoNome").innerText      = cert.aluno;
  document.getElementById("modalCurso").innerText          = cert.curso;
  document.getElementById("modalCategoria").innerText      = cert.categoria;
  document.getElementById("modalHorasSolicitadas").innerText = cert.horasSolicitadas;
  const img = document.getElementById("modalCertificadoImg");
  if (img) img.src = cert.imgUrl || "img/certificado.png";
  modalCert.show();
}

function abrirModalConfirmacao() {
  if (!currentCertificadoSelecionado) return;
  modalCert.hide();
  renderizarCalculoConfirmacao(currentCertificadoSelecionado, alunosInfo);
  modalConfirm.show();
}

function confirmarAprovacao() {
  if (!currentCertificadoSelecionado) return;
  const info    = alunosInfo[currentCertificadoSelecionado.alunoId];
  const calculo = calcularHorasAprovadas(currentCertificadoSelecionado.horasSolicitadas, info.horasUtilizadasSemestre);

  certificadosData.splice(certificadosData.findIndex(c => c.id === currentCertificadoSelecionado.id), 1);
  certificadosAprovados.push({ ...currentCertificadoSelecionado, status: "Aprovado", horasAprovadas: calculo.aprovadas });
  info.horasUtilizadasSemestre += calculo.aprovadas;

  const acao = calculo.aprovacaoParcial
    ? ` Aprovado PARCIALMENTE (${calculo.aprovadas}h de ${currentCertificadoSelecionado.horasSolicitadas}h)`
    : ` Aprovado (${calculo.aprovadas}h)`;
  adicionarAtividade(currentCertificadoSelecionado.aluno, acao);

  updateStats();
  renderTabelaCertificados();
  modalConfirm.hide();
  alert(` Certificado ${calculo.aprovacaoParcial ? 'aprovado PARCIALMENTE' : 'aprovado'}!\n\nAluno: ${currentCertificadoSelecionado.aluno}\nAprovado: ${calculo.aprovadas}h`);
  currentCertificadoSelecionado = null;
}

function cancelarConfirmacao() { modalConfirm.hide(); currentCertificadoSelecionado = null; }

function abrirModalRejeicao() {
  modalCert.hide();
  document.getElementById("motivoRejeicao").value = "";
  modalRej.show();
}

function confirmarRejeicao() {
  const motivo = document.getElementById("motivoRejeicao").value.trim();
  if (!motivo) { alert("Digite um motivo."); return; }
  certificadosData.splice(certificadosData.findIndex(c => c.id === currentCertificadoSelecionado.id), 1);
  certificadosRejeitados.push({ ...currentCertificadoSelecionado, status: "Rejeitado", motivo });
  adicionarAtividade(currentCertificadoSelecionado.aluno, ` Rejeitado (${currentCertificadoSelecionado.horasSolicitadas}h)`);
  updateStats();
  renderTabelaCertificados();
  modalRej.hide();
  alert(` Rejeitado.\nMotivo: ${motivo}`);
  currentCertificadoSelecionado = null;
}

function initGraficoCertificados() {
  const ctx = document.getElementById('certChart');
  if (!ctx) return;
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
      datasets: [
        {
          label: 'Aprovados',
          data: [4, 6, 8, 5, 10, 7, 9, 6, 8, 11, 7, 9],
          backgroundColor: 'rgba(42, 157, 143, 0.85)',
          borderRadius: 6
        },
        {
          label: 'Rejeitados',
          data: [1, 2, 1, 3, 2, 1, 2, 1, 3, 2, 1, 2],
          backgroundColor: 'rgba(231, 111, 81, 0.85)',
          borderRadius: 6
        },
        {
          label: 'Pendentes',
          data: [2, 1, 3, 2, 1, 4, 1, 3, 2, 1, 3, 2],
          backgroundColor: 'rgba(180, 180, 255, 0.85)',
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: 'white',
            boxWidth: 14,
            padding: 10,
            font: { size: 12 }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: 'rgba(255,255,255,0.8)', font: { size: 11 } }
        },
        y: {
          beginAtZero: true,
          ticks: { stepSize: 2, color: 'rgba(255,255,255,0.8)', font: { size: 11 } },
          grid: { color: 'rgba(255,255,255,0.1)' }
        }
      },
      layout: { padding: { top: 4, bottom: 4 } }
    }
  });
}

function init() {
  updateStats();
  updateAtividades();
  renderTabelaCertificados();
  initGraficoCertificados();

  modalCert    = new bootstrap.Modal(document.getElementById("modalCertificado"));
  modalConfirm = new bootstrap.Modal(document.getElementById("modalConfirmacaoAprovacao"));
  modalRej     = new bootstrap.Modal(document.getElementById("modalRejeicao"));

  document.getElementById("btnAprovarModal")?.addEventListener("click", abrirModalConfirmacao);
  document.getElementById("btnRejeitarModal")?.addEventListener("click", abrirModalRejeicao);
  document.getElementById("btnConfirmarAprovacao")?.addEventListener("click", confirmarAprovacao);
  document.getElementById("btnCancelarConfirmacao")?.addEventListener("click", cancelarConfirmacao);
  document.getElementById("confirmarRejeicaoBtn")?.addEventListener("click", confirmarRejeicao);
  document.getElementById("searchInput")?.addEventListener("input", e => { currentSearchTerm = e.target.value; renderTabelaCertificados(); });
}

init();
