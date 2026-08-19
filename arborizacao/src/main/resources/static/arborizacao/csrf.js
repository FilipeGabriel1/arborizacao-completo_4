// Proteção CSRF para o front-end estático.
//
// O backend (CookieCsrfTokenRepository) guarda o token no cookie
// XSRF-TOKEN (não-HttpOnly). Este script:
//   1. garante que o cookie exista (chama GET /api/csrf se preciso);
//   2. injeta o header X-XSRF-TOKEN em todos os fetch() de escrita;
//   3. injeta um campo oculto _csrf em formulários (login/logout).
// Deve ser carregado antes dos scripts que fazem fetch/formulários.

(function () {
  const CSRF_COOKIE = 'XSRF-TOKEN';
  const CSRF_HEADER = 'X-XSRF-TOKEN';

  function getCookie(name) {
    const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
  }

  function hasCookie() {
    return new RegExp('(?:^|;\\s*)' + CSRF_COOKIE + '=').test(document.cookie);
  }

  let ensurePromise = null;
  function ensureCsrfCookie() {
    if (hasCookie()) {
      return Promise.resolve();
    }
    if (!ensurePromise) {
      ensurePromise = fetch('/api/csrf', { credentials: 'same-origin' })
        .catch(() => null)
        .finally(() => {
          ensurePromise = null;
        });
    }
    return ensurePromise;
  }

  function needsToken(method) {
    return method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE';
  }

  const originalFetch = window.fetch;
  window.fetch = async function (input, init) {
    init = init || {};
    const method = (init.method || (typeof input === 'string' ? 'GET' : 'GET')).toUpperCase();
    if (needsToken(method)) {
      await ensureCsrfCookie();
      const token = getCookie(CSRF_COOKIE);
      if (token) {
        const headers = new Headers(init.headers || {});
        headers.set(CSRF_HEADER, token);
        init.headers = headers;
      }
    }
    return originalFetch.call(this, input, init);
  };

  function applyTokenToForm(form) {
    const token = getCookie(CSRF_COOKIE);
    if (!token) {
      return;
    }
    let input = form.querySelector('input[name="_csrf"]');
    if (!input) {
      input = document.createElement('input');
      input.type = 'hidden';
      input.name = '_csrf';
      form.appendChild(input);
    }
    input.value = token;
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('form').forEach(function (form) {
      if (!needsToken((form.method || 'GET').toUpperCase())) {
        return;
      }
      ensureCsrfCookie().then(function () {
        applyTokenToForm(form);
      });
      form.addEventListener('submit', function () {
        ensureCsrfCookie().then(function () {
          applyTokenToForm(form);
        });
      });
    });
  });
})();