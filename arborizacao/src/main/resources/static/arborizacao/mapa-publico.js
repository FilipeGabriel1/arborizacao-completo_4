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

const PLACEHOLDERS_AREAS = {
  'praca central': './img/area-praca-central.svg',
  'bosque teste 2': './img/area-bosque.svg',
  'praca da matriz': './img/area-praca-matriz.svg',
  'praca do livramento': './img/area-praca-livramento.svg',
  'praca duque de caxias': './img/area-praca-duque.svg',
  'praca do leao coroado': './img/area-praca-central.svg',
};

const PLACEHOLDERS_ESPECIES = {
  'ipe-amarelo': './img/especie-ipe-amarelo.svg',
  'quaresmeira': './img/especie-quaresmeira.svg',
  'sibipiruna': './img/especie-sibipiruna.svg',
  'goiabeira': './img/especie-goiabeira.svg',
  'oiti': './img/especie-oiti.svg',
  'ficus': './img/especie-oiti.svg',
  'mangueira': './img/especie-goiabeira.svg',
  'reseda': './img/especie-quaresmeira.svg',
};

function obterPlaceholder(nome, tipo) {
  const mapa = tipo === 'area' ? PLACEHOLDERS_AREAS : PLACEHOLDERS_ESPECIES;
  const chave = (nome || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const fallback = tipo === 'area' ? './img/area-praca-central.svg' : './img/especie-ipe-amarelo.svg';
  return mapa[chave] || fallback;
}

function criarImgCarousel(src, alt, className, placeholder) {
  return `<img class="${className}" src="${src}" alt="${alt}" style="width:100%;height:140px;object-fit:cover;display:block;background:rgba(26,58,26,0.4);" onerror="this.onerror=null;this.style.background='linear-gradient(135deg,#0e1f12,#1a3a1a)';this.src='${placeholder}'" />`;
}

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
      titulo: d.solicitante || 'Solicitante não informado',
      detalhe: `Doação • ${quantidade} muda(s)${d.especieNomePopular ? ' de ' + d.especieNomePopular : ''}${d.descricao ? ' • ' + d.descricao : ''}`
    });
  });

  if (!itens.length) {
    if (placarFeedEl) placarFeedEl.innerHTML = '<p class="placar-bloco-nota">Nenhuma atividade registrada ainda.</p>';
    return;
  }

  itens.sort((a, b) => new Date(b.data || 0) - new Date(a.data || 0));

  if (placarFeedEl) placarFeedEl.innerHTML = '';
  itens.forEach((item, indice) => {
    const elemento = document.createElement('article');
    elemento.className = 'placar-feed-item';
    elemento.style.animationDelay = `${indice * 90}ms`;

    elemento.innerHTML = `
      <div class="placar-feed-icone">${item.tipo === 'plantio' ? '<img class="ico" src="./img/icones/seedling.png" alt="">' : '<img class="ico" src="./img/icones/gift.png" alt="">'}</div>
      <div class="placar-feed-texto">
        <strong>${item.titulo}</strong>
        <span>${item.detalhe}</span>
      </div>
      <time>${formatarData(item.data)}</time>
    `;
    if (placarFeedEl) placarFeedEl.appendChild(elemento);
  });
}

const CORES_DONUT = {
  porte: { PEQUENO: '#49a970', MEDIO: '#2f9e5b', GRANDE: '#1a7a3e' },
  origem: { NATIVA: '#49a970', EXOTICA: '#6aa7dc' }
};

function polarToCartesian(cx, cy, r, angleDeg) {
  const a = (angleDeg - 90) * Math.PI / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function donutSegment(cx, cy, rOuter, rInner, startAngle, endAngle) {
  const sweep = endAngle - startAngle;
  if (sweep <= 0) return '';
  if (sweep >= 359.99) {
    return { full: true, mid: (rOuter + rInner) / 2, thick: rOuter - rInner };
  }
  const large = sweep > 180 ? 1 : 0;
  const o1 = polarToCartesian(cx, cy, rOuter, startAngle);
  const o2 = polarToCartesian(cx, cy, rOuter, endAngle);
  const i1 = polarToCartesian(cx, cy, rInner, endAngle);
  const i2 = polarToCartesian(cx, cy, rInner, startAngle);
  return {
    d: `M ${o1.x} ${o1.y}` +
      ` A ${rOuter} ${rOuter} 0 ${large} 1 ${o2.x} ${o2.y}` +
      ` L ${i1.x} ${i1.y}` +
      ` A ${rInner} ${rInner} 0 ${large} 0 ${i2.x} ${i2.y} Z`
  };
}

function criarDonutChart(containerId, dados, cores) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const itens = (dados || []).filter((d) => d.valor > 0);
  const total = itens.reduce((s, d) => s + d.valor, 0);
  if (total <= 0) {
    container.innerHTML = '<p style="color:#6b7280;font-size:0.85rem;">Sem dados</p>';
    return;
  }

  const cx = 100, cy = 100, rOuter = 90, rInner = 58;
  let paths = '';
  let angle = 0;

  itens.forEach((d) => {
    const slice = (d.valor / total) * 360;
    const cor = cores[d.chave] || '#999';
    const seg = donutSegment(cx, cy, rOuter, rInner, angle, angle + slice);
    if (seg && seg.full) {
      paths += `<circle cx="${cx}" cy="${cy}" r="${seg.mid}" fill="none" stroke="${cor}" stroke-width="${seg.thick}"><title>${d.rotulo}: ${d.valor}</title></circle>`;
    } else if (seg && seg.d) {
      paths += `<path d="${seg.d}" fill="${cor}" stroke="#080e0b" stroke-width="1.5"><title>${d.rotulo}: ${d.valor}</title></path>`;
    }
    angle += slice;
  });

  const legend = itens.map((d) => {
    const cor = cores[d.chave] || '#999';
    const pct = Math.round((d.valor / total) * 100);
    return `<span><i style="background:${cor};"></i>${d.rotulo} (${d.valor} • ${pct}%)</span>`;
  }).join('');

  container.innerHTML =
    '<div class="donut-wrap">' +
    '<div class="donut-svg-box">' +
    `<svg viewBox="0 0 200 200" role="img" aria-label="Gráfico de rosca">${paths}</svg>` +
    '<div class="donut-center">' +
    `<span class="donut-valor">${total}</span>` +
    '<span class="donut-label">Total</span>' +
    '</div>' +
    '</div>' +
    `<div class="chart-legend">${legend}</div>` +
    '</div>';
}

function renderizarGraficos() {
  const porPorte = {};
  const porOrigem = {};

  arvores.forEach((a) => {
    const p = a.porte || 'MEDIO';
    porPorte[p] = (porPorte[p] || 0) + 1;
    const nativa = a.tipoArvore === 'NATIVA' ? 'NATIVA' : 'EXOTICA';
    porOrigem[nativa] = (porOrigem[nativa] || 0) + 1;
  });

  criarDonutChart('chartPorte', [
    { chave: 'PEQUENO', rotulo: 'Pequeno', valor: porPorte.PEQUENO || 0 },
    { chave: 'MEDIO', rotulo: 'Médio', valor: porPorte.MEDIO || 0 },
    { chave: 'GRANDE', rotulo: 'Grande', valor: porPorte.GRANDE || 0 }
  ], CORES_DONUT.porte);

  criarDonutChart('chartOrigem', [
    { chave: 'NATIVA', rotulo: 'Nativas', valor: porOrigem.NATIVA || 0 },
    { chave: 'EXOTICA', rotulo: 'Exóticas', valor: porOrigem.EXOTICA || 0 }
  ], CORES_DONUT.origem);
}

function renderizarPlacar(placar) {
  animarValor(placarPlantadasEl, placar.totalArvores);
  animarValor(placarDoadasEl, placar.totalDoadas);
  animarValor(placarAreasEl, placar.totalAreas);
  animarValor(placarEspeciesEl, placar.totalEspecies);
  if (placarAtualizadoEmEl) placarAtualizadoEmEl.textContent = new Date(placar.atualizadoEm).toLocaleTimeString('pt-BR');

  const placarDoacoesEl = document.getElementById('placarDoacoes');
  const placarAtivoEl = document.getElementById('placarAtivo');
  const listaAtividadesEl = document.getElementById('listaAtividades');

  if (placarDoacoesEl) animarValor(placarDoacoesEl, placar.totalDoacoes);
  if (placarAtivoEl) {
    const arvoresPorStatus = placar.arvoresPorStatus || {};
    const ativas = arvoresPorStatus['ATIVA'] || 0;
    animarValor(placarAtivoEl, ativas);
  }

  // Lista de atividades
  if (listaAtividadesEl) {
    const itens = [];

    if (placar.arvoresRecentes && placar.arvoresRecentes.length > 0) {
      placar.arvoresRecentes.slice(0, 3).forEach((a) => {
        itens.push({
          tipo: 'plantio',
          data: a.dataPlantio || a.criadoEm,
          titulo: a.especieNomePopular || a.nome || 'Árvore registrada',
          detalhe: `Árvore plantada${a.porte ? ' • porte ' + (rotulosPortePlacar[a.porte] || a.porte) : ''}`
        });
      });
    }

    if (placar.doacoesRecentes && placar.doacoesRecentes.length > 0) {
      placar.doacoesRecentes.slice(0, 3).forEach((d) => {
        const quantidade = d.quantidade ? formatarNumero(d.quantidade) : '1';
        itens.push({
          tipo: 'doacao',
          data: d.dataDoacao,
          titulo: d.solicitante || 'Solicitante não informado',
          detalhe: `Doação • ${quantidade} muda(s)${d.especieNomePopular ? ' de ' + d.especieNomePopular : ''}`
        });
      });
    }

    itens.sort((a, b) => new Date(b.data || 0) - new Date(a.data || 0));

    if (itens.length > 0) {
      listaAtividadesEl.innerHTML = itens.slice(0, 5).map(item => `
        <div class="atividade-item">
          <span class="atividade-dot"></span>
          <div>
            <p>${item.titulo}</p>
            <small>${formatarData(item.data)}</small>
          </div>
        </div>
      `).join('');
    } else {
      listaAtividadesEl.innerHTML = '<div class="atividade-item"><span class="atividade-dot"></span><div><p>Nenhuma atividade registrada ainda</p></div></div>';
    }
  }

  const totalPlantadas = Number(placar.totalArvores || 0);
  const totalDoadas = Number(placar.totalDoadas || 0);
  const percentual = totalPlantadas > 0 ? Math.min((totalDoadas / totalPlantadas) * 100, 100) : 0;
  
  if (barraDoadasEl) barraDoadasEl.style.width = `${percentual}%`;
  if (placarPorcentagemEl) placarPorcentagemEl.innerHTML = `<strong>${percentual.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}%</strong> das plantadas vieram de doações`;

  if (placarPorteEl) renderizarBarras(placarPorteEl, placar.arvoresPorPorte, rotulosPortePlacar, '#49a970');
  if (placarOrigemEl) renderizarBarras(placarOrigemEl, placar.arvoresPorOrigem, rotulosOrigemPlacar, '#6aa7c1');
  if (placarFeedEl) renderizarFeed(placar);
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
  center: [-35.291, -8.119],
  zoom: 12
});

map.addControl(new maplibregl.NavigationControl(), 'top-right');

let markers = [];

map.on('load', async () => {
  try {
    ensureLayers();
  } catch (err) {
    console.error('[DEBUG] ensureLayers falhou:', err);
  }
  try {
    await carregarDados();
  } catch (err) {
    console.error('[DEBUG] carregarDados falhou:', err);
  }
  try {
    refreshMap();
  } catch (err) {
    console.error('[DEBUG] refreshMap falhou:', err);
  }
  try {
    setupLayerToggles();
  } catch (err) {
    console.error('[DEBUG] setupLayerToggles falhou:', err);
  }
});

function alternarVisibilidade(nomesCamadas, visivel) {
  nomesCamadas.forEach((nome) => {
    if (!map.getLayer(nome)) return;
    map.setLayoutProperty(nome, 'visibility', visivel ? 'visible' : 'none');
  });
}

function setupLayerToggles() {
  const camadaArvores = document.getElementById('camadaArvores');
  const camadaAreas = document.getElementById('camadaAreas');
  const camadaPontos = document.getElementById('camadaPontos');
  const camadaPracas = document.getElementById('camadaPracas');

  if (camadaArvores) {
    camadaArvores.addEventListener('change', () => {
      alternarVisibilidade(['arvores-clusters', 'arvores-cluster-count', 'arvores-circle'], camadaArvores.checked);
    });
  }

  if (camadaAreas) {
    camadaAreas.addEventListener('change', () => {
      alternarVisibilidade(['areas-fill', 'areas-line'], camadaAreas.checked);
    });
  }

  if (camadaPontos) {
    camadaPontos.addEventListener('change', () => {
      alternarVisibilidade(['areas-circle'], camadaPontos.checked);
    });
  }

  if (camadaPracas) {
    camadaPracas.addEventListener('change', () => {
      const visivel = camadaPracas.checked;
      alternarVisibilidade(['areas-fill', 'areas-line'], visivel || (camadaAreas && camadaAreas.checked));
      if (camadaAreas && !camadaAreas.checked) {
        alternarVisibilidade(['areas-fill', 'areas-line'], false);
      }
    });
  }
}

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

  map.addSource('arvores', {
    type: 'geojson',
    data: emptyFeatureCollection(),
    cluster: true,
    clusterMaxZoom: 10,
    clusterRadius: 30
  });
  
  map.addLayer({
    id: 'arvores-clusters',
    type: 'circle',
    source: 'arvores',
    filter: ['has', 'point_count'],
    paint: {
      'circle-radius': ['step', ['get', 'point_count'], 20, 10, 30, 50, 40],
      'circle-color': '#22c55e',
      'circle-stroke-width': 3,
      'circle-stroke-color': 'rgba(255,255,255,0.3)'
    }
  });

  map.addLayer({
    id: 'arvores-cluster-count',
    type: 'symbol',
    source: 'arvores',
    filter: ['has', 'point_count'],
    layout: {
      'text-field': '{point_count_abbreviated}',
      'text-font': ['Open Sans Bold'],
      'text-size': 14
    },
    paint: {
      'text-color': '#ffffff'
    }
  });

  map.addLayer({
    id: 'arvores-circle',
    type: 'circle',
    source: 'arvores',
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-radius': 6,
      'circle-color': '#c1a969',
      'circle-stroke-width': 2,
      'circle-stroke-color': '#fff6df'
    }
  });

  map.on('click', 'arvores-clusters', (e) => {
    const features = map.queryRenderedFeatures(e.point, { layers: ['arvores-clusters'] });
    const clusterId = features[0].properties.cluster_id;
    const source = map.getSource('arvores');
    source.getClusterExpansionZoom(clusterId, (err, zoom) => {
      if (err) return;
      map.easeTo({ center: features[0].geometry.coordinates, zoom: zoom });
    });
  });

  map.on('click', 'areas-fill', (e) => mostrarPopupArea(e.features[0]));
  map.on('click', 'areas-circle', (e) => mostrarPopupArea(e.features[0]));
  map.on('click', 'arvores-circle', (e) => mostrarPopupArvore(e.features[0]));
  ['areas-fill', 'areas-circle', 'arvores-circle', 'arvores-clusters'].forEach((layer) => {
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
    const res = await fetch(`${url}?page=${pagina}&size=${pageSize}`, { credentials: 'same-origin' });
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

  try {
    renderizarGraficos();
  } catch (err) {
    console.error('[DEBUG] renderizarGraficos falhou:', err);
  }
  try {
    renderizarLista();
  } catch (err) {
    console.error('[DEBUG] renderizarLista falhou:', err);
  }
  try {
    inicializarCarousels();
  } catch (err) {
    console.error('[DEBUG] inicializarCarousels falhou:', err);
  }
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
        properties: { id: area.id, nome: area.nome, tipo: area.tipo, status: area.status, poligono: true }
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
        especie: a.especieNomePopular || '',
        fotoUrl: a.fotoUrl || ''
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

  const ehPoligono = p.poligono === true || p.poligono === 'true' || p.poligono === 1 || p.poligono === '1';
  const selo = ehPoligono ? '<span class="badge-arborizada">Área arborizada</span>' : '';

  new maplibregl.Popup()
    .setLngLat(coordinates)
    .setHTML(`<strong>${p.nome}</strong> ${selo}<br/>Tipo: ${p.tipo}<br/>Status: ${p.status}`)
    .addTo(map);
}

function mostrarPopupArvore(feature) {
  const p = feature.properties;
  fetch('/api/arvores/' + p.id, { credentials: 'same-origin' })
    .then(r => r.ok ? r.json() : null)
    .then(arvore => {
      if (window.abrirTelaArvore) abrirTelaArvore(arvore, p);
      else if (window.montarPainelArvore) montarPainelArvore(arvore, p);
    })
    .catch(() => {
      if (window.abrirTelaArvore) abrirTelaArvore(null, p);
      else if (window.montarPainelArvore) montarPainelArvore(null, p);
    });
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

/* CAROUSELS */
const carouselState = {};

function inicializarCarousel(id, items) {
  const track = document.getElementById(id + '-track');
  const dotsContainer = document.getElementById(id + '-dots');
  if (!track || !items.length) {
    return;
  }

  function getVisibleCount() {
    const w = track.parentElement?.offsetWidth || window.innerWidth;
    if (w <= 600) return 1;
    if (w <= 900) return 2;
    return 3;
  }

  function getTotalPages() {
    return Math.ceil(items.length / getVisibleCount());
  }

  let currentPage = 0;

  function renderizar() {
    track.innerHTML = items.map(item => {
      if (id === 'areas-carousel') {
        const arvoresCount = arvores.filter(a => String(a.areaId) === String(item.id)).length;
        const placeholder = obterPlaceholder(item.nome, 'area');
        const todasFotos = fotosDaArea(item);
        const fotoCard = todasFotos.length ? todasFotos[0] : placeholder;
        return `
          <a href="./area-det.html?id=${item.id}" class="carousel-card" style="text-decoration:none;color:inherit">
            ${criarImgCarousel(fotoCard, item.nome, 'carousel-card-img', placeholder)}
            <div class="carousel-card-body">
              <p class="carousel-card-nome">${item.nome}</p>
              <p class="carousel-card-meta">${rotulosTipoArea[item.tipo] || item.tipo || ''} • ${item.bairro || ''}</p>
              <div class="carousel-card-count">${arvoresCount} árvores</div>
            </div>
            <div class="carousel-card-footer">
              <span class="carousel-card-btn">Ver detalhes</span>
            </div>
          </a>
        `;
      } else {
        const placeholder = obterPlaceholder(item.nomePopular, 'especie');
        const todasFotos = [];
        if (item.fotoUrl) todasFotos.push(obterUrlImagem(item.fotoUrl));
        (item.fotos || []).forEach(f => { const u = typeof f === 'string' ? f : f.url; if (u) todasFotos.push(obterUrlImagem(u)); });
        const fotoCard = todasFotos.length ? todasFotos[0] : placeholder;
        const badgeClass = item.origem === 'NATIVA' ? 'badge-nativa' : 'badge-exotica';
        return `
          <a href="./especie-det.html?id=${item.id}" class="carousel-card" style="text-decoration:none;color:inherit">
            ${criarImgCarousel(fotoCard, item.nomePopular, 'carousel-card-img', placeholder)}
            <div class="carousel-card-body">
              <p class="carousel-card-nome">${item.nomePopular}</p>
              <p class="carousel-card-meta">${item.nomeCientifico || ''}</p>
              <span class="carousel-card-badge ${badgeClass}">${item.origem || ''}</span>
            </div>
          </a>
        `;
      }
    }).join('');

    if (dotsContainer) {
      dotsContainer.innerHTML = '';
      const tp = getTotalPages();
      for (let i = 0; i < tp; i++) {
        const dot = document.createElement('span');
        dot.className = 'carousel-dot' + (i === 0 ? ' ativo' : '');
        dot.addEventListener('click', () => {
          currentPage = i;
          atualizar();
        });
        dotsContainer.appendChild(dot);
      }
    }
  }

  function atualizar() {
    const cards = track.querySelectorAll('.carousel-card');
    const visibleCount = getVisibleCount();
    const idx = Math.min(currentPage * visibleCount, cards.length - 1);
    if (cards[idx]) {
      cards[idx].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    }

    if (dotsContainer) {
      dotsContainer.querySelectorAll('.carousel-dot').forEach((dot, i) => {
        dot.classList.toggle('ativo', i === currentPage);
      });
    }
  }

  renderizar();

  const prevBtn = document.querySelector(`[data-carousel="${id}"].carousel-nav-prev`);
  const nextBtn = document.querySelector(`[data-carousel="${id}"].carousel-nav-next`);

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      currentPage = Math.max(0, currentPage - 1);
      atualizar();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      currentPage = Math.min(getTotalPages() - 1, currentPage + 1);
      atualizar();
    });
  }

  carouselState[id] = { renderizar, atualizar };
}

async function carregarEspecies() {
  try {
    const res = await fetch('/api/especies?page=0&size=200');
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : (data.value ?? []);
  } catch {
    return [];
  }
}

async function inicializarCarousels() {
  try {
    const especies = await carregarEspecies();
    inicializarCarousel('areas-carousel', areas);
    inicializarCarousel('especies-carousel', especies);
  } catch (err) {
    console.error('[DEBUG] Erro ao inicializar carousels:', err);
  }
}

function obterPlaceholderEspecie(nome) {
  const n = (nome || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (n.includes('ipe') || n.includes('ipê')) return './img/especie-ipe-amarelo.svg';
  if (n.includes('oiti')) return './img/especie-oiti.svg';
  if (n.includes('quaresmeira')) return './img/especie-quaresmeira.svg';
  if (n.includes('sibipiruna')) return './img/especie-sibipiruna.svg';
  if (n.includes('goiabeira')) return './img/especie-goiabeira.svg';
  return './img/especie-ipe-amarelo.svg';
}

async function abrirRelatorioSementeira() {
  document.getElementById('relatorioModal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  const container = document.getElementById('relatorioEspecies');
  try {
    const res = await fetch('/api/especies?page=0&size=200');
    if (!res.ok) throw new Error();
    const data = await res.json();
    const especies = Array.isArray(data) ? data : (data.value ?? []);

    if (!especies.length) {
      container.innerHTML = '<p style="color:var(--muted);font-size:0.85rem;">Nenhuma espécie cadastrada.</p>';
      return;
    }

    container.innerHTML = especies.map(esp => {
      const fotoUrl = esp.fotoUrl ? obterUrlImagem(esp.fotoUrl) : null;
      const fallback = obterPlaceholderEspecie(esp.nomePopular);
      const imgTag = fotoUrl
        ? `<img class="relatorio-especie-img" data-src="${fotoUrl}" data-fallback="${fallback}" alt="${esp.nomePopular}" />`
        : `<img class="relatorio-especie-img" src="${fallback}" alt="${esp.nomePopular}" />`;
      return `
        <div class="relatorio-especie">
          ${imgTag}
          <div class="relatorio-especie-info">
            <strong>${esp.nomePopular || 'Sem nome'}</strong>
            <span>${esp.nomeCientifico || ''}${esp.familia ? ' • Família: ' + esp.familia : ''}</span>
            <p>${esp.observacoes || esp.indicacaoPlantio || ''}</p>
          </div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.relatorio-especie-img[data-src]').forEach(img => {
      const src = img.dataset.src;
      const fallback = img.dataset.fallback;
      const loader = new Image();
      let resolved = false;
      loader.onload = () => { if (!resolved) { resolved = true; img.src = src; } };
      loader.onerror = () => { if (!resolved) { resolved = true; img.src = fallback; } };
      loader.src = src;
      setTimeout(() => { if (!resolved) { resolved = true; img.src = fallback; } }, 5000);
    });
  } catch {
    container.innerHTML = '<p style="color:var(--muted);font-size:0.85rem;">Erro ao carregar espécies.</p>';
  }
}

function fecharRelatorioSementeira() {
  document.getElementById('relatorioModal').classList.add('hidden');
  document.body.style.overflow = '';
}
