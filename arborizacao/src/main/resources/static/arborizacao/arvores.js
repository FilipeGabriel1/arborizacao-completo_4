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

// Tab navigation
const tabsNav = document.getElementById('tabsNav');
if (tabsNav) {
  tabsNav.addEventListener('click', (e) => {
    const btn = e.target.closest('.tab-btn');
    if (!btn) return;
    const tabId = btn.dataset.tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + tabId).classList.add('active');
  });
}

// Manejo radio buttons sync with hidden inputs
document.querySelectorAll('input[name="tipoManejoRadio"]').forEach(radio => {
  radio.addEventListener('change', () => {
    document.getElementById('tipoManejo').value = radio.value;
  });
});
document.querySelectorAll('input[name="prioridadeRadio"]').forEach(radio => {
  radio.addEventListener('change', () => {
    document.getElementById('prioridadeManejo').value = radio.value;
  });
});

// GPS button
const gpsBtn = document.getElementById('gpsBtn');
if (gpsBtn) {
  gpsBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
      showToast('Geolocalização não suportada pelo navegador.', 'erro');
      return;
    }
    gpsBtn.textContent = '📍 Obtendo localização...';
    gpsBtn.disabled = true;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        latitudeInput.value = pos.coords.latitude.toFixed(6);
        longitudeInput.value = pos.coords.longitude.toFixed(6);
        georreferenciadaInput.checked = true;
        gpsBtn.textContent = '📍 Usar minha localização';
        gpsBtn.disabled = false;
        showToast('Localização obtida com sucesso!', 'sucesso');
      },
      (err) => {
        console.error(err);
        showToast('Não foi possível obter a localização: ' + err.message, 'erro');
        gpsBtn.textContent = '📍 Usar minha localização';
        gpsBtn.disabled = false;
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

// Auto-calculate DAP from CAP
const capInput = document.getElementById('cap');
const dapInput = document.getElementById('dap');
if (capInput && dapInput) {
  capInput.addEventListener('input', () => {
    const cap = parseFloat(capInput.value);
    if (cap && cap > 0) {
      dapInput.value = (cap / Math.PI).toFixed(2);
    } else {
      dapInput.value = '';
    }
  });
}

// Geolocation button
const geoBtn = document.querySelector('#tab-localizacao .hint-box');
if (geoBtn) {
  geoBtn.style.cursor = 'pointer';
  geoBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
      alert('Geolocalização não suportada pelo navegador.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        latitudeInput.value = pos.coords.latitude.toFixed(6);
        longitudeInput.value = pos.coords.longitude.toFixed(6);
        georreferenciadaInput.checked = true;
      },
      () => alert('Não foi possível obter a localização.')
    );
  });
}

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

  return 'https://lh3.googleusercontent.com/d/' + encodeURIComponent(id) + '=w2000';
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

async function carregarSelects() {
  const [areas, especies, doacoes] = await Promise.all([
    buscarTudo('/api/areas'),
    buscarTudo('/api/especies'),
    buscarTudo('/api/doacoes')
  ]);

  (areas ?? []).forEach((area) => {
    const option = document.createElement('option');
    option.value = area.id;
    option.textContent = area.nome;
    areaIdInput.appendChild(option);
  });

  (especies ?? []).forEach((especie) => {
    const option = document.createElement('option');
    option.value = especie.id;
    option.textContent = especie.nomeCientifico ? `${especie.nomePopular} (${especie.nomeCientifico})` : especie.nomePopular;
    especieIdInput.appendChild(option);
  });

  doacoesCache = doacoes ?? [];
}

async function carregarArvores() {
  const itens = await buscarTudo(apiBase);
  if (itens === null) return;
  arvores = itens;
  renderizar(arvores);
  animarEntrada(arvoresList);
}

function renderizar(arvores) {
  arvoresList.innerHTML = '';

  if (arvores.length === 0) {
    arvoresList.innerHTML = '<p style="text-align:center;color:var(--muted);padding:20px;">Nenhuma árvore encontrada.</p>';
    return;
  }

  arvores.forEach((arvore) => {
    const item = document.createElement('article');
    item.className = 'tree-card';
    const idLabel = 'ARB-' + String(arvore.id).padStart(6, '0');
    const especie = arvore.especieNomePopular || 'Não informada';
    const area = arvore.areaNome || 'Sem área';
    item.innerHTML = `
      <div class="tree-card-header">
        <span class="tree-id">${idLabel}</span>
        <span class="tree-name" title="${arvore.nome || '(sem nome)'}">${arvore.nome || '(sem nome)'}</span>
      </div>
      <div class="tree-card-info">
        <span class="tree-card-tag" title="${especie}">🍃 ${especie}</span>
        <span class="tree-card-tag" title="${area}">🏞️ ${area}</span>
        <span class="tree-card-tag">${arvore.tipoArvore || ''} • ${arvore.porte || ''}</span>
      </div>
      <div class="tree-card-actions">
        <button type="button" data-action="editar" class="tree-card-btn">Editar</button>
        <button type="button" data-action="remover" class="tree-card-btn danger">Remover</button>
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
  // Novos campos
  document.getElementById('responsavelCadastro').value = arvore.responsavelCadastro || '';
  document.getElementById('cap').value = arvore.cap ?? '';
  document.getElementById('dap').value = arvore.dap ?? '';
  document.getElementById('alturaTotal').value = arvore.alturaTotal ?? '';
  document.getElementById('alturaPrimeiraBifurcacao').value = arvore.alturaPrimeiraBifurcacao ?? '';
  document.getElementById('diametroCopa').value = arvore.diametroCopa ?? '';
  document.getElementById('condicaoFitossanitaria').value = arvore.condicaoFitossanitaria || '';
  document.getElementById('pragas').value = arvore.pragas || '';
  document.getElementById('doencas').value = arvore.doencas || '';
  document.getElementById('cavidades').value = arvore.cavidades || '';
  document.getElementById('fungos').value = arvore.fungos || '';
  document.getElementById('galhosSecos').value = arvore.galhosSecos || '';
  document.getElementById('inclinacao').value = arvore.inclinacao || '';
  document.getElementById('danosTronco').value = arvore.danosTronco || '';
  document.getElementById('raizesExpostas').value = arvore.raizesExpostas || '';
  document.getElementById('sinaisApodrecimento').value = arvore.sinaisApodrecimento || '';
  document.getElementById('tipoConflito').value = arvore.tipoConflito || 'SEM_CONFLITO';
  document.getElementById('tipoManejo').value = arvore.tipoManejo || 'NENHUM';
  document.getElementById('prioridadeManejo').value = arvore.prioridadeManejo || '';
  // Sync radio buttons
  const tipoManejoVal = arvore.tipoManejo || 'NENHUM';
  const tipoRadio = document.querySelector(`input[name="tipoManejoRadio"][value="${tipoManejoVal}"]`);
  if (tipoRadio) tipoRadio.checked = true;
  const prioVal = arvore.prioridadeManejo || '';
  const prioRadio = document.querySelector(`input[name="prioridadeRadio"][value="${prioVal}"]`);
  if (prioRadio) prioRadio.checked = true;
  formTitle.textContent = 'Editar árvore';
  cancelEditBtn.classList.remove('hidden');
  // Ativar aba de identificação
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelector('.tab-btn[data-tab="identificacao"]').classList.add('active');
  document.getElementById('tab-identificacao').classList.add('active');
}

function cancelarEdicao() {
  editingId = null;
  form.reset();
  document.getElementById('tipoManejo').value = 'NENHUM';
  document.getElementById('prioridadeManejo').value = '';
  document.querySelectorAll('input[name="tipoManejoRadio"]').forEach(r => r.checked = false);
  document.querySelector('input[name="tipoManejoRadio"][value="NENHUM"]').checked = true;
  document.querySelectorAll('input[name="prioridadeRadio"]').forEach(r => r.checked = false);
  formTitle.textContent = 'Nova árvore';
  cancelEditBtn.classList.add('hidden');
}

async function remover(arvore) {
  if (!confirm(`Remover a árvore "${arvore.nome || arvore.id}"?`)) return;
  await fetch(`${apiBase}/${arvore.id}`, { method: 'DELETE' });
  showToast('Árvore removida com sucesso!', 'sucesso');
  carregarArvores();
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  formMessage.innerHTML = '';

  if (!form.reportValidity()) return;

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
    // Dados dendrométricos
    cap: parseFloat(document.getElementById('cap')?.value) || null,
    dap: parseFloat(document.getElementById('dap')?.value) || null,
    alturaTotal: parseFloat(document.getElementById('alturaTotal')?.value) || null,
    alturaPrimeiraBifurcacao: parseFloat(document.getElementById('alturaPrimeiraBifurcacao')?.value) || null,
    diametroCopa: parseFloat(document.getElementById('diametroCopa')?.value) || null,
    // Condição fitossanitária
    condicaoFitossanitaria: document.getElementById('condicaoFitossanitaria')?.value || null,
    pragas: document.getElementById('pragas')?.value || null,
    doencas: document.getElementById('doencas')?.value || null,
    cavidades: document.getElementById('cavidades')?.value || null,
    fungos: document.getElementById('fungos')?.value || null,
    galhosSecos: document.getElementById('galhosSecos')?.value || null,
    inclinacao: document.getElementById('inclinacao')?.value || null,
    danosTronco: document.getElementById('danosTronco')?.value || null,
    raizesExpostas: document.getElementById('raizesExpostas')?.value || null,
    sinaisApodrecimento: document.getElementById('sinaisApodrecimento')?.value || null,
    // Conflitos
    tipoConflito: document.getElementById('tipoConflito')?.value || null,
    // Manejo
    tipoManejo: document.getElementById('tipoManejo')?.value || null,
    prioridadeManejo: document.getElementById('prioridadeManejo')?.value || null,
    responsavelCadastro: document.getElementById('responsavelCadastro')?.value || null,
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

  const wasEditing = editingId !== null;
  cancelarEdicao();
  showToast(wasEditing ? 'Árvore atualizada com sucesso!' : 'Árvore criada com sucesso!', 'sucesso');
  carregarArvores();
});

cancelEditBtn.addEventListener('click', cancelarEdicao);

carregarSelects().then(carregarArvores);
