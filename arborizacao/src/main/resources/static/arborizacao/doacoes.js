const apiBase = '/api/doacoes';

const form = document.getElementById('doacaoForm');
const arvoreIdInput = document.getElementById('arvoreId');
const solicitanteInput = document.getElementById('solicitante');
const dataDoacaoInput = document.getElementById('dataDoacao');
const destinacaoInput = document.getElementById('destinacao');
const descricaoInput = document.getElementById('descricao');
const doacoesList = document.getElementById('doacoesList');
const formTitle = document.getElementById('formTitle');
const formMessage = document.getElementById('formMessage');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const buscaForm = document.getElementById('buscaForm');
const buscaTermoInput = document.getElementById('buscaTermo');
const buscaResultado = document.getElementById('buscaResultado');

let editingId = null;
let doacoes = [];

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
      buscaResultado.innerHTML = `<div class="login-message erro">Nenhuma doação encontrada com o ID ${termo}.</div>`;
      return;
    }
    const doacao = await res.json();
    renderizarCardsEncontrados([doacao], buscaResultado);
    return;
  }

  const termoNorm = normalizarTexto(termo);
  const encontradas = doacoes.filter((doacao) => normalizarTexto(doacao.solicitante).includes(termoNorm));
  if (!encontradas.length) {
    buscaResultado.innerHTML = `<div class="login-message erro">Nenhuma doação encontrada com o nome "${termo}".</div>`;
    return;
  }
  renderizarCardsEncontrados(encontradas, buscaResultado);
});

function renderizarCardsEncontrados(lista, container) {
  container.innerHTML = '';

  if (!lista.length) {
    container.innerHTML = '<p class="area-description">Nenhuma doação encontrada.</p>';
    return;
  }

  lista.forEach((doacao) => {
    const item = document.createElement('article');
    item.className = 'area-item';
    item.innerHTML = `
      <header>
        <h3>#${doacao.id} — ${doacao.solicitante || 'Doador não informado'}</h3>
        <span>${doacao.dataDoacao || ''}</span>
      </header>
      <p class="area-description">
        Árvore: ${doacao.arvoreNome || '#' + doacao.arvoreId} • Destinação: ${doacao.destinacao || 'não informada'}
      </p>
      <p class="area-description">${doacao.descricao || ''}</p>
      <div class="item-actions">
        <button type="button" data-action="editar">Editar esta doação</button>
      </div>
    `;
    item.querySelector('[data-action="editar"]').addEventListener('click', () => {
      iniciarEdicao(doacao);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    container.appendChild(item);
  });
}

async function carregarArvoresSelect() {
  const res = await fetch('/api/arvores');
  if (!res.ok) return;
  const arvores = await res.json();
  arvores.forEach((arvore) => {
    const option = document.createElement('option');
    option.value = arvore.id;
    option.textContent = arvore.nome || `Árvore #${arvore.id}`;
    arvoreIdInput.appendChild(option);
  });
}

async function carregarDoacoes() {
  const res = await fetch(apiBase);
  if (!res.ok) return;
  const data = await res.json();
  doacoes = Array.isArray(data) ? data : (data.value ?? []);
  renderizar(doacoes);
}

function renderizar(doacoes) {
  doacoesList.innerHTML = '';

  doacoes.forEach((doacao) => {
    const item = document.createElement('article');
    item.className = 'area-item';
    item.innerHTML = `
      <header>
        <h3>${doacao.solicitante || 'Doador não informado'}</h3>
        <span>${doacao.dataDoacao || ''}</span>
      </header>
      <p class="area-description">
        Árvore: ${doacao.arvoreNome || '#' + doacao.arvoreId} •
        Destinação: ${doacao.destinacao || 'não informada'}
      </p>
      <p class="area-description">${doacao.descricao || ''}</p>
      <div class="item-actions">
        <button type="button" data-action="editar">Editar</button>
        <button type="button" data-action="remover">Remover</button>
      </div>
    `;
    item.querySelector('[data-action="editar"]').addEventListener('click', () => iniciarEdicao(doacao));
    item.querySelector('[data-action="remover"]').addEventListener('click', () => remover(doacao));
    doacoesList.appendChild(item);
  });
}

function iniciarEdicao(doacao) {
  editingId = doacao.id;
  arvoreIdInput.value = doacao.arvoreId;
  solicitanteInput.value = doacao.solicitante || '';
  dataDoacaoInput.value = doacao.dataDoacao || '';
  destinacaoInput.value = doacao.destinacao || '';
  descricaoInput.value = doacao.descricao || '';
  formTitle.textContent = 'Editar doação';
  cancelEditBtn.classList.remove('hidden');
}

function cancelarEdicao() {
  editingId = null;
  form.reset();
  formTitle.textContent = 'Nova doação';
  cancelEditBtn.classList.add('hidden');
}

async function remover(doacao) {
  if (!confirm('Remover este registro de doação?')) return;
  await fetch(`${apiBase}/${doacao.id}`, { method: 'DELETE' });
  carregarDoacoes();
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  formMessage.innerHTML = '';

  const payload = {
    arvoreId: arvoreIdInput.value,
    solicitante: solicitanteInput.value || null,
    dataDoacao: dataDoacaoInput.value || null,
    destinacao: destinacaoInput.value || null,
    descricao: descricaoInput.value || null
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
    formMessage.innerHTML = `<div class="login-message erro">${erro.message || 'Não foi possível salvar a doação.'}</div>`;
    return;
  }

  cancelarEdicao();
  carregarDoacoes();
});

cancelEditBtn.addEventListener('click', cancelarEdicao);

carregarArvoresSelect().then(carregarDoacoes);
