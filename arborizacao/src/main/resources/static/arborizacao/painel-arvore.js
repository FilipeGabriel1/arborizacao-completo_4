(function () {
  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function imageUrl(url) {
    var texto = (url || '').toString().trim();
    if (!texto || !/drive\.google\.com/.test(texto)) return texto;
    var matchFile = texto.match(/\/file\/d\/([^/?#]+)/);
    var matchId = texto.match(/[?&]id=([^&#]+)/);
    var id = (matchFile && matchFile[1]) || (matchId && matchId[1]);
    if (!id) return texto;
    return 'https://lh3.googleusercontent.com/d/' + encodeURIComponent(id) + '=w1200';
  }

  function fotoPrincipal(arvore) {
    if (arvore.fotoUrl) return arvore.fotoUrl;
    if (Array.isArray(arvore.fotos) && arvore.fotos.length) {
      var primeira = arvore.fotos[0];
      return typeof primeira === 'string' ? primeira : (primeira && primeira.url) || '';
    }
    return '';
  }

  function montarConteudoArvore(arvore, fallback) {
    var a = arvore || {};
    var p = fallback || {};
    var nome = a.nome || p.nome || ('Árvore #' + (a.id || p.id || ''));
    var especie = a.especieNomePopular || p.especie || '';
    var descricao = a.descricao || '';
    var foto = fotoPrincipal(a) || p.fotoUrl || '';

    var fotoHtml = foto
      ? '<div class="tela-arvore-foto"><img src="' + escapeHtml(imageUrl(foto)) + '" alt="' + escapeHtml(nome) + '" loading="lazy" onerror="this.parentNode.style.display=\'none\';" /></div>'
      : '<div class="tela-arvore-foto tela-arvore-sem-foto">Sem foto</div>';

    var especieHtml = especie
      ? '<div class="tela-arvore-especie">' + escapeHtml(especie) + '</div>'
      : '';

    var descricaoHtml = descricao
      ? '<div class="tela-arvore-descricao">' + escapeHtml(descricao) + '</div>'
      : '<div class="tela-arvore-descricao tela-arvore-sem-desc">Sem descrição cadastrada.</div>';

    return (
      '<div class="tela-arvore">' +
        '<div class="tela-arvore-ficha">' +
          '<div class="tela-arvore-titulo">' +
            '<h2>' + escapeHtml(nome) + '</h2>' +
            '<button type="button" class="tela-arvore-fechar" aria-label="Fechar">&times;</button>' +
          '</div>' +
          fotoHtml +
          especieHtml +
          descricaoHtml +
        '</div>' +
      '</div>'
    );
  }

  function abrirTelaArvore(arvore, fallback) {
    fecharTelaArvore();
    var overlay = document.createElement('div');
    overlay.className = 'tela-arvore-overlay';
    overlay.id = 'telaArvoreOverlay';
    overlay.innerHTML = montarConteudoArvore(arvore, fallback);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay || e.target.classList.contains('tela-arvore-fechar')) {
        fecharTelaArvore();
      }
    });
    document.addEventListener('keydown', escFechar);
    document.body.appendChild(overlay);
    requestAnimationFrame(function () { overlay.classList.add('aberta'); });
  }

  function fecharTelaArvore() {
    var overlay = document.getElementById('telaArvoreOverlay');
    if (overlay) overlay.remove();
    document.removeEventListener('keydown', escFechar);
  }

  function escFechar(e) {
    if (e.key === 'Escape') fecharTelaArvore();
  }

  window.montarPainelArvore = function (arvore, fallback) {
    abrirTelaArvore(arvore, fallback);
    return '';
  };
  window.abrirTelaArvore = abrirTelaArvore;
  window.fecharTelaArvore = fecharTelaArvore;
})();
