(function () {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) { mostrarErro(); return; }

  const detCarregando = document.getElementById('detCarregando');
  const detErro = document.getElementById('detErro');
  const detConteudo = document.getElementById('detConteudo');

  const rotulosPorte = { PEQUENO: 'Pequeno', MEDIO: 'Médio', GRANDE: 'Grande' };

  function obterUrlImagem(url) {
    const t = (url || '').toString().trim();
    if (!t || !/drive\.google\.com/.test(t)) return t;
    const m1 = t.match(/\/file\/d\/([^/?#]+)/);
    const m2 = t.match(/[?&]id=([^&#]+)/);
    const fid = (m1 && m1[1]) || (m2 && m2[1]);
    return fid ? 'https://lh3.googleusercontent.com/d/' + encodeURIComponent(fid) + '=w800' : t;
  }

  function mostrarErro() {
    detCarregando.classList.add('hidden');
    detErro.classList.remove('hidden');
  }

  async function carregar() {
    try {
      const resp = await fetch('/api/especies/' + id);
      if (!resp.ok) { mostrarErro(); return; }
      const esp = await resp.json();

      document.title = (esp.nomePopular || 'Espécie') + ' • Arborização Urbana';
      detCarregando.classList.add('hidden');
      detConteudo.classList.remove('hidden');

      document.getElementById('detNome').textContent = esp.nomePopular || '—';
      document.getElementById('detCientifico').textContent = esp.nomeCientifico ? 'Nome científico: ' + esp.nomeCientifico : '';
      document.getElementById('detFamilia').textContent = esp.familia || 'Não informada';
      document.getElementById('detPorte').textContent = rotulosPorte[esp.portePadrao] || esp.portePadrao || 'Não informado';
      document.getElementById('detIndicacao').textContent = esp.indicacaoPlantio || 'Não informada';
      document.getElementById('detObs').textContent = esp.observacoes || 'Nenhuma descrição cadastrada.';

      // Foto principal
      const fotoDiv = document.getElementById('detFotoPrincipal');
      if (esp.fotoUrl) {
        fotoDiv.innerHTML = '<img src="' + obterUrlImagem(esp.fotoUrl) + '" alt="' + (esp.nomePopular || '') + '" />';
      }

      // Galeria
      const fotos = [];
      if (esp.fotoUrl) fotos.push(esp.fotoUrl);
      (esp.fotos || []).forEach(f => { if (f.url) fotos.push(f.url); });
      if (fotos.length > 0) {
        document.getElementById('detGaleriaSection').classList.remove('hidden');
        document.getElementById('detGaleriaGrid').innerHTML = fotos.map(u =>
          '<img src="' + obterUrlImagem(u) + '" alt="Foto de ' + (esp.nomePopular || '') + '" loading="lazy" />'
        ).join('');
      }

      // Botão mapa
      document.getElementById('detBtnMapa').href = './index.html?especie=' + encodeURIComponent(esp.nomePopular);

      // Carregar árvores desta espécie
      carregarArvores(esp.nomePopular);
    } catch (e) {
      mostrarErro();
    }
  }

  async function carregarArvores(nomeEspecie) {
    try {
      const resp = await fetch('/api/arvores?size=500');
      if (!resp.ok) return;
      const data = await resp.json();
      const arvores = (data.value || []).filter(a =>
        a.especieNomePopular && a.especieNomePopular.toLowerCase() === (nomeEspecie || '').toLowerCase()
      );
      if (arvores.length === 0) return;
      document.getElementById('detArvoresSection').classList.remove('hidden');
      document.getElementById('detArvoresLista').innerHTML = arvores.map(a =>
        '<div class="det-arvore-item"><span class="det-arvore-dot"></span><span>' + (a.nome || 'Árvore #' + a.id) + ' — ' + (a.logradouro || a.bairro || 'Sem localização') + '</span></div>'
      ).join('');
    } catch (e) { /* silencioso */ }
  }

  carregar();
})();
