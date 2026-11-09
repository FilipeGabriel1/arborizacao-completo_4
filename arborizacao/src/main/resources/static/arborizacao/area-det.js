(function () {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) { mostrarErro(); return; }

  const detCarregando = document.getElementById('detCarregando');
  const detErro = document.getElementById('detErro');
  const detConteudo = document.getElementById('detConteudo');

  const rotulosTipo = { PRACA: 'Praça', BOSQUE: 'Bosque', MATA: 'Mata', PARQUE: 'Parque', OUTRO: 'Outro' };

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
      const resp = await fetch('/api/areas/' + id);
      if (!resp.ok) { mostrarErro(); return; }
      const area = await resp.json();

      document.title = (area.nome || 'Área') + ' • Arborização Urbana';
      detCarregando.classList.add('hidden');
      detConteudo.classList.remove('hidden');

      document.getElementById('detNome').textContent = area.nome || '—';
      document.getElementById('detTipo').textContent = rotulosTipo[area.tipo] || area.tipo || '';
      document.getElementById('detDescricao').textContent = area.descricao || 'Sem descrição';
      document.getElementById('detBairro').textContent = area.bairro || '—';
      document.getElementById('detLogradouro').textContent = area.logradouro || '—';
      document.getElementById('detAreaTotal').textContent = area.areaTotalM2 ? area.areaTotalM2 + ' m²' : '—';
      document.getElementById('detResponsavel').textContent = area.responsavelManutencao || '—';
      document.getElementById('detIndividuos').textContent = area.individuosCadastrados || '—';

      // Foto principal
      const fotoDiv = document.getElementById('detFotoPrincipal');
      if (area.fotoUrl) {
        let creditoHtml = '';
        if (String(area.fotoUrl).indexOf('wikimedia.org') !== -1) {
          creditoHtml = '<p class="foto-credito" style="margin:6px 0 0;font-size:0.7rem;color:#9ca3af;line-height:1.5;">Foto: <a href="https://commons.wikimedia.org/wiki/File:Bairro_da_matriz,_Vit%C3%B3ria_de_Santo_Ant%C3%A3o.jpg" target="_blank" rel="noopener" style="color:#4ade80;">Luiz Eduardo / Wikimedia Commons</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.pt" target="_blank" rel="noopener" style="color:#4ade80;">CC BY-SA 4.0</a></p>';
        }
        fotoDiv.innerHTML = '<img referrerpolicy="no-referrer" src="' + obterUrlImagem(area.fotoUrl) + '" alt="' + (area.nome || '') + '" />' + creditoHtml;
      }

      // Galeria
      const fotos = [];
      if (area.fotoUrl) fotos.push(area.fotoUrl);
      (area.fotos || []).forEach(f => { const u = typeof f === 'string' ? f : f.url; if (u) fotos.push(u); });
      if (fotos.length > 0) {
        document.getElementById('detGaleriaSection').classList.remove('hidden');
        document.getElementById('detGaleriaGrid').innerHTML = fotos.map(u =>
          '<img referrerpolicy="no-referrer" src="' + obterUrlImagem(u) + '" alt="Foto de ' + (area.nome || '') + '" loading="lazy" />'
        ).join('');
      }

      // Botão mapa
      document.getElementById('detBtnMapa').href = './index.html?area=' + encodeURIComponent(area.nome);

      // Carregar árvores desta área
      carregarArvores(area.id);
    } catch (e) {
      mostrarErro();
    }
  }

  async function carregarArvores(areaId) {
    try {
      const resp = await fetch('/api/arvores?size=500');
      if (!resp.ok) return;
      const data = await resp.json();
      const arvores = (data.value || []).filter(a => String(a.areaId) === String(areaId));
      if (arvores.length === 0) return;
      document.getElementById('detArvoresSection').classList.remove('hidden');
      document.getElementById('detArvoresLista').innerHTML = arvores.map(a =>
        '<div class="det-arvore-item"><span class="det-arvore-dot"></span><span>' +
        (a.nome || 'Árvore #' + a.id) + ' — ' + (a.especieNomePopular || 'Espécie não informada') +
        (a.porte ? ' • ' + a.porte : '') +
        '</span></div>'
      ).join('');
    } catch (e) { /* silencioso */ }
  }

  carregar();
})();
