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

const rotulosTipoArea = {
  PRACA: 'Praça',
  PARQUE: 'Parque',
  BOSQUE: 'Bosque',
  RUA: 'Rua',
  AVENIDA: 'Avenida',
  OUTRA: 'Outra'
};

const THUMB_PLACEHOLDER = `
  <svg viewBox="0 0 96 72" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Sem foto" preserveAspectRatio="xMidYMid slice">
    <rect width="96" height="72" fill="#0e2117"/>
    <circle cx="48" cy="30" r="16" fill="#2e7d4f"/>
    <circle cx="37" cy="37" r="11" fill="#35915b"/>
    <circle cx="59" cy="37" r="11" fill="#276b44"/>
    <rect x="45" y="40" width="6" height="17" rx="2.5" fill="#8a5a33"/>
    <path d="M18 62h60" stroke="#1c4a30" stroke-width="3" stroke-linecap="round"/>
    <circle cx="74" cy="16" r="2" fill="#49a970"/>
    <circle cx="22" cy="20" r="1.5" fill="#49a970"/>
  </svg>`;

function thumbErro(img) {
  if (img.dataset.fallback) return;
  img.dataset.fallback = '1';
  img.insertAdjacentHTML('afterend', THUMB_PLACEHOLDER);
  img.remove();
}

function fotosDaArea(area) {
  const urls = [];
  if (area.fotoUrl) urls.push(obterUrlImagem(area.fotoUrl));
  (area.fotos || []).forEach((foto) => {
    const url = typeof foto === 'string' ? foto : foto.url;
    if (url) urls.push(obterUrlImagem(url));
  });
  return [...new Set(urls)];
}

const galeriaEl = document.getElementById('galeriaFotos');
const galeriaImg = document.getElementById('galeriaImg');
const galeriaTitulo = document.getElementById('galeriaTitulo');
const galeriaContador = document.getElementById('galeriaContador');
let galeriaUrls = [];
let galeriaIndice = 0;

function mostrarFotoGaleria(passo = 0) {
  if (!galeriaUrls.length) return;
  galeriaIndice = (galeriaIndice + passo + galeriaUrls.length) % galeriaUrls.length;
  galeriaImg.src = galeriaUrls[galeriaIndice];
  galeriaContador.textContent = `${galeriaIndice + 1} de ${galeriaUrls.length}`;
}

function abrirGaleria(urls, titulo) {
  if (!urls || !urls.length) return;
  galeriaUrls = urls;
  galeriaIndice = 0;
  galeriaTitulo.textContent = titulo || 'Fotos da área';
  galeriaEl.classList.remove('hidden');
  galeriaEl.setAttribute('aria-hidden', 'false');
  mostrarFotoGaleria();
}

function fecharGaleria() {
  galeriaEl.classList.add('hidden');
  galeriaEl.setAttribute('aria-hidden', 'true');
  galeriaImg.src = '';
}

document.getElementById('galeriaFechar').addEventListener('click', fecharGaleria);
document.querySelector('.galeria-backdrop').addEventListener('click', fecharGaleria);
document.getElementById('galeriaAnterior').addEventListener('click', () => mostrarFotoGaleria(-1));
document.getElementById('galeriaProxima').addEventListener('click', () => mostrarFotoGaleria(1));
document.addEventListener('keydown', (event) => {
  if (galeriaEl.classList.contains('hidden')) return;
  if (event.key === 'Escape') fecharGaleria();
  if (event.key === 'ArrowLeft') mostrarFotoGaleria(-1);
  if (event.key === 'ArrowRight') mostrarFotoGaleria(1);
});

function verAreaNoMapa(area) {
  const coords = area.latitude != null && area.longitude != null
    ? [area.longitude, area.latitude]
    : (area.pontos && area.pontos[0] ? [area.pontos[0].longitude, area.pontos[0].latitude] : null);
  if (!coords) return;
  map.flyTo({ center: coords, zoom: 17 });
  document.getElementById('map').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function criarAcoesArea(area) {
  const fotos = fotosDaArea(area);
  return `
    <div class="area-acoes">
      <button type="button" class="ghost-button area-ver-mapa">Ver no mapa</button>
      ${fotos.length ? `<button type="button" class="ghost-button area-ver-fotos">Ver fotos</button>` : ''}
    </div>
  `;
}

function ativarAcoesArea(item, area) {
  const botaoMapa = item.querySelector('.area-ver-mapa');
  const temCoords = (area.latitude != null && area.longitude != null) || (area.pontos && area.pontos[0]);
  if (botaoMapa && temCoords) {
    botaoMapa.addEventListener('click', () => verAreaNoMapa(area));
  } else if (botaoMapa) {
    botaoMapa.disabled = true;
    botaoMapa.style.opacity = '0.45';
  }

  const botaoFotos = item.querySelector('.area-ver-fotos');
  if (botaoFotos) {
    botaoFotos.addEventListener('click', () => abrirGaleria(fotosDaArea(area), `Fotos • ${area.nome || 'Área #' + area.id}`));
  }
}

function criarMediaArea(area, arvoresCount) {
  const tipo = rotulosTipoArea[area.tipo] || area.tipo || '—';
  const thumb = area.fotoUrl
    ? `<div class="area-thumb"><img src="${obterUrlImagem(area.fotoUrl)}" alt="${area.nome || 'Foto da área'}" loading="lazy" onerror="thumbErro(this)" /></div>`
    : `<div class="area-thumb">${THUMB_PLACEHOLDER}</div>`;

  return `
    <div class="area-media">
      ${thumb}
      <div class="area-lado">
        <div class="area-fatos">
          <p><strong>Tipo</strong>${tipo}</p>
          <p><strong>Árvores</strong>${formatarNumero(arvoresCount || 0)}</p>
          <p><strong>Status</strong>${rotulosStatusPlacar[area.status] || area.status || '—'}</p>
        </div>
        ${area.descricao ? `<p class="area-description area-descricao-curta">${area.descricao}</p>` : ''}
      </div>
    </div>
  `;
}

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

function renderizarFeed(placar) {
  const itens = [];

  (placar.arvoresRecentes || []).forEach((a) => {
    itens.push({
      tipo: 'plantio',
      data: a.dataPlantio || a.criadoEm,
      titulo: a.especieNomePopular || a.nome || 'Espécie não informada',
      detalhe: `Árvore plantada${a.porte ? ' • porte ' + (rotulosPortePlacar[a.porte] || a.porte) : ''}${a.origem ? ' • ' + (rotulosOrigemPlacar[a.origem] || a.origem) : ''}`
    });
  });

  (placar.doacoesRecentes || []).forEach((d) => {
    const quantidade = d.quantidade ? formatarNumero(d.quantidade) : '1';
    itens.push({
      tipo: 'doacao',
      data: d.dataDoacao,
      titulo: d.solicitante || 'Doador não informado',
      detalhe: `Doação • ${quantidade} muda(s)${d.especieNomePopular ? ' de ' + d.especieNomePopular : ''}${d.descricao ? ' • ' + d.descricao : ''}`
    });
  });

  if (!itens.length) {
    placarFeedEl.innerHTML = '<p class="placar-bloco-nota">Nenhuma atividade registrada ainda.</p>';
    return;
  }

  itens.sort((a, b) => new Date(b.data || 0) - new Date(a.data || 0));

  placarFeedEl.innerHTML = '';
  itens.forEach((item, indice) => {
    const elemento = document.createElement('article');
    elemento.className = 'placar-feed-item';
    elemento.style.animationDelay = `${indice * 90}ms`;

    elemento.innerHTML = `
      <div class="placar-feed-icone">${item.tipo === 'plantio' ? '🌱' : '🎁'}</div>
      <div class="placar-feed-texto">
        <strong>${item.titulo}</strong>
        <span>${item.detalhe}</span>
      </div>
      <time>${formatarData(item.data)}</time>
    `;
    placarFeedEl.appendChild(elemento);
  });
}

function renderizarPlacar(placar) {
  animarValor(placarPlantadasEl, placar.totalArvores);
  animarValor(placarDoadasEl, placar.totalDoadas);
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
  renderizarFeed(placar);
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
    const fotoHtml = criarMediaArea(area, arvoresDaArea.length);
    item.innerHTML = `
      <header>
        <h3>${area.nome}</h3>
        <span>${rotulosStatusPlacar[area.status] || area.status}</span>
      </header>
      ${fotoHtml}
      ${criarAcoesArea(area)}
    `;
    ativarAcoesArea(item, area);
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
    const fotoHtml = criarMediaArea(area, arvoresDaArea.length);
    item.innerHTML = `
      <header>
        <h3>#${area.id} — ${area.nome}</h3>
        <span>${rotulosStatusPlacar[area.status] || area.status}</span>
      </header>
      ${fotoHtml}
      ${criarAcoesArea(area)}
      <h4>Árvores nesta área</h4>
      ${arvoresHtml}
    `;
    ativarAcoesArea(item, area);
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
