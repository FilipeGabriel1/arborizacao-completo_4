// Carrega os dados do usuário logado (nome/e-mail e se é admin) e
// intercepta qualquer fetch() da página: se a sessão expirar (401),
// manda o usuário de volta para o login em vez de travar a tela.

(function () {
  const originalFetch = window.fetch;

  window.fetch = function (...args) {
    return originalFetch.apply(this, args).then((response) => {
      if (response.status === 401) {
        window.location.href = '/arborizacao/login.html?expirou=1';
      }
      return response;
    });
  };

  fetch('/api/auth/me')
    .then((res) => (res.ok ? res.json() : null))
    .then((usuario) => {
      if (!usuario) {
        return;
      }
      const emailEl = document.getElementById('userEmail');
      if (emailEl) {
        emailEl.textContent = usuario.email;
      }
      if (usuario.admin) {
        document.querySelectorAll('[data-admin]').forEach((el) => {
          el.hidden = false;
        });
      }
    })
    .catch(() => {
      // Se /api/auth/me falhar por outro motivo, não bloqueia o resto da página.
    });
})();
