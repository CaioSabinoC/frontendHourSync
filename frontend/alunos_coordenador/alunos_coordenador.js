/* =====================================================
   HourSync — alunos_admin.js  (multi-curso)
   ===================================================== */

let alunosData = [
  {
    id: 1, nome: "João Silva", nomeCompleto: "João Silva da Cunha",
    matricula: "20240001", email: "joao.silva@faculdade.edu.br", senha: "******",
    cursos: [
      { curso: "Análise e Desenvolvimento de Sistemas", horasCumpridas: 40, horasNecessarias: 100, status: "Em Andamento", certificadosAceitos: [{ nome: "Palestra - Inovação em ADS", horas: 20 }, { nome: "Evento - Semana da Tecnologia", horas: 10 }, { nome: "Curso - Desenvolvimento Web", horas: 10 }] },
      { curso: "Design Gráfico", horasCumpridas: 30, horasNecessarias: 100, status: "Em Andamento", certificadosAceitos: [{ nome: "Workshop - Design Thinking", horas: 20 }, { nome: "Curso - Figma Avançado", horas: 10 }] }
    ]
  },
  {
    id: 2, nome: "Ana Maria", nomeCompleto: "Ana Maria Souza",
    matricula: "20240002", email: "ana.souza@faculdade.edu.br", senha: "******",
    cursos: [
      { curso: "Gastronomia", horasCumpridas: 10, horasNecessarias: 200, status: "Em Andamento", certificadosAceitos: [{ nome: "Palestra - Gestão Gastronômica", horas: 6 }, { nome: "Curso - Segurança Alimentar", horas: 4 }] }
    ]
  },
  {
    id: 3, nome: "Julia Barboza", nomeCompleto: "Julia Barboza Lima",
    matricula: "20240003", email: "julia.lima@faculdade.edu.br", senha: "******",
    cursos: [
      { curso: "Design Gráfico", horasCumpridas: 20, horasNecessarias: 100, status: "Em Andamento", certificadosAceitos: [{ nome: "Evento - Feira de Profissões", horas: 12 }, { nome: "Workshop - Design Thinking", horas: 8 }] }
    ]
  },
  {
    id: 4, nome: "Marcos Vinicius", nomeCompleto: "Marcos Vinicius Rocha",
    matricula: "20240004", email: "marcos.rocha@faculdade.edu.br", senha: "******",
    cursos: [
      { curso: "Engenharia Civil", horasCumpridas: 120, horasNecessarias: 120, status: "Concluído", certificadosAceitos: [{ nome: "Curso - Inglês Avançado", horas: 60 }, { nome: "Palestra - Empreendedorismo", horas: 20 }, { nome: "Estágio Voluntário", horas: 40 }] }
    ]
  },
  {
    id: 5, nome: "Camila Fernandes", nomeCompleto: "Camila Fernandes Alves",
    matricula: "20240005", email: "camila.alves@faculdade.edu.br", senha: "******",
    cursos: [
      { curso: "Administração", horasCumpridas: 85, horasNecessarias: 150, status: "Em Andamento", certificadosAceitos: [{ nome: "Curso - Sustentabilidade", horas: 30 }, { nome: "Evento - Hackathon", horas: 25 }, { nome: "Palestra - Liderança", horas: 30 }] },
      { curso: "Pedagogia", horasCumpridas: 60, horasNecessarias: 120, status: "Em Andamento", certificadosAceitos: [{ nome: "Palestra - Educação Inclusiva", horas: 30 }, { nome: "Curso - Metodologias Ativas", horas: 30 }] }
    ]
  },
  {
    id: 6, nome: "Rafael Menezes", nomeCompleto: "Rafael Menezes Neto",
    matricula: "20240006", email: "rafael.neto@faculdade.edu.br", senha: "******",
    cursos: [
      { curso: "Enfermagem", horasCumpridas: 150, horasNecessarias: 150, status: "Concluído", certificadosAceitos: [{ nome: "Curso - Gestão de Projetos", horas: 80 }, { nome: "Evento - Simpósio de TI", horas: 40 }, { nome: "Palestra - Inovação", horas: 30 }] }
    ]
  }
];

const cursosDisponiveis = [
  "Análise e Desenvolvimento de Sistemas",
  "Administração",
  "Engenharia Civil",
  "Enfermagem",
  "Pedagogia",
  "Gastronomia",
  "Design Gráfico"
];

let nextId = 7;
let currentSearchTerm = "";
let cursosAdicionais = [];

function getStatusGeral(aluno) {
  if (aluno.cursos.every(c => c.status === "Concluído")) return "Concluído";
  return "Em Andamento";
}

function getTotalHoras(aluno) {
  return {
    cumpridas: aluno.cursos.reduce((s, c) => s + c.horasCumpridas, 0),
    necessarias: aluno.cursos.reduce((s, c) => s + c.horasNecessarias, 0)
  };
}

function updateStats() {
  const total = alunosData.length;
  const emAndamento = alunosData.filter(a => getStatusGeral(a) === "Em Andamento").length;
  const concluido = alunosData.filter(a => getStatusGeral(a) === "Concluído").length;
  const mediaHoras = total
    ? Math.round(alunosData.reduce((acc, a) => acc + getTotalHoras(a).cumpridas, 0) / total)
    : 0;

  document.getElementById("totalAlunosCount").innerText = total;
  document.getElementById("emAndamentoCount").innerText = emAndamento;
  document.getElementById("concluidoCount").innerText = concluido;
  document.querySelector(".stat-card.border-info-custom .stat-number").innerHTML =
    mediaHoras + '<span class="stat-unit">h</span>';
}

function renderTabelaAlunos() {
  const term = currentSearchTerm.toLowerCase().trim();
  const filtered = term
    ? alunosData.filter(a =>
        a.nome.toLowerCase().includes(term) ||
        a.nomeCompleto.toLowerCase().includes(term) ||
        a.matricula.includes(term) ||
        a.cursos.some(c => c.curso.toLowerCase().includes(term)))
    : [...alunosData];

  const tbody = document.getElementById("alunosTableBody");
  tbody.innerHTML = "";

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">Nenhum aluno encontrado</td></tr>`;
    document.getElementById("exibindoCount").innerText = 0;
    return;
  }

  filtered.forEach(aluno => {
    const { cumpridas, necessarias } = getTotalHoras(aluno);
    const pct = Math.min((cumpridas / necessarias) * 100, 100);
    const status = getStatusGeral(aluno);
    const sClass = status === "Concluído" ? "badge-concluido" : "badge-andamento";

    const cursosHTML = aluno.cursos.map(c =>
      `<span class="badge-curso-mini">${c.curso}</span>`
    ).join("<br>");

    const row = document.createElement("tr");
    row.innerHTML = `
      <td><strong style="color:#6c83e6;">${aluno.nome}</strong><br><small style="color:#6c757d;">${aluno.matricula}</small></td>
      <td style="color:#2c3e66;font-weight:500;">${cursosHTML}</td>
      <td style="color:#2c3e66;">${cumpridas}h/${necessarias}h</td>
      <td>
        <div class="progress-wrapper">
          <div class="progress"><div class="progress-bar-custom" style="width:${pct}%;"></div></div>
          <span class="progress-text">${Math.round(pct)}%</span>
        </div>
      </td>
      <td><span class="badge-status ${sClass}">${status}</span></td>
      <td><button class="btn-ver" data-id="${aluno.id}">Ver</button></td>
    `;
    tbody.appendChild(row);
  });

  document.getElementById("exibindoCount").innerText = filtered.length;

  document.querySelectorAll(".btn-ver").forEach(btn => {
    btn.addEventListener("click", () => {
      const aluno = alunosData.find(a => a.id === parseInt(btn.dataset.id));
      if (aluno) abrirModalAluno(aluno);
    });
  });
}

function renderCursoCard(c, solo) {
  const pct = Math.min((c.horasCumpridas / c.horasNecessarias) * 100, 100);
  const restantes = Math.max(0, c.horasNecessarias - c.horasCumpridas);
  const sClass = c.status === "Concluído" ? "badge-concluido" : "badge-andamento";
  const certs = c.certificadosAceitos && c.certificadosAceitos.length
    ? c.certificadosAceitos.map(cert => `
        <div class="cert-item">
          <span><i class="bi bi-file-text-fill" style="color:#6c83e6;"></i> <strong>${cert.nome}</strong></span>
          <span class="badge bg-light text-dark">${cert.horas}h</span>
        </div>`).join("")
    : '<p class="text-muted small">Nenhum certificado aceito.</p>';

  return `
    ${solo ? `<div class="mb-2"><strong>Curso:</strong> <span style="color:#6c83e6;">${c.curso}</span></div>` : ''}
    <div class="d-flex align-items-center justify-content-between mb-2">
      <span class="badge-status ${sClass}">${c.status}</span>
      <span class="text-muted small">${c.horasCumpridas}h / ${c.horasNecessarias}h</span>
    </div>
    <div class="progress progress-md mb-1">
      <div class="progress-bar-custom" style="width:${pct}%;"></div>
    </div>
    <div class="d-flex justify-content-between mb-3">
      <small class="text-muted">${Math.round(pct)}% concluído</small>
      <small class="text-muted">${restantes}h restantes</small>
    </div>
    <h6 class="fw-bold"><i class="bi bi-patch-check"></i> Certificados Aceitos:</h6>
    <div class="modal-cert-list">${certs}</div>
  `;
}

function abrirModalAluno(aluno) {
  document.getElementById("modalAlunoNome").innerText = aluno.nomeCompleto;
  document.getElementById("modalAlunoEmail").innerText = aluno.email;
  document.getElementById("modalAlunoMatricula").innerText = aluno.matricula;

  const cursosContainer = document.getElementById("modalCursosContainer");
  cursosContainer.innerHTML = "";

  if (aluno.cursos.length === 1) {
    cursosContainer.innerHTML = renderCursoCard(aluno.cursos[0], true);
  } else {
    const tabsNav = document.createElement("ul");
    tabsNav.className = "nav nav-tabs modal-tabs mb-3";

    const tabsContent = document.createElement("div");
    tabsContent.className = "tab-content";

    aluno.cursos.forEach((c, i) => {
      const tabId = `curso-tab-${i}`;
      const cursoAbrev = c.curso.length > 22 ? c.curso.substring(0, 20) + "…" : c.curso;
      const li = document.createElement("li");
      li.className = "nav-item";
      li.innerHTML = `<button class="nav-link ${i === 0 ? 'active' : ''}" data-bs-toggle="tab" data-bs-target="#${tabId}" title="${c.curso}">${cursoAbrev}</button>`;
      tabsNav.appendChild(li);

      const pane = document.createElement("div");
      pane.className = `tab-pane fade ${i === 0 ? 'show active' : ''}`;
      pane.id = tabId;
      pane.innerHTML = renderCursoCard(c, false);
      tabsContent.appendChild(pane);
    });

    cursosContainer.appendChild(tabsNav);
    cursosContainer.appendChild(tabsContent);
  }

  new bootstrap.Modal(document.getElementById("modalAluno")).show();
}

function renderCursosAdicionais() {
  const container = document.getElementById("cursosAdicionaisContainer");
  container.innerHTML = "";
  cursosAdicionais.forEach((item, i) => {
    const div = document.createElement("div");
    div.className = "row g-2 mb-2 align-items-end";
    div.innerHTML = `
      <div class="col-md-7">
        <label class="form-label-custom small">Curso ${i + 2} <span class="text-danger">*</span></label>
        <select class="form-select form-select-custom" data-idx="${i}">
          <option value="">Selecione o curso</option>
          ${cursosDisponiveis.map(c => `<option ${item.curso === c ? 'selected' : ''}>${c}</option>`).join("")}
        </select>
      </div>
      <div class="col-md-3">
        <label class="form-label-custom small">Horas</label>
        <input type="number" class="form-control form-control-custom" value="${item.horasNecessarias}" min="20" max="400" step="10" data-idx="${i}" data-field="horas">
      </div>
      <div class="col-md-2 d-flex align-items-end">
        <button type="button" class="btn btn-sm btn-outline-danger w-100" data-remove="${i}"><i class="bi bi-trash"></i></button>
      </div>`;

    div.querySelector("select").addEventListener("change", function() {
      cursosAdicionais[this.dataset.idx].curso = this.value;
    });
    div.querySelector("input").addEventListener("change", function() {
      cursosAdicionais[this.dataset.idx].horasNecessarias = parseInt(this.value) || 100;
    });
    div.querySelector("[data-remove]").addEventListener("click", function() {
      removerCurso(parseInt(this.dataset.remove));
    });

    container.appendChild(div);
  });
}

function adicionarCurso() {
  cursosAdicionais.push({ curso: "", horasNecessarias: 100 });
  renderCursosAdicionais();
}

function removerCurso(idx) {
  cursosAdicionais.splice(idx, 1);
  renderCursosAdicionais();
}

function cadastrarAluno() {
  const nomeCompleto = document.getElementById("cadastroNome").value.trim();
  const matricula = document.getElementById("cadastroMatricula").value.trim();
  const cursoPrincipal = document.getElementById("cadastroCurso").value;
  const email = document.getElementById("cadastroEmail").value.trim();
  const senha = document.getElementById("cadastroSenha").value;
  const horasNecessarias = parseInt(document.getElementById("cadastroHorasNecessarias").value);

  if (!nomeCompleto || !matricula || !cursoPrincipal || !email || !senha) {
    alert("Preencha todos os campos obrigatórios!"); return;
  }
  if (senha.length < 6) { alert("A senha deve ter no mínimo 6 caracteres."); return; }
  if (alunosData.some(a => a.matricula === matricula)) { alert("Matrícula já cadastrada!"); return; }
  if (alunosData.some(a => a.email === email)) { alert("E-mail já cadastrado!"); return; }

  for (const ca of cursosAdicionais) {
    if (!ca.curso) { alert("Selecione o curso para todos os cursos adicionados."); return; }
    if (ca.curso === cursoPrincipal) { alert("O aluno já está matriculado em " + cursoPrincipal + ". Selecione cursos diferentes."); return; }
  }
  const todosCursos = [cursoPrincipal, ...cursosAdicionais.map(c => c.curso)];
  if (new Set(todosCursos).size !== todosCursos.length) {
    alert("O aluno não pode estar matriculado no mesmo curso mais de uma vez."); return;
  }

  const cursos = [
    { curso: cursoPrincipal, horasCumpridas: 0, horasNecessarias, status: "Em Andamento", certificadosAceitos: [] },
    ...cursosAdicionais.map(ca => ({
      curso: ca.curso, horasCumpridas: 0, horasNecessarias: ca.horasNecessarias, status: "Em Andamento", certificadosAceitos: []
    }))
  ];

  alunosData.push({ id: nextId++, nome: nomeCompleto.split(" ")[0], nomeCompleto, matricula, email, senha, cursos });

  cursosAdicionais = [];
  document.getElementById("formCadastroAluno").reset();
  document.getElementById("cadastroHorasNecessarias").value = "100";
  document.getElementById("cursosAdicionaisContainer").innerHTML = "";
  bootstrap.Modal.getInstance(document.getElementById("modalCadastroAluno")).hide();

  updateStats();
  renderTabelaAlunos();
  alert(`Aluno ${nomeCompleto} cadastrado com sucesso!\n\nE-mail: ${email}\nSenha: ${senha}`);
}

function init() {
  updateStats();
  renderTabelaAlunos();

  document.getElementById("btnConfirmarCadastro").addEventListener("click", cadastrarAluno);
  document.getElementById("btnAdicionarCurso").addEventListener("click", adicionarCurso);

  document.getElementById("toggleSenhaCadastro").addEventListener("click", function () {
    const input = document.getElementById("cadastroSenha");
    const ativo = input.type === "password";
    input.type = ativo ? "text" : "password";
    this.classList.toggle("bi-eye-slash", !ativo);
    this.classList.toggle("bi-eye", ativo);
  });

  document.getElementById("searchInput").addEventListener("input", e => {
    currentSearchTerm = e.target.value;
    renderTabelaAlunos();
  });
}

init();
