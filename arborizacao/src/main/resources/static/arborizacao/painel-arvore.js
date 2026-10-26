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

  function listarFotos(arvore) {
    var urls = [];
    if (arvore && arvore.fotoUrl) urls.push(arvore.fotoUrl);
    if (arvore && Array.isArray(arvore.fotos)) {
      arvore.fotos.forEach(function (f) {
        var u = typeof f === 'string' ? f : (f && f.url);
        if (u && urls.indexOf(u) === -1) urls.push(u);
      });
    }
    return urls;
  }

  function montarFotoHtml(arvore, fallback, nome) {
    var fotos = listarFotos(arvore);
    if (!fotos.length && fallback && fallback.fotoUrl) fotos.push(fallback.fotoUrl);
    if (!fotos.length) {
      return '<div class="tela-arvore-foto tela-arvore-sem-foto">Sem foto</div>';
    }

    var principal = fotos[0];
    var thumbsHtml = '';
    if (fotos.length > 1) {
      thumbsHtml = '<div class="tela-arvore-thumbs">' + fotos.map(function (u, i) {
        var src = imageUrl(u);
        return '<button type="button" class="tela-arvore-thumb" data-src="' + escapeHtml(src) + '" style="padding:0;border:2px solid ' + (i === 0 ? '#4ade80' : 'transparent') + ';border-radius:8px;overflow:hidden;cursor:pointer;background:none;">' +
          '<img src="' + escapeHtml(src) + '" alt="Foto ' + (i + 1) + ' da árvore" loading="lazy" style="width:52px;height:52px;object-fit:cover;display:block;" />' +
          '</button>';
      }).join('') + '</div>';
    }

    return '<div class="tela-arvore-foto">' +
      '<img id="telaArvoreFotoPrincipal" src="' + escapeHtml(imageUrl(principal)) + '" alt="' + escapeHtml(nome) + '" loading="lazy" onerror="this.style.display=\'none\';" />' +
      thumbsHtml +
      '</div>';
  }

  function montarConteudoArvore(arvore, fallback) {
    var a = arvore || {};
    var p = fallback || {};
    var nome = a.nome || p.nome || ('Árvore #' + (a.id || p.id || ''));
    var especie = a.especieNomePopular || p.especie || '';
    var descricao = a.descricao || '';
    var fotoHtml = montarFotoHtml(arvore, fallback, nome);

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

    var mainImg = overlay.querySelector('#telaArvoreFotoPrincipal');
    var thumbs = overlay.querySelectorAll('.tela-arvore-thumb');
    thumbs.forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!mainImg) return;
        mainImg.style.display = 'block';
        mainImg.src = btn.getAttribute('data-src');
        thumbs.forEach(function (outro) { outro.style.borderColor = 'transparent'; });
        btn.style.borderColor = '#4ade80';
      });
    });

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
