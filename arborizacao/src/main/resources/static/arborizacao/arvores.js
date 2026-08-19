const apiBase = '/api/arvores';

const form = document.getElementById('arvoreForm');
const nomeInput = document.getElementById('nome');
const areaIdInput = document.getElementById('areaId');
const especieIdInput = document.getElementById('especieId');
const tipoArvoreInput = document.getElementById('tipoArvore');
const porteInput = document.getElementById('porte');
const origemInput = document.getElementById('origem');
const statusInput = document.getElementById('status');
const georreferenciadaInput = document.getElementById('georreferenciada');
const latitudeInput = document.getElementById('latitude');
const longitudeInput = document.getElementById('longitude');
const dataPlantioInput = document.getElementById('dataPlantio');
const numeroProcessoInput = document.getElementById('numeroProcesso');
const fotoUrlInput = document.getElementById('fotoUrl');
const descricaoInput = document.getElementById('descricao');
const arvoresList = document.getElementById('arvoresList');
const formTitle = document.getElementById('formTitle');
const formMessage = document.getElementById('formMessage');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const buscaForm = document.getElementById('buscaForm');
const buscaTermoInput = document.getElementById('buscaTermo');
const buscaResultado = document.getElementById('buscaResultado');

let editingId = null;
let doacoesCache = [];
let arvores = [];

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

  return 'https://lh3.googleusercontent.com/d/' + encodeURIComponent(id);
}

buscaForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const termo = buscaTermoInput.value.trim();
  if (!termo) return;

  buscaResultado.innerHTML = '<p class="area-description">Buscando...</p>';

  if (/^\d+$/.test(termo)) {
    const res = await fetch(`${apiBase}/${termo}`);
    if (!res.ok) {
      buscaResultado.innerHTML = `<div class="login-message erro">Nenhuma árvore encontrada com o ID ${termo}.</div>`;
      return;
    }
    const arvore = await res.json();
    renderizarCardsEncontrados([arvore], buscaResultado);
    return;
  }

  const termoNorm = normalizarTexto(termo);
  const encontradas = arvores.filter((arvore) => normalizarTexto(arvore.nome).includes(termoNorm));
  if (!encontradas.length) {
    buscaResultado.innerHTML = `<div class="login-message erro">Nenhuma árvore encontrada com o nome "${termo}".</div>`;
    return;
  }
  renderizarCardsEncontrados(encontradas, buscaResultado);
});

function montarCardCompleto(arvore) {
  const doacoesDaArvore = doacoesCache.filter((d) => String(d.arvoreId) === String(arvore.id));

  const fotosLista = [];
  if (arvore.fotoUrl) {
    fotosLista.push({ url: arvore.fotoUrl, descricao: 'Foto principal' });
  }
  (arvore.fotos || []).forEach((f) => fotosLista.push(f));

  const fotosHtml = fotosLista.length
    ? `<ul class="detalhe-lista">${fotosLista.map((f) => `<li><a href="${obterUrlImagem(f.url)}" target="_blank" rel="noreferrer">${f.descricao || 'Abrir foto'}</a></li>`).join('')}</ul>`
    : '<p class="area-description">Nenhuma foto cadastrada.</p>';

  const doacoesHtml = doacoesDaArvore.length
    ? `<ul class="detalhe-lista">${doacoesDaArvore.map((d) => `<li>${d.solicitante || 'Doador não informado'} — ${d.dataDoacao || 'data não informada'} (${d.destinacao || 'destinação não informada'})</li>`).join('')}</ul>`
    : '<p class="area-description">Nenhuma doação vinculada.</p>';

  return `
    <header>
      <h3>#${arvore.id} — ${arvore.nome || '(sem nome)'}</h3>
      <span>${arvore.status}</span>
    </header>
    <p class="area-description">
      Área: ${arvore.areaNome || 'não vinculada'} • Espécie: ${arvore.especieNomePopular || 'não informada'}<br />
      Tipo: ${arvore.tipoArvore} • Porte: ${arvore.porte} • Origem: ${arvore.origem}<br />
      Plantio: ${arvore.dataPlantio || 'não informado'} • Processo: ${arvore.numeroProcesso || '—'}<br />
      Coordenadas: ${arvore.georreferenciada ? `${arvore.latitude}, ${arvore.longitude}` : 'não georreferenciada'}
    </p>
    <p class="area-description">${arvore.descricao || ''}</p>
    <h4>Fotos</h4>
    ${fotosHtml}
    <h4>Doações vinculadas</h4>
    ${doacoesHtml}
    <div class="item-actions">
      <button type="button" data-action="editar">Editar esta árvore</button>
    </div>
  `;
}

function renderizarCardsEncontrados(lista, container) {
  container.innerHTML = '';

  if (!lista.length) {
    container.innerHTML = '<p class="area-description">Nenhuma árvore encontrada.</p>';
    return;
  }

  lista.forEach((arvore) => {
    const item = document.createElement('article');
    item.className = 'area-item';
    item.innerHTML = montarCardCompleto(arvore);
    item.querySelector('[data-action="editar"]').addEventListener('click', () => {
      iniciarEdicao(arvore);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    container.appendChild(item);
  });
}

async function carregarSelects() {
  const [areasRes, especiesRes, doacoesRes] = await Promise.all([
    fetch('/api/areas'),
    fetch('/api/especies'),
    fetch('/api/doacoes')
  ]);
  const areas = areasRes.ok ? await areasRes.json() : [];
  const especies = especiesRes.ok ? await especiesRes.json() : [];
  doacoesCache = doacoesRes.ok ? await doacoesRes.json() : [];

  areas.forEach((area) => {
    const option = document.createElement('option');
    option.value = area.id;
    option.textContent = area.nome;
    areaIdInput.appendChild(option);
  });

  especies.forEach((especie) => {
    const option = document.createElement('option');
    option.value = especie.id;
    option.textContent = especie.nomePopular;
    especieIdInput.appendChild(option);
  });
}

async function carregarArvores() {
  const res = await fetch(apiBase);
  if (!res.ok) return;
  const data = await res.json();
  arvores = Array.isArray(data) ? data : (data.value ?? []);
  renderizar(arvores);
}

function renderizar(arvores) {
  arvoresList.innerHTML = '';

  arvores.forEach((arvore) => {
const item = document.createElement('article');
    item.className = 'area-item';
    item.innerHTML = `
      <header>
        <h3>${arvore.nome || '(sem nome)'}</h3>
        <span>${arvore.status}</span>
      </header>
      <p class="area-description">
        ${arvore.areaNome ? 'Área: ' + arvore.areaNome : 'Sem área'} •
        ${arvore.especieNomePopular ? 'Espécie: ' + arvore.especieNomePopular : 'Espécie não informada'}
      </p>
      <p class="area-description">${arvore.descricao || ''}</p>
      <div class="item-actions">
        <button type="button" data-action="editar">Editar</button>
        <button type="button" data-action="remover">Remover</button>
      </div>
    `;
    item.querySelector('[data-action="editar"]').addEventListener('click', () => iniciarEdicao(arvore));
    item.querySelector('[data-action="remover"]').addEventListener('click', () => remover(arvore));
    arvoresList.appendChild(item);
  });
}

function iniciarEdicao(arvore) {
  editingId = arvore.id;
  nomeInput.value = arvore.nome || '';
  areaIdInput.value = arvore.areaId || '';
  especieIdInput.value = arvore.especieId || '';
  tipoArvoreInput.value = arvore.tipoArvore;
  porteInput.value = arvore.porte;
  origemInput.value = arvore.origem;
  statusInput.value = arvore.status;
  georreferenciadaInput.checked = arvore.georreferenciada;
  latitudeInput.value = arvore.latitude ?? '';
  longitudeInput.value = arvore.longitude ?? '';
  dataPlantioInput.value = arvore.dataPlantio || '';
  numeroProcessoInput.value = arvore.numeroProcesso || '';
  fotoUrlInput.value = arvore.fotoUrl || '';
  descricaoInput.value = arvore.descricao || '';
  formTitle.textContent = 'Editar árvore';
  cancelEditBtn.classList.remove('hidden');
}

function cancelarEdicao() {
  editingId = null;
  form.reset();
  formTitle.textContent = 'Nova árvore';
  cancelEditBtn.classList.add('hidden');
}

async function remover(arvore) {
  if (!confirm(`Remover a árvore "${arvore.nome || arvore.id}"?`)) return;
  await fetch(`${apiBase}/${arvore.id}`, { method: 'DELETE' });
  carregarArvores();
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  formMessage.innerHTML = '';

  const payload = {
    nome: nomeInput.value || null,
    areaId: areaIdInput.value || null,
    especieId: especieIdInput.value || null,
    tipoArvore: tipoArvoreInput.value,
    porte: porteInput.value,
    origem: origemInput.value,
    status: statusInput.value,
    georreferenciada: georreferenciadaInput.checked,
    latitude: latitudeInput.value ? Number(latitudeInput.value) : null,
    longitude: longitudeInput.value ? Number(longitudeInput.value) : null,
    dataPlantio: dataPlantioInput.value || null,
    numeroProcesso: numeroProcessoInput.value || null,
    fotoUrl: obterUrlImagem(fotoUrlInput.value) || null,
    descricao: descricaoInput.value || null,
    fotos: []
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
    formMessage.innerHTML = `<div class="login-message erro">${erro.message || 'Não foi possível salvar a árvore.'}</div>`;
    return;
  }

  cancelarEdicao();
  carregarArvores();
});

cancelEditBtn.addEventListener('click', cancelarEdicao);

carregarSelects().then(carregarArvores);
