const areasGrid = document.getElementById('areasGrid');
const areasVazio = document.getElementById('areasVazio');
const totalAreasEl = document.getElementById('totalAreas');
const totalArvoresEl = document.getElementById('totalArvores');
const buscaForm = document.getElementById('buscaForm');
const buscaTermoInput = document.getElementById('buscaTermo');
const galeriaModal = document.getElementById('galeriaModal');
const galeriaImg = document.getElementById('galeriaImg');
const galeriaLegenda = document.getElementById('galeriaLegenda');
const galeriaFecharBtn = document.getElementById('galeriaFechar');
const galeriaAnteriorBtn = document.getElementById('galeriaAnterior');
const galeriaProximaBtn = document.getElementById('galeriaProxima');

const rotulosTipoArea = {
  PRACA: 'Praça',
  BOSQUE: 'Bosque',
  MATA: 'Mata',
  PARQUE: 'Parque',
  OUTRO: 'Outro'
};

const placeholders = {
  praca: './img/area-praca-central.svg',
  bosque: './img/area-bosque.svg',
  mata: './img/area-bosque.svg',
  parque: './img/area-praca-central.svg',
  outro: './img/area-praca-central.svg',
  specie: './img/area-praca-central.svg'
};

let areas = [];
let arvores = [];
let galeriaUrls = [];
let galeriaIndice = 0;

function normalizarTexto(texto) {
  return (texto || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function obterPlaceholder(nome, tipo) {
  const n = normalizarTexto(nome || '');
  if (n.includes('praca') || n.includes('praça')) return placeholders.praca;
  if (n.includes('bosque')) return placeholders.bosque;
  if (n.includes('mata')) return placeholders.mata;
  if (n.includes('parque')) return placeholders.parque;
  return placeholders[tipo] || placeholders.specie;
}

function obterUrlImagem(url) {
  const texto = (url || '').toString().trim();
  if (!texto || !/drive\.google\.com/.test(texto)) return texto;

  const matchFile = texto.match(/\/file\/d\/([^/?#]+)/);
  const matchId = texto.match(/[?&]id=([^&#]+)/);
  const id = (matchFile && matchFile[1]) || (matchId && matchId[1]);
  if (!id) return texto;

  return 'https://lh3.googleusercontent.com/d/' + encodeURIComponent(id) + '=w2000';
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

async function buscarTudo(url) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Erro ao buscar ${url}: ${resp.status}`);
  const data = await resp.json();
  return data.content || data.value || data;
}

function renderizar(areasFiltradas) {
  const lista = areasFiltradas || areas;
  totalAreasEl.textContent = areas.length;
  totalArvoresEl.textContent = arvores.length;

  if (!lista.length) {
    areasGrid.innerHTML = '';
    areasVazio.classList.remove('hidden');
    return;
  }
  areasVazio.classList.add('hidden');

  areasGrid.innerHTML = lista.map(area => {
    const arvoresCount = arvores.filter(a => String(a.areaId) === String(area.id)).length;
    const placeholder = obterPlaceholder(area.nome, 'area');
    const todasFotos = fotosDaArea(area);
    const fotoCard = todasFotos.length ? todasFotos[0] : placeholder;

    return `
      <div class="area-card">
        <img class="area-card-img" src="${fotoCard}" alt="${area.nome}" onerror="this.onerror=null;this.src='${placeholder}'" />
        <div class="area-card-body">
          <p class="area-card-nome">${area.nome}</p>
          <p class="area-card-meta">${rotulosTipoArea[area.tipo] || area.tipo || ''} • ${arvoresCount} árvores</p>
          <p class="area-card-desc">${area.descricao || ''}</p>
        </div>
        <div class="area-card-footer">
          ${todasFotos.length > 1 ? `<button class="area-card-btn" onclick='abrirGaleria(${JSON.stringify(todasFotos).replace(/'/g, "&#39;")}, "Fotos • ${area.nome.replace(/'/g, "\\'")}")'>Ver fotos (${todasFotos.length})</button>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function abrirGaleria(urls, titulo) {
  galeriaUrls = urls;
  galeriaIndice = 0;
  galeriaLegenda.textContent = titulo || '';
  galeriaModal.classList.remove('hidden');
  mostrarFotoGaleria();
}

function mostrarFotoGaleria(passo = 0) {
  galeriaIndice += passo;
  if (galeriaIndice < 0) galeriaIndice = galeriaUrls.length - 1;
  if (galeriaIndice >= galeriaUrls.length) galeriaIndice = 0;
  galeriaImg.src = galeriaUrls[galeriaIndice];
}

galeriaFecharBtn.addEventListener('click', () => galeriaModal.classList.add('hidden'));
galeriaAnteriorBtn.addEventListener('click', () => mostrarFotoGaleria(-1));
galeriaProximaBtn.addEventListener('click', () => mostrarFotoGaleria(1));
galeriaModal.addEventListener('click', (e) => {
  if (e.target === galeriaModal) galeriaModal.classList.add('hidden');
});

buscaForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const termo = normalizarTexto(buscaTermoInput.value);
  if (!termo) {
    renderizar();
    return;
  }
  const filtradas = areas.filter(a => normalizarTexto(a.nome).includes(termo) || normalizarTexto(a.descricao).includes(termo));
  renderizar(filtradas);
});

async function carregarDados() {
  const [carregadasAreas, carregadasArvores] = await Promise.all([
    buscarTudo('/api/areas'),
    buscarTudo('/api/arvores')
  ]);
  areas = carregadasAreas ?? [];
  arvores = carregadasArvores ?? [];
  renderizar();
}

carregarDados();
