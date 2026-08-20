const mapStyle = {
  version: 8,
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  sources: {
    'osm-tiles': {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors'
    }
  },
  layers: [{ id: 'osm-tiles-layer', type: 'raster', source: 'osm-tiles' }]
};

const areasList = document.getElementById('areasList');
const totalAreasEl = document.getElementById('totalAreas');
const totalArvoresEl = document.getElementById('totalArvores');
const buscaForm = document.getElementById('buscaForm');
const buscaTermoInput = document.getElementById('buscaTermo');
const buscaResultado = document.getElementById('buscaResultado');
const placarPlantadasEl = document.getElementById('placarPlantadas');
const placarDoadasEl = document.getElementById('placarDoadas');
const placarDoacoesEl = document.getElementById('placarDoacoes');
const placarAreasEl = document.getElementById('placarAreas');
const placarEspeciesEl = document.getElementById('placarEspecies');
const placarAtualizadoEmEl = document.getElementById('placarAtualizadoEm');
const barraDoadasEl = document.getElementById('barraDoadas');
const placarPorcentagemEl = document.getElementById('placarPorcentagem');
const placarPorteEl = document.getElementById('placarPorte');
const placarOrigemEl = document.getElementById('placarOrigem');
const placarFeedEl = document.getElementById('placarFeed');

let areas = [];
let arvores = [];
let placarAnterior = null;

function formatarNumero(valor) {
  return Number(valor || 0).toLocaleString('pt-BR');
}

function formatarData(data) {
  if (!data) return 'data não informada';
  const [ano, mes, dia] = String(data).slice(0, 10).split('-');
  return `${dia}/${mes}/${ano}`;
}

function animarValor(el, alvo) {
  const inicio = Number(el.dataset.valor || 0);
  const fim = Number(alvo || 0);
  if (inicio === fim) return;
  el.dataset.valor = fim;
  const duracao = 600;
  const inicioMs = performance.now();
  function passo(agora) {
    const progresso = Math.min((agora - inicioMs) / duracao, 1);
    const suavizado = 1 - Math.pow(1 - progresso, 3);
    el.textContent = formatarNumero(Math.round(inicio + (fim - inicio) * suavizado));
    if (progresso < 1) requestAnimationFrame(passo);
  }
  requestAnimationFrame(passo);
}

const rotulosPortePlacar = { PEQUENO: 'Pequeno', MEDIO: 'Médio', GRANDE: 'Grande' };
const rotulosOrigemPlacar = {
  DOACAO: 'Doação',
  OBRIGACAO_LEGAL: 'Obrigação legal',
  PLANTIO_PROPRIO: 'Plantio próprio',
  OUTRA: 'Outra'
};
const rotulosStatusPlacar = {
  ATIVA: 'Ativa',
  INATIVA: 'Inativa',
  REMOVIDA: 'Removida',
  EM_MANUTENCAO: 'Em manutenção'
};

function renderizarBarras(container, dados, rotulos, cor) {
  const itens = Object.entries(dados || {});
  const total = itens.reduce((soma, [, v]) => soma + Number(v || 0), 0);
  if (!total) {
    container.innerHTML = '<p class="placar-bloco-nota">Sem registros ainda.</p>';
    return;
  }

  container.innerHTML = '';
  itens.forEach(([chave, valor], indice) => {
    const qtd = Number(valor || 0);
    const percentual = (qtd / total) * 100;
    const linha = document.createElement('div');
    linha.className = 'placar-barras-linha';
    linha.style.animationDelay = `${indice * 90}ms`;
    linha.innerHTML = `
      <div class="placar-barras-topo">
        <span>${rotulos[chave] || chave}</span>
        <strong>${formatarNumero(qtd)}</strong>
      </div>
      <div class="placar-barra">
        <div class="placar-barra-fill" style="width:0%; background:${cor};"></div>
      </div>
    `;
    container.appendChild(linha);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        linha.querySelector('.placar-barra-fill').style.width = `${percentual}%`;
      });
    });
  });
}

function renderizarFeed(doacoes) {
  if (!doacoes || !doacoes.length) {
    placarFeedEl.innerHTML = '<p class="placar-bloco-nota">Nenhuma doação registrada ainda.</p>';
    return;
  }

  placarFeedEl.innerHTML = '';
  doacoes.forEach((d, indice) => {
    const item = document.createElement('article');
    item.className = 'placar-feed-item';
    item.style.animationDelay = `${indice * 90}ms`;
    const quantidade = d.quantidade ? formatarNumero(d.quantidade) : '1';
    item.innerHTML = `
      <div class="placar-feed-icone">🌳</div>
      <div class="placar-feed-texto">
        <strong>${d.solicitante || 'Doador não informado'}</strong>
        <span>${quantidade} muda(s)${d.especieNomePopular ? ' de ' + d.especieNomePopular : ''}${d.descricao ? ' • ' + d.descricao : ''}</span>
      </div>
      <time>${formatarData(d.dataDoacao)}</time>
    `;
    placarFeedEl.appendChild(item);
  });
}

function renderizarPlacar(placar) {
  animarValor(placarPlantadasEl, placar.totalArvores);
  animarValor(placarDoadasEl, placar.totalDoadas);
  animarValor(placarDoacoesEl, placar.totalDoacoes);
  animarValor(placarAreasEl, placar.totalAreas);
  animarValor(placarEspeciesEl, placar.totalEspecies);
  placarAtualizadoEmEl.textContent = new Date(placar.atualizadoEm).toLocaleTimeString('pt-BR');

  const totalPlantadas = Number(placar.totalArvores || 0);
  const totalDoadas = Number(placar.totalDoadas || 0);
  const percentual = totalPlantadas > 0 ? Math.min((totalDoadas / totalPlantadas) * 100, 100) : 0;
  barraDoadasEl.style.width = `${percentual}%`;
  placarPorcentagemEl.innerHTML = `<strong>${percentual.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}%</strong> das plantadas vieram de doações`;

  renderizarBarras(placarPorteEl, placar.arvoresPorPorte, rotulosPortePlacar, '#49a970');
  renderizarBarras(placarOrigemEl, placar.arvoresPorOrigem, rotulosOrigemPlacar, '#6aa7c1');
  renderizarFeed(placar.doacoesRecentes);
}

function placarMudou(placar) {
  const dados = { ...placar };
  delete dados.atualizadoEm;
  const chave = JSON.stringify(dados);
  if (chave === placarAnterior) return false;
  placarAnterior = chave;
  return true;
}

async function carregarPlacar() {
  try {
    const res = await fetch('/api/placar');
    if (!res.ok) return;
    const placar = await res.json();
    if (!placarMudou(placar)) return;
    renderizarPlacar(placar);
  } catch (err) {
    // mantém os últimos valores em caso de falha na atualização
  }
}

function normalizarTexto(texto) {
  return (texto || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function obterUrlImagem(url) {
  const texto = (url || '').toString().trim();
  if (!texto || !/drive\.google\.com/.test(texto)) {
    return texto;
  }

  const matchFile = texto.match(/\/file\/d\/([^/?#]+)/);
  const matchId = texto.match(/[?&]id=([^&#]+)/);
  const id = (matchFile && matchFile[1]) || (matchId && matchId[1]);
  if (!id) {
    return texto;
  }

  return 'https://lh3.googleusercontent.com/d/' + encodeURIComponent(id) + '=w2000';
}

const map = new maplibregl.Map({
  container: 'map',
  style: mapStyle,
  center: [-46.634, -23.551],
  zoom: 12
});

map.addControl(new maplibregl.NavigationControl(), 'top-right');

map.on('load', async () => {
  ensureLayers();
  await carregarDados();
  refreshMap();
});

function ensureLayers() {
  map.addSource('areas', { type: 'geojson', data: emptyFeatureCollection() });
  map.addLayer({
    id: 'areas-fill',
    type: 'fill',
    source: 'areas',
    paint: { 'fill-color': '#49a970', 'fill-opacity': 0.24 },
    filter: ['==', ['geometry-type'], 'Polygon']
  });
  map.addLayer({
    id: 'areas-line',
    type: 'line',
    source: 'areas',
    paint: { 'line-color': '#dfffea', 'line-width': 2 },
    filter: ['==', ['geometry-type'], 'Polygon']
  });
  map.addLayer({
    id: 'areas-circle',
    type: 'circle',
    source: 'areas',
    paint: {
      'circle-radius': 8,
      'circle-color': '#49a970',
      'circle-stroke-width': 2,
      'circle-stroke-color': '#dfffea'
    },
    filter: ['==', ['geometry-type'], 'Point']
  });

  map.addSource('arvores', { type: 'geojson', data: emptyFeatureCollection() });
  map.addLayer({
    id: 'arvores-circle',
    type: 'circle',
    source: 'arvores',
    paint: {
      'circle-radius': 5,
      'circle-color': '#c1a969',
      'circle-stroke-width': 1.5,
      'circle-stroke-color': '#fff6df'
    }
  });

  map.on('click', 'areas-fill', (e) => mostrarPopupArea(e.features[0]));
  map.on('click', 'areas-circle', (e) => mostrarPopupArea(e.features[0]));
  map.on('click', 'arvores-circle', (e) => mostrarPopupArvore(e.features[0]));
  ['areas-fill', 'areas-circle', 'arvores-circle'].forEach((layer) => {
    map.on('mouseenter', layer, () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', layer, () => { map.getCanvas().style.cursor = ''; });
  });
}

function emptyFeatureCollection() {
  return { type: 'FeatureCollection', features: [] };
}

async function buscarTudo(url, pageSize = 200) {
  const todos = [];
  let pagina = 0;
  for (;;) {
    const res = await fetch(`${url}?page=${pagina}&size=${pageSize}`);
    if (!res.ok) return null;
    const data = await res.json();
    const itens = Array.isArray(data) ? data : (data.value ?? []);
    todos.push(...itens);
    if (Array.isArray(data) || itens.length < pageSize) return todos;
    pagina++;
  }
}

async function carregarDados() {
  const [carregadasAreas, carregadasArvores] = await Promise.all([
    buscarTudo('/api/areas'),
    buscarTudo('/api/arvores')
  ]);
  areas = carregadasAreas ?? [];
  arvores = carregadasArvores ?? [];

  totalAreasEl.textContent = areas.length;
  totalArvoresEl.textContent = arvores.length;

  renderizarLista();
}

function refreshMap() {
  const areaFeatures = [];
  areas.forEach((area) => {
    if (Array.isArray(area.pontos) && area.pontos.length >= 3) {
      areaFeatures.push({
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            ...area.pontos.map((p) => [p.longitude, p.latitude]),
            [area.pontos[0].longitude, area.pontos[0].latitude]
          ]]
        },
        properties: { id: area.id, nome: area.nome, tipo: area.tipo, status: area.status }
      });
    } else if (area.latitude != null && area.longitude != null) {
      areaFeatures.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [area.longitude, area.latitude] },
        properties: { id: area.id, nome: area.nome, tipo: area.tipo, status: area.status }
      });
    }
  });

  const arvoreFeatures = arvores
    .filter((a) => a.georreferenciada && a.latitude != null && a.longitude != null)
    .map((a) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [a.longitude, a.latitude] },
      properties: {
        id: a.id,
        nome: a.nome || `Árvore #${a.id}`,
        tipoArvore: a.tipoArvore,
        porte: a.porte,
        status: a.status,
        especie: a.especieNomePopular || ''
      }
    }));

  map.getSource('areas')?.setData({ type: 'FeatureCollection', features: areaFeatures });
  map.getSource('arvores')?.setData({ type: 'FeatureCollection', features: arvoreFeatures });
}

function mostrarPopupArea(feature) {
  const p = feature.properties;
  const coordinates = feature.geometry.type === 'Point'
    ? feature.geometry.coordinates
    : feature.geometry.coordinates[0][0];

  new maplibregl.Popup()
    .setLngLat(coordinates)
    .setHTML(`<strong>${p.nome}</strong><br/>Tipo: ${p.tipo}<br/>Status: ${p.status}`)
    .addTo(map);
}

function mostrarPopupArvore(feature) {
  const p = feature.properties;
  new maplibregl.Popup()
    .setLngLat(feature.geometry.coordinates)
    .setHTML(`<strong>${p.nome}</strong><br/>${p.especie ? 'Espécie: ' + p.especie + '<br/>' : ''}Tipo: ${p.tipoArvore} • Porte: ${p.porte}<br/>Status: ${p.status}`)
    .addTo(map);
}

function renderizarLista() {
  areasList.innerHTML = '';

  if (!areas.length) {
    areasList.innerHTML = '<p class="selection-text">Nenhuma área cadastrada ainda.</p>';
    return;
  }

  areas.forEach((area) => {
    const arvoresDaArea = arvores.filter((a) => String(a.areaId) === String(area.id));
    const item = document.createElement('article');
    item.className = 'area-item';
    const fotoHtml = area.fotoUrl
      ? `<div class="area-foto"><img src="${obterUrlImagem(area.fotoUrl)}" alt="${area.nome || 'Foto da área'}" onerror="this.remove();" /></div>`
      : '';
    item.innerHTML = `
      <header>
        <h3>${area.nome}</h3>
        <span>${area.status}</span>
      </header>
      ${fotoHtml}
      <p class="area-description">Tipo: ${area.tipo} • ${arvoresDaArea.length} árvore(s) cadastrada(s)</p>
      <p class="area-description">${area.descricao || ''}</p>
    `;
    item.addEventListener('click', () => {
      const feature = area.pontos && area.pontos.length >= 3
        ? { geometry: { type: 'Polygon', coordinates: [[[area.pontos[0].longitude, area.pontos[0].latitude]]] } }
        : null;
      const coords = area.latitude != null && area.longitude != null
        ? [area.longitude, area.latitude]
        : (area.pontos && area.pontos[0] ? [area.pontos[0].longitude, area.pontos[0].latitude] : null);
      if (coords) {
        map.flyTo({ center: coords, zoom: 17 });
      }
    });
    areasList.appendChild(item);
  });
}

buscaForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const termo = buscaTermoInput.value.trim();
  if (!termo) return;

  buscaResultado.innerHTML = '<p class="selection-text">Buscando...</p>';

  let areasEncontradas;
  if (/^\d+$/.test(termo)) {
    const res = await fetch(`/api/areas/${termo}`);
    if (!res.ok) {
      buscaResultado.innerHTML = `<div class="login-message erro">Nenhuma área encontrada com o ID ${termo}.</div>`;
      return;
    }
    areasEncontradas = [await res.json()];
  } else {
    const termoNorm = normalizarTexto(termo);
    areasEncontradas = areas.filter((area) => normalizarTexto(area.nome).includes(termoNorm));
    if (!areasEncontradas.length) {
      buscaResultado.innerHTML = `<div class="login-message erro">Nenhuma área encontrada com o nome "${termo}".</div>`;
      return;
    }
  }

  buscaResultado.innerHTML = '';
  areasEncontradas.forEach((area) => {
    const arvoresDaArea = arvores.filter((a) => String(a.areaId) === String(area.id));

    const arvoresHtml = arvoresDaArea.length
      ? `<ul class="detalhe-lista">${arvoresDaArea.map((a) => `<li>${a.nome || 'Árvore #' + a.id} — ${a.tipoArvore} / ${a.porte} (${a.status})</li>`).join('')}</ul>`
      : '<p class="area-description">Nenhuma árvore cadastrada nessa área.</p>';

    const item = document.createElement('article');
    item.className = 'area-item';
    const fotoHtml = area.fotoUrl
      ? `<div class="area-foto"><img src="${obterUrlImagem(area.fotoUrl)}" alt="${area.nome || 'Foto da área'}" onerror="this.remove();" /></div>`
      : '';
    item.innerHTML = `
      <header>
        <h3>#${area.id} — ${area.nome}</h3>
        <span>${area.status}</span>
      </header>
      ${fotoHtml}
      <p class="area-description">Tipo: ${area.tipo}</p>
      <p class="area-description">${area.descricao || ''}</p>
      <h4>Árvores nesta área</h4>
      ${arvoresHtml}
    `;
    buscaResultado.appendChild(item);

    if (area.latitude != null && area.longitude != null) {
      map.flyTo({ center: [area.longitude, area.latitude], zoom: 17 });
    } else if (area.pontos && area.pontos[0]) {
      map.flyTo({ center: [area.pontos[0].longitude, area.pontos[0].latitude], zoom: 17 });
    }
  });
});

carregarPlacar();
setInterval(carregarPlacar, 5000);
