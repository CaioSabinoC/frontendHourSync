(function() {
  const form = document.getElementById('formRecuperarSenha');
  const emailInput = document.getElementById('emailRecuperar');
  const toastEl = document.getElementById('liveToast');
  let toastBootstrap = null;

  if (toastEl) toastBootstrap = new bootstrap.Toast(toastEl, { autohide: true, delay: 4000 });

  function showMessage(message, isError = false) {
    const toastBody = document.getElementById('toastMessage');
    if (toastBody) {
      toastBody.innerHTML = isError ? `⚠️ ${message}` : `✅ ${message}`;
      if (toastEl) {
        toastEl.classList.toggle('bg-danger', isError);
        toastEl.classList.toggle('bg-dark', !isError);
        if (toastBootstrap) toastBootstrap.show();
        setTimeout(() => { toastEl.classList.remove('bg-danger'); toastEl.classList.add('bg-dark'); }, 3500);
      }
    } else { alert(message); }
  }

  const isValidEmail = e => /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/.test(e);

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    const email = emailInput.value.trim();
    if (!email) { showMessage('Digite seu e-mail institucional.', true); emailInput.focus(); return; }
    if (!isValidEmail(email)) { showMessage('E-mail inválido.', true); emailInput.focus(); return; }

    try {
      const admins = JSON.parse(localStorage.getItem('hourSync_superAdmins') || '[]');
      const existe = admins.some(a => a.email === email);
      showMessage(existe
        ? `Link enviado para ${email}. Verifique sua caixa de entrada.`
        : 'Se o e-mail estiver cadastrado, você receberá as instruções em breve.'
      );
    } catch { showMessage('Se o e-mail estiver cadastrado, você receberá as instruções em breve.'); }

    emailInput.value = '';
  });
})();
