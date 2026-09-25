const apiBase = '/api/arvores';

const form = document.getElementById('arvoreForm');
const nomeInput = document.getElementById('nome');
const areaIdInput = document.getElementById('areaId');
const especieIdInput = document.getElementById('especieId');
const tipoArvoreInput = document.getElementById('tipoArvore');
const porteInput = document.getElementById('porte');
const origemInput = document.getElementById('origem');
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
const fotosContainer = document.getElementById('fotosContainer');
const addFotoBtn = document.getElementById('addFotoBtn');
const nextTreeBtn = document.getElementById('nextTreeBtn');
const nextKmlBtn = document.getElementById('nextKmlBtn');

function exibirBotaoProximaKml(mostrar) {
  if (!nextKmlBtn) return;
  nextKmlBtn.classList.toggle('hidden', !mostrar);
}

function restantesKml() {
  if (typeof obterPontosKmlRestantes !== 'function') return [];
  return obterPontosKmlRestantes();
}

// Fila KML: árvores importadas aguardando preenchimento individual
let filaKmlIds = [];

function obterFilaKml() {
  try {
    return JSON.parse(sessionStorage.getItem('kmlImportIds') || '[]');
  } catch (e) {
    return [];
  }
}

function salvarFilaKml(ids) {
  filaKmlIds = Array.isArray(ids) ? ids : [];
  if (filaKmlIds.length) {
    sessionStorage.setItem('kmlImportIds', JSON.stringify(filaKmlIds));
  } else {
    sessionStorage.removeItem('kmlImportIds');
  }
}

function arvoreCompleta(a) {
  if (!a) return false;
  const temCap = a.cap != null && a.cap !== '';
  const temFoto = !!(a.fotoUrl || (a.fotos && a.fotos.length));
  return temCap && temFoto;
}

// Fotos múltiplas por árvore (URL + descrição)
function adicionarLinhaFoto(url, descricao) {
  if (!fotosContainer) return;
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
  if (fotosContainer) fotosContainer.innerHTML = '';
}

function coletarFotosExtras() {
  const fotos = [];
  if (!fotosContainer) return fotos;
  fotosContainer.querySelectorAll('.foto-linha').forEach((linha) => {
    const url = linha.querySelector('.foto-url-input').value.trim();
    if (!url) return;
    const descricao = linha.querySelector('.foto-descricao-input').value.trim();
    fotos.push({ url, descricao: descricao || null });
  });
  return fotos;
}

if (addFotoBtn) {
  addFotoBtn.addEventListener('click', () => adicionarLinhaFoto('', ''));
}

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

// Conflitos: SEM_CONFLITO exclusivo; demais podem ser múltiplos
function obterConflitosMarcados() {
  return Array.from(document.querySelectorAll('input[name="tipoConflito"]:checked'))
    .map(c => c.value);
}
function marcarConflitos(valores) {
  const lista = Array.isArray(valores)
    ? valores
    : (valores ? String(valores).split(',').map(s => s.trim()).filter(Boolean) : []);
  const final = lista.length ? lista : ['SEM_CONFLITO'];
  document.querySelectorAll('input[name="tipoConflito"]').forEach(c => {
    c.checked = final.includes(c.value);
  });
}
function resetarConflitos() {
  document.querySelectorAll('input[name="tipoConflito"]').forEach(c => {
    c.checked = c.value === 'SEM_CONFLITO';
  });
}
document.querySelectorAll('input[name="tipoConflito"]').forEach(cb => {
  cb.addEventListener('change', () => {
    const sem = document.querySelector('input[name="tipoConflito"][value="SEM_CONFLITO"]');
    if (cb.value === 'SEM_CONFLITO' && cb.checked) {
      document.querySelectorAll('input[name="tipoConflito"]').forEach(c => {
        if (c !== sem) c.checked = false;
      });
    } else if (cb.value !== 'SEM_CONFLITO' && cb.checked && sem) {
      sem.checked = false;
    }
    const algum = obterConflitosMarcados();
    if (!algum.length && sem) sem.checked = true;
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
    gpsBtn.innerHTML = '<img class="ico" src="./img/icones/map-pin.png" alt=""> Obtendo localização...';
    gpsBtn.disabled = true;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        latitudeInput.value = pos.coords.latitude.toFixed(6);
        longitudeInput.value = pos.coords.longitude.toFixed(6);
        georreferenciadaInput.checked = true;
        gpsBtn.innerHTML = '<img class="ico" src="./img/icones/map-pin.png" alt=""> Usar minha localização';
        gpsBtn.disabled = false;
        showToast('Localização obtida com sucesso!', 'sucesso');
      },
      (err) => {
        console.error(err);
        showToast('Não foi possível obter a localização: ' + err.message, 'erro');
        gpsBtn.innerHTML = '<img class="ico" src="./img/icones/map-pin.png" alt=""> Usar minha localização';
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
let areasCache = [];
let arvores = [];
let mapaInv = null;
let popupMapaAtual = null;

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
  (arvore.fotos || []).forEach((f) => {
    if (f && f.url && f.url !== arvore.fotoUrl) fotosLista.push(f);
  });

  const fotosHtml = fotosLista.length
    ? `<ul class="detalhe-lista">${fotosLista.map((f) => `<li><a href="${obterUrlImagem(f.url)}" target="_blank" rel="noreferrer">${f.descricao || 'Abrir foto'}</a></li>`).join('')}</ul>`
    : '<p class="area-description">Nenhuma foto cadastrada.</p>';

  const doacoesHtml = doacoesDaArvore.length
    ? `<ul class="detalhe-lista">${doacoesDaArvore.map((d) => `<li>${d.solicitante || 'Solicitante não informado'} — ${d.dataDoacao || 'data não informada'} (${d.destinacao || 'destinação não informada'})</li>`).join('')}</ul>`
    : '<p class="area-description">Nenhuma doação vinculada.</p>';

  return `
    <header>
      <h3>#${arvore.id} — ${arvore.nome || '(sem nome)'}</h3>
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
  areasCache = areas ?? [];
  atualizarMapa();
}

async function carregarArvores() {
  const itens = await buscarTudo(apiBase);
  if (itens === null) return;
  arvores = itens;
  atualizarMapa();

  let importIds = obterFilaKml();
  if (!importIds.length && filaKmlIds.length) {
    importIds = filaKmlIds.slice();
  }

  if (importIds.length) {
    const importadas = arvores.filter((a) => importIds.includes(a.id));
    if (!importadas.length) {
      salvarFilaKml([]);
      exibirBotaoProxima(false);
      renderizar(arvores);
      animarEntrada(arvoresList);
      return;
    }

    filaKmlIds = importadas.map((a) => a.id);
    salvarFilaKml(filaKmlIds);

    const completas = importadas.filter(arvoreCompleta).length;
    const pendentes = importadas.length - completas;
    renderizar(importadas);

    const banner = document.createElement('div');
    banner.className = 'login-message sucesso';
    banner.style.marginBottom = '12px';
    banner.innerHTML = `
      <strong>Fila KML — ${completas}/${importadas.length} completas</strong>
      (${pendentes} pendente(s): sem CAP e/ou sem foto)<br />
      Clique em <em>Editar</em> para preencher cada uma. Ao salvar, a próxima pendente abre automaticamente.
      <span style="display:inline-flex;gap:8px;margin-top:8px;flex-wrap:wrap;">
        <button type="button" class="ghost-button" id="kmlNextBannerBtn" style="padding:4px 10px;font-size:0.75rem;">Ir para a próxima pendente</button>
        <button type="button" class="ghost-button" id="kmlShowAllBtn" style="padding:4px 10px;font-size:0.75rem;">Ver todas</button>
        <button type="button" class="ghost-button" id="kmlEndFilaBtn" style="padding:4px 10px;font-size:0.75rem;">Concluir fila</button>
      </span>
    `;
    arvoresList.insertBefore(banner, arvoresList.firstChild);

    document.getElementById('kmlNextBannerBtn')?.addEventListener('click', () => irParaProximaPendente(importadas));
    document.getElementById('kmlShowAllBtn')?.addEventListener('click', () => {
      renderizar(arvores);
      exibirBotaoProxima(false);
    });
    document.getElementById('kmlEndFilaBtn')?.addEventListener('click', () => {
      salvarFilaKml([]);
      exibirBotaoProxima(false);
      cancelarEdicao();
      carregarArvores();
      showToast('Fila KML concluída.', 'sucesso');
    });

    if (editingId == null && pendentes > 0 && !sessionStorage.getItem('kmlFilaAutoStart')) {
      sessionStorage.setItem('kmlFilaAutoStart', '1');
      irParaProximaPendente(importadas);
    } else if (pendentes === 0) {
      exibirBotaoProxima(false);
    }

    animarEntrada(arvoresList);
    return;
  }

  const pontosRestantes = restantesKml();
  if (pontosRestantes.length && !obterFilaKml().length) {
    const banner = document.createElement('div');
    banner.className = 'login-message';
    banner.style.marginBottom = '12px';
    banner.innerHTML = `
      <strong>KML:</strong> ${pontosRestantes.length} ponto(s) ainda não importados.
      <button type="button" class="ghost-button" id="kmlOpenNextBanner" style="margin-left:8px;padding:4px 10px;font-size:0.75rem;">Importar e editar a próxima</button>
      <button type="button" class="ghost-button" id="kmlDiscardRest" style="margin-left:4px;padding:4px 10px;font-size:0.75rem;">Descartar</button>
    `;
    arvoresList.insertBefore(banner, arvoresList.firstChild);
    document.getElementById('kmlOpenNextBanner')?.addEventListener('click', () => avancarProximoPontoKml());
    document.getElementById('kmlDiscardRest')?.addEventListener('click', () => {
      if (typeof limparFilaKml === 'function') limparFilaKml();
      carregarArvores();
      showToast('Pontos restantes do KML descartados.', 'sucesso');
    });
  }

  renderizar(arvores);
  animarEntrada(arvoresList);
}

function exibirBotaoProxima(mostrar) {
  if (!nextTreeBtn) return;
  nextTreeBtn.classList.toggle('hidden', !mostrar);
}

function irParaProximaPendente(lista) {
  const alvo = (lista || arvores.filter((a) => filaKmlIds.includes(a.id)))
    .filter((a) => !arvoreCompleta(a));
  if (!alvo.length) {
    showToast('Todas da fila estão completas (CAP + foto).', 'sucesso');
    exibirBotaoProxima(false);
    return;
  }
  iniciarEdicao(alvo[0]);
  exibirBotaoProxima(true);
  window.scrollTo({ top: 0, behavior: 'smooth' });
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
    const cap = arvore.cap != null && arvore.cap !== '' ? ` • CAP ${arvore.cap}` : '';
    const temFoto = arvore.fotoUrl || (arvore.fotos && arvore.fotos.length);
    const completo = arvoreCompleta(arvore);
    const emFila = filaKmlIds.includes(arvore.id);
    item.innerHTML = `
      <div class="tree-card-header">
        <span class="tree-id">${idLabel}</span>
        <span class="tree-name" title="${arvore.nome || '(sem nome)'}">${arvore.nome || '(sem nome)'}</span>
        ${emFila ? (completo ? '<span class="tree-card-tag" style="background:#1a3d2a;">✓ completa</span>' : '<span class="tree-card-tag" style="background:#4a3a1a;">… pendente</span>') : ''}
      </div>
      <div class="tree-card-info">
        <span class="tree-card-tag" title="${especie}"><img class="ico" src="./img/icones/leaf.png" alt=""> ${especie}</span>
        <span class="tree-card-tag" title="${area}"><img class="ico" src="./img/icones/map-2.png" alt=""> ${area}</span>
        <span class="tree-card-tag">${arvore.tipoArvore || ''} • ${arvore.porte || ''}${cap}</span>
        ${temFoto ? '<span class="tree-card-tag"><img class="ico" src="./img/icones/camera.png" alt=""> fotos</span>' : '<span class="tree-card-tag"><img class="ico" src="./img/icones/camera.png" alt=""> sem foto</span>'}
      </div>
      <div class="tree-card-actions">
        <button type="button" data-action="editar" class="tree-card-btn">${emFila && !completo ? 'Preencher' : 'Editar'}</button>
        <button type="button" data-action="remover" class="tree-card-btn danger">Remover</button>
      </div>
    `;
    item.querySelector('[data-action="editar"]').addEventListener('click', () => {
      iniciarEdicao(arvore);
      if (emFila) exibirBotaoProxima(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    item.querySelector('[data-action="remover"]').addEventListener('click', () => remover(arvore));
    arvoresList.appendChild(item);
  });
}

function iniciarEdicao(arvore) {
  // Reset total — formulário exclusivo desta árvore (nada vaza da anterior)
  form.reset();
  editingId = arvore.id;
  const temFila = obterFilaKml().length > 0;
  exibirBotaoProximaKml(!temFila && restantesKml().length > 0);
  nomeInput.value = arvore.nome || '';
  areaIdInput.value = arvore.areaId || '';
  especieIdInput.value = arvore.especieId || '';
  tipoArvoreInput.value = arvore.tipoArvore;
  porteInput.value = arvore.porte;
  origemInput.value = arvore.origem;
  georreferenciadaInput.checked = arvore.georreferenciada;
  latitudeInput.value = arvore.latitude ?? '';
  longitudeInput.value = arvore.longitude ?? '';
  dataPlantioInput.value = arvore.dataPlantio || '';
  numeroProcessoInput.value = arvore.numeroProcesso || '';
  fotoUrlInput.value = arvore.fotoUrl || '';
  descricaoInput.value = arvore.descricao || '';
  limparLinhasFoto();
  (arvore.fotos || []).forEach((f) => {
    if (f && f.url && f.url !== arvore.fotoUrl) adicionarLinhaFoto(f.url, f.descricao);
  });
  // Novos campos
  document.getElementById('responsavelCadastro').value = arvore.responsavelCadastro || '';
  document.getElementById('responsavelManejo').value = arvore.responsavelCadastro || '';
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
  marcarConflitos(arvore.tiposConflito || arvore.tipoConflito);
  document.getElementById('tipoManejo').value = arvore.tipoManejo || 'NENHUM';
  document.getElementById('prioridadeManejo').value = arvore.prioridadeManejo || '';
  document.querySelectorAll('input[name="tipoManejoRadio"]').forEach(r => r.checked = false);
  document.querySelectorAll('input[name="prioridadeRadio"]').forEach(r => r.checked = false);
  const tipoManejoVal = arvore.tipoManejo || 'NENHUM';
  const tipoRadio = document.querySelector(`input[name="tipoManejoRadio"][value="${tipoManejoVal}"]`);
  if (tipoRadio) tipoRadio.checked = true;
  const prioVal = arvore.prioridadeManejo || '';
  const prioRadio = prioVal
    ? document.querySelector(`input[name="prioridadeRadio"][value="${prioVal}"]`)
    : null;
  if (prioRadio) prioRadio.checked = true;
  formTitle.textContent = 'Editar árvore' + (arvore.id ? ' #' + arvore.id : '');
  cancelEditBtn.classList.remove('hidden');
  formMessage.innerHTML = '';
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
  resetarConflitos();
  limparLinhasFoto();
  formTitle.textContent = 'Nova árvore';
  cancelEditBtn.classList.add('hidden');
  exibirBotaoProxima(filaKmlIds.length > 0);
  exibirBotaoProximaKml(filaKmlIds.length === 0 && restantesKml().length > 0);
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

  const activeTab = document.querySelector('.tab-content.active');
  if (activeTab) {
    const invalid = activeTab.querySelector(':invalid');
    if (invalid) {
      invalid.reportValidity();
      return;
    }
  }

  const payload = {
    nome: nomeInput.value || null,
    areaId: areaIdInput.value || null,
    especieId: especieIdInput.value || null,
    tipoArvore: tipoArvoreInput.value,
    porte: porteInput.value,
    origem: origemInput.value,
    status: 'ATIVA',
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
    tiposConflito: obterConflitosMarcados(),
    // Manejo
    tipoManejo: document.getElementById('tipoManejo')?.value || null,
    prioridadeManejo: document.getElementById('prioridadeManejo')?.value || null,
    responsavelCadastro: document.getElementById('responsavelCadastro')?.value || document.getElementById('responsavelManejo')?.value || null,
    fotos: [
      ...(fotoUrlInput.value.trim() ? [{ url: obterUrlImagem(fotoUrlInput.value.trim()), descricao: 'Foto principal' }] : []),
      ...coletarFotosExtras()
    ]
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
  const estavaNaFila = filaKmlIds.length > 0 || obterFilaKml().length > 0;
  cancelarEdicao();
  showToast(wasEditing ? 'Árvore atualizada com sucesso!' : 'Árvore criada com sucesso!', 'sucesso');

  // 1) Fila de selecionadas (KML multi): avança para a próxima já importada
  if (estavaNaFila) {
    if (!filaKmlIds.length) {
      filaKmlIds = obterFilaKml().slice();
    }
    await carregarArvores();
    const pendentes = arvores
      .filter((a) => filaKmlIds.includes(a.id))
      .filter((a) => !arvoreCompleta(a));
    if (pendentes.length) {
      iniciarEdicao(pendentes[0]);
      exibirBotaoProxima(true);
      exibirBotaoProximaKml(false);
      showToast(`Próxima da seleção: ${pendentes[0].nome || 'ARB-' + pendentes[0].id} (${pendentes.length} restante(s))`, 'sucesso');
    } else {
      showToast('Seleção concluída — todas com CAP e foto!', 'sucesso');
      salvarFilaKml([]);
      exibirBotaoProxima(false);
      await carregarArvores();
    }
    return;
  }

  // 2) Pontos do KML ainda não importados (modo um a um)
  const pontos = restantesKml();
  if (pontos.length) {
    await avancarProximoPontoKml();
    return;
  }
  exibirBotaoProximaKml(false);
  carregarArvores();
});

async function avancarProximoPontoKml() {
  if (typeof criarProximoPontoKml !== 'function') return;
  try {
    const arvore = await criarProximoPontoKml();
    if (!arvore) {
      exibirBotaoProximaKml(false);
      await carregarArvores();
      return;
    }
    const ainda = restantesKml().length;
    showToast(
      ainda
        ? `Próxima do KML: ${arvore.nome || arvore.id} — restam ${ainda}`
        : `Última do KML: ${arvore.nome || arvore.id}`,
      'sucesso'
    );
    iniciarEdicao(arvore);
    exibirBotaoProximaKml(ainda > 0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (e) {
    showToast('Erro ao abrir próxima do KML: ' + e.message, 'error');
    exibirBotaoProximaKml(false);
  }
}

if (nextTreeBtn) {
  nextTreeBtn.addEventListener('click', () => irParaProximaPendente());
}

if (nextKmlBtn) {
  nextKmlBtn.addEventListener('click', () => avancarProximoPontoKml());
}

// URL ?editar=ID — aberto após "Importar selecionadas e editar"
async function abrirPorQueryParam() {
  const params = new URLSearchParams(window.location.search);
  const editarId = params.get('editar');
  if (!editarId) {
    const temFila = obterFilaKml().length > 0;
    exibirBotaoProximaKml(!temFila && restantesKml().length > 0);
    exibirBotaoProxima(temFila);
    return;
  }
  try {
    const res = await fetch(`${apiBase}/${editarId}`);
    if (!res.ok) throw new Error('Árvore não encontrada');
    const arvore = await res.json();
    iniciarEdicao(arvore);
    const temFila = obterFilaKml().length > 0;
    const restamFila = temFila
      ? obterFilaKml().filter((id) => id !== arvore.id).length
      : 0;
    const restamPontos = restantesKml().length;
    if (temFila) {
      exibirBotaoProxima(restamFila > 0);
      exibirBotaoProximaKml(false);
      showToast(`Editando ${restamFila + 1}ª da seleção — restam ${restamFila}`, 'sucesso');
    } else if (restamPontos) {
      exibirBotaoProximaKml(true);
      showToast(`Editando árvore do KML — restam ${restamPontos} ponto(s)`, 'sucesso');
    }
    window.history.replaceState({}, '', './arvores.html');
  } catch (e) {
    showToast('Não foi possível abrir a árvore para edição.', 'error');
  }
}

cancelEditBtn.addEventListener('click', cancelarEdicao);

// KML modal: DAP automático a partir do CAP
document.addEventListener('input', (e) => {
  if (e.target && e.target.id === 'kmlCap') {
    const cap = parseFloat(e.target.value);
    const dapInput = document.getElementById('kmlDap');
    if (dapInput) dapInput.value = cap && cap > 0 ? (cap / Math.PI).toFixed(2) : '';
  }
});

// KML modal: SEM_CONFLITO exclusivo
document.addEventListener('change', (e) => {
  if (!e.target || e.target.name !== 'kmlTipoConflito') return;
  const sem = document.querySelector('input[name="kmlTipoConflito"][value="SEM_CONFLITO"]');
  if (e.target.value === 'SEM_CONFLITO' && e.target.checked) {
    document.querySelectorAll('input[name="kmlTipoConflito"]').forEach(c => {
      if (c !== sem) c.checked = false;
    });
  } else if (e.target.value !== 'SEM_CONFLITO' && e.target.checked && sem) {
    sem.checked = false;
  }
  const algum = Array.from(document.querySelectorAll('input[name="kmlTipoConflito"]:checked'));
  if (!algum.length && sem) sem.checked = true;
});

function emptyFCInv() {
  return { type: 'FeatureCollection', features: [] };
}

function areasParaFeatures(areas) {
  const features = [];
  (areas || []).forEach((area) => {
    if (area.pontos && area.pontos.length > 0) {
      if (area.pontos.length === 1) {
        features.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [area.pontos[0].longitude, area.pontos[0].latitude] },
          properties: { id: area.id, nome: area.nome, tipo: area.tipo, status: area.status }
        });
      } else {
        const coords = area.pontos.map((p) => [p.longitude, p.latitude]);
        if (coords.length > 2) coords.push(coords[0]);
        features.push({
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: [coords] },
          properties: { id: area.id, nome: area.nome, tipo: area.tipo, status: area.status }
        });
      }
    } else if (area.latitude && area.longitude) {
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [area.longitude, area.latitude] },
        properties: { id: area.id, nome: area.nome, tipo: area.tipo, status: area.status }
      });
    }
  });
  return { type: 'FeatureCollection', features };
}

function arvoresParaFeatures(lista) {
  const features = [];
  (lista || []).forEach((a) => {
    if (a.latitude && a.longitude) {
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [a.longitude, a.latitude] },
        properties: {
          id: a.id,
          nome: a.nome || 'Árvore #' + a.id,
          especie: a.especieNomePopular || 'Não informada',
          porte: a.porte || ''
        }
      });
    }
  });
  return { type: 'FeatureCollection', features };
}

function atualizarMapa() {
  if (!mapaInv) return;
  const srcArv = mapaInv.getSource('arvores');
  const srcArea = mapaInv.getSource('areas');
  if (!srcArv || !srcArea) return;
  srcArv.setData(arvoresParaFeatures(arvores));
  srcArea.setData(areasParaFeatures(areasCache));
}

function fecharPopupMapa() {
  if (!popupMapaAtual) return;
  try { popupMapaAtual.remove(); } catch (e) {}
  popupMapaAtual = null;
}

function editarDoMapa(id) {
  fecharPopupMapa();
  fetch(`${apiBase}/${id}`)
    .then((r) => (r.ok ? r.json() : null))
    .then((a) => {
      if (!a) return;
      iniciarEdicao(a);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    })
    .catch(() => {});
}

function initMapaInventario() {
  if (typeof maplibregl === 'undefined' || mapaInv) return;
  const el = document.getElementById('mapInv');
  if (!el) return;

  mapaInv = new maplibregl.Map({
    container: 'mapInv',
    style: {
      version: 8,
      sources: {
        osm: {
          type: 'raster',
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '&copy; OpenStreetMap contributors'
        }
      },
      layers: [{ id: 'osm', type: 'raster', source: 'osm' }]
    },
    center: [-35.291, -8.119],
    zoom: 13
  });

  mapaInv.addControl(new maplibregl.NavigationControl(), 'top-right');

  mapaInv.on('load', () => {
    mapaInv.addSource('arvores', {
      type: 'geojson',
      data: emptyFCInv(),
      cluster: true,
      clusterMaxZoom: 16,
      clusterRadius: 50
    });
    mapaInv.addSource('areas', { type: 'geojson', data: emptyFCInv() });

    mapaInv.addLayer({
      id: 'inv-areas-fill',
      type: 'fill',
      source: 'areas',
      paint: { 'fill-color': 'rgba(69, 176, 109, 0.2)', 'fill-outline-color': 'rgba(69, 176, 109, 0.6)' }
    });
    mapaInv.addLayer({
      id: 'inv-areas-border',
      type: 'line',
      source: 'areas',
      paint: { 'line-color': 'rgba(69, 176, 109, 0.6)', 'line-width': 2 }
    });
    mapaInv.addLayer({
      id: 'inv-clusters',
      type: 'circle',
      source: 'arvores',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step', ['get', 'point_count'],
          'rgba(69, 176, 109, 0.6)', 10, 'rgba(69, 176, 109, 0.7)',
          30, 'rgba(47, 158, 91, 0.8)', 60, 'rgba(26, 122, 62, 0.9)'
        ],
        'circle-radius': ['step', ['get', 'point_count'], 16, 10, 22, 30, 28, 60, 34],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff'
      }
    });
    mapaInv.addLayer({
      id: 'inv-unclustered',
      type: 'circle',
      source: 'arvores',
      filter: ['!', ['has', 'point_count']],
      paint: { 'circle-color': '#49a970', 'circle-radius': 7, 'circle-stroke-width': 2, 'circle-stroke-color': '#fff' }
    });

    atualizarMapa();

    mapaInv.on('click', 'inv-areas-fill', (e) => {
      if (!e.features || !e.features.length) return;
      const p = e.features[0].properties;
      fecharPopupMapa();
      popupMapaAtual = new maplibregl.Popup()
        .setLngLat(e.lngLat)
        .setHTML('<strong>' + p.nome + '</strong><br/>Tipo: ' + (p.tipo || '—') + '<br/>Status: ' + (p.status || '—'))
        .addTo(mapaInv);
    });

    mapaInv.on('click', 'inv-unclustered', (e) => {
      if (!e.features || !e.features.length) return;
      const p = e.features[0].properties;
      fecharPopupMapa();
      popupMapaAtual = new maplibregl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(
          '<strong>' + p.nome + '</strong><br/>' + p.especie +
          (p.porte ? '<br/>Porte: ' + p.porte : '') +
          '<br/><button onclick="editarDoMapa(' + p.id + ')" style="margin-top:8px;padding:5px 12px;border:none;border-radius:6px;background:#49a970;color:#fff;cursor:pointer;font-weight:600;">Editar</button>'
        )
        .addTo(mapaInv);
    });

    mapaInv.on('click', 'inv-clusters', (e) => {
      const features = mapaInv.queryRenderedFeatures(e.point, { layers: ['inv-clusters'] });
      if (!features || !features.length) return;
      const clusterId = features[0].properties.cluster_id;
      mapaInv.getSource('arvores').getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err) return;
        mapaInv.easeTo({ center: features[0].geometry.coordinates, zoom });
      });
    });

    ['inv-clusters', 'inv-unclustered', 'inv-areas-fill'].forEach((layer) => {
      mapaInv.on('mouseenter', layer, () => { mapaInv.getCanvas().style.cursor = 'pointer'; });
      mapaInv.on('mouseleave', layer, () => { mapaInv.getCanvas().style.cursor = ''; });
    });

    document.getElementById('mapaCbArvores')?.addEventListener('change', (e) => {
      const vis = e.target.checked ? 'visible' : 'none';
      mapaInv.setLayoutProperty('inv-clusters', 'visibility', vis);
      mapaInv.setLayoutProperty('inv-unclustered', 'visibility', vis);
    });

    document.getElementById('mapaCbAreas')?.addEventListener('change', (e) => {
      const vis = e.target.checked ? 'visible' : 'none';
      mapaInv.setLayoutProperty('inv-areas-fill', 'visibility', vis);
      mapaInv.setLayoutProperty('inv-areas-border', 'visibility', vis);
    });
  });
}

carregarSelects().then(carregarArvores).then(abrirPorQueryParam).then(initMapaInventario);
