/* =====================================================
   HourSync — configuracoes.js
   Usado por: configuracoes_admin.html, configuracoes_coordenador.html
   ===================================================== */

// Dados do perfil — cada página define userProfile antes de incluir este script
// via um bloco <script> inline antes da tag <script src="js/configuracoes.js">

function updateProfileUI() {
  document.getElementById('displayNome').innerText      = userProfile.nome;
  document.getElementById('displayEmail').innerText     = userProfile.email;
  document.getElementById('displayCelular').innerText   = userProfile.celular;
  document.getElementById('displayFaculdade').innerText = userProfile.faculdade;

  const t = "?t=" + Date.now();
  const profileImg = document.getElementById('profileAvatar');
  const sidebarImg = document.getElementById('sidebarProfileImg');
  if (profileImg) profileImg.src = userProfile.foto + t;
  if (sidebarImg) sidebarImg.src = userProfile.foto + t;
}

// Controle de abas
const tabs     = document.querySelectorAll('.config-menu-item');
const contents = {
  perfil:       document.getElementById('tabPerfil'),
  seguranca:    document.getElementById('tabSeguranca'),
  notificacoes: document.getElementById('tabNotificacoes'),
  interface:    document.getElementById('tabInterface'),
  avancado:     document.getElementById('tabAvancado')
};

function activateTab(tabId) {
  Object.values(contents).forEach(c => { if (c) c.style.display = 'none'; });
  if (contents[tabId]) contents[tabId].style.display = 'block';
  tabs.forEach(tab => tab.classList.toggle('active', tab.dataset.tab === tabId));
}

tabs.forEach(tab => tab.addEventListener('click', () => activateTab(tab.dataset.tab)));

// Edição inline de campos
let currentEditField = '';
const editModal = new bootstrap.Modal(document.getElementById('editModal'));

window.editarCampo = (campo) => {
  currentEditField = campo;
  const labels = { nome: "Nome Completo", email: "Email", celular: "Celular", faculdade: "Faculdade Atrelada" };
  document.getElementById('editModalLabel').innerText = `Editar ${labels[campo]}`;
  document.getElementById('editFieldInput').value = userProfile[campo];
  editModal.show();
};

document.getElementById('saveEditBtn').addEventListener('click', () => {
  const val = document.getElementById('editFieldInput').value.trim();
  if (!val) { alert("Valor inválido"); return; }
  userProfile[currentEditField] = val;
  updateProfileUI();
  editModal.hide();
});

document.getElementById('atualizarPerfilBtn').addEventListener('click', () => {
  alert("Perfil atualizado com sucesso! (Simulação)");
});

// Upload de foto
const uploadBtn = document.getElementById('uploadFotoBtn');
const fotoInput = document.getElementById('fotoInput');
uploadBtn.addEventListener('click', () => fotoInput.click());
fotoInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (file && ['image/jpeg', 'image/png'].includes(file.type)) {
    const reader = new FileReader();
    reader.onload = ev => { userProfile.foto = ev.target.result; updateProfileUI(); };
    reader.readAsDataURL(file);
  } else {
    alert("Selecione uma imagem JPEG ou PNG.");
  }
});

document.getElementById('removerFotoBtn').addEventListener('click', () => {
  const nome = encodeURIComponent(userProfile.nome.split(' ')[0]);
  userProfile.foto = `https://ui-avatars.com/api/?background=6c83e6&color=fff&name=${nome}`;
  updateProfileUI();
});

// Alterar senha
document.getElementById('alterarSenhaBtn')?.addEventListener('click', () => {
  const s = prompt("Digite a nova senha:");
  if (s && s.length >= 6) alert("Senha alterada com sucesso!");
  else if (s) alert("A senha deve ter pelo menos 6 caracteres.");
});

// Exportar dados
document.getElementById('exportarDadosBtn')?.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(userProfile, null, 2)], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), { href: url, download: "dados_perfil_hoursync.json" });
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById('limparHistoricoBtn')?.addEventListener('click', () => {
  if (confirm("Limpar todo o histórico? Essa ação não pode ser desfeita."))
    alert("Histórico limpo com sucesso (simulação).");
});

// Modo escuro — permanente via localStorage
function applyDarkMode(enabled) {
  document.documentElement.classList.toggle('dark-mode', enabled);
  document.body.classList.toggle('dark-mode', enabled);
  const toggle = document.getElementById('darkModeToggle');
  if (toggle) toggle.checked = enabled;
}

// Aplicar preferência salva ao carregar
applyDarkMode(localStorage.getItem('hoursync_darkmode') === 'true');

// Listener no document para capturar mesmo quando aba está oculta
document.addEventListener('change', function(e) {
  if (e.target && e.target.id === 'darkModeToggle') {
    applyDarkMode(e.target.checked);
    localStorage.setItem('hoursync_darkmode', String(e.target.checked));
  }
});

// Sincronizar toggle ao abrir aba Interface
document.addEventListener('click', function(e) {
  if (e.target.closest('[data-tab="interface"]')) {
    setTimeout(() => applyDarkMode(localStorage.getItem('hoursync_darkmode') === 'true'), 50);
  }
});

// Tema de cores
document.getElementById('themeColorSelect')?.addEventListener('change', e => {
  const cor     = e.target.value;
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) sidebar.style.background = `linear-gradient(180deg, ${cor}, ${cor}dd)`;
});

// Inicialização
updateProfileUI();
activateTab('perfil');
