const API_BASE = window.HOURSYNC_API || "https://backendhoursync-1.onrender.com/api";

/* =====================================================
   UTILITÁRIO CENTRAL DE REQUISIÇÃO
   Toda chamada ao backend passa por aqui.
   ===================================================== */
async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem("hoursync_token");

  const config = {
    headers: {
      "Content-Type": "application/json",
      ...(token && { "Authorization": `Bearer ${token}` }),
      ...options.headers
    },
    ...options
  };

  // Remove Content-Type se for FormData (upload de arquivo)
  if (options.body instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);

    // Token expirado — redireciona para login
    if (response.status === 401) {
      localStorage.removeItem("hoursync_token");
      localStorage.removeItem("hoursync_user");
      window.location.href = "/login/login.html";
      return;
    }

    // Sem conteúdo (ex: DELETE bem-sucedido)
    if (response.status === 204) return null;

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Erro ${response.status}`);
    }

    return data;

  } catch (err) {
    // Erro de rede (backend hibernando no Render — pode demorar ~50s)
    if (err.name === "TypeError") {
      throw new Error("Sem conexão com o servidor. Aguarde e tente novamente.");
    }
    throw err;
  }
}

/* =====================================================
   AUTH
   ===================================================== */
const Auth = {

  /**
   * Faz login e salva token + dados do usuário no localStorage.
   * Retorna o objeto do usuário com sua role (SUPER_ADMIN | COORDENADOR | ALUNO).
   */
  async login(email, senha) {
    const data = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, senha })
    });
    localStorage.setItem("hoursync_token", data.token);
    localStorage.setItem("hoursync_user", JSON.stringify(data.usuario));
    return data.usuario;
  },

  logout() {
    localStorage.removeItem("hoursync_token");
    localStorage.removeItem("hoursync_user");
    window.location.href = "/login/login.html";
  },

  /**
   * Retorna o usuário logado (do localStorage) ou null.
   */
  getUsuario() {
    const raw = localStorage.getItem("hoursync_user");
    return raw ? JSON.parse(raw) : null;
  },

  getToken() {
    return localStorage.getItem("hoursync_token");
  },

  isLogado() {
    return !!this.getToken();
  },

  getRole() {
    return this.getUsuario()?.role || null;
  },

  async resetSenha(email, novaSenha) {
    return apiFetch(`/auth/reset-senha?email=${encodeURIComponent(email)}&novaSenha=${encodeURIComponent(novaSenha)}`, {
      method: "PUT"
    });
  }
};

/* =====================================================
   USUÁRIOS
   ===================================================== */
const Usuarios = {
  listar:           ()     => apiFetch("/usuarios"),
  buscarPorId:      (id)   => apiFetch(`/usuarios/${id}`),
  listarCoordenadores: ()  => apiFetch("/usuarios/coordenadores"),
  listarAlunos:     ()     => apiFetch("/usuarios/alunos"),

  criar(dados) {
    // dados: { nome, email, senha, cpf, matricula, role, cursoId }
    return apiFetch("/usuarios", {
      method: "POST",
      body: JSON.stringify(dados)
    });
  },

  ativarInativar(id, ativo) {
    return apiFetch(`/usuarios/${id}/ativo?ativo=${ativo}`, {
      method: "PUT"
    });
  },

  remover(id) {
    return apiFetch(`/usuarios/${id}`, { method: "DELETE" });
  }
};

/* =====================================================
   CURSOS
   ===================================================== */
const Cursos = {
  listar:      ()   => apiFetch("/cursos"),
  buscarPorId: (id) => apiFetch(`/cursos/${id}`),

  criar(dados) {
    // dados: { nome, horasExigidas, horasPorSemestre }
    return apiFetch("/cursos", {
      method: "POST",
      body: JSON.stringify(dados)
    });
  },

  remover(id) {
    return apiFetch(`/cursos/${id}`, { method: "DELETE" });
  }
};

/* =====================================================
   CATEGORIAS
   ===================================================== */
const Categorias = {
  listar:         ()        => apiFetch("/categorias"),
  listarPorCurso: (cursoId) => apiFetch(`/categorias/curso/${cursoId}`),

  criar(dados) {
    return apiFetch("/categorias", {
      method: "POST",
      body: JSON.stringify(dados)
    });
  },

  remover(id) {
    return apiFetch(`/categorias/${id}`, { method: "DELETE" });
  }
};

/* =====================================================
   CERTIFICADOS
   ===================================================== */
const Certificados = {
  listar:         ()        => apiFetch("/certificados"),
  buscarPorId:    (id)      => apiFetch(`/certificados/${id}`),
  listarPorAluno: (alunoId) => apiFetch(`/certificados/aluno/${alunoId}`),
  listarPorCurso: (cursoId) => apiFetch(`/certificados/curso/${cursoId}`),

  // status: "PENDENTE" | "APROVADO" | "REJEITADO"
  listarPorStatus: (status) => apiFetch(`/certificados/status/${status}`),

  submeter(dados) {
    /*
      dados: {
        titulo, horas, grupo, codigoAtividade, descricaoAtividade,
        aluno: { id },
        categoria: { id },
        curso: { id },
        arquivoUrl  ← vem do endpoint de upload
      }
    */
    return apiFetch("/certificados", {
      method: "POST",
      body: JSON.stringify(dados)
    });
  },

  /**
   * Aprova ou rejeita um certificado.
   * status: "APROVADO" | "REJEITADO"
   * coordenadorId: ID do coordenador logado
   * motivo: (opcional) motivo da rejeição
   */
  validar(certId, status, coordenadorId, motivo = "") {
    let url = `/certificados/${certId}/validar?status=${status}&coordenadorId=${coordenadorId}`;
    if (motivo) url += `&motivo=${encodeURIComponent(motivo)}`;
    return apiFetch(url, { method: "PATCH" });
  }
};

/* =====================================================
   UPLOAD DE ARQUIVO
   ===================================================== */
const Upload = {
  /**
   * Envia um PDF ou imagem e retorna a URL do arquivo salvo.
   * @param {File} arquivo — objeto File do input[type=file]
   * @returns {Promise<string>} URL do arquivo no servidor
   */
  async enviar(arquivo) {
    const formData = new FormData();
    formData.append("file", arquivo);

    const data = await apiFetch("/upload", {
      method: "POST",
      body: formData
    });

    return data.url; // URL retornada pelo backend
  }
};

/* =====================================================
   DASHBOARD
   ===================================================== */
const Dashboard = {
  admin:         ()        => apiFetch("/dashboard/admin"),
  coordenador:   (cursoId) => apiFetch(`/dashboard/coordenador/${cursoId}`)
};

/* =====================================================
   PROGRESSO
   ===================================================== */
const Progresso = {
  porAluno:  (alunoId) => apiFetch(`/progresso/aluno/${alunoId}`),
  porCurso:  (cursoId) => apiFetch(`/progresso/curso/${cursoId}`),
  calculo:   (certId)  => apiFetch(`/progresso/calculo/${certId}`)
};

/* =====================================================
   HELPER — FEEDBACK VISUAL
   Substitui os alert() nativos por toasts Bootstrap
   ===================================================== */
function showToast(mensagem, tipo = "success") {
  // tipo: "success" | "danger" | "warning" | "info"
  const toastId = "hoursync-toast-" + Date.now();
  const icons = {
    success: "bi-check-circle-fill",
    danger:  "bi-x-circle-fill",
    warning: "bi-exclamation-triangle-fill",
    info:    "bi-info-circle-fill"
  };

  const html = `
    <div id="${toastId}" class="toast align-items-center text-bg-${tipo} border-0 mb-2"
         role="alert" aria-live="assertive" style="min-width:300px;">
      <div class="d-flex">
        <div class="toast-body">
          <i class="bi ${icons[tipo]} me-2"></i>${mensagem}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto"
                data-bs-dismiss="toast"></button>
      </div>
    </div>`;

  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.style.cssText = "position:fixed;top:20px;right:20px;z-index:9999;";
    document.body.appendChild(container);
  }

  container.insertAdjacentHTML("beforeend", html);
  const toastEl = document.getElementById(toastId);
  const toast = new bootstrap.Toast(toastEl, { delay: 4000 });
  toast.show();
  toastEl.addEventListener("hidden.bs.toast", () => toastEl.remove());
}

/* =====================================================
   HELPER — LOADING
   Mostra/oculta spinner em botões durante chamadas async
   ===================================================== */
function setLoading(btnEl, loading) {
  if (loading) {
    btnEl.dataset.textoOriginal = btnEl.innerHTML;
    btnEl.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Aguarde...`;
    btnEl.disabled = true;
  } else {
    btnEl.innerHTML = btnEl.dataset.textoOriginal || btnEl.innerHTML;
    btnEl.disabled = false;
  }
}
