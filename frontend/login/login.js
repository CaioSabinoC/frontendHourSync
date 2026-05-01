/* =====================================================
   HourSync — login.js (INTEGRADO AO BACKEND)
   ===================================================== */

const API_BASE = 'https://hoursync-backend.onrender.com';

document.addEventListener('DOMContentLoaded', function () {
  const loginForm     = document.getElementById('loginForm');
  const loginEmail    = document.getElementById('loginEmail');
  const loginPassword = document.getElementById('loginPassword');
  const loginError    = document.getElementById('loginError');
  const btnSubmit     = loginForm?.querySelector('button[type="submit"]');

  function showError(msg) {
    if (!loginError) return;
    loginError.textContent = msg;
    loginError.classList.remove('visually-hidden');
  }

  function hideError() {
    if (!loginError) return;
    loginError.textContent = '';
    loginError.classList.add('visually-hidden');
  }

  function setLoading(ativo) {
    if (!btnSubmit) return;
    if (ativo) {
      btnSubmit.dataset.original = btnSubmit.innerHTML;
      btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Entrando...';
      btnSubmit.disabled = true;
    } else {
      btnSubmit.innerHTML = btnSubmit.dataset.original || 'Acessar Plataforma';
      btnSubmit.disabled = false;
    }
  }

  loginForm?.addEventListener('submit', async function (e) {
    e.preventDefault();
    hideError();

    const email = loginEmail?.value.trim();
    const senha = loginPassword?.value;

    if (!email || !senha) {
      showError('Preencha email e senha para continuar.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      });

      const data = await response.json();

      if (!response.ok) {
        showError(data.mensagem || data.message || 'Email ou senha inválidos.');
        return;
      }

      // Salvar token e usuário
      localStorage.setItem('hoursync_token', data.token);
      localStorage.setItem('hoursync_user', JSON.stringify(data.usuario));

      // Redirecionar conforme o tipo/role do usuário
      const role = data.usuario?.role || data.usuario?.role || '';
      const isAdmin = role.toLowerCase().includes('SUPER_ADMIN') || role.toLowerCase().includes('super');

      if (isAdmin) {
        window.location.href = '../dashboard_admin/dashboard_admin.html';
      } else {
        window.location.href = '../dashboard_coordenador/dashboard_coordenador.html';
      }

    } catch (err) {
      console.error('Erro no login:', err);
      showError('Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
    } finally {
      setLoading(false);
    }
  });
});
