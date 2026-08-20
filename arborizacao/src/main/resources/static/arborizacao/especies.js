const apiBase = '/api/especies';

const form = document.getElementById('especieForm');
const nomePopularInput = document.getElementById('nomePopular');
const nomeCientificoInput = document.getElementById('nomeCientifico');
const familiaInput = document.getElementById('familia');
const portePadraoInput = document.getElementById('portePadrao');
const observacoesInput = document.getElementById('observacoes');
const indicacaoPlantioInput = document.getElementById('indicacaoPlantio');
const fotoUrlInput = document.getElementById('fotoUrl');
const fotosContainer = document.getElementById('fotosContainer');
const addFotoBtn = document.getElementById('addFotoBtn');
const especiesList = document.getElementById('especiesList');
const formTitle = document.getElementById('formTitle');
const formMessage = document.getElementById('formMessage');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const buscaForm = document.getElementById('buscaForm');
const buscaTermoInput = document.getElementById('buscaTermo');
const buscaResultado = document.getElementById('buscaResultado');

let editingId = null;
let especies = [];

function normalizarTexto(texto) {
  return (texto || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

buscaForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const termo = buscaTermoInput.value.trim();
  if (!termo) return;

  buscaResultado.innerHTML = '<p class="area-description">Buscando...</p>';

  if (/^\d+$/.test(termo)) {
    const res = await fetch(`${apiBase}/${termo}`);
    if (!res.ok) {
      buscaResultado.innerHTML = `<div class="login-message erro">Nenhuma espécie encontrada com o ID ${termo}.</div>`;
      return;
    }
    const especie = await res.json();
    renderizarCardsEncontrados([especie], buscaResultado);
    return;
  }

  const termoNorm = normalizarTexto(termo);
  const encontradas = especies.filter((especie) =>
    normalizarTexto(especie.nomePopular).includes(termoNorm)
    || normalizarTexto(especie.nomeCientifico).includes(termoNorm));
  if (!encontradas.length) {
    buscaResultado.innerHTML = `<div class="login-message erro">Nenhuma espécie encontrada com o nome "${termo}".</div>`;
    return;
  }
  renderizarCardsEncontrados(encontradas, buscaResultado);
});

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

  return 'https://lh3.googleusercontent.com/d/' + encodeURIComponent(id) + '=w800';
}

function montarFotosThumbs(especie) {
  const fotos = [];
  if (especie.fotoUrl) {
    fotos.push(obterUrlImagem(especie.fotoUrl));
  }
  (especie.fotos || []).forEach((f) => {
    if (f.url) fotos.push(obterUrlImagem(f.url));
  });
  if (!fotos.length) return '';

  const thumbs = fotos
    .map((url) => `<a href="${url}" target="_blank" rel="noreferrer"><img src="${url}" alt="Foto da espécie" loading="lazy" /></a>`)
    .join('');
  return `<div class="area-foto-grupo">${thumbs}</div>`;
}

function adicionarLinhaFoto(url, descricao) {
  const linha = document.createElement('div');
  linha.className = 'foto-linha';
  linha.innerHTML = `
    <input type="text" class="foto-url-input" placeholder="https://... (link da imagem)" value="${(url || '').replace(/"/g, '&quot;')}" />
    <input type="text" class="foto-descricao-input" placeholder="Descrição (opcional)" value="${(descricao || '').replace(/"/g, '&quot;')}" />
    <button type="button" class="ghost-button" title="Remover foto">✕</button>
  `;
  linha.querySelector('button').addEventListener('click', () => linha.remove());
  fotosContainer.appendChild(linha);
}

function limparLinhasFoto() {
  fotosContainer.innerHTML = '';
}

function coletarFotosExtras() {
  const fotos = [];
  fotosContainer.querySelectorAll('.foto-linha').forEach((linha) => {
    const url = linha.querySelector('.foto-url-input').value.trim();
    if (!url) return;
    const descricao = linha.querySelector('.foto-descricao-input').value.trim();
    fotos.push({ url, descricao: descricao || null });
  });
  return fotos;
}

function renderizarCardsEncontrados(lista, container) {
  if (!lista.length) {
    container.innerHTML = '<p class="area-description">Nenhuma espécie encontrada.</p>';
    return;
  }

  container.innerHTML = '';
  lista.forEach((especie) => {
    const item = document.createElement('article');
    item.className = 'area-item';
    item.innerHTML = `
      <header>
        <h3>#${especie.id} — ${especie.nomePopular}</h3>
        <span>${especie.portePadrao || ''}</span>
      </header>
      ${montarFotosThumbs(especie)}
      <p class="area-description">${especie.nomeCientifico || ''}${especie.familia ? ' • ' + especie.familia : ''}</p>
      <p class="area-description">${especie.observacoes || ''}</p>
      <p class="area-description"><strong>Indicação para plantio:</strong> ${especie.indicacaoPlantio || 'Não informada'}</p>
      <div class="item-actions">
        <button type="button" data-action="editar">Editar esta espécie</button>
      </div>
    `;
    item.querySelector('[data-action="editar"]').addEventListener('click', () => {
      iniciarEdicao(especie);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    container.appendChild(item);
  });
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

async function carregar() {
  const itens = await buscarTudo(apiBase);
  if (itens === null) return;
  especies = itens;
  renderizar(especies);
}

function renderizar(especies) {
  especiesList.innerHTML = '';

  especies.forEach((especie) => {
    const item = document.createElement('article');
    item.className = 'area-item';
    item.innerHTML = `
      <header>
        <h3>${especie.nomePopular}</h3>
        <span>${especie.portePadrao || ''}</span>
      </header>
      ${montarFotosThumbs(especie)}
      <p class="area-description">${especie.nomeCientifico || ''}${especie.familia ? ' • ' + especie.familia : ''}</p>
      <p class="area-description">${especie.observacoes || ''}</p>
      <p class="area-description"><strong>Indicação para plantio:</strong> ${especie.indicacaoPlantio || 'Não informada'}</p>
      <div class="item-actions">
        <button type="button" data-action="editar">Editar</button>
        <button type="button" data-action="remover">Remover</button>
      </div>
    `;
    item.querySelector('[data-action="editar"]').addEventListener('click', () => iniciarEdicao(especie));
    item.querySelector('[data-action="remover"]').addEventListener('click', () => remover(especie));
    especiesList.appendChild(item);
  });
}

function iniciarEdicao(especie) {
  editingId = especie.id;
  nomePopularInput.value = especie.nomePopular || '';
  nomeCientificoInput.value = especie.nomeCientifico || '';
  familiaInput.value = especie.familia || '';
  portePadraoInput.value = especie.portePadrao || '';
  observacoesInput.value = especie.observacoes || '';
  indicacaoPlantioInput.value = especie.indicacaoPlantio || '';
  fotoUrlInput.value = especie.fotoUrl || '';
  limparLinhasFoto();
  (especie.fotos || []).forEach((f) => adicionarLinhaFoto(f.url, f.descricao));
  formTitle.textContent = 'Editar espécie';
  cancelEditBtn.classList.remove('hidden');
}

function cancelarEdicao() {
  editingId = null;
  form.reset();
  limparLinhasFoto();
  formTitle.textContent = 'Nova espécie';
  cancelEditBtn.classList.add('hidden');
}

async function remover(especie) {
  if (!confirm(`Remover a espécie ${especie.nomePopular}?`)) return;
  const res = await fetch(`${apiBase}/${especie.id}`, { method: 'DELETE' });
  if (!res.ok) {
    const erro = await res.json().catch(() => ({}));
    alert(erro.message || 'Não foi possível remover. Verifique se não há árvores usando essa espécie.');
    return;
  }
  carregar();
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  formMessage.innerHTML = '';

  const payload = {
    nomePopular: nomePopularInput.value,
    nomeCientifico: nomeCientificoInput.value || null,
    familia: familiaInput.value || null,
    portePadrao: portePadraoInput.value || null,
    observacoes: observacoesInput.value || null,
    indicacaoPlantio: indicacaoPlantioInput.value || null,
    fotoUrl: fotoUrlInput.value || null,
    fotos: coletarFotosExtras()
  };

  const url = editingId ? `${apiBase}/${editingId}` : apiBase;
  const method = editingId ? 'PUT' : 'POST';

  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const erro = await res.json().catch(() => ({}));
    formMessage.innerHTML = `<div class="login-message erro">${erro.message || 'Não foi possível salvar a espécie.'}</div>`;
    return;
  }

  cancelarEdicao();
  carregar();
});

cancelEditBtn.addEventListener('click', cancelarEdicao);

addFotoBtn.addEventListener('click', () => adicionarLinhaFoto('', ''));

carregar();
