window.showToast = function (mensagem, tipo) {
  const toast = document.createElement('div');
  toast.className = 'toast toast-' + (tipo || 'sucesso');
  toast.innerHTML =
    '<span class="toast-check">' + (tipo === 'erro' ? '&#10006;' : '&#10003;') + '</span>' +
    '<span class="toast-texto">' + mensagem + '</span>';
  document.body.appendChild(toast);

  void toast.offsetWidth;
  toast.classList.add('toast-visivel');

  setTimeout(function () {
    toast.classList.remove('toast-visivel');
    setTimeout(function () { toast.remove(); }, 400);
  }, 3000);
};

window.animarEntrada = function (container) {
  if (!container) return;
  var cards = container.querySelectorAll('.os-card, .arvore-card, .area-card, .card');
  cards.forEach(function (card, i) {
    card.style.opacity = '0';
    card.style.transform = 'translateY(18px)';
    setTimeout(function () {
      card.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, 60 * i);
  });
};
