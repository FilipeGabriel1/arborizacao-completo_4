(function() {
  var synth = window.speechSynthesis;
  var speaking = false;
  var utterance = null;

  var container = document.createElement('div');
  container.className = 'a11y-widget';
  container.innerHTML = '\
    <button class="a11y-btn a11y-btn-audio" id="a11yAudioBtn" title="Ler página em áudio" aria-label="Ler página em áudio">\
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">\
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>\
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>\
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>\
      </svg>\
      <span>Ouvir</span>\
    </button>\
    <button class="a11y-btn a11y-btn-stop" id="a11yStopBtn" title="Parar leitura" aria-label="Parar leitura" style="display:none;">\
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">\
        <rect x="6" y="6" width="12" height="12" rx="2"/>\
      </svg>\
      <span>Parar</span>\
    </button>';
  document.body.appendChild(container);

  var style = document.createElement('style');
  style.textContent = '\
    .a11y-widget {\
      position: fixed;\
      bottom: 90px;\
      right: 20px;\
      z-index: 10000;\
      display: flex;\
      flex-direction: column;\
      gap: 8px;\
    }\
    .a11y-btn {\
      display: flex;\
      align-items: center;\
      gap: 6px;\
      padding: 10px 14px;\
      border-radius: 24px;\
      border: none;\
      cursor: pointer;\
      font-size: 0.8rem;\
      font-weight: 600;\
      font-family: inherit;\
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);\
      transition: all 0.2s;\
    }\
    .a11y-btn-audio {\
      background: #1a3a1a;\
      color: #4ade80;\
      border: 1px solid rgba(74,222,128,0.4);\
    }\
    .a11y-btn-audio:hover {\
      background: #22c55e;\
      color: #fff;\
    }\
    .a11y-btn-audio.speaking {\
      background: #22c55e;\
      color: #fff;\
      animation: a11y-pulse 1.5s infinite;\
    }\
    .a11y-btn-stop {\
      background: #7f1d1d;\
      color: #fca5a5;\
      border: 1px solid rgba(252,165,165,0.4);\
    }\
    .a11y-btn-stop:hover {\
      background: #dc2626;\
      color: #fff;\
    }\
    @keyframes a11y-pulse {\
      0%, 100% { box-shadow: 0 4px 12px rgba(0,0,0,0.3); }\
      50% { box-shadow: 0 4px 20px rgba(34,197,94,0.5); }\
    }\
    @media (max-width: 720px) {\
      .a11y-widget { bottom: 80px; right: 12px; }\
      .a11y-btn { padding: 8px 10px; font-size: 0.7rem; }\
      .a11y-btn span { display: none; }\
    }';
  document.head.appendChild(style);

  var audioBtn = document.getElementById('a11yAudioBtn');
  var stopBtn = document.getElementById('a11yStopBtn');

  function getPageText() {
    var main = document.querySelector('main') || document.querySelector('.page-content') || document.body;
    var clone = main.cloneNode(true);
    var scripts = clone.querySelectorAll('script, style, nav, .navbar, .navbar-dropdown, footer, .footer, .a11y-widget');
    scripts.forEach(function(el) { el.remove(); });
    return clone.innerText.replace(/\s+/g, ' ').trim();
  }

  audioBtn.addEventListener('click', function() {
    if (speaking) {
      synth.cancel();
      speaking = false;
      audioBtn.classList.remove('speaking');
      stopBtn.style.display = 'none';
      return;
    }
    var text = getPageText();
    if (!text) return;
    utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onstart = function() {
      speaking = true;
      audioBtn.classList.add('speaking');
      stopBtn.style.display = 'flex';
    };
    utterance.onend = function() {
      speaking = false;
      audioBtn.classList.remove('speaking');
      stopBtn.style.display = 'none';
    };
    synth.speak(utterance);
  });

  stopBtn.addEventListener('click', function() {
    synth.cancel();
    speaking = false;
    audioBtn.classList.remove('speaking');
    stopBtn.style.display = 'none';
  });
})();
