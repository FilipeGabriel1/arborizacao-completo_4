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
      if (userProfileEl) userProfileEl.textContent =
        usuario.perfil === 'ORDENS' ? 'Perfil: Ordens de Serviço'
          : usuario.admin ? 'Perfil: Administrador' : 'Perfil: Técnico';
      if (userAvatarEl) userAvatarEl.textContent = initials;

      // Perfil ORDENS: acesso exclusivo às Ordens de Serviço
      if (usuario.perfil === 'ORDENS') {
        const paginaAtual = (location.pathname.split('/').pop() || '').toLowerCase();
        if (paginaAtual && paginaAtual !== 'manejo.html') {
          location.replace('./manejo.html');
          return;
        }
        document.querySelectorAll('.sidebar-link').forEach((el) => {
          const href = (el.getAttribute('href') || '').toLowerCase();
          el.hidden = !href.includes('manejo.html');
        });
        document.querySelectorAll('.sidebar-section').forEach((sec) => {
          const temVisivel = [...sec.querySelectorAll('.sidebar-link')].some((l) => !l.hidden);
          sec.hidden = !temVisivel;
        });
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

  // Notificações (ordens de serviço em aberto)
  const notifBadge = document.getElementById('notifCount');
  const notifBtn = document.querySelector('.topbar-notif');
  let notifItens = [];
  const notifPrioOrder = { URGENTE: 0, ALTA: 1, MEDIA: 2, BAIXA: 3 };
  const notifTipoLabels = {
    PODA_LIMPEZA: 'Poda Limpeza', PODA_FORMACAO: 'Poda Formação', PODA_RENOVACAO: 'Poda Renovação',
    MONITORAMENTO: 'Monitoramento', COMBATE_PRAGAS: 'Combate a Pragas', TRANSPLANTE: 'Transplante',
    EXTRACAO: 'Extração', REPOUSO: 'Reposo'
  };
  if (notifBadge) {
    fetch('/api/manutencoes?page=0&size=200', { credentials: 'same-origin' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const itens = data?.value || data || [];
        notifItens = itens.filter(m => m.status === 'PENDENTE' || m.status === 'EM_EXECUCAO');
        notifBadge.textContent = notifItens.length;
        notifBadge.style.display = notifItens.length > 0 ? 'grid' : 'none';
      })
      .catch(() => {});
  }
  if (notifBtn) {
    const wrap = document.createElement('div');
    wrap.className = 'notif-wrap';
    notifBtn.parentElement.insertBefore(wrap, notifBtn);
    wrap.appendChild(notifBtn);

    const dd = document.createElement('div');
    dd.className = 'notif-dropdown';
    dd.style.display = 'none';
    wrap.appendChild(dd);

    const renderNotifs = () => {
      if (!notifItens.length) {
        dd.innerHTML = '<div class="notif-vazio">Nenhuma ordem de serviço pendente.</div>' +
          '<a class="notif-ver-todas" href="./manejo.html">Ver ordens de serviço →</a>';
        return;
      }
      const lista = notifItens.slice().sort((a, b) =>
        (notifPrioOrder[a.prioridade] ?? 9) - (notifPrioOrder[b.prioridade] ?? 9)
      ).slice(0, 6);
      dd.innerHTML =
        '<div class="notif-header">Notificações <span>' + notifItens.length + ' em aberto</span></div>' +
        lista.map(m => {
          const idLabel = 'OS-' + String(m.id).padStart(5, '0');
          const tipo = notifTipoLabels[m.tipo] || m.tipo || 'Ordem de serviço';
          const prio = (m.prioridade || 'MEDIA').toLowerCase();
          return '<div class="notif-item" role="button" tabindex="0">' +
            '<span class="notif-prio ' + prio + '">' + (m.prioridade || '—') + '</span>' +
            '<div class="notif-corpo"><strong>' + tipo + ' — ' + idLabel + '</strong>' +
            '<small>' + (m.endereco || 'Endereço não informado') + '</small></div>' +
            '</div>';
        }).join('') +
        (notifItens.length > 6 ? '<div class="notif-resto">+ ' + (notifItens.length - 6) + ' outra(s)</div>' : '') +
        '<a class="notif-ver-todas" href="./manejo.html">Ver todas as ordens de serviço →</a>';
      dd.querySelectorAll('.notif-item').forEach(el => {
        const ir = () => { window.location.href = './manejo.html'; };
        el.addEventListener('click', ir);
        el.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') ir(); });
      });
    };

    notifBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const abrir = dd.style.display === 'none';
      if (abrir) renderNotifs();
      dd.style.display = abrir ? 'block' : 'none';
    });
    document.addEventListener('click', (e) => {
      if (dd.style.display !== 'none' && !dd.contains(e.target)) dd.style.display = 'none';
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') dd.style.display = 'none';
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

  // Mobile hamburger menu
  const hamburger = document.querySelector('.hamburger-btn');
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.sidebar-overlay');
  if (hamburger && sidebar) {
    hamburger.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      if (overlay) overlay.classList.toggle('open');
    });
    if (overlay) {
      overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('open');
      });
    }
  }
})();
