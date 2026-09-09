const apiBase = '/api/plantios';

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

const form = document.getElementById('plantioForm');
const plantiosList = document.getElementById('plantiosList');
const formTitle = document.getElementById('formTitle');
const formMessage = document.getElementById('formMessage');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const buscaTermo = document.getElementById('buscaTermo');

let editingId = null;
let plantios = [];

const fields = ['areaId', 'especieId', 'quantidadeMudas', 'dataPlantio', 'responsavel', 'descricao', 'status'];
const inputs = {};
fields.forEach(f => { inputs[f] = document.getElementById(f); });

async function carregarSelects() {
  const [areas, especies] = await Promise.all([
    buscarTudo('/api/areas'),
    buscarTudo('/api/especies')
  ]);
  (areas ?? []).forEach(a => {
    const opt = document.createElement('option');
    opt.value = a.id;
    opt.textContent = a.nome;
    inputs.areaId.appendChild(opt);
  });
  (especies ?? []).forEach(e => {
    const opt = document.createElement('option');
    opt.value = e.id;
    opt.textContent = e.nomePopular;
    inputs.especieId.appendChild(opt);
  });
}

async function carregarPlantios() {
  const itens = await buscarTudo(apiBase);
  if (itens === null) return;
  plantios = itens;
  renderizar(plantios);
  atualizarKPIs(plantios);
}

function renderizar(plantios) {
  plantiosList.innerHTML = '';
  if (plantios.length === 0) {
    plantiosList.innerHTML = '<p class="empty-state">Nenhum plantio encontrado.</p>';
    return;
  }
  plantios.forEach(p => {
    const item = document.createElement('article');
    item.className = 'area-item';
    item.innerHTML = `
      <header>
        <h3>${p.areaNome || 'Sem área'} — ${p.especieNomePopular || 'Sem espécie'}</h3>
      </header>
      <p class="area-description">
        Mudas: <strong>${p.quantidadeMudas || 0}</strong> •
        ${p.dataPlantio ? 'Plantio: ' + new Date(p.dataPlantio).toLocaleDateString('pt-BR') : 'Sem data'}
        ${p.responsavel ? ' • Responsável: ' + p.responsavel : ''}
      </p>
      <div class="item-actions">
        <button type="button" data-action="editar">Editar</button>
        <button type="button" data-action="remover">Remover</button>
      </div>
    `;
    item.querySelector('[data-action="editar"]').addEventListener('click', () => iniciarEdicao(p));
    item.querySelector('[data-action="remover"]').addEventListener('click', () => remover(p));
    plantiosList.appendChild(item);
  });
}

function iniciarEdicao(p) {
  editingId = p.id;
  inputs.areaId.value = p.areaId || '';
  inputs.especieId.value = p.especieId || '';
  inputs.quantidadeMudas.value = p.quantidadeMudas ?? '';
  inputs.dataPlantio.value = p.dataPlantio || '';
  inputs.responsavel.value = p.responsavel || '';
  inputs.descricao.value = p.descricao || '';
  inputs.status.value = p.status || 'PLANEJADO';
  formTitle.textContent = 'Editar Plantio';
  cancelEditBtn.classList.remove('hidden');
}

function cancelarEdicao() {
  editingId = null;
  form.reset();
  inputs.status.value = 'PLANEJADO';
  formTitle.textContent = 'Novo Plantio';
  cancelEditBtn.classList.add('hidden');
}

async function remover(p) {
  const label = p.areaNome || p.id;
  if (!confirm(`Remover o plantio de "${label}"?`)) return;
  await fetch(`${apiBase}/${p.id}`, { method: 'DELETE' });
  carregarPlantios();
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  formMessage.innerHTML = '';

  const payload = {
    areaId: inputs.areaId.value ? Number(inputs.areaId.value) : null,
    especieId: inputs.especieId.value ? Number(inputs.especieId.value) : null,
    quantidadeMudas: Number(inputs.quantidadeMudas.value),
    dataPlantio: inputs.dataPlantio.value || null,
    responsavel: inputs.responsavel.value || null,
    descricao: inputs.descricao.value || null,
    status: inputs.status.value
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
    formMessage.innerHTML = `<div class="login-message erro">${erro.message || 'Não foi possível salvar o plantio.'}</div>`;
    return;
  }

  cancelarEdicao();
  carregarPlantios();
});

cancelEditBtn.addEventListener('click', cancelarEdicao);

buscaTermo.addEventListener('input', () => {
  const termo = buscaTermo.value.toLowerCase().trim();
  if (!termo) { renderizar(plantios); return; }
  const filtrados = plantios.filter(p =>
    (p.areaNome && p.areaNome.toLowerCase().includes(termo)) ||
    (p.especieNomePopular && p.especieNomePopular.toLowerCase().includes(termo)) ||
    (p.responsavel && p.responsavel.toLowerCase().includes(termo))
  );
  renderizar(filtrados);
});

function atualizarKPIs(plantios) {
  let total = plantios.length, mudas = 0, planejados = 0, execucao = 0, concluidos = 0;
  plantios.forEach(p => {
    mudas += p.quantidadeMudas || 0;
    if (p.status === 'PLANEJADO') planejados++;
    if (p.status === 'EM_EXECUCAO') execucao++;
    if (p.status === 'CONCLUIDO') concluidos++;
  });
  document.getElementById('kpiTotal').textContent = total;
  document.getElementById('kpiMudas').textContent = mudas;
  document.getElementById('kpiPlanejados').textContent = planejados;
  document.getElementById('kpiExecucao').textContent = execucao;
  document.getElementById('kpiConcluidos').textContent = concluidos;
}

carregarSelects().then(carregarPlantios);
