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
      // Atualizar nome e avatar
      const nome = usuario.nome || usuario.email || 'Técnico(a)';
      const nomeCurto = nome.split(' ')[0];
      const initials = nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      const userNameEl = document.getElementById('userName');
      const userFullNameEl = document.getElementById('userFullName');
      const userProfileEl = document.getElementById('userProfile');
      const userAvatarEl = document.getElementById('userAvatar');
      if (userNameEl) userNameEl.textContent = nomeCurto;
      if (userFullNameEl) userFullNameEl.textContent = nome;
      if (userProfileEl) userProfileEl.textContent = usuario.admin ? 'Perfil: Administrador' : 'Perfil: Técnico';
      if (userAvatarEl) userAvatarEl.textContent = initials;
      if (usuario.admin) {
        document.querySelectorAll('[data-admin]').forEach((el) => {
          el.hidden = false;
        });
      }
    })
    .catch(() => {
      // Se /api/auth/me falhar por outro motivo, não bloqueia o resto da página.
    });

  // Tooltips automáticos para texto truncado
  function aplicarTooltips() {
    document.querySelectorAll('.area-item h3, .area-item .area-description, .sidebar-link span:last-child, .nursery-stat-label, .activity-body strong, .recent-trees-table td').forEach(el => {
      if (!el.title) {
        el.title = el.textContent.trim();
      }
    });
  }
  aplicarTooltips();

  const observer = new MutationObserver(aplicarTooltips);
  observer.observe(document.body, { childList: true, subtree: true });

  // Contagem de notificações (manejos pendentes)
  const notifBadge = document.getElementById('notifCount');
  const notifBtn = document.querySelector('.topbar-notif');
  if (notifBadge) {
    fetch('/api/manutencoes?page=0&size=200', { credentials: 'same-origin' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const itens = data?.value || data || [];
        const pendentes = itens.filter(m => m.status === 'PENDENTE').length;
        notifBadge.textContent = pendentes;
        notifBadge.style.display = pendentes > 0 ? 'grid' : 'none';
      })
      .catch(() => {});
  }
  if (notifBtn) {
    notifBtn.addEventListener('click', () => {
      window.location.href = './manejo.html';
    });
  }

  // Click no perfil do usuário
  const userBox = document.querySelector('.topbar-user');
  if (userBox) {
    userBox.style.cursor = 'pointer';
    userBox.addEventListener('click', () => {
      window.location.href = './usuarios.html';
    });
  }
})();
