(function() {
  if (localStorage.getItem('cookies-aceitos')) return;

  var banner = document.createElement('div');
  banner.className = 'cookie-banner';
  banner.innerHTML = '\
    <div class="cookie-text">\
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>\
      <span>Utilizamos apenas cookies essenciais para o funcionamento do sistema (sessão e CSRF). Não utilizamos cookies de rastreamento ou publicidade.\
        Saiba mais na <a href="./politica-privacidade.html">Política de Privacidade</a>.</span>\
    </div>\
    <button class="cookie-btn" id="cookieAceitar">Entendi</button>';

  document.body.appendChild(banner);

  var style = document.createElement('style');
  style.textContent = '\
    .cookie-banner {\
      position: fixed;\
      bottom: 0;\
      left: 0;\
      right: 0;\
      z-index: 10001;\
      display: flex;\
      align-items: center;\
      justify-content: space-between;\
      gap: 16px;\
      padding: 16px 24px;\
      background: #0d1a13;\
      border-top: 1px solid rgba(74, 222, 128, 0.2);\
      box-shadow: 0 -4px 20px rgba(0,0,0,0.4);\
    }\
    .cookie-text {\
      display: flex;\
      align-items: center;\
      gap: 10px;\
      color: #9ca3af;\
      font-size: 0.85rem;\
      line-height: 1.5;\
    }\
    .cookie-text svg { color: #4ade80; flex-shrink: 0; }\
    .cookie-text a { color: #4ade80; text-decoration: none; }\
    .cookie-text a:hover { text-decoration: underline; }\
    .cookie-btn {\
      flex-shrink: 0;\
      padding: 8px 20px;\
      border-radius: 8px;\
      border: 1px solid rgba(74, 222, 128, 0.5);\
      background: transparent;\
      color: #4ade80;\
      font-weight: 600;\
      font-size: 0.85rem;\
      cursor: pointer;\
      transition: all 0.2s;\
    }\
    .cookie-btn:hover {\
      background: rgba(74, 222, 128, 0.15);\
    }\
    @media (max-width: 720px) {\
      .cookie-banner { flex-direction: column; align-items: stretch; padding: 14px 16px; }\
      .cookie-text { font-size: 0.8rem; }\
      .cookie-btn { width: 100%; text-align: center; }\
    }';
  document.head.appendChild(style);

  document.getElementById('cookieAceitar').addEventListener('click', function() {
    localStorage.setItem('cookies-aceitos', 'true');
    banner.remove();
  });
})();
